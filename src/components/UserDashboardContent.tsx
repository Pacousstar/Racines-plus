"use client";
/**
 * REVISION: 2026-02-26-T16-30-FIX-PROPS
 * Dashboard Utilisateur - Composant central de gestion de l'arbre et du profil.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    User, Bell, Share2, ShieldCheck, MapPin, Plus, CheckCircle,
    AlertTriangle, Camera, Clock, XCircle, Users, Search, Calendar
} from 'lucide-react';
import Link from 'next/link';
import AddAncestorModal from '@/components/AddAncestorModal';
import ChooseAncetreModal from '@/components/ChooseAncetreModal';
import InviteModal from '@/components/InviteModal';
import TreeSpecimens from '@/components/TreeSpecimens';
import EditProfileModal, { ExtendedProfileData } from '@/components/EditProfileModal';
import PersonalLineageTree from '@/components/PersonalLineageTree';
import MigrationMap from '@/components/MigrationMap';
import DocumentManager from '@/components/DocumentManager';
import MediaGallery from '@/components/MediaGallery';
import { createClient } from '@/lib/supabase';

interface ProfileData {
    firstName: string;
    lastName: string;
    village: string;
    quartier: string;
    status: string;
    role: string;
    avatarUrl: string | null;
    ancestralRootId: string | null;
    extendedData: ExtendedProfileData;
    metadata: any;
}

interface UserDashboardContentProps {
    userId: string;
    activeSection?: 'arbre' | 'migration';
}

export default function UserDashboardContent({ userId, activeSection = 'arbre' }: UserDashboardContentProps) {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'arbre' | 'specimens' | 'archives' | 'medias' | 'notifications'>(activeSection === 'migration' ? 'arbre' : 'arbre');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isChooseAncetreOpen, setIsChooseAncetreOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [selectedAncetre, setSelectedAncetre] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [invitesCount, setInvitesCount] = useState(0);
    const photoInputRef = useRef<HTMLInputElement>(null);


    const fetchProfile = async () => {
        // Ne pas mettre isLoading à true si on a déjà des données pour éviter le clignotement
        if (!profileData) setIsLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, gender, birth_date, niveau_etudes, diplomes, emploi, fonction, retraite, nombre_enfants, details_enfants, consentement_enfants, adresse_residence, residence_city, residence_country, phone_1, phone_2, whatsapp_1, whatsapp_2, village_origin, quartier_nom, status, role, avatar_url, ancestral_root_id, metadata')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[UserDashboardContent] Error fetching profile:', error);
        }

        if (data) {
            console.log('[UserDashboardContent] Profile data found:', data);

            // Si le prénom et le nom sont vides dans la table profiles, on peut tenter de récupérer du user session ou mettre des valeurs par défaut
            const fName = data.first_name || '';
            const lName = data.last_name || '';

            setProfileData({
                firstName: fName,
                lastName: lName,
                village: data.village_origin || 'Toa-Zéo',
                quartier: data.quartier_nom || '',
                status: data.status || 'pending',
                role: data.role || 'user',
                avatarUrl: data.avatar_url || null,
                ancestralRootId: data.ancestral_root_id || null,
                metadata: data.metadata || {},
                extendedData: {
                    firstName: fName,
                    lastName: lName,
                    gender: data.gender || '',
                    birthDate: data.birth_date || '',
                    niveauEtudes: data.niveau_etudes || '',
                    diplomes: data.diplomes || '',
                    emploi: data.emploi || '',
                    fonction: data.fonction || '',
                    retraite: data.retraite || false,
                    nombreEnfants: data.nombre_enfants || 0,
                    detailsEnfants: data.details_enfants || [],
                    consentementEnfants: data.consentement_enfants || false,
                    adresseResidence: data.adresse_residence || '',
                    residenceCity: data.residence_city || '',
                    residenceCountry: data.residence_country || 'CI',
                    phone1: data.phone_1 || '',
                    phone2: data.phone_2 || '',
                    whatsapp1: data.whatsapp_1 || '',
                    whatsapp2: data.whatsapp_2 || '',
                    village_origin: data.village_origin || '',
                    quartier_nom: data.quartier_nom || '',
                    metadata: data.metadata || {}
                }
            });

            const { count, error: countError } = await supabase
                .from('invitations')
                .select('*', { count: 'exact', head: true })
                .eq('inviter_id', userId);

            if (countError) console.error('[UserDashboardContent] Error counting invites:', countError);
            setInvitesCount(count || 0);
        } else {
            console.warn('[UserDashboardContent] No profile data for userId:', userId);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (userId) fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingPhoto(true);

        try {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const filePath = `${userId}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.warn('Erreur upload photo :', uploadError.message);
                alert("L'upload de la photo a échoué. Vérifiez vos permissions.");
                return;
            }

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
            setProfileData(prev => prev ? { ...prev, avatarUrl: publicUrl } : prev);
        } catch (err) {
            console.warn('Erreur photo:', err);
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const map: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
            confirmed: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', label: 'Profil Certifié ✅', icon: <CheckCircle className="w-3.5 h-3.5" /> },
            probable: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'Validation probable 🟠', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
            rejected: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Profil rejeté — à corriger', icon: <XCircle className="w-3.5 h-3.5" /> },
            pending: { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'En attente CHO ⚫', icon: <Clock className="w-3.5 h-3.5" /> },
        };
        const s = map[status] || map['pending'];
        return (
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${s.bg} ${s.color}`}>
                {s.icon} {s.label}
            </span>
        );
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-6 px-4">

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Gauche */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    {/* Carte Profil */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Bannière orange — Charte graphique Racines+ : TOUJOURS orange, sans exception */}
                        <div className="h-16 bg-gradient-to-r from-[#FF6600] to-amber-500"></div>
                        <div className="relative px-6 pb-6">
                            <div className="relative -mt-10 mb-4 w-fit mx-auto">
                                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {profileData?.avatarUrl
                                        ? <img src={profileData.avatarUrl} alt="Photo de profil" className="object-cover w-full h-full" />
                                        : <User className="w-10 h-10 text-gray-400" />
                                    }
                                </div>
                                <button
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={isUploadingPhoto}
                                    title="Changer la photo"
                                    className="absolute bottom-0 right-0 w-7 h-7 bg-[#FF6600] hover:bg-[#e55c00] text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                                >
                                    {isUploadingPhoto ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                </button>
                                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </div>
                            <div className="text-center">
                                <h2 className="text-lg font-bold leading-tight">
                                    {isLoading
                                        ? <span className="inline-block w-32 h-5 bg-gray-200 rounded animate-pulse" />
                                        : (profileData?.firstName || profileData?.lastName
                                            ? `${profileData.firstName} ${profileData.lastName}`.trim()
                                            : <span className="text-gray-400 italic text-sm">Profil incomplet</span>
                                        )
                                    }
                                </h2>
                                <p className="text-sm text-gray-600 flex items-center gap-1 justify-center mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {profileData?.village || 'Toa-Zéo'}
                                </p>
                                <div className="mt-3 flex justify-center">
                                    {isLoading ? <span className="inline-block w-28 h-6 bg-gray-200 rounded-full animate-pulse" /> : <StatusBadge status={profileData?.status || 'pending'} />}
                                </div>
                                <div className="mt-3 flex justify-center">
                                    {/* Badge 'NŒUD FONDATEUR' uniquement pour les is_founder=true ou rôles spéciaux */}
                                    {(profileData?.role === 'admin' || profileData?.role === 'cho' || profileData?.role === 'choa') && (
                                        <span className="bg-[#FF6600]/10 text-[#FF6600] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                            {profileData.role === 'admin' ? '👑 Administrateur' : profileData.role === 'cho' ? '🌳 Chef Héritage' : '🛡️ Assistant CHO'}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsEditProfileOpen(true)}
                                    className="mt-4 text-xs font-semibold text-[#FF6600] border border-[#FF6600]/30 bg-[#FF6600]/5 px-3 py-1.5 rounded-lg hover:bg-[#FF6600]/10 transition-colors"
                                >
                                    Fiche détaillée (Informations déclaratives) 📝
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex flex-col gap-3">
                        {/* Section Invitation Premium */}
                        <div className="bg-white border text-center border-[#FF6600]/20 hover:border-[#FF6600]/40 rounded-3xl p-5 shadow-sm transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:scale-110 transition-transform">
                                <Share2 className="w-12 h-12 text-[#FF6600]" />
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-[#FF6600] uppercase tracking-widest bg-[#FF6600]/5 px-2 py-0.5 rounded-full">Réseau Familial</span>
                                <span className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
                                    <Users className="w-3 h-3" /> {invitesCount}
                                </span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 mb-2">Agrandissez l&apos;Arbre</h4>
                            <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">Invitez vos membres de famille ({invitesCount} déjà invités) pour compléter votre lignée.</p>
                            <button onClick={() => setIsInviteOpen(true)} className="w-full bg-[#FF6600] hover:bg-[#e55c00] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#FF6600]/20">
                                <Share2 className="w-3.5 h-3.5" /> Inviter ma famille
                            </button>
                        </div>

                        {/* Section Annuaire Intelligent */}
                        <div className="bg-white border text-center border-indigo-200 hover:border-indigo-400 rounded-3xl p-5 shadow-sm transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:scale-110 transition-transform">
                                <Search className="w-12 h-12 text-indigo-600" />
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">Nouveau</span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 mb-2">L&apos;Annuaire Intelligent</h4>
                            <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">Recherchez des talents, des métiers ou des contacts dans la Diaspora.</p>
                            <Link href="/annuaire" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20">
                                <Search className="w-3.5 h-3.5" /> Ouvrir l&apos;Annuaire
                            </Link>
                        </div>

                        {/* Section Agenda & Événements */}
                        <div className="bg-white border text-center border-emerald-200 hover:border-emerald-400 rounded-3xl p-5 shadow-sm transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:scale-110 transition-transform">
                                <Calendar className="w-12 h-12 text-emerald-600" />
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">Communauté</span>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 mb-2">Agenda & Événements</h4>
                            <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">Suivez les réunions, mariages, obsèques et grands moments de la famille.</p>
                            <Link href="/evenements" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20">
                                <Calendar className="w-3.5 h-3.5" /> Voir l&apos;Agenda
                            </Link>
                        </div>
                    </div>

                    <div className="bg-green-800 text-white p-5 rounded-3xl">
                        <div className="flex items-center gap-2 mb-3 text-green-200">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="font-bold text-sm">IA de Racines+</span>
                            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse ml-auto"></span>
                        </div>
                        <p className="text-sm text-green-100/80 mb-4 leading-relaxed">
                            L&apos;IA analyse vos données et vous suggère des liens de parenté probables.
                        </p>
                        <div className="mb-4 p-3 bg-green-900/40 rounded-xl border border-green-700/50">
                            <p className="text-[10px] text-green-300 font-medium leading-tight">
                                ⚠️ Seules les données issues de l&apos;onboarding initial sont soumises à la certification officielle du CHO. Les ajouts via la "Fiche détaillée" (enfants, etc.) sont portés à titre informatif et déclaratif.
                            </p>
                        </div>
                        <button onClick={() => alert("Analyse IA : Fonctionnalité en cours d'intégration.")} className="text-xs font-bold uppercase tracking-wider bg-white text-green-800 px-4 py-2 rounded-lg hover:bg-green-50 w-full transition-colors">
                            Voir l&apos;analyse
                        </button>
                    </div>
                </div>

                {/* Zone Centrale */}
                <div className="flex-1">
                    {/* Navigation Interne UI Mode */}
                    <div className="flex gap-4 border-b border-gray-200 mb-6">
                        <button
                            onClick={() => setActiveTab('arbre')}
                            className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'arbre' ? 'text-[#FF6600] border-b-2 border-[#FF6600]' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Mon Arbre Connecté
                        </button>
                        <button
                            onClick={() => setActiveTab('specimens')}
                            className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'specimens' ? 'text-[#FF6600] border-b-2 border-[#FF6600]' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Spécimens Validés
                        </button>
                        <button
                            onClick={() => setActiveTab('archives')}
                            className={`pb-2 text-sm font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'archives' ? 'text-[#FF6600] border-b-2 border-[#FF6600]' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Archives
                        </button>
                        <button
                            onClick={() => setActiveTab('medias')}
                            className={`pb-2 text-sm font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'medias' ? 'text-[#FF6600] border-b-2 border-[#FF6600]' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Souvenirs Vidéo/Photo
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`pb-2 text-sm font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'notifications' ? 'text-[#FF6600] border-b-2 border-[#FF6600]' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Validations <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">1</span>
                        </button>
                    </div>

                    {activeTab === 'arbre' && activeSection === 'arbre' && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Mon Arbre Connecté</h1>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className="text-sm font-bold text-[#FF6600] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                                            Lignée : {isLoading ? '...' : (profileData?.firstName && profileData?.lastName ? `${profileData.firstName} ${profileData.lastName}` : 'Mon Profil')}
                                        </span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                        <span className="text-sm font-medium text-gray-600 lowercase italic">
                                            Réseau de {profileData?.village || 'Toa-Zéo'}
                                        </span>
                                    </div>
                                </div>
                                <StatusBadge status={profileData?.status || 'pending'} />
                            </div>

                            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden relative">
                                {profileData?.status === 'confirmed' && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-racines-green" />}
                                <PersonalLineageTree userId={userId} villageNom={profileData?.village || 'Toa-Zéo'} />
                                {!profileData?.ancestralRootId && !isLoading && (
                                    <div className="border-t border-gray-50 px-6 py-5 flex flex-col md:flex-row justify-center items-center gap-3 bg-gray-50/50">
                                        <button onClick={() => setIsChooseAncetreOpen(true)} className="bg-[#FF6600] hover:bg-[#e55c00] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#FF6600]/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Relier à mon Ancêtre Fondateur
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'specimens' && activeSection === 'arbre' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Spécimens Validés</h1>
                                    <p className="text-sm text-gray-600 mt-1">Explorez les différents styles de visualisation pour votre héritage.</p>
                                </div>
                            </div>
                            <TreeSpecimens
                                userName={profileData?.firstName && profileData?.lastName ? `${profileData.firstName} ${profileData.lastName}`.trim() : 'Votre Arbre'}
                                userStatus={profileData?.status || 'pending'}
                                userRole={profileData?.role}
                            />
                        </div>
                    )}

                    {activeTab === 'archives' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <DocumentManager userId={userId} />
                        </div>
                    )}

                    {activeTab === 'medias' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <MediaGallery userId={userId} />
                        </div>
                    )}

                    {activeSection === 'migration' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Rayonnement de la Diaspora</h1>
                                    <p className="text-sm text-gray-600 mt-1">Où vivent les enfants de {profileData?.village || 'Toa-Zéo'} ?</p>
                                </div>
                            </div>
                            <MigrationMap />
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                            <div className={`rounded-2xl p-5 border flex items-start gap-4 ${profileData?.status === 'confirmed' ? 'bg-green-50 border-green-200' : profileData?.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                                <div className={`p-2 rounded-full ${profileData?.status === 'confirmed' ? 'bg-green-100 text-green-600' : profileData?.status === 'rejected' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                                    {profileData?.status === 'confirmed' ? <CheckCircle className="w-5 h-5" /> : profileData?.status === 'rejected' ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold">Statut de votre profil</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {profileData?.status === 'confirmed' && "Votre profil a été certifié par le CHO de Toa-Zéo. Vos données sont désormais verrouillées et protégées."}
                                        {profileData?.status === 'rejected' && "Votre profil a été rejeté par le CHO. Vérifiez vos informations et resoumettez votre demande."}
                                        {(!profileData?.status || profileData?.status === 'pending') && "Votre profil est en attente d'examen par le Chief Heritage Officer (CHO) de Toa-Zéo."}
                                        {profileData?.status === 'probable' && "Votre profil est en cours de validation par un CHOa. La décision finale appartient au CHO."}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-sm mt-4">
                                <div className="p-4 flex gap-4 items-start bg-orange-50/50 hover:bg-orange-50 transition-colors">
                                    <div className="mt-1 bg-orange-100 text-orange-600 p-2 rounded-full flex-shrink-0"><AlertTriangle className="w-5 h-5" /></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between flex-wrap gap-1">
                                            <h4 className="font-bold text-foreground text-sm">Doublon Probable Détecté</h4>
                                            <span className="text-xs font-semibold text-orange-600">Action Requise</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">L&apos;IA de Racines+ a détecté un ancêtre similaire déjà enregistré dans la base.</p>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-4 items-start hover:bg-gray-50 transition-colors">
                                    <div className="mt-1 bg-racines-green/10 text-racines-green p-2 rounded-full flex-shrink-0"><CheckCircle className="w-5 h-5" /></div>
                                    <div>
                                        <div className="flex justify-between flex-wrap gap-1">
                                            <h4 className="font-bold text-foreground text-sm">Branche soumise</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">Le profil de base a été transmis.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <AddAncestorModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => { setIsAddModalOpen(false); fetchProfile(); }}
                    villageNom={profileData?.village || 'Toa-Zéo'}
                />
                <ChooseAncetreModal isOpen={isChooseAncetreOpen} onClose={() => setIsChooseAncetreOpen(false)} onSelect={(id: string, nom: string) => { setSelectedAncetre(nom); setIsChooseAncetreOpen(false); }} villageNom={profileData?.village || 'Toa-Zéo'} />
                <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} onSuccess={() => { setIsEditProfileOpen(false); fetchProfile(); }} initialData={profileData?.extendedData} userId={userId} />
                <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} inviterName={`${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim()} villageNom={profileData?.village || 'Toa-Zéo'} />
            </div>
        </div>
    );
}
