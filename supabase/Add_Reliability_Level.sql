-- Migration : Niveau de fiabilité des liens généalogiques
-- Fichier : racines-mvp/supabase/Add_Reliability_Level.sql

-- Table pour stocker les validations de chaque lien généalogique
CREATE TABLE IF NOT EXISTS link_validations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_a_id     TEXT NOT NULL,   -- ID du nœud Neo4j (personne déclarante)
    person_b_id     TEXT NOT NULL,   -- ID du nœud Neo4j (ancêtre/parent/conjoint ajouté)
    relation_type   TEXT NOT NULL,   -- 'FATHER_OF', 'SPOUSE_OF', 'SIBLING_OF', etc.
    reliability     TEXT NOT NULL DEFAULT 'en_cours'
                    CHECK (reliability IN ('confirme', 'probable', 'en_cours')),
    source_type     TEXT,            -- 'oral', 'archive', 'acte', 'religieux', 'autre'
    source_ref      TEXT,            -- référence libre (cote, URL, description)
    created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    validated_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    validated_at    TIMESTAMPTZ
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_link_validations_person_a ON link_validations(person_a_id);
CREATE INDEX IF NOT EXISTS idx_link_validations_person_b ON link_validations(person_b_id);
CREATE INDEX IF NOT EXISTS idx_link_validations_reliability ON link_validations(reliability);

-- RLS : tout utilisateur connecté peut lire ; seul le créateur ou un CHO/Admin peut modifier
ALTER TABLE link_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "link_validations_select_all"
    ON link_validations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "link_validations_insert_own"
    ON link_validations FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "link_validations_update_cho_admin"
    ON link_validations FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('cho', 'admin')
        )
    );

-- Commentaire de documentation
COMMENT ON TABLE link_validations IS
    'Stocke le niveau de fiabilité et la source de chaque lien généalogique Neo4j. '
    'Le pair person_a_id / person_b_id correspond aux IDs des nœuds Neo4j. '
    'Le champ reliability peut être : confirme, probable, en_cours.';
