const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckrwulviamfxeyrtbtzd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createLajorbone() {
    console.log('Creating Auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'lajorbone.kone@test.com',
        password: 'Test1234!',
        email_confirm: true,
    });

    let userId;
    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log('User already exists in Auth, fetching ID...');
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existingUser = listData.users.find(u => u.email === 'lajorbone.kone@test.com');
            userId = existingUser.id;
        } else {
            console.error('Error creating Auth user:', authError);
            return;
        }
    } else {
        userId = authData.user.id;
        console.log('Auth user created:', userId);
    }

    const profile = {
        id: userId,
        first_name: 'Lajorbone',
        last_name: 'Kone',
        birth_date: '1995-05-20',
        gender: 'Homme',
        village_origin: 'Toa-Zéo',
        quartier_nom: 'Gbéya',
        residence_country: 'CI',
        residence_city: 'Abidjan',
        phone_1: '+2250700000001',
        role: 'user',
        status: 'pending',
        metadata: {
            father_first_name: 'Moussa',
            father_last_name: 'Kone',
            father_status: 'Vivant',
            father_birth_date: '1965-10-10',
            mother_first_name: 'Aminata',
            mother_last_name: 'Kone',
            mother_status: 'Vivante',
            mother_birth_date: '1970-12-12'
        },
        updated_at: new Date().toISOString()
    };

    console.log('Upserting profile...');
    const { error: profileError } = await supabase.from('profiles').upsert(profile);

    if (profileError) {
        console.error('Error creating profile:', profileError);
    } else {
        console.log('Profile created/updated successfully for Lajorbone Kone');
    }
}

createLajorbone();
