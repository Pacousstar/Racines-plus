import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcoded for this script only
const SUPABASE_URL = 'https://ckrwulviamfxeyrtbtzd.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcnd1bHZpYW1meGV5cnRidHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYyNzYzMSwiZXhwIjoyMDg3MjAzNjMxfQ.TfdJhypBCWKnfB9U6-eow4jkCFBa93OC_qQnUZcBZg4';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Please provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment constraints.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const defaultPassword = 'Password123!';
const generatedUsers = [];

// Helper to create a user and profile
async function createMember(memberConfig) {
    const { email, first_name, last_name, gender, birth_date, residence_country, residence_city,
        village_origin, quartier_nom, role, status, father_first_name, father_last_name, mother_first_name, mother_last_name,
        is_deceased = false, deceased_nature = null, is_victim_2010 = false, contact_phone = '',
        father_status = 'Vivant', mother_status = 'Vivante'
    } = memberConfig;

    // Create Auth User
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { first_name, last_name, role: role || 'user' }
    });

    if (authErr && authErr.message !== 'User already registered') {
        console.error(`Error creating auth for ${email}:`, authErr.message);
        return null;
    }

    // If user already exists, we might just fetch their ID, but for seed we assume fresh emails.
    const userId = authData?.user?.id;
    if (!userId) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single();
        if (existing) return existing.id;
        return null;
    }

    // Create Profile
    const initials = (first_name[0] + last_name[0]).toUpperCase();
    const avatar_url = `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff`;

    const profileData = {
        id: userId,
        first_name,
        last_name,
        email,
        role: role || 'user',
        village_origin,
        quartier_nom,
        gender,
        birth_date,
        residence_country,
        residence_city,
        status: status || 'confirmed',
        father_first_name,
        father_last_name,
        father_status: is_deceased && !mother_last_name ? 'Décédé' : father_status, // logic approximation
        mother_first_name,
        mother_last_name,
        mother_status: is_deceased && !father_last_name ? 'Décédée' : mother_status,
        personal_lineage: {
            is_deceased,
            deceased_nature,
            is_victim_2010
        },
        avatar_url,
        choa_approvals: [],
        created_at: new Date().toISOString()
    };

    const { error: profErr } = await supabase.from('profiles').upsert(profileData);
    if (profErr) {
        console.error(`Error creating profile for ${email}:`, profErr.message);
    } else {
        generatedUsers.push({ email, password: defaultPassword, name: `${first_name} ${last_name}`, role: profileData.role, quartier: quartier_nom });
    }

    // If deceased 2010, maybe insert into victims_2010 table to be clean
    if (is_victim_2010) {
        await supabase.from('victims_2010').upsert({
            profile_id: userId,
            first_name,
            last_name,
            village_origin,
            quartier_nom,
            status: 'validated'
        });
    }

    return userId;
}

