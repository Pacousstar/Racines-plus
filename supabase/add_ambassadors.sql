-- ============================================================
-- RACINES+ — AJOUT DU RÔLE AMBASSADEUR ET CONFIGURATION
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. Ajouter la colonne is_ambassadeur si elle n'existe pas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_ambassadeur BOOLEAN DEFAULT FALSE;

-- 2. Ajouter la colonne de demande d'export pour une gestion granulaire
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS export_authorized BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS export_requested BOOLEAN DEFAULT FALSE;

-- 3. Mise à jour massive : s'assurer que l'Admin Principal est actif
-- Identification de l'Admin Principal : Pacous2000@gmail.com
UPDATE public.profiles 
SET role = 'admin', status = 'confirmed' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'Pacous2000@gmail.com'
);

-- 4. Forcer le statut confirmé pour les ambassadeurs (quand le rôle est affecté via l'UI)
-- Note: La logique de transition sera gérée par l'interface admin.

-- 5. Index pour la recherche rapide des ambassadeurs
CREATE INDEX IF NOT EXISTS idx_profiles_is_ambassadeur ON public.profiles(is_ambassadeur) WHERE is_ambassadeur = TRUE;

DO $$ 
BEGIN 
    RAISE NOTICE 'Configuration du rôle Ambassadeur et de l''Admin Principal terminée.';
END $$;
