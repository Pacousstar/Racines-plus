import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/choa/activity
 * Retourne les dernières activités (validations) du village du CHOa.
 * Utilise le service role pour bypasser les RLS sur les logs d'activité.
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

    // Récupérer le village du CHOa
    const { data: choaProfile } = await supabaseAdmin
        .from('profiles')
        .select('role, village_origin')
        .eq('id', user.id)
        .single();

    if (!choaProfile) {
        return NextResponse.json({ activity: [] });
    }

    const isAuthorized = ['choa', 'assistant cho', 'assistant_cho'].includes(choaProfile.role || '');
    if (!isAuthorized) {
        console.warn(`[api/choa/activity] Access denied for role: ${choaProfile.role}`);
        return NextResponse.json({ activity: [] });
    }

    if (!choaProfile.village_origin) {
        return NextResponse.json({ activity: [] });
    }

    // Charger l'activité du quartier/village via la vue (filtrage souple)
    const v = choaProfile.village_origin.trim();
    console.log(`[api/choa/activity] User ${user.email} filtering activity for village: "${v}"`);
    
    // On remplace tirets et accents par des jokers pour une recherche ultra-souple
    const flexibleV = v.replace(/[-éèêëàâîïôûù]/g, '%');

    const { data: activity, error } = await supabaseAdmin
        .from('v_validations_quartier')
        .select('*')
        .or(`validator_village.ilike.%${flexibleV}%,validator_village.ilike.%${v}%`)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activity: activity || [] });
}
