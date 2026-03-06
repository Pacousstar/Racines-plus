-- ============================================================
-- Script SQL Corrections Critiques Racines+
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter la colonne confirmed_source (manquante → bloquait les changements de rôle)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS confirmed_source text DEFAULT NULL;

-- 2. Marquer les CHO/CHOa/admin existants comme confirmés préalablement par l'admin
UPDATE profiles 
SET confirmed_source = 'admin_prelim'
WHERE role IN ('cho', 'choa', 'admin') AND status = 'confirmed';

-- 3. MIGRATION CRITIQUE : Remettre TOUS les users (role='user') qui ont status='confirmed'
--    en pending_choa (ILS N'ONT PAS SUIVI LE WORKFLOW CHOa → c'était une erreur)
--    SAUF : ceux explicitement confirmés via workflow (aucun pour l'instant)
UPDATE profiles
SET 
    status = 'pending_choa',
    choa_approvals = '[]'::jsonb,
    confirmed_source = NULL,
    updated_at = NOW()
WHERE role = 'user' 
  AND status IN ('confirmed', 'probable', 'pre_approved', 'pending', 'pending_choa');

-- Note: Si vous voulez garder certains users confirmés (ex: tests), 
-- ajoutez : AND id NOT IN ('uuid1', 'uuid2')

-- 4. S'assurer que choa_approvals est bien un tableau vide par défaut pour tous les users
UPDATE profiles
SET choa_approvals = '[]'::jsonb
WHERE role = 'user' AND choa_approvals IS NULL;

-- 5. Vérification finale
SELECT role, status, confirmed_source, COUNT(*) as nb
FROM profiles
GROUP BY role, status, confirmed_source
ORDER BY role, status;
