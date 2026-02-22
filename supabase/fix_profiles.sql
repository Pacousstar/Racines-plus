-- ============================================================
-- RACINES+ — Script SQL Fix : Profil manquant après inscription
-- À exécuter dans Supabase → SQL Editor → New Query → Run
-- Ce script corrige les profils créés SANS données (prénom/nom vides)
-- car le trigger a créé le profil avant l'upsert de l'onboarding.
-- ============================================================

-- 1. Vérifier les profils sans first_name (créés par le trigger seul)
-- SELECT id, first_name, last_name, role, status, created_at
-- FROM public.profiles
-- ORDER BY created_at DESC;

-- 2. S'assurer que le trigger handle_new_user existe et fonctionne
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, role, status)
    VALUES (NEW.id, 'user', 'pending')
    ON CONFLICT (id) DO NOTHING;  -- Ne pas écraser si l'upsert a déjà tourné
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Politique RLS pour permettre à l'utilisateur de mettre à jour son propre profil
--    (correction du bug : on_conflict(id) DO UPDATE nécessite la politique UPDATE)
DROP POLICY IF EXISTS "user_update_own_profile" ON public.profiles;
CREATE POLICY "user_update_own_profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Politique upsert corrigée (permet INSERT même si le trigger a déjà créé le profil)
DROP POLICY IF EXISTS "user_insert_own_profile" ON public.profiles;
CREATE POLICY "user_insert_own_profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Pour passer ton compte en Admin : remplacer TON_EMAIL_ICI par ton email
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'TON_EMAIL_ICI');

-- 5. Vérification finale
SELECT
    u.email,
    p.first_name,
    p.last_name,
    p.role,
    p.status,
    p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 10;
