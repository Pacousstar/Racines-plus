-- ============================================================
-- RACINES+ — SYSTÈME DE PERMISSIONS ET AUDIT (TOUR DE CONTRÔLE)
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. TABLE : admin_permissions (Permissions granulaires pour les assistants)
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    user_id             UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_validate_users  BOOLEAN DEFAULT FALSE,
    can_manage_villages BOOLEAN DEFAULT FALSE,
    can_manage_ancestors BOOLEAN DEFAULT FALSE,
    can_manage_memorial BOOLEAN DEFAULT FALSE,
    can_issue_certificates BOOLEAN DEFAULT FALSE,
    can_manage_invitations BOOLEAN DEFAULT FALSE,
    can_export_data     BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE : activity_logs (Journal d'audit - Qui a fait quoi)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES public.profiles(id),
    action_type     TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name      TEXT NOT NULL,
    record_id       UUID,
    old_data        JSONB,
    new_data        JSONB,
    timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ACTIVER RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs      ENABLE ROW LEVEL SECURITY;

-- 4. POLITIQUES RLS
-- Seul l'Admin Principal (ou quelqu'un avec permission spéciale si vous le décidez plus tard) peut gérer les permissions
-- Pour l'instant, protection par email de l'Admin Principal pour la sécurité maximale
CREATE POLICY "Admin_Principal_Manage_Permissions" ON public.admin_permissions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'Pacous2000@gmail.com')
    );

CREATE POLICY "Assistants_Read_Own_Permissions" ON public.admin_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin_Principal_View_Logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'Pacous2000@gmail.com')
    );

-- 5. TRIGGER : Journalisation automatique (Audit Trailing)
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id, old_data, new_data)
    VALUES (
        v_user_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id 
            ELSE NEW.id 
        END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Application du trigger sur les tables sensibles
DROP TRIGGER IF EXISTS tr_log_profiles ON public.profiles;
CREATE TRIGGER tr_log_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS tr_log_villages ON public.villages;
CREATE TRIGGER tr_log_villages AFTER INSERT OR UPDATE OR DELETE ON public.villages FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS tr_log_ancestres ON public.ancestres;
CREATE TRIGGER tr_log_ancestres AFTER INSERT OR UPDATE OR DELETE ON public.ancestres FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DO $$ 
BEGIN 
    RAISE NOTICE 'Système d''Audit et Permissions (Tour de Contrôle) initialisé.';
END $$;
