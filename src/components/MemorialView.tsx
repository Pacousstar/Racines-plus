"use client";

import React, { useState, useEffect } from 'react';
import { Flame, Search, MapPin, Info, User } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface MemorialVictim {
    id: string;
    nom: string;
    prenoms: string;
    genre: string;
    age_approximatif?: number;
    village_id?: string;
    quartier_nom?: string;
    description_circonstances?: string;
}

interface Village {
    id: string;
    nom: string;
}

export default function MemorialView() {
    const supabase = createClient();
    const [victims, setVictims] = useState<MemorialVictim[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadMemorial = async () => {
            setIsLoading(true);
            const [victimsRes, villagesRes] = await Promise.all([
                supabase.from('memorial_victims').select('*').eq('is_verified', true).order('nom', { ascending: true }),
                supabase.from('villages').select('id, nom')
            ]);

            if (victimsRes.data) setVictims(victimsRes.data);
            if (villagesRes.data) setVillages(villagesRes.data);
            setIsLoading(false);
        };
        loadMemorial();
    }, [supabase]);

    const filteredVictims = victims.filter(v =>
        (v.nom + ' ' + v.prenoms).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.quartier_nom || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex w-16 h-16 bg-red-50 rounded-3xl items-center justify-center mb-2 shadow-inner">
                    <Flame className="w-8 h-8 text-red-600 animate-pulse" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Mémorial des Victimes <span className="text-red-600">2010-2011</span></h1>
                <p className="text-text-muted max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                    Honorons la mémoire de ceux qui nous ont quittés. Ce registre recense officiellement les membres de la communauté de Toa-Zéo et des villages environnants victimes de la crise.
                </p>
            </div>

            {/* Barre de recherche */}
            <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Rechercher un nom ou un quartier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none transition-all text-sm font-medium"
                />
            </div>

            {/* Liste des victimes */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 bg-white rounded-3xl border border-gray-50 animate-pulse"></div>
                    ))}
                </div>
            ) : filteredVictims.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVictims.map(victim => (
                        <div key={victim.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-red-50/50 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/30 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>

                            <div className="flex items-start gap-4 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl ${victim.genre === 'F' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center font-bold text-xl shadow-sm border border-white`}>
                                    {victim.nom[0]}{victim.prenoms[0]}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors uppercase text-sm tracking-wide">{victim.nom} {victim.prenoms}</h3>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <div className="flex items-center gap-1 text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-lg font-bold">
                                            <MapPin className="w-3 h-3 text-red-400" />
                                            {villages.find(v => v.id === victim.village_id)?.nom || 'Village inconnu'}
                                        </div>
                                        {victim.age_approximatif && (
                                            <div className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-lg font-bold">
                                                {victim.age_approximatif} Ans
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {victim.description_circonstances && (
                                <div className="mt-4 pt-4 border-t border-gray-50 relative z-10">
                                    <p className="text-xs text-text-muted italic leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                        &quot;{victim.description_circonstances}&quot;
                                    </p>
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{victim.quartier_nom || 'Quartier non spécifié'}</span>
                                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                    <Info className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <Flame className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium italic">Aucun nom ne correspond à votre recherche.</p>
                </div>
            )}

            {/* Footer Devoir de Mémoire */}
            <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500 via-transparent to-transparent"></div>
                <div className="relative z-10 space-y-6">
                    <div className="flex justify-center">
                        <div className="w-12 h-px bg-red-600 mx-2 self-center"></div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Racines+ Mémoire</span>
                        <div className="w-12 h-px bg-red-600 mx-2 self-center"></div>
                    </div>
                    <h2 className="text-2xl font-bold">Plus jamais ça.</h2>
                    <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
                        Le mémorial est un espace de recueillement et de vérité. Si vous connaissez une victime qui ne figure pas encore dans ce registre, veuillez contacter un Administrateur ou un chef de village (CHO) pour initier son recensement.
                    </p>
                </div>
            </div>
        </div>
    );
}
