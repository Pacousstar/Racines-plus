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
        const { relation, firstName, lastName, birthYear, status, isVictim, reliability, sourceType, sourceRef } = body;

        const session = await getSession();

        try {
            // 1. Assurer que le noeud Utilisateur existe (Fondateur)
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

            if (profile) {
                await session.run(
                    `MERGE (u:Person {id: $userId})
                     ON CREATE SET u.firstName = $uFirstName, u.lastName = $uLastName, u.isFounder = true, u.village = $uVillage`,
                    {
                        userId: user.id,
                        uFirstName: profile.first_name || '',
                        uLastName: profile.last_name || '',
                        uVillage: profile.village_origin || ''
                    }
                );
            }

            // 2. Créer le Noeud + Relation selon le type
            const ancestorId = crypto.randomUUID();
            const reliabilityVal = reliability || 'en_cours';
            const params = {
                userId: user.id,
                ancestorId,
                firstName,
                lastName,
                birthYear: birthYear || null,
                status,
                isVictim: isVictim || false,
                reliability: reliabilityVal,
                sourceType: sourceType || null,
                sourceRef: sourceRef || null,
            };

            let cypherQuery = '';

            if (relation === 'Père') {
                cypherQuery = `
                    MATCH (u:Person {id: $userId})
                    CREATE (a:Person { id: $ancestorId, firstName: $firstName, lastName: $lastName,
                        birthYear: $birthYear, status: $status, isVictim: $isVictim,
                        addedBy: $userId, reliability: $reliability })
                    CREATE (a)-[:FATHER_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(u)
                    RETURN a`;

            } else if (relation === 'Mère') {
                cypherQuery = `
                    MATCH (u:Person {id: $userId})
                    CREATE (a:Person { id: $ancestorId, firstName: $firstName, lastName: $lastName,
                        birthYear: $birthYear, status: $status, isVictim: $isVictim,
                        addedBy: $userId, reliability: $reliability })
                    CREATE (a)-[:MOTHER_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(u)
                    RETURN a`;

            } else if (relation === 'Enfant') {
                cypherQuery = `
                    MATCH (u:Person {id: $userId})
                    CREATE (a:Person { id: $ancestorId, firstName: $firstName, lastName: $lastName,
                        birthYear: $birthYear, status: $status, isVictim: $isVictim,
                        addedBy: $userId, reliability: $reliability })
                    CREATE (u)-[:PARENT_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(a)
                    RETURN a`;

            } else if (relation === 'Conjoint(e)') {
                // Bidirectionnel — visible depuis les deux nœuds
                cypherQuery = `
                    MATCH (u:Person {id: $userId})
                    CREATE (a:Person { id: $ancestorId, firstName: $firstName, lastName: $lastName,
                        birthYear: $birthYear, status: $status, isVictim: $isVictim,
                        addedBy: $userId, reliability: $reliability })
                    CREATE (u)-[:SPOUSE_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(a)
                    CREATE (a)-[:SPOUSE_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(u)
                    RETURN a`;

            } else if (relation === 'Frère / Sœur') {
                cypherQuery = `
                    MATCH (u:Person {id: $userId})
                    CREATE (a:Person { id: $ancestorId, firstName: $firstName, lastName: $lastName,
                        birthYear: $birthYear, status: $status, isVictim: $isVictim,
                        addedBy: $userId, reliability: $reliability })
                    CREATE (u)-[:SIBLING_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(a)
                    CREATE (a)-[:SIBLING_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(u)
                    RETURN a`;

            } else if (relation === 'Demi-frère / Demi-sœur') {
                cypherQuery = `
                    MATCH (u:Person {id: $userId})
                    CREATE (a:Person { id: $ancestorId, firstName: $firstName, lastName: $lastName,
                        birthYear: $birthYear, status: $status, isVictim: $isVictim,
                        addedBy: $userId, reliability: $reliability })
                    CREATE (u)-[:HALF_SIBLING_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(a)
                    CREATE (a)-[:HALF_SIBLING_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(u)
                    RETURN a`;

            } else if (relation === 'Oncle / Tante') {
                cypherQuery = `
                    MATCH (u:Person {id: $userId})
                    CREATE (a:Person { id: $ancestorId, firstName: $firstName, lastName: $lastName,
                        birthYear: $birthYear, status: $status, isVictim: $isVictim,
                        addedBy: $userId, reliability: $reliability })
                    CREATE (a)-[:UNCLE_AUNT_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(u)
                    RETURN a`;

            } else if (relation === 'Cousin(e)') {
                cypherQuery = `
                    MATCH (u:Person {id: $userId})
                    CREATE (a:Person { id: $ancestorId, firstName: $firstName, lastName: $lastName,
                        birthYear: $birthYear, status: $status, isVictim: $isVictim,
                        addedBy: $userId, reliability: $reliability })
                    CREATE (u)-[:COUSIN_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(a)
                    CREATE (a)-[:COUSIN_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(u)
                    RETURN a`;

            } else if (relation === 'Neveu / Nièce') {
                cypherQuery = `
                    MATCH (u:Person {id: $userId})
                    CREATE (a:Person { id: $ancestorId, firstName: $firstName, lastName: $lastName,
                        birthYear: $birthYear, status: $status, isVictim: $isVictim,
                        addedBy: $userId, reliability: $reliability })
                    CREATE (u)-[:UNCLE_AUNT_OF { reliability: $reliability, sourceType: $sourceType, sourceRef: $sourceRef }]->(a)
                    RETURN a`;

            } else {
                return NextResponse.json({ error: `Relation inconnue : ${relation}` }, { status: 400 });
            }

            const result = await session.run(cypherQuery, params);

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
