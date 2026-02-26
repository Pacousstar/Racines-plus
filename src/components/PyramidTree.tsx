"use client";

import React, { useState, useEffect } from 'react';
import { User, CheckCircle, ChevronDown, ChevronUp, Loader2, TreePine, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import AncestorDetailsModal, { AncestorModalData } from './AncestorDetailsModal';

// Types
type PersonStatus = "confirmed" | "probable" | "pending" | "rejected" | string;

type PersonData = {
    id: string;
    name: string;
    role: string;
    birthYear: string;
    status: PersonStatus;
    isDeceased: boolean;
    isVictim2010?: boolean;
    village?: string;
    quartier?: string;
    parents?: PersonData[];
};

// ─────────────────────────────────────
// Composant Nœud individuel (Point)
// ─────────────────────────────────────
const TreeNode = ({ person, depth = 0, onSelectNode }: { person: PersonData; depth?: number; onSelectNode?: (person: PersonData) => void }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2);

    const statusStyles: Record<string, { ring: string; dot: string; badge: string }> = {
        confirmed: { ring: 'border-emerald-400', dot: 'bg-emerald-400', badge: 'bg-emerald-500 text-white' },
        probable: { ring: 'border-orange-400', dot: 'bg-orange-400', badge: 'bg-orange-500 text-white' },
        pending: { ring: 'border-gray-200', dot: 'bg-gray-400', badge: 'bg-gray-400 text-white' },
        rejected: { ring: 'border-red-400', dot: 'bg-red-400', badge: 'bg-red-500 text-white' },
    };
    const s = statusStyles[person.status] || statusStyles.pending;

    const isAncestor = person.role === 'Ancêtre Fondateur' || person.role === 'Nœud Fondateur';

    return (
        <div className="flex flex-col items-center group relative">
            {/* Petit Point (Nœud) - Taille ultra réduite pour look Graphe */}
            <button
                type="button"
                onClick={() => onSelectNode?.(person)}
                className={`
                    relative flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full border shadow-sm
                    transition-all duration-300 hover:shadow-lg hover:scale-150 cursor-pointer outline-none focus:ring-2 focus:ring-opacity-50
                    ${person.isDeceased ? 'bg-gray-200 border-gray-400 grayscale' : s.badge.replace('text-white', '')}
                    ${isAncestor && !person.isDeceased ? 'ring-2 ring-amber-300 border-amber-500 bg-amber-500 text-white' : ''}
                    ${person.status === 'pending' ? 'border-gray-100 bg-white' : 'text-white'}
                `}
            >
                {/* Icône Crown uniquement pour les fondateurs pour marquer le point de départ */}
                {isAncestor && (
                    <Crown className={`w-2 h-2 ${person.isDeceased ? 'text-gray-400' : 'text-white'}`} />
                )}

                {/* Badge Mémorial 2010 (Mini point rouge) */}
                {person.isDeceased && person.isVictim2010 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 border border-white rounded-full animate-pulse shadow-sm" title="Victime Mémorial 2010" />
                )}

                {/* Pastille statut - ultra discrète */}
                {person.status !== 'pending' && !isAncestor && !person.isDeceased && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white shadow-sm ${s.dot}`} />
                )}
            </button>

            {/* Infos sous le point (toujours visibles mais petites) ou au hover (Tooltips) */}
            <div className="mt-1.5 flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity max-w-[80px] text-center pointer-events-none">
                <span className={`font-bold text-[9px] sm:text-[10px] leading-tight break-words line-clamp-2 ${person.isDeceased ? 'text-gray-400' : 'text-gray-700'}`}>
                    {person.name}
                </span>
                {isAncestor && (
                    <span className="text-[8px] font-bold text-amber-600">Fondateur</span>
                )}
            </div>

            {/* Popover/Tooltip flottant au hover */}
            <div className="absolute top-10 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 pointer-events-none bg-black/90 backdrop-blur-md text-white text-xs rounded-xl px-3 py-2 shadow-2xl border border-white/10 whitespace-nowrap -translate-y-2 group-hover:translate-y-0">
                <p className="font-bold flex items-center gap-1.5">
                    {person.isDeceased ? <span className="opacity-50">🕯️</span> : <span className="text-emerald-400">●</span>}
                    {person.name}
                </p>
                <p className="text-white/60 text-[10px] mt-0.5">{person.role} {person.quartier ? `• ${person.quartier}` : ''}</p>
                {person.isDeceased && <p className="text-red-400 text-[10px] font-bold mt-1.5 border-t border-white/5 pt-1 uppercase tracking-tighter">{person.isVictim2010 ? 'Mémorial 2010' : 'Défunt'}</p>}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-l border-t border-white/10" />
            </div>

            {/* Connecteur vers parents (ascendants) */}
            {person.parents && person.parents.length > 0 && (
                <div className="flex flex-col items-center mt-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="z-10 w-5 h-5 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-[#FF6600] hover:border-[#FF6600] transition-all shadow-sm mb-1"
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>

                    <div className={`w-px bg-gradient-to-t from-gray-200 to-transparent transition-all ${isExpanded ? 'h-4' : 'h-0'}`} />

                    <div className={`transition-all duration-500 origin-bottom ${isExpanded ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                        <div className="flex gap-4 relative pb-2 items-end">
                            {/* Ligne horizontale reliant les parents */}
                            {person.parents.length > 1 && (
                                <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gray-200 shadow-sm" />
                            )}
                            {person.parents.map((parent) => (
                                <div key={parent.id} className="relative flex flex-col items-center">
                                    <div className="w-px h-3 bg-gray-200 mb-0" />
                                    <TreeNode person={parent} depth={depth + 1} onSelectNode={onSelectNode} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────
// Légende
// ─────────────────────────────────────
const Legend = () => (
    <div className="flex justify-center gap-4 flex-wrap mt-4 mb-4">
        {[
            { color: 'bg-emerald-500', label: 'Certifié CHO' },
            { color: 'bg-orange-500', label: 'Probable' },
            { color: 'bg-gray-400', label: 'En attente' },
            { color: 'bg-red-600', label: 'Mémorial 2010' },
            { color: 'bg-amber-400', label: 'Fondateur' },
        ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                {item.label}
            </div>
        ))}
    </div>
);

// ─────────────────────────────────────
// Types Neo4j
// ─────────────────────────────────────
interface Neo4jNode {
    id: string;
    firstName?: string;
    lastName?: string;
    birthYear?: string;
    status?: string;
    isFounder?: boolean;
    isVictim?: boolean;
    village?: string;
}

// ─────────────────────────────────────
// Composant principal PyramidTree
// ─────────────────────────────────────
export default function PyramidTree() {
    const [treeData, setTreeData] = useState<PersonData | null>(null);
    const [villageMembers, setVillageMembers] = useState<PersonData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [source, setSource] = useState<'neo4j' | 'supabase' | 'empty'>('empty');
    const [selectedPerson, setSelectedPerson] = useState<AncestorModalData | null>(null);
    const supabase = createClient();

    const handleSelectNode = (person: PersonData) => {
        setSelectedPerson({
            id: person.id,
            nom: person.name,
            roleOuLien: person.role,
            periodeOuNaissance: person.birthYear,
            status: person.status,
            quartier: person.quartier,
            village: person.village,
            isDeceased: person.isDeceased,
            isVictim2010: person.isVictim2010,
            isCertified: person.status === 'confirmed',
            type: person.role.includes('Fondateur') ? 'ancetre' : 'other'
        });
    };

    useEffect(() => {
        fetchTree();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTree = async () => {
        setIsLoading(true);
        try {
            // 1. Essayer Neo4j d'abord
            const res = await fetch('/api/tree');
            if (res.ok) {
                const data = await res.json();
                if (data.nodes && data.nodes.length > 0) {
                    const built = buildRecursiveTree(data.nodes, data.links || []);
                    if (built) {
                        setTreeData(built);
                        setSource('neo4j');
                        setIsLoading(false);
                        return;
                    }
                }
            }
        } catch {
            // Neo4j non disponible
        }

        // 2. Fallback Supabase
        try {
            const { data: ancestres } = await supabase
                .from('ancestres')
                .select('id, nom_complet, periode, is_certified')
                .eq('is_certified', true)
                .order('created_at', { ascending: true })
                .limit(3);

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, status, quartier_nom, village_origin')
                .in('status', ['confirmed', 'probable', 'pending'])
                .order('status', { ascending: true })
                .limit(8);

            const members: PersonData[] = [];

            (ancestres || []).forEach(a => {
                members.push({
                    id: a.id,
                    name: a.nom_complet,
                    role: 'Ancêtre Fondateur',
                    birthYear: a.periode ? a.periode.match(/\d{4}/)?.[0] || 'Inconnue' : 'Inconnue',
                    status: 'confirmed',
                    isDeceased: false,
                    village: 'Toa-Zéo',
                });
            });

            (profiles || []).forEach(p => {
                const nom = `${p.first_name || ''} ${p.last_name || ''}`.trim();
                if (!nom) return;
                members.push({
                    id: p.id,
                    name: nom,
                    role: 'Membre Inscrit',
                    birthYear: 'Inconnue',
                    status: p.status || 'pending',
                    isDeceased: false,
                    quartier: p.quartier_nom || undefined,
                    village: p.village_origin || 'Toa-Zéo',
                });
            });

            setVillageMembers(members);
            setSource(members.length > 0 ? 'supabase' : 'empty');
        } catch (err) {
            console.warn('[PyramidTree] Erreur Supabase fallback:', err);
            setSource('empty');
        } finally {
            setIsLoading(false);
        }
    };

    const buildRecursiveTree = (nodes: Neo4jNode[], links: Record<string, string>[]): PersonData | null => {
        if (!nodes || nodes.length === 0) return null;
        const founder = nodes.find(n => n.isFounder) || nodes[0];
        if (!founder) return null;

        const buildNode = (nodeId: string, visited = new Set<string>()): PersonData => {
            if (visited.has(nodeId)) {
                return { id: nodeId, name: '...', role: '', birthYear: '', status: 'pending', isDeceased: false };
            }
            visited.add(nodeId);
            const n = nodes.find(x => x.id === nodeId) as Neo4jNode;
            const parentLinks = links.filter(l => l.target === nodeId);
            const parents = parentLinks.slice(0, 2).map(l => buildNode(l.source, new Set(visited)));

            return {
                id: n.id,
                name: `${n.firstName || ''} ${n.lastName || ''}`.trim() || 'Inconnu',
                role: n.isFounder ? 'Ancêtre Fondateur' : 'Membre',
                birthYear: n.birthYear || 'Inconnue',
                status: n.status === 'Décédée' ? 'confirmed' : (n.status || 'pending'),
                isDeceased: n.status === 'Décédée',
                isVictim2010: n.isVictim || false,
                village: n.village,
                parents: parents.length > 0 ? parents : undefined
            };
        };

        return buildNode(founder.id);
    };

    return (
        <section id="pyramide" className="py-24 bg-white dark:bg-black relative overflow-hidden flex flex-col items-center">
            <div className="container mx-auto px-6 max-w-6xl relative z-10 w-full flex flex-col items-center">
                <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 bg-[#FF6600]/10 border border-[#FF6600]/20 text-[#FF6600] text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase">
                        <TreePine className="w-3.5 h-3.5" /> Graphe Patrimonial
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-3 text-foreground tracking-tight">
                        L&apos;Arbre <span className="text-emerald-600">Inviolable</span>
                    </h2>
                    <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                        Visualisation des liens familiaux certifiés. Chaque point représente une existence validée par le conseil du village.
                    </p>
                </div>

                <Legend />

                <div className="w-full overflow-x-auto pb-12 pt-4 flex justify-center items-start min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center text-gray-400 py-16">
                            <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#FF6600]" />
                            <p className="text-xs font-medium animate-pulse">Dérivation du Graphe…</p>
                        </div>
                    ) : source === 'neo4j' && treeData ? (
                        <div className="min-w-max p-8 border border-gray-100 rounded-[3rem] bg-gray-50/30 flex flex-col-reverse items-center justify-end">
                            <TreeNode person={treeData} onSelectNode={handleSelectNode} />
                        </div>
                    ) : source === 'supabase' && villageMembers.length > 0 ? (
                        <div className="w-full space-y-8">
                            {villageMembers.filter(m => m.role === 'Ancêtre Fondateur').length > 0 && (
                                <div className="flex flex-col items-center">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 mb-6 flex items-center gap-1.5 opacity-80">
                                        <Crown className="w-3.5 h-3.5" /> Ancêtres Fondateurs
                                    </h3>
                                    <div className="flex flex-wrap justify-center gap-6">
                                        {villageMembers.filter(m => m.role === 'Ancêtre Fondateur').map(m => (
                                            <TreeNode key={m.id} person={m} onSelectNode={handleSelectNode} />
                                        ))}
                                    </div>
                                    <div className="w-px h-12 bg-gradient-to-b from-gray-200 to-transparent mt-6" />
                                </div>
                            )}
                            {villageMembers.filter(m => m.role !== 'Ancêtre Fondateur').length > 0 && (
                                <div className="flex flex-col items-center">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-6">Membres Certifiés</h3>
                                    <div className="flex flex-wrap justify-center gap-6">
                                        {villageMembers.filter(m => m.role !== 'Ancêtre Fondateur').map(m => (
                                            <TreeNode key={m.id} person={m} onSelectNode={handleSelectNode} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-[#FF6600]/5 rounded-3xl flex items-center justify-center mb-4 border border-[#FF6600]/10">
                                <TreePine className="w-10 h-10 text-[#FF6600]/30" />
                            </div>
                            <p className="font-semibold text-gray-600 mb-1">L&apos;arbre du village est vide</p>
                            <p className="text-xs text-gray-400 max-w-xs">
                                Les premiers membres inscrits apparaîtront ici.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <AncestorDetailsModal isOpen={!!selectedPerson} onClose={() => setSelectedPerson(null)} person={selectedPerson} />
        </section>
    );
}
