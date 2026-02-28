"use client";

import React, { useState } from 'react';
import { Layout, Pyramid, Disc, Table, ChevronRight, Eye } from 'lucide-react';
import PyramidTree from './PyramidTree';

export default function TreeSpecimens() {
    const [selectedStyle, setSelectedStyle] = useState<'pyramid' | 'circular' | 'classic'>('pyramid');

    const styles = [
        { id: 'pyramid', name: 'Pyramide Inviolable', icon: Pyramid, desc: 'Vision ascendante traditionnelle africaine.', premium: true },
        { id: 'circular', name: 'Cercle de Vie', icon: Disc, desc: 'Rayonnement ancestral à 360°.', premium: true },
        { id: 'classic', name: 'Généalogie Classique', icon: Table, desc: 'Structure hiérarchique standard.', premium: false },
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
                            <p className="text-[10px] text-gray-400 font-medium">{style.desc}</p>
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

                {selectedStyle === 'pyramid' ? (
                    <div className="p-8 scale-90 origin-top">
                        <PyramidTree />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-center min-h-[500px] bg-gray-50/30">
                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6 border border-gray-100 animate-bounce">
                            {selectedStyle === 'circular' ? <Disc className="w-12 h-12 text-blue-500" /> : <Table className="w-12 h-12 text-[#124E35]" />}
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
