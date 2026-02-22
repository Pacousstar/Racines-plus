"use client";

import React, { useState, useEffect } from 'react';
import { User, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// Types pour notre arbre
type PersonStatus = "Vivante" | "Décédée" | string;
type PersonData = {
    id: string;
    name: string;
    role: string;
    birthYear: string;
    status: PersonStatus;
    isDeceased: boolean;
    isVictim2010?: boolean;
    parents?: PersonData[]; // Remplace children pour l'affichage de l'ascendance
};

// Composant Nœud (Une personne)
const TreeNode = ({ person }: { person: PersonData }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const statusColors = {
        confirmed: "bg-racines-green text-white border-racines-green",
        probable: "bg-orange-500 text-white border-orange-500",
        pending: "bg-gray-400 text-white border-gray-400"
    };

    const statusIcons = {
        confirmed: <CheckCircle className="w-4 h-4 text-white" />,
        probable: <AlertTriangle className="w-4 h-4 text-white" />,
        pending: <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
    };

    return (
        <div className="flex flex-col items-center">
            {/* La Carte de la Personne */}
            <div className={`
        relative flex items-center gap-4 p-4 rounded-2xl border-2 w-72 shadow-lg transition-all
        ${person.isDeceased ? "bg-stone-100 border-gray-300" : "bg-white border-racines-green/20"}
        hover:shadow-xl hover:-translate-y-1 cursor-pointer
      `}>
                {person.isDeceased && (
                    <div className="absolute -top-3 -right-3">
                        {person.isVictim2010 ? (
                            <span className="flex items-center gap-1 bg-red-800 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-md animate-pulse" title="Mémorial Crise 2010-2011">
                                Mémorial 2010
                            </span>
                        ) : (
                            <span className="bg-gray-700 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-md">
                                Défunt
                            </span>
                        )}
                    </div>
                )}

                {/* Photo / Avatar */}
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-inner ${person.isDeceased ? 'bg-gray-300 grayscale' : 'bg-racines-earth/20'}`}>
                    <User className={`w-8 h-8 ${person.isDeceased ? 'text-gray-500' : 'text-racines-earth'}`} />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${statusColors.confirmed}`} title={`Statut : Confirmé`}>
                        {statusIcons.confirmed}
                    </div>
                </div>

                {/* Informations */}
                <div className="flex flex-col flex-1">
                    <h3 className={`font-bold text-lg leading-tight ${person.isDeceased ? 'text-gray-700' : 'text-foreground'}`}>
                        {person.name}
                    </h3>
                    <span className="text-sm font-medium text-racines-earth">{person.role}</span>
                    <span className="text-xs text-gray-500 font-mono mt-1">Né(e) env. {person.birthYear}</span>
                </div>
            </div>

            {/* Ligne de connexion et Parents (ascendance) */}
            {person.parents && person.parents.length > 0 && (
                <div className="flex flex-col items-center mt-2 flex-col-reverse"> {/* Reverse pour monter vers les ancêtres */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="z-10 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-racines-green hover:border-racines-green transition-colors shadow-sm mb-2"
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>

                    <div className={`w-px bg-gray-300 transition-all duration-300 ${isExpanded ? 'h-6' : 'h-0'}`}></div>

                    <div className={`transition-all duration-500 origin-bottom ${isExpanded ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 overflow-hidden'}`}>
                        <div className="flex gap-8 relative pb-4 items-end">
                            {person.parents.length > 1 && (
                                <div className="absolute bottom-0 left-[25%] right-[25%] h-px bg-gray-300"></div>
                            )}

                            {person.parents.map((parent) => (
                                <div key={parent.id} className="relative flex flex-col items-center flex-col-reverse">
                                    <div className="absolute bottom-0 w-px h-4 bg-gray-300 -mb-4"></div>
                                    <TreeNode person={parent} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function PyramidTree() {
    const [treeData, setTreeData] = useState<PersonData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTree();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTree = async () => {
        try {
            const res = await fetch('/api/tree');
            if (res.ok) {
                const data = await res.json();
                const builtTree = buildRecursiveTree(data.nodes, data.links);
                setTreeData(builtTree);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    interface Neo4jNode {
        id: string;
        firstName?: string;
        lastName?: string;
        birthYear?: string;
        status?: string;
        isFounder?: boolean;
        isVictim?: boolean;
    }

    // Construire l'arbre récursif centré sur le Fondateur
    const buildRecursiveTree = (nodes: Neo4jNode[], links: Record<string, string>[]): PersonData | null => {
        if (!nodes || nodes.length === 0) return null;

        const founder = nodes.find(n => n.isFounder);
        if (!founder) return null;

        const buildNode = (nodeId: string): PersonData => {
            const n = nodes.find(x => x.id === nodeId) as Neo4jNode;

            // Trouver les parents (ceux qui ont une relation pointant VERS cet enfant)
            const parentLinks = links.filter(l => l.target === nodeId);
            const par = parentLinks.map(l => buildNode(l.source));

            return {
                id: n.id,
                name: `${n.firstName || ''} ${n.lastName || ''}`.trim(),
                role: n.isFounder ? "Nœud Fondateur" : "Ancêtre",
                birthYear: n.birthYear || 'Inconnue',
                status: n.isFounder ? 'confirmed' : 'pending',
                isDeceased: n.status === 'Décédée',
                isVictim2010: n.isVictim || false,
                parents: par.length > 0 ? par : undefined
            };
        };

        return buildNode(founder.id);
    };

    return (
        <section id="pyramide" className="py-24 bg-white dark:bg-black relative overflow-hidden flex flex-col items-center">
            <div className="container mx-auto px-6 max-w-6xl relative z-10 w-full flex flex-col items-center">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
                        L&apos;Arbre <span className="text-racines-green">Inviolable</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Visualisation pyramidale africaine. Les liens familiaux sont analysés et certifiés.
                    </p>

                    <div className="flex justify-center gap-6 mt-8 flex-wrap">
                        <div className="flex items-center gap-2 text-sm font-medium"><div className="w-3 h-3 rounded-full bg-racines-green"></div> Confirmé (CHO)</div>
                        <div className="flex items-center gap-2 text-sm font-medium"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Probable</div>
                        <div className="flex items-center gap-2 text-sm font-medium"><div className="w-3 h-3 rounded-full bg-gray-400"></div> En attente</div>
                        <div className="flex items-center gap-2 text-sm font-medium"><div className="w-3 h-3 rounded-full bg-red-800 animate-pulse"></div> Victime 2010</div>
                    </div>
                </div>

                <div className="w-full overflow-x-auto pb-12 pt-4 hide-scrollbar cursor-grab active:cursor-grabbing flex justify-center items-end min-h-[500px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="w-12 h-12 animate-spin mb-4 text-racines-green" />
                            <p className="font-medium animate-pulse">Dérivation du Graphe...</p>
                        </div>
                    ) : treeData ? (
                        <div className="min-w-max p-8 border border-gray-100 dark:border-gray-800 rounded-3xl bg-gray-50/50 dark:bg-white/5 shadow-inner flex flex-col-reverse items-center justify-end">
                            <TreeNode person={treeData} />
                        </div>
                    ) : (
                        <p className="text-gray-500">Aucun graphe trouvé. Ajoutez un membre !</p>
                    )}
                </div>
            </div>
        </section>
    );
}
