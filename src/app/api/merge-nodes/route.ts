import { success, error } from '@/lib/api-response';
import { getSession } from '@/lib/neo4j';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/merge-nodes
 * Fusionne deux nœuds Neo4j en transférant toutes les relations
 * du nœud "deleteId" vers le nœud "keepId", puis supprime "deleteId".
 * Réservé aux rôles : cho, admin
 */
export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return error('Non autorisé', 401);
    }

    // Vérifier que l'utilisateur est CHO ou Admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['cho', 'admin'].includes(profile.role)) {
        return error('Permission insuffisante. Seuls CHO et Admin peuvent fusionner des nœuds.', 403);
    }

    try {
        const { keepId, deleteId } = await request.json();

        if (!keepId || !deleteId) {
            return error('keepId et deleteId sont obligatoires.', 400);
        }

        if (keepId === deleteId) {
            return error('Les deux nœuds doivent être différents.', 400);
        }

        const session = await getSession();

        try {
            // 1. Vérifier que les deux nœuds existent
            const checkResult = await session.run(
                `MATCH (a:Person {id: $keepId}), (b:Person {id: $deleteId}) RETURN a.firstName + ' ' + a.lastName AS keepName, b.firstName + ' ' + b.lastName AS deleteName`,
                { keepId, deleteId }
            );

            if (checkResult.records.length === 0) {
                return error('Un ou les deux nœuds sont introuvables.', 404);
            }

            const keepName = checkResult.records[0].get('keepName');
            const deleteName = checkResult.records[0].get('deleteName');

            // 2. Retirer la relation directe entre les deux nœuds (s'il en existe une) pour éviter les doublons
            await session.run(
                `MATCH (a:Person {id: $keepId})-[r]-(b:Person {id: $deleteId}) DELETE r`,
                { keepId, deleteId }
            );

            // 3. Transférer toutes les relations sortantes du nœud à supprimer vers le nœud à garder
            await session.run(
                `MATCH (del:Person {id: $deleteId})-[r]->(other)
                 WHERE other.id <> $keepId
                 MATCH (keep:Person {id: $keepId})
                 CALL apoc.create.relationship(keep, type(r), properties(r), other) YIELD rel
                 DELETE r`,
                { keepId, deleteId }
            );

            // 4. Transférer toutes les relations entrantes
            await session.run(
                `MATCH (other)-[r]->(del:Person {id: $deleteId})
                 WHERE other.id <> $keepId
                 MATCH (keep:Person {id: $keepId})
                 CALL apoc.create.relationship(other, type(r), properties(r), keep) YIELD rel
                 DELETE r`,
                { keepId, deleteId }
            );

            // 5. Supprimer le nœud doublon (et toutes ses relations restantes)
            await session.run(
                `MATCH (del:Person {id: $deleteId}) DETACH DELETE del`,
                { deleteId }
            );

            // 6. Loguer la fusion dans Supabase
            await supabase.from('activity_logs').insert({
                user_id: user.id,
                action: 'MERGE_NODES',
                details: `Fusion : ${deleteName} (${deleteId}) → ${keepName} (${keepId})`,
                created_at: new Date().toISOString(),
            });

            return success({
                message: `"${deleteName}" a été fusionné dans "${keepName}". Le doublon a été supprimé.`,
            });

        } finally {
            await session.close();
        }

    } catch (err: unknown) {
        console.error('[merge-nodes] Erreur:', err);
        // Si APOC n'est pas disponible, proposer un fallback
        const msg = err instanceof Error ? err.message : 'Erreur interne Neo4j';
        if (msg.toLowerCase().includes('apoc')) {
            return error('Le plugin APOC est requis pour la fusion de nœuds. Activez-le dans votre instance Neo4j.', 501);
        }
        return error(msg, 500);
    }
}

/**
 * GET /api/merge-nodes?village=Toa-Zéo
 * Retourne les paires de nœuds candidats à la fusion (noms similaires dans le même village)
 */
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return error('Non autorisé', 401);
    }

    const { data: profile } = await supabase.from('profiles').select('role, village_origin').eq('id', user.id).single();
    if (!profile || !['cho', 'admin'].includes(profile.role)) {
        return error('Permission insuffisante', 403);
    }

    const { searchParams } = new URL(request.url);
    const village = searchParams.get('village') || profile.village_origin || 'Toa-Zéo';

    const session = await getSession();
    try {
        // Trouver des paires de nœuds avec le même nom de famille dans le même village
        const result = await session.run(
            `MATCH (a:Person), (b:Person)
             WHERE a.id < b.id
               AND a.village = $village AND b.village = $village
               AND toLower(a.lastName) = toLower(b.lastName)
               AND a.id IS NOT NULL AND b.id IS NOT NULL
             RETURN a.id AS idA, a.firstName AS firstA, a.lastName AS lastA, a.birthYear AS birthA,
                    b.id AS idB, b.firstName AS firstB, b.lastName AS lastB, b.birthYear AS birthB
             LIMIT 20`,
            { village }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candidates = result.records.map((r: any) => ({
            a: { id: r.get('idA'), firstName: r.get('firstA'), lastName: r.get('lastA'), birthYear: r.get('birthA') },
            b: { id: r.get('idB'), firstName: r.get('firstB'), lastName: r.get('lastB'), birthYear: r.get('birthB') },
        }));

        return success({ candidates });
    } finally {
        await session.close();
    }
}
