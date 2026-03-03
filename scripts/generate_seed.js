const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const password = "Racines2026!";
const crypthash = `crypt('${password}', gen_salt('bf'))`;

function getAvatarUrl(fName, lName) {
    const cleanFName = fName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").charAt(0);
    const cleanLName = lName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").charAt(0);
    return `https://ui-avatars.com/api/?name=${cleanFName}+${cleanLName}&background=random&color=fff`;
}

function getRandomDate(start, end) {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
}

function getPhone() {
    return `+225 07 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`;
}

const familles = {
    gbeya: [
        { first_name: "Kwassi", last_name: "GBÉYA", rel: "Père", role: "user", is_deceased: true, disease_type: "naturel", country: "CI", city: "Abidjan", job: "Ancien Planteur", gender: "M", birth_date: getRandomDate(new Date(1940, 0, 1), new Date(1950, 0, 1)), enfants: 7 },
        { first_name: "Ahou", last_name: "ZOGBO", rel: "Mère", role: "user", is_deceased: true, disease_type: "naturel", country: "CI", city: "Abidjan", job: "Ménagère", gender: "F", birth_date: getRandomDate(new Date(1945, 0, 1), new Date(1955, 0, 1)), enfants: 7 },
        { first_name: "Michel", last_name: "GBÉYA", rel: "Enfant", country: "FR", city: "Paris", job: "Médecin", etudes: "Doctorat", diplomes: "Doctorat en Médecine", gender: "M", birth_date: getRandomDate(new Date(1970, 0, 1), new Date(1975, 0, 1)), enfants: 3 },
        { first_name: "Serge", last_name: "GBÉYA", rel: "Enfant", is_deceased: true, disease_type: "naturel", country: "CI", city: "Abidjan", job: "Professeur", gender: "M", birth_date: getRandomDate(new Date(1972, 0, 1), new Date(1977, 0, 1)), enfants: 2 },
        { first_name: "Alain", last_name: "GBÉYA", rel: "Enfant", is_deceased: true, disease_type: "2010_crisis", country: "CI", city: "Toa-Zéo", job: "Commerçant", gender: "M", birth_date: getRandomDate(new Date(1975, 0, 1), new Date(1980, 0, 1)), enfants: 4 },
        { first_name: "Marie", last_name: "GBÉYA", rel: "Enfant", country: "US", city: "New York", job: "Infirmière", etudes: "BAC+3", diplomes: "Licence en Soins", gender: "F", birth_date: getRandomDate(new Date(1978, 0, 1), new Date(1982, 0, 1)), enfants: 1 },
        { first_name: "Paul", last_name: "GBÉYA", rel: "Enfant", country: "CA", city: "Montréal", job: "Ingénieur IT", etudes: "BAC+5", diplomes: "Master Informatique", gender: "M", birth_date: getRandomDate(new Date(1980, 0, 1), new Date(1985, 0, 1)), enfants: 2 },
        // 12 petits enfants
        ...Array.from({ length: 12 }).map((_, i) => ({ first_name: `Petit-enfant ${i + 1}`, last_name: "GBÉYA", rel: "Petit-enfant", is_deceased: i < 3 ? true : false, disease_type: i < 3 ? "2010_crisis" : null, country: i % 2 === 0 ? "FR" : "CI", city: i % 2 === 0 ? "Lyon" : "Abidjan", job: "Étudiant", etudes: "BAC", diplomes: "Baccalauréat", gender: i % 2 === 0 ? "F" : "M", birth_date: getRandomDate(new Date(1995, 0, 1), new Date(2005, 0, 1)), enfants: 0 })),
        // 6 arrière petits enfants
        ...Array.from({ length: 6 }).map((_, i) => ({ first_name: `Arrière-petit-enfant ${i + 1}`, last_name: "GBÉYA", rel: "Arrière", country: "FR", city: "Paris", job: "Écolier", gender: i % 2 === 0 ? "M" : "F", birth_date: getRandomDate(new Date(2015, 0, 1), new Date(2022, 0, 1)), enfants: 0 }))
    ],
    bonye: [
        { first_name: "Zadi", last_name: "BONYÉ", rel: "Père", is_deceased: true, disease_type: "naturel", country: "CI", city: "Bouaflé", job: "Chef de terre", gender: "M", birth_date: getRandomDate(new Date(1942, 0, 1), new Date(1948, 0, 1)), enfants: 6 },
        { first_name: "Gisèle", last_name: "TOHOURI", rel: "Mère", is_deceased: true, disease_type: "naturel", country: "CI", city: "Bouaflé", job: "Commerçante", gender: "F", birth_date: getRandomDate(new Date(1948, 0, 1), new Date(1956, 0, 1)), enfants: 6 },
        { first_name: "Koudou", last_name: "BONYÉ", rel: "Enfant", country: "CI", city: "Abidjan", job: "Avocat", etudes: "BAC+5", diplomes: "Master Droit", gender: "M", birth_date: getRandomDate(new Date(1972, 0, 1), new Date(1978, 0, 1)), enfants: 3 },
        { first_name: "Brigitte", last_name: "BONYÉ", rel: "Enfant", country: "CI", city: "Oumé", job: "Institutrice", etudes: "BAC+3", diplomes: "Licence", gender: "F", birth_date: getRandomDate(new Date(1975, 0, 1), new Date(1980, 0, 1)), enfants: 4 },
        { first_name: "Marcel", last_name: "BONYÉ", rel: "Enfant", country: "CI", city: "Dabou", job: "Agent Maritime", gender: "M", birth_date: getRandomDate(new Date(1978, 0, 1), new Date(1985, 0, 1)), enfants: 2 },
        { first_name: "Lucie", last_name: "BONYÉ", rel: "Enfant", country: "GB", city: "Londres", job: "Analyste", etudes: "BAC+5", diplomes: "Master Finance", gender: "F", birth_date: getRandomDate(new Date(1980, 0, 1), new Date(1988, 0, 1)), enfants: 1 },
        { first_name: "Yves", last_name: "BONYÉ", rel: "Enfant", country: "DE", city: "Berlin", job: "Architecte", etudes: "BAC+5", diplomes: "Master Architecture", gender: "M", birth_date: getRandomDate(new Date(1982, 0, 1), new Date(1990, 0, 1)), enfants: 2 },
        { first_name: "Jean", last_name: "BONYÉ", rel: "Enfant", is_deceased: true, disease_type: "2010_crisis", country: "CI", city: "Abidjan", gender: "M", birth_date: getRandomDate(new Date(1985, 0, 1), new Date(1992, 0, 1)), enfants: 0 },
        // 12 petits enfants
        ...Array.from({ length: 12 }).map((_, i) => ({ first_name: `Petit-enfant ${i + 1}`, last_name: "BONYÉ", rel: "Petit-enfant", is_deceased: i === 0 ? true : false, disease_type: i === 0 ? "2010_crisis" : null, country: i < 3 ? "IT" : "CI", city: i < 3 ? "Milan" : "Abidjan", job: "Étudiant", etudes: "BAC+2", diplomes: "BTS", gender: i % 2 === 0 ? "F" : "M", birth_date: getRandomDate(new Date(1998, 0, 1), new Date(2008, 0, 1)), enfants: 0 }))
    ]
};

