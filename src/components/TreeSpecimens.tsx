"use client";

import React, { useState } from 'react';
import { TreePine, Layout, Table, Eye, Crown } from 'lucide-react';
import PyramidTree from './PyramidTree';

// Composant Spécimens d'Arbre Généalogique — affiche 2 modèles premium propres à Racines+
// Props : userName = nom de l'utilisateur connecté (données réelles), userStatus = statut de certification
export default function TreeSpecimens({ userName, userStatus }: { userName?: string; userStatus?: string }) {
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

            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px] relative">
                <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-black/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <Eye className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Aperçu interactif : {styles.find(s => s.id === selectedStyle)?.name}</span>
                </div>

                {selectedStyle === 'heritage' ? (
                    <div className="flex flex-col items-center justify-center p-12 min-h-[500px] bg-[#fcf8f1]">
                        <div className="relative w-full max-w-2xl bg-white/50 rounded-[3rem] p-10 border border-amber-200/50 shadow-inner flex flex-col items-center">
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
                    <div className="flex flex-col items-center justify-center p-8 min-h-[500px] bg-slate-50/50">
                        <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
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
                                            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                                                <Crown className="w-12 h-12 text-[#FF6600]" />
                                            </div>
                                        </div>
                                        <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-full border-2 border-white uppercase">Patriarch</span>
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
                                            color: userStatus === 'confirmed' ? 'text-green-700 bg-green-50 border-green-100' : 'text-[#FF6600] bg-orange-50 border-orange-100'
                                        },
                                        {
                                            label: 'Votre lignée',
                                            desc: 'Ancêtres et descendants validés dans l\'arbre.',
                                            color: 'text-[#FF6600] bg-orange-50 border-orange-100'
                                        },
                                        {
                                            label: 'Documents (à venir)',
                                            desc: 'Actes, photos de famille, preuves historiques.',
                                            color: 'text-slate-600 bg-slate-50 border-slate-100'
                                        },
                                        {
                                            label: 'Médias (à venir)',
                                            desc: 'Photos et vidéos de votre famille.',
                                            color: 'text-slate-600 bg-slate-50 border-slate-100'
                                        }
                                    ].map((item, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl border ${item.color} transition-all`}>
                                            <p className="text-[10px] font-black uppercase tracking-wide leading-tight">{item.label}</p>
                                            <p className="text-[10px] font-medium mt-0.5 opacity-80">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-center min-h-[500px] bg-gray-50/30">
                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6 border border-gray-100 animate-bounce">
                            <Table className="w-12 h-12 text-[#124E35]" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-2">Génération en cours...</h3>
                        <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                            Le style <strong>{styles.find(s => s.id === selectedStyle)?.name}</strong> arrive bientôt.
                            L'IA Racines+ adapte vos données de lignée pour ce format spécifique.
                        </p>
                        <div className="mt-8 flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />)}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">+12 membres connectés</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
