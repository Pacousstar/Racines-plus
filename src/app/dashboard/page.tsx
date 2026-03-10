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
import AppLayout from '@/components/AppLayout';


export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [profileName, setProfileName] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'mon_arbre' | 'memorial' | 'migration'>('mon_arbre');
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
            console.log("🚀 [Dashboard Debug] User role detected:", data.role, "for email:", user.email);

            // Redirection immédiate basée sur le rôle
            if (data.role === 'admin') {
                console.log("➡️ [Dashboard Debug] Redirecting to /admin");
                router.push('/admin');
                return;
            }
            if (data.role === 'cho') {
                console.log("➡️ [Dashboard Debug] Redirecting to /cho");
                router.push('/cho');
                return;
            }
            if (data.role === 'choa') {
                console.log("➡️ [Dashboard Debug] Redirecting to /choa");
                router.push('/choa');
                return;
            }

            console.log("➡️ [Dashboard Debug] Staying on /dashboard for user role");
            setUserProfile(data);

            // Charger le nombre de notifications non lues
            const { count } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            setUnreadCount(count || 0);

            // Mise à jour de l'identité visuelle avec les données réelles du profil
            setProfileName(`${data.first_name || ''} ${data.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Utilisateur');
            setAvatarUrl(data.avatar_url || null);

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
        <AppLayout
            role={userProfile?.role || 'user'}
            activeTab={activeTab}
            onTabChange={(id) => {
                if (id === 'certificate') {
                    if (userProfile?.certificate_issued) {
                        setShowCertificate(true);
                    } else if (userProfile?.certificate_requested) {
                        alert("⏳ Votre certificat est en cours de traitement par l'Administration.");
                    } else if (userProfile?.status === 'confirmed') {
                        handleRequestCertificate();
                    } else {
                        alert("🔒 Votre dossier doit d'abord être 'Certifié ✅' par le CHO pour demander un certificat.");
                    }
                } else {
                    setActiveTab(id as any);
                }
            }}
            userName={profileName}
            userAvatar={avatarUrl}
            onLogout={handleLogout}
            village={userProfile?.village_origin}
        >
            {/* Bannière email non-vérifié */}
            {!emailVerified && (
                <div className="mb-8 bg-amber-50 border border-amber-200 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top duration-500 shadow-sm">
                    <div className="flex items-center gap-3 text-amber-800 text-sm font-semibold">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div>
                            <p>{emailResent ? '✅ Email de vérification renvoyé !' : '⚠️ Vérification de compte requise'}</p>
                            <p className="text-xs font-medium opacity-70">
                                {emailResent ? 'Vérifiez votre boîte mail.' : 'Votre email n\'est pas encore vérifié. Profitez de tout Racines+ en validant votre compte.'}
                            </p>
                        </div>
                    </div>
                    {!emailResent && (
                        <button
                            onClick={handleResendVerification}
                            className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest bg-amber-600 text-white px-6 py-3 rounded-2xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
                        >
                            <Mail className="w-4 h-4" /> Renvoyer l'email
                        </button>
                    )}
                </div>
            )}

            {/* Contenu principal */}
            <div className="space-y-8">
                {currentUserId && activeTab === 'mon_arbre' && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <UserDashboardContent userId={currentUserId} activeSection="arbre" />
                    </div>
                )}

                {currentUserId && activeTab === 'migration' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <UserDashboardContent userId={currentUserId} activeSection="migration" />
                    </div>
                )}

                {activeTab === 'memorial' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <MemorialView />
                    </div>
                )}
            </div>

            {showCertificate && userProfile && (
                <CertificateView
                    userData={userProfile}
                    onClose={() => setShowCertificate(false)}
                />
            )}

            {currentUserId && userProfile && <InternalMessaging currentUserRole={userProfile.role} currentUserId={currentUserId} />}
        </AppLayout>
    );
}
