"use client";

import React, { useState } from 'react';
import { TreePine, Layout, Table, Eye, Crown } from 'lucide-react';
import PyramidTree from './PyramidTree';

// ─────────────────────────────────────────────────────────────
// Sous-composant : un niveau de l'arbre généalogique illustré
// ─────────────────────────────────────────────────────────────
interface TreeNodeData {
    nom: string;
    dates?: string;
    quartier?: string;
    certified?: boolean;
    isYou?: boolean;
    small?: boolean;
}

function TreeLevel({
    label, labelColor, nodes, connectorColor
}: {
    label: string;
    labelColor: string;
    nodes: TreeNodeData[];
    connectorColor: string;
}) {
    return (
        <div className="flex flex-col items-center gap-1 w-full">
            {/* Connecteur vers le haut */}
            <div className="w-px h-4" style={{ background: connectorColor, opacity: 0.4 }} />
            {/* Label du niveau */}
            <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border mb-1 ${labelColor}`}
                style={{ borderColor: connectorColor, background: `${connectorColor}12` }}>
                {label}
            </div>
            {/* Ligne horizontale de connexion */}
            <div className="w-2/3 h-px mb-1" style={{ background: connectorColor, opacity: 0.3 }} />
            {/* Nœuds du niveau */}
            <div className="flex flex-wrap justify-center gap-2 w-full">
                {nodes.map((node, idx) => (
                    <div
                        key={idx}
                        className={`
                            relative flex flex-col items-center gap-1 rounded-xl border-2 shadow-sm
                            transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer
                            ${node.small ? 'px-2 py-1 w-10' : 'px-3 py-2 min-w-[90px] max-w-[120px]'}
                            ${node.isYou
                                ? 'border-[#FF6600] bg-orange-50'
                                : node.certified
                                    ? 'border-[#124E35] bg-white'
                                    : 'border-stone-200 bg-stone-50/60'
                            }
                        `}
                    >
                        {/* Badge certifié CHO */}
                        {node.certified && !node.small && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#124E35] text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-sm">✓</div>
                        )}
                        {node.isYou && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#FF6600] text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-sm">★</div>
                        )}
                        {node.small ? (
                            <span className="text-[9px] font-black text-stone-400">{node.nom}</span>
                        ) : (
                            <>
                                {/* Avatar initiales */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black
                                    ${node.isYou ? 'bg-[#FF6600] text-white' : node.certified ? 'bg-[#124E35] text-white' : 'bg-stone-200 text-stone-500'}
                                `}>
                                    {node.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <p className="text-[9px] font-black text-gray-800 text-center leading-tight truncate w-full">{node.nom}</p>
                                {node.dates && <p className="text-[8px] text-stone-400 text-center leading-none">{node.dates}</p>}
                                {node.quartier && <p className="text-[7px] font-bold text-stone-400 text-center uppercase tracking-tighter">{node.quartier}</p>}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}


// Composant Spécimens d'Arbre Généalogique — affiche 2 modèles premium propres à Racines+
// Props : userName = nom de l'utilisateur connecté (données réelles), userStatus = statut de certification
export default function TreeSpecimens({ userName, userStatus, userRole }: { userName?: string; userStatus?: string; userRole?: string }) {
    const [selectedStyle, setSelectedStyle] = useState<'heritage' | 'modern' | 'classic'>('heritage');

    const styles = [
        { id: 'heritage', name: 'Arbre Héritage Traditionnel', icon: TreePine, desc: 'Vision artistique et symbolique de votre lignée.', premium: true },
        { id: 'modern', name: 'Réseau Famille Moderne', icon: Layout, desc: 'Graphe interconnecté avec profils dynamiques.', premium: true },
        { id: 'classic', name: 'Généalogie Standard', icon: Table, desc: 'Structure hiérarchique classique.', premium: false },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
                {styles.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id as any)}
                        className={`flex-shrink-0 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all group ${selectedStyle === style.id
                            ? 'border-[#FF6600] bg-orange-50/50 shadow-md translate-y-[-2px]'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                    >
                        <div className={`p-2.5 rounded-xl ${selectedStyle === style.id ? 'bg-[#FF6600] text-white' : 'bg-gray-50 text-gray-400 group-hover:text-gray-600'}`}>
                            <style.icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h4 className={`font-bold text-sm ${selectedStyle === style.id ? 'text-[#FF6600]' : 'text-gray-700'}`}>{style.name}</h4>
                            <p className="text-[10px] text-gray-600 font-medium">{style.desc}</p>
                        </div>
                        {style.premium && (
                            <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter self-start ml-2">Premium</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px] relative">
                <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-black/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <Eye className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Aperçu interactif : {styles.find(s => s.id === selectedStyle)?.name}</span>
                </div>

                {selectedStyle === 'heritage' ? (
                    <div className="flex flex-col items-center justify-center p-8 min-h-[400px] bg-[#fcf8f1]">
                        <div className="relative w-full max-w-2xl bg-white/50 rounded-[3rem] p-6 border border-amber-200/50 shadow-inner flex flex-col items-center">
                            {/* Version stylisée de l'image Heritage */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <TreePine className="w-full h-full text-amber-900" />
                            </div>

                            <div className="z-10 bg-white/90 backdrop-blur-md border-2 border-amber-100 p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                    <Crown className="w-10 h-10 text-amber-600" />
                                </div>
                                <h3 className="font-serif text-2xl font-black text-amber-900 mb-1">MON ARBRE GÉNÉALOGIQUE</h3>
                                <div className="h-0.5 w-16 bg-amber-400 mb-4" />
                                <PyramidTree />
                            </div>

                            <div className="mt-8 p-5 bg-[#124E35] rounded-2xl border border-white/20 text-center shadow-lg">
                                <p className="text-xs font-bold text-white uppercase tracking-widest">Modèle Héritage Solaire</p>
                                <p className="text-[10px] text-green-100 mt-1">Sert de base à l&apos;illustration artistique officielle de votre lignée.</p>
                            </div>
                        </div>
                    </div>
                ) : selectedStyle === 'modern' ? (
                    <div className="flex flex-col items-center justify-center p-6 min-h-[400px] bg-slate-50/50">
                        <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col mb-4">
                            {/* Header Modern premium */}
                            <div className="bg-slate-900 p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#FF6600] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/20">R+</div>
                                    <div>
                                        <span className="text-white font-black text-sm uppercase tracking-[0.2em] block">Family Tree Dashboard</span>
                                        <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">African Lineage Core v4.0</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                </div>
                            </div>

                            <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 flex flex-col items-center justify-center border-r border-slate-100 pr-10">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-[#FF6600] p-1.5 mb-4 shadow-xl shadow-orange-100 animate-pulse">
                                            <div className="w-full h-full bg-orange-50 rounded-full flex items-center justify-center overflow-hidden">
                                                <Crown className="w-12 h-12 text-[#FF6600]" />
                                            </div>
                                        </div>
                                        <span className="absolute -top-2 -right-2 bg-[#FF6600] text-white text-[8px] font-black px-2 py-1 rounded-full border-2 border-white uppercase">Vous</span>
                                    </div>
                                    <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">{userName || 'Votre Arbre'}</h3>
                                    <p className="text-xs text-[#FF6600] font-black mb-6 uppercase tracking-widest">
                                        {userStatus === 'confirmed' ? 'Nœud Certifié ✅' : userStatus === 'probable' ? 'En cours de validation 🟠' : 'Profil en attente ⚫'}
                                    </p>

                                    <div className="flex gap-8 items-end">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex flex-col items-center gap-3">
                                                <div className="w-14 h-14 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200" />
                                                </div>
                                                <div className="h-1.5 w-12 bg-slate-100 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Votre Espace Racines+</h4>
                                    {[
                                        {
                                            label: 'Statut de certification',
                                            desc: userStatus === 'confirmed' ? '✅ Certifié par le CHO' : userStatus === 'probable' ? '🟠 En cours de validation' : '⚫ En attente du CHO',
                                            color: userStatus === 'confirmed' ? 'text-green-800 bg-green-50 border-green-200 shadow-sm' : 'text-[#FF6600] bg-orange-50 border-orange-200 shadow-sm'
                                        },
                                        {
                                            label: 'Votre lignée',
                                            desc: 'Ancêtres et descendants validés dans l\'arbre.',
                                            color: 'text-[#FF6600] bg-orange-50 border-orange-200 shadow-sm'
                                        },
                                        {
                                            label: userRole === 'admin' ? 'Documents (Espace Test Admin)' : 'Documents (À venir)',
                                            desc: userRole === 'admin' ? 'Cliquez pour ouvrir le dossier (Simulation).' : 'Actes, photos de famille, preuves historiques.',
                                            color: userRole === 'admin' ? 'text-blue-800 bg-blue-50 border-blue-200 shadow-sm cursor-pointer hover:bg-blue-100' : 'text-slate-700 bg-slate-100 border-slate-200 shadow-sm',
                                            onClick: () => userRole === 'admin' && alert('Fonctionnalité Documents (Admin Test) lancée !')
                                        },
                                        {
                                            label: userRole === 'admin' ? 'Médias (Espace Test Admin)' : 'Médias (À venir)',
                                            desc: userRole === 'admin' ? 'Cliquez pour ouvrir la galerie (Simulation).' : 'Photos et vidéos de votre famille.',
                                            color: userRole === 'admin' ? 'text-indigo-800 bg-indigo-50 border-indigo-200 shadow-sm cursor-pointer hover:bg-indigo-100' : 'text-slate-700 bg-slate-100 border-slate-200 shadow-sm',
                                            onClick: () => userRole === 'admin' && alert('Fonctionnalité Médias (Admin Test) lancée !')
                                        }
                                    ].map((item, idx) => (
                                        <div key={idx} onClick={item.onClick} className={`p-4 rounded-xl border transition-all ${item.color}`}>
                                            <p className="text-xs font-black uppercase tracking-wide leading-tight">{item.label}</p>
                                            <p className="text-xs font-semibold mt-1 opacity-90">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ─── Aperçu : Généalogie Standard ─── Arbre Africain Illustré */
                    <div className="relative min-h-[400px] bg-[#f9f3e8] overflow-hidden">
                        {/* Bordure décorative africaine */}
                        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-r from-[#124E35] via-[#C05C3C] to-[#d4af37] via-[#124E35]" />
                        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-r from-[#d4af37] via-[#C05C3C] to-[#124E35]" />
                        {/* Titre bannière */}
                        <div className="flex justify-center pt-8 mb-4">
                            <div className="bg-[#124E35] text-white px-8 py-2 rounded-full border-2 border-[#d4af37] shadow-lg">
                                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                    <TreePine className="w-4 h-4 text-[#d4af37]" />
                                    MON ARBRE GÉNÉALOGIQUE — RACINES+
                                    <TreePine className="w-4 h-4 text-[#d4af37]" />
                                </span>
                            </div>
                        </div>

                        {/* ── Niveaux de l'arbre (du haut vers le bas) ── */}
                        <div className="px-4 pb-8 space-y-1">
                            {/* Niveau Ancêtres */}
                            <TreeLevel label="Ancêtres" labelColor="text-amber-700" nodes={[
                                { nom: 'Ancêtre 1', dates: 'Env. 1820 – 1890', quartier: 'Toa-Zéo', certified: true },
                                { nom: 'Ancêtre 2', dates: 'Env. 1830 – 1900', quartier: 'Toa-Zéo', certified: true },
                                { nom: 'GA', dates: '', quartier: '', certified: false, small: true },
                                { nom: 'Ancêtre 3', dates: 'Env. 1825 – 1895', quartier: 'Toa-Zéo', certified: true },
                                { nom: 'Ancêtre 4', dates: 'Env. 1840 – 1910', quartier: 'Toa-Zéo', certified: true },
                            ]} connectorColor="#d4af37" />

                            {/* Niveau Grands-Parents */}
                            <TreeLevel label="Grands-Parents" labelColor="text-[#124E35]" nodes={[
                                { nom: 'Grand-Père P.', dates: '1910 – 1988', quartier: 'Gbéya', certified: true },
                                { nom: 'Grand-Mère P.', dates: '1914 – 1992', quartier: 'Gbéya', certified: true },
                                { nom: 'GP', dates: '', quartier: '', certified: false, small: true },
                                { nom: 'Grand-Père M.', dates: '1908 – 1985', quartier: 'Bonyé', certified: true },
                            ]} connectorColor="#124E35" />

                            {/* Niveau Parents */}
                            <TreeLevel label="Parents" labelColor="text-[#124E35]" nodes={[
                                { nom: 'NOM PRÉNOM', dates: '1948 – 2001', quartier: 'Gbéya', certified: true },
                                { nom: 'NOM PRÉNOM', dates: '1952 –', quartier: 'Gbéya', certified: true },
                                { nom: 'NOM PRÉNOM', dates: '1950 – 2010', quartier: 'Bonyé', certified: true },
                                { nom: 'NOM PRÉNOM', dates: '1955 –', quartier: 'Zouhaé', certified: true },
                            ]} connectorColor="#124E35" />

                            {/* Génération Actuelle */}
                            <TreeLevel label="Génération Actuelle" labelColor="text-[#FF6600]" nodes={[
                                { nom: userName || 'NOM PRÉNOM', dates: 'Né(e) en', quartier: 'Vous', certified: userStatus === 'confirmed', isYou: true },
                                { nom: 'NOM PRÉNOM', dates: '± 1980 –', quartier: '', certified: false },
                                { nom: 'NOM PRÉNOM', dates: '± 1983 –', quartier: '', certified: false },
                            ]} connectorColor="#FF6600" />

                            {/* Enfants */}
                            <TreeLevel label="Enfants" labelColor="text-[#C05C3C]" nodes={[
                                { nom: 'NOM PRÉNOM', dates: '', quartier: '', certified: false },
                                { nom: 'NOM PRÉNOM', dates: '', quartier: '', certified: false },
                                { nom: 'NOM PRÉNOM', dates: '', quartier: '', certified: false },
                                { nom: 'NOM PRÉNOM', dates: '', quartier: '', certified: false },
                                { nom: 'NOM PRÉNOM', dates: '', quartier: '', certified: false },
                            ]} connectorColor="#C05C3C" />

                            {/* Petits-Enfants */}
                            <TreeLevel label="Petits-Enfants" labelColor="text-stone-500" nodes={[
                                { nom: 'NOM PRÉNOM', dates: '', quartier: '', certified: false },
                                { nom: 'NOM PRÉNOM', dates: '', quartier: '', certified: false },
                                { nom: 'NOM PRÉNOM', dates: '', quartier: '', certified: false },
                                { nom: 'NOM PRÉNOM', dates: '', quartier: '', certified: false },
                            ]} connectorColor="#a0856b" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
