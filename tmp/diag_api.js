require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
    // 1. Connection as Pacous
    const email = 'pacous2000@gmail.com';
    const pwd = 'RacinesPlus2024'; // Je vais utiliser la méthode login OTP ou changer le mdp ? Non, mieux: on exécute l'API Route localement en fetch de dev
}

main().catch(console.error);
