"use client";

import React, { useState, useEffect } from 'react';
import { User, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Loader2, TreePine, Crown } from 'lucide-react';
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
// Composant Nœud individuel
// ─────────────────────────────────────
const TreeNode = ({ person, depth = 0, onSelectNode }: { person: PersonData; depth?: number; onSelectNode?: (person: PersonData) => void }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2);

    const statusStyles: Record<string, { ring: string; dot: string; badge: string }> = {
        confirmed: { ring: 'border-emerald-400', dot: 'bg-emerald-400', badge: 'bg-emerald-500 text-white' },
        probable: { ring: 'border-orange-400', dot: 'bg-orange-400', badge: 'bg-orange-500 text-white' },
        pending: { ring: 'border-gray-300', dot: 'bg-gray-400', badge: 'bg-gray-400 text-white' },
        rejected: { ring: 'border-red-400', dot: 'bg-red-400', badge: 'bg-red-500 text-white' },
    };
    const s = statusStyles[person.status] || statusStyles.pending;

    const statusIcons: Record<string, React.ReactNode> = {
        confirmed: <CheckCircle className="w-3 h-3" />,
        probable: <AlertTriangle className="w-3 h-3" />,
        pending: <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />,
    };

    const isAncestor = person.role === 'Ancêtre Fondateur' || person.role === 'Nœud Fondateur';

    return (
        <div className="flex flex-col items-center group relative">
            {/* Petit Point (Nœud) */}
            <button
                type="button"
                onClick={() => onSelectNode?.(person)}
                className={`
                    relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 shadow-sm
                    transition-all duration-300 hover:shadow-lg hover:scale-110 cursor-pointer outline-none focus:ring-4 focus:ring-opacity-50
                    ${person.isDeceased ? 'bg-gray-100 border-gray-300 grayscale' : s.badge.replace('text-white', '')}
                    ${isAncestor && !person.isDeceased ? 'ring-4 ring-amber-200 border-amber-500 bg-amber-500 text-white' : ''}
                    ${person.status === 'pending' ? 'border-gray-300 bg-white text-gray-400' : 'text-white'}
                `}
            >
                {/* Icône à l'intérieur du point */}
                {isAncestor
                    ? <Crown className={`w-5 h-5 ${person.isDeceased ? 'text-gray-400' : 'text-white'}`} />
                    : <User className={`w-5 h-5 ${person.isDeceased ? 'text-gray-400' : person.status === 'pending' ? 'text-gray-400' : 'text-white'}`} />
                }

                {/* Badge Mémorial 2010 (Petit point rouge) */}
                {person.isDeceased && person.isVictim2010 && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 border-2 border-white rounded-full animate-pulse shadow-sm" title="Victime Mémorial 2010" />
                )}

                {/* Pastille statut */}
                {person.status !== 'pending' && !isAncestor && !person.isDeceased && (
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${s.dot}`} />
                )}
            </button>

            {/* Infos sous le point (toujours visibles mais petites) ou au hover (Tooltips) */}
            <div className="mt-2 flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity max-w-[80px] sm:max-w-[100px] text-center">
                <span className={`font-bold text-[10px] sm:text-[11px] leading-tight break-words line-clamp-2 ${person.isDeceased ? 'text-gray-500' : 'text-gray-800'}`}>
                    {person.name}
                </span>
                {isAncestor && (
                    <span className="text-[9px] font-bold text-amber-600 mt-0.5">Fondateur</span>
                )}
            </div>

            {/* Popover/Tooltip flottant au hover pour écrans larges */}
            <div className="absolute top-14 sm:top-16 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 pointer-events-none bg-black/80 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10 whitespace-nowrap">
                <p className="font-bold">{person.name}</p>
                <p className="text-white/70 text-[10px]">{person.role} {person.quartier ? `• ${person.quartier}` : ''}</p>
                {person.isDeceased && <p className="text-red-300 text-[10px] font-bold mt-1 uppercase">{person.isVictim2010 ? 'Mémorial 2010' : 'Défunt'}</p>}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45 border-l border-t border-white/10" />
            </div>

            {/* Connecteur vers parents (ascendants) */}
            {person.parents && person.parents.length > 0 && (
                <div className="flex flex-col items-center mt-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-[#FF6600] hover:border-[#FF6600] transition-all shadow-sm hover:shadow-md mb-1"
                    >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>

                    <div className={`w-px bg-gradient-to-t from-gray-200 to-transparent transition-all ${isExpanded ? 'h-5' : 'h-0'}`} />

                    <div className={`transition-all duration-500 origin-bottom ${isExpanded ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                        <div className="flex gap-6 relative pb-3 items-end">
                            {/* Ligne horizontale reliant les parents */}
                            {person.parents.length > 1 && (
                                <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gray-200" />
                            )}
                            {person.parents.map((parent) => (
                                <div key={parent.id} className="relative flex flex-col items-center">
                                    <div className="w-px h-4 bg-gray-200 mb-0" />
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
    <div className="flex justify-center gap-4 flex-wrap mt-6 mb-10">
        {[
            { color: 'bg-emerald-500', label: 'Confirmé (CHO)' },
            { color: 'bg-orange-500', label: 'Probable' },
            { color: 'bg-gray-400', label: 'En attente' },
            { color: 'bg-red-800', label: 'Victime 2010', pulse: true },
            { color: 'bg-amber-400', label: 'Fondateur' },
        ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color} ${item.pulse ? 'animate-pulse' : ''}`} />
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
            // Neo4j non disponible → fallback Supabase
        }

        // 2. Fallback Supabase : charger les profils + ancêtres du village pilote
        try {
            // Charger les ancêtres certifiés
            const { data: ancestres } = await supabase
                .from('ancestres')
                .select('id, nom_complet, periode, is_certified')
                .eq('is_certified', true)
                .order('created_at', { ascending: true })
                .limit(3);

            // Charger les membres du village (confirmés en priorité)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, status, quartier_nom, village_origin')
                .in('status', ['confirmed', 'probable', 'pending'])
                .order('status', { ascending: true })
                .limit(8);

            const members: PersonData[] = [];

            // Ajouter les ancêtres fondateurs en tête
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

            // Ajouter les membres
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

    // Construire l'arbre récursif depuis les données Neo4j
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
                {/* Titre */}
                <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 bg-[#FF6600]/10 border border-[#FF6600]/20 text-[#FF6600] text-xs font-bold px-3 py-1 rounded-full mb-4">
                        <TreePine className="w-3.5 h-3.5" /> Arbre du Village
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-3 text-foreground">
                        L&apos;Arbre <span className="text-emerald-600">Inviolable</span>
                    </h2>
                    <p className="text-base text-gray-500 max-w-2xl mx-auto">
                        Visualisation pyramidale africaine. Les liens familiaux sont analysés et certifiés par le CHO.
                    </p>
                    {source === 'neo4j' && (
                        <div className="inline-flex items-center gap-1.5 mt-3 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Données live Neo4j Aura
                        </div>
                    )}
                    {source === 'supabase' && (
                        <div className="inline-flex items-center gap-1.5 mt-3 text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Membres du village pilote — Toa-Zéo
                        </div>
                    )}
                </div>

                <Legend />

                {/* Contenu principal */}
                <div className="w-full overflow-x-auto pb-12 pt-4 flex justify-center items-start min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center text-gray-400 py-16">
                            <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#FF6600]" />
                            <p className="text-sm font-medium animate-pulse">Dérivation du Graphe…</p>
                        </div>
                    ) : source === 'neo4j' && treeData ? (
                        /* Mode Neo4j — arbre récursif */
                        <div className="min-w-max p-8 border border-gray-100 rounded-3xl bg-gray-50/50 shadow-inner flex flex-col-reverse items-center justify-end">
                            <TreeNode person={treeData} onSelectNode={handleSelectNode} />
                        </div>
                    ) : source === 'supabase' && villageMembers.length > 0 ? (
                        /* Mode Supabase fallback — grille de membres */
                        <div className="w-full space-y-8">
                            {/* Ancêtres fondateurs */}
                            {villageMembers.filter(m => m.role === 'Ancêtre Fondateur').length > 0 && (
                                <div className="flex flex-col items-center">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-1.5">
                                        <Crown className="w-3.5 h-3.5" /> Ancêtres Fondateurs
                                    </h3>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {villageMembers.filter(m => m.role === 'Ancêtre Fondateur').map(m => (
                                            <TreeNode key={m.id} person={m} onSelectNode={handleSelectNode} />
                                        ))}
                                    </div>
                                    <div className="w-px h-10 bg-gray-200 mt-4" />
                                </div>
                            )}
                            {/* Membres */}
                            {villageMembers.filter(m => m.role !== 'Ancêtre Fondateur').length > 0 && (
                                <div className="flex flex-col items-center">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Membres Inscrits</h3>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {villageMembers.filter(m => m.role !== 'Ancêtre Fondateur').map(m => (
                                            <TreeNode key={m.id} person={m} onSelectNode={handleSelectNode} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Vide */
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-[#FF6600]/5 rounded-3xl flex items-center justify-center mb-4 border border-[#FF6600]/10">
                                <TreePine className="w-10 h-10 text-[#FF6600]/40" />
                            </div>
                            <p className="font-semibold text-gray-600 mb-1">L&apos;arbre du village est vide</p>
                            <p className="text-sm text-gray-400 max-w-xs">
                                Les premiers membres inscrits et validés par le CHO apparaîtront ici.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <AncestorDetailsModal isOpen={!!selectedPerson} onClose={() => setSelectedPerson(null)} person={selectedPerson} />
        </section>
    );
}
