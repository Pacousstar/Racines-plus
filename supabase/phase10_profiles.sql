-- Phase 10 : Enrichissement du Profil Utilisateur
-- Ce script ajoute de nouvelles colonnes à la table `profiles` existante
-- de manière sécurisée (IF NOT EXISTS n'est pas standard pour ALTER TABLE ADD COLUMN sur Postgres,
-- on utilise donc un bloc DO pour vérifier l'existence avant d'ajouter).

DO $$ 
BEGIN 
    -- 1. Niveau d'études
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='niveau_etudes') THEN
        ALTER TABLE public.profiles ADD COLUMN niveau_etudes TEXT;
    END IF;

    -- 2. Diplômes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='diplomes') THEN
        ALTER TABLE public.profiles ADD COLUMN diplomes TEXT;
    END IF;

    -- 3. Emploi actuel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='emploi') THEN
        ALTER TABLE public.profiles ADD COLUMN emploi TEXT;
    END IF;

    -- 4. Fonction
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='fonction') THEN
        ALTER TABLE public.profiles ADD COLUMN fonction TEXT;
    END IF;

    -- 5. Retraité (Oui/Non)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='retraite') THEN
        ALTER TABLE public.profiles ADD COLUMN retraite BOOLEAN DEFAULT FALSE;
    END IF;

    -- 6. Nombre d'enfants
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='nombre_enfants') THEN
        ALTER TABLE public.profiles ADD COLUMN nombre_enfants INTEGER DEFAULT 0;
    END IF;

    -- 7. Adresse de résidence complète
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='adresse_residence') THEN
        ALTER TABLE public.profiles ADD COLUMN adresse_residence TEXT;
    END IF;

    -- 8. Statut Ambassadeur Racines+
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_ambassadeur') THEN
        ALTER TABLE public.profiles ADD COLUMN is_ambassadeur BOOLEAN DEFAULT FALSE;
    END IF;

END $$;

-- Vérification de la structure mise à jour :
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
