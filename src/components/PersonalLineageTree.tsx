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
                // 1. Profil utilisateur
                const { data: profil } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, status, ancestral_root_id')
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
                            type: 'ancetre',
                            generation: 0,
                            is_certified: ancetre.is_certified,
                            periode: ancetre.periode
                        });
                    }
                }

                // 3. Dernière validation IA pour la position
                const { data: validation } = await supabase
                    .from('validations')
                    .select('observations')
                    .eq('profile_id', userId)
                    .eq('role_validateur', 'system')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (validation?.observations) {
                    // Parser le résultat IA depuis observations
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

                // 4. Nœud utilisateur courant
                nodes.push({
                    id: userId,
                    nom: `${profil.first_name || ''} ${profil.last_name || ''}`.trim() || 'Vous',
                    type: 'self',
                    generation: nodes.length,
                    status: profil.status || 'pending'
                });

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
        if (status === 'confirmed') return 'border-green-400 bg-green-50';
        if (status === 'probable') return 'border-orange-400 bg-orange-50';
        if (status === 'rejected') return 'border-red-400 bg-red-50';
        return 'border-gray-300 bg-white';
    };

    return (
        <div className="py-6 px-2">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#FF6600]" />
                    <h3 className="font-bold text-sm text-gray-700">Votre Lignée Ancestrale</h3>
                </div>
                {aiPosition && (
                    <div className="flex items-center gap-1 text-xs bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                        🤖 {aiPosition.confidence}% confiance
                    </div>
                )}
            </div>

            {/* Arbre vertical - de l'ancêtre (haut) vers l'utilisateur (bas) */}
            <div className="flex flex-col items-center space-y-0">
                {lineage.map((node, idx) => (
                    <div key={node.id} className="flex flex-col items-center w-full max-w-xs">
                        {/* Connecteur vertical */}
                        {idx > 0 && (
                            <div className="flex flex-col items-center my-1">
                                {aiPosition && idx === lineage.length - 1 && (
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 rounded-full px-2 py-0.5 mb-1">
                                        <Hash className="w-2.5 h-2.5" />
                                        {aiPosition.generation}e génération
                                    </div>
                                )}
                                <div className="w-px h-6 bg-gradient-to-b from-gray-300 to-gray-200" />
                                <ChevronUp className="w-3.5 h-3.5 text-gray-300 -mt-1" />
                                <div className="w-px h-2 bg-gray-200" />
                            </div>
                        )}

                        {/* Nœud */}
                        <div
                            onClick={() => setSelectedNode({
                                id: node.id,
                                nom: node.nom,
                                roleOuLien: node.type === 'ancetre' ? 'Ancêtre Fondateur' : (aiPosition?.lien_probable || 'Vous'),
                                periodeOuNaissance: node.periode,
                                status: node.status || 'confirmed',
                                isCertified: node.is_certified,
                                type: node.type
                            })}
                            className={`w-full border-2 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md cursor-pointer ${node.type === 'ancetre' ? 'border-amber-300 bg-amber-50' : getStatusColor(node.status)}`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Icône */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${node.type === 'ancetre' ? 'bg-amber-100' : 'bg-[#FF6600]/10'}`}>
                                    {node.type === 'ancetre'
                                        ? <Crown className="w-5 h-5 text-amber-600" />
                                        : <User className="w-5 h-5 text-[#FF6600]" />
                                    }
                                </div>

                                {/* Contenu */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-bold text-sm text-gray-900 truncate">{node.nom}</h4>
                                        {node.type === 'ancetre' && node.is_certified && (
                                            <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">✅ Certifié</span>
                                        )}
                                        {node.type === 'self' && node.status === 'confirmed' && (
                                            <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">✅ Confirmé</span>
                                        )}
                                        {node.type === 'self' && node.status === 'pending' && (
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> En attente</span>
                                        )}
                                    </div>
                                    {node.type === 'ancetre' ? (
                                        <p className="text-xs text-amber-700 font-semibold mt-0.5">Ancêtre Fondateur</p>
                                    ) : (
                                        <p className="text-xs text-[#FF6600] font-semibold mt-0.5">Vous — Village {villageNom}</p>
                                    )}
                                    {node.periode && (
                                        <p className="text-xs text-gray-400 mt-0.5">⏳ {node.periode}</p>
                                    )}
                                    {node.type === 'self' && aiPosition && (
                                        <p className="text-xs text-gray-500 mt-1 italic">{aiPosition.lien_probable}</p>
                                    )}
                                </div>
                            </div>
                        </div>
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
