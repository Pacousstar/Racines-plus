const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPillars() {
  const emails = ['franck@g.com', 'pacousstar01@gmail.com', 'pacousstar02@gmail.com'];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('email, role, status, avatar_url')
    .in('email', emails);

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log('--- État Actuel des Piliers ---');
  data.forEach(p => {
    console.log(`${p.email}: Role=${p.role}, Status=${p.status}, Avatar=${p.avatar_url ? 'OK' : 'MISSING'}`);
  });
}

checkPillars();
