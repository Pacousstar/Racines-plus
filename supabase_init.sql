-- ==========================================
-- SCRIPT D'INITIALISATION : RACINES-MVP
-- À copier-coller dans l'onglet "SQL Editor" de Supabase
-- ==========================================

-- 1. Table des Utilisateurs (Profils étendus basés sur l'Auth Supabase)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE,
    gender VARCHAR(10),
    village_origin TEXT,
    residence_country VARCHAR(10),
    role VARCHAR(20) DEFAULT 'user', -- Rôles possibles : 'user', 'cho', 'admin'
    is_founder BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Activation de la sécurité (Row Level Security - RLS)
-- C'est ce qui rend la forteresse "inviolable" !
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Politiques de confidentialité
-- Chaque utilisateur ne peut voir et modifier que son propre profil pour l'instant
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Insertion automatique d'un profil quand un compte Auth est créé
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, '', '', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui déclenche la fonction ci-dessus
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Message de succès simulé pour le log
SELECT 'Initialisation des tables Racines+ terminée avec succès !' as statut;
