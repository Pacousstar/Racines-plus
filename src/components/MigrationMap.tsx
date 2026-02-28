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
            'CI': 'Côte d&apos;Ivoire',
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
                {/* Visualisation stylisée (Premium World Map) */}
                <div className="lg:col-span-2 relative bg-[#0A0F0D] rounded-[2.5rem] overflow-hidden min-h-[450px] border border-white/5 shadow-2xl flex items-center justify-center">
                    {/* Background Grid & Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#124E35]/20 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />

                    {/* World Map SVG (Simplified Premium) */}
                    <div className="w-full h-full p-10 opacity-40">
                        <svg viewBox="0 0 1000 500" className="w-full h-full text-[#124E35]/60 fill-current">
                            <path d="M150,150 L200,140 L240,160 L280,220 L270,300 L200,340 L120,300 L110,220 Z" /> {/* North America */}
                            <path d="M220,350 L260,340 L300,370 L310,450 L260,480 L200,450 Z" /> {/* South America */}
                            <path d="M450,100 L500,80 L550,110 L580,180 L560,260 L480,280 L420,240 Z" /> {/* Europe */}
                            <path d="M470,290 L530,280 L580,320 L570,420 L510,480 L440,430 L430,340 Z" /> {/* Africa */}
                            <path d="M600,120 L750,100 L850,150 L880,280 L800,400 L650,420 L580,300 Z" /> {/* Eurasia */}
                            <path d="M780,410 L850,400 L880,450 L840,490 L760,470 Z" /> {/* Australia */}
                        </svg>
                    </div>

                    {/* Arcs de Migration (SVG interactif) */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-20">
                        {stats.map((item, idx) => {
                            if (item.country === 'CI') return null;
                            // Simulation de points sur la carte (Toa-Zéo est env au centre de l'Afrique)
                            const originX = 500;
                            const originY = 360;
                            const destX = item.country === 'FR' ? 490 : item.country === 'US' ? 200 : item.country === 'CA' ? 180 : item.country === 'BE' ? 500 : 700;
                            const destY = item.country === 'FR' ? 150 : item.country === 'US' ? 180 : item.country === 'CA' ? 120 : item.country === 'BE' ? 130 : 250;

                            return (
                                <g key={`arc-${idx}`}>
                                    <path
                                        d={`M ${originX} ${originY} Q ${(originX + destX) / 2} ${(originY + destY) / 2 - 50} ${destX} ${destY}`}
                                        fill="none"
                                        stroke="url(#grad-orange)"
                                        strokeWidth="1"
                                        strokeDasharray="1000"
                                        strokeDashoffset="1000"
                                        className="animate-draw-arc"
                                        style={{ opacity: 0.6 }}
                                    />
                                    <circle cx={destX} cy={destY} r="3" className="fill-[#FF6600] animate-pulse" />
                                </g>
                            );
                        })}
                        <defs>
                            <linearGradient id="grad-orange" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#124E35" />
                                <stop offset="100%" stopColor="#FF6600" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Points et Tooltips */}
                    {stats.map((item, idx) => {
                        const isCI = item.country === 'CI';
                        const x = isCI ? 500 : (item.country === 'FR' ? 490 : item.country === 'US' ? 200 : item.country === 'CA' ? 180 : item.country === 'BE' ? 500 : 700);
                        const y = isCI ? 360 : (item.country === 'FR' ? 150 : item.country === 'US' ? 180 : item.country === 'CA' ? 120 : item.country === 'BE' ? 130 : 250);

                        return (
                            <div key={idx} style={{ left: `${x / 10}%`, top: `${y / 5}%` }} className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-30">
                                <div className={`relative flex items-center justify-center rounded-full border-2 border-white shadow-2xl cursor-pointer transition-all hover:scale-150 duration-500 ${isCI ? 'w-10 h-10 bg-[#124E35] ring-4 ring-[#124E35]/20' : 'w-6 h-6 bg-[#FF6600]'}`}>
                                    {isCI ? <Users className="w-5 h-5 text-white" /> : <MapPin className="w-3 h-3 text-white" />}

                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 bg-white dark:bg-[#1A1F1D] rounded-[1.5rem] shadow-2xl p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none border border-gray-100 dark:border-white/10 scale-90 group-hover:scale-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">{item.country === 'CI' ? '🇨🇮' : item.country === 'FR' ? '🇫🇷' : item.country === 'US' ? '🇺🇸' : '🌍'}</span>
                                            <div>
                                                <p className="font-black text-xs text-gray-900 dark:text-white uppercase leading-tight">{item.city}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{getCountryName(item.country)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-2 rounded-xl">
                                            <Users className="w-3 h-3 text-[#FF6600]" />
                                            <span className="text-xs font-black text-gray-900 dark:text-white">{item.count} Membres</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-40">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#124E35] shadow-[0_0_8px_#124E35]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Toa-Zéo (Foyer)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6600] shadow-[0_0_8px_#FF6600]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Rayonnement</span>
                        </div>
                    </div>

                    <style jsx>{`
                        @keyframes draw-arc {
                            to { stroke-dashoffset: 0; }
                        }
                        .animate-draw-arc {
                            animation: draw-arc 2s cubic-bezier(0.445, 0.05, 0.55, 0.95) forwards;
                        }
                    `}</style>
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
