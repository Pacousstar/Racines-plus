import { success, error } from '@/lib/api-response';
import { getSession } from '@/lib/neo4j';
import { createClient } from '@/lib/supabase/server';
import { cacheGet, cacheSet, cacheKey } from '@/lib/cache';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return error('Non autorisé', 401);
    }

    const key = cacheKey('tree', user.id, searchParams.get('personId') || undefined);
    const cached = await cacheGet<{ nodes: Record<string, unknown>[]; links: { source: string; target: string; type: string }[] }>(key);
    if (cached) return success(cached);

    try {
        const session = await getSession();

        try {
            // On récupère le sous-graphe complet à partir de l'utilisateur (famille élargie 2 niveaux max)
            const cypherQuery = `
        MATCH path = (u:Person {id: $userId})-[*0..2]-(relative:Person)
        RETURN nodes(path) AS nodes, relationships(path) AS rels
        LIMIT 200
      `;

            const result = await session.run(cypherQuery, { userId: user.id });

            const nodesMap = new Map<string, Record<string, unknown>>();
            const links: { source: string; target: string; type: string }[] = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.records.forEach((record: any) => {
                const pathNodes = record.get('nodes') as { properties: Record<string, unknown> }[];
                const pathRels = record.get('rels') as { startNodeElementId: string; endNodeElementId: string; type: string }[];

                pathNodes.forEach((node) => {
                    const props = node.properties;
                    const id = props.id as string;
                    if (!nodesMap.has(id)) {
                        nodesMap.set(id, {
                            id,
                            firstName: props.firstName,
                            lastName: props.lastName,
                            birthYear: props.birthYear,
                            status: props.status,
                            isVictim: props.isVictim,
                            isFounder: props.isFounder,
                            village: props.village
                        });
                    }
                });

                pathRels.forEach((rel) => {
                    links.push({
                        source: rel.startNodeElementId,
                        target: rel.endNodeElementId,
                        type: rel.type
                    });
                });
            });

            // Si l'utilisateur n'a pas encore de noeud (nouvel user complet), on renvoie juste les données Supabase formatées comme un noeud
            if (nodesMap.size === 0) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (profile) {
                    const nodes = [{
                        id: user.id,
                        firstName: profile.first_name,
                        lastName: profile.last_name,
                        isFounder: false,
                        village: profile.village_origin
                    }];
                    const links: { source: string; target: string; type: string }[] = [];
                    await cacheSet(key, { nodes, links }, 300);
                    return success({ nodes, links });
                }
            }

            // Convertir Map en Array
            const nodes = Array.from(nodesMap.values());

            await cacheSet(key, { nodes, links }, 300);

            return success({ nodes, links });

        } finally {
            await session.close();
        }

    } catch (err: unknown) {
        console.error("Erreur Graph API (GET Tree):", err);
        return error('Erreur lecture Arbre', 500);
    }
}
