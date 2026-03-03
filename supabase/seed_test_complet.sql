-- =============================================================================
-- RACINES+ — Seed de Test COMPLET v4 (tous les champs remplis)
-- MDP unifié : Racines2026!  |  Workflow : pending_choa → CHOa → CHO
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- NETTOYAGE — repart de zéro pour éviter les conflits email
-- =============================================================================
DELETE FROM public.profiles
 WHERE email LIKE '%@test-racines.com' OR email LIKE '%@racines-plus.com';
DELETE FROM auth.users
 WHERE email LIKE '%@test-racines.com' OR email LIKE '%@racines-plus.com';
-- Anciens UUIDs fixes du seed_familles_c
DELETE FROM public.profiles WHERE id IN (
  '25d0a8ed-5652-4fa2-8f09-4c13c675f2fa','d113c9db-d56e-4d83-89d8-859e59c79e6a',
  '4005e440-4ad6-4c2f-8ce1-f06267c9dd2c','9d7710be-0b50-46fb-8402-d0f7b1888ce6',
  '4b509051-db6e-466d-8939-471fc82acd1b','e06182a3-b631-428f-8d53-c11752e0d76c',
  '3cfd68fb-8142-4054-8afb-9293ac80d4ab','fc42ed09-4557-48a9-845e-9bb26703d71a',
  'db11e143-67d6-40a0-871e-2a1d2a31febc','9aa6ad99-3872-4cdc-8e49-e31529e9c6c1',
  'ec304bda-a5db-4338-8b48-3c1e741e20d4','166c9564-5fb6-453b-8892-4993cd0ce0bd',
  '2a83467e-2342-40a0-80f3-3d911677573d','8026188f-a1e0-4851-8942-c2acbc20bdbf',
  'ac732cd0-57fe-404b-829e-6d408a2aa2e1','6f6c1f71-16e5-46ce-84e8-5516ef979fbe',
  '8084b806-6f2b-4480-8845-b9a127a56dd7','12234261-dc74-46e8-83f9-b6d11a72703f',
  '8a99d0ec-5201-4614-8413-726c77870566'
);
DELETE FROM auth.users WHERE id IN (
  '25d0a8ed-5652-4fa2-8f09-4c13c675f2fa','d113c9db-d56e-4d83-89d8-859e59c79e6a',
  '4005e440-4ad6-4c2f-8ce1-f06267c9dd2c','9d7710be-0b50-46fb-8402-d0f7b1888ce6',
  '4b509051-db6e-466d-8939-471fc82acd1b','e06182a3-b631-428f-8d53-c11752e0d76c',
  '3cfd68fb-8142-4054-8afb-9293ac80d4ab','fc42ed09-4557-48a9-845e-9bb26703d71a',
  'db11e143-67d6-40a0-871e-2a1d2a31febc','9aa6ad99-3872-4cdc-8e49-e31529e9c6c1',
  'ec304bda-a5db-4338-8b48-3c1e741e20d4','166c9564-5fb6-453b-8892-4993cd0ce0bd',
  '2a83467e-2342-40a0-80f3-3d911677573d','8026188f-a1e0-4851-8942-c2acbc20bdbf',
  'ac732cd0-57fe-404b-829e-6d408a2aa2e1','6f6c1f71-16e5-46ce-84e8-5516ef979fbe',
  '8084b806-6f2b-4480-8845-b9a127a56dd7','12234261-dc74-46e8-83f9-b6d11a72703f',
  '8a99d0ec-5201-4614-8413-726c77870566'
);

