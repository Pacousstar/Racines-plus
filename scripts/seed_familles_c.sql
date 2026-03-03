
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

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_kwame, 'kwame.gbeya@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_kwame, 'Kwame', 'GBÉYA', 'kwame.gbeya@test-racines.com', 'confirmed', 'admin', 'Gbéya', 'Toa-Zéo', 
    'FR', 'Paris', 'M', '1985-06-12', '+225 07 69 30 55', '+225 07 69 30 55', 2, 'Adresse Principale, Paris', 'https://ui-avatars.com/api/?name=K+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_pere, 'kofi.gbeya.pere@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_pere, 'Kofi', 'GBÉYA', 'kofi.gbeya.pere@test-racines.com', 'confirmed', 'cho', 'Gbéya', 'Toa-Zéo', 
    'BE', 'Bruxelles', 'M', '1955-03-22', '+225 07 66 88 55', '+225 07 66 88 55', 8, 'Adresse Principale, Bruxelles', 'https://ui-avatars.com/api/?name=K+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_mere, 'ama.gbeya.mere@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_mere, 'Ama', 'ASSI', 'ama.gbeya.mere@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'GB', 'Londres', 'F', '1960-11-05', '+225 07 36 15 95', '+225 07 36 15 95', 8, 'Adresse Principale, Londres', 'https://ui-avatars.com/api/?name=A+A&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_frere1, 'yao.gbeya1@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_frere1, 'Yao', 'GBÉYA', 'yao.gbeya1@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'FR', 'Lyon', 'M', '1980-01-15', '+225 07 24 64 88', '+225 07 24 64 88', 3, 'Adresse Principale, Lyon', 'https://ui-avatars.com/api/?name=Y+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_frere2, 'koffi.gbeya2@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_frere2, 'Koffi', 'GBÉYA', 'koffi.gbeya2@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'CA', 'Montréal', 'M', '1982-08-30', '+225 07 26 16 79', '+225 07 26 16 79', 1, 'Adresse Principale, Montréal', 'https://ui-avatars.com/api/?name=K+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_frere3, 'ekra.gbeya3@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_frere3, 'Ekra', 'GBÉYA', 'ekra.gbeya3@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'US', 'New York', 'M', '1988-12-10', '+225 07 19 83 59', '+225 07 19 83 59', 0, 'Adresse Principale, New York', 'https://ui-avatars.com/api/?name=E+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_soeur1, 'akissi.gbeya1@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_soeur1, 'Akissi', 'GBÉYA', 'akissi.gbeya1@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'DE', 'Berlin', 'F', '1978-04-18', '+225 07 21 28 77', '+225 07 21 28 77', 4, 'Adresse Principale, Berlin', 'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_soeur2, 'adjoua.gbeya2@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_soeur2, 'Adjoua', 'GBÉYA', 'adjoua.gbeya2@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'GB', 'Manchester', 'F', '1984-09-25', '+225 07 87 10 36', '+225 07 87 10 36', 2, 'Adresse Principale, Manchester', 'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_soeur3, 'bintou.gbeya3@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_soeur3, 'Bintou', 'GBÉYA', 'bintou.gbeya3@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'BE', 'Liège', 'F', '1987-02-14', '+225 07 30 59 54', '+225 07 30 59 54', 1, 'Adresse Principale, Liège', 'https://ui-avatars.com/api/?name=B+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_soeur4, 'mariama.gbeya4@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_soeur4, 'Mariama', 'GBÉYA', 'mariama.gbeya4@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'SN', 'Dakar', 'F', '1990-07-08', '+225 07 71 77 76', '+225 07 71 77 76', 0, 'Adresse Principale, Dakar', 'https://ui-avatars.com/api/?name=M+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_user_ab, 'soro.gbeka.abidjan@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_user_ab, 'Soro', 'GBÉKA', 'soro.gbeka.abidjan@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'CI', 'Abidjan', 'M', '1985-05-20', '+225 07 25 40 96', '+225 07 25 40 96', 2, 'Adresse Principale, Abidjan', 'https://ui-avatars.com/api/?name=S+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_user_bk, 'gnagne.bonye.bouake@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_user_bk, 'Gnagne', 'BONYÉ', 'gnagne.bonye.bouake@test-racines.com', 'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 
    'CI', 'Bouaké', 'M', '1982-10-12', '+225 07 76 60 12', '+225 07 76 60 12', 3, 'Adresse Principale, Bouaké', 'https://ui-avatars.com/api/?name=G+B&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_user_dl, 'kouame.zouhae.daloa@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_user_dl, 'Kouamé', 'ZOUHAÉ', 'kouame.zouhae.daloa@test-racines.com', 'confirmed', 'user', 'Zouhaé', 'Toa-Zéo', 
    'CI', 'Daloa', 'M', '1979-01-05', '+225 07 53 70 41', '+225 07 53 70 41', 4, 'Adresse Principale, Daloa', 'https://ui-avatars.com/api/?name=K+Z&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_user_dk, 'n_da.gaho.duekoue@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_user_dk, 'N''Da', 'GAHO', 'n_da.gaho.duekoue@test-racines.com', 'confirmed', 'user', 'Gaho', 'Toa-Zéo', 
    'CI', 'Duékoué', 'F', '1992-08-16', '+225 07 26 80 47', '+225 07 26 80 47', 1, 'Adresse Principale, Duékoué', 'https://ui-avatars.com/api/?name=N+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES (id_user_gb, 'ahou.gbeka.grandbassam@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence, avatar_url, created_at, updated_at
)
VALUES (
    id_user_gb, 'Ahou', 'GBÉKA', 'ahou.gbeka.grandbassam@test-racines.com', 'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 
    'CI', 'Grand Bassam', 'F', '1995-11-22', '+225 07 26 48 18', '+225 07 26 48 18', 0, 'Adresse Principale, Grand Bassam', 'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence, avatar_url = EXCLUDED.avatar_url;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('25d0a8ed-5652-4fa2-8f09-4c13c675f2fa', 'kwassi.gbéya0@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '25d0a8ed-5652-4fa2-8f09-4c13c675f2fa', 'Kwassi', 'GBÉYA', 'kwassi.gbéya0@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Ancien Planteur', NULL, NULL, 'Ancien Planteur',
    'M', '1949-03-24', '+225 07 53 60 47', '+225 07 53 60 47', 7, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=K+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('d113c9db-d56e-4d83-89d8-859e59c79e6a', 'ahou.zogbo1@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'd113c9db-d56e-4d83-89d8-859e59c79e6a', 'Ahou', 'ZOGBO', 'ahou.zogbo1@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Ménagère', NULL, NULL, 'Ménagère',
    'F', '1950-05-05', '+225 07 69 94 70', '+225 07 69 94 70', 7, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=A+Z&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('4005e440-4ad6-4c2f-8ce1-f06267c9dd2c', 'michel.gbéya2@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '4005e440-4ad6-4c2f-8ce1-f06267c9dd2c', 'Michel', 'GBÉYA', 'michel.gbéya2@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Paris', 
    'Médecin', 'Doctorat', 'Doctorat en Médecine', 'Médecin',
    'M', '1970-10-26', '+225 07 41 30 61', '+225 07 41 30 61', 3, 'Quartier Résidentiel, Paris',
    'https://ui-avatars.com/api/?name=M+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('9d7710be-0b50-46fb-8402-d0f7b1888ce6', 'serge.gbéya3@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '9d7710be-0b50-46fb-8402-d0f7b1888ce6', 'Serge', 'GBÉYA', 'serge.gbéya3@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Professeur', NULL, NULL, 'Professeur',
    'M', '1974-12-18', '+225 07 48 63 12', '+225 07 48 63 12', 2, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=S+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('4b509051-db6e-466d-8939-471fc82acd1b', 'alain.gbéya4@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '4b509051-db6e-466d-8939-471fc82acd1b', 'Alain', 'GBÉYA', 'alain.gbéya4@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Toa-Zéo', 
    'Commerçant', NULL, NULL, 'Commerçant',
    'M', '1979-01-09', '+225 07 99 50 43', '+225 07 99 50 43', 4, 'Quartier Résidentiel, Toa-Zéo',
    'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO public.memorial_victims (id, nom, prenoms, genre, age_approximatif, quartier_nom, description_circonstances, is_verified, created_at, updated_at)
VALUES ('2bf3b2dc-c81f-4584-8b5f-4fafeb66f606', 'GBÉYA', 'Alain', 'M', 35, 'Gbéya', 'Victime tragique de la crise de 2010 à son domicile', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('e06182a3-b631-428f-8d53-c11752e0d76c', 'marie.gbéya5@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'e06182a3-b631-428f-8d53-c11752e0d76c', 'Marie', 'GBÉYA', 'marie.gbéya5@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'US', 'New York', 
    'Infirmière', 'BAC+3', 'Licence en Soins', 'Infirmière',
    'F', '1978-09-25', '+225 07 83 56 33', '+225 07 83 56 33', 1, 'Quartier Résidentiel, New York',
    'https://ui-avatars.com/api/?name=M+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('3cfd68fb-8142-4054-8afb-9293ac80d4ab', 'paul.gbéya6@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '3cfd68fb-8142-4054-8afb-9293ac80d4ab', 'Paul', 'GBÉYA', 'paul.gbéya6@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CA', 'Montréal', 
    'Ingénieur IT', 'BAC+5', 'Master Informatique', 'Ingénieur IT',
    'M', '1983-01-23', '+225 07 10 97 68', '+225 07 10 97 68', 2, 'Quartier Résidentiel, Montréal',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('fc42ed09-4557-48a9-845e-9bb26703d71a', 'petitenfant.gbéya7@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'fc42ed09-4557-48a9-845e-9bb26703d71a', 'Petit-enfant 1', 'GBÉYA', 'petitenfant.gbéya7@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Lyon', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'F', '1997-12-30', '+225 07 97 48 18', '+225 07 97 48 18', 0, 'Quartier Résidentiel, Lyon',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO public.memorial_victims (id, nom, prenoms, genre, age_approximatif, quartier_nom, description_circonstances, is_verified, created_at, updated_at)
VALUES ('92fa900f-4a16-4f5c-8aaa-75332900ad53', 'GBÉYA', 'Petit-enfant 1', 'F', 35, 'Gbéya', 'Victime tragique de la crise de 2010 à son domicile', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('db11e143-67d6-40a0-871e-2a1d2a31febc', 'petitenfant.gbéya8@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'db11e143-67d6-40a0-871e-2a1d2a31febc', 'Petit-enfant 2', 'GBÉYA', 'petitenfant.gbéya8@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'M', '2004-09-15', '+225 07 41 83 43', '+225 07 41 83 43', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO public.memorial_victims (id, nom, prenoms, genre, age_approximatif, quartier_nom, description_circonstances, is_verified, created_at, updated_at)
VALUES ('cafb0805-06a3-4b1b-853c-52ecba046c03', 'GBÉYA', 'Petit-enfant 2', 'M', 35, 'Gbéya', 'Victime tragique de la crise de 2010 à son domicile', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('9aa6ad99-3872-4cdc-8e49-e31529e9c6c1', 'petitenfant.gbéya9@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '9aa6ad99-3872-4cdc-8e49-e31529e9c6c1', 'Petit-enfant 3', 'GBÉYA', 'petitenfant.gbéya9@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Lyon', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'F', '2003-05-14', '+225 07 36 21 29', '+225 07 36 21 29', 0, 'Quartier Résidentiel, Lyon',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO public.memorial_victims (id, nom, prenoms, genre, age_approximatif, quartier_nom, description_circonstances, is_verified, created_at, updated_at)
VALUES ('205942f8-f8a8-42f3-8829-3a7af67b4ab4', 'GBÉYA', 'Petit-enfant 3', 'F', 35, 'Gbéya', 'Victime tragique de la crise de 2010 à son domicile', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('ec304bda-a5db-4338-8b48-3c1e741e20d4', 'petitenfant.gbéya10@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'ec304bda-a5db-4338-8b48-3c1e741e20d4', 'Petit-enfant 4', 'GBÉYA', 'petitenfant.gbéya10@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'M', '2004-08-24', '+225 07 92 17 26', '+225 07 92 17 26', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('166c9564-5fb6-453b-8892-4993cd0ce0bd', 'petitenfant.gbéya11@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '166c9564-5fb6-453b-8892-4993cd0ce0bd', 'Petit-enfant 5', 'GBÉYA', 'petitenfant.gbéya11@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Lyon', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'F', '2004-05-01', '+225 07 66 70 75', '+225 07 66 70 75', 0, 'Quartier Résidentiel, Lyon',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('2a83467e-2342-40a0-80f3-3d911677573d', 'petitenfant.gbéya12@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '2a83467e-2342-40a0-80f3-3d911677573d', 'Petit-enfant 6', 'GBÉYA', 'petitenfant.gbéya12@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'M', '2001-05-16', '+225 07 30 66 80', '+225 07 30 66 80', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('8026188f-a1e0-4851-8942-c2acbc20bdbf', 'petitenfant.gbéya13@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '8026188f-a1e0-4851-8942-c2acbc20bdbf', 'Petit-enfant 7', 'GBÉYA', 'petitenfant.gbéya13@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Lyon', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'F', '1995-11-26', '+225 07 32 59 41', '+225 07 32 59 41', 0, 'Quartier Résidentiel, Lyon',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('ac732cd0-57fe-404b-829e-6d408a2aa2e1', 'petitenfant.gbéya14@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'ac732cd0-57fe-404b-829e-6d408a2aa2e1', 'Petit-enfant 8', 'GBÉYA', 'petitenfant.gbéya14@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'M', '1999-02-28', '+225 07 43 21 51', '+225 07 43 21 51', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('6f6c1f71-16e5-46ce-84e8-5516ef979fbe', 'petitenfant.gbéya15@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '6f6c1f71-16e5-46ce-84e8-5516ef979fbe', 'Petit-enfant 9', 'GBÉYA', 'petitenfant.gbéya15@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Lyon', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'F', '1996-03-07', '+225 07 58 59 33', '+225 07 58 59 33', 0, 'Quartier Résidentiel, Lyon',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('8084b806-6f2b-4480-8845-b9a127a56dd7', 'petitenfant.gbéya16@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '8084b806-6f2b-4480-8845-b9a127a56dd7', 'Petit-enfant 10', 'GBÉYA', 'petitenfant.gbéya16@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'M', '1996-03-01', '+225 07 39 17 53', '+225 07 39 17 53', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('12234261-dc74-46e8-83f9-b6d11a72703f', 'petitenfant.gbéya17@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '12234261-dc74-46e8-83f9-b6d11a72703f', 'Petit-enfant 11', 'GBÉYA', 'petitenfant.gbéya17@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Lyon', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'F', '2001-09-04', '+225 07 21 57 11', '+225 07 21 57 11', 0, 'Quartier Résidentiel, Lyon',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('8a99d0ec-5201-4614-8413-726c77870566', 'petitenfant.gbéya18@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '8a99d0ec-5201-4614-8413-726c77870566', 'Petit-enfant 12', 'GBÉYA', 'petitenfant.gbéya18@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC', 'Baccalauréat', 'Étudiant',
    'M', '2001-12-04', '+225 07 47 70 65', '+225 07 47 70 65', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('ca9dce06-87c2-46f0-86aa-4d4712fee6d0', 'arrirepetitenfant.gbéya19@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'ca9dce06-87c2-46f0-86aa-4d4712fee6d0', 'Arrière-petit-enfant 1', 'GBÉYA', 'arrirepetitenfant.gbéya19@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Paris', 
    'Écolier', NULL, NULL, 'Écolier',
    'M', '2016-09-25', '+225 07 51 17 82', '+225 07 51 17 82', 0, 'Quartier Résidentiel, Paris',
    'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('14a54adb-d5a0-4858-8644-bf66b9045114', 'arrirepetitenfant.gbéya20@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '14a54adb-d5a0-4858-8644-bf66b9045114', 'Arrière-petit-enfant 2', 'GBÉYA', 'arrirepetitenfant.gbéya20@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Paris', 
    'Écolier', NULL, NULL, 'Écolier',
    'F', '2017-10-29', '+225 07 13 91 13', '+225 07 13 91 13', 0, 'Quartier Résidentiel, Paris',
    'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('60d6afe5-9be3-451d-81b4-7f351f74c05e', 'arrirepetitenfant.gbéya21@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '60d6afe5-9be3-451d-81b4-7f351f74c05e', 'Arrière-petit-enfant 3', 'GBÉYA', 'arrirepetitenfant.gbéya21@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Paris', 
    'Écolier', NULL, NULL, 'Écolier',
    'M', '2018-01-19', '+225 07 48 84 37', '+225 07 48 84 37', 0, 'Quartier Résidentiel, Paris',
    'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('f9f9de29-19e7-4ee0-82dd-d3804f3cf761', 'arrirepetitenfant.gbéya22@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'f9f9de29-19e7-4ee0-82dd-d3804f3cf761', 'Arrière-petit-enfant 4', 'GBÉYA', 'arrirepetitenfant.gbéya22@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Paris', 
    'Écolier', NULL, NULL, 'Écolier',
    'F', '2019-06-29', '+225 07 20 33 41', '+225 07 20 33 41', 0, 'Quartier Résidentiel, Paris',
    'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('f917a914-347c-47c6-8501-9fda4186c134', 'arrirepetitenfant.gbéya23@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'f917a914-347c-47c6-8501-9fda4186c134', 'Arrière-petit-enfant 5', 'GBÉYA', 'arrirepetitenfant.gbéya23@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Paris', 
    'Écolier', NULL, NULL, 'Écolier',
    'M', '2021-04-03', '+225 07 87 16 41', '+225 07 87 16 41', 0, 'Quartier Résidentiel, Paris',
    'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('634b5ab1-fd3a-4ed0-8065-b6207c171a00', 'arrirepetitenfant.gbéya24@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '634b5ab1-fd3a-4ed0-8065-b6207c171a00', 'Arrière-petit-enfant 6', 'GBÉYA', 'arrirepetitenfant.gbéya24@test-racines.com', 
    'confirmed', 'user', 'Gbéya', 'Toa-Zéo', 'FR', 'Paris', 
    'Écolier', NULL, NULL, 'Écolier',
    'F', '2017-02-16', '+225 07 73 30 95', '+225 07 73 30 95', 0, 'Quartier Résidentiel, Paris',
    'https://ui-avatars.com/api/?name=A+G&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('daedbc6f-b040-41b0-8443-ab386cc5e289', 'zadi.bonyé25@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'daedbc6f-b040-41b0-8443-ab386cc5e289', 'Zadi', 'BONYÉ', 'zadi.bonyé25@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Bouaflé', 
    'Chef de terre', NULL, NULL, 'Chef de terre',
    'M', '1943-10-11', '+225 07 85 43 16', '+225 07 85 43 16', 6, 'Quartier Résidentiel, Bouaflé',
    'https://ui-avatars.com/api/?name=Z+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('6f2d17a6-e080-4671-8bb8-39f81674d4b1', 'gisle.tohouri26@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '6f2d17a6-e080-4671-8bb8-39f81674d4b1', 'Gisèle', 'TOHOURI', 'gisle.tohouri26@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Bouaflé', 
    'Commerçante', NULL, NULL, 'Commerçante',
    'F', '1954-08-11', '+225 07 37 15 39', '+225 07 37 15 39', 6, 'Quartier Résidentiel, Bouaflé',
    'https://ui-avatars.com/api/?name=G+T&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('54f8b96f-7c49-4593-8ebc-c460a25fd16b', 'koudou.bonyé27@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '54f8b96f-7c49-4593-8ebc-c460a25fd16b', 'Koudou', 'BONYÉ', 'koudou.bonyé27@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Avocat', 'BAC+5', 'Master Droit', 'Avocat',
    'M', '1977-12-30', '+225 07 58 84 22', '+225 07 58 84 22', 3, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=K+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('88936c9c-17c5-4512-8ad3-f4d4f16df14a', 'brigitte.bonyé28@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '88936c9c-17c5-4512-8ad3-f4d4f16df14a', 'Brigitte', 'BONYÉ', 'brigitte.bonyé28@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Oumé', 
    'Institutrice', 'BAC+3', 'Licence', 'Institutrice',
    'F', '1978-08-29', '+225 07 16 72 24', '+225 07 16 72 24', 4, 'Quartier Résidentiel, Oumé',
    'https://ui-avatars.com/api/?name=B+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('69c378d1-5673-41fa-8f77-c46c9336cbed', 'marcel.bonyé29@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '69c378d1-5673-41fa-8f77-c46c9336cbed', 'Marcel', 'BONYÉ', 'marcel.bonyé29@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Dabou', 
    'Agent Maritime', NULL, NULL, 'Agent Maritime',
    'M', '1981-08-16', '+225 07 33 55 63', '+225 07 33 55 63', 2, 'Quartier Résidentiel, Dabou',
    'https://ui-avatars.com/api/?name=M+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('ca95fd35-bd18-4958-8db0-5a9da3386c3a', 'lucie.bonyé30@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'ca95fd35-bd18-4958-8db0-5a9da3386c3a', 'Lucie', 'BONYÉ', 'lucie.bonyé30@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'GB', 'Londres', 
    'Analyste', 'BAC+5', 'Master Finance', 'Analyste',
    'F', '1984-06-27', '+225 07 93 39 79', '+225 07 93 39 79', 1, 'Quartier Résidentiel, Londres',
    'https://ui-avatars.com/api/?name=L+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('642b8764-02e1-45fe-83d8-ebea3b006752', 'yves.bonyé31@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '642b8764-02e1-45fe-83d8-ebea3b006752', 'Yves', 'BONYÉ', 'yves.bonyé31@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'DE', 'Berlin', 
    'Architecte', 'BAC+5', 'Master Architecture', 'Architecte',
    'M', '1983-02-04', '+225 07 37 85 26', '+225 07 37 85 26', 2, 'Quartier Résidentiel, Berlin',
    'https://ui-avatars.com/api/?name=Y+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('5503b309-14cc-4d50-8968-be57f0ef9813', 'jean.bonyé32@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '5503b309-14cc-4d50-8968-be57f0ef9813', 'Jean', 'BONYÉ', 'jean.bonyé32@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    NULL, NULL, NULL, NULL,
    'M', '1986-03-26', '+225 07 77 42 92', '+225 07 77 42 92', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=J+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO public.memorial_victims (id, nom, prenoms, genre, age_approximatif, quartier_nom, description_circonstances, is_verified, created_at, updated_at)
VALUES ('62d8cf1e-ebca-4132-8ef5-67537203f7d8', 'BONYÉ', 'Jean', 'M', 35, 'Bonyé', 'Victime tragique de la crise de 2010 à son domicile', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('e457612a-f82e-48d5-8187-ba60bc806f8b', 'petitenfant.bonyé33@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'e457612a-f82e-48d5-8187-ba60bc806f8b', 'Petit-enfant 1', 'BONYÉ', 'petitenfant.bonyé33@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'IT', 'Milan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'F', '2000-12-26', '+225 07 87 99 68', '+225 07 87 99 68', 0, 'Quartier Résidentiel, Milan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO public.memorial_victims (id, nom, prenoms, genre, age_approximatif, quartier_nom, description_circonstances, is_verified, created_at, updated_at)
VALUES ('f9188b6e-72a0-43f2-885e-bbdc69dd1f3c', 'BONYÉ', 'Petit-enfant 1', 'F', 35, 'Bonyé', 'Victime tragique de la crise de 2010 à son domicile', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom;

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('fe127d29-ae97-40ab-863c-e09cb08d73d0', 'petitenfant.bonyé34@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'fe127d29-ae97-40ab-863c-e09cb08d73d0', 'Petit-enfant 2', 'BONYÉ', 'petitenfant.bonyé34@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'IT', 'Milan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'M', '2004-08-13', '+225 07 38 12 35', '+225 07 38 12 35', 0, 'Quartier Résidentiel, Milan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('298f1b2a-2280-40f8-8ccc-fe38bdb02a12', 'petitenfant.bonyé35@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '298f1b2a-2280-40f8-8ccc-fe38bdb02a12', 'Petit-enfant 3', 'BONYÉ', 'petitenfant.bonyé35@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'IT', 'Milan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'F', '2007-11-01', '+225 07 10 86 17', '+225 07 10 86 17', 0, 'Quartier Résidentiel, Milan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('4da3c0aa-520c-4d19-8af7-42b0e01514d9', 'petitenfant.bonyé36@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '4da3c0aa-520c-4d19-8af7-42b0e01514d9', 'Petit-enfant 4', 'BONYÉ', 'petitenfant.bonyé36@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'M', '2007-06-25', '+225 07 69 11 74', '+225 07 69 11 74', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('ebec932b-12cd-42aa-897f-d4c533e2b97d', 'petitenfant.bonyé37@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'ebec932b-12cd-42aa-897f-d4c533e2b97d', 'Petit-enfant 5', 'BONYÉ', 'petitenfant.bonyé37@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'F', '2007-09-16', '+225 07 86 31 82', '+225 07 86 31 82', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('91595956-3d93-449a-88fb-43dc15437daa', 'petitenfant.bonyé38@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '91595956-3d93-449a-88fb-43dc15437daa', 'Petit-enfant 6', 'BONYÉ', 'petitenfant.bonyé38@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'M', '2000-01-09', '+225 07 62 68 60', '+225 07 62 68 60', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('45079a58-0058-4f4e-8c22-e211a0c5d524', 'petitenfant.bonyé39@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '45079a58-0058-4f4e-8c22-e211a0c5d524', 'Petit-enfant 7', 'BONYÉ', 'petitenfant.bonyé39@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'F', '1998-09-10', '+225 07 85 41 11', '+225 07 85 41 11', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('d44d73b4-1cd8-4dbf-81a5-f147096d0546', 'petitenfant.bonyé40@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    'd44d73b4-1cd8-4dbf-81a5-f147096d0546', 'Petit-enfant 8', 'BONYÉ', 'petitenfant.bonyé40@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'M', '2007-05-28', '+225 07 29 84 16', '+225 07 29 84 16', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('38b10de5-e64e-489d-8c4c-f23ddc7f07cf', 'petitenfant.bonyé41@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '38b10de5-e64e-489d-8c4c-f23ddc7f07cf', 'Petit-enfant 9', 'BONYÉ', 'petitenfant.bonyé41@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'F', '2003-09-30', '+225 07 52 41 22', '+225 07 52 41 22', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('9adb7d78-5232-40d4-8240-cf341ccbe593', 'petitenfant.bonyé42@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '9adb7d78-5232-40d4-8240-cf341ccbe593', 'Petit-enfant 10', 'BONYÉ', 'petitenfant.bonyé42@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'M', '2004-04-19', '+225 07 20 25 95', '+225 07 20 25 95', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('31726ae3-285f-43c2-8406-4cfc427b9fb0', 'petitenfant.bonyé43@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '31726ae3-285f-43c2-8406-4cfc427b9fb0', 'Petit-enfant 11', 'BONYÉ', 'petitenfant.bonyé43@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'F', '2004-09-20', '+225 07 36 59 75', '+225 07 36 59 75', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
VALUES ('7fa17611-b932-4c0c-8579-4ed4c2b5eaa0', 'petitenfant.bonyé44@test-racines.com', crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

INSERT INTO public.profiles (
    id, first_name, last_name, email, status, role, quartier_nom, village_origin, 
    residence_country, residence_city, emploi, niveau_etudes, diplomes, fonction,
    gender, birth_date, phone_1, whatsapp_1, nombre_enfants, adresse_residence,
    avatar_url, created_at, updated_at
) VALUES (
    '7fa17611-b932-4c0c-8579-4ed4c2b5eaa0', 'Petit-enfant 12', 'BONYÉ', 'petitenfant.bonyé44@test-racines.com', 
    'confirmed', 'user', 'Bonyé', 'Toa-Zéo', 'CI', 'Abidjan', 
    'Étudiant', 'BAC+2', 'BTS', 'Étudiant',
    'M', '1998-12-12', '+225 07 19 14 93', '+225 07 19 14 93', 0, 'Quartier Résidentiel, Abidjan',
    'https://ui-avatars.com/api/?name=P+B&background=random&color=fff', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET 
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email,
    status = EXCLUDED.status, role = EXCLUDED.role, quartier_nom = EXCLUDED.quartier_nom, village_origin = EXCLUDED.village_origin,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city, 
    emploi = EXCLUDED.emploi, niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes, fonction = EXCLUDED.fonction,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date, phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1, 
    nombre_enfants = EXCLUDED.nombre_enfants, adresse_residence = EXCLUDED.adresse_residence,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();

END $$;
