"use client";

import React, { useState, useEffect } from 'react';
import { Globe, MapPin, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import dynamic from 'next/dynamic';

// Import dynamique de Leaflet — évite les erreurs SSR Next.js
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

export interface MigrationMarker {
    country: string;
    city: string;
    count: number;
    members: string[];
    lat?: number;
    lng?: number;
}

// Coordonnées GPS réelles et métadonnées des principales destinations
export const COUNTRY_COORDS: Record<string, { lat: number; lng: number; flag: string; name: string }> = {
    'CI': { lat: 6.805080, lng: -7.329396, flag: '🇨🇮', name: "Côte d'Ivoire" },
    'FR': { lat: 46.2276, lng: 2.2137, flag: '🇫🇷', name: 'France' },
    'US': { lat: 37.0902, lng: -95.7129, flag: '🇺🇸', name: 'États-Unis' },
    'CA': { lat: 56.1304, lng: -106.3468, flag: '🇨🇦', name: 'Canada' },
    'BE': { lat: 50.5039, lng: 4.4699, flag: '🇧🇪', name: 'Belgique' },
    'GB': { lat: 55.3781, lng: -3.4360, flag: '🇬🇧', name: 'Royaume-Uni' },
    'DE': { lat: 51.1657, lng: 10.4515, flag: '🇩🇪', name: 'Allemagne' },
    'SN': { lat: 14.4974, lng: -14.4524, flag: '🇸🇳', name: 'Sénégal' },
    'CM': { lat: 7.3697, lng: 12.3547, flag: '🇨🇲', name: 'Cameroun' },
    'MA': { lat: 31.7917, lng: -7.0926, flag: '🇲🇦', name: 'Maroc' },
    'GN': { lat: 9.9456, lng: -11.1874, flag: '🇬🇳', name: 'Guinée' },
    'BF': { lat: 12.3641, lng: -1.5275, flag: '🇧🇫', name: 'Burkina Faso' },
    'ML': { lat: 17.5707, lng: -3.9962, flag: '🇲🇱', name: 'Mali' },
    'GH': { lat: 7.9465, lng: -1.0232, flag: '🇬🇭', name: 'Ghana' },
};

export default function MigrationMap() {
    const [stats, setStats] = useState<MigrationMarker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchMigrationData();
    }, []);

    const fetchMigrationData = async () => {
        setIsLoading(true);
        try {
            // Récupérer UNIQUEMENT les membres validés (confirmed) avec leur localisation réelle
            const { data, error } = await supabase
                .from('profiles')
                .select('residence_country, residence_city, first_name, last_name')
                .eq('status', 'confirmed');

            if (error) throw error;

            // Regrouper par pays/ville puis enrichir avec les coordonnées GPS
            const groups: Record<string, MigrationMarker> = {};
            (data || []).forEach(p => {
                const countryCode = (p.residence_country || 'CI').toUpperCase();
                const cityKey = p.residence_city || 'Ville inconnue';
                const key = `${countryCode}-${cityKey}`;

                if (!groups[key]) {
                    const coords = COUNTRY_COORDS[countryCode];
                    groups[key] = {
                        country: countryCode,
                        city: cityKey,
                        count: 0,
                        members: [],
                        // Coordonnées GPS réelles du pays/ville
                        lat: coords?.lat,
                        lng: coords?.lng,
                    };
                }
                groups[key].count += 1;
                groups[key].members.push(`${p.first_name || ''} ${p.last_name || ''}`.trim());
            });

            let result = Object.values(groups).sort((a, b) => b.count - a.count);

            // Afficher Toa-Zéo comme point d'origine même si aucune donnée
            if (result.length === 0) {
                result = [{ country: 'CI', city: 'Toa-Zéo (Origine)', count: 0, members: [], lat: 7.5400, lng: -5.5471 }];
            }

            setStats(result);
        } catch (err) {
            console.error('[MigrationMap] Erreur chargement:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="py-12 bg-white dark:bg-black rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="px-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#FF6600]/10 text-[#FF6600] rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Carte des Migrations</h2>
                        <p className="text-sm text-gray-600 font-medium">Rayonnement de Toa-Zéo à travers le monde</p>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Seuls les membres certifiés par le CHO sont affichés. Les données sont basées sur la localisation déclarée lors de l'inscription.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
                {/* ─── Carte Leaflet OpenStreetMap (vraie carte monde) ─── */}
                <div className="lg:col-span-2 relative rounded-[2rem] overflow-hidden min-h-[450px] border border-gray-200 shadow-xl">
                    {isLoading ? (
                        <div className="w-full h-[450px] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-2 border-[#FF6600] border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-medium text-white/60">Chargement de la carte…</p>
                            </div>
                        </div>
                    ) : (
                        <LeafletMap markers={stats} />
                    )}

                    {/* Légende superposée */}
                    <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[500]">
                        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-full border border-gray-100 shadow-lg">
                            <div className="w-3 h-3 rounded-full bg-[#124E35]" />
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Toa-Zéo (Foyer)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-full border border-gray-100 shadow-lg">
                            <div className="w-3 h-3 rounded-full bg-[#FF6600]" />
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Diaspora confirmée</span>
                        </div>
                    </div>
                </div>

                {/* ─── Liste des destinations ─── */}
                <div className="space-y-3">
                    <h3 className="font-black text-sm uppercase tracking-widest text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#FF6600]" /> Top Destinations
                    </h3>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : stats.length === 1 && stats[0].count === 0 ? (
                        <div className="p-5 text-center bg-orange-50 rounded-2xl border border-orange-100">
                            <p className="text-sm font-bold text-[#FF6600]">Aucun membre certifié pour l'instant.</p>
                            <p className="text-xs text-gray-600 mt-1">Les membres validés par le CHO apparaîtront ici.</p>
                        </div>
                    ) : (
                        stats.map((item, idx) => {
                            const meta = COUNTRY_COORDS[item.country];
                            return (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-[#FF6600]/20 rounded-2xl transition-all group overflow-hidden relative cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm border border-gray-100 flex-shrink-0">
                                            {meta?.flag || '🌍'}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-gray-900 leading-tight">{item.city}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{meta?.name || item.country}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center gap-1 justify-end">
                                            <span className="text-base font-black text-[#FF6600]">{item.count}</span>
                                            <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#FF6600] transition-colors" />
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Membres</p>
                                    </div>
                                    {stats[0]?.count > 0 && (
                                        <div
                                            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#FF6600]/30 to-[#FF6600]/5 transition-all duration-1000"
                                            style={{ width: `${(item.count / stats[0].count) * 100}%` }}
                                        />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
