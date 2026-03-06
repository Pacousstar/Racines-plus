-- =============================================================================
-- RACINES+ — AUDIT TRAIL COMPLET v2
-- "Qui a fait quoi" — Admin voit tout, CHO voit ses CHOa, CHOa voient leur quartier
-- À exécuter dans Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. ENRICHISSEMENT DE LA TABLE activity_logs
--    Ajouter : label lisible, rôle de l'acteur, cible (user_id concerné), résultat
-- =============================================================================
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS action_label     TEXT,          -- ex: "A validé Kofi GBEYA"
  ADD COLUMN IF NOT EXISTS actor_role       TEXT,          -- rôle de l'utilisateur qui agit
  ADD COLUMN IF NOT EXISTS target_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_name      TEXT,          -- nom de la cible pour affichage rapide
  ADD COLUMN IF NOT EXISTS result           TEXT,          -- 'success' | 'error' | 'info'
  ADD COLUMN IF NOT EXISTS village_origin   TEXT,          -- village de l'acteur
  ADD COLUMN IF NOT EXISTS quartier_nom     TEXT;          -- quartier de l'acteur

-- =============================================================================
-- 2. ENRICHISSEMENT DE LA TABLE validations
--    Ajouter le nom de l'acteur + quartier + village pour affichage sans jointure
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.validations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    validator_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role_validateur TEXT,          -- 'choa' | 'cho' | 'admin'
    statut          TEXT,          -- 'pre_approved' | 'probable' | 'confirmed' | 'rejected'
    decision_finale BOOLEAN DEFAULT FALSE,
    motif           TEXT,
    observations    TEXT,
    validator_name  TEXT,          -- dénormalisé pour affichage rapide
    validator_quartier TEXT,
    validator_village  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Si la table existait déjà, ajouter les colonnes manquantes
ALTER TABLE public.validations
  ADD COLUMN IF NOT EXISTS validator_name      TEXT,
  ADD COLUMN IF NOT EXISTS validator_quartier  TEXT,
  ADD COLUMN IF NOT EXISTS validator_village   TEXT;

-- =============================================================================
-- 3. VUE : audit_trail_complet (pour Admin — voit TOUT)
-- =============================================================================
CREATE OR REPLACE VIEW public.v_audit_trail_admin AS
SELECT
    al.id,
    al.timestamp,
    al.action_type,
    al.action_label,
    al.result,
    -- Acteur
    al.user_id                  AS actor_id,
    al.actor_role,
    p_actor.first_name          AS actor_first_name,
    p_actor.last_name           AS actor_last_name,
    COALESCE(al.village_origin, p_actor.village_origin) AS actor_village,
    COALESCE(al.quartier_nom,   p_actor.quartier_nom)   AS actor_quartier,
    -- Cible
    al.target_user_id,
    al.target_name,
    p_target.first_name         AS target_first_name,
    p_target.last_name          AS target_last_name,
    p_target.status             AS target_status,
    -- Table / Données
    al.table_name,
    al.record_id,
    al.old_data,
    al.new_data
FROM public.activity_logs al
LEFT JOIN public.profiles p_actor  ON al.user_id       = p_actor.id
LEFT JOIN public.profiles p_target ON al.target_user_id = p_target.id
ORDER BY al.timestamp DESC;

-- =============================================================================
-- 4. VUE : validations enrichies (pour CHO — voit les CHOa de son village)
-- =============================================================================
CREATE OR REPLACE VIEW public.v_validations_cho AS
SELECT
    v.id,
    v.created_at,
    v.statut,
    v.decision_finale,
    v.motif,
    v.observations,
    v.role_validateur,
    -- Validateur (CHOa)
    v.validator_id,
    COALESCE(v.validator_name, p_val.first_name || ' ' || p_val.last_name)  AS validator_name,
    COALESCE(v.validator_quartier, p_val.quartier_nom)                      AS validator_quartier,
    COALESCE(v.validator_village,  p_val.village_origin)                    AS validator_village,
    -- Profil validé
    v.profile_id,
    p_cible.first_name   AS cible_first_name,
    p_cible.last_name    AS cible_last_name,
    p_cible.quartier_nom AS cible_quartier,
    p_cible.status       AS cible_status,
    p_cible.avatar_url   AS cible_avatar
FROM public.validations v
LEFT JOIN public.profiles p_val   ON v.validator_id = p_val.id
LEFT JOIN public.profiles p_cible ON v.profile_id   = p_cible.id
ORDER BY v.created_at DESC;

