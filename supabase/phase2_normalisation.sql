-- ============================================================
-- RACINES+ — PHASE 2 : NORMALISATION, INDEXES & SÉCURITÉ
-- Exécuter dans Supabase → SQL Editor (une seule fois)
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. INDEX MANQUANTS (critiques pour les performances)
-- ════════════════════════════════════════════════════════════

-- 1a. Profiles : indexes de filtrage (utilisés par admin, cho, choa, annuaire)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_village_origin ON public.profiles(village_origin);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 1b. Notifications : lecture par utilisateur + filtre non lues
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 1c. Activity logs : tri chronologique + filtre par utilisateur
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_name ON public.activity_logs(table_name);

-- 1d. Validation comments : chargement par profil
CREATE INDEX IF NOT EXISTS idx_validation_comments_profile ON public.validation_comments(profile_id, created_at ASC);

-- 1e. Validations : recherche par profil et validateur
CREATE INDEX IF NOT EXISTS idx_validations_profile ON public.validations(profile_id);
CREATE INDEX IF NOT EXISTS idx_validations_validator ON public.validations(validator_id);
CREATE INDEX IF NOT EXISTS idx_validations_created_at ON public.validations(created_at DESC);

-- 1f. Invitations : par inviter
CREATE INDEX IF NOT EXISTS idx_invitations_inviter ON public.invitations(inviter_id);

-- 1g. Messages internes : par expéditeur et rôle destinataire
CREATE INDEX IF NOT EXISTS idx_internal_messages_sender ON public.internal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_receiver ON public.internal_messages(receiver_role);

-- 1h. Quartiers : par village
CREATE INDEX IF NOT EXISTS idx_quartiers_village ON public.quartiers(village_id);

-- 1i. Admin permissions : lookup rapide
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user ON public.admin_permissions(user_id);

-- ════════════════════════════════════════════════════════════
-- 2. POLITIQUES RLS MANQUANTES
-- ════════════════════════════════════════════════════════════

-- 2a. Profiles : politique d'insertion pour le trigger handle_new_user
DROP POLICY IF EXISTS "profil_insert_trigger" ON public.profiles;
CREATE POLICY "profil_insert_trigger" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2b. Profiles : politique de lecture pour les utilisateurs standard
-- (complète les policies existantes de Security_Final.sql)
DROP POLICY IF EXISTS "profil_lecture_publique" ON public.profiles;
CREATE POLICY "profil_lecture_publique" ON public.profiles
    FOR SELECT USING (
        -- Son propre profil
        auth.uid() = id
        OR
        -- Membres du management (admin, cho, choa) voient tous les profils de leur village
        public.is_admin_or_management(auth.uid())
        OR
        -- Ambassadeurs voient les profils de leur village
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.is_ambassadeur = TRUE
            AND p.village_origin = public.profiles.village_origin
        )
    );

-- 2c. Admin permissions : les admins (rôle='admin') peuvent tout voir
DROP POLICY IF EXISTS "admin_read_all_permissions" ON public.admin_permissions;
CREATE POLICY "admin_read_all_permissions" ON public.admin_permissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 2d. Activity logs : les admins voient tout, les CHO/CHOa voient les logs de leur village
DROP POLICY IF EXISTS "activity_logs_read_village" ON public.activity_logs;
CREATE POLICY "activity_logs_read_village" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('cho', 'choa')
            AND p.village_origin = public.activity_logs.village_origin
        )
    );

-- 2e. Memorial victims : management peut tout faire, public peut lire
DROP POLICY IF EXISTS "memorial_lecture_publique" ON public.memorial_victims;
CREATE POLICY "memorial_lecture_publique" ON public.memorial_victims
    FOR SELECT USING (true);

-- 2f. Validation comments : les membres du management voient tous les commentaires
-- (déjà implémenté dans Add_Comments_System.sql, on renforce)
DROP POLICY IF EXISTS "comments_select_policy" ON public.validation_comments;
CREATE POLICY "comments_select_policy" ON public.validation_comments
    FOR SELECT USING (public.is_admin_or_management(auth.uid()));

-- 2g. Insertion de commentaires : seul le management peut écrire
DROP POLICY IF EXISTS "comments_insert_policy" ON public.validation_comments;
CREATE POLICY "comments_insert_policy" ON public.validation_comments
    FOR INSERT WITH CHECK (
        public.is_admin_or_management(auth.uid())
        AND author_id = auth.uid()
    );

-- ════════════════════════════════════════════════════════════
-- 3. VUES NORMALISÉES (pour une migration progressive du code)
-- ════════════════════════════════════════════════════════════

-- 3a. Vue : profils avec email auth (pour éviter la jointure côté code)
CREATE OR REPLACE VIEW public.v_profiles_with_email AS
SELECT
    p.*,
    au.email AS auth_email,
    au.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id;

-- 3b. Vue : statistiques village (pour le dashboard admin)
CREATE OR REPLACE VIEW public.v_village_stats AS
SELECT
    p.village_origin,
    COUNT(*) AS total_members,
    COUNT(*) FILTER (WHERE p.status = 'confirmed') AS confirmed,
    COUNT(*) FILTER (WHERE p.status = 'pending' OR p.status IS NULL) AS pending,
    COUNT(*) FILTER (WHERE p.status = 'rejected') AS rejected,
    COUNT(*) FILTER (WHERE p.role = 'cho') AS cho_count,
    COUNT(*) FILTER (WHERE p.role = 'choa') AS choa_count,
    COUNT(*) FILTER (WHERE p.is_ambassadeur = TRUE) AS ambassadeurs
FROM public.profiles p
GROUP BY p.village_origin;

-- ════════════════════════════════════════════════════════════
-- 4. CONTRAINTES & NETTOYAGE
-- ════════════════════════════════════════════════════════════

-- 4a. Ajouter updated_at trigger si manquant
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4b. Contrainte : s'assurer que role a une valeur valide
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ck_profiles_role;
ALTER TABLE public.profiles ADD CONSTRAINT ck_profiles_role
    CHECK (role IN ('user', 'cho', 'choa', 'admin', 'assistant_cho'));

-- 4c. Contrainte : s'assurer que status a une valeur valide
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ck_profiles_status;
ALTER TABLE public.profiles ADD CONSTRAINT ck_profiles_status
    CHECK (status IN ('pending', 'pending_choa', 'pre_approved', 'probable', 'confirmed', 'rejected'));

-- ════════════════════════════════════════════════════════════
-- 5. RAFRAÎCHIR LE SCHÉMA POSTGREST
-- ════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

SELECT '✅ Phase 2 - Normalisation terminée !' AS statut;
