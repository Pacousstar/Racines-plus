-- =============================================================================
-- RACINES+ — FIX SCHEMA : COLONNES MANQUANTES & ALIGNEMENT
-- Résout l'erreur 'poste' de l'assistant et unifie les filtres de l'annuaire.
-- À exécuter dans Supabase SQL Editor
-- =============================================================================

-- 1. Ajout de la colonne 'poste' à la table profiles
-- Cette colonne est requise par l'API de création d'assistant
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS poste TEXT;

-- 2. Alignement des colonnes de pays de résidence
-- L'onboarding et l'annuaire utilisent 'residence_country'
-- Certains composants utilisaient 'address_country' par erreur
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS residence_country TEXT;

-- Si address_country existait déjà et contenait des données, on les migre
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='address_country'
    ) THEN
        UPDATE public.profiles 
        SET residence_country = address_country 
        WHERE residence_country IS NULL;
    END IF;
END $$;

-- 3. Rafraîchissement du cache du schéma PostgREST
-- Cela permet à Supabase de "voir" immédiatement les nouvelles colonnes
NOTIFY pgrst, 'reload schema';

-- Message de confirmation
DO $$ BEGIN
    RAISE NOTICE 'Schéma mis à jour : colonne "poste" ajoutée et "residence_country" alignée.';
END $$;
