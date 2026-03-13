const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalize(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

async function main() {
    console.log('=== DIAGNOSTIC CHOA DATA ===\n');

    // 1. Trouver le profil de Pacous (CHOa)
    const { data: choas, error: choaErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, village_origin, quartier_nom, status')
        .eq('role', 'choa');

    if (choaErr) { console.error('Erreur CHOA:', choaErr); return; }
    console.log(`👮 CHOa(s) trouvés: ${choas.length}`);
    choas.forEach(c => {
        console.log(`  - ${c.first_name} ${c.last_name} | Village: "${c.village_origin}" | Quartier: "${c.quartier_nom}" | ID: ${c.id}`);
    });

    if (choas.length === 0) { console.log('\n❌ Aucun CHOa trouvé !'); return; }

    const choa = choas[0];
    const myVillageNorm = normalize(choa.village_origin);
    console.log(`\n🔍 Filtre village normalisé: "${myVillageNorm}"`);

    // 2. Récupérer tous les profils et voir comment le filtre s'applique
    const { data: allProfiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, village_origin, quartier_nom, status, role')
        .order('created_at', { ascending: false });

    if (profilesErr) { console.error('Erreur profiles:', profilesErr); return; }

    console.log(`\n📊 Total profils en BDD: ${allProfiles.length}`);

    // Statuts distincts
    const statuses = [...new Set(allProfiles.map(p => p.status))];
    console.log(`\nStatuts présents: ${JSON.stringify(statuses)}`);

    // Vérifier quels villages existent pour les User
    const users = allProfiles.filter(p => p.role === 'user' || p.role === 'USER' || !p.role);
    console.log(`\nUtilisateurs (role=user) : ${users.length}`);
    
    const allVillages = [...new Set(allProfiles.map(p => p.village_origin).filter(Boolean))];
    console.log(`\nVillages distincts en BDD:`);
    allVillages.forEach(v => {
        const normV = normalize(v);
        const match = !myVillageNorm || normV.includes(myVillageNorm);
        console.log(`  ${match ? '✅' : '❌'} "${v}" (normalisé: "${normV}") ${match ? '<-- CORRESPOND' : ''}`);
    });

    // 3. Simuler le filtre exact du code choa/page.tsx
    const CHOA_PENDING_STATUSES = ['pending_choa', 'pending', 'pre_approved'];
    
    const filtered = allProfiles.filter(u => {
        const userVillageNorm = normalize(u.village_origin);
        return !myVillageNorm || userVillageNorm.includes(myVillageNorm);
    });

    const pending = filtered.filter(u => CHOA_PENDING_STATUSES.includes(u.status || 'pending_choa'));
    const probable = filtered.filter(u => u.status === 'probable');
    const confirmed = filtered.filter(u => u.status === 'confirmed');

    console.log(`\n--- Résultats APRÈS filtre village (comme choa/page.tsx) ---`);
    console.log(`À valider (pending_choa/pending/pre_approved): ${pending.length}`);
    pending.forEach(p => console.log(`  • ${p.first_name} ${p.last_name} [${p.status}] village="${p.village_origin}"`));
    
    console.log(`Envoyés au CHO (probable): ${probable.length}`);
    probable.forEach(p => console.log(`  • ${p.first_name} ${p.last_name} [${p.status}] village="${p.village_origin}"`));
    
    console.log(`Certifiés (confirmed): ${confirmed.length}`);

    // 4. Statistiques sans filtre village (pour voir le vrai problème)
    console.log(`\n--- SANS filtre village ---`);
    const pendingAll = allProfiles.filter(u => CHOA_PENDING_STATUSES.includes(u.status || 'pending_choa'));
    const probableAll = allProfiles.filter(u => u.status === 'probable');
    console.log(`À valider (global): ${pendingAll.length}`);
    pendingAll.forEach(p => console.log(`  • ${p.first_name} ${p.last_name} [${p.status}] village="${p.village_origin}" role="${p.role}"`));
    console.log(`Envoyés au CHO (global): ${probableAll.length}`);
    probableAll.forEach(p => console.log(`  • ${p.first_name} ${p.last_name} [${p.status}] village="${p.village_origin}" role="${p.role}"`));
}

main().catch(console.error);
