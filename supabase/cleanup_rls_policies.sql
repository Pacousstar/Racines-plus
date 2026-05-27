-- =============================================================
-- Cleanup: Supprimer les politiques RLS avec sous-requêtes brutes
-- sur `profiles` qui causent une récursion infinie.
-- 
-- Les opérations admin passent désormais par des API routes
-- avec la clé service_role (bypass RLS).
-- Les politiques SECURITY DEFINER (is_admin_or_management,
-- check_admin_access) restent actives pour les accès directs.
-- =============================================================

-- 1. profiles (UPDATE)
DROP POLICY IF EXISTS "cho_update_profile_status" ON public.profiles;
DROP POLICY IF EXISTS "admin_full_access_profiles" ON public.profiles;

-- 2. admin_permissions (INSERT, UPDATE)
DROP POLICY IF EXISTS "Admin_Manage_Permissions" ON public.admin_permissions;

-- 3. villages (INSERT, DELETE, UPDATE)
DROP POLICY IF EXISTS "admin_write_villages" ON public.villages;

-- 4. quartiers (INSERT, DELETE)
DROP POLICY IF EXISTS "admin_write_quartiers" ON public.quartiers;

-- 5. ancestres (INSERT)
DROP POLICY IF EXISTS "cho_write_ancestres" ON public.ancestres;

-- =============================================================
-- Vérification : les politiques SECURITY DEFINER restent intactes
-- =============================================================
-- Profiles (SELECT) : profil_lecture_publique (via is_admin_or_management)
-- Profiles (UPDATE) : user_update_own_profile (auth.uid() = id), profil_acces_soi_meme
-- Villages : villages_admin_all (via is_admin_or_management)
-- Quartiers : quartiers_admin_all (via is_admin_or_management)
-- Ancestres : ancestres_gestion_management (via is_admin_or_management)
-- Admin permissions : aucune autre politique (accès via API uniquement)
-- =============================================================
