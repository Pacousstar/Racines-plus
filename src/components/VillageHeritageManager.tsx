"use client";

import React, { useState } from 'react';
import { BookOpen, Save, Plus, Trash2, Quote, Sparkles } from 'lucide-react';

interface VillageHeritage {
    slogan: string;
    customs: string;
    proverbs: string[];
}

export default function VillageHeritageManager({ villageName }: { villageName: string }) {
    const [heritage, setHeritage] = useState<VillageHeritage>({
        slogan: "Village de l'Union et de la Paix",
        customs: "Nos traditions sont ancrées dans le respect des aînés et la préservation de la terre sacrée.",
        proverbs: [
            "Celui qui ne sait pas d'où il vient ne saura jamais où il va.",
            "L'oiseau qui ne vole pas ne sait pas où le grain est mûr."
        ]
    });

    const [newProverb, setNewProverb] = useState('');

    const handleAddProverb = () => {
        if (newProverb.trim()) {
            setHeritage(prev => ({ ...prev, proverbs: [...prev.proverbs, newProverb.trim()] }));
            setNewProverb('');
        }
    };

    const handleRemoveProverb = (index: number) => {
        setHeritage(prev => ({ ...prev, proverbs: prev.proverbs.filter((_, i) => i !== index) }));
    };

    return (
        <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] p-12 border border-white/60 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-amber-50 rounded-[1.5rem] flex items-center justify-center border border-amber-100 shadow-inner group transition-all duration-500 hover:rotate-6">
                    <BookOpen className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Patrimoine de {villageName}</h2>
                    <p className="text-sm text-gray-500 font-medium mt-2">Gérez l&apos;identité culturelle qui sera inscrite dans les Livres d&apos;Héritage.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="group">
                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3 ml-2 group-focus-within:text-amber-600 transition-colors">Slogan / Devise du Village</label>
                        <div className="relative">
                            <Quote className="absolute top-4 left-4 w-5 h-5 text-amber-200" />
                            <input 
                                type="text" 
                                value={heritage.slogan}
                                onChange={e => setHeritage({...heritage, slogan: e.target.value})}
                                placeholder="Ex: Le village de l'union..."
                                className="w-full pl-12 pr-6 py-5 rounded-[2rem] bg-white border border-gray-100 shadow-sm focus:ring-8 focus:ring-amber-50/50 focus:border-amber-400 outline-none transition-all font-bold text-lg text-gray-800"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3 ml-2 group-focus-within:text-amber-600 transition-colors">Coutumes & Traditions</label>
                        <textarea 
                            rows={6}
                            value={heritage.customs}
                            onChange={e => setHeritage({...heritage, customs: e.target.value})}
                            placeholder="Décrivez les traditions marquantes..."
                            className="w-full px-8 py-6 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm focus:ring-8 focus:ring-amber-50/50 focus:border-amber-400 outline-none transition-all font-medium text-sm leading-relaxed text-gray-600"
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="flex-1 bg-amber-50/30 p-10 rounded-[3rem] border border-amber-100/50 relative overflow-hidden">
                        <Sparkles className="absolute top-6 right-6 w-12 h-12 text-amber-200/40 animate-pulse" />
                        
                        <label className="block text-[10px] font-black uppercase text-amber-700/60 tracking-[0.2em] mb-6 ml-2">Sagesse des Anciens (Proverbes)</label>
                        
                        <div className="flex gap-3 mb-8">
                            <input 
                                type="text" 
                                value={newProverb}
                                onChange={e => setNewProverb(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAddProverb()}
                                placeholder="Ajouter une parole de sagesse..." 
                                className="flex-1 px-6 py-4 rounded-2xl bg-white border border-amber-100 outline-none focus:border-amber-500 transition-all text-sm font-medium shadow-sm" 
                            />
                            <button 
                                onClick={handleAddProverb}
                                className="bg-[#124E35] text-white p-4 rounded-2xl shadow-lg shadow-green-100 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {heritage.proverbs.map((proverb, index) => (
                                <div key={index} className="p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 italic text-sm text-amber-900 flex justify-between items-start group shadow-sm animate-in slide-in-from-right-4 duration-300">
                                    <span className="flex-1 leading-relaxed">« {proverb} »</span>
                                    <button 
                                        onClick={() => handleRemoveProverb(index)}
                                        className="opacity-0 group-hover:opacity-100 ml-4 p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button className="w-full mt-6 py-6 bg-gradient-to-r from-amber-600 to-[#124E35] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-200 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                        <Save className="w-6 h-6" />
                        Graver le Patrimoine
                    </button>
                </div>
            </div>
        </div>
    );
}
