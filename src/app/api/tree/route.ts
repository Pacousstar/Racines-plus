import { NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

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

            result.records.forEach(record => {
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
                    return NextResponse.json({
                        nodes: [{
                            id: user.id,
                            firstName: profile.first_name,
                            lastName: profile.last_name,
                            isFounder: false,
                            village: profile.village_origin
                        }],
                        links: []
                    });
                }
            }

            // Convertir Map en Array
            const nodes = Array.from(nodesMap.values());

            return NextResponse.json({ nodes, links });

        } finally {
            await session.close();
        }

    } catch (error: unknown) {
        console.error("Erreur Graph API (GET Tree):", error);
        return NextResponse.json({ error: 'Erreur lecture Arbre' }, { status: 500 });
    }
}
