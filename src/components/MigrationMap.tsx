"use client";

import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Users, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface MigrationData {
    country: string;
    city: string;
    count: number;
    members: string[];
}

export default function MigrationMap() {
    const [stats, setStats] = useState<MigrationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchMigrationData();
    }, []);

    const fetchMigrationData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('residence_country, residence_city, first_name, last_name')
                .eq('status', 'confirmed');

            if (error) throw error;

            // Grouper les données par ville/pays
            const groups: Record<string, MigrationData> = {};
            data.forEach(p => {
                const key = `${p.residence_country}-${p.residence_city || 'Inconnue'}`;
                if (!groups[key]) {
                    groups[key] = {
                        country: p.residence_country,
                        city: p.residence_city || 'Inconnue',
                        count: 0,
                        members: []
                    };
                }
                groups[key].count += 1;
                groups[key].members.push(`${p.first_name} ${p.last_name}`);
            });

            setStats(Object.values(groups).sort((a, b) => b.count - a.count));
        } catch (err) {
            console.error("Erreur chargement migration:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getCountryName = (code: string) => {
        const names: Record<string, string> = {
            'CI': 'Côte d\'Ivoire',
            'FR': 'France',
            'US': 'États-Unis',
            'BE': 'Belgique',
            'CA': 'Canada',
        };
        return names[code] || code;
    };

    return (
        <section className="py-12 bg-white dark:bg-black rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#C05C3C]/10 text-[#C05C3C] rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Carte des Migrations</h2>
                        <p className="text-sm text-gray-500">Rayonnement de Toa-Zéo à travers le monde</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6">
                {/* Visualisation stylisée (PlaceHolder SVG Map) */}
                <div className="lg:col-span-2 relative bg-gray-950 rounded-3xl overflow-hidden min-h-[400px] border border-white/5 shadow-2xl">
                    {/* Background SVG stylisé simplifié du monde */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none p-8">
                        <svg viewBox="0 0 800 400" className="w-full h-full text-white/40 fill-current">
                            {/* Formes simplifiées des continents */}
                            <path d="M150 100 Q 200 80 250 120 T 300 200 Q 280 250 200 280 T 100 220 Q 80 150 150 100" /> {/* Amériques */}
                            <path d="M400 120 Q 450 100 500 130 T 550 200 Q 530 250 450 280 T 350 220 Q 330 150 400 120" /> {/* Afrique/Europe */}
                            <path d="M600 150 Q 650 130 700 160 T 750 230 Q 730 280 650 310 T 550 250 Q 530 180 600 150" /> {/* Asie/Océanie */}
                        </svg>
                    </div>

                    {/* Arcs et Points dynamiques */}
                    {stats.map((item, idx) => {
                        // Simulation de positions pour la démo
                        const x = 430 + (idx * 40) * (item.country === 'CI' ? 0 : 1);
                        const y = 200 + (idx * 30) * (item.country === 'CI' ? 0 : -1);

                        return (
                            <div key={idx} style={{ left: `${(x / 800) * 100}%`, top: `${(y / 400) * 100}%` }} className="absolute transform -translate-x-1/2 -translate-y-1/2 group">
                                {item.country !== 'CI' && (
                                    <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0, width: 400, height: 400 }}>
                                        <path
                                            d={`M 0 0 Q ${-100} ${-50} ${430 - x} ${200 - y}`}
                                            fill="none"
                                            stroke="#C05C3C"
                                            strokeWidth="1.5"
                                            strokeDasharray="4 4"
                                            className="opacity-40 animate-pulse"
                                        />
                                    </svg>
                                )}
                                <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all hover:scale-125 ${item.country === 'CI' ? 'bg-[#124E35] w-8 h-8' : 'bg-[#C05C3C]'}`}>
                                    <MapPin className="w-3 h-3 text-white" />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-gray-100 dark:border-white/10">
                                        <p className="font-bold text-xs mb-1">{item.city}, {getCountryName(item.country)}</p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mb-2">
                                            <Users className="w-3 h-3 text-[#FF6600]" /> {item.count} Membres
                                        </div>
                                        <div className="max-h-20 overflow-y-auto">
                                            {item.members.slice(0, 3).map((m, i) => (
                                                <p key={i} className="text-[9px] text-gray-400 border-l border-gray-200 pl-2 mb-1">{m}</p>
                                            ))}
                                            {item.members.length > 3 && <p className="text-[8px] text-gray-300 italic">+{item.members.length - 3} autres...</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Centre de Toa-Zéo */}
                    <div className="absolute top-1/2 left-[53.75%] transform -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                            <div className="w-4 h-4 bg-white rounded-full animate-ping absolute inset-0" />
                            <div className="w-4 h-4 bg-[#124E35] rounded-full border-2 border-white shadow-lg relative z-10" />
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-[#124E35]" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Origine (Toa-Zéo)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-[#C05C3C]" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Diaspora</span>
                        </div>
                    </div>
                </div>

                {/* Liste des destinations */}
                <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Top Destinations</h3>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : stats.length === 0 ? (
                        <div className="p-6 text-center bg-gray-50 rounded-2xl">
                            <p className="text-xs text-gray-400 italic">Aucune donnée de migration validée.</p>
                        </div>
                    ) : (
                        stats.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all group overflow-hidden relative">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm border border-gray-100">
                                        {item.country === 'CI' ? '🇨🇮' : item.country === 'FR' ? '🇫🇷' : item.country === 'US' ? '🇺🇸' : '🌍'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{item.city}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{getCountryName(item.country)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <span className="text-lg font-black text-[#C05C3C]">{item.count}</span>
                                        <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#C05C3C] transition-colors" />
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Membres</p>
                                </div>
                                {/* Barre de progression discrète en arrière-plan */}
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-[#C05C3C]/10 transition-all duration-1000"
                                    style={{ width: `${(item.count / stats[0].count) * 100}%` }}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
