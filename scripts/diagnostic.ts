import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
    console.log('--- Vérification de l\'état de la base ---');

    // 1. Compte des profils par rôle et statut
    const { data: stats, error: statsError } = await supabase
        .from('profiles')
        .select('role, status, village_origin, count');

    // Note: Supabase JS select count requires a different syntax for grouping or just raw query.
    // Let's just fetch all profiles (if not too many) or do multiple counts.

    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user');
    const { count: pendingChoaUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user').eq('status', 'pending_choa');
    const { count: choaCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'choa');

    console.log(`Total Utilisateurs (role='user'): ${totalUsers}`);
    console.log(`Utilisateurs en 'pending_choa': ${pendingChoaUsers}`);
    console.log(`Nombre de CHOa: ${choaCount}`);

    // 2. Vérifier un échantillon de CHOa
    const { data: choas } = await supabase.from('profiles').select('id, first_name, last_name, village_origin, quartiers_assignes').eq('role', 'choa').limit(5);
    console.log('\nÉchantillon de CHOa :');
    console.table(choas);

    // 3. Vérifier un échantillon d'utilisateurs
    const { data: users } = await supabase.from('profiles').select('id, first_name, last_name, village_origin, status').eq('role', 'user').limit(10);
    console.log('\nÉchantillon d\'Utilisateurs :');
    console.table(users);

    // 4. Vérifier les logs d'activité
    const { count: logCount } = await supabase.from('activity_logs').select('*', { count: 'exact', head: true });
    console.log(`\nNombre de logs d'activité : ${logCount}`);

    if (logCount && logCount > 0) {
        const { data: logs } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(5);
        console.log('\nDerniers logs :');
        console.table(logs);
    }
}

checkState().catch(console.error);
