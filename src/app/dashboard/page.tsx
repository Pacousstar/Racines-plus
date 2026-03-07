"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from "next/image";
import Link from "next/link";
import { User, Bell, LogOut, Mail, AlertCircle, X } from 'lucide-react';
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
    const [unreadCount, setUnreadCount] = useState(0);
    const [emailVerified, setEmailVerified] = useState(true);
    const [emailResent, setEmailResent] = useState(false);

    const fetchProfile = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setCurrentUserId(user.id);

        // Vérification email
        setEmailVerified(!!user.email_confirmed_at);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, role, status, village_origin, created_at, certificate_requested, certificate_issued, certificate_issued_at')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('[dashboard] Error fetching profile:', error);
        }

        if (data) {
            console.log("🚀 [Dashboard Debug] User role detected:", data.role, "for user:", user.email);
            if (data.role === 'admin') { router.push('/admin'); return; }
            else if (data.role === 'cho') { router.push('/cho'); return; }
            else if (data.role === 'choa') { router.push('/choa'); return; }

            console.log("➡️ [Dashboard Debug] No special role redirection, staying on /dashboard");
            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
            const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
            setProfileName(fullName || fallbackName);
            setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || null);
            setUserProfile(data);

            // Charger le nombre de notifications non lues
            const { count } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            setUnreadCount(count || 0);

            // ── Abonnement Realtime aux nouvelles notifications ──────────────
            supabase
                .channel(`notifs-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                    () => {
                        setUnreadCount(prev => prev + 1);
                    }
                )
                .subscribe();
        } else {
            setProfileName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur');
            setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
        setIsLoading(false);
    }, [supabase, router]);

    const handleResendVerification = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;
        await supabase.auth.resend({ type: 'signup', email: user.email });
        setEmailResent(true);
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
                                    alert("🔒 Votre dossier doit d'abord être 'Certifié ✅' par le CHO pour demander un certificat.");
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
                        onClick={() => { }}
                        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-white text-[9px] font-bold flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
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

            {/* Bannière email non-vérifié */}
            {!emailVerified && (
                <div className="fixed top-[60px] left-0 right-0 z-40 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        {emailResent
                            ? '✅ Email de vérification renvoyé ! Vérifiez votre boîte mail.'
                            : '⚠️ Votre email n\'est pas encore vérifié. Certaines fonctionnalités sont limitées.'}
                    </div>
                    {!emailResent && (
                        <button
                            onClick={handleResendVerification}
                            className="flex items-center gap-1.5 text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
                        >
                            <Mail className="w-3.5 h-3.5" /> Renvoyer l'email
                        </button>
                    )}
                </div>
            )}

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
