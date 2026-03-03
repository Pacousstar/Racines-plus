"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Heart, PartyPopper, PlusCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateEventModal from '@/components/CreateEventModal';

interface FamilyEvent {
    id: string;
    titre: string;
    type_evenement: 'reunion' | 'mariage' | 'obseques' | 'fete_generation' | 'autre';
    date_evenement: string;
    lieu: string;
    description: string;
    organisateur_id: string;
    organisateur_nom?: string;
}

export default function EvenementsPage() {
    const supabase = createClient();
    const router = useRouter();
    const [events, setEvents] = useState<FamilyEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'tous' | 'reunion' | 'mariage' | 'obseques'>('tous');
    const [userStatus, setUserStatus] = useState('pending');
    const [userRole, setUserRole] = useState('user');
    const [currentUserId, setCurrentUserId] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }

        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase.from('profiles').select('status, role, first_name, last_name').eq('id', session.user.id).single();
        setUserStatus(profile?.status || 'pending');
        setUserRole(profile?.role || 'user');

        const { data: eventsData, error } = await supabase
            .from('family_events')
            .select(`
                id, titre, type_evenement, date_evenement, lieu, description, organisateur_id,
                profiles:organisateur_id (first_name, last_name)
            `)
            .order('date_evenement', { ascending: true });

        if (error) {
            console.error("Erreur de chargement des évènements", error);
        } else if (eventsData) {
            const formattedEvents = eventsData.map((e: any) => ({
                ...e,
                organisateur_nom: e.profiles ? `${e.profiles.first_name || ''} ${e.profiles.last_name || ''}`.trim() : 'Inconnu'
            }));
            setEvents(formattedEvents);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [router, supabase]);

    const getEventConfig = (type: string) => {
        switch (type) {
            case 'mariage': return { color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', icon: <Heart className="w-5 h-5" />, label: 'Mariage' };
            case 'obseques': return { color: 'text-gray-900', bg: 'bg-gray-100', border: 'border-gray-300', icon: <Clock className="w-5 h-5" />, label: 'Obsèques' };
            case 'reunion': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Users className="w-5 h-5" />, label: 'Réunion' };
            case 'fete_generation': return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: <PartyPopper className="w-5 h-5" />, label: 'Fête de Génération' };
            default: return { color: 'text-[#FF6600]', bg: 'bg-orange-50', border: 'border-orange-200', icon: <Calendar className="w-5 h-5" />, label: 'Autre' };
        }
    };

    const filteredEvents = events.filter(e => activeFilter === 'tous' || e.type_evenement === activeFilter);
    const now = new Date();
    const upcomingEvents = filteredEvents.filter(e => new Date(e.date_evenement) >= now);
    const pastEvents = filteredEvents.filter(e => new Date(e.date_evenement) < now);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-20">
            {/* Navbar simplifiée */}
            <header className="fixed top-0 w-full bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex justify-between items-center z-50 shadow-sm">
                <div className="flex items-center gap-5">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#FF6600] transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
                    </Link>
                </div>
                <div>
                    {(userRole === 'admin' || userRole === 'cho') && (
                        <button
                            className="flex items-center gap-2 text-sm font-bold bg-[#FF6600] text-white px-4 py-2 rounded-xl hover:bg-[#e55c00] transition-all shadow-md shadow-[#FF6600]/20"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <PlusCircle className="w-4 h-4" /> Créer un évènement
                        </button>
                    )}
                </div>
            </header>

            <main className="pt-24 px-4 sm:px-6 max-w-5xl mx-auto">
                <div className="mb-10 text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-3xl mb-2">
                        <Calendar className="w-8 h-8 text-[#FF6600]" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                        Agenda <span className="text-[#FF6600]">Familial</span>
                    </h1>
                    <p className="text-gray-600 max-w-xl mx-auto font-medium text-sm md:text-base">
                        Restez connectés aux grands moments de votre lignée. Réunions, mariages, fêtes ou recueillements. Tout passe par ici.
                    </p>
                </div>

                {/* Filtres Rapides */}
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-10">
                    <button
                        onClick={() => setActiveFilter('tous')}
                        className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all ${activeFilter === 'tous' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setActiveFilter('mariage')}
                        className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${activeFilter === 'mariage' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'bg-white text-pink-600 hover:bg-pink-50 border border-pink-100'}`}
                    >
                        <Heart className="w-4 h-4" /> Mariages
                    </button>
                    <button
                        onClick={() => setActiveFilter('obseques')}
                        className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${activeFilter === 'obseques' ? 'bg-gray-800 text-white shadow-lg' : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'}`}
                    >
                        <Clock className="w-4 h-4" /> Obsèques
                    </button>
                    <button
                        onClick={() => setActiveFilter('reunion')}
                        className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${activeFilter === 'reunion' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-100'}`}
                    >
                        <Users className="w-4 h-4" /> Réunions
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin mb-4" />
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* Section À Venir */}
                        <div>
                            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-2 h-8 rounded-full bg-[#FF6600]"></span> Prochainement
                            </h2>
                            {upcomingEvents.length === 0 ? (
                                <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm">
                                    <p className="text-gray-500 font-medium italic">Rien de prévu pour le moment dans cette catégorie.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
                                    {upcomingEvents.map(event => {
                                        const config = getEventConfig(event.type_evenement);
                                        const eventDate = new Date(event.date_evenement);
                                        return (
                                            <div key={event.id} className={`bg-white rounded-[2rem] p-6 border ${config.border} shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col`}>
                                                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${config.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`} />

                                                <div className="relative z-10 flex gap-4 mb-4">
                                                    <div className={`w-14 h-14 rounded-2xl ${config.bg} ${config.color} flex flex-col items-center justify-center shadow-inner border border-white shrink-0`}>
                                                        <span className="text-xs font-bold uppercase">{eventDate.toLocaleString('fr-FR', { month: 'short' })}</span>
                                                        <span className="text-xl font-black">{eventDate.getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${config.color} mb-1 flex items-center gap-1`}>
                                                            {config.icon} {config.label}
                                                        </div>
                                                        <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-[#FF6600] transition-colors">{event.titre}</h3>
                                                    </div>
                                                </div>

                                                <div className="relative z-10 space-y-2 mb-6 flex-grow">
                                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                        <span className="font-medium">{event.lieu}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2 text-sm text-gray-500">
                                                        <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                        <span>{eventDate.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    {event.description && (
                                                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-50 italic">
                                                            "{event.description}"
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="relative z-10 mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">Org: <span className="font-bold text-gray-700">{event.organisateur_nom}</span></span>
                                                    <button className={`w-10 h-10 rounded-xl ${config.bg} ${config.color} flex items-center justify-center hover:bg-gray-900 hover:text-white transition-colors`}>
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Section Passés */}
                        {pastEvents.length > 0 && (
                            <div className="opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                <h2 className="text-lg font-black text-gray-500 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-6 rounded-full bg-gray-300"></span> Événements passés
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {pastEvents.map(event => {
                                        const eventDate = new Date(event.date_evenement);
                                        return (
                                            <div key={event.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-[9px] font-bold uppercase">{eventDate.toLocaleString('fr-FR', { month: 'short' })}</span>
                                                    <span className="text-sm font-black">{eventDate.getDate()}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-700 text-sm line-clamp-1">{event.titre}</h3>
                                                    <p className="text-[10px] text-gray-400 truncate">{event.lieu}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => { setIsCreateModalOpen(false); loadData(); }}
                organisateurId={currentUserId}
            />
        </div>
    );
}
