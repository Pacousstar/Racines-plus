import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        const { action, data } = await request.json();

        if (!action) {
            return NextResponse.json({ success: false, error: 'action requis' }, { status: 400 });
        }

        if (action === 'insert') {
            const { data: result, error: insertError } = await supabaseAdmin
                .from('validation_comments')
                .insert(data)
                .select()
                .single();

            if (insertError) {
                return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, data: result });
        }

        if (action === 'list') {
            const { data: comments, error: listError } = await supabaseAdmin
                .from('validation_comments')
                .select('*, author:author_id(id, first_name, last_name, avatar_url)')
                .order('created_at', { ascending: false });

            if (listError) {
                return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, data: comments });
        }

        return NextResponse.json({ success: false, error: 'Action non reconnue: ' + action }, { status: 400 });
    } catch (e) {
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
