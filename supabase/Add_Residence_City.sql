-- Ajout de la ville de résidence pour une cartographie des migrations plus précise
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS residence_city TEXT;

COMMENT ON COLUMN public.profiles.residence_city IS 'Ville actuelle de résidence du membre (pour la carte des migrations)';
