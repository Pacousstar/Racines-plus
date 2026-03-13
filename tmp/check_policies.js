
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
    const { data: policies, error } = await supabase.rpc('get_policies', { table_name: 'profiles' });
    // Since get_policies might not exist, we'll try to query pg_policies directly via a raw SQL if possible, 
    // but the JS client doesn't support raw SQL easily without a custom RPC.
    // Instead, let's try to query a system view if allowed, or just trust my grep.
    
    // Alternative: check if there are multiple policies for 'profil_acces_management'
    const { data: p, error: e } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    console.log('Total profiles visible to service role:', p);
}

async function listAllPolicies() {
    // This requires a custom function usually. Let's try to see if we can find it in the codebase.
}

checkPolicies();
