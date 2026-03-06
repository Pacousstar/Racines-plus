import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChoas() {
    const { data: choas } = await supabase.from('profiles').select('id, first_name, last_name, village_origin, quartier_nom, role').eq('role', 'choa');
    console.log('LISTE DES CHOa :');
    console.table(choas);
}

checkChoas().catch(console.error);
