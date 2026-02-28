-- ============================================================
-- RACINES+ — GESTION DES QUARTIERS
-- ============================================================

-- 1. Création de la table quartiers
CREATE TABLE IF NOT EXISTS public.quartiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(village_id, nom)
);

-- 2. Activation de RLS
ALTER TABLE public.quartiers ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS
DROP POLICY IF EXISTS "quartiers_lecture_publique" ON public.quartiers;
DROP POLICY IF EXISTS "quartiers_admin_all" ON public.quartiers;

CREATE POLICY "quartiers_lecture_publique" ON public.quartiers
FOR SELECT USING (true);

CREATE POLICY "quartiers_admin_all" ON public.quartiers
FOR ALL USING (public.is_admin_or_management(auth.uid()));

-- 4. Insertion des quartiers par défaut pour Toa-Zéo (si le village existe)
DO $$
DECLARE
    toa_zeo_id UUID;
BEGIN
    SELECT id INTO toa_zeo_id FROM public.villages WHERE nom = 'Toa-Zéo' LIMIT 1;
    
    IF toa_zeo_id IS NOT NULL THEN
        INSERT INTO public.quartiers (village_id, nom)
        VALUES 
            (toa_zeo_id, 'Kébadi-Oula'),
            (toa_zeo_id, 'Baou-Oula'),
            (toa_zeo_id, 'Gouétahibou-Oula'),
            (toa_zeo_id, 'Dioulabougou')
        ON CONFLICT (village_id, nom) DO NOTHING;
    END IF;
END $$;

SELECT '✅ Table quartiers créée et peuplée pour Toa-Zéo !' as statut;
