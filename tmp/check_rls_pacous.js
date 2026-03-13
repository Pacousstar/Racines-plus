require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('--- Politiques RLS sur profiles ---');
    // On essaie de lire pg_policies via une requête rpc si on peut, 
    // ou on regarde si on peut faire un dump des politiques via les outils supabase si on les avait.
    // Ici on va juste tester la lecture du profil d'un user spécifique (Pacous) 
    // en simulant son auth si possible, ou au moins lister ce que le service role voit.
    
    // Mais plus simple: je vais essayer de lire pg_policies en utilisant une astuce rpc s'il y en a une,
    // sinon je vais juste me baser sur les fichiers SQL s'ils sont dispo.
    
    // Test: est-ce que Pacous peut lire son propre profil ?
    const pacousId = '4c61c644-4ffb-47e8-a6d8-fe5020c2cd5b';
    const { data, error } = await supabase.from('profiles').select('*').eq('id', pacousId).single();
    
    console.log('Profil Pacous via Service Role:', data ? 'OK' : 'FAIL', error || '');
    if (data) console.log('Village:', data.village_origin, 'Role:', data.role);
    
    // On va aussi lister les noms des politiques via pg_policies
    const { data: policies, error: polErr } = await supabase.rpc('inspect_rls_profiles');
    if (polErr) {
        console.log('RPC inspect_rls_profiles non trouvé, tentative via query brute...');
        // Si on n'a pas de RPC, on ne peut pas faire de SQL direct.
    } else {
        console.log('Politiques:', policies);
    }
}

main();
