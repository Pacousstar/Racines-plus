import { NextRequest } from 'next/server';
import { success, error } from '@/lib/api-response';
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
            return error('Liste d\'emails requise', 400);
        }

        if (emails.length === 0) {
            return success({ statuses: {} });
        }

        const supabaseAdmin = getAdminClient();
        const { data: users, error: listErr } = await supabaseAdmin.auth.admin.listUsers();

        if (listErr) {
            console.error('[check-invites] Erreur listUsers:', listErr);
            return error('Erreur de vérification des utilisateurs', 500);
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

        return success({ statuses });

    } catch (err) {
        console.error('[check-invites] Exception:', err);
        return error('Erreur interne du serveur', 500);
    }
}
