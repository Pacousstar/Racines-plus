import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cho/profiles
 * Retourne tous les profils utilisateurs (role='user') du village du CHO connecté.
 * Utilise le service role pour bypasser les RLS.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: choProfile, error: profileErr } = await supabaseAdmin
        .from('profiles').select('role, village_origin').eq('id', user.id).single();

    if (profileErr || !choProfile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    if (choProfile.role !== 'cho') return NextResponse.json({ error: 'Accès réservé aux CHO' }, { status: 403 });

    // Charger les users du village avec leurs validations
    let query = supabaseAdmin
        .from('profiles')
        .select(`
            id, first_name, last_name, village_origin, quartier_nom, status, avatar_url, created_at, 
            birth_date, gender, residence_city, residence_country, metadata,
            choa_approvals, phone_1, whatsapp_1, niveau_etudes, emploi, fonction
        `)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

    if (choProfile.village_origin) {
        query = query.ilike('village_origin', `%${choProfile.village_origin.trim()}%`);
    }

    const { data: profiles, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Charger aussi l'équipe CHOa du village
    const { data: team } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, quartier_nom, avatar_url, created_at, status')
        .eq('role', 'choa')
        .ilike('village_origin', `%${choProfile.village_origin?.trim() || ''}%`)
        .order('created_at', { ascending: false });

    return NextResponse.json({ 
        profiles: profiles || [], 
        team: team || [],
        me: choProfile
    });
}
