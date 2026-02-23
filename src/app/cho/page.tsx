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
    pre_validated_by?: string | null;
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
    useRoleRedirect(['cho']);
    const [activeTab, setActiveTab] = useState<'mon_arbre' | 'tasks' | 'confirmed' | 'rejected' | 'ancestor' | 'team'>('tasks');
    const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([]);
    const [confirmedProfiles, setConfirmedProfiles] = useState<PendingProfile[]>([]);
    const [rejectedProfiles, setRejectedProfiles] = useState<PendingProfile[]>([]);
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

            const { data: profile } = await supabase.from('profiles').select('first_name, last_name, role, village_origin').eq('id', user.id).single();
            if (!profile || profile.role !== 'cho') { router.push('/dashboard'); return; }
            setMyProfile(profile);

            // Charger tous les profils utilisateurs
            const { data: allUsers } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, village_origin, quartier_nom, status, created_at')
                .eq('role', 'user')
                .order('created_at', { ascending: false });

            if (allUsers) {
                // Fetch the names of CHOa who 'probable' pre-validated those profiles
                const probableIds = allUsers.filter(u => u.status === 'probable').map(u => u.id);
                const validationsMap: Record<string, string> = {};

                if (probableIds.length > 0) {
                    const { data: vals } = await supabase.from('validations')
                        .select('profile_id, validator:profiles!validations_validator_id_fkey(first_name, last_name)')
                        .in('profile_id', probableIds)
                        .eq('statut', 'probable');

                    if (vals) {
                        vals.forEach(v => {
                            if (v.validator) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const validatorData = Array.isArray(v.validator) ? v.validator[0] : v.validator as Record<string, any>;
                                const fName = validatorData?.first_name || '';
                                const lName = validatorData?.last_name || '';
                                validationsMap[v.profile_id] = `${fName} ${lName}`.trim();
                            }
                        });
                    }
                }

                const enhancedUsers = allUsers.map(u => ({
                    ...u,
                    pre_validated_by: validationsMap[u.id] || null
                }));

                // Le CHO voit les 'pending' (nouveaux) ET les 'probable' (pré-traités par les CHOa)
                setPendingProfiles(enhancedUsers.filter(u => !u.status || u.status === 'pending' || u.status === 'probable'));
                setConfirmedProfiles(enhancedUsers.filter(u => u.status === 'confirmed'));
                setRejectedProfiles(enhancedUsers.filter(u => u.status === 'rejected'));
            }
            setIsLoading(false);
        };
        load();
    }, [supabase, router]);

    const handleStatusChange = async (profileId: string, newStatus: string, isFinal: boolean = false) => {
        if (!motifModal && newStatus === 'rejected') {
            setMotifModal({ id: profileId, action: 'rejected' });
            return;
        }

        const updateData: Record<string, unknown> = { status: newStatus };
        if (newStatus === 'rejected' && motifText) updateData.rejection_motif = motifText;
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
    };

    const tabs = [
        { key: 'mon_arbre', label: 'Mon Arbre', icon: TreePine, count: 0, countColor: '' },
        { key: 'tasks', label: 'À valider', icon: Clock, count: pendingProfiles.length, countColor: 'bg-orange-500' },
        { key: 'confirmed', label: 'Confirmés', icon: CheckCircle, count: confirmedProfiles.length, countColor: 'bg-green-500' },
        { key: 'rejected', label: 'Rejetés', icon: XCircle, count: rejectedProfiles.length, countColor: 'bg-red-500' },
        { key: 'ancestor', label: 'Ancêtre Village', icon: Stamp, count: 0, countColor: 'bg-purple-500' },
        { key: 'team', label: 'Mon Équipe', icon: Users, count: 0, countColor: 'bg-blue-500' },
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
                        {profile.status === 'probable' && profile.pre_validated_by && (
                            <p className="text-[11px] font-semibold text-orange-600 mt-1 flex items-center gap-1 bg-orange-50 inline-flex px-2 py-0.5 rounded">
                                🛡️ Pré-validé par {profile.pre_validated_by} (CHOa)
                            </p>
                        )}
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
                        onClick={() => handleStatusChange(profile.id, 'confirmed', true)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors font-bold"
                    >
                        <Stamp className="w-3.5 h-3.5" /> Bascule Patrimoniale ✅
                    </button>

                    <button
                        onClick={() => setMotifModal({ id: profile.id, action: 'rejected' })}
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
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-purple-50 border-purple-200 text-purple-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        CHO — Directeur du Patrimoine
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

                {/* Ancêtre */}
                {activeTab === 'ancestor' && (
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                                <TreePine className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">Inscrire l&apos;Ancêtre du Village</h2>
                                <p className="text-sm text-gray-500">Action réservée exclusivement au CHO</p>
                            </div>
                        </div>
                        {ancestreSaved ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <h3 className="font-bold text-lg mb-1">Ancêtre certifié !</h3>
                                <p className="text-sm text-gray-500">L&apos;ancêtre <strong>{ancestreNom}</strong> a été inscrit dans le registre patrimonial.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Nom de l&apos;Ancêtre *</label>
                                    <input type="text" value={ancestreNom} onChange={e => setAncetreNom(e.target.value)} placeholder="Ex: Fondateur Koffi" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Siècle / Période approximative</label>
                                    <input type="text" value={ancestrePeriode} onChange={e => setAncretrePeriode(e.target.value)} placeholder="Ex: XIXe siècle, ~1850" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Source historique / Témoignage</label>
                                    <input type="text" value={ancestreSource} onChange={e => setAncetreSource(e.target.value)} placeholder="Nom du témoin ou source orale" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none text-sm" />
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
                                    className="w-full bg-purple-600 disabled:bg-gray-200 disabled:text-gray-400 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors mt-2"
                                >
                                    {isSavingAncetre
                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <><Stamp className="w-5 h-5" /> Certifier l&apos;Ancêtre Fondateur</>
                                    }
                                </button>
                                <p className="text-xs text-gray-400 text-center">Cette action est irréversible et sera enregistrée dans le registre patrimonial.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Équipe — CHO UNIQUEMENT */}
                {/* Équipe */}
                {activeTab === 'team' && (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Mon Équipe CHOa</h2>
                        <p className="text-sm text-gray-500 text-center py-8">Liste des CHOa assignés à ce village. Les comptes CHOa sont créés par l&apos;Admin Principal.<br />Consultez le backoffice Admin pour les créer.</p>
                        <Link href="/admin" className="block text-center text-sm text-[#FF6600] font-bold hover:underline">→ Aller dans l&apos;interface Admin</Link>
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
