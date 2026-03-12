import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/profiles
 * Retourne tous les profils (admin uniquement, via service role).
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

    const { data: callerProfile } = await supabaseAdmin
        .from('profiles').select('role').eq('id', user.id).single();

    if (!callerProfile || callerProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Accès réservé aux admins' }, { status: 403 });
    }

    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, role, status, village_origin, quartier_nom, quartiers_assignes, avatar_url, created_at, is_ambassadeur, gender, niveau_etudes, birth_date, export_authorized, export_requested, certificate_requested, certificate_issued, certificate_issued_at, email, residence_city, residence_country, metadata, emploi, fonction')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ 
        profiles: profiles || [],
        me: { id: user.id, role: 'admin' } // On peut renvoyer plus si besoin
    });
}
