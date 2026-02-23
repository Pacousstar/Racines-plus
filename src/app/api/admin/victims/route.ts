import { NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

    // Vérifier l'utilisateur authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Accès refusé. Rôle administrateur requis.' }, { status: 403 });
    }

    try {
        const session = await getSession();

        try {
            const cypherQuery = `
                MATCH (v:Person {isVictim: true})
                RETURN v
                ORDER BY v.lastName, v.firstName
            `;

            const result = await session.run(cypherQuery);

            const victims = result.records.map(r => r.get('v').properties);

            if (victims.length > 0) {
                const addedByIds = [...new Set(victims.map(v => v.addedBy).filter(Boolean))];
                if (addedByIds.length > 0) {
                    const { data: addedByProfiles } = await supabase
                        .from('profiles')
                        .select('id, first_name, last_name, village_origin')
                        .in('id', addedByIds);

                    if (addedByProfiles) {
                        victims.forEach(v => {
                            const adder = addedByProfiles.find(p => p.id === v.addedBy);
                            if (adder) {
                                v.addedByDetails = {
                                    firstName: adder.first_name,
                                    lastName: adder.last_name,
                                    village: adder.village_origin
                                };
                            }
                        });
                    }
                }
            }

            return NextResponse.json({ success: true, victims });
        } finally {
            await session.close();
        }
    } catch (error: unknown) {
        console.error("Erreur Fetch API Victims Neo4j:", error);
        const msg = error instanceof Error ? error.message : 'Erreur interne API';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
