-- =====================================================================
-- RACINES+ — Données de Test v3 (Village Toa-Zéo)
-- Script Supabase SQL — Exécuter dans : Supabase > SQL Editor
-- =====================================================================
-- COLONNES RÉELLES DE profiles (vérifiées dans tous les scripts /supabase/) :
--   phase3_setup.sql  → id, first_name, last_name, birth_date, gender,
--                        village_origin, quartier_nom, residence_country,
--                        ancestral_root_id, avatar_url, is_founder,
--                        role, status, is_locked, rejection_motif,
--                        rejection_observations, created_at, updated_at
--   Add_Residence_City.sql → residence_city
--   Add_Contact_Fields.sql → phone_1, phone_2, whatsapp_1, whatsapp_2
--   Add_Authorizations.sql → export_authorized, certificate_requested,
--                             certificate_issued, certificate_issued_at
--   add_ambassadors.sql    → is_ambassadeur, export_requested
--
-- NOTE : father_*/mother_* n'existent PAS dans profiles.
--        Ces données sont dans Neo4j (nœuds séparés FATHER_OF / MOTHER_OF).
--        Ce script stocke les infos parents dans un JSONB `metadata` ajouté ci-dessous.
-- =====================================================================

-- ── Étape 0 : Ajouter la colonne metadata si elle n'existe pas encore
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- =====================================================================
-- ÉTAPE 1 : Créer les comptes auth.users (contournement RLS)
-- =====================================================================
-- Note : Si l'erreur "duplicate key" apparaît, le compte existe déjà — c'est normal.

INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, role, aud
)
VALUES
    ('11111111-0000-4000-a000-000000000001', 'kwame.gbeya.test@racines-mvp.local',    crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('11111111-0000-4000-a000-000000000002', 'kofi.gbeya.pere@racines-mvp.local',     crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('11111111-0000-4000-a000-000000000003', 'ama.kouassi.mere@racines-mvp.local',    crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('11111111-0000-4000-a000-000000000004', 'yao.gbeya.fr@racines-mvp.local',        crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('11111111-0000-4000-a000-000000000005', 'koffi.gbeya.ca@racines-mvp.local',      crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('11111111-0000-4000-a000-000000000006', 'ekra.gbeya.us@racines-mvp.local',       crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('11111111-0000-4000-a000-000000000007', 'akissi.gbeya.de@racines-mvp.local',     crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('11111111-0000-4000-a000-000000000008', 'adjoua.gbeya.gb@racines-mvp.local',     crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('11111111-0000-4000-a000-000000000009', 'bintou.gbeya.be@racines-mvp.local',     crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('11111111-0000-4000-a000-000000000010', 'mariama.gbeya.sn@racines-mvp.local',    crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('22222222-0000-4000-b000-000000000001', 'soro.gbeka.abidjan@racines-mvp.local',  crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('22222222-0000-4000-b000-000000000002', 'gnagne.bonye.bouake@racines-mvp.local', crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('22222222-0000-4000-b000-000000000003', 'kouame.zouhae.daloa@racines-mvp.local', crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('22222222-0000-4000-b000-000000000004', 'nda.gaho.duekoue@racines-mvp.local',    crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated'),
    ('22222222-0000-4000-b000-000000000005', 'ahou.gbeka.grandbassam@racines-mvp.local', crypt('Test1234!', gen_salt('bf')), NOW(), NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- ÉTAPE 2 : Insérer les profils complets
-- (colonnes réelles uniquement — parents dans metadata JSONB)
-- =====================================================================

INSERT INTO public.profiles (
    id, first_name, last_name, email,
    birth_date, gender,
    village_origin, quartier_nom,
    residence_country, residence_city,
    phone_1, phone_2, whatsapp_1, whatsapp_2,
    avatar_url, is_founder, role, status,
    metadata,
    created_at, updated_at
) VALUES

-- ─── A.1 Kwame Pacôme GBÉYA — Utilisateur principal — Paris, France ───
('11111111-0000-4000-a000-000000000001',
 'Kwame Pacôme', 'GBÉYA', 'kwame.gbeya.test@racines-mvp.local',
 '1985-03-15', 'Homme',
 'Toa-Zéo', 'Gbéya',
 'FR', 'Paris',
 '+33612345601', '+22507000001', '+33612345601', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Kofi","father_last_name":"GBÉYA","father_status":"Décédé","father_birth_date":"1952-06-20","mother_first_name":"Ama","mother_last_name":"KOUASSI","mother_status":"Vivante","mother_birth_date":"1958-11-04"}',
 NOW(), NOW()),

-- ─── A.2 Kofi Kouamé GBÉYA — Père de Kwame — Bruxelles, Belgique ───
('11111111-0000-4000-a000-000000000002',
 'Kofi Kouamé', 'GBÉYA', 'kofi.gbeya.pere@racines-mvp.local',
 '1952-06-20', 'Homme',
 'Toa-Zéo', 'Gbéya',
 'BE', 'Bruxelles',
 '+32478000101', NULL, '+32478000101', '+32478000102',
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Mensah","father_last_name":"GBÉYA","father_status":"Décédé","father_birth_date":"1920-01-01","mother_first_name":"Adjoua","mother_last_name":"DIALLO","mother_status":"Décédée","mother_birth_date":"1925-05-10"}',
 NOW(), NOW()),

-- ─── A.3 Ama Bintou KOUASSI — Mère de Kwame — Londres, Royaume-Uni ───
('11111111-0000-4000-a000-000000000003',
 'Ama Bintou', 'KOUASSI', 'ama.kouassi.mere@racines-mvp.local',
 '1958-11-04', 'Femme',
 'Toa-Zéo', 'Gbéya',
 'GB', 'Londres',
 '+447911123456', NULL, '+447911123456', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Yao","father_last_name":"KOUASSI","father_status":"Décédé","father_birth_date":"1930-08-15","mother_first_name":"Fatou","mother_last_name":"TRAORÉ","mother_status":"Décédée","mother_birth_date":"1935-02-22"}',
 NOW(), NOW()),

-- ─── A.4 Yao Serge GBÉYA — Frère 1 — Lyon, France ───
('11111111-0000-4000-a000-000000000004',
 'Yao Serge', 'GBÉYA', 'yao.gbeya.fr@racines-mvp.local',
 '1982-07-12', 'Homme',
 'Toa-Zéo', 'Gbéya',
 'FR', 'Lyon',
 '+33698112202', NULL, '+33698112202', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Kofi","father_last_name":"GBÉYA","father_status":"Décédé","father_birth_date":"1952-06-20","mother_first_name":"Ama","mother_last_name":"KOUASSI","mother_status":"Vivante","mother_birth_date":"1958-11-04"}',
 NOW(), NOW()),

-- ─── A.5 Koffi Armand GBÉYA — Frère 2 — Montréal, Canada ───
('11111111-0000-4000-a000-000000000005',
 'Koffi Armand', 'GBÉYA', 'koffi.gbeya.ca@racines-mvp.local',
 '1988-02-28', 'Homme',
 'Toa-Zéo', 'Gbéya',
 'CA', 'Montréal',
 '+15145553030', '+15145554040', '+15145553030', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Kofi","father_last_name":"GBÉYA","father_status":"Décédé","father_birth_date":"1952-06-20","mother_first_name":"Ama","mother_last_name":"KOUASSI","mother_status":"Vivante","mother_birth_date":"1958-11-04"}',
 NOW(), NOW()),

-- ─── A.6 Ekra Jules GBÉYA — Frère 3 — New York, États-Unis ───
('11111111-0000-4000-a000-000000000006',
 'Ekra Jules', 'GBÉYA', 'ekra.gbeya.us@racines-mvp.local',
 '1990-09-05', 'Homme',
 'Toa-Zéo', 'Gbéya',
 'US', 'New York',
 '+12129990001', NULL, '+12129990001', '+12129990002',
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Kofi","father_last_name":"GBÉYA","father_status":"Décédé","father_birth_date":"1952-06-20","mother_first_name":"Ama","mother_last_name":"KOUASSI","mother_status":"Vivante","mother_birth_date":"1958-11-04"}',
 NOW(), NOW()),

-- ─── A.7 Akissi Marie-Claire GBÉYA — Sœur 1 — Berlin, Allemagne ───
('11111111-0000-4000-a000-000000000007',
 'Akissi Marie-Claire', 'GBÉYA', 'akissi.gbeya.de@racines-mvp.local',
 '1983-04-18', 'Femme',
 'Toa-Zéo', 'Gbéya',
 'DE', 'Berlin',
 '+4917612345678', NULL, '+4917612345678', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Kofi","father_last_name":"GBÉYA","father_status":"Décédé","father_birth_date":"1952-06-20","mother_first_name":"Ama","mother_last_name":"KOUASSI","mother_status":"Vivante","mother_birth_date":"1958-11-04"}',
 NOW(), NOW()),

-- ─── A.8 Adjoua Christelle GBÉYA — Sœur 2 — Manchester, Royaume-Uni ───
('11111111-0000-4000-a000-000000000008',
 'Adjoua Christelle', 'GBÉYA', 'adjoua.gbeya.gb@racines-mvp.local',
 '1986-12-01', 'Femme',
 'Toa-Zéo', 'Gbéya',
 'GB', 'Manchester',
 '+447700900001', NULL, '+447700900001', '+447700900002',
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Kofi","father_last_name":"GBÉYA","father_status":"Décédé","father_birth_date":"1952-06-20","mother_first_name":"Ama","mother_last_name":"KOUASSI","mother_status":"Vivante","mother_birth_date":"1958-11-04"}',
 NOW(), NOW()),

-- ─── A.9 Bintou Aïcha GBÉYA — Sœur 3 — Liège, Belgique ───
('11111111-0000-4000-a000-000000000009',
 'Bintou Aïcha', 'GBÉYA', 'bintou.gbeya.be@racines-mvp.local',
 '1991-06-23', 'Femme',
 'Toa-Zéo', 'Gbéya',
 'BE', 'Liège',
 '+32494000303', NULL, '+32494000303', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Kofi","father_last_name":"GBÉYA","father_status":"Décédé","father_birth_date":"1952-06-20","mother_first_name":"Ama","mother_last_name":"KOUASSI","mother_status":"Vivante","mother_birth_date":"1958-11-04"}',
 NOW(), NOW()),

-- ─── A.10 Mariama Florence GBÉYA — Sœur 4 — Dakar, Sénégal ───
('11111111-0000-4000-a000-000000000010',
 'Mariama Florence', 'GBÉYA', 'mariama.gbeya.sn@racines-mvp.local',
 '1994-01-09', 'Femme',
 'Toa-Zéo', 'Gbéya',
 'SN', 'Dakar',
 '+221771234567', '+221771234568', '+221771234567', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Kofi","father_last_name":"GBÉYA","father_status":"Décédé","father_birth_date":"1952-06-20","mother_first_name":"Ama","mother_last_name":"KOUASSI","mother_status":"Vivante","mother_birth_date":"1958-11-04"}',
 NOW(), NOW()),

-- ─── B.1 Soro Daniel GBÉKA — Gbéya — Abidjan, CI ───
('22222222-0000-4000-b000-000000000001',
 'Soro Daniel', 'GBÉKA', 'soro.gbeka.abidjan@racines-mvp.local',
 '1979-08-30', 'Homme',
 'Toa-Zéo', 'Gbéya',
 'CI', 'Abidjan',
 '+22507112233', '+22501223344', '+22507112233', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Yao","father_last_name":"GBÉKA","father_status":"Vivant","father_birth_date":"1950-03-12","mother_first_name":"Adjoua","mother_last_name":"N''GORAN","mother_status":"Vivante","mother_birth_date":"1955-07-08"}',
 NOW(), NOW()),

-- ─── B.2 Gnagne Ernest BONYÉ — Bonyé — Bouaké, CI ───
('22222222-0000-4000-b000-000000000002',
 'Gnagne Ernest', 'BONYÉ', 'gnagne.bonye.bouake@racines-mvp.local',
 '1987-11-14', 'Homme',
 'Toa-Zéo', 'Bonyé',
 'CI', 'Bouaké',
 '+22527334455', NULL, '+22527334455', '+22507334456',
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Kouadio","father_last_name":"BONYÉ","father_status":"Décédé","father_birth_date":"1955-04-22","mother_first_name":"Affoué","mother_last_name":"KONÉ","mother_status":"Vivante","mother_birth_date":"1960-09-30"}',
 NOW(), NOW()),

-- ─── B.3 Kouamé Rodrigue ZOUHAÉ — Zouhaé — Daloa, CI ───
('22222222-0000-4000-b000-000000000003',
 'Kouamé Rodrigue', 'ZOUHAÉ', 'kouame.zouhae.daloa@racines-mvp.local',
 '1992-05-07', 'Homme',
 'Toa-Zéo', 'Zouhaé',
 'CI', 'Daloa',
 '+22588556677', '+22507556678', '+22588556677', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Siméon","father_last_name":"ZOUHAÉ","father_status":"Vivant","father_birth_date":"1962-10-01","mother_first_name":"Kpandé","mother_last_name":"TOURÉ","mother_status":"Vivante","mother_birth_date":"1968-03-15"}',
 NOW(), NOW()),

-- ─── B.4 N'Da Franck GAHO — Gaho — Duékoué, CI ───
('22222222-0000-4000-b000-000000000004',
 'N''Da Franck', 'GAHO', 'nda.gaho.duekoue@racines-mvp.local',
 '1995-09-19', 'Homme',
 'Toa-Zéo', 'Gaho',
 'CI', 'Duékoué',
 '+22501778899', NULL, '+22501778899', NULL,
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Klotché","father_last_name":"GAHO","father_status":"Victime crise 2010","father_birth_date":"1960-12-25","mother_first_name":"Gbéhé","mother_last_name":"SÉHI","mother_status":"Vivante","mother_birth_date":"1965-08-11"}',
 NOW(), NOW()),

-- ─── B.5 Ahou Véronique GBÉKA — Gbéya — Grand Bassam, CI ───
('22222222-0000-4000-b000-000000000005',
 'Ahou Véronique', 'GBÉKA', 'ahou.gbeka.grandbassam@racines-mvp.local',
 '1989-02-14', 'Femme',
 'Toa-Zéo', 'Gbéya',
 'CI', 'Grand Bassam',
 '+22507990011', '+22501990012', '+22507990011', '+22501990012',
 NULL, TRUE, 'user', 'pending',
 '{"father_first_name":"Atta","father_last_name":"GBÉKA","father_status":"Décédé","father_birth_date":"1955-07-18","mother_first_name":"Djessy","mother_last_name":"ASSI","mother_status":"Décédée","mother_birth_date":"1960-01-03"}',
 NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
    first_name       = EXCLUDED.first_name,
    last_name        = EXCLUDED.last_name,
    birth_date       = EXCLUDED.birth_date,
    gender           = EXCLUDED.gender,
    village_origin   = EXCLUDED.village_origin,
    quartier_nom     = EXCLUDED.quartier_nom,
    residence_country = EXCLUDED.residence_country,
    residence_city   = EXCLUDED.residence_city,
    phone_1          = EXCLUDED.phone_1,
    phone_2          = EXCLUDED.phone_2,
    whatsapp_1       = EXCLUDED.whatsapp_1,
    whatsapp_2       = EXCLUDED.whatsapp_2,
    metadata         = EXCLUDED.metadata,
    status           = 'pending',
    updated_at       = NOW();

-- =====================================================================
-- VÉRIFICATION — Résumé de tous les profils test insérés
-- =====================================================================
SELECT
    SUBSTRING(id::text, 1, 8)                                    AS id_court,
    first_name || ' ' || last_name                               AS nom_complet,
    gender                                                        AS sexe,
    birth_date::text                                              AS naissance,
    quartier_nom                                                  AS quartier,
    residence_country || ' / ' || COALESCE(residence_city,'?')   AS localisation,
    phone_1                                                       AS tel_1,
    whatsapp_1                                                    AS whatsapp,
    metadata->>'father_first_name' || ' ' || metadata->>'father_last_name'  AS père,
    metadata->>'father_status'                                   AS statut_père,
    metadata->>'mother_first_name' || ' ' || metadata->>'mother_last_name'  AS mère,
    metadata->>'mother_status'                                   AS statut_mère,
    status                                                        AS statut_cho
FROM public.profiles
WHERE id::text LIKE '11111111%' OR id::text LIKE '22222222%'
ORDER BY quartier_nom, last_name, first_name;
