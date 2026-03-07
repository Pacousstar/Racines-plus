-- ============================================================
-- RACINES+ — EXTENSION DES PERMISSIONS ADMIN
-- ============================================================

-- Ajout des nouvelles colonnes de permissions dans la table admin_permissions
ALTER TABLE public.admin_permissions 
ADD COLUMN IF NOT EXISTS can_manage_roles BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_view_audit_logs BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_manage_settings BOOLEAN DEFAULT FALSE;

-- Mise à jour des permissions pour l'admin principal (Pacous) si nécessaire
-- Note : L'admin principal est déjà protégé par les politiques RLS basées sur son email,
-- mais cela garantit que son entrée dans admin_permissions est complète.
UPDATE public.admin_permissions 
SET can_manage_roles = TRUE,
    can_view_audit_logs = TRUE, 
    can_manage_settings = TRUE
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE email = 'Pacous2000@gmail.com'
);

-- Note : Ces modifications prendront effet immédiatement dans le Dashboard Admin 
-- une fois le code frontend mis à jour.
