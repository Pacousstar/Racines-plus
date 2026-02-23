"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import {
    ShieldCheck, CheckCircle, Clock, XCircle, LogOut,
    Eye, MessageSquare, Users, TreePine, Stamp, Share2
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
    created_at: string;
}

interface MyProfile {
    first_name: string;
    last_name: string;
    role: string;
    village_origin: string;
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
    const [isLoading, setIsLoading] = useState(true);
    const [motifModal, setMotifModal] = useState<{ id: string; action: 'confirme' | 'probable' | 'rejete' } | null>(null);
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

            const { data: profile } = await supabase.from('profiles').select('first_name, last_name, role, village_origin').eq('id', user.id).single();
            if (!profile || profile.role !== 'choa') { router.push('/dashboard'); return; }
            setMyProfile(profile);

            // Charger tous les profils utilisateurs
            const { data: allUsers } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, village_origin, quartier_nom, status, created_at')
                .eq('role', 'user')
                .order('created_at', { ascending: false });

            if (allUsers) {
                setPendingProfiles(allUsers.filter(u => !u.status || u.status === 'pending'));
                setConfirmedProfiles(allUsers.filter(u => u.status === 'confirmed'));
                setRejectedProfiles(allUsers.filter(u => u.status === 'rejected'));
            }
            setIsLoading(false);
        };
        load();
    }, [supabase, router]);

    const handleStatusChange = async (profileId: string, newStatus: string, isFinal: boolean = false) => {
        if (!motifModal && newStatus === 'rejete') {
            setMotifModal({ id: profileId, action: 'rejete' });
            return;
        }

        const updateData: Record<string, unknown> = { status: newStatus };
        if (newStatus === 'rejete' && motifText) updateData.rejection_motif = motifText;
        if (observations) updateData.rejection_observations = observations;

        await supabase.from('profiles').update(updateData).eq('id', profileId);

        if (isFinal && newStatus === 'confirmed') {
            await supabase.from('validations').insert({
                profile_id: profileId,
                validator_id: (await supabase.auth.getUser()).data.user?.id,
                role_validateur: myProfile?.role,
                statut: 'confirme',
                decision_finale: true,
                observations: 'Bascule Patrimoniale déclenchée par le CHO'
            });
        }

        // Rafraîchir
        setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
        if (newStatus === 'confirmed') setConfirmedProfiles(prev => [...prev, { ...pendingProfiles.find(p => p.id === profileId)!, status: 'confirmed' }]);
        if (newStatus === 'rejected') setRejectedProfiles(prev => [...prev, { ...pendingProfiles.find(p => p.id === profileId)!, status: 'rejected' }]);

        setMotifModal(null);
        setMotifText('');
        setObservations('');
    };

    const tabs = [
        { key: 'mon_arbre', label: 'Mon Arbre', icon: TreePine, count: 0, countColor: '' },
        { key: 'tasks', label: 'À valider', icon: Clock, count: pendingProfiles.length, countColor: 'bg-orange-500' },
        { key: 'confirmed', label: 'Confirmés', icon: CheckCircle, count: confirmedProfiles.length, countColor: 'bg-green-500' },
        { key: 'rejected', label: 'Rejetés', icon: XCircle, count: rejectedProfiles.length, countColor: 'bg-red-500' },
    ];

    const StatusBadge = ({ status }: { status: string }) => {
        const map: Record<string, { color: string; label: string }> = {
            confirmed: { color: 'bg-green-100 text-green-700 border border-green-200', label: '🟢 Confirmé' },
            pending: { color: 'bg-gray-100 text-gray-600 border border-gray-200', label: '⚫ En attente' },
            rejected: { color: 'bg-red-100 text-red-600 border border-red-200', label: '🔴 Rejeté' },
            probable: { color: 'bg-orange-100 text-orange-600 border border-orange-200', label: '🟠 Probable' },
        };
        const s = map[status] || map['pending'];
        return <span className={`text-xs px-2 py-1 rounded-full font-bold ${s.color}`}>{s.label}</span>;
    };

    const ProfileCard = ({ profile, showActions = true }: { profile: PendingProfile; showActions?: boolean }) => (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {(profile.first_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{profile.first_name} {profile.last_name}</h3>
                        <p className="text-xs text-gray-500">{profile.village_origin || 'Village ?'} • {profile.quartier_nom || 'Quartier ?'}</p>
                        <p className="text-xs text-gray-400">Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
                <StatusBadge status={profile.status || 'pending'} />
            </div>

            {showActions && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => alert(`Voir le profil de ${profile.first_name} ${profile.last_name} — Détail complet à venir.`)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-600 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Voir
                    </button>
                    <button
                        onClick={() => handleStatusChange(profile.id, 'probable')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 transition-colors font-bold"
                    >
                        🟠 Probable
                    </button>
                    <button
                        onClick={() => handleStatusChange(profile.id, 'confirmed')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors font-bold"
                    >
                        ✅ Approuver
                    </button>

                    <button
                        onClick={() => setMotifModal({ id: profile.id, action: 'rejete' })}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors font-bold"
                    >
                        ❌ Rejeter
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-foreground">
            {/* Header */}
            <header className="fixed top-0 w-full bg-white border-b border-gray-100 px-6 py-3 flex justify-between items-center z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/"><Image src="/LOGO_Racines.png" alt="Racines+" width={90} height={32} className="object-contain" /></Link>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-blue-50 border-blue-200 text-blue-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        CHOa — Adjoint Quartier
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold hidden md:block">{myProfile?.first_name} {myProfile?.last_name}</span>
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-racines-green hover:text-racines-green transition-colors"
                    >
                        <Share2 className="w-3.5 h-3.5" /> Inviter
                    </button>
                    <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="pt-20 px-4 md:px-6 max-w-5xl mx-auto pb-12">
                <div className="mt-6 mb-6">
                    <h1 className="text-xl font-bold">Tableau de Validation</h1>
                    <p className="text-gray-500 text-sm">Village : {myProfile?.village_origin || 'Toa-Zéo'} • Rôle : {myProfile?.role?.toUpperCase()}</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-[#FF6600] text-white shadow-md shadow-[#FF6600]/25' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#FF6600]/30'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && <span className={`${tab.countColor} text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold`}>{tab.count}</span>}
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
                        {isLoading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
                        {!isLoading && pendingProfiles.length === 0 && (
                            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <p className="font-semibold text-gray-700">Aucun profil en attente !</p>
                                <p className="text-sm text-gray-400 mt-1">Tous les profils ont été traités.</p>
                            </div>
                        )}
                        {pendingProfiles.map(p => <ProfileCard key={p.id} profile={p} />)}
                    </div>
                )}

                {/* Confirmés */}
                {activeTab === 'confirmed' && (
                    <div className="space-y-4">
                        {confirmedProfiles.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Aucun profil confirmé pour l&apos;instant.</p>}
                        {confirmedProfiles.map(p => <ProfileCard key={p.id} profile={p} showActions={false} />)}
                    </div>
                )}

                {/* Rejetés */}
                {activeTab === 'rejected' && (
                    <div className="space-y-4">
                        {rejectedProfiles.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Aucun profil rejeté.</p>}
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
                                className="flex-1 py-3 rounded-xl bg-red-500 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold hover:bg-red-600 transition-colors"
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
                    <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} className={`flex flex-col items-center gap-1 ${activeTab === tab.key ? 'text-[#FF6600]' : 'text-gray-400'}`}>
                        <tab.icon className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
                <button onClick={() => setIsInviteOpen(true)} className="flex flex-col items-center gap-1 text-gray-400">
                    <Share2 className="w-5 h-5" />
                    <span className="text-[9px] font-bold uppercase">Inviter</span>
                </button>
            </div>

            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                inviterName={`${myProfile?.first_name || ''} ${myProfile?.last_name || ''}`}
                villageNom={myProfile?.village_origin || 'Toa-Zéo'}
            />
        </div>
    );
}
