"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Search, Filter, Users, MapPin, Briefcase, ArrowLeft } from 'lucide-react';
import MemberCard from '@/components/MemberCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AnnuairePage() {
    const supabase = createClient();
    const router = useRouter();
    const [members, setMembers] = useState<any[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filtres Actifs
    const [activeFilter, setActiveFilter] = useState<'All' | 'Diaspora' | 'Local' | 'Gbeya' | 'Bonye'>('All');

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            // Vérification du statut confirmé (Admin, CHO, User Confirmé)
            const { data: profile } = await supabase.from('profiles').select('status, role').eq('id', session.user.id).single();
            if (profile?.status !== 'confirmed' && profile?.role !== 'admin' && profile?.role !== 'cho') {
                alert("Votre profil n'est pas encore validé. L'accès à l'annuaire est restreint.");
                router.push('/dashboard');
                return;
            }

            fetchMembers();
        };

        checkAuthAndFetch();
    }, [router, supabase]);

    const fetchMembers = async () => {
        setIsLoading(true);
        // On récupère tous les profils validés
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id, first_name, last_name, avatar_url, emploi, fonction, 
                niveau_etudes, residence_city, residence_country, quartier_nom, 
                whatsapp_1, is_deceased, disease_type, status, role
            `)
            .in('status', ['confirmed'])
            .or('role.eq.cho,role.eq.admin')
            .order('last_name', { ascending: true });

        if (error) {
            console.error('Erreur annuaire:', error);
        } else if (data) {
            setMembers(data);
            setFilteredMembers(data);
        }
        setIsLoading(false);
    };

    // Moteur de recherche et de filtres combinés
    useEffect(() => {
        let result = members;

        // 1. Filtrage Textuel (Nom, Prénom, Métier, Ville)
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(m =>
                (m.first_name && m.first_name.toLowerCase().includes(lowerSearch)) ||
                (m.last_name && m.last_name.toLowerCase().includes(lowerSearch)) ||
                (m.emploi && m.emploi.toLowerCase().includes(lowerSearch)) ||
                (m.residence_city && m.residence_city.toLowerCase().includes(lowerSearch))
            );
        }

        // 2. Filtrage Rapide (Pastilles)
        // residence_country est un code pays (CI, FR, US, ...) sauvegardé à l'inscription
        if (activeFilter === 'Diaspora') {
            result = result.filter(m => m.residence_country && m.residence_country !== 'CI');
        } else if (activeFilter === 'Local') {
            result = result.filter(m => !m.residence_country || m.residence_country === 'CI');
        } else if (activeFilter === 'Gbeya') {
            result = result.filter(m => m.quartier_nom === 'Gbéya');
        } else if (activeFilter === 'Bonye') {
            result = result.filter(m => m.quartier_nom === 'Bonyé');
        }

        setFilteredMembers(result);
    }, [searchTerm, activeFilter, members]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-20">
            {/* Header / Navbar simplifiée */}
            <header className="fixed top-0 w-full bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex justify-between items-center z-50 shadow-sm">
                <div className="flex items-center gap-5">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#FF6600] transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
                    </Link>
                </div>
            </header>

            <main className="pt-24 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                        L'Annuaire Intelligent 📖
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Recherchez un membre, un talent ou un contact au sein de la famille Racines+.</p>
                </div>

                {/* Section Recherche & Filtres */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 mb-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

                    {/* Barre de recherche large */}
                    <div className="relative w-full max-w-xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Ex: 'Avoué', 'Paris', 'Étudiant', 'Gbéya'..."
                            className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold placeholder-gray-400 focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600] transition-all"
                        />
                    </div>

                    {/* Pastilles de filtres (Mix UX) */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => setActiveFilter('All')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeFilter === 'All' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            <Users className="w-4 h-4" /> Tous ({members.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('Diaspora')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeFilter === 'Diaspora' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                            ✈️ Diaspora
                        </button>
                        <button
                            onClick={() => setActiveFilter('Local')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeFilter === 'Local' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                        >
                            <MapPin className="w-4 h-4" /> Côte d'Ivoire
                        </button>
                        <button
                            onClick={() => setActiveFilter('Gbeya')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeFilter === 'Gbeya' ? 'bg-[#FF6600] text-white' : 'bg-[#FF6600]/10 text-[#FF6600] hover:bg-[#FF6600]/20'}`}
                        >
                            📍 Quartier Gbéya
                        </button>
                        <button
                            onClick={() => setActiveFilter('Bonye')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeFilter === 'Bonye' ? 'bg-[#124E35] text-white' : 'bg-[#124E35]/10 text-[#124E35] hover:bg-[#124E35]/20'}`}
                        >
                            📍 Quartier Bonyé
                        </button>
                    </div>
                </div>

                {/* Grille de Résultats */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 font-bold">Recherche dans l'arbre...</p>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <Filter className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-black text-gray-900 mb-2">Aucun membre trouvé</h3>
                        <p className="text-gray-500 font-medium">Testez d'autres mots-clés ou modifiez vos filtres.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setActiveFilter('All'); }}
                            className="mt-6 px-6 py-2.5 bg-gray-100 font-bold text-gray-900 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Réinitialiser la recherche
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                        {filteredMembers.map(member => (
                            <MemberCard key={member.id} member={member} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