let sqlOutput = `
-- =====================================================================
-- RACINES+ — Données de Test Avancées (Option C - 60 Profils COMPLETS)
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Création de la table Mémorial si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS public.memorial_victims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    prenoms VARCHAR(255) NOT NULL,
    genre VARCHAR(50),
    age_approximatif INTEGER,
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    quartier_nom VARCHAR(255),
    description_circonstances TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation RLS simple pour le mémorial
ALTER TABLE public.memorial_victims ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'memorial_victims' AND policyname = 'Lecture publique du memorial'
    ) THEN
        CREATE POLICY "Lecture publique du memorial" ON public.memorial_victims FOR SELECT USING (true);
    END IF;
END $$;

DO $$
DECLARE
    -- Utilisateurs 15 originaux
    id_kwame     UUID := '11111111-0000-4000-a000-000000000001';
    id_pere      UUID := '11111111-0000-4000-a000-000000000002';
    id_mere      UUID := '11111111-0000-4000-a000-000000000003';
    id_frere1    UUID := '11111111-0000-4000-a000-000000000004';
    id_frere2    UUID := '11111111-0000-4000-a000-000000000005';
    id_frere3    UUID := '11111111-0000-4000-a000-000000000006';
    id_soeur1    UUID := '11111111-0000-4000-a000-000000000007';
    id_soeur2    UUID := '11111111-0000-4000-a000-000000000008';
    id_soeur3    UUID := '11111111-0000-4000-a000-000000000009';
    id_soeur4    UUID := '11111111-0000-4000-a000-000000000010';
    id_user_ab   UUID := '22222222-0000-4000-b000-000000000001';
    id_user_bk   UUID := '22222222-0000-4000-b000-000000000002';
    id_user_dl   UUID := '22222222-0000-4000-b000-000000000003';
    id_user_dk   UUID := '22222222-0000-4000-b000-000000000004';
    id_user_gb   UUID := '22222222-0000-4000-b000-000000000005';
BEGIN
`;

