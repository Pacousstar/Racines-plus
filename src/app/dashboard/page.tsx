"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import Link from "next/link";
import { User, Bell, LogOut } from 'lucide-react';
import UserDashboardContent from '@/components/UserDashboardContent';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';


export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [profileName, setProfileName] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setCurrentUserId(user.id);

        const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, role')
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
            setProfileName(fullName || 'Mon Profil');
            setAvatarUrl(data.avatar_url || null);
        } else {
            console.warn('[dashboard] No profile data returned for user:', user.id);
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

    const initials = profileName !== 'Mon Profil' ? profileName.substring(0, 2).toUpperCase() : '…';

    return (
        <div className="min-h-screen bg-gray-50 text-foreground">

            {/* Navbar Dashboard */}
            <header className="fixed top-0 w-full bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex justify-between items-center z-50 shadow-sm">
                <div className="flex items-center gap-5">
                    <Link href="/"><Image src="/LOGO_Racines.png" alt="Logo Racines+" width={95} height={33} className="object-contain mix-blend-multiply" /></Link>
                    <nav className="hidden md:flex gap-5">
                        <div className="text-sm font-semibold pb-0.5 text-racines-green border-b-2 border-racines-green">
                            Mon Arbre
                        </div>
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
                {currentUserId && <UserDashboardContent userId={currentUserId} />}
            </main>
        </div>
    );
}
