require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
    // 1. Essayer de se connecter avec Pacous
    const email = 'pacous2000@gmail.com';
    const pwd = 'RacinesPlus2024';
    
    // On s'en fout du mdp, on va utiliser SignInWithOtp ou on va créer une méthode d'auth bypass
    // Ou beaucoup plus simple: tester notre API Route directement en chargeant le code Next.js!
    // Pas possible facilement. Faisons juste la même logique que l'API Route:
    
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const choaProfile = {
        role: 'choa',
        village_origin: 'Toa-Zéo',
        quartier_nom: 'Gbeya'
    };
    
    let query = supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, village_origin, quartier_nom, status, avatar_url, created_at, birth_date, gender, residence_country, residence_city, metadata, choa_approvals')
        .order('created_at', { ascending: false });

    // Filtrer par village si défini
    if (choaProfile.village_origin) {
        query = query.ilike('village_origin', `%${choaProfile.village_origin.trim()}%`);
    }

    const { data: allUsersRaw, error: usersErr } = await query;
    console.log(`API a trouvé ${allUsersRaw?.length} profils dans Toa-Zéo`);
    
    const CHOA_PENDING_STATUSES = ['pending_choa', 'pending', 'pre_approved'];
    const pending = allUsersRaw.filter(u => CHOA_PENDING_STATUSES.includes(u.status || 'pending_choa'));
    const probable = allUsersRaw.filter(u => u.status === 'probable');
    
    console.log(`Filtre React a trouvé ${pending.length} pending, ${probable.length} probable`);
    pending.forEach(p => console.log('Pending:', p.first_name, p.status, p.village_origin));
}

main().catch(console.error);
