
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckrwulviamfxeyrtbtzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcnd1bHZpYW1meGV5cnRidHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYyNzYzMSwiZXhwIjoyMDg3MjAzNjMxfQ.TfdJhypBCWKnfB9U6-eow4jkCFBa93OC_qQnUZcBZg4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkProfiles();
