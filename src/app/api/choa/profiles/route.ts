import { NextResponse } from 'next/server';
import { error } from '@/lib/api-response';
import { parsePagination } from '@/lib/pagination';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/choa/profiles
 * Retourne tous les profils du village du CHOa connecté.
 * Utilise le service role pour bypasser les RLS.
 * Le CHOa doit être authentifié (token Bearer).
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return error('Non autorisé', 401);
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
        return error('Non autorisé', 401);
    }

    // Récupérer le profil du CHOa pour connaître son village
    const { data: choaProfile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('id, role, village_origin, quartier_nom, avatar_url, first_name, last_name')
        .eq('id', user.id)
        .single();

    if (profileErr || !choaProfile) {
        return error('Profil introuvable', 404);
    }

    const isAuthorized = ['choa', 'assistant cho', 'assistant_cho', 'admin', 'cho'].includes(choaProfile.role || '');
    if (!isAuthorized) {
        console.warn(`[api/choa/profiles] Access denied for role: ${choaProfile.role}`);
        return error('Accès réservé aux CHOa', 403);
    }

    const searchParams = new URL(request.url).searchParams;
    const { page, limit, offset } = parsePagination(searchParams);

    // Récupérer TOUS les profils 'user' (le filtrage village se fera de manière plus souple)
    let query = supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, village_origin, quartier_nom, status, avatar_url, created_at, birth_date, gender, residence_country, residence_city, metadata, choa_approvals, phone_1, whatsapp_1, niveau_etudes, emploi, fonction, rejection_motif, rejection_observations')
        .eq('role', 'user');

    let countQuery = supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

    // Filtrer par village seulement si le CHOa n'est pas Admin
    if (choaProfile.village_origin && choaProfile.role !== 'admin') {
        const v = choaProfile.village_origin.trim();
        // Filtrage robuste : on cherche le nom exact OU avec des jokers pour les accents/tirets
        const flexibleV = v.replace(/[-éèêëàâîïôûù]/g, '_');
        // Utilisation de guillemets doubles pour sécuriser les noms avec tirets/espaces
        query = query.or(`village_origin.ilike."${v}",village_origin.ilike."${flexibleV}"`);
        countQuery = countQuery.or(`village_origin.ilike."${v}",village_origin.ilike."${flexibleV}"`);
        console.log(`[api/choa/profiles] Filtering for village: "${v}" (flexible: "${flexibleV}")`);
    } else {
        console.log(`[api/choa/profiles] No village filter applied (Role: ${choaProfile.role})`);
    }

    const { count, error: countErr } = await countQuery;
    if (countErr) {
        return error(countErr.message, 500);
    }

    const { data: profiles, error: usersErr } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (usersErr) {
        return error(usersErr.message, 500);
    }

    return NextResponse.json({
        success: true,
        data: profiles || [],
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
            hasMore: page * limit < (count || 0),
        },
        me: {
            id: choaProfile.id,
            role: (choaProfile.role || 'user').toLowerCase().trim(),
            village_origin: choaProfile.village_origin,
            first_name: choaProfile.first_name,
            last_name: choaProfile.last_name,
            avatar_url: choaProfile.avatar_url,
        }
    }, {
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' }
    });
}
