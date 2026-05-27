import { NextResponse } from 'next/server';
import { error } from '@/lib/api-response';
import { getSession } from '@/lib/neo4j';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

    // Vérifier l'utilisateur authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return error('Non autorisé', 401);
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    if (!profile || profile.role !== 'admin') {
        return error('Accès refusé. Rôle administrateur requis.', 403);
    }

    try {
        const session = await getSession();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let victims: any[] = [];

        try {
            // 1. Victimes depuis Neo4j (Ancêtres/Parents)
            const cypherQuery = `
                MATCH (v:Person {isVictim: true})
                RETURN v
                ORDER BY v.lastName, v.firstName
            `;
            const result = await session.run(cypherQuery);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            victims = result.records.map((r: any) => r.get('v').properties);

            // 2. Victimes depuis Supabase (Enfants dans profiles)
            const { data: profilesWithChildren } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, village_origin, details_enfants')
                .not('details_enfants', 'is', null);

            if (profilesWithChildren) {
                profilesWithChildren.forEach(profile => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const children = profile.details_enfants as any[];
                    if (Array.isArray(children)) {
                        children.forEach(child => {
                            if (child.isVictime2010) {
                                victims.push({
                                    id: child.id || `child-${Math.random()}`,
                                    firstName: child.firstName,
                                    lastName: child.lastName,
                                    birthYear: child.birthDate?.split('-')[0] || '',
                                    status: 'Décédée (Enfant)',
                                    isVictim: true,
                                    addedBy: profile.id,
                                    addedByDetails: {
                                        firstName: profile.first_name,
                                        lastName: profile.last_name,
                                        village: profile.village_origin
                                    }
                                });
                            }
                        });
                    }
                });
            }

            // 3. Récupérer les détails des auteurs pour les victimes Neo4j (si pas déjà fait)
            const victimsToHydrate = victims.filter(v => v.addedBy && !v.addedByDetails);
            if (victimsToHydrate.length > 0) {
                const addedByIds = [...new Set(victimsToHydrate.map(v => v.addedBy))];
                const { data: addedByProfiles } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, village_origin')
                    .in('id', addedByIds);

                if (addedByProfiles) {
                    victims.forEach(v => {
                        if (v.addedBy && !v.addedByDetails) {
                            const adder = addedByProfiles.find(p => p.id === v.addedBy);
                            if (adder) {
                                v.addedByDetails = {
                                    firstName: adder.first_name,
                                    lastName: adder.last_name,
                                    village: adder.village_origin
                                };
                            }
                        }
                    });
                }
            }

            return NextResponse.json({ success: true, data: victims }, {
                headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
            });
        } finally {
            await session.close();
        }
    } catch (err: unknown) {
        console.error("Erreur Fetch API Victims Neo4j:", err);
        const msg = err instanceof Error ? err.message : 'Erreur interne API';
        return error(msg, 500);
    }
}
