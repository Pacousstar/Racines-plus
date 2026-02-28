import React, { useEffect, useState } from 'react';
import { X, User, Crown, MapPin, Calendar, Activity, ShieldCheck, AlertTriangle, AlertCircle, Clock, Table } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export interface AncestorModalData {
    id: string;
    nom: string;
    roleOuLien: string;
    periodeOuNaissance?: string;
    village?: string;
    quartier?: string;
    status: string;
    isDeceased?: boolean;
    isVictim2010?: boolean;
    isCertified?: boolean;
    type?: 'ancetre' | 'self' | 'other';
}

interface AncestorDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    person: AncestorModalData | null;
}

export default function AncestorDetailsModal({ isOpen, onClose, person }: AncestorDetailsModalProps) {
    const supabase = createClient();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

    useEffect(() => {
        const fetchAvatar = async () => {
            if (!person || person.isDeceased || person.type === 'ancetre') {
                setAvatarUrl(null);
                return;
            }
            setIsLoadingAvatar(true);
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', person.id)
                    .single();
                if (data?.avatar_url) {
                    setAvatarUrl(data.avatar_url);
                }
            } catch (error) {
                console.error("Erreur chargement avatar modal:", error);
            } finally {
                setIsLoadingAvatar(false);
            }
        };

        if (isOpen && person) {
            fetchAvatar();
        }
    }, [isOpen, person, supabase]);

    if (!isOpen || !person) return null;

    const isAncestor = person.type === 'ancetre' || person.roleOuLien.toLowerCase().includes('fondateur');

    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
        confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: <ShieldCheck className="w-4 h-4" />, label: 'Confirmé (Bascule Patrimoniale)' },
        probable: { bg: 'bg-orange-100', text: 'text-orange-700', icon: <AlertTriangle className="w-4 h-4" />, label: 'Probable (Validé CHOa)' },
        pending: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Clock className="w-4 h-4" />, label: 'En attente de validation' },
        rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle className="w-4 h-4" />, label: 'Rejeté' },
        declarative: { bg: 'bg-stone-100', text: 'text-stone-500', icon: <Table className="w-4 h-4" />, label: 'Donnée Déclarative' }
    };

    const s = statusConfig[person.status] || statusConfig.pending;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-foreground">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                {/* Header (Bandeau de couleur contextuel) */}
                <div className={`h-24 relative ${person.isDeceased ? 'bg-gray-200 grayscale-[30%]' : isAncestor ? 'bg-gradient-to-r from-amber-200 to-orange-300' : 'bg-gradient-to-r from-[#FF6600]/20 to-[#FF6600]/40'}`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-black/60 hover:text-black transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {person.isDeceased && person.isVictim2010 && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                            Mémorial 2010
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6 relative">
                    {/* Avatar superposé */}
                    <div className="flex justify-center -mt-12 mb-4">
                        <div className={`w-24 h-24 rounded-[2rem] border-4 border-white shadow-lg flex items-center justify-center bg-white overflow-hidden
                            ${person.isDeceased ? 'bg-gray-100' : isAncestor ? 'bg-amber-50' : 'bg-orange-50'}
                        `}>
                            {isLoadingAvatar ? (
                                <div className="w-6 h-6 border-2 border-[#FF6600] border-t-transparent flex-shrink-0 rounded-full animate-spin" />
                            ) : avatarUrl ? (
                                <img src={avatarUrl} alt={person.nom} className="w-full h-full object-cover" />
                            ) : isAncestor ? (
                                <Crown className={`w-12 h-12 ${person.isDeceased ? 'text-text-muted' : 'text-amber-500'}`} />
                            ) : (
                                <User className={`w-12 h-12 ${person.isDeceased ? 'text-text-muted' : 'text-[#FF6600]'}`} />
                            )}
                        </div>
                    </div>

                    {/* Informations Principales */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-black mb-1">{person.nom}</h2>
                        <p className={`text-sm font-semibold ${isAncestor ? 'text-amber-600' : 'text-text-muted'}`}>
                            {person.roleOuLien}
                        </p>
                    </div>

                    {/* Lignes d'informations */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">État Civil</p>
                                <p className="text-sm font-semibold text-gray-700 border-gray-600">
                                    {person.isDeceased ? 'Décédé' : 'Vivant'}
                                </p>
                            </div>
                        </div>

                        {(person.village || person.quartier) && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Origine Territoriale</p>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {person.village || 'Village Inconnu'}
                                        {person.quartier ? ` • ${person.quartier}` : ''}
                                    </p>
                                </div>
                            </div>
                        )}

                        {person.periodeOuNaissance && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                    <Calendar className="w-4 h-4 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Période / Naissance</p>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {person.periodeOuNaissance}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statut de Validation */}
                    <div className="mt-4">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-1">Statut d&apos;intégration au graphe</p>
                        <div className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 border transition-colors ${s.bg} border-white/0 shadow-sm`}>
                            <div className={`w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 ${s.text}`}>
                                {s.icon}
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${s.text}`}>{s.label}</p>
                                <p className={`text-xs mt-0.5 opacity-80 ${s.text}`}>
                                    {person.status === 'confirmed'
                                        ? "Cet ancêtre est verrouillé de façon permanent dans le registre."
                                        : person.status === 'probable'
                                            ? "Données validées par l'adjoint de quartier, attente décision CHO."
                                            : "Processus d'investigation généalogique en cours."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footnote Certification spécifique CHO */}
                    {isAncestor && person.isCertified && (
                        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 py-2 rounded-xl">
                            <Crown className="w-3.5 h-3.5" /> Entité Ancestrale Fondatrice Officiellement Certifiée
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
