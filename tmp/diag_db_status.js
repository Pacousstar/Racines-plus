require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log('--- Profils dans le village de Toa-Zéo ---');
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, role, status, village_origin, quartier_nom, choa_approvals');

    if (error) {
        console.error('Erreur:', error);
        return;
    }

    const toa = data.filter(p => (p.village_origin || '').toLowerCase().includes('toa-zéo'.toLowerCase()));
    
    console.log(`Total Toa-Zéo: ${toa.length}`);
    toa.forEach(p => {
        console.log(`- ${p.first_name} ${p.last_name} | Role: ${p.role} | Status: ${p.status} | Quartier: ${p.quartier_nom} | Approvals:`, p.choa_approvals);
    });

    console.log('\n--- Calculs dashboard CHOa ---');
    const CHOA_PENDING_STATUSES = ['pending_choa', 'pending', 'pre_approved'];
    
    const usersOnly = toa; // L'API ne filtre PAS par role='user' actuellement !! Ahhh !!
    console.log(`Users only? ${usersOnly.filter(p => p.role === 'user').length}`);

    const pending = usersOnly.filter(u => CHOA_PENDING_STATUSES.includes(u.status || 'pending_choa'));
    const probable = usersOnly.filter(u => u.status === 'probable');

    console.log(`À valider: ${pending.length}`);
    console.log(`Envoyés au CHO: ${probable.length}`);
}

main().catch(console.error);
