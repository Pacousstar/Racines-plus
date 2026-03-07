"use client";

import React, { useState, useEffect } from 'react';
import { TreePine, Crown, Clock, Heart, GitBranch, FileText, Image as ImageIcon, BookOpen, ChevronRight, Download } from 'lucide-react';
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

    const ringColor = isPatriarch
        ? 'ring-4 ring-[#124E35] ring-offset-2'
        : node.status === 'confirmed'
            ? 'ring-4 ring-[#124E35] ring-offset-2'
            : node.status === 'probable'
                ? 'ring-4 ring-[#FF6600] ring-offset-2'
                : 'ring-2 ring-gray-300 ring-offset-1';

    const initials = node.nom
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const avatarBg = isPatriarch
        ? 'bg-[#124E35]'
        : node.type === 'parent'
            ? 'bg-[#1f6b4a]'
            : isCurrentUser
                ? 'bg-[#FF6600]'
                : 'bg-[#C05C3C]';

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
                        <span className="text-white font-black text-lg">{initials}</span>
                    )}
                </div>

                {/* Badge statut */}
                <div className={`
                    absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full border-2 border-white shadow-md text-[9px]
                    ${isPatriarch ? 'bg-amber-400' : node.status === 'confirmed' ? 'bg-[#124E35]' : node.status === 'probable' ? 'bg-[#FF6600]' : 'bg-gray-400'}
                `}>
                    {isPatriarch ? '👑' : node.status === 'confirmed' ? '✓' : '○'}
                </div>

                {/* Badge status quick-access sous les nœuds non-patriarch */}
                {!isPatriarch && !isCurrentUser && (
                    <div className="absolute -top-1 -left-1 flex gap-0.5">
                        <div className="w-4 h-1.5 rounded-full bg-[#124E35]/60" title="Lignée" />
                        <div className="w-4 h-1.5 rounded-full bg-[#C05C3C]/50" title="Document" />
                    </div>
                )}
            </div>

            {/* Nom + rôle */}
            <div className="text-center max-w-[120px]">
                <p className={`font-black leading-tight truncate ${isPatriarch ? 'text-sm text-[#1c2b23]' : 'text-xs text-gray-800'}`}>
                    {node.nom}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-tight truncate ${isPatriarch ? 'text-amber-600' :
                    isCurrentUser ? 'text-[#FF6600]' :
                        node.type === 'parent' ? 'text-[#124E35]' : 'text-[#C05C3C]'
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
                        .select('id, nom_complet, periode, is_certified, village_nom')
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
                        .select('id, nom_complet, periode, is_certified, village_nom')
                        .eq('is_certified', true)
                        .ilike('village_nom', `%${profil.village_origin || villageNom}%`)
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

                // 4. Parents et enfants via Neo4j (batch Supabase pour performance)
                let parentNodes: LineageNode[] = [];
                const childNodes: LineageNode[] = [];

                try {
                    const res = await fetch('/api/tree');
                    if (res.ok) {
                        const treeData = await res.json();

                        // Collecter tous les IDs en une fois pour batch
                        const parentLinks = treeData.links.filter((l: any) => l.target === userId);
                        const childLinks = treeData.links.filter((l: any) => l.source === userId);

                        const parentIds = parentLinks.map((l: any) => l.source).filter(Boolean);
                        const childIds = childLinks.map((l: any) => l.target).filter(Boolean);

                        // Batch : 1 seule requête pour tous les parents
                        if (parentIds.length > 0) {
                            const { data: parentProfiles } = await supabase
                                .from('profiles')
                                .select('id, status, first_name, last_name, avatar_url, quartier_nom')
                                .in('id', parentIds)
                                .in('status', ['confirmed', 'probable']);

                            if (parentProfiles) {
                                for (const pp of parentProfiles) {
                                    const link = parentLinks.find((l: any) => l.source === pp.id);
                                    parentNodes.push({
                                        id: pp.id,
                                        nom: `${pp.first_name || ''} ${pp.last_name || ''}`.trim() || 'Parent',
                                        type: 'parent',
                                        generation: 1,
                                        status: pp.status,
                                        avatarUrl: pp.avatar_url,
                                        quartier: pp.quartier_nom,
                                        lien: link?.type === 'FATHER_OF' ? 'Père' :
                                            link?.type === 'MOTHER_OF' ? 'Mère' : 'Parent',
                                    });
                                }
                            }
                        }

                        // Batch : 1 seule requête pour tous les enfants
                        if (childIds.length > 0) {
                            const { data: childProfiles } = await supabase
                                .from('profiles')
                                .select('id, status, first_name, last_name, avatar_url, quartier_nom')
                                .in('id', childIds)
                                .in('status', ['confirmed', 'probable']);

                            if (childProfiles) {
                                for (const cp of childProfiles) {
                                    childNodes.push({
                                        id: cp.id,
                                        nom: `${cp.first_name || ''} ${cp.last_name || ''}`.trim() || 'Enfant',
                                        type: 'child',
                                        generation: 3,
                                        status: cp.status,
                                        avatarUrl: cp.avatar_url,
                                        quartier: cp.quartier_nom,
                                        lien: 'Enfant',
                                    });
                                }
                            }
                        }
                    }
                } catch { /* Neo4j non disponible - arbre partiel */ }

                // FALLBACK : Si pas de parents trouvés dans le graphe, on regarde dans les metadata du profil utilisateur
                if (parentNodes.length === 0) {
                    const { data: metaProfile } = await supabase.from('profiles').select('metadata').eq('id', userId).single();
                    if (metaProfile?.metadata) {
                        const meta = metaProfile.metadata;
                        if (meta.father_first_name || meta.father_last_name) {
                            parentNodes.push({
                                id: 'father-meta',
                                nom: `${meta.father_first_name || ''} ${meta.father_last_name || ''}`.trim(),
                                type: 'parent',
                                generation: 1,
                                status: 'declared',
                                lien: 'Père',
                                quartier: 'Déclaratif'
                            });
                        }
                        if (meta.mother_first_name || meta.mother_last_name) {
                            parentNodes.push({
                                id: 'mother-meta',
                                nom: `${meta.mother_first_name || ''} ${meta.mother_last_name || ''}`.trim(),
                                type: 'parent',
                                generation: 1,
                                status: 'declared',
                                lien: 'Mère',
                                quartier: 'Déclaratif'
                            });
                        }
                    }
                }

                setParents(parentNodes);
                setChildren(childNodes);

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
                    .limit(1).single();

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
                            Exporter l'Arbre
                        </button>
                    )}
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
                    {/* Branche vers parent gauche */}
                    {parents.length > 0 && (
                        <path
                            d={parents.length > 1
                                ? "M 200 160 C 200 175, 120 185, 120 210"
                                : "M 200 160 C 200 175, 200 195, 200 220"}
                            fill="none" stroke="#2d5a3d" strokeWidth="2" strokeLinecap="round" opacity="0.35"
                        />
                    )}
                    {/* Branche vers parent droit */}
                    {parents.length > 1 && (
                        <path
                            d="M 200 160 C 200 175, 280 185, 280 210"
                            fill="none" stroke="#2d5a3d" strokeWidth="2" strokeLinecap="round" opacity="0.35"
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

                {/* ── Niveau 2 : UTILISATEUR COURANT ── */}
                {currentUser && (
                    <div className="relative z-10 mb-6">
                        <div className="text-[9px] font-black text-[#FF6600]/70 uppercase tracking-widest text-center mb-3">
                            Vous — Génération Actuelle
                        </div>
                        {/* Halo parcheminé derrière l'utilisateur */}
                        <div className="relative flex justify-center">
                            <div className="absolute inset-0 rounded-full bg-[#FF6600]/5 scale-150 pointer-events-none" />
                            <HeritageNode node={currentUser} isCurrentUser={true} onSelect={handleSelect} />
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
