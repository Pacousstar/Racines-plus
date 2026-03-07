
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSpecificProfiles() {
    const names = ['Chiley STAR', 'Pacous STAR', 'Achille Pacôme DIHI'];
    console.log('--- Vérification des profils ---');

    for (const fullName of names) {
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');

        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, metadata')
            .ilike('first_name', `%${firstName}%`)
            .ilike('last_name', `%${lastName}%`);

        if (error) {
            console.error(`Erreur pour ${fullName}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            data.forEach(p => {
                console.log(`\nProfil: ${p.first_name} ${p.last_name} (${p.id})`);
                console.log(`Metadata: ${JSON.stringify(p.metadata, null, 2)}`);
            });
        } else {
            console.log(`\nAucun profil trouvé pour ${fullName}`);
        }
    }
}

checkSpecificProfiles();
