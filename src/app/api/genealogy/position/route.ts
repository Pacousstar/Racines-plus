import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/genealogy/position
 *
 * Corps de la requête :
 * {
 *   profil_id: string,       // ID du profil à positionner
 *   ancetre_id: string,      // ID de l'ancêtre sélectionné
 *   village_nom: string,     // Nom du village
 *   quartier_nom?: string    // Quartier (optionnel)
 * }
 *
 * Réponse :
 * {
 *   success: boolean,
 *   position: {
 *     generation: number,      // Génération estimée (1 = fils direct, 2 = petit-fils, ...)
 *     branche: string,         // Nom de la branche
 *     lien_probable: string,   // "Fils de", "Petit-fils de", etc.
 *     confidence: number       // Score de confiance 0-100
 *   }
 * }
 *
 * Algorithme : heuristique basée sur
 *   1. Écart de date de naissance (si disponible)
 *   2. Appartenance au quartier
 *   3. Nom de famille (correspondance phonétique simple)
 *   4. Statut du profil (fondateur ou non)
 */
export async function POST(req: NextRequest) {
    // Initialisation Supabase avec service role (accès complet)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const body = await req.json();
        const { profil_id, ancetre_id, village_nom, quartier_nom } = body;

        if (!profil_id || !ancetre_id) {
            return NextResponse.json({ success: false, error: 'profil_id et ancetre_id sont requis.' }, { status: 400 });
        }

        // 1. Récupérer les données du profil à positionner
        const { data: profil } = await supabase
            .from('profiles')
            .select('first_name, last_name, birth_date, gender, quartier_nom, is_founder, created_at')
            .eq('id', profil_id)
            .single();

        // 2. Récupérer les données de l'ancêtre
        const { data: ancetre } = await supabase
            .from('ancestres')
            .select('nom_complet, periode, village_id')
            .eq('id', ancetre_id)
            .single();

        if (!profil || !ancetre) {
            return NextResponse.json({ success: false, error: 'Profil ou ancêtre introuvable.' }, { status: 404 });
        }

        // ─────────────────────────────────────
        // ALGORITHME DE POSITIONNEMENT HEURISTIQUE
        // ─────────────────────────────────────

        let generation = 3; // Défaut : arrière-petit-fils
        let confidence = 40;
        let lien_probable = 'Descendant de';
        let branche = `Lignée ${ancetre.nom_complet.split(' ')[0]}`;

        // A. Estimation par l'année de naissance vs période de l'ancêtre
        if (profil.birth_date && ancetre.periode) {
            const yearBorn = new Date(profil.birth_date).getFullYear();
            // Extraction de l'année approximative de la période (ex: "XIXe siècle, ~1850")
            const periodMatch = ancetre.periode.match(/\d{4}/);
            if (periodMatch) {
                const ancestorYear = parseInt(periodMatch[0]);
                const ecart = yearBorn - ancestorYear;

                // ~25 ans par génération en moyenne
                const genEstimee = Math.round(ecart / 25);
                generation = Math.max(1, Math.min(genEstimee, 7)); // Clamp 1-7
                confidence = Math.min(75, 40 + (ecart > 0 ? 20 : 0));
            }
        }

        // B. Correspondance de quartier (boost de confiance)
        if (quartier_nom && profil.quartier_nom) {
            if (quartier_nom.toLowerCase() === profil.quartier_nom.toLowerCase()) {
                confidence = Math.min(90, confidence + 15);
                branche = `Lignée ${ancetre.nom_complet.split(' ')[0]} — ${profil.quartier_nom}`;
            }
        }

        // C. Correspondance du nom de famille (préfixe commun)
        const ancestreParts = ancetre.nom_complet.split(' ');
        const profilNomParts = [profil.first_name, profil.last_name].filter(Boolean);
        const hasNameMatch = ancestreParts.some((ap: string) =>
            profilNomParts.some(pp => pp.toLowerCase().startsWith(ap.toLowerCase().slice(0, 3)))
        );
        if (hasNameMatch) {
            confidence = Math.min(95, confidence + 10);
        }

        // D. Détermination du lien probable selon la génération
        const liens: Record<number, string> = {
            1: `Fils/Fille de`,
            2: `Petit(e)-enfant de`,
            3: `Arrière-petit(e)-enfant de`,
            4: `Descendant(e) de 4e génération de`,
            5: `Descendant(e) de 5e génération de`,
            6: `Descendant(e) de 6e génération de`,
            7: `Descendant(e) lointain(e) de`,
        };
        lien_probable = `${liens[generation] || 'Descendant de'} ${ancetre.nom_complet}`;

        // ─────────────────────────────────────
        // Mise à jour du profil avec la position estimée
        // ─────────────────────────────────────
        await supabase
            .from('profiles')
            .update({
                ancestral_root_id: ancetre_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', profil_id);

        // Enregistrer la suggestion IA dans la table validations (pour traçabilité)
        await supabase.from('validations').insert({
            profile_id: profil_id,
            role_validateur: 'system',
            statut: 'probable',
            observations: `IA Positionnement — Génération ${generation} — Confiance ${confidence}% — ${lien_probable}`,
            decision_finale: false
        });

        const position = {
            generation,
            branche,
            lien_probable,
            confidence,
            ancetre_nom: ancetre.nom_complet,
            resume: `Vous êtes probablement ${lien_probable} (génération ${generation}, confiance ${confidence}%).`
        };

        return NextResponse.json({ success: true, position }, { status: 200 });

    } catch (err) {
        console.error('[API position] Erreur:', err);
        return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        endpoint: 'POST /api/genealogy/position',
        description: 'Algorithme IA de positionnement dans la lignée ancestrale',
        version: '1.0.0'
    });
}