async function run() {
    console.log('Starting DB Seed for Gbéya and Bonyé families...');

    // ==========================================
    // FAMILLE 1 : GBÉYA (25 membres)
    // ==========================================
    // Founder: KOUADIO Yao (already should be an Ancestres or we create him as a profile just for deep tree testing)
    // Let's create the grandfather
    await createMember({
        email: 'gbeya.gp@racines.com', first_name: 'Kouassi', last_name: 'Gbéya', gender: 'M', birth_date: '1940-01-01',
        residence_country: 'CI', residence_city: 'Toa-Zéo', village_origin: 'Toa-Zéo', quartier_nom: 'Gbéya',
        is_deceased: true, deceased_nature: 'naturel', father_first_name: 'Yao', father_last_name: 'Gbéya', mother_first_name: 'Akissi', mother_last_name: 'Koffi'
    });
    await createMember({
        email: 'gbeya.gm@racines.com', first_name: 'Aya', last_name: 'Konan', gender: 'F', birth_date: '1945-02-02',
        residence_country: 'CI', residence_city: 'Toa-Zéo', village_origin: 'Toa-Zéo', quartier_nom: 'Gbéya',
        is_deceased: true, deceased_nature: 'naturel', father_first_name: 'Kouamé', father_last_name: 'Konan', mother_first_name: 'Adjoua', mother_last_name: 'Brou'
    });

    // Parents (Génération 2)
    await createMember({
        email: 'gbeya.p1@racines.com', first_name: 'Koffi', last_name: 'Gbéya', gender: 'M', birth_date: '1965-05-10',
        residence_country: 'FR', residence_city: 'Paris', village_origin: 'Toa-Zéo', quartier_nom: 'Gbéya',
        father_first_name: 'Kouassi', father_last_name: 'Gbéya', mother_first_name: 'Aya', mother_last_name: 'Konan'
    });
    await createMember({
        email: 'gbeya.p2@racines.com', first_name: 'Amenan', last_name: 'Gbéya', gender: 'F', birth_date: '1968-08-15',
        residence_country: 'CI', residence_city: 'Abidjan', village_origin: 'Toa-Zéo', quartier_nom: 'Gbéya',
        is_deceased: true, is_victim_2010: true, deceased_nature: 'crise',
        father_first_name: 'Kouassi', father_last_name: 'Gbéya', mother_first_name: 'Aya', mother_last_name: 'Konan'
    });

    // Enfants de P1 (Diaspora US, CA, BE)
    await createMember({
        email: 'gbeya.e1.us@racines.com', first_name: 'Jean', last_name: 'Gbéya', gender: 'M', birth_date: '1990-10-20',
        residence_country: 'US', residence_city: 'New York', village_origin: 'Toa-Zéo', quartier_nom: 'Gbéya',
        father_first_name: 'Koffi', father_last_name: 'Gbéya', mother_first_name: 'Marie', mother_last_name: 'Béchio'
    });
    await createMember({
        email: 'gbeya.e2.ca@racines.com', first_name: 'Luc', last_name: 'Gbéya', gender: 'M', birth_date: '1992-11-25',
        residence_country: 'CA', residence_city: 'Montréal', village_origin: 'Toa-Zéo', quartier_nom: 'Gbéya',
        father_first_name: 'Koffi', father_last_name: 'Gbéya', mother_first_name: 'Marie', mother_last_name: 'Béchio'
    });
    await createMember({
        email: 'gbeya.e3.be@racines.com', first_name: 'Sophie', last_name: 'Gbéya', gender: 'F', birth_date: '1995-12-30',
        residence_country: 'BE', residence_city: 'Bruxelles', village_origin: 'Toa-Zéo', quartier_nom: 'Gbéya',
        father_first_name: 'Koffi', father_last_name: 'Gbéya', mother_first_name: 'Marie', mother_last_name: 'Béchio'
    });

    // Générer le reste de la famille Gbéya (boucle pour atteindre 25 au total)
    // 3 natural deaths (2 GPs + 1 child), 4 crisis 2010 (P2 + 3 others)
    // 2 + 2 + 3 = 7. Let's add 18 more.
    for (let i = 4; i <= 21; i++) {
        const isCrisis = i >= 4 && i <= 6; // 3 more crisis victims
        const isNatural = i === 7; // 1 more natural
        const country = i % 2 === 0 ? 'FR' : 'CI';
        await createMember({
            email: `gbeya.extra${i}@racines.com`, first_name: `Prenom${i}`, last_name: 'Gbéya', gender: i % 2 === 0 ? 'M' : 'F', birth_date: `2000-01-0${i % 9 + 1}`,
            residence_country: country, residence_city: 'Ville', village_origin: 'Toa-Zéo', quartier_nom: 'Gbéya',
            is_deceased: isCrisis || isNatural, is_victim_2010: isCrisis, deceased_nature: isCrisis ? 'crise' : isNatural ? 'naturel' : null,
            father_first_name: 'Jean', father_last_name: 'Gbéya', mother_first_name: 'Fatou', mother_last_name: 'Diallo' // Grand-children branch
        });
    }

    // ==========================================
    // FAMILLE 2 : BONYÉ (20 membres)
    // ==========================================
    // 15 in CI (Abidjan, Bouaflé, Oumé, Dabou), 5 in Diaspora (GB, DE, etc.)
    // 2 natural deaths, 2 crisis 2010.
    const citiesCI = ['Abidjan', 'Bouaflé', 'Oumé', 'Dabou'];
    const countriesDiaspora = ['GB', 'DE', 'MA', 'SN', 'FR'];

    await createMember({
        email: 'bonye.gp@racines.com', first_name: 'Bonyé', last_name: 'Gouali', gender: 'M', birth_date: '1935-05-05',
        residence_country: 'CI', residence_city: 'Toa-Zéo', village_origin: 'Toa-Zéo', quartier_nom: 'Bonyé',
        is_deceased: true, deceased_nature: 'naturel', father_first_name: 'Gouali', father_last_name: 'Père', mother_first_name: 'Mère', mother_last_name: 'Femme'
    });
    await createMember({
        email: 'bonye.gm@racines.com', first_name: 'Sopie', last_name: 'Lou', gender: 'F', birth_date: '1940-06-06',
        residence_country: 'CI', residence_city: 'Toa-Zéo', village_origin: 'Toa-Zéo', quartier_nom: 'Bonyé',
        is_deceased: true, deceased_nature: 'naturel', father_first_name: 'Lou', father_last_name: 'Père', mother_first_name: 'Mère', mother_last_name: 'Femme'
    });

    // 18 autres membres
    for (let i = 1; i <= 18; i++) {
        const isCrisis = i === 1 || i === 2; // 2 crisis victims
        let country = 'CI';
        let city = citiesCI[i % citiesCI.length];

        if (i > 13) { // 5 in diaspora
            country = countriesDiaspora[(i - 14) % countriesDiaspora.length];
            city = 'DiasporaCity';
        }

        await createMember({
            email: `bonye.m${i}@racines.com`, first_name: `BonyPrenom${i}`, last_name: 'Gouali', gender: i % 2 === 0 ? 'M' : 'F', birth_date: `1980-02-1${i % 9}`,
            residence_country: country, residence_city: city, village_origin: 'Toa-Zéo', quartier_nom: 'Bonyé',
            is_deceased: isCrisis, is_victim_2010: isCrisis, deceased_nature: isCrisis ? 'crise' : null,
            father_first_name: 'Bonyé', father_last_name: 'Gouali', mother_first_name: 'Sopie', mother_last_name: 'Lou'
        });
    }

    // ==========================================
    // Fetch Existing Users (les 15 d'hier) + format
    // ==========================================
    console.log('Fetching old users...');
    const { data: oldProfiles } = await supabase.from('profiles').select('email, first_name, last_name, role, quartier_nom').neq('email', 'admin@racines.com').limit(15);
    if (oldProfiles) {
        for (const p of oldProfiles) {
            // Check if not already in generated
            if (!generatedUsers.find(g => g.email === p.email)) {
                generatedUsers.push({ email: p.email, password: 'Inconnu (Initialisé hier)', name: `${p.first_name} ${p.last_name}`, role: p.role, quartier: p.quartier_nom });
            }
        }
    }

    // Write MD File Artifact
    const mdContent = `# Identifiants de Connexion - Utilisateurs de Test
Ce document contient les accès pour les 45 nouveaux utilisateurs (Familles Gbéya et Bonyé) ainsi que les utilisateurs créés précédemment.

> **Mot de passe général (pour les nouveaux) :** \`${defaultPassword}\`

## Familles Générées (Gbéya & Bonyé)
| Nom Complet | Email | Rôle | Quartier |
|---|---|---|---|
${generatedUsers.map(u => `| ${u.name} | \`${u.email}\` | ${u.role} | ${u.quartier || '—'} |`).join('\n')}

*Ouvrez l'application et connectez-vous avec n'importe lequel de ces comptes pour tester la vue membre !*
`;

    const exactArtifactDest = 'C:\\Users\\GSN-EXPERTISES\\.gemini\\antigravity\\brain\\0507984a-8476-4423-add2-bac0f61480db\\test_credentials.md';
    fs.writeFileSync(exactArtifactDest, mdContent);
    console.log('Credentials written to: ' + exactArtifactDest);
    console.log('✅ Seeding complete!');
    process.exit(0);
}

run();
