"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import Link from "next/link";
import {
    User, Bell, Share2, ShieldCheck, MapPin, Plus, CheckCircle,
    AlertTriangle, LogOut, Camera, Clock, XCircle, Home, TreePine
} from 'lucide-react';
import AddAncestorModal from '@/components/AddAncestorModal';
import ChooseAncetreModal from '@/components/ChooseAncetreModal';
import InviteModal from '@/components/InviteModal';
import PersonalLineageTree from '@/components/PersonalLineageTree';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface ProfileData {
    firstName: string;
    lastName: string;
    village: string;
    quartier: string;
    status: string;
    avatarUrl: string | null;
}

export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'arbre' | 'notifications'>('arbre');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isChooseAncetreOpen, setIsChooseAncetreOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [selectedAncetre, setSelectedAncetre] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setCurrentUserId(user.id);

        const { data } = await supabase
            .from('profiles')
            .select('first_name, last_name, village_origin, quartier_nom, status, avatar_url, role')
            .eq('id', user.id)
            .single();

        if (data) {
            if (data.role === 'admin') {
                router.push('/admin');
                return;
            } else if (['cho', 'choa'].includes(data.role)) {
                router.push('/cho');
                return;
            }

            setProfileData({
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                village: data.village_origin || 'Toa-Zéo',
                quartier: data.quartier_nom || '',
                status: data.status || 'pending',
                avatarUrl: data.avatar_url || null,
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingPhoto(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split('.').pop() || 'jpg';
            const filePath = `${user.id}.${fileExt}`;  // Path relatif au bucket, sans préfixe 'avatars/'

            // Upload dans Supabase Storage (bucket "avatars")
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.warn('Erreur upload photo :', uploadError.message);
                alert("L'upload de la photo sera disponible une fois le bucket Supabase Storage 'avatars' créé.");
                return;
            }

            // Récupérer l'URL publique
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

            // Sauvegarder l'URL dans le profil
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

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
            pending: { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'En attente CHO ⚫', icon: <Clock className="w-3.5 h-3.5" /> },
        };
        const s = map[status] || map['pending'];
        return (
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${s.bg} ${s.color}`}>
                {s.icon} {s.label}
            </span>
        );
    };

    const initials = profileData
        ? `${profileData.firstName[0] || ''}${profileData.lastName[0] || ''}`.toUpperCase()
        : '…';

    return (
        <div className="min-h-screen bg-gray-50 text-foreground">

            {/* Navbar Dashboard */}
            <header className="fixed top-0 w-full bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex justify-between items-center z-50 shadow-sm">
                <div className="flex items-center gap-5">
                    <Link href="/"><Image src="/LOGO_Racines.png" alt="Logo Racines+" width={95} height={33} className="object-contain" /></Link>
                    <nav className="hidden md:flex gap-5">
                        <button
                            onClick={() => setActiveTab('arbre')}
                            className={`text-sm font-semibold pb-0.5 transition-colors ${activeTab === 'arbre' ? 'text-racines-green border-b-2 border-racines-green' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            Mon Arbre
                        </button>
                        <button
                            onClick={() => alert("La gestion des documents chiffrés sera disponible dans la prochaine version.")}
                            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            Documents
                        </button>
                        <button
                            onClick={() => alert("Statistiques globales du village — Fonctionnalité PRO à venir.")}
                            className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
                        >
                            Statistiques <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px] font-bold">PRO</span>
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center text-xs font-extrabold overflow-hidden">
                            {profileData?.avatarUrl
                                ? <img src={profileData.avatarUrl} alt="avatar" className="object-cover w-full h-full" />
                                : <span>{initials}</span>
                            }
                        </div>
                        <span className="text-sm font-semibold hidden md:block truncate max-w-[120px]">
                            {isLoading ? '...' : (profileData?.firstName || profileData?.lastName ? `${profileData.firstName} ${profileData.lastName}`.trim() : 'Mon Profil')}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Déconnexion"
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 border border-red-100 hover:border-red-300 rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden md:inline">Déconn.</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-20 px-4 md:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 pb-12">

                {/* Sidebar Gauche */}
                <div className="w-full lg:w-72 flex flex-col gap-4 mt-4">

                    {/* Carte Profil */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Bandeau couleur statut */}
                        <div className={`h-16 ${profileData?.status === 'confirmed' ? 'bg-gradient-to-br from-green-400/30 to-racines-green/10' : profileData?.status === 'rejected' ? 'bg-gradient-to-br from-red-400/20 to-red-100' : 'bg-gradient-to-r from-[#FF6600] to-amber-500'}`}></div>

                        <div className="relative px-6 pb-6">
                            {/* Avatar cliquable */}
                            <div className="relative -mt-10 mb-4 w-fit mx-auto">
                                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {profileData?.avatarUrl
                                        ? <img src={profileData.avatarUrl} alt="Photo de profil" className="object-cover w-full h-full" />
                                        : <User className="w-10 h-10 text-gray-300" />
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
                                    {isLoading ? <span className="inline-block w-32 h-5 bg-gray-200 rounded animate-pulse" /> : (profileData?.firstName || profileData?.lastName ? `${profileData.firstName} ${profileData.lastName}`.trim() : 'Mon Profil')}
                                </h2>
                                <p className="text-sm text-gray-500 flex items-center gap-1 justify-center mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {profileData?.quartier ? `${profileData.village} • ${profileData.quartier}` : profileData?.village || 'Village...'}
                                </p>

                                {/* Badge statut CHO */}
                                <div className="mt-3 flex justify-center">
                                    {isLoading
                                        ? <span className="inline-block w-28 h-6 bg-gray-200 rounded-full animate-pulse" />
                                        : <StatusBadge status={profileData?.status || 'pending'} />
                                    }
                                </div>

                                <div className="mt-3 flex justify-center">
                                    <span className="bg-[#FF6600]/10 text-[#FF6600] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Nœud Fondateur
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setIsChooseAncetreOpen(true)}
                            className="w-full bg-[#FF6600] hover:bg-[#e55c00] text-white py-3 px-4 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md shadow-[#FF6600]/20 active:scale-95"
                        >
                            <TreePine className="w-5 h-5" />
                            {selectedAncetre ? 'Mon ancêtre ✅' : 'Choisir mon Ancêtre'}
                        </button>
                        <button
                            onClick={() => setIsInviteOpen(true)}
                            className="w-full bg-white border border-gray-200 hover:border-racines-green/40 hover:text-racines-green text-foreground/80 py-3 px-4 rounded-xl font-medium flex items-center gap-2 transition-colors"
                        >
                            <Share2 className="w-5 h-5 text-gray-400" /> Inviter ma famille
                        </button>
                    </div>

                    {/* Panneau IA */}
                    <div className="bg-green-800 text-white p-5 rounded-3xl">
                        <div className="flex items-center gap-2 mb-3 text-green-200">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="font-bold text-sm">IA de Racines+</span>
                            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse ml-auto"></span>
                        </div>
                        <p className="text-sm text-green-100/80 mb-4 leading-relaxed">
                            L&apos;IA analyse vos données et vous suggère des liens de parenté probables.
                        </p>
                        <button
                            onClick={() => alert("Analyse IA : Fonctionnalité en cours d'intégration.")}
                            className="text-xs font-bold uppercase tracking-wider bg-white text-green-800 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors w-full"
                        >
                            Voir l&apos;analyse
                        </button>
                    </div>
                </div>

                {/* Zone Centrale */}
                <div className="flex-1 mt-4">

                    {activeTab === 'arbre' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold">Mon Arbre Généalogique</h1>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {isLoading ? '...' : `Lignée : ${profileData?.firstName && profileData?.lastName ? `${profileData.firstName} ${profileData.lastName}` : 'Mon Profil'} • ${profileData?.village || 'Toa-Zéo'}`}
                                    </p>
                                </div>
                                <StatusBadge status={profileData?.status || 'pending'} />
                            </div>

                            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden relative">
                                {profileData?.status === 'confirmed' && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-racines-green" />
                                )}
                                <PersonalLineageTree
                                    userId={currentUserId || ''}
                                    villageNom={profileData?.village || 'Toa-Zéo'}
                                />
                                {/* Bouton Choisir ancêtre si pas encore sélectionné */}
                                {!selectedAncetre && !isLoading && (
                                    <div className="border-t border-gray-50 px-6 py-4 flex justify-center">
                                        <button
                                            onClick={() => setIsChooseAncetreOpen(true)}
                                            className="bg-[#FF6600] hover:bg-[#e55c00] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#FF6600]/30 transition-all hover:-translate-y-0.5 active:scale-95"
                                        >
                                            🌳 Choisir mon Ancêtre Fondateur
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="flex flex-col gap-4">
                            <h1 className="text-2xl font-bold">Notifications & Validations</h1>

                            {/* Statut de ma validation */}
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

                            {/* Notifications illustratives */}
                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-sm">
                                <div className="p-4 flex gap-4 items-start bg-orange-50/50 hover:bg-orange-50 transition-colors">
                                    <div className="mt-1 bg-orange-100 text-orange-600 p-2 rounded-full flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between flex-wrap gap-1">
                                            <h4 className="font-bold text-foreground text-sm">Doublon Probable Détecté</h4>
                                            <span className="text-xs font-semibold text-orange-600">Action Requise</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            L&apos;IA de Racines+ a détecté un ancêtre similaire déjà enregistré dans la base du village.
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => alert("Fusion des doublons : Fonctionnalité en cours d'implémentation.")} className="bg-[#FF6600] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#e55c00] transition-colors">Vérifier et Fusionner</button>
                                            <button className="bg-white border border-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">Ignorer</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 flex gap-4 items-start hover:bg-gray-50 transition-colors">
                                    <div className="mt-1 bg-racines-green/10 text-racines-green p-2 rounded-full flex-shrink-0">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between flex-wrap gap-1">
                                            <h4 className="font-bold text-foreground text-sm">Branche certifiée par le CHO</h4>
                                            <span className="text-xs text-gray-400">Il y a 2 jours</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Le Chief Heritage Officer de Toa-Zéo a approuvé votre filiation. La branche est désormais <span className="text-racines-green font-bold">Verrouillée</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Nav Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around md:hidden shadow-lg z-50">
                {[
                    { icon: Home, label: 'Arbre', action: () => setActiveTab('arbre'), active: activeTab === 'arbre' },
                    { icon: Bell, label: 'Alertes', action: () => setActiveTab('notifications'), active: activeTab === 'notifications' },
                    { icon: Plus, label: 'Ajouter', action: () => setIsAddModalOpen(true), active: false },
                    { icon: LogOut, label: 'Quitter', action: handleLogout, active: false },
                ].map(item => (
                    <button key={item.label} onClick={item.action} className={`flex flex-col items-center gap-0.5 ${item.active ? 'text-[#FF6600]' : 'text-gray-400'}`}>
                        <item.icon className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Modales */}
            <AddAncestorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => { setIsAddModalOpen(false); fetchProfile(); }}
            />
            <ChooseAncetreModal
                isOpen={isChooseAncetreOpen}
                onClose={() => setIsChooseAncetreOpen(false)}
                onSuccess={(id, nom) => { setSelectedAncetre(nom); setIsChooseAncetreOpen(false); }}
                villageNom={profileData?.village || 'Toa-Zéo'}
            />
            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                inviterName={`${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim()}
                villageNom={profileData?.village || 'Toa-Zéo'}
            />
        </div>
    );
}
