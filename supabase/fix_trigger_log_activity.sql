-- =============================================================================
-- FIX: log_activity trigger dynamic record access
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

    -- Si la cible est un profil (changement de status), récupérer son nom depuis le JSON
    IF TG_TABLE_NAME = 'profiles' THEN
        IF TG_OP = 'DELETE' THEN
            v_target_id   := (v_old_data->>'id')::UUID;
            v_target_name := COALESCE(v_old_data->>'first_name', '') || ' ' || COALESCE(v_old_data->>'last_name', '');
        ELSE
            v_target_id   := (v_new_data->>'id')::UUID;
            v_target_name := COALESCE(v_new_data->>'first_name', '') || ' ' || COALESCE(v_new_data->>'last_name', '');
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
                    WHEN TG_TABLE_NAME = 'profiles' AND (v_new_data->>'status') != (v_old_data->>'status')
                        THEN 'Statut modifié → ' || (v_new_data->>'status') || ' pour ' || v_target_name
                    WHEN TG_TABLE_NAME = 'profiles' AND (v_new_data->>'role') != (v_old_data->>'role')
                        THEN 'Rôle modifié → ' || (v_new_data->>'role') || ' pour ' || v_target_name
                    ELSE 'Mise à jour dans ' || TG_TABLE_NAME
                END
            WHEN 'DELETE' THEN 'Suppression dans ' || TG_TABLE_NAME || ' : ' || COALESCE(v_target_name, '')
        END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Trigger log_activity corrigé !' as status;
