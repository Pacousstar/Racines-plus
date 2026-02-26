import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/neo4j';

// Client service_role pour bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Helper : uploader la photo via service_role
async function uploadPhoto(userId: string, photoFile: File): Promise<string | null> {
    try {
        const arrayBuffer = await photoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const path = `${userId}.jpg`;

        const { error } = await supabaseAdmin.storage
            .from('avatars')
            .upload(path, buffer, { upsert: true, contentType: 'image/jpeg' });

        if (error) {
            console.warn('[register] Photo upload error:', error.message);
            return null;
        }

        const { data } = supabaseAdmin.storage.from('avatars').getPublicUrl(path);
        return data.publicUrl;
    } catch (e) {
        console.warn('[register] Photo upload exception:', e);
        return null;
    }
}

// Helper : upsert profil via service_role
async function upsertProfile(userId: string, data: Record<string, unknown>) {
    const { error } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        ...data,
        updated_at: new Date().toISOString(),
    });
    if (error) console.error('[register] Profile upsert error:', error);
    return error;
}

// Helper : email de bienvenue
async function sendWelcomeEmail(email: string, firstName: string, lastName: string, village: string) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://racines-plus.vercel.app';
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'noreply@resend.dev',
                to: email,
                subject: `Bienvenue dans Racines+, ${firstName} !`,
                html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
                    <h1 style="color:#FF6600;">Bienvenue dans Racines+ 🌳</h1>
                    <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
                    <p>Votre inscription au village de <strong>${village}</strong> a été enregistrée.</p>
                    <p>En attente de validation par le CHO de votre village.</p>
                    <a href="${siteUrl}/dashboard" style="display:inline-block;background:#FF6600;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
                        Accéder à mon tableau de bord →
                    </a>
                    <p style="color:#999;font-size:12px;">Données chiffrées • Souveraineté africaine • Racines+ MVP</p>
                </div>`,
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            console.warn('[register] Email bienvenue Resend error:', JSON.stringify(err));
        }
    } catch (e) {
        console.warn('[register] Email bienvenue exception:', e);
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const email = (formData.get('email') as string || '').trim().toLowerCase();
        const password = formData.get('password') as string;
        const firstName = (formData.get('firstName') as string || '').trim();
        const lastName = (formData.get('lastName') as string || '').trim();
        const birthDate = formData.get('birthDate') as string | null;
        const gender = formData.get('gender') as string;
        const villageOrigin = (formData.get('villageOrigin') as string) || 'Toa-Zéo';
        const quartierNom = formData.get('quartierNom') as string | null;
        const residenceCountry = (formData.get('residenceCountry') as string) || 'CI';
        const photoFile = formData.get('photo') as File | null;

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json({ error: 'Prénom, nom, email et mot de passe obligatoires.' }, { status: 400 });
        }

        let userId: string;
        let isNewUser = true;

        // ── 1. Tenter de créer le compte ──────────────────────────────────────
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (authError) {
            // ── 1b. L'email existe déjà → récupérer l'utilisateur existant ─────
            if (
                authError.message.toLowerCase().includes('already registered') ||
                authError.message.toLowerCase().includes('already been registered') ||
                authError.message.toLowerCase().includes('already exists') ||
                authError.code === 'email_exists'
            ) {
                // Chercher l'utilisateur existant par email
                const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
                if (listErr || !listData) {
                    return NextResponse.json({ error: 'Impossible de récupérer le compte existant.' }, { status: 500 });
                }
                const existingUser = listData.users.find(u => u.email?.toLowerCase() === email);
                if (!existingUser) {
                    return NextResponse.json({ error: 'Email déjà utilisé mais compte introuvable. Essayez de vous connecter.' }, { status: 409 });
                }

                // Mettre à jour le mot de passe si différent (l'utilisateur veut recommencer)
                await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                    password,
                    email_confirm: true,
                });

                userId = existingUser.id;
                isNewUser = false;
            } else {
                return NextResponse.json({ error: authError.message }, { status: 400 });
            }
        } else {
            userId = authData.user.id;
        }

        // ── 2. Upload photo ────────────────────────────────────────────────────
        let avatarUrl: string | null = null;
        if (photoFile && photoFile.size > 0) {
            avatarUrl = await uploadPhoto(userId, photoFile);
        }

        // ── 3. Upsert profil (toujours, même si user existait) ────────────────
        const profilePayload: Record<string, unknown> = {
            first_name: firstName,
            last_name: lastName,
            birth_date: birthDate || null,
            gender: gender || null,
            village_origin: villageOrigin,
            quartier_nom: quartierNom || null,
            residence_country: residenceCountry,
            is_founder: true,
            // Ne pas écraser le rôle si l'user existait et avait déjà un rôle
            ...(isNewUser && { role: 'user', status: 'pending' }),
        };
        if (avatarUrl) profilePayload.avatar_url = avatarUrl;

        await upsertProfile(userId, profilePayload);

        // ── 4. Neo4j : Création du noeud utilisateur et ses parents ───────────
        try {
            const session = await getSession();

            // User
            await session.run(
                `MERGE (u:Person {id: $userId})
                 ON CREATE SET u.firstName = $firstName, u.lastName = $lastName, u.village = $village, u.isFounder = true`,
                { userId, firstName, lastName, village: villageOrigin }
            );

            // Père
            const fFirst = formData.get('fatherFirstName') as string;
            const fLast = formData.get('fatherLastName') as string;
            if (fFirst || fLast) {
                const fStatus = formData.get('fatherStatus') as string;
                const isVictim = fStatus === 'Victime crise 2010';
                // Déterminer le statut textuel propre au genre masculin
                const statusStr = (fStatus === 'Décédé' || fStatus === 'Victime crise 2010') ? 'Décédé' : 'Vivant';
                const fBirth = formData.get('fatherBirthDate') as string;
                const fId = crypto.randomUUID();

                await session.run(
                    `MATCH (u:Person {id: $userId})
                     CREATE (f:Person {
                        id: $fId,
                        firstName: $first,
                        lastName: $last,
                        birthYear: $birth,
                        status: $status,
                        isVictim: $victim,
                        addedBy: $userId
                     })
                     CREATE (f)-[:FATHER_OF]->(u)`,
                    { userId, fId, first: fFirst, last: fLast, birth: fBirth || null, status: statusStr, victim: isVictim }
                );
            }

            // Mère
            const mFirst = formData.get('motherFirstName') as string;
            const mLast = formData.get('motherLastName') as string;
            if (mFirst || mLast) {
                const mStatus = formData.get('motherStatus') as string;
                const isVictim = mStatus === 'Victime crise 2010';
                // Déterminer le statut textuel propre au genre féminin
                const statusStr = (mStatus === 'Décédée' || mStatus === 'Victime crise 2010') ? 'Décédée' : 'Vivante';
                const mBirth = formData.get('motherBirthDate') as string;
                const mId = crypto.randomUUID();

                await session.run(
                    `MATCH (u:Person {id: $userId})
                     CREATE (m:Person {
                        id: $mId,
                        firstName: $first,
                        lastName: $last,
                        birthYear: $birth,
                        status: $status,
                        isVictim: $victim,
                        addedBy: $userId
                     })
                     CREATE (m)-[:MOTHER_OF]->(u)`,
                    { userId, mId, first: mFirst, last: mLast, birth: mBirth || null, status: statusStr, victim: isVictim }
                );
            }
            await session.close();
        } catch (neoErr) {
            console.error('[register] Neo4j error:', neoErr);
        }

        // ── 5. Email de bienvenue (seulement pour les nouveaux) ───────────────
        if (isNewUser) {
            await sendWelcomeEmail(email, firstName, lastName, villageOrigin);
        }

        return NextResponse.json({
            success: true,
            userId,
            isNewUser,
            message: isNewUser
                ? `Compte créé avec succès — bienvenue ${firstName} !`
                : `Profil mis à jour pour ${firstName} ${lastName}.`,
        });

    } catch (err: unknown) {
        console.error('[register] Unexpected error:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur inattendue' }, { status: 500 });
    }
}
