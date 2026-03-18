"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import {
    ShieldCheck, CheckCircle, Clock, XCircle, LogOut,
    Eye, MessageSquare, Users, TreePine, Stamp, Share2, Download, Lock, MapPin, Activity, Search, Home, AlertTriangle
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import InviteModal from '@/components/InviteModal';
import UserDashboardContent from '@/components/UserDashboardContent';
import InternalMessaging from '@/components/InternalMessaging';
import AppLayout from '@/components/AppLayout';

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
    gender?: string;
    residence_country?: string;
    residence_city?: string;
    mother_status?: string;
    metadata?: any;
    choa_approvals?: string[];
    rejection_motif?: string;
    rejection_observations?: string;
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
    avatar_url?: string | null;
}

// Composant utilitaire pour les états vides
const EmptyTabState = ({ message, icon: Icon }: { message: string, icon: any }) => (
    <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] p-16 text-center border border-white/60 shadow-xl animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-orange-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-orange-100 shadow-inner group">
            <Icon className="w-10 h-10 text-orange-200 group-hover:scale-110 group-hover:text-orange-400 transition-all duration-500" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Rien à afficher</h2>
        <p className="text-gray-500 max-w-sm mx-auto font-medium">{message}</p>
    </div>
);

export default function ChoBoard() {
    const router = useRouter();
    const supabase = createClient();
    useRoleRedirect(['choa', 'admin', 'cho', 'assistant cho', 'assistant_cho']);
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
    const load = async () => {
        // Optimisation : Ne pas déclencher isLoading(true) si on a déjà des profils 
        // pour éviter le "flash" de chargement complet.
        if (pendingProfiles.length === 0) {
            setIsLoading(true);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setCurrentUserId(user.id);
        console.log("🔍 [CHOa Debug] User ID:", user.id);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
            if (!accessToken) {
                console.error('[choa] No access token available');
                setIsLoading(false);
                return;
            }

            console.log("🚀 [CHOa Page] Fetching data via API...");
            const response = await fetch(`/api/choa/profiles?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` },
                cache: 'no-store'
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('❌ [CHOa Page] API Error Response:', errText);
                setIsLoading(false);
                return;
            }

            const { profiles: allUsersRaw, me } = await response.json();
            console.log("📥 [CHOa Page] API Response:", { profilesCount: allUsersRaw?.length, me });

            // Mettre à jour le profil
            if (me) {
                console.log("✅ [CHOa Page] Profile loaded from API:", me);
                setMyProfile(me);
            } else {
                console.warn("⚠️ [CHOa Page] No profile data ('me') in API response! Using fallback.");
                const { data: fallbackProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (fallbackProfile) setMyProfile(fallbackProfile);
            }

            // Mettre à jour tous les profils en une fois (réduit les re-renders)
            if (allUsersRaw) {
                console.log(`📊 [CHOa Debug] Profils totaux reçus: ${allUsersRaw.length}`);
                console.log("📄 [CHOa Debug] Contenu brut des profils:", JSON.stringify(allUsersRaw.slice(0, 3), null, 2));
                const CHOA_PENDING_STATUSES = ['pending_choa', 'pending', 'pre_approved'];
                const pending = allUsersRaw.filter((u: any) => CHOA_PENDING_STATUSES.includes(u.status || 'pending_choa'));
                const probable = allUsersRaw.filter((u: any) => u.status === 'probable');
                const confirmed = allUsersRaw.filter((u: any) => u.status === 'confirmed');
                const rejected = allUsersRaw.filter((u: any) => u.status === 'rejected');
                
                console.log(`📊 [CHOa Debug] Dispatch: Pending=${pending.length}, Probable=${probable.length}, Confirmed=${confirmed.length}`);

                setPendingProfiles(pending);
                setSentToChoProfiles(probable);
                setConfirmedProfiles(confirmed);
                setRejectedProfiles(rejected);
            }

            // Récupérer les notifications
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id).eq('is_read', false);
            
            setUnreadCount(count || 0);
            setIsLoading(false);
        } catch (err) {
            console.error('[choa] Exception in load():', err);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (activeTab === 'quartier' && myProfile) {
            loadQuartierActivity();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, myProfile]);

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
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/choa/activity?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` },
                cache: 'no-store'
            });
            if (res.ok) {
                const { activity } = await res.json();
                setQuartierActivity(activity || []);
                console.log(`📊 [CHOa Debug] Activités reçues: ${activity?.length || 0}`);
            } else {
                const errText = await res.text();
                console.error('[choa] Activity API Error:', errText);
            }
        } catch (err) {
            console.error('[choa] Activity fetch exception:', err);
        }
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
            <div className="group bg-white/40 backdrop-blur-xl rounded-[3rem] p-8 border border-white/60 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-orange-200/40 hover:border-[#FF6600]/30 transition-all duration-700 relative overflow-hidden active:scale-[0.98] animate-in slide-in-from-bottom-8 duration-500">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-100/40 to-transparent rounded-bl-[6rem] -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative group-hover:rotate-3 transition-transform duration-500">
                                <div className="absolute -inset-2 bg-gradient-to-tr from-[#FF6600] to-amber-400 rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
                                <div className="relative w-20 h-20 rounded-3xl bg-gray-100 overflow-hidden border-4 border-white shadow-2xl">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF6600] to-orange-400 text-white text-2xl font-black">
                                            {(profile.first_name?.[0] || '?').toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {approvalCount > 0 && (
                                    <div className="absolute -bottom-2 -right-2 bg-[#124E35] text-white text-[10px] font-black px-2.5 py-1 rounded-xl border-4 border-white shadow-lg animate-bounce">
                                        {approvalCount}/2 <span className="text-[8px] opacity-70">SCEAUX</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="font-black text-2xl text-gray-900 tracking-tight group-hover:text-[#FF6600] transition-colors duration-300">
                                        {profile.first_name} {profile.last_name}
                                    </h3>
                                    <StatusBadge status={profile.status || 'pending'} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-[#FF6600] rounded-full text-[10px] font-black uppercase tracking-wider">
                                        <MapPin className="w-3 h-3" />
                                        {profile.village_origin || 'Village ?'}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{profile.quartier_nom || 'Quartier non assigné'}</span>
                                </div>
                                {profile.birth_date && (
                                    <p className="text-[11px] font-bold text-gray-400 pt-1">
                                        Né(e) le {new Date(profile.birth_date).toLocaleDateString('fr-FR')} • {profile.gender === 'Homme' ? '♂️ Homme' : profile.gender === 'Femme' ? '♀️ Femme' : 'Genre ?'}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-wider">
                                        <Home className="w-3 h-3" />
                                        Habite : {profile.residence_city || '—'}, {profile.residence_country || '—'}
                                    </div>
                                </div>

                                {/* Section Lignée sur la carte */}
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100/50">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Père</p>
                                        <p className="text-[11px] font-bold text-gray-900 truncate">
                                            {profile.metadata?.father_first_name || '—'} {profile.metadata?.father_last_name || ''}
                                            {profile.metadata?.father_status && <span className={`ml-1 text-[9px] font-black uppercase ${profile.metadata?.father_status === 'Vivant' ? 'text-green-500' : 'text-red-500'}`}>({profile.metadata?.father_status})</span>}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mère</p>
                                        <p className="text-[11px] font-bold text-gray-900 truncate">
                                            {profile.metadata?.mother_first_name || '—'} {profile.metadata?.mother_last_name || ''}
                                            {profile.metadata?.mother_status && <span className={`ml-1 text-[9px] font-black uppercase ${profile.metadata?.mother_status === 'Vivante' ? 'text-green-500' : 'text-red-500'}`}>({profile.metadata?.mother_status})</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 text-right">
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                                <Clock className="w-3.5 h-3.5" />
                                Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                            </div>

                            {/* Informations de rejet — Dashboard CHOA */}
                            {profile.status === 'rejected' && (profile.rejection_motif || profile.rejection_observations) && (
                                <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 animate-in zoom-in duration-300 w-full max-w-sm ml-auto">
                                    <div className="flex items-center gap-2 mb-2 text-red-700">
                                        <XCircle className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-wider text-right flex-1">Dossier Rejeté</span>
                                    </div>
                                    <div className="space-y-2 text-right">
                                        {profile.rejection_motif && (
                                            <p className="text-sm font-bold text-red-900 leading-tight">
                                                <span className="text-[10px] text-red-400 block uppercase mb-0.5">Motif principal :</span>
                                                {profile.rejection_motif}
                                            </p>
                                        )}
                                        {profile.rejection_observations && (
                                            <p className="text-xs text-red-700 bg-white/50 p-2 rounded-xl italic border border-red-50/50">
                                                <span className="text-[9px] text-red-400 not-italic block uppercase mb-1">Observations détaillées :</span>
                                                &ldquo;{profile.rejection_observations}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100/50 flex flex-wrap md:flex-nowrap items-center gap-4">
                        {showActions && (
                            alreadyApproved ? (
                                <div className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#124E35] text-white text-[11px] font-black uppercase tracking-[0.15em] shadow-xl shadow-green-100 opacity-90">
                                    <ShieldCheck className="w-5 h-5 text-orange-400" />
                                    VOTRE SCEAU EST APPOSÉ ✓
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleStatusChange(profile.id, 'probable')}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FF6600] to-orange-500 text-white text-[11px] font-black uppercase tracking-[0.15em] hover:from-[#e55c00] hover:to-[#FF6600] transition-all shadow-xl shadow-orange-200 active:scale-95 group/btn"
                                >
                                    <ShieldCheck className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-500" />
                                    APPOSER MON SCEAU 🟠
                                </button>
                            )
                        )}

                        <div className={`flex gap-3 w-full md:w-auto ${!showActions ? 'ml-auto' : ''}`}>
                            <button
                                onClick={() => setInfoModalProfile(profile)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gray-900 text-white hover:bg-[#FF6600] transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 group/eye"
                            >
                                <Eye className="w-4 h-4 group-hover/eye:scale-125 transition-transform" />
                                Examiner
                            </button>
                            <button
                                onClick={() => {
                                    setViewingCommentsProfile(profile);
                                    loadComments(profile.id);
                                }}
                                className="flex items-center justify-center p-4 rounded-2xl bg-orange-50 text-[#FF6600] hover:bg-[#FF6600] hover:text-white border border-orange-100 transition-all duration-300 relative group/msg"
                                title="Commentaires et Échanges"
                            >
                                <MessageSquare className="w-5 h-5 transition-transform group-hover/msg:scale-110" />
                            </button>
                            {showActions && (
                                <button
                                    onClick={() => setMotifModal({ id: profile.id, action: 'rejected' })}
                                    className="flex items-center justify-center p-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 transition-all duration-300 group/x"
                                    title="Rejeter le dossier"
                                >
                                    <XCircle className="w-5 h-5 transition-transform group-hover/x:rotate-90" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout
            role="choa"
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as any)}
            userName={`${myProfile?.first_name ?? ''} ${myProfile?.last_name ?? ''}`}
            userAvatar={myProfile?.avatar_url ?? null}
            onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            village={myProfile?.village_origin || 'Toa-Zéo'}
        >
            {/* Hero Section with ouf effect */}
            <div className="relative mb-12 p-10 rounded-[3rem] bg-gray-900 overflow-hidden shadow-2xl shadow-orange-900/10 border border-white/5">
                <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-[#FF6600]/10 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Tableau de Validation Alpha (CHOa)</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Gestion du <span className="text-[#FF6600]">Patrimoine</span> {(myProfile?.role === 'admin' || myProfile?.role === 'cho') ? '(Mode Admin)' : '(Assistant)'}
                        </h1>
                        <p className="text-gray-400 font-medium max-w-md">
                            {myProfile?.role === 'admin' 
                                ? "Vue administrative du village. Vous pouvez consulter et superviser les validations en cours." 
                                : "En tant que CHOa, vous êtes le garant de la lignée. Votre sceau permet de transférer les dossiers au CHO pour validation finale."}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3 text-right">
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* Diagnostic Badge */}
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${pendingProfiles.length > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                    {pendingProfiles.length} Dossiers en attente
                                </span>
                            </div>
                            
                            <button
                                onClick={load}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors group"
                                title="Rafraîchir les dossiers"
                            >
                                <Activity className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            </button>
                            <div className="p-5 bg-white/5 backdrop-blur-lg rounded-[2.5rem] border border-white/10 min-w-[200px]">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Circonscription</p>
                                <div className="flex items-center justify-end gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-sm font-black text-white">{myProfile?.village_origin || 'NON RENSEIGNÉE'}</p>
                                </div>
                                <p className="text-[10px] font-bold text-orange-400 mt-1 uppercase tracking-widest">{myProfile?.quartier_nom || 'Secteur Central'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-12 overflow-x-auto pb-6 px-2 scrollbar-hide no-scrollbar uppercase tracking-[0.1em]">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] text-[11px] font-black tracking-[0.15em] transition-all duration-500 whitespace-nowrap relative group ${activeTab === tab.key ? 'bg-gray-900 text-white shadow-2xl shadow-gray-400 -translate-y-1' : 'bg-white/50 backdrop-blur-md border border-white/60 text-gray-500 hover:bg-white hover:text-[#FF6600] hover:shadow-xl hover:shadow-orange-100 hover:-translate-y-0.5'}`}
                    >
                        <div className={`p-2 rounded-xl transition-colors duration-500 ${activeTab === tab.key ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-[#FF6600]'}`}>
                            <tab.icon className="w-4 h-4" />
                        </div>
                        {tab.label}
                        {tab.count > 0 && <span className={`${tab.countColor} text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow-lg animate-in zoom-in duration-500`}>{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* Contenu des onglets dynamique */}
            <div className="space-y-4">
                {activeTab === 'mon_arbre' && currentUserId && (
                    <div className="mt-4">
                        <UserDashboardContent userId={currentUserId} />
                    </div>
                )}

                {isLoading && activeTab !== 'mon_arbre' ? (
                    <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-xl">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-[#FF6600] rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Récupération des dossiers...</h2>
                        <p className="text-gray-500 font-medium">Veuillez patienter.</p>
                    </div>
                ) : (
                    activeTab !== 'mon_arbre' && (
                        <>
                            {/* Onglet : À Valider */}
                            {activeTab === 'tasks' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-black text-gray-900 uppercase">Dossiers à traiter ({pendingProfiles.length})</h2>
                                        </div>
                                        {pendingProfiles.length === 0 ? (
                                            <EmptyTabState message="Aucun dossier en attente de validation." icon={Clock} />
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {pendingProfiles.map(p => <ProfileCard key={p.id} profile={p} />)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Onglet : Envoyés au CHO */}
                            {activeTab === 'sent_cho' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-black text-gray-900 uppercase">Envoyés au CHO ({sentToChoProfiles.length})</h2>
                                        {sentToChoProfiles.length === 0 ? (
                                            <EmptyTabState message="Aucun dossier n'a été transmis au Chef d'Honneur." icon={ShieldCheck} />
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {sentToChoProfiles.map(p => <ProfileCard key={p.id} profile={p} showActions={false} />)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Onglet : Certifiés */}
                            {activeTab === 'confirmed' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-black text-gray-900 uppercase">Certifiés ({confirmedProfiles.length})</h2>
                                        {confirmedProfiles.length === 0 ? (
                                            <EmptyTabState message="Aucun dossier n'est encore certifié." icon={CheckCircle} />
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {confirmedProfiles.map(p => <ProfileCard key={p.id} profile={p} showActions={false} />)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Onglet : Rejetés */}
                            {activeTab === 'rejected' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-black text-gray-900 uppercase">Rejetés ({rejectedProfiles.length})</h2>
                                        {rejectedProfiles.length === 0 ? (
                                            <EmptyTabState message="Aucun dossier rejeté pour le moment." icon={XCircle} />
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {rejectedProfiles.map(p => <ProfileCard key={p.id} profile={p} showActions={false} />)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Onglet : Activité Quartier */}
                            {activeTab === 'quartier' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-black text-gray-900 uppercase">Activité ({quartierActivity.length})</h2>
                                        <button onClick={loadQuartierActivity} className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{isLoadingActivity ? '...' : 'Actualiser'}</button>
                                    </div>
                                    {quartierActivity.length === 0 ? (
                                        <EmptyTabState message="Aucune activité récente enregistrée." icon={Activity} />
                                    ) : (
                                        <div className="space-y-3">
                                            {quartierActivity.map(act => (
                                                <div key={act.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between gap-4 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400 capitalize">{act.validator_name?.[0] || '?'}</div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900">{act.validator_name}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase font-bold">{act.cible_first_name} {act.cible_last_name}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${act.statut === 'confirmed' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {act.statut === 'confirmed' ? 'Certifié' : 'Approuvé'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )
                )}
            </div>

            {/* Modale Motif de Rejet */}
            {
                motifModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in">
                        <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in">
                            <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">Motif de Rejet</h3>
                            <p className="text-xs text-gray-500 mb-6 font-medium">Pourquoi ce profil ne peut-il pas être validé ?</p>

                            <textarea
                                value={motifText}
                                onChange={e => setMotifText(e.target.value)}
                                rows={4}
                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition-all text-sm font-medium mb-4"
                                placeholder="Expliquez ici le motif du refus..."
                            />

                            <div className="flex gap-3">
                                <button onClick={() => setMotifModal(null)} className="flex-1 py-4 rounded-2xl border border-gray-100 text-sm font-black text-gray-400 hover:bg-gray-50 transition-all">ANNULER</button>
                                <button
                                    onClick={() => motifModal && handleStatusChange(motifModal.id, 'rejected')}
                                    disabled={!motifText.trim()}
                                    className="flex-1 py-4 rounded-2xl bg-red-500 text-white text-sm font-black hover:bg-red-600 disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-xl shadow-red-100"
                                >
                                    CONFIRMER
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modale Infos Complètes */}
            {
                infoModalProfile && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[160] p-4 animate-in fade-in">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in border border-white/20">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                        <Eye className="w-6 h-6 text-[#FF6600]" />
                                    </div>
                                    <h3 className="font-black text-xl text-gray-900">Dossier Officiel</h3>
                                </div>
                                <button onClick={() => setInfoModalProfile(null)} className="p-3 hover:bg-red-50 rounded-2xl transition-all active:scale-90 group">
                                    <XCircle className="w-6 h-6 text-gray-300 group-hover:text-red-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm">
                                    <div className="w-24 h-24 rounded-3xl bg-white text-[#FF6600] flex items-center justify-center text-4xl font-black overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
                                        {infoModalProfile.avatar_url ? <img src={infoModalProfile.avatar_url} alt="Photo" className="w-full h-full object-cover" /> : infoModalProfile.first_name?.[0]}
                                    </div>
                                    <div>
                                        <h2 className="font-black text-2xl text-gray-900 leading-tight">{infoModalProfile.first_name} {infoModalProfile.last_name}</h2>
                                        <p className="text-xs font-black text-orange-600 uppercase tracking-widest mt-1">{infoModalProfile.village_origin} • {infoModalProfile.quartier_nom}</p>
                                    </div>
                                </div>

                                {infoModalProfile.status === 'rejected' && (infoModalProfile.rejection_motif || infoModalProfile.rejection_observations) && (
                                    <div className="p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] animate-in zoom-in duration-500">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-red-500 rounded-xl">
                                                <XCircle className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-red-900 uppercase tracking-widest leading-none">Dossier Rejeté</h4>
                                                <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">Décision CHO</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {infoModalProfile.rejection_motif && (
                                                <div className="bg-white/80 p-4 rounded-2xl border border-red-50">
                                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Motif principal :</p>
                                                    <p className="text-sm font-bold text-gray-900 leading-relaxed">{infoModalProfile.rejection_motif}</p>
                                                </div>
                                            )}
                                            {infoModalProfile.rejection_observations && (
                                                <div className="bg-white/50 p-4 rounded-2xl border border-red-50/50 italic">
                                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 not-italic">Observations complémentaires :</p>
                                                    <p className="text-xs text-red-700">“{infoModalProfile.rejection_observations}”</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 bg-orange-50/50 rounded-3xl border border-orange-100/50">
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Père</p>
                                        <p className="font-bold text-gray-900 text-sm">
                                            {infoModalProfile.metadata?.father_first_name || '—'} {infoModalProfile.metadata?.father_last_name || ''}
                                        </p>
                                    </div>
                                    <div className="p-5 bg-pink-50/50 rounded-3xl border border-pink-100/50">
                                        <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">Mère</p>
                                        <p className="font-bold text-gray-900 text-sm">
                                            {infoModalProfile.metadata?.mother_first_name || '—'} {infoModalProfile.metadata?.mother_last_name || ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100/30">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Résidence</p>
                                            <p className="font-bold text-gray-900 text-sm">{infoModalProfile.residence_city}, {infoModalProfile.residence_country}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Naissance</p>
                                            <p className="font-bold text-gray-900 text-sm">{infoModalProfile.birth_date ? new Date(infoModalProfile.birth_date).toLocaleDateString('fr-FR') : '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-gray-100 bg-white/95 backdrop-blur-md sticky bottom-0 flex gap-4">
                                <button onClick={() => { if (infoModalProfile) { setInfoModalProfile(null); setMotifModal({ id: infoModalProfile.id, action: 'rejected' }); } }} className="flex-1 py-5 rounded-[1.5rem] bg-red-50 text-red-500 font-black text-sm hover:bg-red-100 transition-all border border-red-100 uppercase tracking-widest">REJETER</button>
                                <button
                                    onClick={() => { if (infoModalProfile) { setInfoModalProfile(null); handleStatusChange(infoModalProfile.id, 'probable'); } }}
                                    disabled={!infoModalProfile || (Array.isArray(infoModalProfile.choa_approvals) && currentUserId ? infoModalProfile.choa_approvals.includes(currentUserId) : false)}
                                    className="flex-1 py-5 rounded-[1.5rem] bg-[#FF6600] text-white font-black text-sm hover:bg-[#e55c00] disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-xl shadow-orange-100 active:scale-[0.98] uppercase tracking-widest"
                                >
                                    {infoModalProfile && Array.isArray(infoModalProfile.choa_approvals) && currentUserId && infoModalProfile.choa_approvals.includes(currentUserId) ? 'APPROUVÉ ✓' : 'APPOSER MON SCEAU'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modale Commentaires */}
            {
                viewingCommentsProfile && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-500 border border-white/20">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-[#FF6600]" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-gray-900 leading-tight">Échanges</h3>
                                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">{viewingCommentsProfile?.first_name} {viewingCommentsProfile?.last_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingCommentsProfile(null)} className="p-3 hover:bg-red-50 rounded-2xl transition-all active:scale-90 group">
                                    <XCircle className="w-6 h-6 text-gray-300 group-hover:text-red-500" />
                                </button>
                            </div>

                            {/* Section Motif de Rejet */}
                            {viewingCommentsProfile.status === 'rejected' && viewingCommentsProfile.rejection_motif && (
                                <div className="px-8 py-5 bg-red-50/80 border-b border-red-100/50 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        <h4 className="text-xs font-black uppercase tracking-widest text-red-800">Dossier Rejeté</h4>
                                    </div>
                                    <div className="bg-white/60 p-4 rounded-2xl border border-red-100 shadow-sm">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Motif principal</p>
                                        <p className="text-sm font-semibold text-red-900">{viewingCommentsProfile.rejection_motif}</p>
                                        
                                        {viewingCommentsProfile.rejection_observations && (
                                            <>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-3 mb-1">Observations détaillées</p>
                                                <p className="text-sm text-gray-800 italic">{viewingCommentsProfile.rejection_observations}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 h-full">
                                {comments.length === 0 ? (
                                    <div className="text-center py-16 h-full flex flex-col justify-center">
                                        <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 opacity-50">
                                            <MessageSquare className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Aucun Échange</p>
                                    </div>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className={`flex flex-col ${comment.author_id === currentUserId ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                            <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-sm shadow-sm ${comment.author_id === currentUserId ? 'bg-[#FF6600] text-white rounded-tr-none shadow-orange-100' : 'bg-white border border-gray-100 rounded-tl-none shadow-sm'}`}>
                                                <p className="font-black text-[9px] mb-2 opacity-80 uppercase tracking-widest">{comment.author_name}</p>
                                                <p className="leading-relaxed font-medium">{comment.content}</p>
                                            </div>
                                            <span className="text-[9px] text-gray-400 mt-2 uppercase font-black tracking-widest px-2">{new Date(comment.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-white">
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-[2rem] border border-gray-100 focus-within:ring-4 focus-within:ring-orange-50 focus-within:border-[#FF6600] transition-all">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Répondre..."
                                        onKeyUp={e => e.key === 'Enter' && viewingCommentsProfile && handlePostComment(viewingCommentsProfile.id)}
                                        className="flex-1 px-4 py-3 bg-transparent outline-none transition-all text-[15px] font-medium placeholder-gray-400 text-gray-900"
                                    />
                                    <button
                                        onClick={() => viewingCommentsProfile && handlePostComment(viewingCommentsProfile.id)}
                                        disabled={!newComment.trim() || isPostingComment}
                                        className="h-12 w-12 rounded-[1.5rem] bg-gray-900 text-white font-black hover:bg-[#FF6600] disabled:opacity-50 disabled:hover:bg-gray-900 transition-colors shadow-sm active:scale-95 flex items-center justify-center flex-shrink-0"
                                    >
                                        {isPostingComment ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </AppLayout >
    );
}
