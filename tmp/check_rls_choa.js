const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function checkRLSAndRoles() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log("--- Vérification des RLS et Policies sur 'profiles' ---");
    const { data: policies, error: polErr } = await supabaseAdmin.rpc('get_policies', { table_name: 'profiles' });
    if (polErr) {
        // Si la fonction RPC n'existe pas, on tente une requête directe sur pg_policies si possible (souvent bloqué)
        console.log("Impossible de lister les policies via RPC, tentative via query...");
        const { data: pol2, error: polErr2 } = await supabaseAdmin.from('pg_policies').select('*').eq('tablename', 'profiles');
        if (polErr2) console.log("Accès aux policies refusé.");
        else console.log("Policies:", pol2);
    } else {
        console.log("Policies via RPC:", policies);
    }

    console.log("\n--- Liste des CHOa et assistants du village Toa-Zéo ---");
    const { data: users, error: err } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role, village_origin, status')
        .ilike('village_origin', '%Toa%');

    if (err) { console.error(err); return; }

    console.table(users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        village: u.village_origin,
        status: u.status
    })));

    console.log("\n--- Audit des utilisateurs 'user' du village Toa-Zéo ---");
    const { data: members, error: err2 } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, role, status, village_origin')
        .eq('role', 'user')
        .ilike('village_origin', '%Toa%');

    if (err2) { console.error(err2); return; }
    console.table(members);
}

checkRLSAndRoles();