const the15Ids = [
    { id: 'id_kwame', email: 'kwame.gbeya@test-racines.com', fname: 'Kwame', lname: 'GBÉYA', q: 'Gbéya', country: 'FR', city: 'Paris', gender: 'M', birth: '1985-06-12', role: 'admin', enfants: 2 },
    { id: 'id_pere', email: 'kofi.gbeya.pere@test-racines.com', fname: 'Kofi', lname: 'GBÉYA', q: 'Gbéya', country: 'BE', city: 'Bruxelles', gender: 'M', birth: '1955-03-22', role: 'cho', enfants: 8 },
    { id: 'id_mere', email: 'ama.gbeya.mere@test-racines.com', fname: 'Ama', lname: 'ASSI', q: 'Gbéya', country: 'GB', city: 'Londres', gender: 'F', birth: '1960-11-05', role: 'user', enfants: 8 },
    { id: 'id_frere1', email: 'yao.gbeya1@test-racines.com', fname: 'Yao', lname: 'GBÉYA', q: 'Gbéya', country: 'FR', city: 'Lyon', gender: 'M', birth: '1980-01-15', role: 'user', enfants: 3 },
    { id: 'id_frere2', email: 'koffi.gbeya2@test-racines.com', fname: 'Koffi', lname: 'GBÉYA', q: 'Gbéya', country: 'CA', city: 'Montréal', gender: 'M', birth: '1982-08-30', role: 'user', enfants: 1 },
    { id: 'id_frere3', email: 'ekra.gbeya3@test-racines.com', fname: 'Ekra', lname: 'GBÉYA', q: 'Gbéya', country: 'US', city: 'New York', gender: 'M', birth: '1988-12-10', role: 'user', enfants: 0 },
    { id: 'id_soeur1', email: 'akissi.gbeya1@test-racines.com', fname: 'Akissi', lname: 'GBÉYA', q: 'Gbéya', country: 'DE', city: 'Berlin', gender: 'F', birth: '1978-04-18', role: 'user', enfants: 4 },
    { id: 'id_soeur2', email: 'adjoua.gbeya2@test-racines.com', fname: 'Adjoua', lname: 'GBÉYA', q: 'Gbéya', country: 'GB', city: 'Manchester', gender: 'F', birth: '1984-09-25', role: 'user', enfants: 2 },
    { id: 'id_soeur3', email: 'bintou.gbeya3@test-racines.com', fname: 'Bintou', lname: 'GBÉYA', q: 'Gbéya', country: 'BE', city: 'Liège', gender: 'F', birth: '1987-02-14', role: 'user', enfants: 1 },
    { id: 'id_soeur4', email: 'mariama.gbeya4@test-racines.com', fname: 'Mariama', lname: 'GBÉYA', q: 'Gbéya', country: 'SN', city: 'Dakar', gender: 'F', birth: '1990-07-08', role: 'user', enfants: 0 },
    { id: 'id_user_ab', email: 'soro.gbeka.abidjan@test-racines.com', fname: 'Soro', lname: 'GBÉKA', q: 'Gbéya', country: 'CI', city: 'Abidjan', gender: 'M', birth: '1985-05-20', role: 'user', enfants: 2 },
    { id: 'id_user_bk', email: 'gnagne.bonye.bouake@test-racines.com', fname: 'Gnagne', lname: 'BONYÉ', q: 'Bonyé', country: 'CI', city: 'Bouaké', gender: 'M', birth: '1982-10-12', role: 'user', enfants: 3 },
    { id: 'id_user_dl', email: 'kouame.zouhae.daloa@test-racines.com', fname: 'Kouamé', lname: 'ZOUHAÉ', q: 'Zouhaé', country: 'CI', city: 'Daloa', gender: 'M', birth: '1979-01-05', role: 'user', enfants: 4 },
    { id: 'id_user_dk', email: 'n_da.gaho.duekoue@test-racines.com', fname: "N'Da", lname: 'GAHO', q: 'Gaho', country: 'CI', city: 'Duékoué', gender: 'F', birth: '1992-08-16', role: 'user', enfants: 1 },
    { id: 'id_user_gb', email: 'ahou.gbeka.grandbassam@test-racines.com', fname: 'Ahou', lname: 'GBÉKA', q: 'Gbéya', country: 'CI', city: 'Grand Bassam', gender: 'F', birth: '1995-11-22', role: 'user', enfants: 0 }
];

