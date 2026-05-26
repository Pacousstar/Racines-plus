import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Supabase credentials are not configured');
    }
    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { emails } = body;

        if (!emails || !Array.isArray(emails)) {
            return NextResponse.json({ error: 'Liste d\'emails requise' }, { status: 400 });
        }

        if (emails.length === 0) {
            return NextResponse.json({ statuses: {} });
        }

        const supabaseAdmin = getAdminClient();
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            console.error('[check-invites] Erreur listUsers:', error);
            return NextResponse.json({ error: 'Erreur de vérification des utilisateurs' }, { status: 500 });
        }

        // Créer un Set des emails enregistrés
        const registeredEmails = new Set(users.users.map(u => u.email?.toLowerCase()));

        // Mapper les résultats (inscrits vs non inscrits)
        const statuses: Record<string, 'inscrit' | 'non_inscrit'> = {};
        for (const email of emails) {
            if (email) {
                statuses[email] = registeredEmails.has(email.toLowerCase()) ? 'inscrit' : 'non_inscrit';
            }
        }

        return NextResponse.json({ statuses });

    } catch (error) {
        console.error('[check-invites] Exception:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}
