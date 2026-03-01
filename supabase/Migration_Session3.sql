-- Migration 3 : Approbations CHOa et Messagerie Interne

-- 1. Ajout des approbations CHOa (Tableau d'identifiants de CHOa)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS choa_approvals TEXT[] DEFAULT '{}';

-- 2. Création de la table des messages internes
CREATE TABLE IF NOT EXISTS public.internal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS sur messages internes
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert messages" ON public.internal_messages;
CREATE POLICY "Users can insert messages" ON public.internal_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can view relevant messages" ON public.internal_messages;
CREATE POLICY "Users can view relevant messages" ON public.internal_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = internal_messages.receiver_role OR (profiles.role = 'admin' AND internal_messages.receiver_role = 'admin') OR (profiles.is_ambassadeur = true AND internal_messages.receiver_role = 'ambassadeur'))
        )
    );
