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
                .from('ancestres')
                .insert(data)
                .select()
                .single();

            if (insertError) {
                return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, data: result });
        }

        if (action === 'getVillage') {
            if (!data?.villageNom) {
                return NextResponse.json({ success: false, error: 'villageNom requis dans data' }, { status: 400 });
            }

            const { data: village, error: villageError } = await supabaseAdmin
                .from('villages')
                .select('id')
                .eq('nom', data.villageNom)
                .single();

            if (villageError) {
                return NextResponse.json({ success: false, error: villageError.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, data: village });
        }

        return NextResponse.json({ success: false, error: 'Action non reconnue: ' + action }, { status: 400 });
    } catch (e) {
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : 'Erreur serveur' },
            { status: 500 }
        );
    }
}
