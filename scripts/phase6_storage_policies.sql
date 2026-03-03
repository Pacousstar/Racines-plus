-- ==========================================
-- SCRIPT: CRÉATION DES BUCKETS STORAGE ET POLITIQUES RLS
-- PHASE 6 : Archives et Médias (RÉVISION CHEFFE DE PROJET)
-- ==========================================

-- 1. CRÉATION (OU MISE À JOUR) DES BUCKETS AVEC LIMITES DE TAILLE ET TYPES MIME
-- Un seau sans limite va planter le serveur. Excellent réflexe !

-- Bucket 'archives' (Privé, 5 Mo max, Uniquement PDF, JPG, PNG)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'archives', 
  'archives', 
  false, 
  5242880, -- 5 MB (5 * 1024 * 1024)
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket 'media' (Public, 10 Mo max, Photos et Petites vidéos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'media', 
  'media', 
  true, 
  10485760, -- 10 MB (10 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==========================================
-- 2. POLITIQUES DE SÉCURITÉ (RLS) POUR LE BUCKET 'media' 
-- ==========================================

-- Lecture (Lister / Voir) : Tout le monde connecté peut VOIR la galerie
CREATE POLICY "Les membres connectes peuvent voir les medias"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media' AND auth.role() = 'authenticated' );

-- Écriture (Ajouter) : Chacun upload pour LUI-MÊME (auth.uid() = owner)
CREATE POLICY "Les membres peuvent ajouter leurs propres medias"
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'media' AND auth.uid() = owner );

-- Modification (Update) : Un utilisateur ne met à jour que ses fichiers
CREATE POLICY "Les membres ne modifient que leurs medias"
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'media' AND auth.uid() = owner );

-- Suppression (Delete) : Chacun ne peut supprimer QUE ses propres médias
CREATE POLICY "Les membres suppriment seulement leurs medias"
ON storage.objects FOR DELETE
USING ( bucket_id = 'media' AND auth.uid() = owner );

-- ==========================================
-- 3. POLITIQUES DE SÉCURITÉ (RLS) POUR LE BUCKET 'archives' (Validation confirmée)
-- ==========================================

-- Lecture : Un utilisateur ne peut voir QUE SES PROPRES archives (sécurité documentaire)
CREATE POLICY "Les utilisateurs lisent leurs propres archives"
ON storage.objects FOR SELECT
USING ( bucket_id = 'archives' AND auth.uid() = owner );

-- Écriture : Un utilisateur uploade ses propres archives
CREATE POLICY "Les utilisateurs ajoutent leurs archives"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'archives' AND auth.uid() = owner );

-- Suppression : Un utilisateur supprime ses propres archives
CREATE POLICY "Les utilisateurs suppriment leurs archives"
ON storage.objects FOR DELETE
USING ( bucket_id = 'archives' AND auth.uid() = owner );
