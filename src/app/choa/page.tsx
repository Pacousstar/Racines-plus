"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import {
    ShieldCheck, CheckCircle, Clock, XCircle, LogOut,
    Eye, MessageSquare, Users, TreePine, Stamp, Share2, Download, Lock, MapPin
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import InviteModal from '@/components/InviteModal';
import UserDashboardContent from '@/components/UserDashboardContent';

interface PendingProfile {
    id: string;
    first_name: string;
    last_name: string;
    village_origin: string;
    quartier_nom: string;
    status: string;
    avatar_url?: string | null;
    created_at: string;
}

interface ValidationComment {
    id: string;
    profile_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author_name?: string;
}

interface MyProfile {
    first_name: string;
    last_name: string;
    role: string;
    village_origin: string;
    quartier_nom?: string;
    export_authorized: boolean;
    export_requested: boolean;
}

export default function ChoBoard() {
    const router = useRouter();
    const supabase = createClient();
    // Double protection côté client
    useRoleRedirect(['choa']);
    const [activeTab, setActiveTab] = useState<'mon_arbre' | 'tasks' | 'confirmed' | 'rejected'>('tasks');
    const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([]);
    const [confirmedProfiles, setConfirmedProfiles] = useState<PendingProfile[]>([]);
    const [rejectedProfiles, setRejectedProfiles] = useState<PendingProfile[]>([]);
    const [comments, setComments] = useState<ValidationComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [viewingCommentsProfile, setViewingCommentsProfile] = useState<PendingProfile | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [motifModal, setMotifModal] = useState<{ id: string; action: 'confirmed' | 'probable' | 'rejected' } | null>(null);
    const [motifText, setMotifText] = useState('');
    const [observations, setObservations] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    // États formulaire ancêtre
    const [ancestreNom, setAncetreNom] = useState('');
    const [ancestrePeriode, setAncretrePeriode] = useState('');
    const [ancestreSource, setAncetreSource] = useState('');
    const [isSavingAncetre, setIsSavingAncetre] = useState(false);
    const [ancestreSaved, setAncretreSaved] = useState(false);


    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            setCurrentUserId(user.id);

            // Charger le profil CHOa avec les quartiers assignés
            const { data: profile, error: profileErr } = await supabase
                .from('profiles')
                .select('first_name, last_name, role, village_origin, quartier_nom, quartiers_assignes, export_authorized, export_requested')
                .eq('id', user.id).single();
            if (profileErr) console.error('[choa] Error fetching CHOa profile:', profileErr);
            if (!profile || profile.role !== 'choa') {
                router.push('/dashboard');
                return;
            }
            setMyProfile(profile);

            // Charger les profils utilisateurs
            const { data: allUsers, error: usersErr } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, village_origin, quartier_nom, status, avatar_url, created_at')
                .eq('role', 'user')
                .order('created_at', { ascending: false });

            if (usersErr) console.error('[choa] Error fetching users:', usersErr);

            if (allUsers) {
                // Le CHOa voit SEULEMENT les pending de SON village et SON quartier
                const myPending = allUsers.filter(u =>
                    u.village_origin === profile.village_origin &&
                    u.quartier_nom === profile.quartier_nom &&
                    (u.status === 'pending' || !u.status)
                );

                setPendingProfiles(myPending);
                setConfirmedProfiles(allUsers.filter(u =>
                    u.village_origin === profile.village_origin &&
                    u.quartier_nom === profile.quartier_nom &&
                    u.status === 'confirmed'
                ));
                setRejectedProfiles(allUsers.filter(u =>
                    u.village_origin === profile.village_origin &&
                    u.quartier_nom === profile.quartier_nom &&
                    u.status === 'rejected'
                ));
            }

            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id).eq('is_read', false);
            setUnreadCount(count || 0);
            setIsLoading(false);
        };
        load();
    }, [supabase, router]);

    const handleRequestExport = async () => {
        if (!myProfile) return;
        setIsLoading(true);
        const { error } = await supabase.from('profiles').update({ export_requested: true }).eq('id', currentUserId);
        if (error) {
            alert("Erreur lors de la demande d'accès export.");
        } else {
            setMyProfile({ ...myProfile, export_requested: true });
            alert("📩 Votre demande d'accès à l'exportation a été envoyée à l'Admin.");
        }
        setIsLoading(false);
    };



    const handleExport = (dataToExport: PendingProfile[], label: string) => {
        if (!myProfile?.export_authorized) {
            alert("🔒 Vous n'êtes pas autorisé à exporter des données. Veuillez en faire la demande.");
            return;
        }
        if (dataToExport.length === 0) {
            alert("Rien à exporter.");
            return;
        }
        const headers = ["Nom", "Prénoms", "Quartier", "Statut", "Inscrit le"];
        const rows = dataToExport.map(p => [
            p.last_name || '—',
            p.first_name || '—',
            p.quartier_nom || '—',
            p.status || 'pending',
            new Date(p.created_at).toLocaleDateString('fr-FR')
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(";"))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `export_${label}_${myProfile?.village_origin || 'village'}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStatusChange = async (profileId: string, newStatus: string, isFinal: boolean = false) => {
        if (!motifModal && newStatus === 'rejected') {
            setMotifModal({ id: profileId, action: 'rejected' });
            return;
        }

        const updateData: Record<string, unknown> = { status: newStatus };
        if (newStatus === 'rejected' && motifText) updateData.rejection_motif = motifText;
        if (observations) updateData.rejection_observations = observations;

        await supabase.from('profiles').update(updateData).eq('id', profileId);

        // Historiser l'action du CHOa dans la table validations
        if (newStatus === 'probable' || newStatus === 'rejected') {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('validations').insert({
                profile_id: profileId,
                validator_id: user?.id,
                role_validateur: myProfile?.role,
                statut: newStatus,
                decision_finale: false,
                motif: motifText || null,
                observations: observations || (newStatus === 'probable' ? 'Pré-validation' : null)
            });
        }

        // Rafraîchir
        if (newStatus === 'probable') {
            setPendingProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: 'probable' } : p));
        } else {
            const profileToMove = pendingProfiles.find(p => p.id === profileId);
            setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
            if (newStatus === 'rejected' && profileToMove) {
                setRejectedProfiles(prev => [...prev, { ...profileToMove, status: 'rejected' }]);
            }
        }

        setMotifModal(null);
        setMotifText('');
        setObservations('');

        if (newStatus === 'probable') {
            alert("🟠 Dossier pré-validé ! Il est maintenant transmis au Chef de Village (CHO) pour validation finale.");
        } else if (newStatus === 'rejected') {
            alert("❌ Le dossier a été rejeté.");
        }
    };

    const loadComments = async (profileId: string) => {
        const { data, error } = await supabase
            .from('validation_comments')
            .select('*, author:profiles(first_name, last_name)')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return;
        }

        const enhancedComments = data.map(c => ({
            ...c,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            author_name: `${(c.author as any)?.first_name || ''} ${(c.author as any)?.last_name || ''}`.trim()
        }));
        setComments(enhancedComments);
        markNotificationsAsRead();
    };

    const handlePostComment = async (profileId: string) => {
        if (!newComment.trim() || isPostingComment) return;
        setIsPostingComment(true);
        const { error } = await supabase.from('validation_comments').insert({
            profile_id: profileId,
            author_id: currentUserId,
            content: newComment
        });

        if (error) {
            alert("Erreur lors de l'envoi du commentaire : " + error.message);
        } else {
            setNewComment('');
            loadComments(profileId);
        }
        setIsPostingComment(false);
    };

    const markNotificationsAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
            setUnreadCount(0);
        }
    };

    const tabs = [
        { key: 'mon_arbre', label: 'Mon Arbre', icon: TreePine, count: 0, countColor: '' },
        { key: 'tasks', label: 'À valider', icon: Clock, count: pendingProfiles.length, countColor: 'bg-orange-500' },
        { key: 'confirmed', label: 'Confirmés', icon: CheckCircle, count: confirmedProfiles.length, countColor: 'bg-green-500' },
        { key: 'rejected', label: 'Rejetés', icon: XCircle, count: rejectedProfiles.length, countColor: 'bg-red-500' },
    ];

    const StatusBadge = ({ status }: { status: string }) => {
        const map: Record<string, { color: string; bg: string; label: string }> = {
            confirmed: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', label: 'CERTIFIÉ ✅' },
            pending: { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'EN ATTENTE ⚫' },
            rejected: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'REJETÉ 🔴' },
            probable: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'PROBABLE 🟠' },
        };
        const s = map[status] || map['pending'];
        return (
            <span className={`text-[10px] px-3 py-1 rounded-full font-black tracking-widest border shadow-sm ${s.bg} ${s.color}`}>
                {s.label}
            </span>
        );
    };

    const ProfileCard = ({ profile, showActions = true }: { profile: PendingProfile; showActions?: boolean }) => (
        <div className="group bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#FF6600]/5 hover:border-[#FF6600]/20 transition-all duration-300 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6600]/10 to-amber-50 text-[#FF6600] flex items-center justify-center text-xl font-black flex-shrink-0 overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-500">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                (profile.first_name?.[0] || '?').toUpperCase()
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-lg text-gray-900 leading-tight">{profile.first_name} {profile.last_name}</h3>
                            <StatusBadge status={profile.status || 'pending'} />
                        </div>
                        <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {profile.village_origin || 'Village ?'} • <span className="text-gray-400 italic font-normal">{profile.quartier_nom || 'Quartier ?'}</span>
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-2">
                            <Clock className="w-3 h-3" /> Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>

                {showActions && (
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                        <button
                            onClick={() => handleStatusChange(profile.id, 'probable')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 text-xs px-5 py-3 rounded-2xl bg-[#FF6600] text-white hover:bg-[#e55c00] transition-all font-black shadow-lg shadow-orange-100 active:scale-95 group/btn"
                        >
                            <ShieldCheck className="w-4 h-4" /> PRÉ-VALIDER 🟠
                        </button>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={() => {
                                    setViewingCommentsProfile(profile);
                                    loadComments(profile.id);
                                }}
                                className="flex-1 items-center justify-center gap-1.5 text-[10px] font-black px-4 py-3 rounded-2xl bg-orange-50 text-[#FF6600] hover:bg-orange-100 border border-orange-100 transition-all uppercase"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setMotifModal({ id: profile.id, action: 'rejected' })}
                                className="flex-1 items-center justify-center gap-1.5 text-[10px] font-black px-4 py-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-all uppercase"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-foreground">
            {/* Header */}
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex justify-between items-center z-50 shadow-sm">
                <div className="flex items-center gap-5">
                    <Link href="/"><Image src="/LOGO_Racines.png" alt="Racines+" width={100} height={35} className="object-contain hover:opacity-80 transition-opacity" /></Link>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border bg-[#FF6600] text-white shadow-lg shadow-orange-100 uppercase">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        CHOa — ADJOINT PATRIMONIAL
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MessageSquare className={`w-5 h-5 ${unreadCount > 0 ? 'text-[#FF6600]' : 'text-gray-600'}`} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6600] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <span className="text-sm font-semibold hidden md:block">{myProfile?.first_name} {myProfile?.last_name}</span>
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-racines-green hover:text-racines-green transition-colors"
                    >
                        <Share2 className="w-3.5 h-3.5" /> Inviter
                    </button>
                    <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="pt-20 px-4 md:px-6 max-w-5xl mx-auto pb-12">
                <div className="mt-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Espace de Pré-Validation</h1>
                        <p className="text-gray-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                            <span className="w-2 h-2 bg-[#FF6600] rounded-full animate-pulse" />
                            Village : <span className="text-gray-900 font-bold">{myProfile?.village_origin || 'Toa-Zéo'}</span>
                            <span className="text-gray-400 mx-1">•</span>
                            Quartier : <span className="text-[#FF6600] font-black">{myProfile?.quartier_nom || 'Non assigné'}</span>
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Session Adjoint</p>
                        <p className="text-sm font-bold text-gray-900 italic">Antigravity Panel v2.0</p>
                    </div>
                </div>

                <div className="flex gap-3 mb-10 overflow-x-auto pb-4 px-1 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-sm font-black whitespace-nowrap transition-all duration-300 ${activeTab === tab.key ? 'bg-gray-900 text-white shadow-xl shadow-gray-200 -translate-y-1' : 'bg-white border border-gray-100 text-gray-500 hover:border-[#FF6600]/30 hover:bg-orange-50/30'}`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-[#FF6600]' : 'text-gray-400'}`} />
                            {tab.label}
                            {tab.count > 0 && <span className={`${tab.countColor} text-white text-[10px] px-2 py-0.5 rounded-full flex items-center justify-center font-black shadow-sm`}>{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {activeTab === 'mon_arbre' && currentUserId && (
                    <div className="mt-4">
                        <UserDashboardContent userId={currentUserId} />
                    </div>
                )}

                {/* À valider */}
                {activeTab === 'tasks' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Dossiers Quartier ({pendingProfiles.length})
                            </h2>
                            {myProfile?.export_authorized ? (
                                <button
                                    onClick={() => handleExport(pendingProfiles, 'quartier_en_attente')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    <Download className="w-3 h-3" /> Exporter
                                </button>
                            ) : (
                                <button
                                    onClick={handleRequestExport}
                                    disabled={myProfile?.export_requested}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${myProfile?.export_requested ? 'bg-gray-50 text-gray-600 border border-gray-100' : 'bg-orange-50 text-[#FF6600] border border-orange-100 hover:bg-orange-100'}`}
                                >
                                    <Lock className="w-3 h-3" /> {myProfile?.export_requested ? 'Export demandé' : 'Demander accès export'}
                                </button>
                            )}
                        </div>
                        {isLoading && <p className="text-sm text-gray-600 text-center py-8">Chargement...</p>}
                        {!isLoading && pendingProfiles.length === 0 && (
                            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <p className="font-semibold text-gray-700">Aucun profil en attente !</p>
                                <p className="text-sm text-gray-600 mt-1">Tous les profils ont été traités.</p>
                            </div>
                        )}
                        {pendingProfiles.map(p => <ProfileCard key={p.id} profile={p} />)}
                    </div>
                )}

                {/* Confirmés */}
                {activeTab === 'confirmed' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-3 h-3" /> Dossiers Validés ({confirmedProfiles.length})
                            </h2>
                            {myProfile?.export_authorized && (
                                <button
                                    onClick={() => handleExport(confirmedProfiles, 'quartier_confirmes')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    <Download className="w-3 h-3" /> Exporter
                                </button>
                            )}
                        </div>
                        {confirmedProfiles.length === 0 && <p className="text-sm text-gray-600 text-center py-8">Aucun profil confirmé pour l&apos;instant.</p>}
                        {confirmedProfiles.map(p => <ProfileCard key={p.id} profile={p} showActions={false} />)}
                    </div>
                )}

                {/* Rejetés */}
                {activeTab === 'rejected' && (
                    <div className="space-y-4">
                        {rejectedProfiles.length === 0 && <p className="text-sm text-gray-600 text-center py-8">Aucun profil rejeté.</p>}
                        {rejectedProfiles.map(p => <ProfileCard key={p.id} profile={p} showActions={false} />)}
                    </div>
                )}

            </main>

            {/* Modale Motif de Rejet */}
            {motifModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold">Motif obligatoire</h3>
                                <p className="text-xs text-gray-500">Le motif sera transmis à l&apos;utilisateur concerné.</p>
                            </div>
                        </div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Motif du rejet *</label>
                        <textarea
                            value={motifText}
                            onChange={e => setMotifText(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/10 outline-none text-sm resize-none"
                            placeholder="Expliquez clairement le motif du rejet..."
                        />
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1 mt-3">Observations (optionnel)</label>
                        <textarea
                            value={observations}
                            onChange={e => setObservations(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/10 outline-none text-sm resize-none"
                            placeholder="Notes complémentaires internes..."
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setMotifModal(null); setMotifText(''); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                Annuler
                            </button>
                            <button
                                disabled={!motifText.trim()}
                                onClick={() => handleStatusChange(motifModal.id, 'rejected')}
                                className="flex-1 py-3 rounded-xl bg-red-500 disabled:bg-gray-200 disabled:text-gray-600 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                            >
                                Confirmer le Rejet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around md:hidden shadow-lg">
                {tabs.slice(0, 4).map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} className={`flex flex-col items-center gap-1 ${activeTab === tab.key ? 'text-[#FF6600]' : 'text-gray-600'}`}>
                        <tab.icon className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
                <button onClick={() => setIsInviteOpen(true)} className="flex flex-col items-center gap-1 text-gray-600">
                    <Share2 className="w-5 h-5" />
                    <span className="text-[9px] font-bold uppercase">Inviter</span>
                </button>
            </div>

            {/* Modale Commentaires */}
            {viewingCommentsProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Échanges : {viewingCommentsProfile.first_name}</h3>
                                    <p className="text-xs text-gray-600">Fil de discussion avec le Chef de Village (CHO)</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingCommentsProfile(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <XCircle className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                            {comments.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 italic">Aucun commentaire pour le moment.</p>
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className={`flex flex-col ${comment.author_id === currentUserId ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${comment.author_id === currentUserId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none shadow-sm'}`}>
                                            <p className="font-bold text-[10px] mb-1 opacity-80 uppercase tracking-wider">{comment.author_name}</p>
                                            <p className="leading-relaxed">{comment.content}</p>
                                        </div>
                                        <span className="text-[9px] text-gray-600 mt-1 uppercase font-bold tracking-widest">{new Date(comment.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Répondre au CHO..."
                                    onKeyUp={e => e.key === 'Enter' && handlePostComment(viewingCommentsProfile.id)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-sm"
                                />
                                <button
                                    onClick={() => handlePostComment(viewingCommentsProfile.id)}
                                    disabled={!newComment.trim() || isPostingComment}
                                    className="px-6 py-3 bg-[#FF6600] text-white rounded-xl font-bold text-sm hover:bg-[#e55c00] disabled:bg-gray-200 transition-colors shadow-lg shadow-orange-100"
                                >
                                    {isPostingComment ? '...' : 'Répondre'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                inviterName={`${myProfile?.first_name || ''} ${myProfile?.last_name || ''}`}
                villageNom={myProfile?.village_origin || 'Toa-Zéo'}
            />
        </div>
    );
}
