"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import Link from "next/link";
import { User, Bell, LogOut } from 'lucide-react';
import UserDashboardContent from '@/components/UserDashboardContent';
import MemorialView from '@/components/MemorialView';
import CertificateView from '@/components/CertificateView';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import InternalMessaging from '@/components/InternalMessaging';


export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [profileName, setProfileName] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'arbre' | 'memorial' | 'migration'>('arbre');
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [showCertificate, setShowCertificate] = useState(false);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setCurrentUserId(user.id);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, role, status, village_origin, created_at, certificate_requested, certificate_issued, certificate_issued_at')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('[dashboard] Error fetching profile:', error);
        }

        if (data) {
            console.log('[dashboard] Profile data found:', data);
            if (data.role === 'admin') {
                router.push('/admin');
                return;
            } else if (data.role === 'cho') {
                router.push('/cho');
                return;
            } else if (data.role === 'choa') {
                router.push('/choa');
                return;
            }

            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
            // Fallback sur metadata ou email
            const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
            setProfileName(fullName || fallbackName);
            setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || null);
            setUserProfile(data);
        } else {
            console.warn('[dashboard] No profile data returned for user:', user.id);
            // On affiche quand même quelque chose
            setProfileName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur');
            setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRequestCertificate = async () => {
        if (!userProfile) return;
        setIsLoading(true);
        const { error } = await supabase.from('profiles').update({ certificate_requested: true }).eq('id', currentUserId);
        if (error) {
            alert("Erreur lors de la demande.");
        } else {
            setUserProfile({ ...userProfile, certificate_requested: true });
            alert("📩 Votre demande de certificat a été envoyée à l'Administration Racines+.");
        }
        setIsLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const initials = profileName !== 'Mon Profil' ? profileName.substring(0, 2).toUpperCase() : '…';

    return (
        <div className="min-h-screen bg-gray-50 text-foreground">

            {/* Navbar Dashboard */}
            <header className="fixed top-0 w-full bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex justify-between items-center z-50 shadow-sm">
                <div className="flex items-center gap-5">
                    <Link href="/"><Image src="/LOGO_Racines.png" alt="Logo Racines+" width={95} height={33} className="object-contain mix-blend-multiply" /></Link>
                    <nav className="hidden md:flex gap-5">
                        <button
                            onClick={() => setActiveTab('arbre')}
                            className={`text-sm font-semibold pb-0.5 transition-colors ${activeTab === 'arbre' ? 'text-racines-green border-b-2 border-racines-green' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            Mon Arbre
                        </button>
                        <button
                            onClick={() => setActiveTab('memorial')}
                            className={`text-sm font-semibold pb-0.5 transition-colors ${activeTab === 'memorial' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            Mémorial 2010
                        </button>
                        <button
                            onClick={() => setActiveTab('migration')}
                            className={`text-sm font-semibold pb-0.5 transition-colors ${activeTab === 'migration' ? 'text-[#C05C3C] border-b-2 border-[#C05C3C]' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            Carte Migration
                        </button>
                        <button
                            onClick={() => {
                                if (userProfile?.certificate_issued) {
                                    setShowCertificate(true);
                                } else if (userProfile?.certificate_requested) {
                                    alert("⏳ Votre certificat est en cours de traitement par l'Administration.");
                                } else if (userProfile?.status === 'confirmed') {
                                    handleRequestCertificate();
                                } else {
                                    alert("🔒 Votre dossier doit d'abord être validé 'Confirmé' par le CHO pour demander un certificat.");
                                }
                            }}
                            className={`text-sm font-semibold pb-0.5 transition-colors ${userProfile?.certificate_issued ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            {userProfile?.certificate_issued ? 'Mon Certificat' : userProfile?.certificate_requested ? 'Certificat (Attente)' : 'Demander Certificat'}
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => alert("Notifications : la vue est reportée au composant interne")}
                        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center text-xs font-extrabold overflow-hidden">
                            {avatarUrl
                                ? <img src={avatarUrl} alt="avatar" className="object-cover w-full h-full" />
                                : <span>{initials}</span>
                            }
                        </div>
                        <span className="text-sm font-semibold hidden md:block truncate max-w-[120px]">
                            {isLoading ? '...' : profileName}
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

            {/* Main Content encapsulé dans le composant centralisé */}
            <main className="pt-20">
                {currentUserId && activeTab === 'arbre' && <UserDashboardContent userId={currentUserId} activeSection="arbre" />}
                {currentUserId && activeTab === 'migration' && <UserDashboardContent userId={currentUserId} activeSection="migration" />}
                {activeTab === 'memorial' && <MemorialView />}
            </main>

            {showCertificate && userProfile && (
                <CertificateView
                    userData={userProfile}
                    onClose={() => setShowCertificate(false)}
                />
            )}

            {currentUserId && userProfile && <InternalMessaging currentUserRole={userProfile.role} currentUserId={currentUserId} />}
        </div>
    );
}
