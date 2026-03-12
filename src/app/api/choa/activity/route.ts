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
        .select('village_origin')
        .eq('id', user.id)
        .single();

    if (!choaProfile?.village_origin) {
        return NextResponse.json({ activity: [] });
    }

    // Charger l'activité du quartier/village via la vue
    const { data: activity, error } = await supabaseAdmin
        .from('v_validations_quartier')
        .select('*')
        .ilike('validator_village', `%${choaProfile.village_origin.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activity: activity || [] });
}
