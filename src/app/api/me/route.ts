import { NextResponse } from 'next/server';
import { error } from '@/lib/api-response';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/me
 * Retourne le profil de l'utilisateur connecté via service role.
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

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) return error(profileError.message, 500);

    if (profile) {
        profile.role = (profile.role || 'user').toLowerCase().trim();
    }

    return NextResponse.json({ success: true, data: profile }, {
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' }
    });
}
