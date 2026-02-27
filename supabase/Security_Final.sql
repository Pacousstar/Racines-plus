-- ============================================================
-- RACINES+ — SÉCURISATION FINALE (DOUBLE PROTECTION RLS)
-- ⚠️ Ce script sécurise TOUTES les tables du projet
-- ============================================================

-- 1. Table PROFILES (Déjà partiellement traitée, on renforce)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Suppression propre pour éviter les doublons
DROP POLICY IF EXISTS "profil_acces_soi_meme" ON public.profiles;
DROP POLICY IF EXISTS "profil_acces_management" ON public.profiles;

-- Accès total à son propre profil
CREATE POLICY "profil_acces_soi_meme" 
ON public.profiles FOR ALL 
USING (auth.uid() = id);

-- Accès lecture pour le management (Admin, CHO, CHOa)
CREATE POLICY "profil_acces_management" 
ON public.profiles FOR SELECT 
USING (public.is_admin_or_management(auth.uid()));

-- 2. Table VILLAGES (Lecture publique, Création Admin)
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "villages_lecture_publique" ON public.villages;
DROP POLICY IF EXISTS "villages_admin_all" ON public.villages;

CREATE POLICY "villages_lecture_publique" ON public.villages
FOR SELECT USING (true);

CREATE POLICY "villages_admin_all" ON public.villages
FOR ALL USING (public.is_admin_or_management(auth.uid())); -- Seul le management gère les villages

-- 3. Table ANCESTRES (Lecture publique, Gestion Admin/CHO)
ALTER TABLE public.ancestres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ancestres_lecture_publique" ON public.ancestres;
DROP POLICY IF EXISTS "ancestres_gestion_management" ON public.ancestres;

CREATE POLICY "ancestres_lecture_publique" ON public.ancestres
FOR SELECT USING (true);

CREATE POLICY "ancestres_gestion_management" ON public.ancestres
FOR ALL USING (public.is_admin_or_management(auth.uid()));

-- 4. Table VALIDATIONS (Management uniquement)
-- Si la table n'existe pas encore, on la crée (plus robuste)
CREATE TABLE IF NOT EXISTS public.validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    validator_id UUID REFERENCES public.profiles(id),
    role_validateur TEXT,
    statut TEXT,
    decision_finale BOOLEAN DEFAULT false,
    motif TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "validations_acces_management" ON public.validations;

CREATE POLICY "validations_acces_management" ON public.validations
FOR ALL USING (public.is_admin_or_management(auth.uid()));

-- 5. Table INVITATIONS (Expéditeur et Management)
-- Création si absente (comme vu dans les composants)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID REFERENCES public.profiles(id),
    email_invite TEXT NOT NULL,
    village_concerne TEXT,
    is_joined BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_acces_proprietaire" ON public.invitations;
DROP POLICY IF EXISTS "invitations_acces_management" ON public.invitations;

CREATE POLICY "invitations_acces_proprietaire" ON public.invitations
FOR ALL USING (auth.uid() = inviter_id);

CREATE POLICY "invitations_acces_management" ON public.invitations
FOR SELECT USING (public.is_admin_or_management(auth.uid()));

-- 6. Fonction de filtrage par quartier pour CHOa (Bonus Sécurité)
-- Permet de s'assurer que même si l'interface oublie, la DB bloque
CREATE OR REPLACE FUNCTION public.check_choa_access(target_profile_id UUID)
RETURNS boolean AS $$
DECLARE
    current_user_role TEXT;
    current_user_village TEXT;
    current_user_quartier TEXT;
    target_village TEXT;
    target_quartier TEXT;
BEGIN
    -- Obtenir les infos du validateur (auth.uid())
    SELECT role, village_origin, quartier_nom 
    INTO current_user_role, current_user_village, current_user_quartier 
    FROM public.profiles WHERE id = auth.uid();
    
    -- Si Admin ou CHO, accès total au village
    IF current_user_role IN ('admin', 'cho') THEN
        RETURN true;
    END IF;
    
    -- Si CHOa, on vérifie le quartier
    IF current_user_role = 'choa' THEN
        SELECT village_origin, quartier_nom 
        INTO target_village, target_quartier 
        FROM public.profiles WHERE id = target_profile_id;
        
        RETURN (target_village = current_user_village AND target_quartier = current_user_quartier);
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Sécurité de Racines+ renforcée sur toutes les tables !' as statut;
