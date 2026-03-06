import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectForeignKeys() {
    console.log('--- Inspection des Clés Étrangères ---');

    // Requête pour trouver toutes les tables qui référencent auth.users ou public.profiles
    const { data, error } = await supabase.rpc('get_foreign_keys', {});

    // Si la fonction RPC n'existe pas (probable), on utilise une requête SQL directe via un hack ou juste on liste les tables.
    // Malheureusement Supabase JS ne permet pas de requêtes SQL arbitraires sans RPC.

    // Alternative: On va essayer de supprimer un utilisateur de test et voir l'erreur exacte si possible
    // Mais on l'a déjà fait.

    // Essayons de lister les tables via l'API (si possible)
    console.log('Tentative de listing des tables via une requête sur information_schema (si RLS le permet via Postgres)');

    const query = `
        SELECT
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            JOIN information_schema.referential_constraints AS rc
              ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND (ccu.table_name = 'users' AND ccu.table_schema = 'auth' OR ccu.table_name = 'profiles' AND ccu.table_schema = 'public');
    `;

    console.log('Requête SQL à exécuter manuellement si besoin :');
    console.log(query);
}

inspectForeignKeys();
