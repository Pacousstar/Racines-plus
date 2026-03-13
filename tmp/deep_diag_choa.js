require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const email = 'pacous2000@gmail.com';
    
    // 1. Trouver l'ID de Pacous
    const { data: users, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    const pacous = users.users.find(u => u.email === email);
    
    if (!pacous) {
        console.error('Utilisateur non trouvé');
        return;
    }
    
    console.log('--- Profil de Pacous ---');
    const { data: profile, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', pacous.id)
        .single();
        
    if (pErr) {
        console.error('Erreur profil:', pErr);
        return;
    }
    
    console.log(`ID: ${profile.id}`);
    console.log(`Village: "${profile.village_origin}"`);
    console.log(`Quartier: "${profile.quartier_nom}"`);
    console.log(`Quartiers Assignés:`, profile.quartiers_assignes);
    console.log(`Role: ${profile.role}`);

    // 2. Simuler l'API /api/choa/profiles
    console.log('\n--- Simulation API Profiles ---');
    let query = supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'user');

    if (profile.village_origin) {
        // Attention au ilike et aux espaces
        query = query.ilike('village_origin', `%${profile.village_origin.trim()}%`);
    }

    const { data: allUsers, error: usersErr } = await query;
    console.log(`Nombre de profils trouvés pour le village: ${allUsers?.length || 0}`);
    
    if (allUsers) {
        allUsers.forEach(u => {
            console.log(`- ${u.first_name} ${u.last_name} | Quartier: "${u.quartier_nom}" | Status: ${u.status}`);
        });
    }

    // 3. Simuler l'API /api/choa/activity
    console.log('\n--- Simulation API Activity ---');
    const { data: activity, error: actErr } = await supabaseAdmin
        .from('v_validations_quartier')
        .select('*')
        .ilike('validator_village', `%${profile.village_origin.trim()}%`)
        .limit(10);
        
    console.log(`Nombre d'activités trouvées: ${activity?.length || 0}`);
    if (actErr) console.error('Erreur activité:', actErr);
    if (activity) {
        activity.forEach(a => {
            console.log(`- Action par ${a.validator_name} sur ${a.cible_first_name} | Village: ${a.validator_village}`);
        });
    }
}

main().catch(console.error);
