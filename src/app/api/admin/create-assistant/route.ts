import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/create-assistant
 * Crée un compte Assistant Admin directement depuis le dashboard admin.
 * Le compte est créé sur Supabase Auth + profil en BD avec permissions.
 * L'assistant peut ne pas appartenir au village pilote.
 */
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

    // Vérifier le token de l'appelant
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', caller.id)
        .single();

    if (!callerProfile || callerProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Accès réservé aux admins' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, first_name, last_name, phone, poste, village_origin, permissions } = body;

    if (!email || !password || !first_name || !last_name) {
        return NextResponse.json({ error: 'Champs obligatoires manquants : email, password, first_name, last_name' }, { status: 400 });
    }

    // Créer le compte Auth
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Pas besoin de confirmer l'email
        user_metadata: { full_name: `${first_name} ${last_name}` }
    });

    if (createError || !newAuthUser.user) {
        return NextResponse.json({ error: createError?.message || 'Erreur création Auth' }, { status: 500 });
    }

    const newUserId = newAuthUser.user.id;

    // Créer le profil en BD
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        first_name,
        last_name,
        email,
        phone_1: phone || null,
        role: 'admin',
        status: 'confirmed',
        confirmed_source: 'admin_prelim',
        is_assistant: true,
        poste: poste || null,
        village_origin: village_origin || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });

    if (profileError) {
        // Rollback : supprimer le compte Auth si le profil échoue
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Créer les permissions dans admin_permissions
    const defaultPermissions = {
        user_id: newUserId,
        can_validate_users: permissions?.can_validate_users ?? false,
        can_manage_villages: permissions?.can_manage_villages ?? false,
        can_manage_ancestors: permissions?.can_manage_ancestors ?? false,
        can_manage_memorial: permissions?.can_manage_memorial ?? false,
        can_issue_certificates: permissions?.can_issue_certificates ?? false,
        can_manage_invitations: permissions?.can_manage_invitations ?? false,
        can_export_data: permissions?.can_export_data ?? false,
    };

    await supabaseAdmin.from('admin_permissions').insert(defaultPermissions);

    // Logger l'action
    try {
        await supabaseAdmin.from('activity_logs').insert({
            user_id: caller.id,
            action_type: 'INSERT',
            table_name: 'profiles',
            record_id: newUserId,
            new_data: { email, first_name, last_name, role: 'admin', is_assistant: true },
            timestamp: new Date().toISOString()
        });
    } catch {
        // non bloquant
    }

    return NextResponse.json({
        success: true,
        user_id: newUserId,
        message: `Assistant Admin ${first_name} ${last_name} créé avec succès. Il peut se connecter avec : ${email}`
    });
}
