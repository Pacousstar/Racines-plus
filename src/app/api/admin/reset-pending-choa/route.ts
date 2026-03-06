import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/reset-pending-choa
 * Repositionne tous les inscrits BD existants (status !== confirmed/rejected)
 * vers pending_choa pour qu'ils apparaissent dans le tableau de bord CHOa.
 * 
 * Stratégie : assigne chaque user au quartier CHOa de son village
 * (ou laisse quartier_nom vide s'il n'y a pas de CHOa assigné).
 */
export async function POST(request: Request) {
    // Vérifier l'authorization (admin uniquement)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Vérifier que l'appelant est bien admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!callerProfile || callerProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Accès réservé aux admins' }, { status: 403 });
    }

    // Récupérer tous les users avec un statut à repositionner
    const { data: usersToMigrate, error: usersErr } = await supabaseAdmin
        .from('profiles')
        .select('id, status, village_origin, quartier_nom')
        .eq('role', 'user')
        .neq('status', 'rejected')
        .neq('status', 'confirmed')
        .neq('status', 'probable');

    if (usersErr) {
        return NextResponse.json({ error: usersErr.message }, { status: 500 });
    }

    if (!usersToMigrate || usersToMigrate.length === 0) {
        return NextResponse.json({
            success: true,
            migrated: 0,
            message: 'Aucun utilisateur à repositionner.'
        });
    }

    // Mettre à jour en masse : status → pending_choa
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
            status: 'pending_choa',
            choa_approvals: [],
            updated_at: new Date().toISOString()
        })
        .in('id', usersToMigrate.map(u => u.id));

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Logger l'action (non bloquant — on ignore les erreurs de log)
    try {
        await supabaseAdmin.from('activity_logs').insert({
            user_id: user.id,
            action_type: 'BATCH_RESET_PENDING_CHOA',
            table_name: 'profiles',
            record_id: null,
            new_data: { migrated_count: usersToMigrate.length, action: 'reset_to_pending_choa' },
            timestamp: new Date().toISOString()
        });
    } catch {
        // Ignore log errors
    }

    return NextResponse.json({
        success: true,
        migrated: usersToMigrate.length,
        message: `${usersToMigrate.length} utilisateur(s) repositionné(s) en pending_choa.`
    });
}
