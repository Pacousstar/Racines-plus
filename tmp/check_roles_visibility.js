
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSpecificUsers() {
    const usersToCheck = [
        { email: 'pacousstar01@gmail.com', desc: 'Pacous Star (CHOa ?)' },
        { name: 'Franck GOUSSE', desc: 'Franck GOUSSE (Visibilité CHOa ?)' }
    ];

    console.log('--- Vérification des utilisateurs spécifiques ---');

    for (const u of usersToCheck) {
        let query = supabase.from('profiles').select('id, first_name, last_name, role, status, village_origin, metadata');
        if (u.email) {
            // Need to get ID from Auth or just use ilike on name if email not in profiles
            const { data: authData } = await supabase.auth.admin.listUsers();
            const authUser = authData.users.find(au => au.email?.toLowerCase() === u.email.toLowerCase());
            if (authUser) {
                query = query.eq('id', authUser.id);
            } else {
                console.log(`\nUtilisateur auth non trouvé pour ${u.email}`);
                continue;
            }
        } else {
            const [firstName, lastName] = u.name.split(' ');
            query = query.ilike('first_name', `%${firstName}%`).ilike('last_name', `%${lastName}%`);
        }

        const { data, error } = await query;
        if (error) {
            console.error(`Erreur pour ${u.desc}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            data.forEach(p => {
                console.log(`\n${u.desc}: ${p.first_name} ${p.last_name}`);
                console.log(`ID: ${p.id}`);
                console.log(`Role: ${p.role}`);
                console.log(`Status: ${p.status}`);
                console.log(`Village: ${p.village_origin}`);
                console.log(`Metadata: ${JSON.stringify(p.metadata, null, 2)}`);
            });
        } else {
            console.log(`\nAucun profil trouvé pour ${u.desc}`);
        }
    }
}

checkSpecificUsers();
