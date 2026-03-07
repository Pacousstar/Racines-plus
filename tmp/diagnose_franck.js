
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckrwulviamfxeyrtbtzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcnd1bHZpYW1meGV5cnRidHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYyNzYzMSwiZXhwIjoyMDg3MjAzNjMxfQ.TfdJhypBCWKnfB9U6-eow4jkCFBa93OC_qQnUZcBZg4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseFranck() {
    console.log("--- Diagnostic Franck GOUSSE ---");
    const { data: franck, error: err1 } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, village_origin, status, role')
        .ilike('last_name', '%GOUSSE%');

    if (err1) console.error(err1);
    else console.log(JSON.stringify(franck, null, 2));
}

diagnoseFranck();
