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
import InternalMessaging from '@/components/InternalMessaging';

interface PendingProfile {
    id: string;
    first_name: string;
    last_name: string;
    village_origin: string;
    quartier_nom: string;
    status: string;
    avatar_url?: string | null;
    created_at: string;
    birth_date?: string;
    residence_country?: string;
    residence_city?: string;
    father_first_name?: string;
    father_last_name?: string;
    father_birth_date?: string;
    mother_first_name?: string;
    mother_last_name?: string;
    mother_birth_date?: string;
    choa_approvals?: string[];
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
    const [activeTab, setActiveTab] = useState<'mon_arbre' | 'tasks' | 'sent_cho' | 'confirmed' | 'rejected' | 'quartier'>('tasks');
    const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([]);
    const [sentToChoProfiles, setSentToChoProfiles] = useState<PendingProfile[]>([]);
    const [confirmedProfiles, setConfirmedProfiles] = useState<PendingProfile[]>([]);
    const [rejectedProfiles, setRejectedProfiles] = useState<PendingProfile[]>([]);
    const [comments, setComments] = useState<ValidationComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [viewingCommentsProfile, setViewingCommentsProfile] = useState<PendingProfile | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [motifModal, setMotifModal] = useState<{ id: string; action: 'confirmed' | 'probable' | 'rejected' } | null>(null);
    const [infoModalProfile, setInfoModalProfile] = useState<PendingProfile | null>(null);
    const [motifText, setMotifText] = useState('');
    const [observations, setObservations] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [ancestreNom, setAncetreNom] = useState('');
    const [ancestrePeriode, setAncretrePeriode] = useState('');
    const [ancestreSource, setAncetreSource] = useState('');
    const [isSavingAncetre, setIsSavingAncetre] = useState(false);
    const [ancestreSaved, setAncretreSaved] = useState(false);

