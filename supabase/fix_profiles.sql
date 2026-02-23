-- ============================================================
-- RACINES+ — Nettoyage des doublons et correction de l'inscription
-- Copiez et exécutez bloc par bloc dans Supabase → SQL Editor
-- ============================================================

-- ══════════════════════════════════════════════════════════
-- BLOC 1 : Vérifier les utilisateurs dans auth.users
-- (Pour voir les doublons avant de les supprimer)
-- ══════════════════════════════════════════════════════════
SELECT
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.first_name,
    p.last_name,
    p.role,
    p.status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;

-- ══════════════════════════════════════════════════════════
-- BLOC 2 : Supprimer le compte test/doublon de pacous2000@gmail.com
-- (ATTENTION : ceci supprime DÉFINITIVEMENT le compte auth + profil en cascade)
-- Décommentez et exécutez SEULEMENT si vous voulez repartir de zéro
-- ══════════════════════════════════════════════════════════
-- DELETE FROM auth.users WHERE email = 'pacous2000@gmail.com';

-- ══════════════════════════════════════════════════════════
-- BLOC 3 : Alternativement, juste mettre à jour le profil existant
-- (si l'utilisateur existe déjà et que vous voulez corriger les données)
-- ══════════════════════════════════════════════════════════
-- UPDATE public.profiles
-- SET
--     first_name = 'Votre_Prenom',
--     last_name  = 'Votre_Nom',
--     village_origin = 'Toa-Zéo',
--     role = 'admin',    -- ← passer en admin ici directement
--     status = 'pending'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'pacous2000@gmail.com');

-- ══════════════════════════════════════════════════════════
-- BLOC 4 : Passer un utilisateur en Admin (à faire APRÈS inscription réussie)
-- Remplacez 'pacous2000@gmail.com' par l'email exact
-- ══════════════════════════════════════════════════════════
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'pacous2000@gmail.com');

-- ══════════════════════════════════════════════════════════
-- BLOC 5 : Vérification après corrections
-- ══════════════════════════════════════════════════════════
SELECT
    u.email,
    p.first_name,
    p.last_name,
    p.role,
    p.status,
    p.village_origin,
    p.avatar_url,
    u.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY u.created_at DESC;
