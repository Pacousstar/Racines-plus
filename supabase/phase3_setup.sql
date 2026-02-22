-- ============================================================
-- RACINES+ — Script SQL Phase 3 CORRIGÉ (v2)
-- Correction erreur 42P10 : ajout des contraintes UNIQUE
-- À exécuter dans Supabase → SQL Editor → New Query → Run
-- ============================================================

-- ─────────────────────────────────────
-- 1. EXTENSION UUID
-- ─────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────
-- 2. TABLE : villages
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.villages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom         TEXT NOT NULL,
    region      TEXT,
    pays        TEXT DEFAULT 'CI',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Contrainte UNIQUE nécessaire pour ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS villages_nom_unique ON public.villages(nom);

-- Village pilote pré-rempli
INSERT INTO public.villages (nom, region, pays)
VALUES ('Toa-Zéo', 'Guémon', 'CI')
ON CONFLICT (nom) DO NOTHING;

-- ─────────────────────────────────────
-- 3. TABLE : quartiers
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quartiers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom         TEXT NOT NULL,
    village_id  UUID REFERENCES public.villages(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Contrainte UNIQUE nécessaire pour ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS quartiers_nom_village_unique ON public.quartiers(nom, village_id);

-- Quartiers de Toa-Zéo
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM public.villages WHERE nom = 'Toa-Zéo';
    IF v_id IS NOT NULL THEN
        INSERT INTO public.quartiers (nom, village_id) VALUES
            ('Quartier Centre',     v_id),
            ('Quartier Nord',       v_id),
            ('Quartier Sud',        v_id),
            ('Quartier Est',        v_id),
            ('Quartier Fondateurs', v_id)
        ON CONFLICT (nom, village_id) DO NOTHING;
    END IF;
END $$;

-- ─────────────────────────────────────
-- 4. TABLE : ancestres (ancêtre du village, inscrit par le CHO)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ancestres (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id      UUID REFERENCES public.villages(id) ON DELETE CASCADE,
    quartier_id     UUID REFERENCES public.quartiers(id),
    nom_complet     TEXT NOT NULL,
    periode         TEXT,         -- Ex: "XIXe siècle"
    source          TEXT,         -- Témoin oral ou document
    is_certified    BOOLEAN DEFAULT FALSE,
    certified_by    UUID,         -- validator_id CHO
    certified_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Un seul ancêtre fondateur certifié par village
CREATE UNIQUE INDEX IF NOT EXISTS ancestres_village_unique ON public.ancestres(village_id) WHERE is_certified = TRUE;

-- ─────────────────────────────────────
-- 5. TABLE : profiles (étendue)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name          TEXT,
    last_name           TEXT,
    birth_date          DATE,
    gender              TEXT,
    village_origin      TEXT DEFAULT 'Toa-Zéo',
    quartier_nom        TEXT,
    ancestral_root_id   UUID REFERENCES public.ancestres(id),  -- Ancêtre sélectionné
    residence_country   TEXT DEFAULT 'CI',
    avatar_url          TEXT,
    is_founder          BOOLEAN DEFAULT TRUE,
    role                TEXT DEFAULT 'user',
    status              TEXT DEFAULT 'pending',
    rejection_motif     TEXT,
    rejection_observations TEXT,
    is_locked           BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 6. TABLE : validations (journal d'audit CHO)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.validations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    validator_id    UUID REFERENCES public.profiles(id),
    role_validateur TEXT,
    statut          TEXT DEFAULT 'en_attente',
    motif           TEXT,
    observations    TEXT,
    decision_finale BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────
-- 7. TABLE : invitations famille
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_invite    TEXT NOT NULL,
    token           TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    status          TEXT DEFAULT 'pending',  -- 'pending', 'accepted', 'expired'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- ─────────────────────────────────────
-- 8. TRIGGER : auto-création du profil à l'inscription
-- ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, role, status)
    VALUES (NEW.id, 'user', 'pending')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────
-- 9. TRIGGER : updated_at automatique
-- ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────
-- 10. ACTIVER RLS
-- ─────────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quartiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ancestres   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────
-- 11. POLITIQUES RLS — profiles
-- ─────────────────────────────────────
DROP POLICY IF EXISTS "user_read_own_profile"        ON public.profiles;
DROP POLICY IF EXISTS "user_update_own_profile"       ON public.profiles;
DROP POLICY IF EXISTS "user_insert_own_profile"       ON public.profiles;
DROP POLICY IF EXISTS "cho_read_village_profiles"     ON public.profiles;
DROP POLICY IF EXISTS "cho_update_profile_status"     ON public.profiles;
DROP POLICY IF EXISTS "admin_full_access_profiles"    ON public.profiles;

CREATE POLICY "user_read_own_profile"     ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_update_own_profile"   ON public.profiles FOR UPDATE USING (auth.uid() = id AND is_locked = FALSE);
CREATE POLICY "user_insert_own_profile"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "cho_read_village_profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('cho','choa','admin'))
);
CREATE POLICY "cho_update_profile_status" ON public.profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('cho','choa','admin'))
);
CREATE POLICY "admin_full_access_profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ─────────────────────────────────────
-- 12. POLITIQUES RLS — villages & quartiers (lecture publique)
-- ─────────────────────────────────────
DROP POLICY IF EXISTS "public_read_villages"   ON public.villages;
DROP POLICY IF EXISTS "public_read_quartiers"  ON public.quartiers;
DROP POLICY IF EXISTS "admin_write_villages"   ON public.villages;
DROP POLICY IF EXISTS "admin_write_quartiers"  ON public.quartiers;

CREATE POLICY "public_read_villages"  ON public.villages  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "public_read_quartiers" ON public.quartiers FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_write_villages"  ON public.villages  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_write_quartiers" ON public.quartiers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─────────────────────────────────────
-- 13. POLITIQUES RLS — ancestres
-- ─────────────────────────────────────
DROP POLICY IF EXISTS "public_read_ancestres" ON public.ancestres;
DROP POLICY IF EXISTS "cho_write_ancestres"   ON public.ancestres;

CREATE POLICY "public_read_ancestres" ON public.ancestres FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "cho_write_ancestres"   ON public.ancestres FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('cho','admin'))
);

-- ─────────────────────────────────────
-- 14. POLITIQUES RLS — validations
-- ─────────────────────────────────────
DROP POLICY IF EXISTS "cho_read_validations"   ON public.validations;
DROP POLICY IF EXISTS "cho_insert_validations" ON public.validations;
DROP POLICY IF EXISTS "admin_full_validations" ON public.validations;

CREATE POLICY "cho_read_validations"   ON public.validations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('cho','choa','admin'))
);
CREATE POLICY "cho_insert_validations" ON public.validations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('cho','choa','admin'))
);
CREATE POLICY "admin_full_validations" ON public.validations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─────────────────────────────────────
-- 15. POLITIQUES RLS — invitations
-- ─────────────────────────────────────
DROP POLICY IF EXISTS "user_read_own_invitations"   ON public.invitations;
DROP POLICY IF EXISTS "user_create_invitations"     ON public.invitations;

CREATE POLICY "user_read_own_invitations" ON public.invitations FOR SELECT USING (inviter_id = auth.uid());
CREATE POLICY "user_create_invitations"   ON public.invitations FOR INSERT WITH CHECK (inviter_id = auth.uid());

-- ─────────────────────────────────────
-- VÉRIFICATION
-- ─────────────────────────────────────
-- SELECT * FROM public.villages;
-- SELECT * FROM public.quartiers;
-- SELECT * FROM public.ancestres;
-- SELECT COUNT(*) FROM public.profiles;
