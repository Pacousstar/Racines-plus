import { error, paginated } from '@/lib/api-response';
import { parsePagination } from '@/lib/pagination';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/cho/profiles
 * Retourne tous les profils utilisateurs (role='user') du village du CHO connecté.
 * Utilise le service role pour bypasser les RLS.
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

    const { data: choProfile, error: profileErr } = await supabaseAdmin
        .from('profiles').select('first_name, last_name, role, village_origin, avatar_url').eq('id', user.id).single();

    if (profileErr || !choProfile) return error('Profil introuvable', 404);
    if (choProfile.role !== 'cho') return error('Accès réservé aux CHO', 403);

    const searchParams = new URL(request.url).searchParams;
    const { page, limit, offset } = parsePagination(searchParams);

    // Charger les users du village avec leurs validations
    let query = supabaseAdmin
        .from('profiles')
        .select(`
            id, first_name, last_name, village_origin, quartier_nom, status, avatar_url, created_at, 
            birth_date, gender, residence_city, residence_country, metadata,
            choa_approvals, phone_1, whatsapp_1, niveau_etudes, emploi, fonction,
            rejection_motif, rejection_observations
        `)
        .eq('role', 'user');

    let countQuery = supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

    if (choProfile.village_origin) {
        const filter = `%${choProfile.village_origin.trim()}%`;
        query = query.ilike('village_origin', filter);
        countQuery = countQuery.ilike('village_origin', filter);
    }

    const { count, error: countErr } = await countQuery;
    if (countErr) return error(countErr.message, 500);

    const { data: profiles, error: profilesError } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (profilesError) return error(profilesError.message, 500);

    return paginated(profiles || [], count || 0, page, limit);
}
