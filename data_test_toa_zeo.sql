-- =====================================================================
-- RACINES+ — Données de Test (Village Toa-Zéo)
-- Script Supabase SQL — À exécuter dans le Dashboard Supabase > SQL Editor
-- =====================================================================
-- Génère :
--   - 1 utilisateur principal (Kwame GBÉYA) avec 2 parents (quartier Gbéya)
--   - 7 frères et sœurs issus de Gbéya, résidents à l'étranger
--   - 5 autres utilisateurs issus des quartiers Gbéya, Bonyé, Zouhaé, Gaho
--     résidant en Côte d'Ivoire (Abidjan, Bouaké, Daloa, Duékoué, Grand Bassam)
--   - Tous en statut 'pending' (en attente du CHO)
-- =====================================================================

-- Génère des UUIDs déterministes pour les tests
DO $$
DECLARE
    -- UUIDs des membres de la famille principale (Gbéya)
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
    -- UUIDs des 5 autres utilisateurs
    id_user_ab   UUID := '22222222-0000-4000-b000-000000000001'; -- Abidjan
    id_user_bk   UUID := '22222222-0000-4000-b000-000000000002'; -- Bouaké
    id_user_dl   UUID := '22222222-0000-4000-b000-000000000003'; -- Daloa
    id_user_dk   UUID := '22222222-0000-4000-b000-000000000004'; -- Duékoué
    id_user_gb   UUID := '22222222-0000-4000-b000-000000000005'; -- Grand Bassam
BEGIN

-- =====================================================================
-- 1. FAMILLE PRINCIPALE — Quartier Gbéya, Ancêtre TAESSOO
--    L'utilisateur principal + 2 parents + 7 frères/sœurs à l'étranger
-- =====================================================================

