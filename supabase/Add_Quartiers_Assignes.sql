-- =====================================================================
-- RACINES+ — Ajout colonne quartiers_assignes pour les CHOa
-- Exécuter dans Supabase > SQL Editor
-- =====================================================================
-- Permet à un CHOa d'être responsable de plusieurs quartiers
-- =====================================================================

-- 1. Ajouter la colonne au schéma profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS quartiers_assignes TEXT[] DEFAULT '{}';

-- 2. Migrer les données existantes : copier quartier_nom → quartiers_assignes
UPDATE public.profiles
SET quartiers_assignes = ARRAY[quartier_nom]
WHERE quartier_nom IS NOT NULL
  AND quartier_nom != ''
  AND (quartiers_assignes IS NULL OR array_length(quartiers_assignes, 1) IS NULL);

-- 3. Commentaire
COMMENT ON COLUMN profiles.quartiers_assignes IS
    'Quartiers dont le CHOa est responsable (tableau multi-valeurs, ex: {Gbéya, Bonyé})';

-- Vérification
SELECT id, first_name || '' || last_name AS nom, role, quartier_nom, quartiers_assignes
FROM public.profiles
WHERE role IN ('cho', 'choa')
ORDER BY role, last_name;
