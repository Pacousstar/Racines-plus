const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditValidations() {
  console.log('--- Audit des Profils Certifiés ---');

  // 1. Récupérer les profils certifiés
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, status, role, choa_approvals');

  if (pError) {
    console.error('Erreur profils:', pError);
    return;
  }

  // 2. Récupérer les validations effectives
  const { data: validations, error: vError } = await supabase
    .from('validations')
    .select('*');

  if (vError) {
    console.error('Erreur validations:', vError);
    return;
  }

  const certified = profiles.filter(p => p.status === 'confirmed');
  
  console.log(`Nombre total de profils certifiés : ${certified.length}`);
  
  certified.forEach(p => {
    const userValidations = validations.filter(v => v.profile_id === p.id);
    const hasChoApproval = userValidations.some(v => v.validator_role === 'cho');
    const choaCount = Array.isArray(p.choa_approvals) ? p.choa_approvals.length : 0;

    console.log(`\nUtilisateur: ${p.first_name} ${p.last_name} (${p.email})`);
    console.log(`  Rôle: ${p.role}`);
    console.log(`  Sceaux CHOA: ${choaCount}/2`);
    console.log(`  Validation CHO: ${hasChoApproval ? 'OUI' : 'NON'}`);

    if (p.email.toLowerCase() === 'pacous2000@gmail.com') {
        console.log('  [NOTE] Admin Principal - Exception légitime ?');
    } else if (!hasChoApproval || choaCount < 2) {
        console.log('  [ALERTE] Statut non conforme au workflow !');
    }
  });
}

auditValidations();
