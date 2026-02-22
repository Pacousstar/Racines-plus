import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client avec service_role pour bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const birthDate = formData.get('birthDate') as string | null;
        const gender = formData.get('gender') as string;
        const villageOrigin = formData.get('villageOrigin') as string;
        const quartierNom = formData.get('quartierNom') as string | null;
        const residenceCountry = formData.get('residenceCountry') as string;
        const photoFile = formData.get('photo') as File | null;

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { error: 'Champs obligatoires manquants (email, mot de passe, prénom, nom)' },
                { status: 400 }
            );
        }

        // 1. Créer l'utilisateur dans auth.users (via admin API)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Confirmer automatiquement l'email (pas besoin de cliquer un lien)
        });

        if (authError) {
            // Utilisateur déjà existant ?
            if (authError.message.includes('already registered')) {
                return NextResponse.json({ error: 'Cet email est déjà utilisé. Essayez de vous connecter.' }, { status: 409 });
            }
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const userId = authData.user.id;
        let avatarUrl: string | null = null;

        // 2. Upload photo si présente
        if (photoFile && photoFile.size > 0) {
            const arrayBuffer = await photoFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const ext = 'jpg';
            const path = `${userId}.${ext}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from('avatars')
                .upload(path, buffer, {
                    upsert: true,
                    contentType: 'image/jpeg',
                });

            if (!uploadError) {
                const { data: urlData } = supabaseAdmin.storage
                    .from('avatars')
                    .getPublicUrl(path);
                avatarUrl = urlData.publicUrl;
            } else {
                console.warn('[register] Upload photo failed:', uploadError.message);
            }
        }

        // 3. Créer/mettre à jour le profil (bypass RLS via service_role)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                first_name: firstName,
                last_name: lastName,
                birth_date: birthDate || null,
                gender: gender || null,
                village_origin: villageOrigin || 'Toa-Zéo',
                quartier_nom: quartierNom || null,
                residence_country: residenceCountry || 'CI',
                is_founder: true,
                role: 'user',
                status: 'pending',
                ...(avatarUrl && { avatar_url: avatarUrl }),
                updated_at: new Date().toISOString(),
            });

        if (profileError) {
            console.error('[register] Profile upsert error:', profileError);
            // On ne bloque pas — l'utilisateur est créé, le profil sera mis à jour plus tard
        }

        // 4. Envoyer un email de bienvenue via Resend (si configuré)
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            try {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: process.env.EMAIL_FROM || 'noreply@resend.dev',
                        to: email,
                        subject: `Bienvenue dans Racines+, ${firstName} !`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                                <h1 style="color: #FF6600;">Bienvenue dans Racines+ 🌳</h1>
                                <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
                                <p>Votre inscription au village de <strong>${villageOrigin || 'Toa-Zéo'}</strong> a bien été enregistrée.</p>
                                <p>Votre profil est actuellement en attente de validation par le Chief Heritage Officer (CHO) de votre village.</p>
                                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://racines-plus.vercel.app'}/dashboard"
                                   style="display:inline-block; background:#FF6600; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; margin:16px 0;">
                                    Accéder à mon tableau de bord →
                                </a>
                                <p style="color: #999; font-size: 12px;">Données chiffrées • Souveraineté africaine • Racines+ MVP</p>
                            </div>
                        `,
                    }),
                });
            } catch (emailErr) {
                console.warn('[register] Email de bienvenue non envoyé:', emailErr);
            }
        }

        return NextResponse.json({
            success: true,
            userId,
            message: `Compte créé avec succès pour ${firstName} ${lastName}`,
        });

    } catch (err: unknown) {
        console.error('[register] Unexpected error:', err);
        const message = err instanceof Error ? err.message : 'Erreur inattendue';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
