"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import {
    Users, Map, ShieldCheck, Bell, Settings, LogOut, Plus,
    CheckCircle, Clock, XCircle, TrendingUp, Globe, Lock, ChevronRight,
    BarChart3, FileText, Trash2, Edit3, Eye, AlertTriangle, Share2, Star, Search, Filter, Flame, Download,
    Shield, Activity, Key, Stamp
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import InviteModal from '@/components/InviteModal';
import UserDashboardContent from '@/components/UserDashboardContent';
import InvitationsList from '@/components/InvitationsList';
import EditProfileModal, { ExtendedProfileData } from '@/components/EditProfileModal';
import { TreePine } from 'lucide-react';
import MigrationMap from '@/components/MigrationMap';
import InternalMessaging from '@/components/InternalMessaging';

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
    village_origin: string;
    avatar_url?: string | null;
    created_at: string;
    is_ambassadeur?: boolean;
    gender?: string;
    niveau_etudes?: string;
    birth_date?: string;
    export_authorized?: boolean;
    export_requested?: boolean;
    certificate_requested?: boolean;
    certificate_issued?: boolean;
    certificate_issued_at?: string;
    email?: string;
    phone_1?: string;
    whatsapp_1?: string;
    quartier_nom?: string;
}

interface Village {
    id: string;
    nom: string;
    region: string;
    created_at: string;
}

