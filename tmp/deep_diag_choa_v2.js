require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log('--- Recherche de Pacous ---');
    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('first_name', '%Pacous%');
        
    if (error) {
        console.error('Erreur:', error);
        return;
    }
    
    profiles.forEach(p => {
        console.log(`- ID: ${p.id} | Nom: ${p.first_name} ${p.last_name} | Role: ${p.role} | Village: "${p.village_origin}" | Quartier: "${p.quartier_nom}" | Assignés:`, p.quartiers_assignes);
    });

    if (profiles.length > 0) {
        const profile = profiles[0];
        console.log('\n--- Simulation API Profiles pour ce village ---');
        const { data: allUsers } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', 'user')
            .ilike('village_origin', `%${profile.village_origin?.trim() || ''}%`);
            
        console.log(`Profils trouvés (role=user): ${allUsers?.length || 0}`);
        allUsers?.forEach(u => console.log(`- ${u.first_name} ${u.last_name} | status: ${u.status} | village: ${u.village_origin} | quartier: ${u.quartier_nom}`));
    }
}

main().catch(console.error);
