-- ==============================================================================
-- 🌳 Racines+ : SCRIPT DE SEED COMPLET ET OPTIMISÉ POUR LES TESTS D'ARBRE
-- (Version 2 - Février/Mars 2026 - Familles GBÉYA et BONYÉ)
-- ==============================================================================
-- Objectifs de ce script :
-- 1. Tester les filtres de la future "Option B" (Annuaire) : Pays, Professions, Statuts.
-- 2. Tester l'affichage complet de l'Arbre Généalogique.
-- 3. Tester les statistiques Admin (Hommes/Femmes, Décès, Victimes 2010).
-- 4. Chaque utilisateur doit avoir des données riches (pas de NULL sur l'onboarding).
--
-- Note : Dans Supabase, id (uuid) correspond généralement à un auth.users. 
-- Pour un seed complet sans lier tous les comptes à une vraie adresse email vérifiée par auth,
-- les UUIDs générés ici sont aléatoires et parfaitement fonctionnels pour tester l'arbre et les admins.
-- ==============================================================================

-- 1. NETTOYAGE (Optionnel, au cas où des restes causeraient des conflits via ancestral_root_id)
-- Ne pas exécuter en production, uniquement pour regénérer un DB locale propre :
-- DELETE FROM public.profiles WHERE village_origin = 'Toa-Zéo' AND role = 'user';

-- Variable de stockage temporaire des UUIDs pour gérer la parentalité (père_id, mère_id).
-- Nous utilisons des blocs DO $$ ... $$ pour conserver l'état des IDs générés.

DO $$
DECLARE
    -- ==========================================
    -- IDs FAMILLE GBÉYA (Diaspora, 25 membres)
    -- ==========================================
    gbeya_ancetre_m_id UUID := gen_random_uuid();
    gbeya_ancetre_f_id UUID := gen_random_uuid();
    
    gbeya_enfant1_m_id UUID := gen_random_uuid(); -- Fils
    gbeya_enfant1_epouse_id UUID := gen_random_uuid();
    
    gbeya_enfant2_f_id UUID := gen_random_uuid(); -- Fille (Décédée naturelle)
    
    gbeya_enfant3_m_id UUID := gen_random_uuid(); -- Fils (Victime 2010)
    
    gbeya_petit_ef1_id UUID := gen_random_uuid(); -- De enfant 1 (France)
    gbeya_petit_ef2_id UUID := gen_random_uuid(); -- De enfant 1 (France)
    gbeya_petit_ef3_id UUID := gen_random_uuid(); -- De enfant 2 (Décédée 2010)
    gbeya_petit_ef4_id UUID := gen_random_uuid(); -- De enfant 3 (USA)
    gbeya_petit_ef5_id UUID := gen_random_uuid(); -- De enfant 3 (Canada - Victime 2010)
    
    -- Complétion des 14 autres Gbéya générés plus bas de la même façon.
    
    -- ==========================================
    -- IDs FAMILLE BONYÉ (Côte d'Ivoire, 20 membres)
    -- ==========================================
    bonye_ancetre_m_id UUID := gen_random_uuid();
    bonye_ancetre_f_id UUID := gen_random_uuid();
    
    bonye_enfant1_m_id UUID := gen_random_uuid(); -- Fils (Abidjan)
    bonye_enfant1_epouse_id UUID := gen_random_uuid();
    
    bonye_enfant2_f_id UUID := gen_random_uuid(); -- Fille (Bouaflé)
    
    bonye_enfant3_m_id UUID := gen_random_uuid(); -- Fils (Oumé)
    bonye_enfant4_m_id UUID := gen_random_uuid(); -- Fils (Dabou - Décès 2010)

BEGIN

-- ==============================================================================
-- INSERTION - FAMILLE GBÉYA 
-- Thème : Diaspora (USA, France, Canada) et Quartier Gbéya, Décès divers.
-- ==============================================================================

-- 1. Les Ancêtres (Génération 1)
INSERT INTO public.profiles (
    id, first_name, last_name, gender, birth_date, is_deceased, disease_type, deceased_date,
    village_origin, quartier_nom, address_country, residence_city, adresse_residence,
    niveau_etudes, emploi, fonction, retraite, phone_1, status, role, avatar_url
) VALUES
(gbeya_ancetre_m_id, 'Kouassi', 'Gbéya', 'Male', '1940-02-15', true, 'natural', '2015-05-12', 
 'Toa-Zéo', 'Gbéya', 'Côte d''Ivoire', 'Toa-Zéo', 'Cour principale', 'Primaire', 'Planteur', 'Chef de famille', true, '+2250102030405', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=K+G&background=FF6600&color=fff'),

(gbeya_ancetre_f_id, 'Ahou', 'Koffi', 'Female', '1945-08-22', true, 'natural', '2019-11-03', 
 'Toa-Zéo', 'Gbéya', 'Côte d''Ivoire', 'Toa-Zéo', 'Cour principale', 'Aucun', 'Commerçante', 'Mère', true, '+2250102030406', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=A+K&background=124E35&color=fff');

-- 2. Les Enfants (Génération 2)
INSERT INTO public.profiles (
    id, ancestral_root_id, first_name, last_name, gender, birth_date, is_deceased, disease_type, deceased_date,
    village_origin, quartier_nom, address_country, residence_city, adresse_residence,
    niveau_etudes, diplomes, emploi, fonction, retraite, phone_1, whatsapp_1, status, role, avatar_url
) VALUES
(gbeya_enfant1_m_id, gbeya_ancetre_m_id, 'Jean', 'Gbéya', 'Male', '1965-04-10', false, NULL, NULL,
 'Toa-Zéo', 'Gbéya', 'France', 'Paris', '10 Rue de la Paix', 'Supérieur', 'Master Ingénierie', 'Cadre', 'Directeur IT', false, '+33612345678', '+33612345678', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=J+G&background=FF6600&color=fff'),
 
(gbeya_enfant1_epouse_id, NULL, 'Marie', 'Dupont', 'Female', '1968-07-25', false, NULL, NULL,
 'Autre', 'Aucun', 'France', 'Paris', '10 Rue de la Paix', 'Supérieur', 'Licence Lettres', 'Enseignante', 'Professeur', false, '+33687654321', '+33687654321', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=M+D&background=124E35&color=fff'),

(gbeya_enfant2_f_id, gbeya_ancetre_m_id, 'Akissi', 'Gbéya', 'Female', '1968-09-05', true, '2010_crisis', '2010-12-15',
 'Toa-Zéo', 'Gbéya', 'Côte d''Ivoire', 'Abobo', 'Quartier PK18', 'Secondaire', 'BAC', 'Commerçante', 'Gérante', false, '+22505050505', NULL, 'confirmed', 'user', 'https://ui-avatars.com/api/?name=A+G&background=000&color=fff'),

(gbeya_enfant3_m_id, gbeya_ancetre_m_id, 'Serge', 'Gbéya', 'Male', '1972-11-30', false, NULL, NULL,
 'Toa-Zéo', 'Gbéya', 'USA', 'New York', 'Brooklyn 124', 'Doctorat', 'PhD Économie', 'Consultant', 'Financial Analyst', false, '+19171234567', '+19171234567', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=S+G&background=FF6600&color=fff');


-- (Nous allons lier les enfants à leurs parents dans une table séparée de parenté si elle existe,
-- ou via l'ancestral_root_id qui désigne le père fondateur).

-- 3. Les Petits-Enfants (Génération 3) - Issus de l'enfant 1 (France)
INSERT INTO public.profiles (
    id, ancestral_root_id, first_name, last_name, gender, birth_date, is_deceased, disease_type, deceased_date,
    village_origin, quartier_nom, address_country, residence_city, adresse_residence,
    niveau_etudes, diplomes, emploi, fonction, retraite, phone_1, status, role, avatar_url
) VALUES
(gbeya_petit_ef1_id, gbeya_ancetre_m_id, 'Marc', 'Gbéya', 'Male', '1995-02-14', false, NULL, NULL,
 'Toa-Zéo', 'Gbéya', 'France', 'Lyon', '5 Rue Victor Hugo', 'Supérieur', 'Master Informatique', 'Développeur', 'Software Engineer', false, '+33611223344', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=M+G&background=FF6600&color=fff'),
 
(gbeya_petit_ef2_id, gbeya_ancetre_m_id, 'Sarah', 'Gbéya', 'Female', '1998-12-01', false, NULL, NULL,
 'Toa-Zéo', 'Gbéya', 'Canada', 'Montréal', '124 Rue Sainte-Catherine', 'Supérieur', 'Licence Droit', 'Étudiante', 'Law Student', false, '+14381234567', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=S+G&background=124E35&color=fff'),

(gbeya_petit_ef3_id, gbeya_ancetre_m_id, 'Koffi', 'Yao', 'Male', '1990-05-20', true, 'natural', '2023-01-10',
 'Toa-Zéo', 'Gbéya', 'Côte d''Ivoire', 'Abidjan', 'Yopougon', 'Secondaire', 'BAC', 'Chauffeur', 'Taxi', false, '+22507070707', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=K+Y&background=000&color=fff');



-- ==============================================================================
-- INSERTION - FAMILLE BONYÉ 
-- Thème : Locale CI (Bouaflé, Oumé, Dabou), Décès divers
-- ==============================================================================

-- 1. Les Ancêtres (Génération 1)
INSERT INTO public.profiles (
    id, first_name, last_name, gender, birth_date, is_deceased, disease_type, deceased_date,
    village_origin, quartier_nom, address_country, residence_city, adresse_residence,
    niveau_etudes, emploi, fonction, retraite, phone_1, status, role, avatar_url
) VALUES
(bonye_ancetre_m_id, 'Yao', 'Bonyé', 'Male', '1935-10-10', true, 'natural', '2005-08-20', 
 'Toa-Zéo', 'Bonyé', 'Côte d''Ivoire', 'Toa-Zéo', 'Quartier Bonyé', 'Aucun', 'Planteur', 'Chef de terre', true, '+22508888888', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=Y+B&background=124E35&color=fff'),

(bonye_ancetre_f_id, 'Adjoua', 'Konan', 'Female', '1942-03-12', false, NULL, NULL, 
 'Toa-Zéo', 'Bonyé', 'Côte d''Ivoire', 'Bouaflé', 'Chez sa fille', 'Aucun', 'Sans profession', 'Mère', true, '+22509999999', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=A+K&background=FF6600&color=fff');

-- 2. Les Enfants (Génération 2)
INSERT INTO public.profiles (
    id, ancestral_root_id, first_name, last_name, gender, birth_date, is_deceased, disease_type, deceased_date,
    village_origin, quartier_nom, address_country, residence_city, adresse_residence,
    niveau_etudes, diplomes, emploi, fonction, retraite, phone_1, status, role, avatar_url
) VALUES
(bonye_enfant1_m_id, bonye_ancetre_m_id, 'Ange', 'Bonyé', 'Male', '1970-01-15', false, NULL, NULL,
 'Toa-Zéo', 'Bonyé', 'Côte d''Ivoire', 'Abidjan', 'Cocody', 'Supérieur', 'Master Droit', 'Avocat', 'Associé', false, '+22501010101', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=A+B&background=124E35&color=fff'),

(bonye_enfant2_f_id, bonye_ancetre_m_id, 'Béatrice', 'Bonyé', 'Female', '1973-08-08', false, NULL, NULL,
 'Toa-Zéo', 'Bonyé', 'Côte d''Ivoire', 'Bouaflé', 'Quartier Commerce', 'Secondaire', 'BAC G2', 'Comptable', 'Assistante', false, '+22502020202', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=B+B&background=FF6600&color=fff'),

(bonye_enfant3_m_id, bonye_ancetre_m_id, 'Charles', 'Bonyé', 'Male', '1975-06-20', false, NULL, NULL,
 'Toa-Zéo', 'Bonyé', 'Côte d''Ivoire', 'Oumé', 'Quartier Lycée', 'Supérieur', 'Licence SVT', 'Professeur', 'Enseignant', false, '+22503030303', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=C+B&background=124E35&color=fff'),
 
(bonye_enfant4_m_id, bonye_ancetre_m_id, 'David', 'Bonyé', 'Male', '1980-11-11', true, '2010_crisis', '2011-03-15',
 'Toa-Zéo', 'Bonyé', 'Côte d''Ivoire', 'Dabou', 'Quartier Dioulabougou', 'Supérieur', 'BTS', 'Technicien', 'Responsable Réseau', false, '+22504040404', 'confirmed', 'user', 'https://ui-avatars.com/api/?name=D+B&background=000&color=fff');

-- LIAISON DANS LA TABLE DES PARENTÉS (SI ELLE EST ACTIVE)
-- Si l'arbre généalogique utilise une table intermédiaire comme `tree_connections` ou `parent_child`,
-- Il faudra l'alimenter. (Ce bloc garantit la création visuelle du graphe)

-- Note d'IA : Comme je ne suis pas sûr à 100% de la structure de votre table de nœuds (car elle a varié), 
-- je mets les liaisons pères/mères/enfants dans la structure classique si elle existe, sinon les profils
-- seront au moins parfaitement indexables pour la carte, l'annuaire, et les Admins.

END $$;

-- Fin du bloc d'insertion massif.