interface Quartier {
    id: string;
    village_id: string;
    nom: string;
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

interface MemorialVictim {
    id: string;
    nom: string;
    prenoms: string;
    genre: string;
    age_approximatif?: number;
    village_id?: string;
    quartier_nom?: string;
    annee_evenement: number;
    description_circonstances?: string;
    is_verified: boolean;
    created_at: string;
}

interface StatsData {
    totalUsers: number;           // Uniquement role='user'
    totalCollaborateurs: number;  // cho + choa + admin + ambassadeurs
    confirmedUsers: number;       // role='user' AND status='confirmed' (via workflow CHOa)
    confirmedPrelim: number;      // cho/choa/admin confirmés d'office par l'admin
    pendingUsers: number;         // role='user' en attente de validation
    rejectedUsers: number;
    genderStats: { male: number; female: number; unknown: number };
    educationStats: Record<string, number>;
    pendingCertificates: number;
    pendingExports: number;
    contactStats: { hasPhone: number; hasWhatsapp: number };
}

interface AdminPermission {
    user_id: string;
    can_validate_users: boolean;
    can_manage_villages: boolean;
    can_manage_ancestors: boolean;
    can_manage_memorial: boolean;
    can_issue_certificates: boolean;
    can_manage_invitations: boolean;
    can_export_data: boolean;
}

interface ActivityLog {
    id: string;
    user_id: string;
    action_type: string;
    table_name: string;
    record_id: string;
    old_data: any;
    new_data: any;
    timestamp: string;
    user_details?: { first_name: string; last_name: string };
}

export default function AdminDashboard() {
    const router = useRouter();
    const supabase = createClient();
    // Double protection côté client (le middleware gère côté serveur)
    useRoleRedirect(['admin']);
    const [activeTab, setActiveTab] = useState<'overview' | 'mon_arbre' | 'users' | 'assistants' | 'villages' | 'validations' | 'memorial' | 'audit' | 'invitations' | 'settings'>('overview');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [assistantPermissions, setAssistantPermissions] = useState<Record<string, AdminPermission>>({});
    const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    const [quartiers, setQuartiers] = useState<Quartier[]>([]);
    const [victims, setVictims] = useState<Victim[]>([]);
    const [memorialVictims, setMemorialVictims] = useState<MemorialVictim[]>([]);
    const [stats, setStats] = useState<StatsData>({
        totalUsers: 0,
        totalCollaborateurs: 0,
        confirmedUsers: 0,
        confirmedPrelim: 0,
        pendingUsers: 0,
        rejectedUsers: 0,
        genderStats: { male: 0, female: 0, unknown: 0 },
        educationStats: {},
        pendingCertificates: 0,
        pendingExports: 0,
        contactStats: { hasPhone: 0, hasWhatsapp: 0 }
    });
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

    const [valSearchTerm, setValSearchTerm] = useState('');
    const [valFilterStatus, setValFilterStatus] = useState('all');
    const [valFilterVillage, setValFilterVillage] = useState('all');

    const [memorialForm, setMemorialForm] = useState({ nom: '', prenoms: '', genre: 'M', age: '', village_id: '', quartier: '', description: '' });
    const [isSavingMemorial, setIsSavingMemorial] = useState(false);

    const [viewingProfile, setViewingProfile] = useState<ExtendedProfileData | null>(null);
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Pagination States
    const [usersPage, setUsersPage] = useState(1);
    const [valPage, setValPage] = useState(1);
    const [villagesPage, setVillagesPage] = useState(1);
    const [memorialPage, setMemorialPage] = useState(1);
    const [logsPage, setLogsPage] = useState(1);
    const itemsPerPage = 20;

    // États modale création assistant admin
    const [showCreateAssistant, setShowCreateAssistant] = useState(false);
    const [assistantForm, setAssistantForm] = useState({
        first_name: '', last_name: '', email: '', password: '', phone: '', poste: '', village_origin: ''
    });
    const [assistantPerms, setAssistantPerms] = useState({
        can_validate_users: false,
        can_manage_villages: false,
        can_manage_ancestors: false,
        can_manage_memorial: false,
        can_issue_certificates: false,
        can_manage_invitations: false,
        can_export_data: false
    });
    const [isCreatingAssistant, setIsCreatingAssistant] = useState(false);

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
                adresseResidence: data.adresse_residence || '',
                residenceCity: data.residence_city || '',
                residenceCountry: data.residence_country || 'CI',
                phone1: data.phone_1 || '',
                phone2: data.phone_2 || '',
                whatsapp1: data.whatsapp_1 || '',
                whatsapp2: data.whatsapp_2 || ''
            });
            setViewingUserId(id);
            setIsViewModalOpen(true);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            // Ne pas mettre isLoading à true si on a déjà des données pour éviter le clignotement
            if (profiles.length === 0) setIsLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            setCurrentUserId(user.id);

            // Charger le profil admin séparément et rapidement
            supabase.from('profiles').select('first_name, last_name, role, avatar_url').eq('id', user.id).single()
                .then(({ data: adminProfile, error: profileErr }) => {
                    if (profileErr) console.error('[admin] Error fetching admin profile:', profileErr);
                    if (adminProfile) {
                        console.log('[admin] Admin profile found:', adminProfile);
                        if (adminProfile.role !== 'admin') { router.push('/dashboard'); return; }
                        const fullName = `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim();
                        // Fallback sur metadata
                        const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
                        setAdminName(fullName || fallbackName);
                        setAdminAvatar(adminProfile.avatar_url || user.user_metadata?.avatar_url || null);
                    } else {
                        console.warn('[admin] No admin profile found for id:', user.id);
                        setAdminName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin');
                        setAdminAvatar(user.user_metadata?.avatar_url || null);
                    }
                });

            // Charger le reste des données en parallèle
            const [profilesRes, villagesRes, quartiersRes, victimsRes, memorialRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, first_name, last_name, role, status, village_origin, quartier_nom, quartiers_assignes, avatar_url, created_at, is_ambassadeur, gender, niveau_etudes, birth_date, export_authorized, export_requested, certificate_requested, certificate_issued, certificate_issued_at, email')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('villages')
                    .select('*')
                    .order('nom', { ascending: true }),
                supabase
                    .from('quartiers')
                    .select('*')
                    .order('nom', { ascending: true }),
                fetch('/api/admin/victims'),
                supabase.from('memorial_victims').select('*').order('created_at', { ascending: false })
            ]);

            if (profilesRes.data) {
                setProfiles(profilesRes.data);
                // Séparer les simples membres (role='user') des collaborateurs
                const usersOnly = profilesRes.data.filter(p => p.role === 'user');
                const collaborateurs = profilesRes.data.filter(p => ['cho', 'choa', 'admin'].includes(p.role) || p.is_ambassadeur);

                setStats({
                    // Membres (users uniquement)
                    totalUsers: usersOnly.length,
                    totalCollaborateurs: collaborateurs.length,

                    // Certifiés via workflow CHOa (users confirmés + on distingue des préalables)
                    confirmedUsers: usersOnly.filter(p => p.status === 'confirmed').length,

                    // CHO/CHOa/admin confirmés d'office
                    confirmedPrelim: profilesRes.data.filter(p =>
                        ['cho', 'choa', 'admin'].includes(p.role) && p.status === 'confirmed'
                    ).length,

                    pendingUsers: usersOnly.filter(p =>
                        !p.status ||
                        p.status === 'pending' ||
                        p.status === 'pending_choa' ||
                        p.status === 'pre_approved' ||
                        p.status === 'probable'
                    ).length,
                    rejectedUsers: usersOnly.filter(p => p.status === 'rejected').length,

                    genderStats: {
                        male: usersOnly.filter(p => p.gender === 'Homme').length,
                        female: usersOnly.filter(p => p.gender === 'Femme').length,
                        unknown: usersOnly.filter(p => !p.gender).length
                    },
                    educationStats: usersOnly.reduce((acc: Record<string, number>, p) => {
                        const level = p.niveau_etudes || 'Non renseigné';
                        acc[level] = (acc[level] || 0) + 1;
                        return acc;
                    }, {}),
                    pendingCertificates: usersOnly.filter(p => p.certificate_requested && !p.certificate_issued).length,
                    pendingExports: usersOnly.filter(p => p.export_requested && !p.export_authorized).length,
                    contactStats: {
                        hasPhone: usersOnly.filter((p: any) => p.phone_1).length,
                        hasWhatsapp: usersOnly.filter((p: any) => p.whatsapp_1).length
                    }
                });
            }

            if (villagesRes.data) {
                setVillages(villagesRes.data);
            }

            if (quartiersRes.data) {
                setQuartiers(quartiersRes.data);
            }

            if (victimsRes.ok) {
                const victimsData = await victimsRes.json();
                if (victimsData.success) {
                    setVictims(victimsData.victims);
                }
            }

            if (memorialRes.data) {
                setMemorialVictims(memorialRes.data);
            }

            // Charger les permissions et logs pour TOUS les admins (pas uniquement un email hardcodé)
            const [permsRes, logsRes] = await Promise.all([
                supabase.from('admin_permissions').select('*'),
                supabase.from('activity_logs')
                    .select('*, user_details:profiles(first_name, last_name)')
                    .order('timestamp', { ascending: false })
                    .limit(50)
            ]);
            if (permsRes.error) {
                console.error('[admin] ERREUR RLS admin_permissions:', permsRes.error);
                alert("Impossible de charger les permissions admin. RLS bloque sûrement l'accès : " + permsRes.error.message);
            }
            if (permsRes.data) {
                console.log("[admin] admin_permissions chargés :", permsRes.data.length);
                const permsMap = permsRes.data.reduce((acc, p) => ({ ...acc, [p.user_id]: p }), {});
                setAssistantPermissions(permsMap);
            }
            if (logsRes.error) {
                console.error('[admin] ERREUR RLS activity_logs:', logsRes.error);
            }
            if (logsRes.data) setAuditLogs(logsRes.data as any);

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

    const handleIssueCertificate = async (userId: string) => {
        const { error } = await supabase.from('profiles').update({
            certificate_issued: true,
            certificate_issued_at: new Date().toISOString()
        }).eq('id', userId);
        if (error) {
            alert("Erreur lors de la délivrance du certificat.");
            return;
        }
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, certificate_issued: true, certificate_issued_at: new Date().toISOString() } : p));
        alert("📜 Certificat d'appartenance délivré avec succès !");
    };

    const handleToggleExportAuth = async (userId: string, currentStatus: boolean | undefined) => {
        const newStatus = !currentStatus;
        const { error } = await supabase.from('profiles').update({ export_authorized: newStatus, export_requested: false }).eq('id', userId);
        if (error) {
            alert("Erreur lors de la mise à jour de l'autorisation d'export.");
            return;
        }
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, export_authorized: newStatus, export_requested: false } : p));
        alert(newStatus ? "🔑 Accès à l'exportation accordé." : "🔒 Accès à l'exportation retiré.");
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setIsLoading(true);
        const updateData: any = { role: newRole };

        // CHO, CHOa et admin sont validés d'office par l'admin sur proposition du conseil
        // Ils reçoivent status='confirmed' immédiatement + confirmed_source='admin_prelim'
        if (['cho', 'choa', 'admin'].includes(newRole)) {
            updateData.status = 'confirmed';
        } else if (newRole === 'user') {
            // Rétrograder un collaborateur vers user le replace dans le pipeline CHOa
            updateData.status = 'pending_choa';
        }

        const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);

        if (error) {
            alert(`Erreur lors du changement de rôle : ${error.message}. Il se peut que les politiques RLS bloquent cette action.`);
            setIsLoading(false);
            return;
        }

        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, ...updateData } : p));

        if (['cho', 'choa'].includes(newRole)) {
            alert(`Rôle ${newRole.toUpperCase()} assigné et confirmé préalablement par l'Admin ✔️`);
        } else if (newRole === 'admin') {
            alert(`Promu Administrateur (Assistant) ✔️`);
        } else {
            alert(`Rôle changé en ${newRole.toUpperCase()}.`);
        }

        if (newRole === 'admin') {
            await supabase.from('admin_permissions').upsert({ user_id: userId }, { onConflict: 'user_id' });
            // Recharger les permissions
            const { data } = await supabase.from('admin_permissions').select('*').eq('user_id', userId).single();
            if (data) setAssistantPermissions(prev => ({ ...prev, [userId]: data }));
        }
        setIsLoading(false);
    };

    const handleAssignQuartier = async (userId: string, quartierNom: string) => {
        setIsLoading(true);
        const { error } = await supabase.from('profiles').update({ quartier_nom: quartierNom }).eq('id', userId);
        if (error) {
            alert("Erreur lors de l'assignation du quartier.");
            return;
        }
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, quartier_nom: quartierNom } : p));
        alert(`Quartier ${quartierNom} assigné avec succès.`);
        setIsLoading(false);
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`ATTENTION ⚠️\nVoulez-vous vraiment supprimer définitivement "${userName}" ?\nCette action est irréversible et supprimera son profil et son accès.`)) return;

        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Erreur d'authentification.");
                setIsLoading(false);
                return;
            }

            const res = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ user_id: userId })
            });

            const result = await res.json();
            if (result.success) {
                setProfiles(prev => prev.filter(p => p.id !== userId));
                alert(`Utilisateur "${userName}" supprimé définitivement.`);
            } else {
                alert(`Erreur de suppression : ${result.error}`);
            }
        } catch (err: any) {
            alert(`Erreur: ${err.message}`);
        }
        setIsLoading(false);
    };

    const handleUpdatePermission = async (userId: string, key: keyof AdminPermission, value: boolean) => {
        const { error } = await supabase.from('admin_permissions').update({ [key]: value }).eq('user_id', userId);
        if (error) {
            alert("Erreur lors de la mise à jour de la permission : " + error.message);
            return;
        }
        setAssistantPermissions(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [key]: value }
        }));
    };

    const handleAddVillage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVillageName) return;
        const { data, error } = await supabase.from('villages').insert({ nom: newVillageName, region: newVillageRegion }).select().single();
        if (error) {
            alert("Erreur lors de l'ajout du village : " + error.message);
            return;
        }
        if (data) setVillages(prev => [...prev, data]);
        setNewVillageName('');
        setNewVillageRegion('');
        alert(`Village "${newVillageName}" ajouté avec succès !`);
    };

    const handleDeleteVillage = async (id: string, name: string) => {
        if (!confirm(`Voulez-vous vraiment supprimer le village "${name}" ? Cela ne supprimera pas les profils associés mais brisera les liens.`)) return;
        const { error } = await supabase.from('villages').delete().eq('id', id);
        if (error) {
            alert("Erreur lors de la suppression : " + error.message);
            return;
        }
        setVillages(prev => prev.filter(v => v.id !== id));
        setQuartiers(prev => prev.filter(q => q.village_id !== id));
    };

    const handleAddQuartier = async (villageId: string) => {
        const nom = prompt("Nom du nouveau quartier :");
        if (!nom) return;
        const { data, error } = await supabase.from('quartiers').insert({ village_id: villageId, nom }).select().single();
        if (error) {
            alert(error.message);
            return;
        }
        if (data) setQuartiers(prev => [...prev, data]);
    };

    const handleDeleteQuartier = async (id: string) => {
        if (!confirm("Supprimer ce quartier ?")) return;
        const { error } = await supabase.from('quartiers').delete().eq('id', id);
        if (error) {
            alert(error.message);
            return;
        }
        setQuartiers(prev => prev.filter(q => q.id !== id));
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

    const handleAddMemorialVictim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memorialForm.nom || !memorialForm.prenoms) return;
        setIsSavingMemorial(true);

        const { data, error } = await supabase.from('memorial_victims').insert({
            nom: memorialForm.nom,
            prenoms: memorialForm.prenoms,
            genre: memorialForm.genre,
            age_approximatif: memorialForm.age ? parseInt(memorialForm.age) : null,
            village_id: memorialForm.village_id || null,
            quartier_nom: memorialForm.quartier,
            description_circonstances: memorialForm.description,
            added_by: currentUserId,
            is_verified: true,
            verified_by: currentUserId
        }).select().single();

        if (error) {
            alert("Erreur lors de l'ajout au mémorial : " + error.message);
        } else {
            if (data) setMemorialVictims(prev => [data, ...prev]);
            setMemorialForm({ nom: '', prenoms: '', genre: 'M', age: '', village_id: '', quartier: '', description: '' });
            alert("Victime inscrite au mémorial avec succès.");
        }
        setIsSavingMemorial(false);
    };

    const handleDeleteMemorialVictim = async (id: string) => {
        if (!confirm("Supprimer cette entrée du mémorial ?")) return;
        const { error } = await supabase.from('memorial_victims').delete().eq('id', id);
        if (error) alert(error.message);
        else setMemorialVictims(prev => prev.filter(v => v.id !== id));
    };

    const handleExportUsers = () => {
        if (filteredProfiles.length === 0) {
            alert("Aucun profil à exporter.");
            return;
        }

        const headers = ["Nom", "Prénoms", "Rôle", "Village", "Statut", "Ambassadeur", "Date d'inscription"];
        const rows = filteredProfiles.map(p => [
            p.last_name || '—',
            p.first_name || '—',
            p.role || 'user',
            p.village_origin || '—',
            p.status || 'pending',
            p.is_ambassadeur ? 'Oui' : 'Non',
            new Date(p.created_at).toLocaleDateString('fr-FR')
        ]);

        const csvContent = [
            headers.join(";"), // Utilisation de point-virgule pour Excel FR
            ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(";"))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `export_utilisateurs_racines_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredProfiles = profiles.filter(p => {
        const matchSearch = (p.first_name + ' ' + p.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.village_origin || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = filterRole === 'all' || p.role === filterRole;
        const matchStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchVillage = filterVillage === 'all' || p.village_origin === filterVillage;
        return matchSearch && matchRole && matchStatus && matchVillage;
    });

    const paginatedProfiles = filteredProfiles.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);
    const totalUserPages = Math.ceil(filteredProfiles.length / itemsPerPage);

    const uniqueVillages = Array.from(new Set(profiles.map(p => p.village_origin).filter(Boolean)));

    const validationsProfiles = profiles.filter(p => {
        const matchSearch = (p.first_name + ' ' + p.last_name + ' ' + (p.phone_1 || '')).toLowerCase().includes(valSearchTerm.toLowerCase());
        const matchStatus = valFilterStatus === 'all' || p.status === valFilterStatus;
        const matchVillage = valFilterVillage === 'all' || p.village_origin === valFilterVillage;
        return matchSearch && matchStatus && matchVillage;
    });

    const paginatedValidations = validationsProfiles.slice((valPage - 1) * itemsPerPage, valPage * itemsPerPage);
    const totalValPages = Math.ceil(validationsProfiles.length / itemsPerPage);

    const kpis = [
        {
            label: 'Membres Inscrits',
            sublabel: 'Simples utilisateurs (hors collaborateurs)',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100'
        },
        {
            label: 'Certifiés ✅',
            sublabel: 'Validés via le workflow CHOa → CHO',
            value: stats.confirmedUsers,
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100'
        },
        {
            label: 'Certificats 📜',
            sublabel: 'En attente de délivrance',
            value: stats.pendingCertificates,
            icon: Stamp,
            color: 'text-[#FF6600]',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            highlight: stats.pendingCertificates > 0
        },
        {
            label: 'Demandes Export 📥',
            sublabel: 'En attente d’autorisation',
            value: stats.pendingExports,
            icon: Download,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-100',
            highlight: stats.pendingExports > 0
        },
    ];

    const tabs = [
        { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
        { key: 'mon_arbre', label: 'Mon Arbre', icon: TreePine },
        { key: 'users', label: 'Comptes & Rôles', icon: Users },
        { key: 'assistants', label: 'Assistants Admin', icon: Shield, hidden: adminName !== 'Pacous2000@gmail.com' && !profiles.find(p => p.id === currentUserId)?.role?.includes('admin') },
        { key: 'villages', label: 'Villages & Quartiers', icon: Map },
        { key: 'validations', label: 'Validations', icon: ShieldCheck },
        { key: 'memorial', label: 'Crise 2010', icon: Flame },
        { key: 'audit', label: 'Journal (Audit)', icon: Activity, hidden: adminName !== 'Pacous2000@gmail.com' },
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
                    {tabs.filter(t => !t.hidden).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-[#FF6600] text-white shadow-md shadow-[#FF6600]/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}
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
                    <button onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
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
                            <p className="text-gray-600 text-sm">Pilote de Toa-Zéo • Données en temps réel</p>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {kpis.map(kpi => (
                                <div key={kpi.label} className={`bg-white rounded-2xl p-5 border ${kpi.border} shadow-sm transition-all ${kpi.highlight ? 'ring-2 ring-[#FF6600]/20' : ''}`}>
                                    <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                                        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                                    </div>
                                    <div className={`text-3xl font-extrabold flex items-center gap-2 ${isLoading ? 'animate-pulse bg-gray-200 rounded w-12 h-8' : kpi.color}`}>
                                        {!isLoading && kpi.value}
                                        {!isLoading && kpi.highlight && <span className="flex h-2 w-2 rounded-full bg-[#FF6600] animate-ping" />}
                                    </div>
                                    <p className="text-[10px] text-gray-800 font-black uppercase tracking-wider mt-1">{kpi.label}</p>
                                    {'sublabel' in kpi && kpi.sublabel && (
                                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{kpi.sublabel}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Stats collaborateurs */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-purple-900">{stats.totalCollaborateurs}</p>
                                    <p className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Collaborateurs</p>
                                    <p className="text-[9px] text-purple-400">CHO, CHOa, Admin, Ambassadeurs</p>
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Star className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-amber-900">{stats.confirmedPrelim}</p>
                                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Confirmés préalables</p>
                                    <p className="text-[9px] text-amber-400">CHO/CHOa désignés par l&apos;admin</p>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-red-900">{stats.rejectedUsers}</p>
                                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Dossiers Rejetés</p>
                                    <p className="text-[9px] text-red-300">Membres — workflow complet</p>
                                </div>
                            </div>
                        </div>

                        {/* Statistiques Démographiques */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Répartition par Sexe */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#FF6600]" /> Répartition par Sexe
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Hommes', value: stats.genderStats.male, color: 'bg-blue-500', icon: '♂️' },
                                        { label: 'Femmes', value: stats.genderStats.female, color: 'bg-pink-500', icon: '♀️' }
                                    ].map(item => {
                                        const percentage = stats.totalUsers > 0 ? (item.value / stats.totalUsers) * 100 : 0;
                                        return (
                                            <div key={item.label} className="space-y-1">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-600">
                                                    <span>{item.icon} {item.label}</span>
                                                    <span>{item.value} ({percentage.toFixed(1)}%)</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                                    <div
                                                        className={`h-full ${item.color} transition-all duration-1000 ease-out`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Niveau d'études */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-racines-green" /> Éducation & Profil
                                </h2>
                                <div className="space-y-3">
                                    {Object.entries(stats.educationStats)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 6)
                                        .map(([level, count]) => {
                                            const percentage = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                                            return (
                                                <div key={level} className="flex items-center gap-3">
                                                    <div className="text-[10px] font-bold text-gray-600 w-32 truncate">{level}</div>
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-racines-green/70 transition-all duration-1000 ease-out"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-[10px] font-bold text-gray-900 w-8 text-right">{count}</div>
                                                </div>
                                            );
                                        })}
                                    {Object.keys(stats.educationStats).length === 0 && <p className="text-center py-4 text-xs text-gray-600">Aucune donnée disponible</p>}
                                </div>
                            </div>

                            {/* Taux de Contactabilité */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-purple-600" /> Taux de Contactabilité
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                                        <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Téléphone</p>
                                        <p className="text-2xl font-black text-purple-900">{stats.totalUsers > 0 ? ((stats.contactStats.hasPhone / stats.totalUsers) * 100).toFixed(0) : 0}%</p>
                                        <p className="text-[9px] text-purple-500 mt-1">{stats.contactStats.hasPhone} membres joignables</p>
                                    </div>
                                    <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                                        <p className="text-[10px] font-bold text-green-600 uppercase mb-1">WhatsApp</p>
                                        <p className="text-2xl font-black text-green-900">{stats.totalUsers > 0 ? ((stats.contactStats.hasWhatsapp / stats.totalUsers) * 100).toFixed(0) : 0}%</p>
                                        <p className="text-[9px] text-green-500 mt-1">{stats.contactStats.hasWhatsapp} membres WhatsApp</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Carte des Migrations (Global) */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-[#C05C3C]" /> Rayonnement Mondial (Diaspora)
                            </h2>
                            <MigrationMap />
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
                                            <div className="w-9 h-9 rounded-full bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center text-xs font-bold overflow-hidden border border-gray-100">
                                                {p.avatar_url ? (
                                                    <img src={p.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    (p.first_name?.[0] || '?').toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{p.first_name} {p.last_name}</p>
                                                <p className="text-xs text-gray-600">{p.village_origin || 'Village non renseigné'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.role === 'admin' ? (p.email?.toLowerCase() === 'pacous2000@gmail.com' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600') : p.role === 'cho' ? 'bg-blue-100 text-blue-600' : p.role === 'choa' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {p.email?.toLowerCase() === 'pacous2000@gmail.com' ? 'ADMIN PRINCIPAL' : p.role?.toUpperCase()}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                                {profiles.length === 0 && !isLoading && <p className="text-sm text-gray-600 text-center py-4">Aucun inscrit pour le moment.</p>}
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
                                <p className="text-sm text-gray-600">Créez et gérez les accès CHO (Chef) et CHOa (Adjoint)</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
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
                                <button
                                    onClick={handleExportUsers}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md active:scale-95"
                                >
                                    <Download className="w-3.5 h-3.5" /> Exporter CSV
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
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
                                        {paginatedProfiles.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-3 px-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center text-xs font-bold relative overflow-hidden border border-gray-100">
                                                            {p.avatar_url ? (
                                                                <img src={p.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                (p.first_name?.[0] || '?').toUpperCase()
                                                            )}
                                                            {p.is_ambassadeur && (
                                                                <div className="absolute -bottom-1 -right-1 bg-amber-100 rounded-full border border-white">
                                                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium">{p.first_name} {p.last_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">{p.village_origin || '—'}</td>
                                                <td className="py-3 px-4">
                                                    {p.email?.toLowerCase() === 'pacous2000@gmail.com' ? (
                                                        <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 uppercase tracking-tighter">
                                                            👑 Admin Principal
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <select
                                                                value={p.role || 'user'}
                                                                onChange={e => handleRoleChange(p.id, e.target.value)}
                                                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#FF6600]"
                                                            >
                                                                <option value="user">User</option>
                                                                <option value="ambassadeur">Ambassadeur</option>
                                                                <option value="choa">CHOa</option>
                                                                <option value="cho">CHO</option>
                                                                <option value="admin">Admin / Assistant</option>
                                                            </select>
                                                            {(p.role === 'cho' || p.role === 'choa') && (
                                                                <select
                                                                    value={p.quartier_nom || ''}
                                                                    onChange={e => handleAssignQuartier(p.id, e.target.value)}
                                                                    className="text-[10px] border border-amber-200 rounded-lg px-2 py-1 bg-amber-50 text-amber-900 font-semibold focus:outline-none focus:border-amber-500"
                                                                >
                                                                    <option value="">-- Assigner quartier --</option>
                                                                    {quartiers
                                                                        .filter(q => {
                                                                            const v = villages.find(v => v.nom === p.village_origin);
                                                                            return v && q.village_id === v.id;
                                                                        })
                                                                        .map(q => (
                                                                            <option key={q.id} value={q.nom}>{q.nom}</option>
                                                                        ))}
                                                                </select>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.status === 'confirmed' ? 'bg-green-100 text-green-600' : p.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {p.status === 'confirmed' ? '✅ Confirmé' : p.status === 'rejected' ? '❌ Rejeté' : '⏳ En attente'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-xs text-gray-600">
                                                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleToggleAmbassadeur(p.id, p.is_ambassadeur || false)}
                                                            className={`p-1.5 rounded-lg transition-colors ${p.is_ambassadeur ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 hover:text-amber-600' : 'text-gray-600 hover:text-amber-500 hover:bg-amber-50'}`}
                                                            title={p.is_ambassadeur ? "Retirer la certification Ambassadeur" : "Certifier Ambassadeur Racines+"}
                                                        >
                                                            <Star className={`w-3.5 h-3.5 ${p.is_ambassadeur ? 'fill-amber-500' : ''}`} />
                                                        </button>

                                                        {p.certificate_requested && !p.certificate_issued && (
                                                            <button
                                                                onClick={() => handleIssueCertificate(p.id)}
                                                                className="p-1.5 text-[#FF6600] bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors animate-pulse"
                                                                title="Délivrer le Certificat"
                                                            >
                                                                <Stamp className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        {(p.role === 'cho' || p.role === 'choa') && (
                                                            <button
                                                                onClick={() => handleToggleExportAuth(p.id, p.export_authorized)}
                                                                className={`p-1.5 rounded-lg transition-colors ${p.export_authorized ? 'text-green-600 bg-green-50 hover:bg-green-100' : p.export_requested ? 'text-[#FF6600] bg-orange-50 hover:bg-orange-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                                title={p.export_authorized ? "Retirer accès Export" : "Accorder accès Export"}
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        <button onClick={() => handleViewProfile(p.id)} className="p-1.5 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Voir la fiche détaillée"><Eye className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDeleteUser(p.id, `${p.first_name || ''} ${p.last_name || ''}`)} className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer définitivement"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Utilisateurs */}
                            {totalUserPages > 1 && (
                                <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2">
                                    <button
                                        disabled={usersPage === 1}
                                        onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                                    >
                                        Précédent
                                    </button>
                                    <span className="text-sm font-semibold text-gray-600">Page {usersPage} sur {totalUserPages}</span>
                                    <button
                                        disabled={usersPage === totalUserPages}
                                        onClick={() => setUsersPage(prev => Math.min(totalUserPages, prev + 1))}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                                    >
                                        Suivant
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Gestion Assistants Admin */}
                {activeTab === 'assistants' && (
                    <div className="space-y-6 mt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">Gestion des Assistants</h1>
                                <p className="text-sm text-gray-600">Déléguez des tâches spécifiques tout en gardant le contrôle.</p>
                            </div>
                            <button
                                onClick={() => setShowCreateAssistant(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6600] hover:bg-[#e55c00] text-white rounded-xl text-sm font-bold shadow-md shadow-orange-100 transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4" /> Recruter un assistant
                            </button>
                        </div>

                        {/* Modale Création Assistant */}
                        {showCreateAssistant && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                                    <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
                                        <div>
                                            <h2 className="text-lg font-black text-gray-900">Recruter un Assistant Admin</h2>
                                            <p className="text-xs text-gray-500 mt-0.5">Ce compte sera créé directement sans passer par le workflow CHOa.</p>
                                        </div>
                                        <button onClick={() => setShowCreateAssistant(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">×</button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Prénom *</label>
                                                <input type="text" value={assistantForm.first_name} onChange={e => setAssistantForm(f => ({ ...f, first_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6600]" placeholder="Jean" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Nom *</label>
                                                <input type="text" value={assistantForm.last_name} onChange={e => setAssistantForm(f => ({ ...f, last_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6600]" placeholder="Kouassi" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Email * (identifiant de connexion)</label>
                                            <input type="email" value={assistantForm.email} onChange={e => setAssistantForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6600]" placeholder="assistant@racinesplus.ci" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Mot de passe temporaire *</label>
                                            <input type="password" value={assistantForm.password} onChange={e => setAssistantForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6600]" placeholder="Min. 8 caractères" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Téléphone</label>
                                                <input type="tel" value={assistantForm.phone} onChange={e => setAssistantForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6600]" placeholder="+225 ..."
                                                /></div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Poste / Fonction</label>
                                                <input type="text" value={assistantForm.poste} onChange={e => setAssistantForm(f => ({ ...f, poste: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6600]" placeholder="Modérateur contenu" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Village d&apos;origine (optionnel)</label>
                                            <select value={assistantForm.village_origin} onChange={e => setAssistantForm(f => ({ ...f, village_origin: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FF6600] bg-white">
                                                <option value="">-- Aucune affiliation village --</option>
                                                {villages.map(v => <option key={v.id} value={v.nom}>{v.nom}</option>)}
                                            </select>
                                        </div>

                                        <div className="border-t border-gray-100 pt-4">
                                            <p className="text-xs font-black text-gray-700 uppercase mb-3">Permissions accordées</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {([
                                                    { key: 'can_validate_users', label: 'Valider utilisateurs' },
                                                    { key: 'can_manage_villages', label: 'Gérer villages' },
                                                    { key: 'can_manage_ancestors', label: 'Gérer ancêtres' },
                                                    { key: 'can_manage_memorial', label: 'Gérer mémorial' },
                                                    { key: 'can_issue_certificates', label: 'Délivrer certificats' },
                                                    { key: 'can_manage_invitations', label: 'Gérer invitations' },
                                                    { key: 'can_export_data', label: 'Exporter les données' },
                                                ] as const).map(item => (
                                                    <label key={item.key} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={assistantPerms[item.key]}
                                                            onChange={e => setAssistantPerms(p => ({ ...p, [item.key]: e.target.checked }))}
                                                            className="w-4 h-4 rounded accent-[#FF6600]"
                                                        />
                                                        {item.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            disabled={isCreatingAssistant || !assistantForm.email || !assistantForm.password || !assistantForm.first_name || !assistantForm.last_name}
                                            onClick={async () => {
                                                setIsCreatingAssistant(true);
                                                const { data: { session } } = await supabase.auth.getSession();
                                                if (!session) { setIsCreatingAssistant(false); return; }
                                                const res = await fetch('/api/admin/create-assistant', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                                                    body: JSON.stringify({ ...assistantForm, permissions: assistantPerms })
                                                });
                                                const result = await res.json();
                                                setIsCreatingAssistant(false);
                                                if (result.success) {
                                                    alert(`✅ ${result.message}`);
                                                    setShowCreateAssistant(false);
                                                    setAssistantForm({ first_name: '', last_name: '', email: '', password: '', phone: '', poste: '', village_origin: '' });
                                                    setAssistantPerms({ can_validate_users: false, can_manage_villages: false, can_manage_ancestors: false, can_manage_memorial: false, can_issue_certificates: false, can_manage_invitations: false, can_export_data: false });
                                                    // Recharger les profiles
                                                    window.location.reload();
                                                } else {
                                                    alert(`❌ Erreur : ${result.error}`);
                                                }
                                            }}
                                            className="w-full py-3 bg-[#FF6600] hover:bg-[#e55c00] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isCreatingAssistant ? (
                                                <span className="animate-pulse">Création en cours...</span>
                                            ) : (
                                                <><Key className="w-4 h-4" /> Créer le compte Assistant</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                                    <tr>
                                        <th className="text-left py-4 px-6">Assistant</th>
                                        <th className="text-center py-4 px-2">Validations</th>
                                        <th className="text-center py-4 px-2">Villages</th>
                                        <th className="text-center py-4 px-2">Ancêtres</th>
                                        <th className="text-center py-4 px-2">Mémorial</th>
                                        <th className="text-center py-4 px-2">Certificats</th>
                                        <th className="text-center py-4 px-2">Export</th>
                                        <th className="text-center py-4 px-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {profiles.filter(p => p.role === 'admin' && p.id !== currentUserId).map(p => {
                                        const perms = assistantPermissions[p.id] || {
                                            can_validate_users: false, can_manage_villages: false,
                                            can_manage_ancestors: false, can_manage_memorial: false,
                                            can_issue_certificates: false, can_export_data: false
                                        };
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50/50">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{p.first_name?.[0]}{p.last_name?.[0]}</div>
                                                        <div>
                                                            <p className="font-bold text-sm">{p.first_name} {p.last_name}</p>
                                                            <p className="text-[10px] text-gray-600">{p.village_origin}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {[
                                                    { key: 'can_validate_users', icon: ShieldCheck },
                                                    { key: 'can_manage_villages', icon: Map },
                                                    { key: 'can_manage_ancestors', icon: TreePine },
                                                    { key: 'can_manage_memorial', icon: Flame },
                                                    { key: 'can_issue_certificates', icon: Stamp },
                                                    { key: 'can_export_data', icon: Download }
                                                ].map(perm => (
                                                    <td key={perm.key} className="py-4 px-2 text-center">
                                                        <button
                                                            onClick={() => handleUpdatePermission(p.id, perm.key as any, !perms[perm.key as keyof typeof perms])}
                                                            className={`p-2 rounded-xl transition-all ${perms[perm.key as keyof typeof perms] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                                                        >
                                                            <perm.icon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                ))}
                                                <td className="py-4 px-4 text-center">
                                                    <button onClick={() => handleRoleChange(p.id, 'user')} className="text-[10px] font-bold text-red-500 hover:underline">RÉTROGRADER</button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {profiles.filter(p => p.role === 'admin' && p.id !== currentUserId).length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-gray-600 italic text-sm">Aucun assistant désigné pour le moment.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
                                    <input type="text" value={ancestorForm.villageNom} disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 outline-none text-sm" />
                                    <button disabled={isSavingAncestor} type="submit" className="w-full bg-amber-500 disabled:bg-gray-200 disabled:text-gray-600 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> {isSavingAncestor ? 'Création...' : 'Créer l\'Ancêtre'}
                                    </button>
                                </form>
                            </div>

                            {/* Liste des villages */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm md:col-span-2">
                                <h2 className="font-bold mb-4 flex items-center gap-2"><Map className="w-5 h-5 text-blue-500" /> Liste des Villages</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Village</th>
                                                <th className="px-4 py-3 text-left">Région</th>
                                                <th className="px-4 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {(() => {
                                                const paginatedVillages = villages.slice((villagesPage - 1) * itemsPerPage, villagesPage * itemsPerPage);
                                                return paginatedVillages.map(v => (
                                                    <React.Fragment key={v.id}>
                                                        <tr className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-4 py-3 font-semibold">{v.nom}</td>
                                                            <td className="px-4 py-3 text-gray-600 text-sm">{v.region || '-'}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleAddQuartier(v.id)}
                                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                        title="Ajouter un Quartier"
                                                                    >
                                                                        <Plus className="w-3 h-3" /> QUARTIER
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const nextName = prompt("Nouveau nom :", v.nom);
                                                                            if (nextName && nextName !== v.nom) {
                                                                                supabase.from('villages').update({ nom: nextName }).eq('id', v.id).then(({ error }) => {
                                                                                    if (error) alert(error.message);
                                                                                    else setVillages(prev => prev.map(vi => vi.id === v.id ? { ...vi, nom: nextName } : vi));
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteVillage(v.id, v.nom)}
                                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {/* Quartiers associés */}
                                                        {quartiers.filter(q => q.village_id === v.id).length > 0 && (
                                                            <tr className="bg-gray-50/30">
                                                                <td colSpan={3} className="px-8 py-2">
                                                                    <div className="flex flex-wrap gap-2 text-[10px]">
                                                                        <span className="text-gray-600 font-bold uppercase py-1">Quartiers :</span>
                                                                        {quartiers.filter(q => q.village_id === v.id).map(q => (
                                                                            <div key={q.id} className="bg-white border border-gray-100 rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                                                                                <span>{q.nom}</span>
                                                                                <button onClick={() => handleDeleteQuartier(q.id)} className="text-red-400 hover:text-red-600">
                                                                                    <XCircle className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ));
                                            })()}
                                            {villages.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-600 italic">Aucun village enregistré</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Villages */}
                                {Math.ceil(villages.length / itemsPerPage) > 1 && (
                                    <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2">
                                        <button disabled={villagesPage === 1} onClick={() => setVillagesPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50">Précédent</button>
                                        <span className="text-sm font-semibold text-gray-600">Page {villagesPage} sur {Math.ceil(villages.length / itemsPerPage)}</span>
                                        <button disabled={villagesPage === Math.ceil(villages.length / itemsPerPage)} onClick={() => setVillagesPage(prev => Math.min(Math.ceil(villages.length / itemsPerPage), prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50">Suivant</button>
                                    </div>
                                )}
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
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <h2 className="font-bold text-lg">Suivi Ultra-Détaillé</h2>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Chercher nom, téléphone..."
                                            value={valSearchTerm}
                                            onChange={e => setValSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full md:w-64 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 outline-none"
                                        />
                                    </div>
                                    <select value={valFilterStatus} onChange={e => setValFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#FF6600]">
                                        <option value="all">Tous Statuts</option>
                                        <option value="confirmed">✅ Confirmés</option>
                                        <option value="probable">🟠 Prés-validés (Probables)</option>
                                        <option value="pending">⏳ En attente (Nouveaux)</option>
                                        <option value="rejected">❌ Rejetés</option>
                                    </select>
                                    <select value={valFilterVillage} onChange={e => setValFilterVillage(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#FF6600]">
                                        <option value="all">Tous Villages</option>
                                        {uniqueVillages.map(v => (
                                            <option key={v as string} value={v as string}>{v as string}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-[10px] text-gray-600 uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="text-left py-3 px-4">Citoyen</th>
                                            <th className="text-left py-3 px-4">Origines</th>
                                            <th className="text-left py-3 px-4">Contact & Info</th>
                                            <th className="text-left py-3 px-4">Statut</th>
                                            <th className="text-left py-3 px-4">Délai</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedValidations.map((p: any) => (
                                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#FF6600]/10 text-[#FF6600] flex items-center justify-center text-xs font-bold relative overflow-hidden">
                                                            {p.avatar_url ? (
                                                                <img src={p.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                (p.first_name?.[0] || '?').toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{p.first_name} {p.last_name}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase">{p.gender || 'Genre non précisé'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-gray-800">{p.village_origin || '—'}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase">{p.quartier_nom || 'Quartier non précisé'}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-xs text-gray-600">{p.phone_1 || p.whatsapp_1 ? `📞 ${p.phone_1 || p.whatsapp_1}` : 'Vérifier la fiche'}</p>
                                                    <p className="text-[10px] text-gray-400 capitalize">{p.niveau_etudes || 'Études non précisées'}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-black tracking-wide ${p.status === 'confirmed' ? 'bg-green-100 text-green-700' : p.status === 'probable' ? 'bg-orange-100 text-orange-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {p.status === 'confirmed' ? 'CERTIFIÉ ✅' : p.status === 'probable' ? 'PROBABLE 🟠' : p.status === 'rejected' ? 'REJETÉ 🔴' : 'EN ATTENTE ⏳'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-xs text-gray-500">
                                                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {validationsProfiles.length === 0 && (
                                    <div className="text-center py-10">
                                    </div>
                                )}
                            </div>
                            {/* Pagination Validations */}
                            {totalValPages > 1 && (
                                <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2">
                                    <button disabled={valPage === 1} onClick={() => setValPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50">Précédent</button>
                                    <span className="text-sm font-semibold text-gray-600">Page {valPage} sur {totalValPages}</span>
                                    <button disabled={valPage === totalValPages} onClick={() => setValPage(prev => Math.min(totalValPages, prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50">Suivant</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mémorial 2010 */}
                {activeTab === 'memorial' && (
                    <div className="space-y-6 mt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                                    <Flame className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">Mémorial 2010 - 2011</h1>
                                    <p className="text-gray-600 text-sm">Devoir de mémoire pour les victimes de la crise</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Formulaire d'ajout */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                    <h2 className="font-bold mb-4 flex items-center gap-2 text-red-600"><Plus className="w-5 h-5" /> Enregistrer une Victime</h2>
                                    <form onSubmit={handleAddMemorialVictim} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Nom *</label>
                                                <input type="text" value={memorialForm.nom} onChange={e => setMemorialForm({ ...memorialForm, nom: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 outline-none text-sm" required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Prénoms *</label>
                                                <input type="text" value={memorialForm.prenoms} onChange={e => setMemorialForm({ ...memorialForm, prenoms: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 outline-none text-sm" required />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Genre</label>
                                                <select value={memorialForm.genre} onChange={e => setMemorialForm({ ...memorialForm, genre: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 outline-none text-sm bg-white">
                                                    <option value="M">Masculin (M)</option>
                                                    <option value="F">Féminin (F)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Âge approx.</label>
                                                <input type="number" value={memorialForm.age} onChange={e => setMemorialForm({ ...memorialForm, age: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 outline-none text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Village & Quartier</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <select value={memorialForm.village_id} onChange={e => setMemorialForm({ ...memorialForm, village_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                                                    <option value="">Village ?</option>
                                                    {villages.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                                                </select>
                                                <input type="text" value={memorialForm.quartier} onChange={e => setMemorialForm({ ...memorialForm, quartier: e.target.value })} placeholder="Quartier" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Circonstances (Mémoire)</label>
                                            <textarea value={memorialForm.description} onChange={e => setMemorialForm({ ...memorialForm, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 outline-none text-sm resize-none" placeholder="Description courte pour le registre..."></textarea>
                                        </div>
                                        <button disabled={isSavingMemorial} type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2">
                                            {isSavingMemorial ? 'Inscription...' : <><Flame className="w-4 h-4" /> Inscrire au Mémorial</>}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Liste des victimes certifiées */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-red-50/30">
                                        <h2 className="font-bold flex items-center gap-2 text-red-800 uppercase text-xs tracking-wider">
                                            Registre du Village : <span className="font-extrabold text-red-600">{memorialVictims.length} Nom(s)</span>
                                        </h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-[10px] text-gray-600 uppercase font-bold">
                                                <tr>
                                                    <th className="text-left py-4 px-6">Identité</th>
                                                    <th className="text-left py-4 px-4">Localité</th>
                                                    <th className="text-left py-4 px-4">Détails</th>
                                                    <th className="text-center py-4 px-4">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {(() => {
                                                    const paginatedMemorial = memorialVictims.slice((memorialPage - 1) * itemsPerPage, memorialPage * itemsPerPage);
                                                    return paginatedMemorial.map(mv => (
                                                        <tr key={mv.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-9 h-9 rounded-full ${mv.genre === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center font-bold text-xs border border-white shadow-sm`}>
                                                                        {mv.nom[0]}{mv.prenoms[0]}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-900">{mv.nom} {mv.prenoms}</p>
                                                                        <p className="text-[10px] text-gray-600 font-medium uppercase tracking-tighter">{mv.age_approximatif || '?'}-ANS • {mv.genre}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <p className="text-gray-600 font-medium">{villages.find(v => v.id === mv.village_id)?.nom || 'Non renseignée'}</p>
                                                                <p className="text-[10px] text-gray-600 font-bold uppercase">{mv.quartier_nom || '—'}</p>
                                                            </td>
                                                            <td className="py-4 px-4 max-w-[200px]">
                                                                <p className="text-xs text-gray-600 line-clamp-2 italic">{mv.description_circonstances || 'Aucun détail'}</p>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button onClick={() => handleDeleteMemorialVictim(mv.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ));
                                                })()}
                                                {memorialVictims.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-20 text-center text-gray-600">
                                                            <Flame className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                                            <p className="italic">Le registre est actuellement vide.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination Mémorial */}
                                    {Math.ceil(memorialVictims.length / itemsPerPage) > 1 && (
                                        <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2">
                                            <button disabled={memorialPage === 1} onClick={() => setMemorialPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50">Précédent</button>
                                            <span className="text-sm font-semibold text-gray-600">Page {memorialPage} sur {Math.ceil(memorialVictims.length / itemsPerPage)}</span>
                                            <button disabled={memorialPage === Math.ceil(memorialVictims.length / itemsPerPage)} onClick={() => setMemorialPage(prev => Math.min(Math.ceil(memorialVictims.length / itemsPerPage), prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50">Suivant</button>
                                        </div>
                                    )}
                                </div>

                                {/* Section legacy/sync — victimes de l'arbre */}
                                {victims.length > 0 && (
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <h3 className="text-xs font-bold text-gray-600 flex items-center gap-2 mb-3 uppercase tracking-widest"><Search className="w-3.5 h-3.5" /> Signalés dans les arbres généalogiques</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {victims.map(v => (
                                                <span key={v.id} className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                                                    {v.firstName} {v.lastName}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-600 mt-3 italic">Note : Ces personnes ont été marquées comme &quot;Victime 2010&quot; par les utilisateurs lors de l&apos;ajout de leurs parents/enfants.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Journal d'Audit */}
                {activeTab === 'audit' && (
                    <div className="space-y-6 mt-6">
                        <div>
                            <h1 className="text-2xl font-bold">Journal d&apos;Audit (Tour de Contrôle)</h1>
                            <p className="text-sm text-gray-600">Traçabilité complète des actions effectuées sur Racines+.</p>
                        </div>
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-[10px] text-gray-600 uppercase font-bold">
                                        <tr>
                                            <th className="text-left py-4 px-6">Date</th>
                                            <th className="text-left py-4 px-6">Auteur</th>
                                            <th className="text-left py-4 px-4">Action</th>
                                            <th className="text-left py-4 px-4">Table</th>
                                            <th className="text-left py-4 px-4">Données</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {(() => {
                                            const paginatedLogs = auditLogs.slice((logsPage - 1) * itemsPerPage, logsPage * itemsPerPage);
                                            return paginatedLogs.map(log => {
                                                // Déterminer le rôle du collaborateur
                                                const authorProfile = profiles.find(p => p.id === log.user_id);
                                                const role = authorProfile?.role || 'user';
                                                const roleConfig: Record<string, { label: string; color: string }> = {
                                                    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
                                                    cho: { label: 'CHO', color: 'bg-green-100 text-green-700' },
                                                    choa: { label: 'CHOa', color: 'bg-blue-100 text-blue-700' },
                                                    ambassadeur: { label: 'Ambassadeur', color: 'bg-amber-100 text-amber-700' },
                                                    user: { label: 'Membre', color: 'bg-gray-100 text-gray-600' },
                                                };
                                                const rc = roleConfig[role] || roleConfig['user'];

                                                // Label lisible pour le type d'action
                                                const actionLabels: Record<string, string> = {
                                                    INSERT: 'Ajout ➕',
                                                    UPDATE: 'Modif. ✏️',
                                                    DELETE: 'Suppr. ❌',
                                                    BATCH_RESET_PENDING_CHOA: 'Migration 🔄',
                                                    STATUS_CHANGE: 'Statut 🟠',
                                                };

                                                return (
                                                    <tr key={log.id} className="hover:bg-gray-50/50">
                                                        <td className="py-4 px-6 text-[10px] text-gray-600 whitespace-nowrap">
                                                            {new Date(log.timestamp).toLocaleString('fr-FR')}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-600 overflow-hidden flex-shrink-0">
                                                                    {authorProfile?.avatar_url ? (
                                                                        <img src={authorProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        (log.user_details?.first_name?.[0] || 'A').toUpperCase()
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm leading-tight">
                                                                        {log.user_id === currentUserId
                                                                            ? 'Vous'
                                                                            : `${log.user_details?.first_name || ''} ${log.user_details?.last_name || 'Assistant'}`.trim()
                                                                        }
                                                                    </p>
                                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${rc.color}`}>{rc.label}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${log.action_type === 'INSERT' ? 'bg-green-100 text-green-600'
                                                                : log.action_type === 'DELETE' ? 'bg-red-100 text-red-600'
                                                                    : 'bg-blue-100 text-blue-600'
                                                                }`}>
                                                                {actionLabels[log.action_type] || log.action_type}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 font-mono text-[10px] text-gray-600 uppercase">{log.table_name}</td>
                                                        <td className="py-4 px-4">
                                                            <button onClick={() => alert(JSON.stringify(log.new_data || log.old_data, null, 2))} className="text-[10px] text-blue-500 hover:underline">Voir JSON</button>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                        {auditLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-gray-600 italic text-sm">Aucune activité enregistrée.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Logs */}
                            {Math.ceil(auditLogs.length / itemsPerPage) > 1 && (
                                <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2">
                                    <button disabled={logsPage === 1} onClick={() => setLogsPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50">Précédent</button>
                                    <span className="text-sm font-semibold text-gray-600">Page {logsPage} sur {Math.ceil(auditLogs.length / itemsPerPage)}</span>
                                    <button disabled={logsPage === Math.ceil(auditLogs.length / itemsPerPage)} onClick={() => setLogsPage(prev => Math.min(Math.ceil(auditLogs.length / itemsPerPage), prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50">Suivant</button>
                                </div>
                            )}
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
                                    <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">{s.value}</span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between py-3 border-b border-gray-50">
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Lock className="w-4 h-4 text-green-500" /> Supabase RLS</span>
                                <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold">ACTIF</span>
                            </div>
                            {/* Bouton de migration des inscrits existants */}
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#FF6600]" /> Migration Workflow CHOa
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Repositionne tous les inscrits existants (status &quot;pending&quot; ou sans statut) vers <strong>pending_choa</strong> pour qu&apos;ils apparaissent dans le tableau de bord des CHOa et démarrent le workflow de validation.
                                </p>
                                <button
                                    onClick={async () => {
                                        if (!confirm('Repositionner tous les inscrits non-validés vers pending_choa ?')) return;
                                        const { data: { session } } = await supabase.auth.getSession();
                                        if (!session) return;
                                        const res = await fetch('/api/admin/reset-pending-choa', {
                                            method: 'POST',
                                            headers: { authorization: `Bearer ${session.access_token}` }
                                        });
                                        const result = await res.json();
                                        if (result.success) {
                                            alert(`✅ ${result.message}`);
                                        } else {
                                            alert(`❌ Erreur : ${result.error}`);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6600] hover:bg-[#e55c00] text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md shadow-orange-100"
                                >
                                    <ShieldCheck className="w-4 h-4" /> Lancer la migration
                                </button>
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
                {tabs.filter(t => !t.hidden).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`flex flex-col flex-1 min-w-[72px] items-center justify-center gap-1 py-3 px-1 transition-colors ${activeTab === tab.key ? 'text-[#FF6600] border-t-2 border-[#FF6600] bg-orange-50/50' : 'text-gray-600 border-t-2 border-transparent hover:text-gray-800 hover:bg-gray-50'}`}
                    >
                        <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? 'scale-110 transition-transform' : ''}`} />
                        <span className="text-[9px] font-bold text-center leading-tight">{tab.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
