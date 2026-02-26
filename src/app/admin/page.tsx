"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import {
    Users, Map, ShieldCheck, Bell, Settings, LogOut, Plus,
    CheckCircle, Clock, XCircle, TrendingUp, Globe, Lock, ChevronRight,
    BarChart3, FileText, Trash2, Edit3, Eye, AlertTriangle, Share2, Star, Search, Filter, Flame
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import InviteModal from '@/components/InviteModal';
import UserDashboardContent from '@/components/UserDashboardContent';
import InvitationsList from '@/components/InvitationsList';
import EditProfileModal, { ExtendedProfileData } from '@/components/EditProfileModal';
import { TreePine } from 'lucide-react';

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
    village_origin: string;
    created_at: string;
    is_ambassadeur?: boolean;
}

interface Victim {
    id: string;
    firstName: string;
    lastName: string;
    birthYear?: string;
    village?: string;
    addedByDetails?: {
        firstName: string;
        lastName: string;
        village: string;
    };
}

interface StatsData {
    totalUsers: number;
    confirmedUsers: number;
    pendingUsers: number;
    rejectedUsers: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const supabase = createClient();
    // Double protection côté client (le middleware gère côté serveur)
    useRoleRedirect(['admin']);
    const [activeTab, setActiveTab] = useState<'overview' | 'mon_arbre' | 'users' | 'villages' | 'validations' | 'memorial' | 'invitations' | 'settings'>('overview');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [victims, setVictims] = useState<Victim[]>([]);
    const [stats, setStats] = useState<StatsData>({ totalUsers: 0, confirmedUsers: 0, pendingUsers: 0, rejectedUsers: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [adminName, setAdminName] = useState('Admin');
    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [newVillageName, setNewVillageName] = useState('');
    const [newVillageRegion, setNewVillageRegion] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [ancestorForm, setAncestorForm] = useState({ nom: '', periode: '', source: '', villageNom: 'Toa-Zéo' });
    const [isSavingAncestor, setIsSavingAncestor] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterVillage, setFilterVillage] = useState('all');

    const [viewingProfile, setViewingProfile] = useState<ExtendedProfileData | null>(null);
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const handleViewProfile = async (id: string) => {
        const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (data) {
            setViewingProfile({
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                gender: data.gender || '',
                birthDate: data.birth_date || '',
                niveauEtudes: data.niveau_etudes || '',
                diplomes: data.diplomes || '',
                emploi: data.emploi || '',
                fonction: data.fonction || '',
                retraite: data.retraite || false,
                nombreEnfants: data.nombre_enfants || 0,
                detailsEnfants: data.details_enfants || [],
                consentementEnfants: data.consentement_enfants || false,
                adresseResidence: data.adresse_residence || ''
            });
            setViewingUserId(id);
            setIsViewModalOpen(true);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            setCurrentUserId(user.id);

            const { data: adminProfile } = await supabase.from('profiles').select('first_name, last_name, role, avatar_url').eq('id', user.id).single();
            if (adminProfile?.role !== 'admin') { router.push('/dashboard'); return; }
            setAdminName(`${adminProfile?.first_name || 'Admin'} ${adminProfile?.last_name || ''}`);
            setAdminAvatar(adminProfile?.avatar_url || null);

            const { data: allProfiles } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, role, status, village_origin, created_at, is_ambassadeur')
                .order('created_at', { ascending: false });

            if (allProfiles) {
                setProfiles(allProfiles);
                setStats({
                    totalUsers: allProfiles.length,
                    confirmedUsers: allProfiles.filter(p => p.status === 'confirmed').length,
                    pendingUsers: allProfiles.filter(p => p.status === 'pending' || !p.status).length,
                    rejectedUsers: allProfiles.filter(p => p.status === 'rejected').length,
                });
            }

            try {
                const victimsRes = await fetch('/api/admin/victims');
                if (victimsRes.ok) {
                    const victimsData = await victimsRes.json();
                    if (victimsData.success) {
                        setVictims(victimsData.victims);
                    }
                }
            } catch (err) {
                console.error("Erreur récupération victimes:", err);
            }

            setIsLoading(false);
        };
        loadData();
    }, [supabase, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleToggleAmbassadeur = async (userId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const { error } = await supabase.from('profiles').update({ is_ambassadeur: newStatus }).eq('id', userId);
        if (error) {
            alert("Erreur lors de la mise à jour du statut ambassadeur.");
            return;
        }
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_ambassadeur: newStatus } : p));
        alert(newStatus ? "Certifié Ambassadeur Racines+ avec succès !" : "Statut d'Ambassadeur retiré.");
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        const updateData: any = { role: newRole };
        if (['cho', 'choa', 'admin'].includes(newRole)) {
            updateData.status = 'confirmed';
        }

