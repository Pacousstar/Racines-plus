-- Ajout des colonnes de contact à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_1 TEXT,
ADD COLUMN IF NOT EXISTS phone_2 TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_1 TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_2 TEXT;

COMMENT ON COLUMN profiles.phone_1 IS 'Numéro de téléphone principal avec indicatif';
COMMENT ON COLUMN profiles.whatsapp_1 IS 'Numéro WhatsApp principal avec indicatif';
