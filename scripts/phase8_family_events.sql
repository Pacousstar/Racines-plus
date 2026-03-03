-- =====================================================================
-- Phase 8 : Module Évènements (Calendrier Familial)
-- Script Supabase SQL — À exécuter dans le Dashboard Supabase > SQL Editor
-- =====================================================================

-- 1. CRÉATION DE LA TABLE `family_events`
CREATE TABLE IF NOT EXISTS public.family_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre VARCHAR(255) NOT NULL,
    type_evenement VARCHAR(50) NOT NULL CHECK (type_evenement IN ('reunion', 'mariage', 'obseques', 'fete_generation', 'autre')),
    date_evenement TIMESTAMP WITH TIME ZONE NOT NULL,
    lieu VARCHAR(255) NOT NULL,
    description TEXT,
    organisateur_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches par date et organisateur
CREATE INDEX IF NOT EXISTS idx_family_events_date ON public.family_events(date_evenement);
CREATE INDEX IF NOT EXISTS idx_family_events_organisateur ON public.family_events(organisateur_id);

-- 2. SÉCURITÉ (RLS)
ALTER TABLE public.family_events ENABLE ROW LEVEL SECURITY;

-- Lecture (Tout membre connecté peut voir les évènements)
CREATE POLICY "Les membres connectes peuvent voir les evenements"
ON public.family_events FOR SELECT
USING ( auth.role() = 'authenticated' );

-- Écriture (Seuls les administrateurs et CHO peuvent créer un évènement)
CREATE POLICY "Les admins et CHOs peuvent creer un evenement"
ON public.family_events FOR INSERT
WITH CHECK ( 
    auth.uid() = organisateur_id AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'cho')
    )
);

-- Modification (Organisateur ou Admin/CHO)
CREATE POLICY "Modification par createur ou admin ou cho"
ON public.family_events FOR UPDATE
USING ( 
    auth.uid() = organisateur_id OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'cho')
    )
);

-- Suppression (Organisateur ou Admin/CHO)
CREATE POLICY "Suppression par createur ou admin ou cho"
ON public.family_events FOR DELETE
USING ( 
    auth.uid() = organisateur_id OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'cho')
    )
);

-- Fonction de mise à jour automatique du updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_family_events_updated_at ON public.family_events;
CREATE TRIGGER trg_family_events_updated_at
BEFORE UPDATE ON public.family_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- DONNÉES DE DÉMONSTRATION (Mock Data) POUR TESTER DIRECTEMENT
-- =====================================================================
-- On insère un événement organisé par l'Admin ou un utilisateur existant 
-- si les 60 profils sont déjà là. (Kwame GBÉYA = 11111111-0000-4000-a000-000000000001)

INSERT INTO public.family_events (id, titre, type_evenement, date_evenement, lieu, description, organisateur_id)
VALUES (
    uuid_generate_v4(),
    'Grande Réunion de la Famille Gbéya',
    'reunion',
    NOW() + INTERVAL '14 days',
    'Abidjan - Cocody (Hôtel Ivoire)',
    'Réunion générale pour préparer les fêtes de fin d''année et faire le point sur la caisse de solidarité de la famille Gbéya. Présence obligatoire des têtes de lignée.',
    '11111111-0000-4000-a000-000000000001'
) ON CONFLICT DO NOTHING;

INSERT INTO public.family_events (id, titre, type_evenement, date_evenement, lieu, description, organisateur_id)
VALUES (
    uuid_generate_v4(),
    'Mariage de Koffi et Awa',
    'mariage',
    NOW() + INTERVAL '30 days',
    'Montréal, Canada',
    'Koffi a le plaisir de vous inviter à son mariage civil célébré à Montréal. Une retransmission vidéo sera prévue pour la famille restée au pays.',
    '11111111-0000-4000-a000-000000000005' -- "Koffi" (frère au Canada)
) ON CONFLICT DO NOTHING;

INSERT INTO public.family_events (id, titre, type_evenement, date_evenement, lieu, description, organisateur_id)
VALUES (
    uuid_generate_v4(),
    'Cérémonie de levée de deuil Bonyé',
    'obseques',
    NOW() + INTERVAL '7 days',
    'Bouaflé - Cour Familiale',
    'La levée de deuil de notre regretté Zadi Bonyé aura lieu ce samedi. Merci d''apporter votre soutien.',
    '22222222-0000-4000-b000-000000000002' -- "Gnagne" de Bouaké
) ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ Table family_events, politiques RLS et 3 évènements de démonstration créés avec succès !';
