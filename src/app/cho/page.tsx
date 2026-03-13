"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import {
    ShieldCheck, CheckCircle, Clock, XCircle, LogOut,
    Eye, MessageSquare, Users, TreePine, Stamp, Share2, Download, Lock, MapPin, Home
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import InviteModal from '@/components/InviteModal';
import UserDashboardContent from '@/components/UserDashboardContent';
import AppLayout from '@/components/AppLayout';
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
    gender?: string;
    residence_country?: string;
    residence_city?: string;
    mother_birth_date?: string;
    metadata?: any;
    pre_validated_by?: string | null;
    choa_approvals?: string[];
    choa_names?: string[];
    phone_1?: string;
    whatsapp_1?: string;
    niveau_etudes?: string;
    emploi?: string;
    fonction?: string;
    rejection_motif?: string | null;
    rejection_observations?: string | null;
    validations?: Array<{ validator_id: string; profiles: Array<{ first_name: string; last_name: string }> }>;
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
    export_authorized: boolean;
    export_requested: boolean;
    avatar_url?: string | null;
}

interface CHOa {
    id: string;
    first_name: string;
    last_name: string;
    quartier_nom: string;
    avatar_url?: string | null;
    created_at: string;
    status: string;
}

export default function ChoBoard() {
    const router = useRouter();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'mon_arbre' | 'tasks' | 'confirmed' | 'rejected' | 'ancestor' | 'team'>('tasks');
    const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([]);
    const [confirmedProfiles, setConfirmedProfiles] = useState<PendingProfile[]>([]);
    const [rejectedProfiles, setRejectedProfiles] = useState<PendingProfile[]>([]);
    const [team, setTeam] = useState<CHOa[]>([]);
    const [comments, setComments] = useState<ValidationComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [motifModal, setMotifModal] = useState<{ id: string; action: 'confirmed' | 'probable' | 'rejected' } | null>(null);
    const [viewingCommentsProfile, setViewingCommentsProfile] = useState<PendingProfile | null>(null);
    const [infoModalProfile, setInfoModalProfile] = useState<PendingProfile | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [motifText, setMotifText] = useState('');
    const [observations, setObservations] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    // États formulaire ancêtre
    const [ancestreNom, setAncetreNom] = useState('');
    const [ancestrePeriode, setAncretrePeriode] = useState('');
    const [ancestreSource, setAncetreSource] = useState('');
    const [isSavingAncetre, setIsSavingAncetre] = useState(false);
    const [ancestreSaved, setAncretreSaved] = useState(false);

    // Pagination States
    const [pendingPage, setPendingPage] = useState(1);
    const [confirmedPage, setConfirmedPage] = useState(1);
    const [rejectedPage, setRejectedPage] = useState(1);
    const [teamPage, setTeamPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const load = async () => {
            const isAnyLoaded = pendingProfiles.length > 0 || confirmedProfiles.length > 0 || rejectedProfiles.length > 0;
            if (!isAnyLoaded) setIsLoading(true);
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setIsLoading(false); router.push('/login'); return; }
            setCurrentUserId(session.user.id);

            try {
                const res = await fetch('/api/cho/profiles', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await res.json();
                
                if (data.profiles) {
                    const all: any[] = data.profiles;
                    setPendingProfiles(all.filter((u: any) => u.status === 'probable'));
                    setConfirmedProfiles(all.filter((u: any) => u.status === 'confirmed'));
                    setRejectedProfiles(all.filter((u: any) => u.status === 'rejected'));
                }
                if (data.team) setTeam(data.team);
                if (data.me) setMyProfile(data.me);

                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', session.user.id)
                    .eq('is_read', false);
                setUnreadCount(count || 0);

            } catch (err) {
                console.error("Erreur chargement CHO:", err);
            } finally {
                setIsLoading(false);
            }
        };

        load();
        
        const interval = setInterval(load, 120000);
        return () => clearInterval(interval);
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

        const { error: updateErr } = await supabase.from('profiles').update(updateData).eq('id', profileId);
        if (updateErr) { alert('Erreur mise à jour : ' + updateErr.message); return; }

        // Enregistrement détaillé de la validation CHO via la fonction SQL
        if (newStatus === 'confirmed' || newStatus === 'rejected') {
            await supabase.rpc('record_validation', {
                p_profile_id: profileId,
                p_new_status: newStatus,
                p_final: isFinal || newStatus === 'confirmed',
                p_motif: motifText || null,
                p_observations: observations || (newStatus === 'confirmed' ? 'Validation finale CHO' : null)
            });
        }

        // Rafraîchir
        if (newStatus === 'probable') {
            setPendingProfiles(prev => prev.map(p => p.id === profileId ? { ...p, status: 'probable' } : p));
        } else {
            const profileToMove = pendingProfiles.find(p => p.id === profileId);
            setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
            if (newStatus === 'confirmed' && profileToMove) {
                setConfirmedProfiles(prev => [...prev, { ...profileToMove, status: 'confirmed' }]);
            }
            if (newStatus === 'rejected' && profileToMove) {
                setRejectedProfiles(prev => [...prev, { ...profileToMove, status: 'rejected' }]);
            }
        }

        setMotifModal(null);
        setMotifText('');
        setObservations('');

        if (newStatus === 'confirmed') {
            alert("✅ Bascule Patrimoniale réussie ! L'utilisateur est désormais officiellement reconnu dans les registres du village.");
        } else if (newStatus === 'probable') {
            alert("🟠 Statut mis à jour sur 'Probable'. Dossier en attente de vérification complémentaire.");
        } else if (newStatus === 'rejected') {
            alert("❌ Dossier rejeté avec succès.");
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
        { key: 'confirmed', label: 'Certifiés ✅', icon: CheckCircle, count: confirmedProfiles.length, countColor: 'bg-green-500' },
        { key: 'rejected', label: 'Rejetés', icon: XCircle, count: rejectedProfiles.length, countColor: 'bg-red-500' },
        { key: 'ancestor', label: 'Ancêtre Village', icon: Stamp, count: 0, countColor: 'bg-purple-500' },
        { key: 'team', label: 'Mon Équipe', icon: Users, count: team.length, countColor: 'bg-blue-500' },
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
        <div className="group bg-white/40 backdrop-blur-xl rounded-[3rem] p-8 border border-white/60 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-orange-200/40 hover:border-[#FF6600]/30 transition-all duration-700 relative overflow-hidden active:scale-[0.98] animate-in slide-in-from-bottom-8 duration-500">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-100/40 to-transparent rounded-bl-[6rem] -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-50/30 to-transparent rounded-tr-[4rem] -ml-8 -mb-8" />

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
                            {profile.status === 'confirmed' && (
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-xl border-4 border-white shadow-lg animate-bounce">
                                    <CheckCircle className="w-4 h-4" />
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
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{profile.quartier_nom || 'Quartier ?'}</span>
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

                        {/* Informations de rejet — Enrichies */}
                        {profile.status === 'rejected' && (profile.rejection_motif || profile.rejection_observations) && (
                            <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 animate-in zoom-in duration-300">
                                <div className="flex items-center gap-2 mb-2 text-red-700">
                                    <XCircle className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-wider">Dossier Rejeté</span>
                                </div>
                                <div className="space-y-2">
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
                                    <div className="pt-2 border-t border-red-100 flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Décision finale du CHO</span>
                                        <div className="flex items-center gap-1.5 grayscale opacity-70">
                                            <div className="w-4 h-4 rounded-full bg-red-200" />
                                            <span className="text-[9px] font-black text-red-600 uppercase">Validé par le système</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {profile.status === 'probable' && Array.isArray(profile.choa_names) && profile.choa_names.length > 0 && (
                            <div className="flex flex-col items-end gap-1.5">
                                <span className="text-[9px] font-black text-[#124E35] uppercase tracking-widest pr-2">Scellé par les CHOa :</span>
                                <div className="flex flex-wrap justify-end gap-2">
                                    {profile.choa_names.map((name, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px] font-black text-white bg-[#124E35] px-3 py-1.5 rounded-xl shadow-lg shadow-green-900/10">
                                            <ShieldCheck className="w-3 h-3 text-orange-400" />
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showActions && (
                    <div className="mt-8 pt-8 border-t border-gray-100/50 flex flex-wrap md:flex-nowrap items-center gap-4">
                        <button
                            onClick={() => handleStatusChange(profile.id, 'confirmed', true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.15em] hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl shadow-green-200 active:scale-95 group/btn"
                        >
                            <Stamp className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-500" />
                            BASCULE PATRIMONIALE ✅
                        </button>

                        <div className="flex gap-3 w-full md:w-auto">
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
                                title="Commentaires et Audit"
                            >
                                <MessageSquare className="w-5 h-5 transition-transform group-hover/msg:scale-110" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6600] rounded-full border-2 border-white group-hover:bg-white transition-colors" />
                            </button>
                            <button
                                onClick={() => setMotifModal({ id: profile.id, action: 'rejected' })}
                                className="flex items-center justify-center p-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 transition-all duration-300 group/x"
                                title="Rejeter le dossier"
                            >
                                <XCircle className="w-5 h-5 transition-transform group-hover/x:rotate-90" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <AppLayout
            role="cho"
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as any)}
            userName={(myProfile?.first_name || myProfile?.last_name) ? `${myProfile.first_name || ''} ${myProfile.last_name || ''}`.trim() : 'Chargement...'}
            userAvatar={myProfile?.avatar_url || null}
            onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            village={myProfile?.village_origin || 'Toa-Zéo'}
        >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 bg-[#FF6600]/10 backdrop-blur-md rounded-full border border-orange-100/50">
                            <p className="text-[10px] font-black text-[#FF6600] uppercase tracking-[0.2em]">Tableau de Validation Alpha</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">
                        Gestion du <span className="text-[#FF6600]">Patrimoine</span>
                    </h1>
                    <p className="text-gray-500 font-medium max-w-md">
                        Bienvenue, Commandant. Votre expertise assure l&apos;intégrité et la pérennité de l&apos;arbre de <span className="text-gray-900 font-bold">{myProfile?.village_origin || 'Toa-Zéo'}</span>.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="p-4 bg-white shadow-sm rounded-[2rem] border border-gray-100 text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Session active</p>
                        <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
                        <div className={`p-2 rounded-xl transition-colors duration-500 ${activeTab === tab.key ? 'bg-[#FF6600]/20 text-[#FF6600]' : 'bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-[#FF6600]'}`}>
                            <tab.icon className="w-4 h-4" />
                        </div>
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`${tab.countColor} text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow-lg animate-in zoom-in duration-500`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {
                activeTab === 'mon_arbre' && currentUserId && (
                    <div className="mt-4">
                        <UserDashboardContent userId={currentUserId} />
                    </div>
                )
            }

            {/* À valider */}
            {
                activeTab === 'tasks' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Dossiers en attente ({pendingProfiles.length})
                            </h2>
                            {myProfile?.export_authorized ? (
                                <button
                                    onClick={() => handleExport(pendingProfiles, 'en_attente')}
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
                )
            }

            {/* Confirmés */}
            {
                activeTab === 'confirmed' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-3 h-3" /> Dossiers Certifiés ✅ ({confirmedProfiles.length})
                            </h2>
                            {myProfile?.export_authorized && (
                                <button
                                    onClick={() => handleExport(confirmedProfiles, 'confirmes')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    <Download className="w-3 h-3" /> Exporter
                                </button>
                            )}
                        </div>
                        {confirmedProfiles.length === 0 && <p className="text-sm text-gray-600 text-center py-8">Aucun profil confirmé pour l&apos;instant.</p>}
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
                )
            }

            {/* Rejetés */}
            {
                activeTab === 'rejected' && (
                    <div className="space-y-4">
                        {rejectedProfiles.length === 0 && <p className="text-sm text-gray-600 text-center py-8">Aucun profil rejeté.</p>}
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
                )
            }

            {
                activeTab === 'ancestor' && (
                    <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl shadow-purple-100 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />

                        <div className="w-24 h-24 bg-purple-50 rounded-[2rem] flex items-center justify-center mb-6 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <TreePine className="w-12 h-12 text-purple-600" />
                        </div>

                        <h2 className="font-black text-3xl text-gray-900 mb-2">Inscrire l'Ancêtre Fondateur</h2>
                        <p className="text-gray-500 font-medium mb-10 max-w-sm">Cette action certifie immuablement l'origine du village dans le Grand Registre Patrimonial.</p>

                        {ancestreSaved ? (
                            <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="font-black text-2xl text-gray-900 mb-2">Ancêtre Certifié !</h3>
                                <p className="text-gray-500 font-medium">L'ancêtre <strong>{ancestreNom}</strong> est désormais le socle de ce village.</p>
                                <button onClick={() => setAncretreSaved(false)} className="mt-8 text-sm font-black text-purple-600 hover:underline">Inscrire un autre ancêtre</button>
                            </div>
                        ) : (
                            <div className="w-full space-y-5 text-left">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identité Nominale</label>
                                    <input
                                        type="text"
                                        value={ancestreNom}
                                        onChange={e => setAncetreNom(e.target.value)}
                                        placeholder="Ex: Fondateur TAESSOO..."
                                        className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 outline-none text-base font-bold transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Époque / Siècle</label>
                                        <input
                                            type="text"
                                            value={ancestrePeriode}
                                            onChange={e => setAncretrePeriode(e.target.value)}
                                            placeholder="Ex: ~1850"
                                            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 outline-none text-sm font-bold transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Source du Savoir</label>
                                        <input
                                            type="text"
                                            value={ancestreSource}
                                            onChange={e => setAncetreSource(e.target.value)}
                                            placeholder="Tradition Orale..."
                                            className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 outline-none text-sm font-bold transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={!ancestreNom.trim() || isSavingAncetre}
                                    onClick={async () => {
                                        if (!ancestreNom.trim()) return;
                                        setIsSavingAncetre(true);
                                        const { data: village } = await supabase.from('villages').select('id').eq('nom', myProfile?.village_origin || 'Toa-Zéo').single();
                                        if (village) {
                                            await supabase.from('ancestres').insert({
                                                village_id: village.id,
                                                nom_complet: ancestreNom,
                                                periode: ancestrePeriode,
                                                source: ancestreSource,
                                                is_certified: true,
                                                certified_by: (await supabase.auth.getUser()).data.user?.id,
                                                certified_at: new Date().toISOString()
                                            });
                                        }
                                        setIsSavingAncetre(false);
                                        setAncretreSaved(true);
                                    }}
                                    className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 text-white py-5 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-gray-200 active:scale-[0.98] mt-4"
                                >
                                    {isSavingAncetre
                                        ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                        : <><Stamp className="w-6 h-6 text-[#FF6600]" /> SCELLER L'HISTOIRE</>
                                    }
                                </button>
                                <p className="text-[10px] text-gray-400 text-center font-bold tracking-widest uppercase mt-4">Action irréversible • Protocole CHO de Grade S</p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Équipe */}
            {
                activeTab === 'team' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">Mon Équipe villageoise</h1>
                                <p className="text-sm text-gray-600">Adjoints (CHOa) certifiés pour le village de {myProfile?.village_origin}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(() => {
                                const paginatedTeam = team.slice((teamPage - 1) * itemsPerPage, teamPage * itemsPerPage);
                                return paginatedTeam.map(member => (
                                    <div key={member.id} className="group bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-black overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    (member.first_name?.[0] || '?').toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900 leading-tight">{member.first_name} {member.last_name}</h3>
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{member.quartier_nom || 'Secteur Libre'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Certifié le {new Date(member.created_at).toLocaleDateString('fr-FR')}</span>
                                            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-[8px] font-black text-green-600 uppercase">Actif</span>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}

                            {team.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Users className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <p className="text-gray-900 font-black text-xl">Aucun Adjoint Détecté</p>
                                    <p className="text-gray-500 font-medium max-w-xs mx-auto mt-2 text-sm italic">Les CHOa certifiés apparaîtront ici pour coordonner la validation.</p>
                                    <button className="mt-8 text-[10px] font-black text-[#FF6600] px-6 py-3 bg-orange-50 rounded-full border border-orange-100 uppercase tracking-widest">Contacter l'Administration</button>
                                </div>
                            )}
                        </div>

                        {/* Pagination Équipe */}
                        {Math.ceil(team.length / itemsPerPage) > 1 && (
                            <div className="p-4 flex justify-center items-center gap-2 mt-2">
                                <button disabled={teamPage === 1} onClick={() => setTeamPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Précédent</button>
                                <span className="text-sm font-semibold text-gray-600">Page {teamPage} sur {Math.ceil(team.length / itemsPerPage)}</span>
                                <button disabled={teamPage === Math.ceil(team.length / itemsPerPage)} onClick={() => setTeamPage(prev => Math.min(Math.ceil(team.length / itemsPerPage), prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Suivant</button>
                            </div>
                        )}

                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 mt-4">
                            <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div className="text-xs text-blue-700 leading-relaxed">
                                <p className="font-bold mb-1">Rappel de Gouvernance</p>
                                Les CHOa sont vos adjoints locaux. Ils effectuent les pré-validations (Statut Probable) au sein de leurs quartiers respectifs. En tant que CHO, vous validez définitivement (Bascule Patrimoniale) après leur passage.
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modale Dossier Complet CHO */}
            {
                infoModalProfile && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                                <h3 className="font-black text-lg flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-green-600" /> Dossier Officiel — Validation CHO
                                </h3>
                                <button onClick={() => setInfoModalProfile(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                    <XCircle className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 text-green-600 flex items-center justify-center text-3xl font-black overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                        {infoModalProfile.avatar_url ? (
                                            <img src={infoModalProfile.avatar_url} alt="Photo" className="w-full h-full object-cover" />
                                        ) : (
                                            (infoModalProfile.first_name?.[0] || '?').toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-xl text-gray-900">{infoModalProfile.first_name} {infoModalProfile.last_name}</p>
                                        <StatusBadge status={infoModalProfile.status || 'probable'} />
                                        <p className="text-xs text-gray-500 mt-1 font-medium">
                                            Inscrit le {new Date(infoModalProfile.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                {infoModalProfile.status === 'rejected' && (infoModalProfile.rejection_motif || infoModalProfile.rejection_observations) && (
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 animate-in zoom-in duration-300">
                                        <div className="flex items-center gap-2 mb-2 text-red-700">
                                            <XCircle className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-wider">Dossier Rejeté</span>
                                        </div>
                                        <div className="space-y-2">
                                            {infoModalProfile.rejection_motif && (
                                                <p className="text-sm font-bold text-red-900 leading-tight">
                                                    <span className="text-[10px] text-red-400 block uppercase mb-0.5">Motif principal :</span>
                                                    {infoModalProfile.rejection_motif}
                                                </p>
                                            )}
                                            {infoModalProfile.rejection_observations && (
                                                <p className="text-xs text-red-700 bg-white/50 p-2 rounded-xl italic border border-red-50/50">
                                                    <span className="text-[9px] text-red-400 not-italic block uppercase mb-1">Observations détaillées :</span>
                                                    &ldquo;{infoModalProfile.rejection_observations}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                    <h4 className="text-[10px] font-black uppercase text-[#FF6600] mb-3 tracking-widest">Identité</h4>
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

                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                    <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-3 tracking-widest">Contact & Profession</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Téléphone</p>
                                            <p className="font-bold text-gray-900">{infoModalProfile.phone_1 || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">WhatsApp</p>
                                            <p className="font-bold text-emerald-600">{infoModalProfile.whatsapp_1 || '—'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Profession / Emploi</p>
                                            <p className="font-bold text-gray-900">{infoModalProfile.emploi || infoModalProfile.fonction || 'Non renseigné'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Niveau d'études</p>
                                            <p className="font-bold text-gray-900">{infoModalProfile.niveau_etudes || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

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

                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                    <h4 className="text-[10px] font-black uppercase text-blue-500 mb-3 tracking-widest">Père</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Nom & Prénoms</p>
                                            <p className="font-bold text-gray-900">
                                                {(infoModalProfile.metadata?.father_first_name || infoModalProfile.metadata?.father_last_name)
                                                    ? `${infoModalProfile.metadata?.father_first_name || ''} ${infoModalProfile.metadata?.father_last_name || ''}`.trim()
                                                    : '— Non renseigné'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Date de naissance</p>
                                            <p className="font-bold text-gray-900">
                                                {infoModalProfile.metadata?.father_birth_date ? new Date(infoModalProfile.metadata?.father_birth_date).toLocaleDateString('fr-FR') : '— N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100">
                                    <h4 className="text-[10px] font-black uppercase text-pink-500 mb-3 tracking-widest">Mère</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Nom & Prénoms</p>
                                            <p className="font-bold text-gray-900">
                                                {(infoModalProfile.metadata?.mother_first_name || infoModalProfile.metadata?.mother_last_name)
                                                    ? `${infoModalProfile.metadata?.mother_first_name || ''} ${infoModalProfile.metadata?.mother_last_name || ''}`.trim()
                                                    : '— Non renseigné'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Date de naissance</p>
                                            <p className="font-bold text-gray-900">
                                                {infoModalProfile.metadata?.mother_birth_date ? new Date(infoModalProfile.metadata?.mother_birth_date).toLocaleDateString('fr-FR') : '— N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                                <button
                                    onClick={() => { setInfoModalProfile(null); setMotifModal({ id: infoModalProfile.id, action: 'rejected' }); }}
                                    className="flex-1 py-3 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-colors border border-red-100"
                                >
                                    Rejeter ✗
                                </button>
                                <button
                                    onClick={() => { setInfoModalProfile(null); handleStatusChange(infoModalProfile.id, 'confirmed', true); }}
                                    className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                                >
                                    Bascule Patrimoniale ✅
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modale Motif de Rejet */}
            {
                motifModal && (
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
                )
            }

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
            {
                viewingCommentsProfile && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-500 border border-white/20">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-[#FF6600]" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-gray-900 leading-tight">Échanges</h3>
                                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">{viewingCommentsProfile.first_name} {viewingCommentsProfile.last_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingCommentsProfile(null)} className="p-3 hover:bg-red-50 rounded-2xl transition-all active:scale-90 group">
                                    <XCircle className="w-6 h-6 text-gray-300 group-hover:text-red-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
                                {comments.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 opacity-50">
                                            <MessageSquare className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Aucun message</p>
                                    </div>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className={`flex flex-col ${comment.author_id === currentUserId ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                            <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-sm shadow-sm ${comment.author_id === currentUserId ? 'bg-[#FF6600] text-white rounded-tr-none shadow-orange-100' : 'bg-white border border-gray-100 rounded-tl-none'}`}>
                                                <p className="font-black text-[9px] mb-2 opacity-80 uppercase tracking-[0.15em] border-b border-white/20 pb-1">{comment.author_name}</p>
                                                <p className="leading-relaxed font-medium">{comment.content}</p>
                                            </div>
                                            <span className="text-[9px] text-gray-400 mt-2 uppercase font-black tracking-widest px-2">{new Date(comment.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-8 border-t border-gray-100 bg-white">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Note de validation..."
                                        onKeyUp={e => e.key === 'Enter' && handlePostComment(viewingCommentsProfile.id)}
                                        className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 outline-none transition-all text-sm font-medium"
                                    />
                                    <button
                                        onClick={() => handlePostComment(viewingCommentsProfile.id)}
                                        disabled={!newComment.trim() || isPostingComment}
                                        className="px-8 py-4 bg-[#FF6600] text-white rounded-2xl font-black text-sm hover:bg-[#e55c00] disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-xl shadow-orange-100 active:scale-95 flex items-center justify-center min-w-[100px]"
                                    >
                                        {isPostingComment ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'PUBLIER'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }


            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                inviterName={`${myProfile?.first_name || ''} ${myProfile?.last_name || ''}`}
                villageNom={myProfile?.village_origin || 'Toa-Zéo'}
            />

            {currentUserId && myProfile && <InternalMessaging currentUserRole={myProfile.role} currentUserId={currentUserId} />}
        </AppLayout >
    );
}