    // Onglet activité quartier
    interface QuartierActivity {
        id: string;
        created_at: string;
        statut: string;
        role_validateur: string;
        validator_name: string;
        validator_quartier: string;
        cible_first_name: string;
        cible_last_name: string;
        cible_status: string;
    }
    const [quartierActivity, setQuartierActivity] = useState<QuartierActivity[]>([]);
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);

    // Pagination States
    const [pendingPage, setPendingPage] = useState(1);
    const [sentToChoPage, setSentToChoPage] = useState(1);
    const [confirmedPage, setConfirmedPage] = useState(1);
    const [rejectedPage, setRejectedPage] = useState(1);
    const itemsPerPage = 20;
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

            // Charger les profils utilisateurs du village
            const { data: allUsers, error: usersErr } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, village_origin, quartier_nom, status, avatar_url, created_at, birth_date, residence_country, residence_city, father_first_name, father_last_name, father_birth_date, mother_first_name, mother_last_name, mother_birth_date, choa_approvals')
                .eq('role', 'user')
                .eq('village_origin', profile.village_origin)
                .order('created_at', { ascending: false });

            if (usersErr) console.error('[choa] Error fetching users:', usersErr);

            if (allUsers) {
                // Workflow CHOa : le CHOa voit TOUS les inscrits du village
                // (pas de filtre quartier — tous les CHOa du village voient tous les dossiers)
                // À valider = pending_choa, pending (ancien), pre_approved (1 CHOa déjà OK)
                // Envoyés au CHO = probable (2 validations CHOa → transmis au CHO)
                const CHOA_PENDING_STATUSES = ['pending_choa', 'pending', 'pre_approved'];

                setPendingProfiles(allUsers.filter(u =>
                    CHOA_PENDING_STATUSES.includes(u.status || 'pending_choa')
                ));
                setSentToChoProfiles(allUsers.filter(u => u.status === 'probable'));
                setConfirmedProfiles(allUsers.filter(u => u.status === 'confirmed'));
                setRejectedProfiles(allUsers.filter(u => u.status === 'rejected'));
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

    const handleStatusChange = async (profileId: string, newStatus: string) => {
        if (!motifModal && newStatus === 'rejected') {
            setMotifModal({ id: profileId, action: 'rejected' });
            return;
        }

        const updateData: Record<string, unknown> = { status: newStatus };
        let finalStatus = newStatus;

        if (newStatus === 'probable' || newStatus === 'pre_approved') {
            const profile = pendingProfiles.find(p => p.id === profileId);
            const currentApprovals = Array.isArray(profile?.choa_approvals) ? profile.choa_approvals : [];
            if (!currentApprovals.includes(currentUserId!)) {
                const newApprovals = [...currentApprovals, currentUserId!];
                updateData.choa_approvals = newApprovals;
                finalStatus = newApprovals.length >= 2 ? 'probable' : 'pre_approved';
                updateData.status = finalStatus;
            } else {
                // Déjà approuvé par ce CHOa
                updateData.status = profile?.status || 'pending_choa';
                finalStatus = updateData.status as string;
                delete updateData.choa_approvals;
            }
        }

        // Mettre à jour le profil
        const { error: updateErr } = await supabase.from('profiles').update(updateData).eq('id', profileId);
        if (updateErr) {
            alert('❌ Erreur lors de la mise à jour : ' + updateErr.message);
            return;
        }

        // Enregistrer la validation enrichie via la fonction SQL
        if (finalStatus === 'probable' || finalStatus === 'pre_approved' || finalStatus === 'rejected') {
            await supabase.rpc('record_validation', {
                p_profile_id: profileId,
                p_new_status: finalStatus,
                p_final: finalStatus === 'probable',
                p_motif: motifText || null,
                p_observations: observations || null
            });
        }

        // Notifier le user en cas de rejet
        if (newStatus === 'rejected') {
            await supabase.from('notifications').insert({
                user_id: profileId,
                title: 'Dossier refusé par un CHOa',
                message: `Votre dossier d'inscription a été refusé. Motif : ${motifText || 'Non précisé'}. Vous pouvez contacter le village pour plus d'informations.`,
                type: 'rejection',
                is_read: false,
                created_at: new Date().toISOString()
            });
        }

        // Rafraîchir l'UI
        if (finalStatus === 'probable') {
            // Dossier complet → déplacer vers "Envoyés au CHO"
            const profileToMove = pendingProfiles.find(p => p.id === profileId);
            setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
            if (profileToMove) setSentToChoProfiles(prev => [...prev, { ...profileToMove, status: 'probable', choa_approvals: updateData.choa_approvals as string[] || profileToMove.choa_approvals }]);
        } else if (finalStatus === 'pre_approved') {
            setPendingProfiles(prev => prev.map(p => p.id === profileId
                ? { ...p, status: 'pre_approved', choa_approvals: updateData.choa_approvals as string[] || p.choa_approvals }
                : p
            ));
        } else {
            const profileToMove = pendingProfiles.find(p => p.id === profileId);
            setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
            if (newStatus === 'rejected' && profileToMove) {
                setRejectedProfiles(prev => [...prev, { ...profileToMove, status: 'rejected' }]);
            }
        }

        setMotifModal(null); setMotifText(''); setObservations('');

        if (finalStatus === 'probable') alert('🟠 2 validations complètes ! Dossier transmis au CHO pour confirmation finale.');
        else if (finalStatus === 'pre_approved') alert('👍 Approbation enregistrée. En attente d\'un second CHOa.');
        else if (newStatus === 'rejected') alert('❌ Dossier rejeté. Le membre a été notifié.');
    };

    const loadQuartierActivity = async () => {
        if (!myProfile) return;
        setIsLoadingActivity(true);
        const { data, error } = await supabase
            .from('v_validations_quartier')
            .select('*')
            .limit(50);
        if (!error && data) setQuartierActivity(data as QuartierActivity[]);
        setIsLoadingActivity(false);
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
        { key: 'sent_cho', label: 'Envoyés au CHO', icon: ShieldCheck, count: sentToChoProfiles.length, countColor: 'bg-blue-500' },
        { key: 'confirmed', label: 'Certifiés', icon: CheckCircle, count: confirmedProfiles.length, countColor: 'bg-green-500' },
        { key: 'rejected', label: 'Rejetés', icon: XCircle, count: rejectedProfiles.length, countColor: 'bg-red-500' },
        { key: 'quartier', label: 'Activité Quartier', icon: Users, count: 0, countColor: '' },
    ];

    const StatusBadge = ({ status }: { status: string }) => {
        const map: Record<string, { color: string; bg: string; label: string }> = {
            confirmed: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', label: 'CERTIFIÉ ✅' },
            pending: { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'EN ATTENTE ⚫' },
            pending_choa: { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'ATT. CHOA ⏳' },
            rejected: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'REJETÉ 🔴' },
            probable: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'PRÊT POUR CHO 🟠' },
            pre_approved: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: '1 APPROBATION 🔵' },
        };
        const s = map[status] || map['pending'];
        return (
            <span className={`text-[10px] px-3 py-1 rounded-full font-black tracking-widest border shadow-sm ${s.bg} ${s.color}`}>
                {s.label}
            </span>
        );
    };

    const ProfileCard = ({ profile, showActions = true }: { profile: PendingProfile; showActions?: boolean }) => {
        const alreadyApproved = Array.isArray(profile.choa_approvals) && currentUserId ? profile.choa_approvals.includes(currentUserId) : false;
        const approvalCount = Array.isArray(profile.choa_approvals) ? profile.choa_approvals.length : 0;
        return (
            <div className="group bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#FF6600]/5 hover:border-[#FF6600]/20 transition-all duration-300 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6600]/10 to-amber-50 text-[#FF6600] flex items-center justify-center text-xl font-black overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-500">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    (profile.first_name?.[0] || '?').toUpperCase()
                                )}
                            </div>
                            {approvalCount > 0 && (
                                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow">
                                    {approvalCount}/2
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black text-lg text-gray-900 leading-tight">{profile.first_name} {profile.last_name}</h3>
                                <StatusBadge status={profile.status || 'pending'} />
                            </div>
                            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                {profile.village_origin || 'Village ?'} • <span className="text-gray-400 italic font-normal">{profile.quartier_nom || 'Sans quartier'}</span>
                            </p>
                            {profile.birth_date && (
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Né(e) le {new Date(profile.birth_date).toLocaleDateString('fr-FR')}</p>
                            )}
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" /> Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>

                    {showActions && (
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                            {alreadyApproved ? (
                                <div className="flex items-center gap-2 text-xs px-5 py-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 font-black">
                                    <ShieldCheck className="w-4 h-4" /> MON SCEAU ✓
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleStatusChange(profile.id, 'probable')}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 text-xs px-5 py-3 rounded-2xl bg-[#FF6600] text-white hover:bg-[#e55c00] transition-all font-black shadow-lg shadow-orange-100 active:scale-95"
                                >
                                    <ShieldCheck className="w-4 h-4" /> APPOSER MON SCEAU 🟠
                                </button>
                            )}

                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => setInfoModalProfile(profile)}
                                    className="flex items-center justify-center gap-1.5 text-[10px] font-black px-4 py-3 rounded-2xl bg-blue-50 text-blue-500 hover:bg-blue-100 border border-blue-100 transition-all uppercase"
                                    title="Fiche détaillée"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setViewingCommentsProfile(profile);
                                        loadComments(profile.id);
                                    }}
                                    className="flex items-center justify-center gap-1.5 text-[10px] font-black px-4 py-3 rounded-2xl bg-orange-50 text-[#FF6600] hover:bg-orange-100 border border-orange-100 transition-all uppercase"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setMotifModal({ id: profile.id, action: 'rejected' })}
                                    className="flex items-center justify-center gap-1.5 text-[10px] font-black px-4 py-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-all uppercase"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
                        {(() => {
                            const paginatedPending = pendingProfiles.slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage);
                            const totalPages = Math.ceil(pendingProfiles.length / itemsPerPage);
                            return (
                                <>
                                    {paginatedPending.map(p => <ProfileCard key={p.id} profile={p} />)}
                                    {totalPages > 1 && (
                                        <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2 mt-4">
                                            <button disabled={pendingPage === 1} onClick={() => setPendingPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Précédent</button>
                                            <span className="text-sm font-semibold text-gray-600">Page {pendingPage} sur {totalPages}</span>
                                            <button disabled={pendingPage === totalPages} onClick={() => setPendingPage(prev => Math.min(totalPages, prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Suivant</button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Envoyés au CHO */}
                {activeTab === 'sent_cho' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-blue-500" /> Dossiers Transmis au CHO ({sentToChoProfiles.length})
                            </h2>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 mb-4">
                            <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-700 font-medium">
                                Ces dossiers ont été approuvés par 2 CHOa et sont maintenant en attente de validation finale par le CHO.
                            </p>
                        </div>
                        {sentToChoProfiles.length === 0 && (
                            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
                                <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="font-semibold text-gray-700">Aucun dossier transmis au CHO</p>
                                <p className="text-sm text-gray-600 mt-1">Les dossiers ayant reçu 2 approbations CHOa apparaîtront ici.</p>
                            </div>
                        )}
                        {(() => {
                            const paginated = sentToChoProfiles.slice((sentToChoPage - 1) * itemsPerPage, sentToChoPage * itemsPerPage);
                            const totalPages = Math.ceil(sentToChoProfiles.length / itemsPerPage);
                            return (
                                <>
                                    {paginated.map(p => <ProfileCard key={p.id} profile={p} showActions={false} />)}
                                    {totalPages > 1 && (
                                        <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2 mt-4">
                                            <button disabled={sentToChoPage === 1} onClick={() => setSentToChoPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Précédent</button>
                                            <span className="text-sm font-semibold text-gray-600">Page {sentToChoPage} sur {totalPages}</span>
                                            <button disabled={sentToChoPage === totalPages} onClick={() => setSentToChoPage(prev => Math.min(totalPages, prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Suivant</button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
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
                        {(() => {
                            const paginatedConfirmed = confirmedProfiles.slice((confirmedPage - 1) * itemsPerPage, confirmedPage * itemsPerPage);
                            const totalPages = Math.ceil(confirmedProfiles.length / itemsPerPage);
                            return (
                                <>
                                    {paginatedConfirmed.map(p => <ProfileCard key={p.id} profile={p} showActions={false} />)}
                                    {totalPages > 1 && (
                                        <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2 mt-4">
                                            <button disabled={confirmedPage === 1} onClick={() => setConfirmedPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Précédent</button>
                                            <span className="text-sm font-semibold text-gray-600">Page {confirmedPage} sur {totalPages}</span>
                                            <button disabled={confirmedPage === totalPages} onClick={() => setConfirmedPage(prev => Math.min(totalPages, prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Suivant</button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Rejetés */}
                {activeTab === 'rejected' && (
                    <div className="space-y-4">
                        {(() => {
                            const paginatedRejected = rejectedProfiles.slice((rejectedPage - 1) * itemsPerPage, rejectedPage * itemsPerPage);
                            const totalPages = Math.ceil(rejectedProfiles.length / itemsPerPage);
                            return (
                                <>
                                    {paginatedRejected.map(p => <ProfileCard key={p.id} profile={p} showActions={false} />)}
                                    {totalPages > 1 && (
                                        <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2 mt-4">
                                            <button disabled={rejectedPage === 1} onClick={() => setRejectedPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Précédent</button>
                                            <span className="text-sm font-semibold text-gray-600">Page {rejectedPage} sur {totalPages}</span>
                                            <button disabled={rejectedPage === totalPages} onClick={() => setRejectedPage(prev => Math.min(totalPages, prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Suivant</button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Activité Quartier — Ce que les CHOa du quartier ont fait */}
                {activeTab === 'quartier' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                                <Users className="w-3 h-3" /> Activité du Quartier {myProfile?.quartier_nom}
                            </h2>
                            <button
                                onClick={loadQuartierActivity}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#FF6600] text-white rounded-xl text-[10px] font-bold hover:bg-[#e55c00] transition-all active:scale-95"
                            >
                                {isLoadingActivity ? '⏳ Chargement...' : '🔄 Actualiser'}
                            </button>
                        </div>

                        {quartierActivity.length === 0 && !isLoadingActivity && (
                            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
                                <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="font-semibold text-gray-700">Aucune activité enregistrée</p>
                                <p className="text-sm text-gray-500 mt-1">Cliquez sur Actualiser pour charger les validations de votre quartier.</p>
                            </div>
                        )}

                        {quartierActivity.map(act => {
                            const statusColors: Record<string, string> = {
                                confirmed: 'bg-green-50 text-green-700 border-green-200',
                                probable: 'bg-orange-50 text-orange-600 border-orange-200',
                                pre_approved: 'bg-blue-50 text-blue-600 border-blue-200',
                                rejected: 'bg-red-50 text-red-600 border-red-200',
                                pending_choa: 'bg-gray-50 text-gray-500 border-gray-200',
                            };
                            const statusLabel: Record<string, string> = {
                                confirmed: 'Confirmé ✅', probable: 'Pré-validé 🟠',
                                pre_approved: '1 Approbation 🔵', rejected: 'Rejeté ❌',
                                pending_choa: 'En attente ⏳',
                            };
                            return (
                                <div key={act.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center font-black text-sm flex-shrink-0">
                                            {act.validator_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{act.validator_name || '—'}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{act.role_validateur?.toUpperCase()} · {act.validator_quartier}</p>
                                        </div>
                                    </div>
                                    <div className="text-center hidden md:block">
                                        <p className="text-xs text-gray-500">A traité</p>
                                        <p className="font-bold text-sm text-gray-900">{act.cible_first_name} {act.cible_last_name}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${statusColors[act.statut] || statusColors['pending_choa']}`}>
                                            {statusLabel[act.statut] || act.statut}
                                        </span>
                                        <span className="text-[9px] text-gray-400 font-bold">
                                            {new Date(act.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
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

            {/* Modale Infos Complètes — Dossier officiel */}
            {infoModalProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                            <h3 className="font-black text-lg flex items-center gap-2">
                                <Eye className="w-5 h-5 text-[#FF6600]" /> Dossier Officiel
                            </h3>
                            <button onClick={() => setInfoModalProfile(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <XCircle className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Photo + Identité */}
                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6600]/10 to-amber-50 text-[#FF6600] flex items-center justify-center text-3xl font-black overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                    {infoModalProfile.avatar_url ? (
                                        <img src={infoModalProfile.avatar_url} alt="Photo" className="w-full h-full object-cover" />
                                    ) : (
                                        (infoModalProfile.first_name?.[0] || '?').toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <p className="font-black text-xl text-gray-900">{infoModalProfile.first_name} {infoModalProfile.last_name}</p>
                                    <StatusBadge status={infoModalProfile.status || 'pending'} />
                                    <p className="text-xs text-gray-500 mt-1 font-medium">
                                        Inscrit le {new Date(infoModalProfile.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Infos personnelles */}
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                <h4 className="text-[10px] font-black uppercase text-[#FF6600] mb-3 tracking-widest">Identité du Demandeur</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Nom</p>
                                        <p className="font-bold text-gray-900">{infoModalProfile.last_name || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Prénoms</p>
                                        <p className="font-bold text-gray-900">{infoModalProfile.first_name || '—'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Date de naissance</p>
                                        <p className="font-bold text-gray-900">{infoModalProfile.birth_date ? new Date(infoModalProfile.birth_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '— Non renseignée'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Village & Quartier */}
                            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                <h4 className="text-[10px] font-black uppercase text-green-600 mb-3 tracking-widest">Village & Quartier</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Village</p>
                                        <p className="font-bold text-gray-900">{infoModalProfile.village_origin || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Quartier</p>
                                        <p className="font-bold text-gray-900">{infoModalProfile.quartier_nom || 'Non assigné'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Père */}
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <h4 className="text-[10px] font-black uppercase text-blue-500 mb-3 tracking-widest">Père</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Nom & Prénoms</p>
                                        <p className="font-bold text-gray-900">
                                            {(infoModalProfile.father_first_name || infoModalProfile.father_last_name)
                                                ? `${infoModalProfile.father_first_name || ''} ${infoModalProfile.father_last_name || ''}`.trim()
                                                : '— Non renseigné'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Date de naissance</p>
                                        <p className="font-bold text-gray-900">
                                            {infoModalProfile.father_birth_date
                                                ? new Date(infoModalProfile.father_birth_date).toLocaleDateString('fr-FR')
                                                : '— N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mère */}
                            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100">
                                <h4 className="text-[10px] font-black uppercase text-pink-500 mb-3 tracking-widest">Mère</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Nom & Prénoms</p>
                                        <p className="font-bold text-gray-900">
                                            {(infoModalProfile.mother_first_name || infoModalProfile.mother_last_name)
                                                ? `${infoModalProfile.mother_first_name || ''} ${infoModalProfile.mother_last_name || ''}`.trim()
                                                : '— Non renseigné'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Date de naissance</p>
                                        <p className="font-bold text-gray-900">
                                            {infoModalProfile.mother_birth_date
                                                ? new Date(infoModalProfile.mother_birth_date).toLocaleDateString('fr-FR')
                                                : '— N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Résidence */}
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <h4 className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Résidence actuelle</h4>
                                <p className="font-bold text-gray-900">{infoModalProfile.residence_city || '—'}, {infoModalProfile.residence_country || '—'}</p>
                            </div>

                            {/* Sceaux */}
                            {Array.isArray(infoModalProfile.choa_approvals) && infoModalProfile.choa_approvals.length > 0 && (
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                    <p className="text-sm font-bold text-amber-800">
                                        {infoModalProfile.choa_approvals.length}/2 sceau(x) CHOa apposé(s)
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                            <button
                                onClick={() => { setInfoModalProfile(null); setMotifModal({ id: infoModalProfile.id, action: 'rejected' }); }}
                                className="flex-1 py-3 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-colors border border-red-100"
                            >
                                Rejeter ✗
                            </button>
                            <button
                                onClick={() => { setInfoModalProfile(null); handleStatusChange(infoModalProfile.id, 'probable'); }}
                                disabled={Array.isArray(infoModalProfile.choa_approvals) && currentUserId ? infoModalProfile.choa_approvals.includes(currentUserId) : false}
                                className="flex-1 py-3 rounded-xl bg-[#FF6600] disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-bold hover:bg-[#e55c00] transition-colors shadow-lg shadow-orange-100"
                            >
                                {Array.isArray(infoModalProfile.choa_approvals) && currentUserId && infoModalProfile.choa_approvals.includes(currentUserId)
                                    ? 'Déjà approuvé ✓'
                                    : 'Apposer mon sceau 🟠'}
                            </button>
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

            {currentUserId && myProfile && <InternalMessaging currentUserRole={myProfile.role} currentUserId={currentUserId} />}
        </div>
    );
}
