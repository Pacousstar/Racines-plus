import { NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // Vérifier l'utilisateur authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { relation, firstName, lastName, birthYear, status, isVictim } = body;

        const session = await getSession();

        try {
            // 1. Assurer que le noeud Utilisateur existe (Fondateur)
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

            if (profile) {
                await session.run(
                    `
          MERGE (u:Person {id: $userId})
          ON CREATE SET u.firstName = $uFirstName, u.lastName = $uLastName, u.isFounder = true, u.village = $uVillage
          `,
                    {
                        userId: user.id,
                        uFirstName: profile.first_name || '',
                        uLastName: profile.last_name || '',
                        uVillage: profile.village_origin || ''
                    }
                );
            }

            // 2. Créer le Noeud Ancêtre 
            const ancestorId = crypto.randomUUID();

            // Construction de la relation
            let relType = '';
            if (relation === 'Père') relType = 'FATHER_OF';
            else if (relation === 'Mère') relType = 'MOTHER_OF';
            else if (relation === 'Enfant') relType = 'PARENT_OF';

            const cypherQuery = relation === 'Enfant'
                ? `
                MATCH (u:Person {id: $userId})
                CREATE (a:Person {
                  id: $ancestorId,
                  firstName: $firstName,
                  lastName: $lastName,
                  birthYear: $birthYear,
                  status: $status,
                  isVictim: $isVictim,
                  addedBy: $userId
                })
                CREATE (u)-[:PARENT_OF]->(a)
                RETURN a
              `
                : `
                MATCH (u:Person {id: $userId})
                CREATE (a:Person {
                  id: $ancestorId,
                  firstName: $firstName,
                  lastName: $lastName,
                  birthYear: $birthYear,
                  status: $status,
                  isVictim: $isVictim,
                  addedBy: $userId
                })
                CREATE (a)-[:${relType}]->(u)
                RETURN a
              `;

            const result = await session.run(cypherQuery, {
                userId: user.id,
                ancestorId: ancestorId,
                firstName,
                lastName,
                birthYear: birthYear || null,
                status,
                isVictim: isVictim || false,
            });

            return NextResponse.json({ success: true, ancestor: result.records[0]?.get('a').properties });

        } finally {
            await session.close();
        }

    } catch (error: unknown) {
        console.error("Erreur Graph API:", error);
        const msg = error instanceof Error ? error.message : 'Erreur interne Neo4j';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
