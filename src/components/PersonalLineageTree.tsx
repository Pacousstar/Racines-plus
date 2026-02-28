"use client";

import React, { useState, useEffect } from 'react';
import { TreePine, User, ChevronUp, Crown, Clock, Hash, GitBranch } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import AncestorDetailsModal, { AncestorModalData } from './AncestorDetailsModal';

interface LineageNode {
    id: string;
    nom: string;
    type: 'ancetre' | 'self';
    generation: number;
    lien?: string;        // "Arrière-petit-fils de", etc.
    confidence?: number;
    is_certified?: boolean;
    periode?: string;
    status?: string;
    avatarUrl?: string | null;
}

interface PersonalLineageTreeProps {
    userId: string;
    villageNom?: string;
}

/**
 * Composant d'arbre de lignée personnelle pour le Dashboard User.
 * Affiche : Ancêtre Fondateur (CHO-certifié) ← Lignée → Utilisateur Courant
 * Données depuis Supabase (profiles + ancestres + validations)
 */
export default function PersonalLineageTree({ userId, villageNom = 'Toa-Zéo' }: PersonalLineageTreeProps) {
    const supabase = createClient();
    const [lineage, setLineage] = useState<LineageNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [aiPosition, setAiPosition] = useState<{ generation: number; lien_probable: string; confidence: number } | null>(null);
    const [selectedNode, setSelectedNode] = useState<AncestorModalData | null>(null);

    useEffect(() => {
        const loadLineage = async () => {
            setIsLoading(true);
            try {
                // 1. Profil utilisateur (avec détails enfants)
                const { data: profil } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, status, ancestral_root_id, avatar_url, details_enfants')
                    .eq('id', userId)
                    .single();

                if (!profil) { setIsLoading(false); return; }

                const nodes: LineageNode[] = [];

                // 2. Ancêtre fondateur (si choisi)
                if (profil.ancestral_root_id) {
                    const { data: ancetre } = await supabase
                        .from('ancestres')
                        .select('id, nom_complet, periode, is_certified')
                        .eq('id', profil.ancestral_root_id)
                        .single();

                    if (ancetre) {
                        nodes.push({
                            id: ancetre.id,
                            nom: ancetre.nom_complet,
                            type: 'ancetre' as const,
                            generation: 0,
                            is_certified: ancetre.is_certified,
                            periode: ancetre.periode
                        });
                    }
                }

                // 3. Récupérer les membres de la lignée via Neo4j
                // RÈGLE CRITIQUE : On n'affiche dans l'arbre QUE les membres ayant passé l'onboarding
                // ET dont le statut a été validé par CHO (confirmed) ou pré-validé par CHOa (probable).
                // Les données déclaratives (Fiche détaillée) ne doivent JAMAIS apparaître dans l'arbre.
                try {
                    const res = await fetch('/api/tree');
                    if (res.ok) {
                        const treeData = await res.json();
                        const parentLinks = treeData.links.filter((l: any) => l.target === userId);

                        for (const link of parentLinks) {
                            const parent = treeData.nodes.find((n: any) => n.id === link.source);
                            if (!parent?.id) continue;

                            // Vérification du statut Supabase — seuls confirmed ou probable sont affichés
                            const { data: parentProfile } = await supabase
                                .from('profiles')
                                .select('status, first_name, last_name, avatar_url')
                                .eq('id', parent.id)
                                .single();

                            if (!parentProfile) continue;

                            // Filtre strict : uniquement les membres validés par l'équipe CHO
                            if (parentProfile.status !== 'confirmed' && parentProfile.status !== 'probable') {
                                console.log(`[LineageTree] Parent ${parent.id} exclu (statut: ${parentProfile.status})`);
                                continue;
                            }

                            nodes.push({
                                id: parent.id,
                                nom: `${parentProfile.first_name || ''} ${parentProfile.last_name || ''}`.trim(),
                                type: 'self' as const,
                                generation: nodes.length,
                                status: parentProfile.status,
                                avatarUrl: parentProfile.avatar_url,
                                lien: link.type === 'FATHER_OF' ? 'Père' : 'Mère'
                            });
                        }

                        // De même pour les enfants : on cherche les liens où l'utilisateur est la source
                        // et on n'affiche que les enfants ayant un compte validé (onboarding + CHO)
                        const childLinks = treeData.links.filter((l: any) => l.source === userId);
                        for (const link of childLinks) {
                            const child = treeData.nodes.find((n: any) => n.id === link.target);
                            if (!child?.id) continue;

                            const { data: childProfile } = await supabase
                                .from('profiles')
                                .select('status, first_name, last_name, avatar_url')
                                .eq('id', child.id)
                                .single();

                            if (!childProfile) continue;

                            // Filtre strict : uniquement les enfants inscrits via onboarding et validés CHO
                            if (childProfile.status !== 'confirmed' && childProfile.status !== 'probable') {
                                console.log(`[LineageTree] Enfant ${child.id} exclu (statut: ${childProfile.status})`);
                                continue;
                            }

                            // Note: les enfants s'afficheront APRÈS le nœud utilisateur courant (ils seront ajoutés après)
                            // On les stocke temporairement pour les insérer à la fin
                        }
                    }
                } catch (e) {
                    console.warn('[LineageTree] Neo4j fetch error:', e);
                }

                // 4. Dernière validation IA pour la position (optionnel si parents présents)
                const { data: validation } = await supabase
                    .from('validations')
                    .select('observations')
                    .eq('profile_id', userId)
                    .eq('role_validateur', 'system')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (validation?.observations) {
                    const genMatch = validation.observations.match(/Génération\s+(\d+)/);
                    const confMatch = validation.observations.match(/Confiance\s+(\d+)/);
                    const lienMatch = validation.observations.match(/—\s+([^—]+)$/);

                    if (genMatch && confMatch) {
                        setAiPosition({
                            generation: parseInt(genMatch[1]),
                            confidence: parseInt(confMatch[1]),
                            lien_probable: lienMatch?.[1]?.trim() || 'Descendant de'
                        });
                    }
                }

                // 5. Nœud utilisateur courant
                nodes.push({
                    id: userId,
                    nom: `${profil.first_name || ''} ${profil.last_name || ''}`.trim() || 'Vous',
                    type: 'self' as const,
                    generation: nodes.length,
                    status: profil.status || 'pending',
                    avatarUrl: profil.avatar_url
                });


                // ============================================================
                // RÈGLE MÉTIER FONDAMENTALE — Arbre Généalogique Racines+
                // ============================================================
                // L'arbre NE DOIT CONTENIR que des membres ayant :
                //   1. Complété l'onboarding (inscription sur Racines+)
                //   2. Été validés par le CHO (confirmed) ou pré-validés par CHOa (probable)
                //
                // Les enfants déclarés dans la "Fiche détaillée" (details_enfants) sont
                // des données informatives UNIQUEMENT. Ils n'apparaissent PAS dans l'arbre
                // tant qu'ils n'ont pas leur propre compte Racines+ validé par le CHO.
                // ============================================================

                setLineage(nodes);
            } catch (err) {
                console.warn('[LineageTree] Erreur:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) loadLineage();
    }, [userId, supabase]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-10 h-10 border-2 border-[#FF6600] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 animate-pulse">Chargement de votre lignée…</p>
            </div>
        );
    }

    if (lineage.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center mb-4">
                    <TreePine className="w-8 h-8 text-[#FF6600]" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">Votre arbre est vide</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                    Choisissez votre ancêtre fondateur pour que l&apos;IA Racines+ positionne votre lignée dans l&apos;arbre du village de <strong>{villageNom}</strong>.
                </p>
            </div>
        );
    }

    const getStatusColor = (status?: string) => {
        if (status === 'confirmed') return 'border-[#124E35] bg-green-50/50';
        if (status === 'probable') return 'border-[#C05C3C] bg-orange-50/50';
        if (status === 'rejected') return 'border-red-400 bg-red-50/50';
        if (status === 'declarative') return 'border-dashed border-stone-300 bg-stone-50/30';
        return 'border-gray-300 bg-white';
    };

    return (
        <div className="py-6 px-2">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#124E35]" />
                    <h3 className="font-bold text-sm text-gray-700">Votre Lignée Ancestrale</h3>
                </div>
                {aiPosition && (
                    <div className="flex items-center gap-1 text-xs bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                        🤖 {aiPosition.confidence}% confiance
                    </div>
                )}
            </div>

            {/* Arbre vertical - de l'ancêtre (haut) vers l'utilisateur (bas) */}
            <div className="flex flex-col items-center space-y-0 text-left">
                {lineage.map((node, idx) => (
                    <div key={node.id} className="flex flex-col items-center w-full max-w-xs">
                        {/* Nœud */}
                        <div
                            onClick={() => setSelectedNode({
                                id: node.id,
                                nom: node.nom,
                                roleOuLien: node.type === 'ancetre' ? 'Ancêtre Fondateur' : (node.lien || aiPosition?.lien_probable || 'Vous'),
                                periodeOuNaissance: node.periode,
                                status: node.status || 'confirmed',
                                isCertified: node.is_certified,
                                type: node.type
                            })}
                            className={`w-full border-2 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md cursor-pointer relative z-10 ${node.type === 'ancetre' ? 'border-amber-300 bg-amber-50' : getStatusColor(node.status)}`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Icône */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${node.type === 'ancetre' ? 'bg-amber-100' : node.lien === 'Enfant' ? 'bg-blue-50' : 'bg-[#124E35]/10'}`}>
                                    {node.type === 'ancetre' ? (
                                        <Crown className="w-5 h-5 text-amber-600" />
                                    ) : node.avatarUrl ? (
                                        <img src={node.avatarUrl} alt={node.nom} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className={`w-5 h-5 ${node.lien === 'Enfant' ? 'text-blue-500' : 'text-[#124E35]'}`} />
                                    )}
                                </div>

                                {/* Contenu */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-bold text-sm text-gray-900 truncate">{node.nom}</h4>
                                        {node.type === 'ancetre' && node.is_certified && (
                                            <span className="text-[10px] bg-[#124E35] text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Certifié</span>
                                        )}
                                        {node.type === 'self' && node.status === 'confirmed' && (
                                            <span className="text-[10px] bg-[#124E35] text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Confirmé</span>
                                        )}
                                        {node.type === 'self' && node.status === 'pending' && (
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> En attente</span>
                                        )}
                                        {node.status === 'declarative' && (
                                            <span className="text-[8px] border border-stone-200 text-stone-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 uppercase tracking-tighter">Déclaratif</span>
                                        )}
                                    </div>
                                    {node.type === 'ancetre' ? (
                                        <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider mt-0.5">Ancêtre Fondateur</p>
                                    ) : (
                                        <p className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${node.lien === 'Enfant' ? 'text-blue-600' : 'text-[#124E35]'}`}>
                                            {node.lien || (node.id === userId ? 'Vous' : 'Parent')} — {villageNom}
                                        </p>
                                    )}
                                    {node.periode && (
                                        <p className="text-xs text-stone-400 mt-0.5 font-mono">⏳ {node.periode}</p>
                                    )}
                                    {node.type === 'self' && aiPosition && (
                                        <p className="text-xs text-stone-500 mt-1 italic">{aiPosition.lien_probable}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Connecteur vertical (courbe descendante) */}
                        {idx < lineage.length - 1 && (
                            <div className="relative w-full h-12 flex justify-center">
                                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
                                    <path
                                        d="M 160 0 Q 160 20, 160 48"
                                        fill="none"
                                        stroke="#d6d3d1"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeDasharray="4 2"
                                    />
                                </svg>
                                {aiPosition && idx === 0 && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-stone-100 rounded-full px-2 py-0.5 shadow-sm z-20">
                                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">
                                            {aiPosition.generation} Générations
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Note IA en bas */}
            {!aiPosition && lineage.length > 1 && (
                <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-3 flex items-center gap-2">
                    <span className="text-base">🤖</span>
                    <p className="text-xs text-amber-700">
                        L&apos;IA Racines+ analysera votre position dans la lignée lors de la prochaine validation.
                    </p>
                </div>
            )}

            <AncestorDetailsModal isOpen={!!selectedNode} onClose={() => setSelectedNode(null)} person={selectedNode} />
        </div>
    );
}
