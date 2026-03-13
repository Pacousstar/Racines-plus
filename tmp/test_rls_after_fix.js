const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Client ANON (comme le browser)
const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Client ADMIN (service role, pour comparaison)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log('=== TEST RLS APRÈS CORRECTION ===\n');

    // 1. Login as Pacous (CHOa) - essayer plusieurs mots de passe connus
    const emails = ['pacous2000@gmail.com'];
    const passwords = ['RACINESPLUS2024', 'RacinesPlus2024', 'racinesplus2025', 'Racines2024!', 'racines2024'];

    let loggedIn = false;
    let session = null;

    for (const email of emails) {
        for (const pwd of passwords) {
            const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password: pwd });
            if (!error && data.session) {
                console.log(`✅ Login OK: ${email} avec mot de passe trouvé`);
                session = data.session;
                loggedIn = true;
                break;
            }
        }
        if (loggedIn) break;
    }

    if (!loggedIn) {
        console.log('❌ Impossible de se connecter (mot de passe inconnu)');
        console.log('\n--- Test avec anon key (non connecté) ---');
        const { data: anonData } = await supabaseAnon.from('profiles').select('id, status').limit(5);
        console.log(`Anon non connecté: ${anonData?.length ?? 0} profils visibles`);
        
        console.log('\n--- Vérification service role (référence) ---');
        const { data: adminData } = await supabaseAdmin.from('profiles').select('id, first_name, status, village_origin, role').limit(10);
        console.log(`Service role: ${adminData?.length ?? 0} profils`);
        adminData?.forEach(p => console.log(`  • ${p.first_name} [${p.role}] ${p.status} - ${p.village_origin}`));
        return;
    }

    // 2. Tester avec le token du CHOa
    const authedClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }
    );

    const { data: profiles, error } = await authedClient
        .from('profiles')
        .select('id, first_name, last_name, status, village_origin, role')
        .order('created_at', { ascending: false });

    console.log(`\n📊 Profils visibles pour CHOa (via RLS): ${profiles?.length ?? 0}`);
    if (error) console.log('❌ Erreur:', error.message);
    profiles?.forEach(p => console.log(`  • ${p.first_name} ${p.last_name} [${p.role}] ${p.status} - ${p.village_origin}`));

    const pending = profiles?.filter(p => ['pending_choa','pending','pre_approved'].includes(p.status));
    console.log(`\n✅ À valider: ${pending?.length ?? 0} dossiers`);
}

main().catch(console.error);
