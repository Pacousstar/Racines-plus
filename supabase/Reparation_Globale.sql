-- ============================================================
-- RACINES+ — SCRIPT DE RÉPARATION GLOBALE (500/400)
-- ⚠️ Copiez et exécutez TOUT ce script dans le SQL Editor de Supabase
-- ============================================================

-- ══════════════════════════════════════════════════════════
-- 1. FIX DES ERREURS 500 (BOUCLE RLS RÉCURSIVE)
-- ══════════════════════════════════════════════════════════

-- Supprimer les anciennes polices qui causent la boucle infinie
DROP POLICY IF EXISTS "Management can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Créer une fonction "Security Definer" pour vérifier le rôle SANS déclencher le RLS à nouveau
CREATE OR REPLACE FUNCTION public.is_management()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'cho', 'choa')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer les nouvelles polices SÉCURISÉES et NON RÉCURSIVES
CREATE POLICY "Voir son propre profil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Management peut voir tous les profils" ON public.profiles
  FOR SELECT USING (public.is_management());

-- ══════════════════════════════════════════════════════════
-- 2. CRÉATION DES TABLES MANQUANTES (Évite les 404/500 PostgREST)
-- ══════════════════════════════════════════════════════════

-- Table des Villages
CREATE TABLE IF NOT EXISTS public.villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL UNIQUE,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des Ancêtres Fondateurs
CREATE TABLE IF NOT EXISTS public.ancestres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet TEXT NOT NULL,
    periode TEXT, -- ex: "1850"
    village_id UUID REFERENCES public.villages(id),
    is_certified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertion du village pilote si inexistant
INSERT INTO public.villages (nom, region) 
VALUES ('Toa-Zéo', 'Guémon') 
ON CONFLICT (nom) DO NOTHING;

-- ══════════════════════════════════════════════════════════
-- 3. FIX DES ERREURS 400 (STORAGE AVATARS)
-- ══════════════════════════════════════════════════════════

-- S'assurer que le bucket 'avatars' est PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Polices d'accès au stockage (Bucket avatars)
DROP POLICY IF EXISTS "Avatars publics" ON storage.objects;
CREATE POLICY "Avatars publics" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Upload avatars" ON storage.objects;
CREATE POLICY "Upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Update own avatar" ON storage.objects;
CREATE POLICY "Update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = name);
