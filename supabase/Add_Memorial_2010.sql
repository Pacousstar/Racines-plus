-- ============================================================
-- RACINES+ — MÉMORIAL 2010
-- ============================================================

-- 1. Table des victimes du mémorial
CREATE TABLE IF NOT EXISTS public.memorial_victims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    prenoms TEXT NOT NULL,
    genre TEXT CHECK (genre IN ('M', 'F')),
    age_approximatif INTEGER,
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    quartier_nom TEXT, -- Nom du quartier (peut être lié ou texte libre pour plus de flexibilité)
    annee_evenement INTEGER DEFAULT 2010,
    description_circonstances TEXT,
    photo_url TEXT,
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Activation du RLS
ALTER TABLE public.memorial_victims ENABLE ROW LEVEL SECURITY;

-- 3. Politiques d'accès
DROP POLICY IF EXISTS "memorial_public_read" ON public.memorial_victims;
DROP POLICY IF EXISTS "memorial_admin_all" ON public.memorial_victims;
DROP POLICY IF EXISTS "memorial_user_insert" ON public.memorial_victims;

-- Tout le monde peut consulter le mémorial (Devoir de mémoire public)
CREATE POLICY "memorial_public_read" ON public.memorial_victims
FOR SELECT USING (true);

-- Les Admins ont un contrôle total
CREATE POLICY "memorial_admin_all" ON public.memorial_victims
FOR ALL USING (public.check_admin_access(auth.uid()));

-- Les utilisateurs connectés peuvent proposer une victime (en attente de vérification)
CREATE POLICY "memorial_user_insert" ON public.memorial_victims
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Index pour la performance
CREATE INDEX IF NOT EXISTS idx_memorial_village ON public.memorial_victims(village_id);
CREATE INDEX IF NOT EXISTS idx_memorial_nom ON public.memorial_victims(nom, prenoms);

SELECT '✅ Table memorial_victims initialisée !' as statut;