-- =============================================================================
-- FONCTION HELPER — insère un utilisateur complet (auth + profile)
-- Paramètres : id, email, prenom, nom, role, status, quartier,
--              pays_residence, ville_residence, genre, date_naissance,
--              telephone, emploi, fonction, niveau_etudes, diplomes,
--              nb_enfants, adresse, retraite, is_founder
-- =============================================================================
CREATE OR REPLACE FUNCTION racines_insert_test_user(
  p_id             uuid,
  p_email          text,
  p_first          text,
  p_last           text,
  p_role           text,
  p_status         text,
  p_quartier       text,
  p_country        text,
  p_city           text,
  p_gender         text,
  p_birth          date,
  p_phone          text,
  p_emploi         text,
  p_fonction       text,
  p_niveau         text,
  p_diplomes       text,
  p_enfants        int,
  p_adresse        text,
  p_retraite       bool DEFAULT false,
  p_is_founder     bool DEFAULT true
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Auth
  INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, email_confirmed_at)
  VALUES (p_id, p_email, crypt('Racines2026!', gen_salt('bf')), NOW(), NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = NOW();

  -- Profile complet
  INSERT INTO public.profiles (
    id, email, first_name, last_name,
    role, status, is_locked,
    village_origin, quartier_nom,
    residence_country, residence_city, adresse_residence,
    gender, birth_date,
    phone_1, whatsapp_1,
    emploi, fonction, niveau_etudes, diplomes,
    retraite, nombre_enfants,
    is_founder, is_ambassadeur,
    export_authorized, export_requested,
    consentement_enfants, certificate_requested, certificate_issued,
    avatar_url,
    created_at, updated_at
  ) VALUES (
    p_id, p_email, p_first, p_last,
    p_role, p_status, false,
    'Toa-Zéo', p_quartier,
    p_country, p_city, p_adresse,
    p_gender, p_birth,
    p_phone, p_phone,
    p_emploi, p_fonction, p_niveau, p_diplomes,
    p_retraite, p_enfants,
    p_is_founder, false,
    true, false,
    true, false, false,
    'https://ui-avatars.com/api/?name=' || left(p_first,1) || '+' || left(p_last,1) || '&background=random&color=fff',
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
    role = EXCLUDED.role, status = EXCLUDED.status,
    village_origin = EXCLUDED.village_origin, quartier_nom = EXCLUDED.quartier_nom,
    residence_country = EXCLUDED.residence_country, residence_city = EXCLUDED.residence_city,
    adresse_residence = EXCLUDED.adresse_residence,
    gender = EXCLUDED.gender, birth_date = EXCLUDED.birth_date,
    phone_1 = EXCLUDED.phone_1, whatsapp_1 = EXCLUDED.whatsapp_1,
    emploi = EXCLUDED.emploi, fonction = EXCLUDED.fonction,
    niveau_etudes = EXCLUDED.niveau_etudes, diplomes = EXCLUDED.diplomes,
    retraite = EXCLUDED.retraite, nombre_enfants = EXCLUDED.nombre_enfants,
    is_founder = EXCLUDED.is_founder, export_authorized = EXCLUDED.export_authorized,
    consentement_enfants = EXCLUDED.consentement_enfants,
    avatar_url = EXCLUDED.avatar_url, updated_at = NOW();
END;
$$;

-- =============================================================================
-- SECTION 1 — ÉQUIPE RACINES+ (6 comptes : Admin + CHO + 4 CHOa)
-- =============================================================================
DO $$ BEGIN

-- Admin
PERFORM racines_insert_test_user(
  '00000000-0000-4000-a000-000000000001','admin.racines@racines-plus.com',
  'Pacou','RACINES-ADMIN','admin','confirmed',
  'Gbéya','CI','Abidjan','M','1975-01-15',
  '+22507000001','Directeur Plateforme','Admin Racines+',
  'Bac+5','Master Informatique',0,'Cocody, Abidjan, Côte d''Ivoire',false,true
);

-- CHO
PERFORM racines_insert_test_user(
  '00000000-0000-4000-a000-000000000002','cho.gbeya@racines-plus.com',
  'Kofi','GBEYA-CHO','cho','confirmed',
  'Gbéya','CI','Abidjan','M','1965-03-22',
  '+22507000002','Chef de Hameaux','Chef Hameaux Originaires',
  'Bac+2','BTS Gestion',8,'Plateau, Abidjan, Côte d''Ivoire',false,true
);

-- CHOa Gbéya 1
PERFORM racines_insert_test_user(
  '00000000-0000-4000-a000-000000000003','choa.gbeya1@racines-plus.com',
  'Ama','ASSI-CHOA1','choa','confirmed',
  'Gbéya','CI','Toa-Zéo','F','1972-06-10',
  '+22507000003','Enseignante','CHOa Quartier Gbéya',
  'Bac','BAC Lettres',4,'Quartier Gbéya, Toa-Zéo',false,true
);

-- CHOa Gbéya 2
PERFORM racines_insert_test_user(
  '00000000-0000-4000-a000-000000000004','choa.gbeya2@racines-plus.com',
  'Yao','KOFFI-CHOA2','choa','confirmed',
  'Gbéya','CI','Toa-Zéo','M','1968-09-22',
  '+22507000004','Planteur','CHOa Quartier Gbéya',
  'CM2','Certificat d''études primaires',6,'Quartier Gbéya, Toa-Zéo',true,true
);

-- CHOa Bonyé 1
PERFORM racines_insert_test_user(
  '00000000-0000-4000-a000-000000000005','choa.bonye1@racines-plus.com',
  'Ahou','BONYE-CHOA1','choa','confirmed',
  'Bonye','CI','Toa-Zéo','F','1970-04-18',
  '+22507000005','Commerçante','CHOa Quartier Bonyé',
  'Primaire','Sans diplôme',5,'Quartier Bonyé, Toa-Zéo',false,true
);

-- CHOa Bonyé 2
PERFORM racines_insert_test_user(
  '00000000-0000-4000-a000-000000000006','choa.bonye2@racines-plus.com',
  'Gnagne','KOUASSI-CHOA2','choa','confirmed',
  'Bonye','CI','Toa-Zéo','M','1966-12-05',
  '+22507000006','Agriculteur','CHOa Quartier Bonyé',
  'CM2','Certificat d''études primaires',7,'Quartier Bonyé, Toa-Zéo',true,true
);

END $$;

-- =============================================================================
-- SECTION 2 — 25 MEMBRES FAMILLE GBEYA (pending_choa)
-- =============================================================================
DO $$ BEGIN

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000001','kwame.gbeya@test-racines.com',
  'Kwame','GBEYA','user','pending_choa','Gbéya','FR','Paris','M','1985-06-12',
  '+33612345601','Ingénieur IT','Développeur Senior','Bac+5','Master Informatique',2,'10 Rue de Rivoli, Paris 75001',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000002','kofi.gbeya@test-racines.com',
  'Kofi','GBEYA','user','pending_choa','Gbéya','BE','Bruxelles','M','1978-03-22',
  '+32478000001','Comptable','Chef Comptable','Bac+4','Licence Comptabilité',3,'15 Rue de la Loi, Bruxelles 1040',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000003','ama.assi@test-racines.com',
  'Ama','ASSI','user','pending_choa','Gbéya','GB','Londres','F','1980-11-05',
  '+447911000001','Infirmière','Infirmière en Chef','Bac+3','Licence Soins Infirmiers',4,'22 Oxford Street, London W1D 1AN',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000004','yao.gbeya1@test-racines.com',
  'Yao','GBEYA','user','pending_choa','Gbéya','FR','Lyon','M','1982-01-15',
  '+33611223301','Cadre Commercial','Directeur Régional','Bac+5','MBA Commerce',2,'5 Place Bellecour, Lyon 69002',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000005','koffi.gbeya2@test-racines.com',
  'Koffi','GBEYA','user','pending_choa','Gbéya','CA','Montreal','M','1984-08-30',
  '+15141234501','Comptable','Analyste Financier','Bac+4','CPA Québec',1,'101 Rue Saint-Paul, Montréal H2Y 1Z5',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000006','ekra.gbeya3@test-racines.com',
  'Ekra','GBEYA','user','pending_choa','Gbéya','US','New York','M','1988-12-10',
  '+19171234501','Consultant','Senior Consultant Finance','Bac+5','MBA Finance',0,'350 5th Ave, New York NY 10118',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000007','akissi.gbeya1@test-racines.com',
  'Akissi','GBEYA','user','pending_choa','Gbéya','DE','Berlin','F','1977-04-18',
  '+491711234501','Médecin','Médecin Généraliste','Bac+7','Doctorat Médecine',3,'Unter den Linden 10, Berlin 10117',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000008','adjoua.gbeya2@test-racines.com',
  'Adjoua','GBEYA','user','pending_choa','Gbéya','GB','Manchester','F','1985-09-25',
  '+447911000002','Enseignante','Professeur Collège','Bac+4','PGCE Education',2,'30 Piccadilly, Manchester M1 1LY',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000009','bintou.gbeya3@test-racines.com',
  'Bintou','GBEYA','user','pending_choa','Gbéya','BE','Liège','F','1987-02-14',
  '+32478000002','Avocate','Avocate Pénaliste','Bac+5','Master Droit Pénal',1,'Place Saint-Lambert 1, Liège 4000',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000010','mariama.gbeya4@test-racines.com',
  'Mariama','GBEYA','user','pending_choa','Gbéya','SN','Dakar','F','1991-07-08',
  '+221771234501','Journaliste','Rédactrice en Chef','Bac+4','Licence Journalisme',0,'Avenue Cheikh Anta Diop, Dakar',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000011','kwassi.gbeya0@test-racines.com',
  'Kwassi','GBEYA','user','pending_choa','Gbéya','CI','Abidjan','M','1949-03-24',
  '+22507536047','Planteur','Ancien Chef de Culture','Primaire','CEPE',7,'Quartier Résidentiel Cocody, Abidjan',true,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000012','michel.gbeya2@test-racines.com',
  'Michel','GBEYA','user','pending_choa','Gbéya','FR','Paris','M','1970-10-26',
  '+33611223302','Médecin','Cardiologue','Bac+7','Doctorat Médecine - Spécialité Cardiologie',3,'87 Boulevard Haussmann, Paris 75008',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000013','serge.gbeya3@test-racines.com',
  'Serge','GBEYA','user','pending_choa','Gbéya','CI','Abidjan','M','1974-12-18',
  '+22507486312','Professeur','Professeur Lycée','Bac+4','Licence Sciences',2,'Yopougon Maroc, Abidjan',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000014','alain.gbeya4@test-racines.com',
  'Alain','GBEYA','user','pending_choa','Gbéya','CI','Toa-Zéo','M','1979-01-09',
  '+22507995043','Commerçant','Gérant de Commerce','CAP','CAP Commerce',4,'Quartier Centre, Toa-Zéo',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000015','marie.gbeya5@test-racines.com',
  'Marie','GBEYA','user','pending_choa','Gbéya','US','New York','F','1978-09-25',
  '+19171234502','Infirmière','Infirmière Urgences','Bac+3','BSN Nursing',1,'245 East 35th St, New York NY 10016',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000016','paul.gbeya6@test-racines.com',
  'Paul','GBEYA','user','pending_choa','Gbéya','CA','Montreal','M','1983-01-23',
  '+15141234502','Ingénieur IT','Architecte Solutions Cloud','Bac+5','Master Informatique',2,'3480 Rue University, Montréal H3A 2A7',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000017','ahou.zogbo@test-racines.com',
  'Ahou','ZOGBO','user','pending_choa','Gbéya','CI','Abidjan','F','1950-05-05',
  '+22507699470','Ménagère','Femme au Foyer','Primaire','CEPE',7,'Abobo Baoulé, Abidjan',true,false);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000018','soro.gbeka@test-racines.com',
  'Soro','GBEKA','user','pending_choa','Gbéya','CI','Abidjan','M','1985-05-20',
  '+22507254096','Technicien','Technicien Réseau Télécom','Bac+2','BTS Réseau Télécom',2,'Marcory Zone 4, Abidjan',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000019','ahoua.gbeka@test-racines.com',
  'Ahoua','GBEKA','user','pending_choa','Gbéya','CI','Grand-Bassam','F','1995-11-22',
  '+22507264818','Étudiante','Étudiante Master 2','Bac+4','Master 2 Finance (en cours)',0,'Résidence Universitaire, Grand-Bassam',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000020','marc.gbeya@test-racines.com',
  'Marc','GBEYA','user','pending_choa','Gbéya','FR','Lyon','M','1995-02-14',
  '+33611223303','Développeur','Software Engineer','Bac+5','Master Informatique',0,'20 Rue Garibaldi, Lyon 69003',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000021','sarah.gbeya@test-racines.com',
  'Sarah','GBEYA','user','pending_choa','Gbéya','CA','Montreal','F','1998-12-01',
  '+15141234503','Étudiante Droit','Étudiante LL.B','Bac+3','Licence Droit (en cours)',0,'1001 Rue Sherbrooke, Montréal H3A 1G5',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000022','junior.gbeya@test-racines.com',
  'Junior','GBEYA','user','pending_choa','Gbéya','CI','Abidjan','M','1999-05-20',
  '+22507070701','Étudiant','Étudiant BTS','Bac','Baccalauréat',0,'Yopougon, Abidjan',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000023','olivia.gbeya@test-racines.com',
  'Olivia','GBEYA','user','pending_choa','Gbéya','FR','Bordeaux','F','2000-08-15',
  '+33611223304','Étudiante','Étudiante Licence 3','Bac','Baccalauréat ES',0,'15 Cours de l''Intendance, Bordeaux 33000',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000024','clement.gbeya@test-racines.com',
  'Clement','GBEYA','user','pending_choa','Gbéya','CH','Genève','M','1993-03-07',
  '+41791234501','Analyste','Analyste Données Financières','Bac+5','Master Finance Quantitative',1,'1 Rue du Mont-Blanc, Genève 1201',false,true);

