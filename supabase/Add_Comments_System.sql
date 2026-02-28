-- ============================================================
-- RACINES+ — SYSTÈME DE COMMENTAIRES ET NOTIFICATIONS
-- ============================================================

-- 1. Table des commentaires de validation
CREATE TABLE IF NOT EXISTS public.validation_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Table des notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Activation du RLS
ALTER TABLE public.validation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Politiques pour validation_comments
DROP POLICY IF EXISTS "comments_access_policy" ON public.validation_comments;

-- Seuls les admins ou les membres de la gestion (CHO/CHOa) peuvent voir/écrire des commentaires
CREATE POLICY "comments_access_policy" ON public.validation_comments
FOR ALL USING (public.is_admin_or_management(auth.uid()));

-- 5. Politiques pour notifications
DROP POLICY IF EXISTS "notifications_owner_policy" ON public.notifications;

-- Un utilisateur ne peut voir que ses propres notifications
CREATE POLICY "notifications_owner_policy" ON public.notifications
FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger pour notification automatique sur nouveau commentaire (Optionnel, mais utile)
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
    author_role TEXT;
    target_profile_village TEXT;
    target_profile_name TEXT;
BEGIN
    -- 1. Récupérer les infos de l'auteur et du profil concerné
    SELECT role INTO author_role FROM public.profiles WHERE id = NEW.author_id;
    SELECT village_origin, (first_name || ' ' || last_name) INTO target_profile_village, target_profile_name 
    FROM public.profiles WHERE id = NEW.profile_id;
    
    -- 2. Insertion ciblée des notifications pour éviter le bruit (Mode Production)
    -- CHOa -> Notifie CHO
    -- CHO -> Notifie CHOa
    -- Admin -> Notifie les deux
    INSERT INTO public.notifications (user_id, message, link)
    SELECT id, 
           'Nouveau message (' || author_role || ') sur le dossier de ' || target_profile_name, 
           CASE 
             WHEN role = 'cho' THEN '/cho'
             WHEN role = 'choa' THEN '/choa'
             ELSE '/dashboard'
           END
    FROM public.profiles
    WHERE village_origin = target_profile_village 
      AND id != NEW.author_id -- Ne pas se notifier soi-même
      AND (
          (author_role = 'choa' AND role = 'cho') OR
          (author_role = 'cho' AND role = 'choa') OR
          (author_role = 'admin' AND role IN ('cho', 'choa'))
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_comment ON public.validation_comments;
CREATE TRIGGER tr_notify_on_comment
AFTER INSERT ON public.validation_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

SELECT '✅ Système de commentaires et notifications initialisé !' as statut;
