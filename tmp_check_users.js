const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, status')
    .in('role', ['cho', 'choa', 'admin', 'user'])
    .limit(20);

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.table(data);
}

checkUsers();
