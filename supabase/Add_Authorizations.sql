-- ============================================================
-- RACINES+ — AJOUT DES SYSTÈMES D'AUTORISATION ET CERTIFICATS
-- ============================================================

-- 1. Ajout des colonnes de gestion dans la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS export_authorized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMP WITH TIME ZONE;

-- 2. Mise à jour des commentaires pour la clarté
COMMENT ON COLUMN public.profiles.export_authorized IS 'Autorise le CHO/CHOa à exporter les données en CSV';
COMMENT ON COLUMN public.profiles.certificate_requested IS 'Indique si l''utilisateur a demandé son certificat d''appartenance';
COMMENT ON COLUMN public.profiles.certificate_issued IS 'Indique si l''Admin a validé et délivré le certificat';

-- 3. Notification (optionnel) : On pourrait ajouter un trigger ici pour notifier l'admin
-- Pour l'instant on se base sur le polling/affichage dashboard.

SELECT '✅ Colonnes d''autorisation et certificats ajoutées avec succès !' as statut;