-- Utilisateur principal : Kwame GBÉYA
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES (id_kwame, 'kwame.gbeya@test-racines.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
    id, first_name, last_name, email,
    status, quartier_nom, village_origin,
    residence_country, residence_city,
    phone, whatsapp,
    ancestral_root_id,
    created_at, updated_at
) VALUES (
    id_kwame, 'Kwame', 'GBÉYA', 'kwame.gbeya@test-racines.com',
    'pending', 'Gbéya', 'Toa-Zéo',
    'FR', 'Paris',
    '+33600000001', '+33600000001',
    NULL, -- sera relié à TAESSOO après création de l'ancêtre
    NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = 'pending',
    quartier_nom = 'Gbéya';

-- Père de Kwame
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES (id_pere, 'kofi.gbeya.pere@test-racines.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
    id, first_name, last_name, email,
    status, quartier_nom, village_origin,
    residence_country, residence_city,
    created_at, updated_at
) VALUES (
    id_pere, 'Kofi', 'GBÉYA', 'kofi.gbeya.pere@test-racines.com',
    'pending', 'Gbéya', 'Toa-Zéo',
    'BE', 'Bruxelles',
    NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET first_name = 'Kofi', last_name = 'GBÉYA', status = 'pending';

-- Mère de Kwame
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES (id_mere, 'ama.gbeya.mere@test-racines.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
    id, first_name, last_name, email,
    status, quartier_nom, village_origin,
    residence_country, residence_city,
    created_at, updated_at
) VALUES (
    id_mere, 'Ama', 'ASSI', 'ama.gbeya.mere@test-racines.com',
    'pending', 'Gbéya', 'Toa-Zéo',
    'GB', 'Londres',
    NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET first_name = 'Ama', last_name = 'ASSI', status = 'pending';

-- 7 Frères et Sœurs issus de Gbéya, résidents à l'étranger
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at) VALUES
    (id_frere1, 'yao.gbeya1@test-racines.com', NOW(), NOW(), NOW()),
    (id_frere2, 'koffi.gbeya2@test-racines.com', NOW(), NOW(), NOW()),
    (id_frere3, 'ekra.gbeya3@test-racines.com', NOW(), NOW(), NOW()),
    (id_soeur1, 'akissi.gbeya1@test-racines.com', NOW(), NOW(), NOW()),
    (id_soeur2, 'adjoua.gbeya2@test-racines.com', NOW(), NOW(), NOW()),
    (id_soeur3, 'bintou.gbeya3@test-racines.com', NOW(), NOW(), NOW()),
    (id_soeur4, 'mariama.gbeya4@test-racines.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, first_name, last_name, email, status, quartier_nom, village_origin, residence_country, residence_city, created_at, updated_at) VALUES
    (id_frere1, 'Yao',     'GBÉYA', 'yao.gbeya1@test-racines.com',     'pending', 'Gbéya', 'Toa-Zéo', 'FR', 'Lyon',      NOW(), NOW()),
    (id_frere2, 'Koffi',   'GBÉYA', 'koffi.gbeya2@test-racines.com',   'pending', 'Gbéya', 'Toa-Zéo', 'CA', 'Montréal',  NOW(), NOW()),
    (id_frere3, 'Ekra',    'GBÉYA', 'ekra.gbeya3@test-racines.com',    'pending', 'Gbéya', 'Toa-Zéo', 'US', 'New York',  NOW(), NOW()),
    (id_soeur1, 'Akissi',  'GBÉYA', 'akissi.gbeya1@test-racines.com',  'pending', 'Gbéya', 'Toa-Zéo', 'DE', 'Berlin',    NOW(), NOW()),
    (id_soeur2, 'Adjoua',  'GBÉYA', 'adjoua.gbeya2@test-racines.com',  'pending', 'Gbéya', 'Toa-Zéo', 'GB', 'Manchester',NOW(), NOW()),
    (id_soeur3, 'Bintou',  'GBÉYA', 'bintou.gbeya3@test-racines.com',  'pending', 'Gbéya', 'Toa-Zéo', 'BE', 'Liège',     NOW(), NOW()),
    (id_soeur4, 'Mariama', 'GBÉYA', 'mariama.gbeya4@test-racines.com', 'pending', 'Gbéya', 'Toa-Zéo', 'SN', 'Dakar',     NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = 'pending',
    quartier_nom = EXCLUDED.quartier_nom,
    residence_country = EXCLUDED.residence_country,
    residence_city = EXCLUDED.residence_city;

-- =====================================================================
-- 2. CINQ AUTRES UTILISATEURS — Quartiers différents, résidents en CI
-- =====================================================================

INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at) VALUES
    (id_user_ab, 'soro.gbeka.abidjan@test-racines.com',      NOW(), NOW(), NOW()),
    (id_user_bk, 'gnagne.bonye.bouake@test-racines.com',     NOW(), NOW(), NOW()),
    (id_user_dl, 'kouame.zouhae.daloa@test-racines.com',     NOW(), NOW(), NOW()),
    (id_user_dk, 'n_da.gaho.duekoue@test-racines.com',       NOW(), NOW(), NOW()),
    (id_user_gb, 'ahou.gbeka.grandbassam@test-racines.com',  NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, first_name, last_name, email, status, quartier_nom, village_origin, residence_country, residence_city, created_at, updated_at) VALUES
    (id_user_ab, 'Soro',   'GBÉKA',  'soro.gbeka.abidjan@test-racines.com',     'pending', 'Gbéya',  'Toa-Zéo', 'CI', 'Abidjan',     NOW(), NOW()),
    (id_user_bk, 'Gnagne', 'BONYÉ',  'gnagne.bonye.bouake@test-racines.com',    'pending', 'Bonyé',  'Toa-Zéo', 'CI', 'Bouaké',      NOW(), NOW()),
    (id_user_dl, 'Kouamé', 'ZOUHAÉ', 'kouame.zouhae.daloa@test-racines.com',    'pending', 'Zouhaé', 'Toa-Zéo', 'CI', 'Daloa',       NOW(), NOW()),
    (id_user_dk, 'N''Da',  'GAHO',   'n_da.gaho.duekoue@test-racines.com',      'pending', 'Gaho',   'Toa-Zéo', 'CI', 'Duékoué',     NOW(), NOW()),
    (id_user_gb, 'Ahou',   'GBÉKA',  'ahou.gbeka.grandbassam@test-racines.com', 'pending', 'Gbéya',  'Toa-Zéo', 'CI', 'Grand Bassam',NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = 'pending',
    quartier_nom = EXCLUDED.quartier_nom,
    residence_city = EXCLUDED.residence_city;

RAISE NOTICE '✅ Données de test créées :';
RAISE NOTICE '   - Famille GBÉYA (1 + 2 parents + 7 frères/sœurs) → statut: pending';
RAISE NOTICE '   - 5 utilisateurs des quartiers Gbéya/Bonyé/Zouhaé/Gaho → statut: pending';
RAISE NOTICE '   - Total : 15 nouveaux profils en attente de validation CHO';

END $$;

-- =====================================================================
-- Vérification : afficher les profils créés
-- =====================================================================
SELECT 
    id,
    first_name || ' ' || last_name AS nom_complet,
    quartier_nom,
    residence_country || ' / ' || residence_city AS localisation,
    status,
    created_at::date AS date_inscription
FROM public.profiles
WHERE id IN (
    '11111111-0000-4000-a000-000000000001',
    '11111111-0000-4000-a000-000000000002',
    '11111111-0000-4000-a000-000000000003',
    '11111111-0000-4000-a000-000000000004',
    '11111111-0000-4000-a000-000000000005',
    '11111111-0000-4000-a000-000000000006',
    '11111111-0000-4000-a000-000000000007',
    '11111111-0000-4000-a000-000000000008',
    '11111111-0000-4000-a000-000000000009',
    '11111111-0000-4000-a000-000000000010',
    '22222222-0000-4000-b000-000000000001',
    '22222222-0000-4000-b000-000000000002',
    '22222222-0000-4000-b000-000000000003',
    '22222222-0000-4000-b000-000000000004',
    '22222222-0000-4000-b000-000000000005'
)
ORDER BY quartier_nom, last_name, first_name;
