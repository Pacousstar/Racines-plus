-- ============================================================
-- RACINES+ — PRODUCTION FIXES & CONSOLIDATION
-- ⚠️ Correctif pour les fonctions de sécurité manquantes
-- ============================================================

-- 1. Fonction de vérification Admin (SECURITY DEFINER pour éviter récursion)
CREATE OR REPLACE FUNCTION public.check_admin_access(user_id UUID)
RETURNS boolean AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Utilisation d'un cache ou d'une requête directe sur profiles
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fonction de vérification Management (Admin, CHO, CHOa)
CREATE OR REPLACE FUNCTION public.is_admin_or_management(user_id UUID)
RETURNS boolean AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    RETURN user_role IN ('admin', 'cho', 'choa');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Mise à jour des politiques RLS sur memorial_victims pour utiliser la fonction corrigée
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'memorial_victims') THEN
        DROP POLICY IF EXISTS "memorial_admin_all" ON public.memorial_victims;
        CREATE POLICY "memorial_admin_all" ON public.memorial_victims
        FOR ALL USING (public.check_admin_access(auth.uid()));
    END IF;
END $$;

SELECT '✅ Fonctions de sécurité check_admin_access et is_admin_or_management stabilisées !' as statut;
