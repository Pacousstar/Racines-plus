
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAccess() {
    console.log("Logging in as pacousstar01@gmail.com...");
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'pacousstar01@gmail.com',
        password: 'Mignon29@'
    });

    if (authErr) {
        console.error("Login failed:", authErr.message);
        return;
    }

    console.log("Login successful! User ID:", authData.user.id);

    // Fetch own profile
    const { data: myProfile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profErr) {
        console.error("Error fetching own profile:", profErr.message);
    } else {
        console.log("My Profile (Village/Quartier):", myProfile.village_origin, "/", myProfile.quartier_nom);
    }

    // Now try to fetch all profiles like the dashboard does
    let q = supabase
        .from('profiles')
        .select('id, first_name, last_name, village_origin, quartier_nom, status')
        .order('created_at', { ascending: false });

    // The frontend filters locally now, but let's just see what RLS allows us to pull!
    const { data: allUsers, error: usersErr } = await q;

    if (usersErr) {
         console.error("Error fetching all users:", usersErr.message);
    } else {
         console.log(`Total users fetched by CHOA via RLS: ${allUsers ? allUsers.length : 0}`);
         if (allUsers && allUsers.length > 0) {
             allUsers.forEach(u => console.log(`${u.first_name} ${u.last_name} | V: ${u.village_origin} | Q: ${u.quartier_nom} | S: ${u.status}`));
         } else {
             console.log("No other profiles visible! This means RLS is blocking access.");
         }
    }
}

testAccess();
