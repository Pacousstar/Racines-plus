"use client";

import React, { useState, useEffect } from 'react';
import { TreePine, Crown, Clock, Heart, GitBranch, FileText, Image as ImageIcon, BookOpen, ChevronRight, Download, Shield, Flower2, Sparkles } from 'lucide-react';

import { createClient } from '@/lib/supabase';
import AncestorDetailsModal, { AncestorModalData } from './AncestorDetailsModal';
import ExportTreeModal from './ExportTreeModal';

interface LineageNode {
    id: string;
    nom: string;
    type: 'ancetre' | 'self' | 'parent' | 'child';
    generation: number;
    lien?: string;
    confidence?: number;
    is_certified?: boolean;
    periode?: string;
    status?: string;
    avatarUrl?: string | null;
    quartier?: string;
    side?: 'paternal' | 'maternal' | 'central';
}

interface PersonalLineageTreeProps {
    userId: string;
    villageNom?: string;
}

// ─────────────────────────────────────────────────────────────
// Nœud circulaire individuel — style Arbre Héritage Traditionnel
// ─────────────────────────────────────────────────────────────
function HeritageNode({
    node,
    isCurrentUser,
    onSelect,
}: {
    node: LineageNode;
    isCurrentUser: boolean;
    onSelect: (node: LineageNode) => void;
}) {
    const isAncetre = node.type === 'ancetre';
    const isPatriarch = isAncetre;

    const sideThemes = {
        paternal: {
            ring: 'ring-4 ring-blue-700 ring-offset-2',
            bg: 'bg-gradient-to-br from-blue-600 to-blue-800',
            icon: Shield,
            text: 'text-blue-700',
            label: 'text-blue-500'
        },
        maternal: {
            ring: 'ring-4 ring-[#C05C3C] ring-offset-2',
            bg: 'bg-gradient-to-br from-[#C05C3C] to-[#8E3F26]',
            icon: Flower2,
            text: 'text-[#C05C3C]',
            label: 'text-[#C05C3C]'
        },
        central: {
            ring: 'ring-4 ring-[#124E35] ring-offset-2',
            bg: 'bg-gradient-to-br from-[#124E35] to-[#0c3624]',
            icon: Sparkles,
            text: 'text-[#124E35]',
            label: 'text-[#FF6600]'
        }
    };

    const currentTheme = node.side ? sideThemes[node.side] : (isPatriarch ? sideThemes.central : node.type === 'parent' ? sideThemes.paternal : sideThemes.central);

    const ringColor = isPatriarch
        ? sideThemes.central.ring
        : node.status === 'confirmed'
            ? currentTheme.ring
            : node.status === 'probable'
                ? 'ring-4 ring-[#FF6600] ring-offset-2'
                : 'ring-2 ring-gray-300 ring-offset-1';

    const avatarBg = isPatriarch
        ? sideThemes.central.bg
        : currentTheme.bg;

    return (
        <button
            onClick={() => onSelect(node)}
            className="flex flex-col items-center gap-2 group focus:outline-none"
        >
            {/* Cercle avatar */}
            <div className="relative">
                {/* Halo animé pour le patriarch */}
                {isPatriarch && (
                    <div className="absolute inset-0 rounded-full bg-[#124E35]/20 animate-ping scale-125 pointer-events-none" />
                )}

                <div
                    className={`
                        relative rounded-full overflow-hidden flex items-center justify-center
                        border-3 border-white shadow-xl group-hover:scale-110 transition-all duration-300
                        ${isPatriarch ? 'w-20 h-20' : isCurrentUser ? 'w-16 h-16' : 'w-14 h-14'}
                        ${ringColor} ${avatarBg}
                    `}
                >
                    {node.avatarUrl ? (
                        <img src={node.avatarUrl} alt={node.nom} className="w-full h-full object-cover" />
                    ) : isPatriarch ? (
                        <Crown className="w-8 h-8 text-amber-300" />
                    ) : (
                        <div className="flex flex-col items-center">
                             {node.side && <currentTheme.icon className="w-3.5 h-3.5 text-white/40 mb-1" />}
                             <span className="text-white font-black text-lg leading-none">{initials}</span>
                        </div>
                    )}
                </div>

                {/* Badge statut */}
                <div className={`
                    absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full border-2 border-white shadow-md text-[9px]
                    ${isPatriarch ? 'bg-amber-400' : node.status === 'confirmed' ? 'bg-[#124E35]' : node.status === 'probable' ? 'bg-[#FF6600]' : 'bg-gray-400'}
                `}>
                    {isPatriarch ? '👑' : node.status === 'confirmed' ? '✓' : '○'}
                </div>
            </div>

            {/* Nom + rôle */}
            <div className="text-center max-w-[120px]">
                <p className={`font-black leading-tight truncate ${isPatriarch ? 'text-sm text-[#1c2b23]' : 'text-xs text-gray-800'}`}>
                    {node.nom}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-tight truncate ${isPatriarch ? 'text-amber-600' :
                    isCurrentUser ? 'text-[#FF6600]' :
                         currentTheme.label
                    }`}>
                    {isPatriarch ? 'Ancêtre Fondateur' :
                        isCurrentUser ? 'Vous' :
                            node.lien || node.type === 'parent' ? (node.lien || 'Parent') : 'Membre'}
                </p>
                {node.quartier && (
                    <p className="text-[9px] text-stone-400 font-medium mt-0.5 italic truncate">{node.quartier}</p>
                )}
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────
export default function PersonalLineageTree({ userId, villageNom = 'Toa-Zéo' }: PersonalLineageTreeProps) {
    const supabase = createClient();
    const [lineage, setLineage] = useState<LineageNode[]>([]);
    const [ancetre, setAncetre] = useState<LineageNode | null>(null);
    const [parents, setParents] = useState<LineageNode[]>([]);
    const [currentUser, setCurrentUser] = useState<LineageNode | null>(null);
    const [children, setChildren] = useState<LineageNode[]>([]);
    const [spouses, setSpouses] = useState<LineageNode[]>([]);
    const [siblings, setSiblings] = useState<LineageNode[]>([]);
    const [extended, setExtended] = useState<LineageNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [aiPosition, setAiPosition] = useState<{ generation: number; lien_probable: string; confidence: number } | null>(null);
    const [selectedNode, setSelectedNode] = useState<AncestorModalData | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [userRole, setUserRole] = useState('user');
    const [stats, setStats] = useState({ members: 0, generations: 0 });

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                // 1. Profil utilisateur courant
                const { data: profil } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, status, ancestral_root_id, avatar_url, quartier_nom, role, village_origin')
                    .eq('id', userId)
                    .single();

                if (!profil) { setIsLoading(false); return; }
                setUserRole(profil.role || 'user');

                // 2. Ancêtre fondateur certifié CHO
                let ancestreNode: LineageNode | null = null;
                if (profil.ancestral_root_id) {
                    // L'utilisateur a choisi son ancêtre fondateur
                    const { data: a } = await supabase
                        .from('ancestres')
                        .select('id, nom_complet, periode, is_certified')
                        .eq('id', profil.ancestral_root_id)
                        .single();

                    if (a) {
                        ancestreNode = {
                            id: a.id,
                            nom: a.nom_complet,
                            type: 'ancetre',
                            generation: 0,
                            is_certified: a.is_certified,
                            periode: a.periode,
                            status: 'confirmed',
                        };
                    }
                } else {
                    // Chercher l'ancêtre certifié du VILLAGE de l'utilisateur (pas n'importe quel ancêtre)
                    const { data: a } = await supabase
                        .from('ancestres')
                        .select('id, nom_complet, periode, is_certified')
                        .eq('is_certified', true)
                        .order('created_at', { ascending: true })
                        .limit(1)
                        .single();

                    if (a) {
                        ancestreNode = {
                            id: a.id,
                            nom: a.nom_complet,
                            type: 'ancetre',
                            generation: 0,
                            is_certified: a.is_certified,
                            periode: a.periode,
                            status: 'confirmed',
                        };
                    }
                }
                setAncetre(ancestreNode);

                // 3. Nœud utilisateur courant
                const selfNode: LineageNode = {
                    id: userId,
                    nom: `${profil.first_name || ''} ${profil.last_name || ''}`.trim() || 'Vous',
                    type: 'self',
                    generation: 2,
                    status: profil.status || 'pending',
                    avatarUrl: profil.avatar_url,
                    quartier: profil.quartier_nom,
                };
                setCurrentUser(selfNode);

                // 4. Famille via Neo4j
                let parentNodes: LineageNode[] = [];
                let childNodes: LineageNode[] = [];
                let spouseNodes: LineageNode[] = [];
                let siblingNodes: LineageNode[] = [];
                let extendNodes: LineageNode[] = [];

                try {
                    const res = await fetch('/api/tree');
                    if (res.ok) {
                        const treeData = await res.json();
                        
                        // Récupérer les avatars depuis Supabase pour TOUS les nœuds présents dans Neo4j
                        const allNodeIds = treeData.nodes.map((n: any) => n.id);
                        let profileMap: Record<string, any> = {};
                        if (allNodeIds.length > 0) {
                            const { data: profiles } = await supabase
                                .from('profiles')
                                .select('id, avatar_url, quartier_nom, role, is_founder')
                                .in('id', allNodeIds);
                            if (profiles) {
                                profiles.forEach(p => profileMap[p.id] = p);
                            }
                        }

                        // Helper pour créer un LineageNode à partir de Neo4j + Supabase
                        const createNode = (neoNode: any, type: LineageNode['type'], generation: number, lien: string, side?: LineageNode['side']): LineageNode | null => {
                            if (!neoNode) return null;
                            const p = profileMap[neoNode.id];
                            return {
                                id: neoNode.id,
                                nom: `${neoNode.firstName || ''} ${neoNode.lastName || ''}`.trim() || 'Inconnu',
                                type,
                                generation,
                                status: neoNode.status === 'Vivant' ? 'confirmed' : neoNode.status === 'Décédé' ? 'probable' : 'pending',
                                avatarUrl: p?.avatar_url || null,
                                quartier: p?.quartier_nom || null,
                                lien,
                                side
                            };
                        };

                        const processedTargetIds = new Set<string>();
                        
                        // 1. Identifier d'abord les IDs du père et de la mère pour la propagation
                        const parentsInfo = {
                            fatherId: treeData.links.find((l: any) => l.target === userId && l.type === 'FATHER_OF')?.source,
                            motherId: treeData.links.find((l: any) => l.target === userId && l.type === 'MOTHER_OF')?.source
                        };

                        treeData.links.forEach((link: any) => {
                            let targetId: string | null = null;
                            let relNode: any = null;
                            let nodeType: LineageNode['type'] = 'other' as any;
                            let generation = 2;
                            let lienStr = '';

                            if (link.target === userId && (link.type === 'FATHER_OF' || link.type === 'MOTHER_OF')) {
                                targetId = link.source;
                                relNode = treeData.nodes.find((n: any) => n.id === targetId);
                                nodeType = 'parent'; generation = 1; lienStr = link.type === 'FATHER_OF' ? 'Père' : 'Mère';
                            } else if (link.source === userId && link.type === 'PARENT_OF') {
                                targetId = link.target;
                                relNode = treeData.nodes.find((n: any) => n.id === targetId);
                                nodeType = 'child'; generation = 3; lienStr = 'Enfant';
                            } else if (link.target === userId && link.type === 'PARENT_OF') {
                                targetId = link.source;
                                relNode = treeData.nodes.find((n: any) => n.id === targetId);
                                nodeType = 'parent'; generation = 1; lienStr = 'Parent';
                            } else if (link.source === userId && link.type === 'SPOUSE_OF') {
                                targetId = link.target;
                                relNode = treeData.nodes.find((n: any) => n.id === targetId);
                                nodeType = 'parent'; generation = 2; lienStr = 'Conjoint(e)';
                            } else if (link.source === userId && (link.type === 'SIBLING_OF' || link.type === 'HALF_SIBLING_OF')) {
                                targetId = link.target;
                                relNode = treeData.nodes.find((n: any) => n.id === targetId);
                                nodeType = 'other' as any; generation = 2; lienStr = link.type === 'SIBLING_OF' ? 'Frère/Sœur' : 'Demi-frère/sœur';
                            } else if (link.target === userId && link.type === 'UNCLE_AUNT_OF') {
                                targetId = link.source;
                                relNode = treeData.nodes.find((n: any) => n.id === targetId);
                                nodeType = 'other' as any; generation = 1; lienStr = 'Oncle/Tante';
                            } else if (link.source === userId && link.type === 'UNCLE_AUNT_OF') {
                                targetId = link.target;
                                relNode = treeData.nodes.find((n: any) => n.id === targetId);
                                nodeType = 'other' as any; generation = 3; lienStr = 'Neveu/Nièce';
                            } else if (link.source === userId && link.type === 'COUSIN_OF') {
                                targetId = link.target;
                                relNode = treeData.nodes.find((n: any) => n.id === targetId);
                                nodeType = 'other' as any; generation = 2; lienStr = 'Cousin(e)';
                            }

                            if (targetId && relNode && !processedTargetIds.has(targetId) && targetId !== userId) {
                                processedTargetIds.add(targetId);
                                
                                // Déterminer le côté (Side) par propagation
                                let side: LineageNode['side'] = 'central';
                                
                                // Analyse de la parenté pour la famille élargie
                                const isConnectedToFather = treeData.links.some((l: any) => 
                                    (l.source === parentsInfo.fatherId && l.target === targetId) || 
                                    (l.target === parentsInfo.fatherId && l.source === targetId)
                                );
                                const isConnectedToMother = treeData.links.some((l: any) => 
                                    (l.source === parentsInfo.motherId && l.target === targetId) || 
                                    (l.target === parentsInfo.motherId && l.source === targetId)
                                );

                                if (targetId === parentsInfo.fatherId || isConnectedToFather) side = 'paternal';
                                else if (targetId === parentsInfo.motherId || isConnectedToMother) side = 'maternal';
                                else if (lienStr === 'Enfant') side = 'central';

                                const builtNode = createNode(relNode, nodeType, generation, lienStr, side);
                                if (builtNode) {
                                    if (lienStr === 'Père' || lienStr === 'Mère' || lienStr === 'Parent') parentNodes.push(builtNode);
                                    else if (lienStr === 'Enfant') childNodes.push(builtNode);
                                    else if (lienStr === 'Conjoint(e)') spouseNodes.push(builtNode);
                                    else if (lienStr.includes('Frère') || lienStr.includes('Sœur')) siblingNodes.push(builtNode);
                                    else extendNodes.push(builtNode);
                                }
                            }
                        });
                    }
                } catch { /* Neo4j non disponible */ }

                // FALLBACK : Si pas de parents trouvés dans le graphe, on regarde dans les metadata du profil
                if (parentNodes.length === 0 && profil?.metadata) {
                    const meta = profil.metadata;
                    if (meta.father_first_name || meta.father_last_name) {
                        parentNodes.push({ id: 'father-meta', nom: `${meta.father_first_name || ''} ${meta.father_last_name || ''}`.trim(), type: 'parent', generation: 1, status: 'declared', lien: 'Père', quartier: 'Déclaratif', side: 'paternal' });
                    }
                    if (meta.mother_first_name || meta.mother_last_name) {
                        parentNodes.push({ id: 'mother-meta', nom: `${meta.mother_first_name || ''} ${meta.mother_last_name || ''}`.trim(), type: 'parent', generation: 1, status: 'declared', lien: 'Mère', quartier: 'Déclaratif', side: 'maternal' });
                    }
                }

                setParents(parentNodes);
                setChildren(childNodes);
                setSpouses(spouseNodes);
                setSiblings(siblingNodes);
                setExtended(extendNodes);

                // 5. Stats globales du village
                const { count: memberCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['confirmed', 'probable']);
                setStats({ members: memberCount || 0, generations: ancestreNode ? 3 : 1 });

                // 6. Position IA
                const { data: val } = await supabase
                    .from('validations')
                    .select('observations')
                    .eq('profile_id', userId)
                    .eq('role_validateur', 'system')
                    .order('created_at', { ascending: false })
                    .limit(1).maybeSingle();

                if (val?.observations) {
                    const gm = val.observations.match(/Génération\s+(\d+)/);
                    const cm = val.observations.match(/Confiance\s+(\d+)/);
                    const lm = val.observations.match(/—\s+([^—]+)$/);
                    if (gm && cm) {
                        setAiPosition({ generation: parseInt(gm[1]), confidence: parseInt(cm[1]), lien_probable: lm?.[1]?.trim() || 'Descendant de' });
                    }
                }

                setLineage([...(ancestreNode ? [ancestreNode] : []), ...parentNodes, selfNode, ...childNodes]);
            } catch (err) {
                console.warn('[PersonalLineageTree] Erreur:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) load();
    }, [userId]);

    const handleSelect = (node: LineageNode) => {
        setSelectedNode({
            id: node.id,
            nom: node.nom,
            roleOuLien: node.type === 'ancetre' ? 'Ancêtre Fondateur' : node.lien || (node.id === userId ? 'Vous' : 'Membre'),
            periodeOuNaissance: node.periode,
            status: node.status || 'pending',
            isCertified: node.is_certified,
            type: node.type === 'ancetre' ? 'ancetre' : 'other',
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-12 h-12 border-3 border-[#FF6600] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-[#FF6600] animate-pulse">Dérivation de votre lignée…</p>
            </div>
        );
    }

    if (!currentUser && lineage.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#124E35]/10 to-amber-50 rounded-3xl flex items-center justify-center mb-5 border border-amber-200/50">
                    <TreePine className="w-10 h-10 text-[#124E35]" />
                </div>
                <h3 className="font-black text-gray-900 mb-2">Votre arbre est vide</h3>
                <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                    Choisissez votre ancêtre fondateur pour que l'IA Racines+ positionne votre lignée dans l'arbre de <strong>{villageNom}</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden">
            {/* ── Fond parcheminé avec motifs africains ── */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#fcf8f0] via-[#fef9f2] to-[#f8f2e8] pointer-events-none" />
            {/* Motifs décoratifs latéraux (kente) */}
            <div className="absolute left-0 top-0 bottom-0 w-8 opacity-10 pointer-events-none"
                style={{ background: 'repeating-linear-gradient(45deg, #124E35 0px, #124E35 2px, transparent 2px, transparent 12px, #C05C3C 12px, #C05C3C 14px, transparent 14px, transparent 24px)' }}
            />
            <div className="absolute right-0 top-0 bottom-0 w-8 opacity-10 pointer-events-none"
                style={{ background: 'repeating-linear-gradient(-45deg, #124E35 0px, #124E35 2px, transparent 2px, transparent 12px, #C05C3C 12px, #C05C3C 14px, transparent 14px, transparent 24px)' }}
            />

            {/* ── En-tête style Family Tree ── */}
            <div className="relative z-10 flex items-center justify-between px-4 pt-5 pb-3 border-b border-amber-200/50">
                <div>
                    <h3 className="font-black text-base text-[#1c2b23] flex items-center gap-2">
                        <TreePine className="w-4 h-4 text-[#124E35]" />
                        Arbre Héritage Traditionnel
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">Village de {villageNom}</p>
                </div>
                <div className="flex items-center gap-2">
                    {aiPosition && (
                        <div className="flex items-center gap-1 text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-full font-black">
                            🤖 {aiPosition.confidence}%
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-[10px] bg-[#124E35]/10 border border-[#124E35]/20 text-[#124E35] px-2 py-1 rounded-full font-black">
                        ✅ CHO Certifié
                    </div>
                    {lineage && (
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex items-center gap-1.5 text-xs font-bold bg-[#124E35] text-white px-3 py-1.5 rounded-full shadow-md hover:bg-[#0c3624] transition-colors ml-2"
                        >
                            <Download className="w-4 h-4" />
                            Exporter
                        </button>
                    )}
                </div>
            </div>

            {/* Légende des Branches */}
            <div className="relative z-10 px-6 py-2 flex justify-center gap-6 border-b border-amber-100 bg-amber-50/30">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm" />
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Branche Paternelle</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#C05C3C] shadow-sm" />
                    <span className="text-[10px] font-black text-[#8E3F26] uppercase tracking-widest">Branche Maternelle</span>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* ARBRE GÉNÉALOGIQUE VISUEL — Style Heritage */}
            {/* ═══════════════════════════════════════════════ */}
            <div className="relative z-10 flex flex-col items-center px-4 py-8" style={{ minHeight: '480px' }}>

                {/* SVG des branches organiques */}
                <svg
                    className="absolute inset-0 w-full pointer-events-none"
                    style={{ height: '100%', zIndex: 0 }}
                    viewBox="0 0 400 500"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Tronc principal (ancêtre → parents niveau 1) */}
                    <path
                        d="M 200 80 C 200 110, 200 120, 200 160"
                        fill="none" stroke="#2d5a3d" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"
                    />
                    {/* Branche vers parent gauche (Père - Bleu) */}
                    {parents.some(p => p.side === 'paternal' || p.lien === 'Père') && (
                        <path
                            d={parents.length > 1
                                ? "M 200 160 C 200 175, 120 185, 120 210"
                                : "M 200 160 C 200 175, 200 195, 200 220"}
                            fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"
                        />
                    )}
                    {/* Branche vers parent droit (Mère - Rouge) */}
                    {parents.some(p => p.side === 'maternal' || p.lien === 'Mère') && (
                        <path
                            d="M 200 160 C 200 175, 280 185, 280 210"
                            fill="none" stroke="#C05C3C" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"
                        />
                    )}
                    {/* Branche vers utilisateur (du bas des parents) */}
                    <path
                        d="M 200 260 C 200 285, 200 295, 200 330"
                        fill="none" stroke="#C05C3C" strokeWidth="2" strokeLinecap="round" opacity="0.3"
                        strokeDasharray="4 3"
                    />
                    {/* Branches vers enfants */}
                    {children.length > 0 && (
                        <path
                            d={children.length > 1
                                ? "M 200 390 C 200 410, 120 420, 120 445"
                                : "M 200 390 C 200 410, 200 425, 200 445"}
                            fill="none" stroke="#C05C3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"
                            strokeDasharray="3 3"
                        />
                    )}
                    {children.length > 1 && (
                        <path
                            d="M 200 390 C 200 410, 280 420, 280 445"
                            fill="none" stroke="#C05C3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"
                            strokeDasharray="3 3"
                        />
                    )}
                </svg>

                {/* ── Niveau 0 : ANCÊTRE FONDATEUR (PATRIARCH) ── */}
                {ancetre && (
                    <div className="relative z-10 mb-6">
                        <div className="bg-white/70 backdrop-blur-sm border border-amber-200 rounded-2xl px-4 py-1.5 text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 text-center shadow-sm">
                            <Crown className="w-3 h-3 inline mr-1" />PATRIARCH
                        </div>
                        <div className="flex justify-center">
                            <HeritageNode node={ancetre} isCurrentUser={false} onSelect={handleSelect} />
                        </div>
                    </div>
                )}

                {/* ── Niveau 1 : PARENTS ── */}
                {parents.length > 0 ? (
                    <div className="relative z-10 mb-6">
                        <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest text-center mb-3">
                            Génération N-1 · Parents
                        </div>
                        <div className={`flex justify-center ${parents.length > 1 ? 'gap-12' : ''}`}>
                            {parents.map((p) => (
                                <HeritageNode key={p.id} node={p} isCurrentUser={false} onSelect={handleSelect} />
                            ))}
                        </div>
                    </div>
                ) : ancetre && (
                    // Placeholder si pas encore de parents dans le graphe
                    <div className="relative z-10 mb-6">
                        <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest text-center mb-3">Génération N-1 · Parents</div>
                        <div className="flex gap-8 justify-center">
                            {['Père', 'Mère'].map((lien) => (
                                <div key={lien} className="flex flex-col items-center gap-2 opacity-30">
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center">
                                        <span className="text-xs text-stone-400">?</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-stone-400">{lien}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Niveau 2 : UTILISATEUR COURANT & CONJOINTS & FRATRIE ── */}
                <div className="relative z-10 mb-8 flex flex-col items-center">
                    <div className="text-[9px] font-black text-[#FF6600]/70 uppercase tracking-widest text-center mb-4">
                        Vous — Génération Actuelle
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-10 items-center max-w-4xl">
                        
                        {/* Fratrie */}
                        {siblings.length > 0 && (
                            <div className="flex gap-4 p-4 border border-blue-200 bg-blue-50/30 rounded-3xl">
                                {siblings.map(sib => (
                                    <HeritageNode key={sib.id} node={sib} isCurrentUser={false} onSelect={handleSelect} />
                                ))}
                            </div>
                        )}

                        {/* VOUS */}
                        {currentUser && (
                            <div className="relative flex justify-center">
                                <div className="absolute inset-0 rounded-full bg-[#FF6600]/5 scale-150 pointer-events-none" />
                                <HeritageNode node={currentUser} isCurrentUser={true} onSelect={handleSelect} />
                            </div>
                        )}

                        {/* Conjoints */}
                        {spouses.length > 0 && (
                            <div className="flex gap-4 p-4 border border-pink-200 bg-pink-50/30 rounded-3xl relative">
                                <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-5 border-t-2 border-pink-300 border-dashed" />
                                {spouses.map(spouse => (
                                    <HeritageNode key={spouse.id} node={spouse} isCurrentUser={false} onSelect={handleSelect} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Famille Élargie (Oncles, Tantes, Cousins, Neveux) ── */}
                {extended.length > 0 && (
                     <div className="relative z-10 mb-8">
                         <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest text-center mb-3">
                             Famille Élargie (Oncles, Cousins, Neveux)
                         </div>
                         <div className="flex flex-wrap justify-center gap-6 p-4 bg-amber-50/40 rounded-3xl border border-amber-100">
                             {extended.map((ext) => (
                                 <HeritageNode key={ext.id} node={ext} isCurrentUser={false} onSelect={handleSelect} />
                             ))}
                         </div>
                     </div>
                )}

                {/* ── Niveau 3 : ENFANTS (validés CHO) ── */}
                {children.length > 0 && (
                    <div className="relative z-10">
                        <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest text-center mb-3">
                            Génération N+1 · Enfants inscrits
                        </div>
                        <div className={`flex justify-center ${children.length > 1 ? 'gap-8' : ''}`}>
                            {children.slice(0, 4).map((c) => (
                                <HeritageNode key={c.id} node={c} isCurrentUser={false} onSelect={handleSelect} />
                            ))}
                        </div>
                    </div>
                )}
            </div>



            <AncestorDetailsModal isOpen={!!selectedNode} onClose={() => setSelectedNode(null)} person={selectedNode} />
            <ExportTreeModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                data={{ ancestre: ancetre, parents, self: currentUser, children }}
                userRole={userRole}
            />
        </div>
    );
}
