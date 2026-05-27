import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { error } from '@/lib/api-response';
import { parsePagination } from '@/lib/pagination';

/**
 * GET /api/admin/profiles
 * Retourne tous les profils (admin uniquement, via service role).
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return error('Non autorisé', 401);

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return error('Non autorisé', 401);

    const { data: callerProfile } = await supabaseAdmin
        .from('profiles').select('first_name, last_name, role, avatar_url').eq('id', user.id).single();

    if (!callerProfile || callerProfile.role !== 'admin') {
        return error('Accès réservé aux admins', 403);
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const { data: profiles, error: profilesError, count } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, role, status, village_origin, quartier_nom, quartiers_assignes, avatar_url, created_at, is_ambassadeur, gender, niveau_etudes, birth_date, export_authorized, export_requested, certificate_requested, certificate_issued, certificate_issued_at, email, residence_city, residence_country, metadata, emploi, fonction, rejection_motif, rejection_observations', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (profilesError) return error(profilesError.message, 500);
    return NextResponse.json({ 
        success: true,
        data: {
            profiles: profiles || [],
            me: { 
                id: user.id, 
                role: (callerProfile.role || 'user').toLowerCase().trim(),
                first_name: callerProfile.first_name,
                last_name: callerProfile.last_name,
                avatar_url: callerProfile.avatar_url
            }
        },
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
            hasMore: page * limit < (count || 0),
        }
    }, {
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' }
    });
}

export async function POST(request: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = request.headers.get('authorization');
    if (!authHeader) return error('Non autorisé', 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return error('Non autorisé', 401);

    const { data: callerProfile } = await supabaseAdmin
        .from('profiles').select('role').eq('id', user.id).single();

    if (!callerProfile || callerProfile.role !== 'admin') {
        return error('Accès réservé aux admins', 403);
    }

    try {
        const { action, userId, data } = await request.json();

        if (!action || !userId) {
            return error('action et userId requis', 400);
        }

        if (action === 'update') {
            const { data: result, error: updateError } = await supabaseAdmin
                .from('profiles')
                .update(data)
                .eq('id', userId)
                .select()
                .single();

            if (updateError) return error(updateError.message, 500);
            return NextResponse.json({ success: true, data: result });
        }

        if (action === 'updateStatus') {
            const { data: result, error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ status: data.status })
                .eq('id', userId)
                .select()
                .single();

            if (updateError) return error(updateError.message, 500);
            return NextResponse.json({ success: true, data: result });
        }

        return error('Action non reconnue: ' + action, 400);
    } catch (e) {
        return error(e instanceof Error ? e.message : 'Erreur serveur', 500);
    }
}
