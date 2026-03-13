const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function diag() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const choaId = '4c61c644-4ffb-47e8-a6d8-fe5020c2cd5b'; // Pacous DIHI

    console.log(`--- Diagnostic pour CHOa: ${choaId} ---`);

    const { data: choa, error: e1 } = await supabaseAdmin.from('profiles').select('*').eq('id', choaId).single();
    if (e1) { console.error('Erreur profil CHOa:', e1); return; }

    console.log(`Village CHOa: "${choa.village_origin}"`);
    console.log(`Quartier CHOa: "${choa.quartier_nom}"`);

    const v = choa.village_origin.trim();
    console.log(`Recherche des utilisateurs avec village_origin LIKE "%${v}%" et role="user"...`);

    const { data: users, error: e2 } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, village_origin, quartier_nom, status, role')
        .eq('role', 'user')
        .ilike('village_origin', `%${v}%`);

    if (e2) { console.error('Erreur recherche users:', e2); return; }

    console.log(`Nombre d'utilisateurs trouvés: ${users.length}`);
    users.forEach(u => {
        console.log(`- ${u.first_name} ${u.last_name} [${u.id}] | Village: "${u.village_origin}" | Quartier: "${u.quartier_nom}" | Statut: ${u.status}`);
    });

    console.log('\n--- Vérification de la vue v_validations_quartier ---');
    const { data: activity, error: e3 } = await supabaseAdmin
        .from('v_validations_quartier')
        .select('*')
        .ilike('validator_village', `%${v}%`)
        .limit(5);

    if (e3) {
        console.error('Erreur vue activité:', e3.message);
    } else {
        console.log(`Nombre d'activités trouvées: ${activity.length}`);
    }
}

diag();
