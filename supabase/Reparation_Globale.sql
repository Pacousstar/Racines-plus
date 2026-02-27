-- ============================================================
-- RACINES+ — SCRIPT DE RÉPARATION FINALE (ANTI-RÉCURSION)
-- ⚠️ Copiez et exécutez TOUT ce script dans le SQL Editor de Supabase
-- ============================================================

-- 1. Désactiver temporairement pour nettoyer sans erreur
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les polices existantes (nettoyage total)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Fonction SECURITY DEFINER Robuste
-- Cette fonction s'exécute avec les privilèges du créateur (postgres)
-- Elle BYPASSE le RLS, évitant ainsi la récursion infinie.
CREATE OR REPLACE FUNCTION public.is_admin_or_management(user_id UUID)
RETURNS boolean AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    RETURN user_role IN ('admin', 'cho', 'choa');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Ré-activer et appliquer les polices SAFES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Police pour soi-même (Simple et Directe)
CREATE POLICY "profil_acces_soi_meme" 
ON public.profiles FOR ALL 
USING (auth.uid() = id);

-- Police pour le management (Utilise la fonction Security Definer qui ne boucle pas)
CREATE POLICY "profil_acces_management" 
ON public.profiles FOR SELECT 
USING (public.is_admin_or_management(auth.uid()));

-- 5. Fix Storage (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Accès public avatars" ON storage.objects;
CREATE POLICY "Accès public avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Upload authentifié" ON storage.objects;
CREATE POLICY "Upload authentifié" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 6. Garanties pour les tables de base
CREATE TABLE IF NOT EXISTS public.villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL UNIQUE,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ancestres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet TEXT NOT NULL,
    periode TEXT,
    village_id UUID REFERENCES public.villages(id),
    is_certified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.villages (nom, region) 
VALUES ('Toa-Zéo', 'Guémon') 
ON CONFLICT (nom) DO NOTHING;

SELECT '✅ Réparation terminée ! La récursion RLS est brisée. Votre dashboard devrait fonctionner.' as statut;
