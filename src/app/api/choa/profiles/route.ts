import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/choa/profiles
 * Retourne tous les profils du village du CHOa connecté.
 * Utilise le service role pour bypasser les RLS.
 * Le CHOa doit être authentifié (token Bearer).
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Vérifier le token et récupérer l'utilisateur connecté
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le profil du CHOa pour connaître son village
    const { data: choaProfile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('role, village_origin, quartier_nom')
        .eq('id', user.id)
        .single();

    if (profileErr || !choaProfile) {
        return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    const isAuthorized = ['choa', 'assistant cho', 'assistant_cho', 'admin', 'cho'].includes(choaProfile.role || '');
    if (!isAuthorized) {
        console.warn(`[api/choa/profiles] Access denied for role: ${choaProfile.role}`);
        return NextResponse.json({ error: 'Accès réservé aux CHOa' }, { status: 403 });
    }

    // Récupérer TOUS les profils 'user' (le filtrage village se fera de manière plus souple)
    let query = supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, village_origin, quartier_nom, status, avatar_url, created_at, birth_date, gender, residence_country, residence_city, metadata, choa_approvals, phone_1, whatsapp_1, niveau_etudes, emploi, fonction')
        .eq('role', 'user');

    // Filtrer par village seulement si le CHOa n'est pas Admin
    if (choaProfile.village_origin && choaProfile.role !== 'admin') {
        const v = choaProfile.village_origin.trim();
        // Filtrage robuste : on cherche le nom exact OU avec des jokers pour les accents/tirets
        const flexibleV = v.replace(/[-éèêëàâîïôûù]/g, '_');
        query = query.or(`village_origin.ilike.${v},village_origin.ilike.${flexibleV}`);
        console.log(`[api/choa/profiles] Filtering for village: "${v}" (flexible: "${flexibleV}")`);
    } else {
        console.log(`[api/choa/profiles] No village filter applied (Role: ${choaProfile.role})`);
    }

    const { data: profiles, error: usersErr } = await query.order('created_at', { ascending: false });

    if (usersErr) {
        return NextResponse.json({ error: usersErr.message }, { status: 500 });
    }

    return NextResponse.json({ 
        profiles: profiles || [],
        me: choaProfile 
    });
}
