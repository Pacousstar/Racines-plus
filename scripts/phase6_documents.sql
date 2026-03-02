-- ========================================================================================
-- 🌳 Racines+ : SCRIPT SQL POUR LA PHASE 6 (Archives & Médias)
-- ========================================================================================

-- 1. CRÉATION DE LA TABLE `documents`
-- Cette table va lister tous les médias, reçus de baptême, actes, et photos souvenirs.
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('pdf', 'image', 'video')) NOT NULL,
    bucket_name TEXT CHECK (bucket_name IN ('archives', 'media')) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false, -- Privé par défaut
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index pour accélérer les recherches de documents par utilisateur
CREATE INDEX idx_documents_user_id ON public.documents(user_id);

-- 2. POLITIQUES DE SÉCURITÉ RLS POUR LA TABLE `documents`
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Politique 1 : Tout le monde peut voir les documents "publics"
CREATE POLICY "Les documents publics sont visibles par tous"
ON public.documents FOR SELECT
USING (is_public = true);

-- Politique 2 : L'auteur peut voir, ajouter et modifier ses propres documents privés
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres documents"
ON public.documents FOR ALL
USING (auth.uid() = user_id);

-- Politique 3 : L'Admin et les CHO peuvent tout voir
CREATE POLICY "Admin et CHO gèrent tous les documents"
ON public.documents FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'cho')
    )
);

-- ========================================================================================
-- 🚨 IMPORTANT - ACTIONS À FAIRE MANUELLEMENT SUR SUPABASE STORAGE :
-- ========================================================================================
-- Comme l'API SQL ne permet pas de créer des Buckets Storage de façon fiable, vous devez :
-- 1. Aller sur votre Dashboard Supabase > Storage
-- 2. Cliquer sur "New Bucket"
-- 3. Créer un bucket nommé `archives` (Cochez "Public bucket" si vous souhaitez que les PDF s'ouvrent sans token temporaire)
-- 4. Créer un bucket nommé `media` (Cochez "Public bucket" pour un affichage rapide dans la gallerie)
-- ========================================================================================