-- =============================================================================
-- 5. VUE : activité du quartier (pour CHOa — voit les collègues de son quartier)
-- =============================================================================
CREATE OR REPLACE VIEW public.v_validations_quartier AS
SELECT
    v.id,
    v.created_at,
    v.statut,
    v.role_validateur,
    v.motif,
    -- Validateur (CHOa pair)
    v.validator_id,
    COALESCE(v.validator_name, p_val.first_name || ' ' || p_val.last_name) AS validator_name,
    COALESCE(v.validator_quartier, p_val.quartier_nom) AS validator_quartier,
    COALESCE(v.validator_village,  p_val.village_origin) AS validator_village,
    -- Profil validé
    v.profile_id,
    p_cible.first_name   AS cible_first_name,
    p_cible.last_name    AS cible_last_name,
    p_cible.quartier_nom AS cible_quartier,
    p_cible.status       AS cible_status
FROM public.validations v
LEFT JOIN public.profiles p_val   ON v.validator_id = p_val.id
LEFT JOIN public.profiles p_cible ON v.profile_id   = p_cible.id
ORDER BY v.created_at DESC;

-- =============================================================================
-- 6. MISE À JOUR DU TRIGGER — enrichit les logs avec rôle, village, quartier
-- =============================================================================
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id     UUID;
    v_actor_role  TEXT;
    v_village     TEXT;
    v_quartier    TEXT;
    v_action_type TEXT;
    v_record_id   UUID;
    v_old_data    JSONB;
    v_new_data    JSONB;
    v_target_id   UUID;
    v_target_name TEXT;
BEGIN
    v_user_id := auth.uid();
    v_action_type := TG_OP;

    -- Récupérer le record_id selon l'opération
    IF (TG_OP = 'DELETE') THEN
        v_record_id := OLD.id;
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    ELSIF (TG_OP = 'INSERT') THEN
        v_record_id := NEW.id;
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    ELSE
        v_record_id := NEW.id;
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    END IF;

    -- Récupérer le rôle, village, quartier de l'acteur
    SELECT role, village_origin, quartier_nom
    INTO v_actor_role, v_village, v_quartier
    FROM public.profiles WHERE id = v_user_id;

    -- Si la cible est un profil (changement de status), récupérer son nom
    IF TG_TABLE_NAME = 'profiles' THEN
        IF TG_OP = 'DELETE' THEN
            v_target_id   := OLD.id;
            v_target_name := COALESCE(OLD.first_name, '') || ' ' || COALESCE(OLD.last_name, '');
        ELSE
            v_target_id   := NEW.id;
            v_target_name := COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '');
        END IF;
    END IF;

    INSERT INTO public.activity_logs (
        user_id, 
        action_type, 
        table_name, 
        record_id,
        old_data, 
        new_data,
        actor_role, 
        village_origin, 
        quartier_nom,
        target_user_id, 
        target_name, 
        result,
        action_label
    ) VALUES (
        v_user_id,
        v_action_type,
        TG_TABLE_NAME::text,
        v_record_id,
        v_old_data,
        v_new_data,
        v_actor_role,
        v_village,
        v_quartier,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE v_target_id END,
        v_target_name,
        'success',
        CASE TG_OP
            WHEN 'INSERT' THEN 'Création dans ' || TG_TABLE_NAME
            WHEN 'UPDATE' THEN
                CASE
                    WHEN TG_TABLE_NAME = 'profiles' AND NEW.status != OLD.status
                        THEN 'Statut modifié → ' || NEW.status || ' pour ' || v_target_name
                    WHEN TG_TABLE_NAME = 'profiles' AND NEW.role != OLD.role
                        THEN 'Rôle modifié → ' || NEW.role || ' pour ' || v_target_name
                    ELSE 'Mise à jour dans ' || TG_TABLE_NAME
                END
            WHEN 'DELETE' THEN 'Suppression dans ' || TG_TABLE_NAME || ' : ' || COALESCE(v_target_name, '')
        END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réappliquer les triggers (ils utilisent maintenant la nouvelle fonction enrichie)
DROP TRIGGER IF EXISTS tr_log_profiles   ON public.profiles;
CREATE TRIGGER tr_log_profiles   AFTER INSERT OR UPDATE OR DELETE ON public.profiles   FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS tr_log_villages   ON public.villages;
CREATE TRIGGER tr_log_villages   AFTER INSERT OR UPDATE OR DELETE ON public.villages   FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS tr_log_ancestres  ON public.ancestres;
CREATE TRIGGER tr_log_ancestres  AFTER INSERT OR UPDATE OR DELETE ON public.ancestres  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS tr_log_validations ON public.validations;
CREATE TRIGGER tr_log_validations AFTER INSERT OR UPDATE ON public.validations FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- =============================================================================
-- 7. CORRECTION RLS — supprimer le hardcode email, utiliser le rôle
-- =============================================================================

-- admin_permissions : tout admin peut gérer
DROP POLICY IF EXISTS "Admin_Principal_Manage_Permissions" ON public.admin_permissions;
DROP POLICY IF EXISTS "Admin_Manage_Permissions" ON public.admin_permissions;
CREATE POLICY "Admin_Manage_Permissions" ON public.admin_permissions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Assistants_Read_Own_Permissions" ON public.admin_permissions;
CREATE POLICY "Assistants_Read_Own_Permissions" ON public.admin_permissions
    FOR SELECT USING (user_id = auth.uid());

-- activity_logs : admin voit tout, cho/choa voient leur village
DROP POLICY IF EXISTS "Admin_Principal_View_Logs"   ON public.activity_logs;
DROP POLICY IF EXISTS "Admin_View_Logs"              ON public.activity_logs;
DROP POLICY IF EXISTS "CHO_View_Village_Logs"        ON public.activity_logs;
DROP POLICY IF EXISTS "CHOa_View_Quartier_Logs"      ON public.activity_logs;
DROP POLICY IF EXISTS "Admin_View_All_Logs"          ON public.activity_logs;

CREATE POLICY "Admin_View_All_Logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "CHO_View_Village_Logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_actor
            JOIN public.profiles p_cho ON p_cho.id = auth.uid() AND p_cho.role = 'cho'
            WHERE p_actor.id = activity_logs.user_id
              AND p_actor.village_origin = p_cho.village_origin
        )
    );

