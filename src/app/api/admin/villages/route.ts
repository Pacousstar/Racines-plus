import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cacheGet, cacheSet, cacheKey } from '@/lib/cache';

export async function GET() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const key = cacheKey('admin', 'villages');
    const cached = await cacheGet<{ success: boolean; data: unknown[] }>(key);
    if (cached) return NextResponse.json(cached);

    const { data, error } = await supabaseAdmin
        .from('villages')
        .select('*')
        .order('nom');

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const responseData = { success: true, data };
    await cacheSet(key, responseData, 600);
    return NextResponse.json(responseData);
}

export async function POST(request: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        const { action, nom, region, id } = await request.json();

        if (!action) {
            return NextResponse.json({ success: false, error: 'action requis' }, { status: 400 });
        }

        if (action === 'insert') {
            if (!nom || !region) {
                return NextResponse.json({ success: false, error: 'nom et region requis' }, { status: 400 });
            }

            const { data, error: insertError } = await supabaseAdmin
                .from('villages')
                .insert({ nom, region })
                .select()
                .single();

            if (insertError) {
                return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, data });
        }

        if (action === 'delete') {
            if (!id) {
                return NextResponse.json({ success: false, error: 'id requis' }, { status: 400 });
            }

            const { error: deleteError } = await supabaseAdmin
                .from('villages')
                .delete()
                .eq('id', id);

            if (deleteError) {
                return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, data: { id } });
        }

        if (action === 'update') {
            if (!id || !nom) {
                return NextResponse.json({ success: false, error: 'id et nom requis' }, { status: 400 });
            }

            const { data, error: updateError } = await supabaseAdmin
                .from('villages')
                .update({ nom })
                .eq('id', id)
                .select()
                .single();

            if (updateError) {
                return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ success: false, error: 'Action non reconnue: ' + action }, { status: 400 });
    } catch (e) {
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
