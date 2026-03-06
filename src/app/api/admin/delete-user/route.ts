import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier si appelant est admin
    const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', caller.id)
        .single();

    if (!callerProfile || callerProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Accès réservé aux admins' }, { status: 403 });
    }

    const { user_id } = await request.json();
    if (!user_id) {
        return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 });
    }

    // Supprimer l'utilisateur via Supabase Auth Admin.
    // Si des clés étrangères sont définies avec CASCADE, cela supprimera aussi le profil et autres données.
    // Sinon, nous devons supprimer le profil manuellement. 
    // Mieux vaut supprimer d'abord depuis la BD pour éviter des contraintes non-cascaded.

    // Supprimer le profil BD
    await supabaseAdmin.from('profiles').delete().eq('id', user_id);

    // Supprimer dans Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log the action
    try {
        await supabaseAdmin.from('activity_logs').insert({
            user_id: caller.id,
            action_type: 'DELETE',
            table_name: 'profiles',
            record_id: user_id,
            new_data: { action: 'delete_user_completely' },
            timestamp: new Date().toISOString()
        });
    } catch {
        // Ignore
    }

    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès' });
}
