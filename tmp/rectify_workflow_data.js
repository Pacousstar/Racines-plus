const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function rectifyData() {
  console.log('--- Rectification des Profils ---');

  const usersToReset = [
    'pacousstar01@gmail.com', // Pacous DIHI
    'pacousstar02@gmail.com', // Chiley STAR
    'franck@g.com',           // Franck GOUSSE
    'asstech@gmail.com'       // Asstech DAP
  ];

  for (const email of usersToReset) {
    console.log(`Réinitialisation de : ${email}`);
    
    // 1. Récupérer le profil
    const { data: profile } = await supabase.from('profiles').select('id, first_name, last_name, role').eq('email', email).single();
    
    if (profile) {
      console.log(`  Trouvé : ${profile.first_name} ${profile.last_name} (${profile.role})`);
      
      // 2. Mettre à jour : role -> user, status -> pending_choa, clear approvals
      const { error } = await supabase.from('profiles').update({
        role: 'user',
        status: 'pending_choa',
        choa_approvals: null // On efface les sceaux s'il y en avait (pour repartir du workflow)
      }).eq('id', profile.id);

      if (error) {
        console.error(`  Erreur lors de la mise à jour de ${email}:`, error.message);
      } else {
        console.log(`  Succès : ${email} est maintenant USER en attente de validation.`);
      }
    } else {
      console.log(`  Profil non trouvé pour : ${email}`);
    }
  }
}

rectifyData();
