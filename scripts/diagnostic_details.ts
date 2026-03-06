import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
    console.log('--- Détails CHOa ---');
    const { data: choas } = await supabase.from('profiles').select('id, first_name, last_name, village_origin, quartier_nom, role').eq('role', 'choa');
    console.table(choas);

    console.log('\n--- Détails de la vue v_audit_trail_admin ---');
    const { data: viewLogs, error: viewError } = await supabase.from('v_audit_trail_admin').select('*').limit(5);
    if (viewError) {
        console.error('Erreur lors de la lecture de la vue v_audit_trail_admin:', viewError.message);
    } else {
        console.table(viewLogs);
    }

    console.log('\n--- Vérification des quartiers en base ---');
    const { data: quartiers } = await supabase.from('quartiers').select('id, nom, village_id').limit(10);
    console.table(quartiers);
}

checkDetails().catch(console.error);