the15Ids.forEach(u => {
    let phone = getPhone();
    sqlOutput += `
INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (${u.id}, '${u.email}', crypt('${password}', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    ${u.id}, '${u.fname.replace(/'/g, "''")}', '${u.lname.replace(/'/g, "''")}', '${u.email}', 'confirmed', '${u.role}', '${u.q}', 'Toa-Zéo', 
    '${u.country}', '${u.city}', '${u.gender}', '${u.birth}', '${phone}', '${phone}', ${u.enfants}, 'Adresse Principale, ${u.city}', '${getAvatarUrl(u.fname, u.lname)}', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;
`;
});

let txtOutput = `=== IDENTIFIANTS RACINES+ (60 UTILISATEURS) ===\n`;
txtOutput += `Mot de passe unique pour TOUS les comptes : ${password}\n\n`;
txtOutput += `--- LES 15 DE BASE ---\n`;
the15Ids.forEach(u => txtOutput += `${u.fname} ${u.lname} [${u.role.toUpperCase()}] : ${u.email}\n`);

// Create 45 users
let allNewUsers = [];
familles.gbeya.forEach((u, i) => allNewUsers.push({ ...u, q: 'Gbéya', num: i + 1 }));
familles.bonye.forEach((u, i) => allNewUsers.push({ ...u, q: 'Bonyé', num: i + 1 }));

txtOutput += `\n--- NOUVEAUX 45 (GBÉYA & BONYÉ) ---\n`;

allNewUsers.forEach((u, idx) => {
    let email = `${u.first_name.toLowerCase().replace(/[^a-z]/g, '')}.${u.last_name.toLowerCase()}@test-racines.com`;
    // ensure unique email
    email = email.replace('@', `${idx}@`);
    const phone = getPhone();

    // Déterminer un pseudo-UUID stable basé sur l'index pour éviter les conflits lors de relances du script
    const hash = crypto.createHash('md5').update(`user_${idx}_${email}`).digest('hex');
    const stableUUID = `${hash.substr(0, 8)}-${hash.substr(8, 4)}-4${hash.substr(13, 3)}-8${hash.substr(17, 3)}-${hash.substr(20, 12)}`;
    let id_var = `'${stableUUID}'`;

    txtOutput += `${u.first_name} ${u.last_name} (${u.q} - ${u.rel}) : ${email}\n`;

    // Auth user
    sqlOutput += `
INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (${id_var}, '${email}', crypt('${password}', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
`;

    // Profile (avec DO UPDATE de chaque champ en cas de conflit dû à un trigger de Supabase)
    sqlOutput += `
INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    ${id_var}, '${u.first_name.replace(/'/g, "''")}', '${u.last_name.replace(/'/g, "''")}', '${email}', 
    'confirmed', 'user', '${u.q}', 'Toa-Zéo', '${u.country}', '${u.city}', 
    ${u.job ? `'${u.job}'` : 'NULL'}, ${u.etudes ? `'${u.etudes}'` : 'NULL'}, ${u.diplomes ? `'${u.diplomes}'` : 'NULL'}, ${u.job ? `'${u.job}'` : 'NULL'},
    '${u.gender}', '${u.birth_date}', '${phone}', '${phone}', ${u.enfants}, 'Quartier Résidentiel, ${u.city}',
    '${getAvatarUrl(u.first_name, u.last_name)}', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();
`;

    if (u.disease_type === '2010_crisis') {
        const hashMem = crypto.createHash('md5').update(`mem_${idx}_${email}`).digest('hex');
        let memId = `'${hashMem.substr(0, 8)}-${hashMem.substr(8, 4)}-4${hashMem.substr(13, 3)}-8${hashMem.substr(17, 3)}-${hashMem.substr(20, 12)}'`;
        sqlOutput += `
INSERT INTO public.memorial_victims (id, nom, prenoms, genre, age_approximatif, quartier_nom, description_circonstances, is_verified, created_at, updated_at)
VALUES (${memId}, '${u.last_name.replace(/'/g, "''")}', '${u.first_name.replace(/'/g, "''")}', '${u.gender}', 35, '${u.q}', 'Victime tragique de la crise de 2010 à son domicile', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom;
`;
    }
});

sqlOutput += `
END $$;
`;

fs.writeFileSync(path.join(__dirname, 'seed_familles_c.sql'), sqlOutput);
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'identifiants_familles.txt'), txtOutput);

console.log('Script SQL généré avec succès. Nouveauté: Profils 100% complets (téléphones, enfants, diplômes, rôles, genre, dates, etc) !');