PERFORM racines_insert_test_user('11111111-0000-4000-a000-000000000025','fatoumata.gbeya@test-racines.com',
  'Fatoumata','GBEYA','user','pending_choa','Gbéya','SN','Dakar','F','1990-11-30',
  '+221771234502','Commerçante','Gérante Boutique Mode','Bac','Baccalauréat',2,'Sandaga, Dakar',false,true);

END $$;

-- =============================================================================
-- SECTION 3 — 20 MEMBRES FAMILLE BONYE (pending_choa)
-- =============================================================================
DO $$ BEGIN

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000001','yao.bonye@test-racines.com',
  'Yao','BONYE','user','pending_choa','Bonye','CI','Toa-Zéo','M','1935-10-10',
  '+22508888801','Planteur','Chef de Terre','Aucun','Sans diplôme',8,'Quartier Bonyé, Toa-Zéo',true,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000002','adjoua.konan@test-racines.com',
  'Adjoua','KONAN','user','pending_choa','Bonye','CI','Bouaflé','F','1942-03-12',
  '+22508888802','Ménagère','Femme au Foyer','Primaire','CEPE',6,'Quartier Koko, Bouaflé',true,false);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000003','ange.bonye@test-racines.com',
  'Ange','BONYE','user','pending_choa','Bonye','CI','Abidjan','M','1970-01-15',
  '+22501010101','Avocat','Avocat Associé','Bac+5','Master Droit des Affaires',3,'Plateau Immeuble Alpha, Abidjan',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000004','beatrice.bonye@test-racines.com',
  'Beatrice','BONYE','user','pending_choa','Bonye','CI','Bouaflé','F','1973-08-08',
  '+22502020202','Comptable','Assistante Comptable','Bac+2','BTS Comptabilité',2,'Quartier Commerce, Bouaflé',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000005','charles.bonye@test-racines.com',
  'Charles','BONYE','user','pending_choa','Bonye','CI','Oumé','M','1975-06-20',
  '+22503030303','Professeur','Professeur de SVT','Bac+4','Licence SVT',2,'Quartier Lycée, Oumé',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000006','gnagne.bonye@test-racines.com',
  'Gnagne','BONYE','user','pending_choa','Bonye','CI','Bouaké','M','1982-10-12',
  '+22507766012','Technicien','Technicien Bâtiment','CAP','CAP Maçonnerie',3,'Koko, Bouaké',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000007','kouame.zouhae@test-racines.com',
  'Kouame','ZOUHAE','user','pending_choa','Bonye','CI','Daloa','M','1979-01-05',
  '+22507537041','Commerçant','Gérant Commerce Général','Bac','Baccalauréat G2',4,'Marché de Daloa, Daloa',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000008','nda.gaho@test-racines.com',
  'Nda','GAHO','user','pending_choa','Bonye','CI','Duékoué','F','1992-08-16',
  '+22507268047','Infirmière','Infirmière d''État','Bac+3','Diplôme État Infirmier',1,'Centre Ville, Duékoué',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000009','armand.bonye@test-racines.com',
  'Armand','BONYE','user','pending_choa','Bonye','FR','Marseille','M','1988-04-22',
  '+33611223305','Ingénieur','Ingénieur Génie Civil','Bac+5','Master Génie Civil',0,'45 La Canebière, Marseille 13001',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000010','clarisse.bonye@test-racines.com',
  'Clarisse','BONYE','user','pending_choa','Bonye','BE','Bruxelles','F','1985-09-14',
  '+32478000003','Juriste','Juriste d''Entreprise','Bac+5','Master Droit',2,'Avenue Louise 65, Bruxelles 1050',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000011','estelle.bonye@test-racines.com',
  'Estelle','BONYE','user','pending_choa','Bonye','CI','Abidjan','F','1991-06-30',
  '+22507112233','Banquière','Chargée de Clientèle','Bac+4','Licence Banque-Finance',1,'Deux Plateaux, Abidjan',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000012','herve.bonye@test-racines.com',
  'Herve','BONYE','user','pending_choa','Bonye','CI','Yamoussoukro','M','1983-02-17',
  '+22507998877','Agriculteur','Producteur Cacao','Bac','Baccalauréat',3,'Quartier Habitat, Yamoussoukro',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000013','inah.bonye@test-racines.com',
  'Inah','BONYE','user','pending_choa','Bonye','CI','San-Pédro','F','1989-11-05',
  '+22507661144','Étudiante','Étudiante Master 1','Bac+4','Master 1 Economie (en cours)',0,'Cité SOGEFIHA, San-Pédro',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000014','joel.bonye@test-racines.com',
  'Joel','BONYE','user','pending_choa','Bonye','GB','Londres','M','1994-07-19',
  '+447911000003','Développeur','Full Stack Developer','Bac+5','Master Computer Science',0,'221B Baker Street, London NW1 6XE',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000015','kah.bonye@test-racines.com',
  'Kah','BONYE','user','pending_choa','Bonye','CI','Abidjan','M','1977-03-28',
  '+22507554433','Transporteur','Gérant Agence Voyage','CAP','Permis Transport',5,'Adjamé, Abidjan',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000016','laure.bonye@test-racines.com',
  'Laure','BONYE','user','pending_choa','Bonye','FR','Paris','F','1996-08-12',
  '+33611223306','Étudiante','Étudiante Médecine P2','Bac','Baccalauréat S',0,'5 Rue des Écoles, Paris 75005',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000017','marc.bonye@test-racines.com',
  'Marc','BONYE','user','pending_choa','Bonye','CI','Bouaké','M','1981-05-03',
  '+22507223311','Médecin','Chirurgien','Bac+7','Doctorat Médecine - Chirurgie',4,'Quartier Air France, Bouaké',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000018','nadia.bonye@test-racines.com',
  'Nadia','BONYE','user','pending_choa','Bonye','CH','Genève','F','1987-10-21',
  '+41791234502','Pharmacienne','Pharmacienne Clinicienne','Bac+6','Doctorat Pharmacie',1,'Rue de Rive 12, Genève 1204',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000019','oscar.bonye@test-racines.com',
  'Oscar','BONYE','user','pending_choa','Bonye','CI','Man','M','1969-12-14',
  '+22507441122','Fonctionnaire','Receveur des Douanes','Bac+2','BTS Commerce International',6,'Quartier Administratif, Man',false,true);