        await supabase.from('profiles').update(updateData).eq('id', userId);
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, ...updateData } : p));

        if (updateData.status === 'confirmed') {
            alert(`Le rôle a été changé en ${newRole.toUpperCase()} et le statut a été automatiquement confirmé.`);
        } else {
            alert(`Le rôle a été changé en ${newRole.toUpperCase()}.`);
        }
    };

    const handleAddVillage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVillageName) return;
        await supabase.from('villages').insert({ nom: newVillageName, region: newVillageRegion });
        setNewVillageName('');
        setNewVillageRegion('');
        alert(`Village "${newVillageName}" ajouté avec succès !`);
    };

    const handleCreateAncestor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ancestorForm.nom.trim()) return;
        setIsSavingAncestor(true);
        try {
            const { data: village } = await supabase.from('villages').select('id').eq('nom', ancestorForm.villageNom).single();
            if (!village) throw new Error("Village non trouvé");

            await supabase.from('ancestres').insert({
                village_id: village.id,
                nom_complet: ancestorForm.nom,
                periode: ancestorForm.periode,
                source: ancestorForm.source,
                is_certified: true,
                certified_by: currentUserId,
                certified_at: new Date().toISOString()
            });

            alert(`Ancêtre ${ancestorForm.nom} créé avec succès !`);
            setAncestorForm({ nom: '', periode: '', source: '', villageNom: 'Toa-Zéo' });
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSavingAncestor(false);
        }
    };

    const filteredProfiles = profiles.filter(p => {
        const matchSearch = (p.first_name + ' ' + p.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.village_origin || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = filterRole === 'all' || p.role === filterRole;
        const matchStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchVillage = filterVillage === 'all' || p.village_origin === filterVillage;
        return matchSearch && matchRole && matchStatus && matchVillage;
    });

    const uniqueVillages = Array.from(new Set(profiles.map(p => p.village_origin).filter(Boolean)));

    const kpis = [
        { label: 'Total Inscrits', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Sortie Arbre ✅', value: stats.confirmedUsers, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        { label: 'En attente ⏳', value: stats.pendingUsers, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'Rejetés ❌', value: stats.rejectedUsers, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
    ];

    const tabs = [
        { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
        { key: 'mon_arbre', label: 'Mon Arbre', icon: TreePine },
        { key: 'users', label: 'Comptes & Rôles', icon: Users },
        { key: 'villages', label: 'Villages & Quartiers', icon: Map },
        { key: 'validations', label: 'Validations', icon: ShieldCheck },
        { key: 'memorial', label: 'Crise 2010', icon: Flame },
        { key: 'invitations', label: 'Invitations', icon: Share2 },
        { key: 'settings', label: 'Paramètres', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-foreground">
            {/* Header Admin */}
            <header className="fixed top-0 w-full bg-white border-b border-gray-100 px-6 py-3 flex justify-between items-center z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/"><Image src="/LOGO_Racines.png" alt="Racines+" width={90} height={32} className="object-contain mix-blend-multiply" /></Link>
                    <div className="flex items-center gap-2 bg-[#FF6600]/10 border border-[#FF6600]/20 text-[#FF6600] px-3 py-1 rounded-full text-xs font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        ADMIN PRINCIPAL
                    </div>
                </div>

                <nav className="hidden lg:flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-[#FF6600] text-white shadow-md shadow-[#FF6600]/25' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FF6600] text-white flex items-center justify-center text-xs font-bold overflow-hidden border border-gray-200">
                        {adminAvatar ? (
                            <img src={adminAvatar} alt={adminName} className="w-full h-full object-cover" />
                        ) : (
                            adminName[0]?.toUpperCase()
                        )}
                    </div>
                    <span className="text-sm font-semibold hidden md:block">{adminName}</span>
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-racines-green hover:text-racines-green transition-colors"
                    >
                        <Share2 className="w-3.5 h-3.5" /> Inviter
                    </button>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Contenu principal */}
            <main className="pt-20 px-6 max-w-7xl mx-auto pb-24 md:pb-12">

                {/* Mon Arbre Utilisateur */}
                {activeTab === 'mon_arbre' && currentUserId && (
                    <div className="mt-4">
                        <UserDashboardContent userId={currentUserId} />
                    </div>
                )}

                {/* Vue d'ensemble */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-2xl font-bold mt-4">Tableau de Bord Admin</h1>
                            <p className="text-gray-500 text-sm">Pilote de Toa-Zéo • Données en temps réel</p>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {kpis.map(kpi => (
                                <div key={kpi.label} className={`bg-white rounded-2xl p-5 border ${kpi.border} shadow-sm`}>
                                    <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                                        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                                    </div>
                                    <div className={`text-3xl font-extrabold ${isLoading ? 'animate-pulse bg-gray-200 rounded w-12 h-8' : kpi.color}`}>
                                        {!isLoading && kpi.value}
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium mt-1">{kpi.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Actions rapides */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#FF6600]" /> Actions Rapides</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Associer CHO/CHOa', icon: Plus, onClick: () => setActiveTab('users') },
                                    { label: 'Nouveau village', icon: Globe, onClick: () => setActiveTab('villages') },
                                    { label: 'Voir les validations', icon: ShieldCheck, onClick: () => setActiveTab('validations') },
                                    { label: 'Inviter', icon: Share2, onClick: () => setIsInviteOpen(true) },
                                ].map(action => (
                                    <button key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-[#FF6600]/30 hover:bg-orange-50 transition-all group">
                                        <action.icon className="w-6 h-6 text-[#FF6600] group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-semibold text-center text-gray-700">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Derniers inscrits */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[#FF6600]" /> Derniers Inscrits</h2>
                            <div className="space-y-3">
                                {profiles.slice(0, 5).map(p => (
                                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center text-xs font-bold">
                                                {(p.first_name?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{p.first_name} {p.last_name}</p>
                                                <p className="text-xs text-gray-400">{p.village_origin || 'Village non renseigné'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.role === 'admin' ? 'bg-purple-100 text-purple-600' : p.role === 'cho' ? 'bg-blue-100 text-blue-600' : p.role === 'choa' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {p.role?.toUpperCase()}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </div>
                                    </div>
                                ))}
                                {profiles.length === 0 && !isLoading && <p className="text-sm text-gray-400 text-center py-4">Aucun inscrit pour le moment.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Gestion Comptes */}
                {activeTab === 'users' && (
                    <div className="space-y-6 mt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">Gestion des Comptes</h1>
                                <p className="text-sm text-gray-500">Créez et gérez les accès CHO (Chef) et CHOa (Adjoint)</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Recherche (nom, village)..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full md:w-64 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 outline-none"
                                    />
                                </div>
                                <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#FF6600]">
                                    <option value="all">Tous Rôles</option>
                                    <option value="user">User</option>
                                    <option value="cho">CHO</option>
                                    <option value="choa">CHOa</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#FF6600]">
                                    <option value="all">Tous Statuts</option>
                                    <option value="confirmed">✅ Confirmés</option>
                                    <option value="pending">⏳ En attente</option>
                                    <option value="rejected">❌ Rejetés</option>
                                </select>
                                <select value={filterVillage} onChange={e => setFilterVillage(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#FF6600]">
                                    <option value="all">Tous Villages</option>
                                    {uniqueVillages.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                                <h2 className="font-bold">Résultats ({filteredProfiles.length})</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                                        <tr>
                                            <th className="text-left py-3 px-5">Utilisateur</th>
                                            <th className="text-left py-3 px-4">Village</th>
                                            <th className="text-left py-3 px-4">Rôle</th>
                                            <th className="text-left py-3 px-4">Statut</th>
                                            <th className="text-left py-3 px-4">Date</th>
                                            <th className="text-left py-3 px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredProfiles.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-3 px-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center text-xs font-bold relative">
                                                            {(p.first_name?.[0] || '?').toUpperCase()}
                                                            {p.is_ambassadeur && (
                                                                <div className="absolute -bottom-1 -right-1 bg-amber-100 rounded-full border border-white">
                                                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium">{p.first_name} {p.last_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-500">{p.village_origin || '—'}</td>
                                                <td className="py-3 px-4">
                                                    <select
                                                        value={p.role || 'user'}
                                                        onChange={e => handleRoleChange(p.id, e.target.value)}
                                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#FF6600]"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="choa">CHOa</option>
                                                        <option value="cho">CHO</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.status === 'confirmed' ? 'bg-green-100 text-green-600' : p.status === 'rejected' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                                                        {p.status === 'confirmed' ? '✅ Confirmé' : p.status === 'rejected' ? '❌ Rejeté' : '⏳ En attente'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-xs text-gray-400">
                                                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleToggleAmbassadeur(p.id, p.is_ambassadeur || false)}
                                                            className={`p-1.5 rounded-lg transition-colors ${p.is_ambassadeur ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 hover:text-amber-600' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                                            title={p.is_ambassadeur ? "Retirer la certification Ambassadeur" : "Certifier Ambassadeur Racines+"}
                                                        >
                                                            <Star className={`w-3.5 h-3.5 ${p.is_ambassadeur ? 'fill-amber-500' : ''}`} />
                                                        </button>
                                                        <button onClick={() => handleViewProfile(p.id)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Voir la fiche détaillée"><Eye className="w-3.5 h-3.5" /></button>
                                                        <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer (Bientôt disponible)"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Gestion Villages */}
                {activeTab === 'villages' && (
                    <div className="space-y-6 mt-6">
                        <h1 className="text-2xl font-bold">Villages & Ancêtres</h1>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Ajouter un village */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-[#FF6600]" /> Ajouter un Village</h2>
                                <form onSubmit={handleAddVillage} className="space-y-3">
                                    <input type="text" value={newVillageName} onChange={e => setNewVillageName(e.target.value)} placeholder="Nom du village (ex: Toa-Zéo)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 outline-none text-sm" required />
                                    <input type="text" value={newVillageRegion} onChange={e => setNewVillageRegion(e.target.value)} placeholder="Région (ex: Guémon)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 outline-none text-sm" />
                                    <button type="submit" className="w-full bg-[#FF6600] hover:bg-[#e55c00] text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Ajouter le Village
                                    </button>
                                </form>
                            </div>

                            {/* Inscrire un ancêtre */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="font-bold mb-4 flex items-center gap-2"><TreePine className="w-5 h-5 text-amber-500" /> Inscrire un Ancêtre Fondateur</h2>
                                <form onSubmit={handleCreateAncestor} className="space-y-3">
                                    <input type="text" value={ancestorForm.nom} onChange={e => setAncestorForm({ ...ancestorForm, nom: e.target.value })} placeholder="Nom de l'Ancêtre *" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none text-sm" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" value={ancestorForm.periode} onChange={e => setAncestorForm({ ...ancestorForm, periode: e.target.value })} placeholder="Période (~1850)" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none text-sm" />
                                        <input type="text" value={ancestorForm.source} onChange={e => setAncestorForm({ ...ancestorForm, source: e.target.value })} placeholder="Source historique" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none text-sm" />
                                    </div>
                                    <input type="text" value={ancestorForm.villageNom} disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none text-sm" />
                                    <button disabled={isSavingAncestor} type="submit" className="w-full bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> {isSavingAncestor ? 'Création...' : 'Créer l\'Ancêtre'}
                                    </button>
                                </form>
                            </div>

                            {/* Info */}
                            <div className="bg-[#FF6600]/5 border border-[#FF6600]/20 rounded-3xl p-6 md:col-span-2">
                                <h2 className="font-bold mb-3 text-[#FF6600] flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Important</h2>
                                <ul className="text-sm text-gray-700 space-y-2">
                                    <li>• Les villages et quartiers sont gérés exclusivement par l&apos;Admin Principal (vous).</li>
                                    <li>• Les utilisateurs sélectionnent leur village/quartier lors de l&apos;inscription.</li>
                                    <li>• Le village pilote <strong>Toa-Zéo</strong> est pré-configuré par le SQL initial.</li>
                                    <li>• La liste des Ancêtres Fondateurs alimente la racine des différentes familles du village.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Validations */}
                {activeTab === 'validations' && (
                    <div className="space-y-6 mt-6">
                        <h1 className="text-2xl font-bold">Suivi des Validations</h1>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                                <div className="text-3xl font-extrabold text-green-600">{stats.confirmedUsers}</div>
                                <p className="text-sm text-green-700 font-medium mt-1">🟢 Confirmés</p>
                            </div>
                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                                <div className="text-3xl font-extrabold text-orange-500">{stats.pendingUsers}</div>
                                <p className="text-sm text-orange-600 font-medium mt-1">🟠 En attente</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                                <div className="text-3xl font-extrabold text-red-500">{stats.rejectedUsers}</div>
                                <p className="text-sm text-red-600 font-medium mt-1">🔴 Rejetés</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-gray-500 text-sm text-center py-8">Le tableau détaillé des validations CHO sera affiché ici une fois les données disponibles.</p>
                        </div>
                    </div>
                )}

                {/* Mémorial 2010 */}
                {activeTab === 'memorial' && (
                    <div className="space-y-6 mt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                                <Flame className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Mémorial 2010 - 2011</h1>
                                <p className="text-gray-500 text-sm">Recensement des victimes de la crise post-électorale</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h2 className="font-bold flex items-center gap-2">
                                    Total recensé : <span className="text-red-600 font-extrabold text-lg">{victims.length} victime(s)</span>
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                                        <tr>
                                            <th className="text-left py-3 px-5">Victime</th>
                                            <th className="text-left py-3 px-4">Année d. nais.</th>
                                            <th className="text-left py-3 px-4">Village</th>
                                            <th className="text-left py-3 px-4">Recensé par</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {victims.map(v => (
                                            <tr key={v.id} className="hover:bg-red-50/30 transition-colors">
                                                <td className="py-3 px-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                                                            {(v.firstName?.[0] || '?').toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-semibold">{v.firstName} {v.lastName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-500">{v.birthYear || '—'}</td>
                                                <td className="py-3 px-4 text-sm text-gray-500">{v.village || '—'}</td>
                                                <td className="py-3 px-4">
                                                    {v.addedByDetails ? (
                                                        <div>
                                                            <p className="text-sm font-medium">{v.addedByDetails.firstName} {v.addedByDetails.lastName}</p>
                                                            <p className="text-xs text-gray-400">{v.addedByDetails.village || '—'}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {victims.length === 0 && !isLoading && (
                                    <div className="p-10 text-center">
                                        <Flame className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">Aucune victime recensée pour le moment dans l'arbre généalogique.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Invitations */}
                {activeTab === 'invitations' && currentUserId && (
                    <div className="animate-in fade-in duration-300 max-w-3xl mt-6">
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-4">
                            <h3 className="font-bold text-orange-800 text-lg flex items-center gap-2"><Share2 className="w-5 h-5" /> Indicateurs de Viralité</h3>
                            <p className="text-orange-700/80 text-sm mt-1">
                                Suivez vos invitations personnelles. À terme, cette section inclura les statistiques globales de viralité de la plateforme.
                            </p>
                            <button onClick={() => setIsInviteOpen(true)} className="mt-4 bg-[#FF6600] hover:bg-[#e55c00] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md transition-transform active:scale-95">
                                + Envoyer une nouvelle invitation
                            </button>
                        </div>
                        <InvitationsList userId={currentUserId} />
                    </div>
                )}

                {/* Paramètres */}
                {activeTab === 'settings' && (
                    <div className="space-y-6 mt-6">
                        <h1 className="text-2xl font-bold">Paramètres Plateforme</h1>
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                            {[
                                { label: 'Nom de la plateforme', value: 'Racines+ MVP' },
                                { label: 'Village pilote actif', value: 'Toa-Zéo, Guémon, CI' },
                                { label: 'Version', value: '0.1.0-MVP BETA' },
                            ].map(s => (
                                <div key={s.label} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                                    <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">{s.value}</span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between py-3">
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Lock className="w-4 h-4 text-green-500" /> Supabase RLS</span>
                                <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold">ACTIF</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                inviterName={adminName}
                villageNom="Toa-Zéo"
            />

            {isViewModalOpen && viewingUserId && viewingProfile && (
                <EditProfileModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    initialData={viewingProfile}
                    userId={viewingUserId}
                    onSuccess={() => setIsViewModalOpen(false)}
                />
            )}

            {/* Bottom Nav Mobile pour les administrateurs */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex overflow-x-auto hide-scrollbar lg:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-50">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`flex flex-col flex-1 min-w-[72px] items-center justify-center gap-1 py-3 px-1 transition-colors ${activeTab === tab.key ? 'text-[#FF6600] border-t-2 border-[#FF6600] bg-orange-50/50' : 'text-gray-400 border-t-2 border-transparent hover:text-gray-800 hover:bg-gray-50'}`}
                    >
                        <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? 'scale-110 transition-transform' : ''}`} />
                        <span className="text-[9px] font-bold text-center leading-tight">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