CREATE POLICY "CHOa_View_Quartier_Logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_actor
            JOIN public.profiles p_choa ON p_choa.id = auth.uid() AND p_choa.role = 'choa'
            WHERE p_actor.id = activity_logs.user_id
              AND p_actor.quartier_nom   = p_choa.quartier_nom
              AND p_actor.village_origin = p_choa.village_origin
        )
    );

-- Système peut écrire dans activity_logs (triggers SECURITY DEFINER)
DROP POLICY IF EXISTS "System_Insert_Logs" ON public.activity_logs;
CREATE POLICY "System_Insert_Logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 8. RLS sur validations
-- =============================================================================
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin_View_All_Validations"  ON public.validations;
DROP POLICY IF EXISTS "CHO_View_Village_Validations" ON public.validations;
DROP POLICY IF EXISTS "CHOa_View_Quartier_Validations" ON public.validations;
DROP POLICY IF EXISTS "Validators_Insert"             ON public.validations;

-- Admin voit tout
CREATE POLICY "Admin_View_All_Validations" ON public.validations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- CHO voit toutes les validations de son village
CREATE POLICY "CHO_View_Village_Validations" ON public.validations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_cible
            JOIN public.profiles p_cho ON p_cho.id = auth.uid() AND p_cho.role = 'cho'
            WHERE p_cible.id = validations.profile_id
              AND p_cible.village_origin = p_cho.village_origin
        )
    );

-- CHOa voit les validations de son quartier (y compris celles des collègues)
CREATE POLICY "CHOa_View_Quartier_Validations" ON public.validations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p_cible
            JOIN public.profiles p_choa ON p_choa.id = auth.uid() AND p_choa.role = 'choa'
            WHERE p_cible.id = validations.profile_id
              AND p_cible.quartier_nom   = p_choa.quartier_nom
              AND p_cible.village_origin = p_choa.village_origin
        )
    );

-- CHO et CHOa peuvent insérer des validations
CREATE POLICY "Validators_Insert" ON public.validations
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('cho', 'choa', 'admin'))
    );

-- CHO et CHOa peuvent lire leurs propres validations insérées
CREATE POLICY "Validators_View_Own" ON public.validations
    FOR SELECT USING (validator_id = auth.uid());

-- =============================================================================
-- 9. FONCTION : Insérer une validation enrichie (appelée depuis le frontend)
--    Remplace les insertions manuelles dans validations
-- =============================================================================
CREATE OR REPLACE FUNCTION public.record_validation(
    p_profile_id   UUID,
    p_new_status   TEXT,
    p_final        BOOLEAN DEFAULT FALSE,
    p_motif        TEXT    DEFAULT NULL,
    p_observations TEXT    DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_validator_id       UUID    := auth.uid();
    v_validator_name     TEXT;
    v_validator_role     TEXT;
    v_validator_quartier TEXT;
    v_validator_village  TEXT;
BEGIN
    -- Récupérer les infos du validateur
    SELECT first_name || ' ' || last_name, role, quartier_nom, village_origin
    INTO v_validator_name, v_validator_role, v_validator_quartier, v_validator_village
    FROM public.profiles WHERE id = v_validator_id;

    -- Insérer la validation enrichie
    INSERT INTO public.validations (
        profile_id, validator_id, role_validateur, statut, decision_finale,
        motif, observations,
        validator_name, validator_quartier, validator_village
    ) VALUES (
        p_profile_id, v_validator_id, v_validator_role, p_new_status, p_final,
        p_motif, p_observations,
        v_validator_name, v_validator_quartier, v_validator_village
    );

    -- Mettre à jour le statut du profil
    UPDATE public.profiles SET status = p_new_status, updated_at = NOW()
    WHERE id = p_profile_id;
END;
$$;

DO $$ BEGIN
    RAISE NOTICE 'Audit Trail v2 initialisé : vues admin/cho/choa, RLS corrigées, trigger enrichi, fonction record_validation créée.';
END $$;