PERFORM racines_insert_test_user('22222222-0000-4000-b000-000000000020','patricia.bonye@test-racines.com',
  'Patricia','BONYE','user','pending_choa','Bonye','CA','Toronto','F','1993-01-25',
  '+14161234501','Designer','UX/UI Designer','Bac+4','Licence Design Graphique',0,'100 King St W, Toronto M5X 1E1',false,true);

END $$;

-- =============================================================================
-- SECTION 4 — Victimes du Mémorial 2010
-- =============================================================================
INSERT INTO public.memorial_victims (id, nom, prenoms, genre, age_approximatif, quartier_nom, description_circonstances, is_verified, created_at, updated_at)
VALUES
  ('a1000000-0000-4000-0000-000000000001','GBEYA','Alain','M',39,'Gbéya','Victime des affrontements de 2010 à son domicile',true,NOW(),NOW()),
  ('a1000000-0000-4000-0000-000000000002','BONYE','David','M',30,'Bonye','Décédé lors des violences post-électorales de mars 2011',true,NOW(),NOW()),
  ('a1000000-0000-4000-0000-000000000003','GBEYA','Akissi','F',42,'Gbéya','Victime des affrontements de décembre 2010',true,NOW(),NOW())
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom, is_verified = true;

-- Nettoyage de la fonction helper (optionnel, la garder évite de la recréer)
-- DROP FUNCTION IF EXISTS racines_insert_test_user;

-- =============================================================================
-- RÉCAPITULATIF COMPTES DE TEST
-- =============================================================================
-- ÉQUIPE (confirmed, complets)
-- admin.racines@racines-plus.com   / Racines2026!  → /admin
-- cho.gbeya@racines-plus.com       / Racines2026!  → /cho
-- choa.gbeya1@racines-plus.com     / Racines2026!  → /choa  (valide quartier Gbéya)
-- choa.gbeya2@racines-plus.com     / Racines2026!  → /choa
-- choa.bonye1@racines-plus.com     / Racines2026!  → /choa  (valide quartier Bonyé)
-- choa.bonye2@racines-plus.com     / Racines2026!  → /choa
--
-- MEMBRES (pending_choa → à valider par CHOa puis CHO)
-- kwame.gbeya@test-racines.com     / Racines2026!
-- kofi.gbeya@test-racines.com      / Racines2026!
-- ama.assi@test-racines.com        / Racines2026!
-- ... (25 Gbéya + 20 Bonyé = 45 au total)
--
-- CHAMPS NON REMPLIS INTENTIONNELLEMENT (remplis lors du workflow de validation) :
-- choa_approvals, rejection_motif, rejection_observations,
-- certificate_issued_at, ancestral_root_id (lié via Neo4j)
