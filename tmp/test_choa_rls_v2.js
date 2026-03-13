const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Client avec SERVICE ROLE (comme notre script diagnostic)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Client avec ANON KEY (comme le browser du CHOa)
const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
    console.log('=== TEST RLS CHOA ===\n');

    // 1. Login as Pacous (CHOa) avec l'anon client
    const { data: loginData, error: loginErr } = await supabaseAnon.auth.signInWithPassword({
        email: 'pacous2000@gmail.com',
        password: 'racinesplus2024' // si ce n'est pas le bon MDP, ça échouera
    });

    if (loginErr) {
        console.log('❌ Login échoué:', loginErr.message);
        console.log('=> On ne peut pas tester les RLS sans MDP correct.');
        console.log('\n--- Test avec service role pour vérifier les politiques ---');
        
        // Vérifier les politiques via service role
        const { data: policies, error: polErr } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .limit(10);
        console.log('\nService role - profiles visible:', policies?.length, 'erreur:', polErr?.message);
        
        // Tester avec anon key non connecté
        const { data: anonData, error: anonErr } = await supabaseAnon
            .from('profiles')
            .select('id, status, village_origin')
            .limit(10);
        console.log('Anon key (non connecté) - profiles visible:', anonData?.length ?? 0, 'erreur:', anonErr?.message);
        return;
    }

    console.log('✅ Login OK comme:', loginData.user?.email);
    const accessToken = loginData.session?.access_token;

    // Client avec le token du CHOa
    const supabaseAsChoa = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            global: {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        }
    );

    // 2. Tester la requête exacte du code choa/page.tsx
    const { data: profiles, error: profilesErr } = await supabaseAsChoa
        .from('profiles')
        .select('id, first_name, last_name, village_origin, quartier_nom, status, created_at, choa_approvals, avatar_url, birth_date, gender, residence_country, residence_city, metadata')
        .order('created_at', { ascending: false });

    console.log('\n📊 Profils visibles pour le CHOa (via anon+token):', profiles?.length ?? 0);
    if (profilesErr) console.log('❌ Erreur RLS:', JSON.stringify(profilesErr, null, 2));
    
    if (profiles) {
        profiles.forEach(p => {
            console.log(`  • ${p.first_name} ${p.last_name} [${p.status}] village="${p.village_origin}"`);
        });
    }

    // 3. Tester la politique spécifique
    const { data: myProfile, error: myProfileErr } = await supabaseAsChoa
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

    console.log('\n👤 Mon propre profil visible:', myProfile ? '✅ OUI' : '❌ NON');
    if (myProfileErr) console.log('Erreur:', myProfileErr.message);
}

main().catch(console.error);
