"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import {
    Users, Map, ShieldCheck, Bell, Settings, LogOut, Plus,
    CheckCircle, Clock, XCircle, TrendingUp, Globe, Lock, ChevronRight,
    BarChart3, FileText, Trash2, Edit3, Eye, AlertTriangle, Share2, Star, Search, Filter, Flame, Download,
    Shield, Activity, Key, Stamp, MapPin, Home
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
import AppLayout from '@/components/AppLayout';

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
    metadata?: any;
    emploi?: string;
    fonction?: string;
    residence_country?: string;
    residence_city?: string;
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
    can_manage_roles: boolean;
    can_view_audit_logs: boolean;
    can_manage_settings: boolean;
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
    useRoleRedirect(['admin']);
    const [activeTab, setActiveTab] = useState<'overview' | 'mon_arbre' | 'users' | 'assistants' | 'villages' | 'validations' | 'memorial' | 'audit' | 'invitations' | 'certificates' | 'settings'>('overview');
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
    const [assistantPage, setAssistantPage] = useState(1);
    const [certificatesPage, setCertificatesPage] = useState(1);
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
        can_export_data: false,
        can_manage_roles: false,
        can_view_audit_logs: false,
        can_manage_settings: false
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
                        const name = `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim();
                        setAdminName(name || user.email?.split('@')[0] || 'Admin');
                        setAdminAvatar(adminProfile.avatar_url);
                        setCurrentUserId(user.id);
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
                    .select('id, first_name, last_name, role, status, village_origin, quartier_nom, quartiers_assignes, avatar_url, created_at, is_ambassadeur, gender, niveau_etudes, birth_date, export_authorized, export_requested, certificate_requested, certificate_issued, certificate_issued_at, email, residence_city, residence_country, metadata, emploi, fonction')
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

        if (['cho', 'choa', 'admin'].includes(newRole)) {
            // Vérifier si l'utilisateur est déjà certifié par le CHO
            const profile = profiles.find(p => p.id === userId);
            if (profile?.status !== 'confirmed' && newRole !== 'user') {
                alert(`⚠️ Action impossible : L'utilisateur doit d'abord être "Certifié ✅" par le CHO avant de recevoir un rôle de collaborateur (${newRole.toUpperCase()}).`);
                setIsLoading(false);
                return;
            }
        }

        const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);

        if (error) {
            alert(`Erreur lors du changement de rôle : ${error.message}. Il se peut que les politiques RLS bloquent cette action.`);
            setIsLoading(false);
            return;
        }

        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, ...updateData } : p));

        if (['cho', 'choa'].includes(newRole)) {
            alert(`Rôle ${newRole.toUpperCase()} assigné avec succès ✔️`);
        } else if (newRole === 'admin') {
            alert(`Promu Administrateur Assistant ✔️`);
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

        const nom = newVillageName.trim();
        const normalizedNom = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const exists = villages.some(v =>
            v.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedNom
        );

        if (exists) {
            alert(`⚠️ Le village "${nom}" existe déjà.`);
            return;
        }

        const { data, error } = await supabase.from('villages').insert({ nom, region: newVillageRegion }).select().single();
        if (error) {
            alert("Erreur lors de l'ajout du village : " + error.message);
            return;
        }
        if (data) setVillages(prev => [...prev, data]);
        setNewVillageName('');
        setNewVillageRegion('');
        alert(`Village "${nom}" ajouté avec succès !`);
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
        const input = prompt("Nom du nouveau quartier :");
        if (!input) return;

        const nom = input.trim();
        const normalizedNom = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Vérifier si le quartier existe déjà dans cet état de l'UI (simple check client)
        const exists = quartiers.some(q =>
            q.village_id === villageId &&
            q.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedNom
        );

        if (exists) {
            alert(`⚠️ Le quartier "${nom}" semble déjà exister pour ce village.`);
            return;
        }

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

    const uniqueVillages = Array.from(new Set(profiles.map(p => p.village_origin).filter(Boolean)));

    // Reset pagination when filters change
    useEffect(() => {
        setUsersPage(1);
    }, [searchTerm, filterRole, filterStatus, filterVillage]);

    useEffect(() => {
        setValPage(1);
    }, [valSearchTerm, valFilterStatus, valFilterVillage]);

    const validationsProfiles = profiles.filter(p => {
        const matchSearch = (p.first_name + ' ' + p.last_name + ' ' + (p.phone_1 || '')).toLowerCase().includes(valSearchTerm.toLowerCase());
        const matchStatus = valFilterStatus === 'all' || p.status === valFilterStatus;
        const matchVillage = valFilterVillage === 'all' || p.village_origin === valFilterVillage;
        return matchSearch && matchStatus && matchVillage;
    });

    const paginatedValidations = validationsProfiles.slice((valPage - 1) * itemsPerPage, valPage * itemsPerPage);
    const paginatedProfiles = filteredProfiles.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);
    const totalValPages = Math.ceil(validationsProfiles.length / itemsPerPage);
    const totalUsersPages = Math.ceil(filteredProfiles.length / itemsPerPage);

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

    const isSuperAdmin = adminName.toLowerCase().includes('pacous') || profiles.find(p => p.id === currentUserId)?.email?.toLowerCase() === 'pacous2000@gmail.com';
    const myPerms = assistantPermissions[currentUserId || ''] || {
        can_validate_users: isSuperAdmin,
        can_manage_villages: isSuperAdmin,
        can_manage_ancestors: isSuperAdmin,
        can_manage_memorial: isSuperAdmin,
        can_issue_certificates: isSuperAdmin,
        can_manage_invitations: isSuperAdmin,
        can_export_data: isSuperAdmin,
        can_manage_roles: isSuperAdmin,
        can_view_audit_logs: isSuperAdmin,
        can_manage_settings: isSuperAdmin
    };

    const tabs = [
        { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
        { key: 'mon_arbre', label: 'Mon Arbre', icon: TreePine },
        { key: 'users', label: 'Comptes & Rôles', icon: Users, hidden: !isSuperAdmin && !myPerms.can_manage_roles },
        { key: 'assistants', label: 'Assistants Admin', icon: Shield, hidden: !isSuperAdmin },
        { key: 'villages', label: 'Villages & Quartiers', icon: Map, hidden: !isSuperAdmin && !myPerms.can_manage_villages && !myPerms.can_manage_ancestors },
        { key: 'validations', label: 'Validations', icon: ShieldCheck, hidden: !isSuperAdmin && !myPerms.can_validate_users },
        { key: 'memorial', label: 'Crise 2010', icon: Flame, hidden: !isSuperAdmin && !myPerms.can_manage_memorial },
        { key: 'audit', label: 'Journal (Audit)', icon: Activity, hidden: !isSuperAdmin && !myPerms.can_view_audit_logs },
        { key: 'invitations', label: 'Invitations', icon: Share2, hidden: !isSuperAdmin && !myPerms.can_manage_invitations },
        { key: 'certificates', label: 'Certificats', icon: Stamp, hidden: !isSuperAdmin && !myPerms.can_issue_certificates },
        { key: 'settings', label: 'Paramètres', icon: Settings, hidden: !isSuperAdmin && !myPerms.can_manage_settings },
    ];

    return (
        <AppLayout
            role="admin"
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as any)}
            userName={adminName}
            userAvatar={adminAvatar}
            onLogout={handleLogout}
            village="Toa-Zéo"
        >

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
                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Certifiés d'office</p>
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
                                <option value="confirmed">Certifié ✅</option>
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
                            {myPerms.can_export_data && (
                                <button
                                    onClick={handleExportUsers}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md active:scale-95"
                                >
                                    <Download className="w-3.5 h-3.5" /> Exporter CSV
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wide">
                                    <tr>
                                        <th className="text-left py-3 px-5">Utilisateur</th>
                                        <th className="text-left py-3 px-4">Village / Quartier</th>
                                        <th className="text-left py-3 px-4 text-[10px]">Naissance / Genre / Résidence</th>
                                        <th className="text-left py-3 px-4">Lignée Paternelle</th>
                                        <th className="text-left py-3 px-4">Lignée Maternelle</th>
                                        <th className="text-left py-3 px-4">Statut</th>
                                        <th className="text-left py-3 px-4">Rôle</th>
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
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-800">{p.village_origin || '—'}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">{p.quartier_nom || 'Quartier non assigné'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-bold text-gray-700">{p.birth_date ? new Date(p.birth_date).toLocaleDateString('fr-FR') : '—'}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase ${p.gender === 'Homme' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                                            {p.gender || '—'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase">{p.residence_country}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {p.metadata?.father_first_name} {p.metadata?.father_last_name}
                                                        {(!p.metadata?.father_first_name && !p.metadata?.father_last_name) && <span className="text-gray-400 italic font-medium">À compléter</span>}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase ${p.metadata?.father_status === 'Vivant' ? 'text-green-500' : 'text-red-500'}`}>
                                                        {p.metadata?.father_status || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {p.metadata?.mother_first_name} {p.metadata?.mother_last_name}
                                                        {(!p.metadata?.mother_first_name && !p.metadata?.mother_last_name) && <span className="text-gray-400 italic font-medium">À compléter</span>}
                                                    </span>
                                                    <span className={`text-[9px] font-black uppercase ${p.metadata?.mother_status === 'Vivante' ? 'text-green-500' : 'text-red-500'}`}>
                                                        {p.metadata?.mother_status || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider ${p.status === 'confirmed' ? 'bg-green-100 text-green-600' : p.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {p.status === 'confirmed' ? 'Certifié ✅' : p.status === 'rejected' ? '❌ Rejeté' : '⏳ En attente'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <select
                                                    value={p.role}
                                                    disabled={p.email?.toLowerCase() === 'pacous2000@gmail.com'}
                                                    onChange={(e) => handleRoleChange(p.id, e.target.value)}
                                                    className={`text-[10px] font-bold py-1 px-2 rounded-lg border focus:outline-none transition-all ${p.role === 'admin' ? (p.email?.toLowerCase() === 'pacous2000@gmail.com' ? 'bg-purple-100 border-purple-300 text-purple-800 cursor-not-allowed' : 'bg-purple-50 border-purple-200 text-purple-700') : p.role === 'cho' ? 'bg-blue-50 border-blue-200 text-blue-700' : p.role === 'choa' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                                                >
                                                    <option value="user">USER</option>
                                                    <option value="cho">CHO</option>
                                                    <option value="choa">CHOA</option>
                                                    <option value="admin">{p.email?.toLowerCase() === 'pacous2000@gmail.com' ? 'ADMIN PRINCIPAL' : 'ADMIN ASSISTANT'}</option>
                                                </select>
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

                                                    {p.certificate_requested && !p.certificate_issued && myPerms.can_issue_certificates && (
                                                        <button
                                                            onClick={() => handleIssueCertificate(p.id)}
                                                            className="p-1.5 text-[#FF6600] bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors animate-pulse"
                                                            title="Délivrer le Certificat"
                                                        >
                                                            <Stamp className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    {(p.role === 'cho' || p.role === 'choa') && myPerms.can_export_data && (
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
                        {totalUsersPages > 1 && (
                            <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2">
                                <button
                                    disabled={usersPage === 1}
                                    onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                                >
                                    Précédent
                                </button>
                                <span className="text-sm font-semibold text-gray-600">Page {usersPage} sur {totalUsersPages}</span>
                                <button
                                    disabled={usersPage === totalUsersPages}
                                    onClick={() => setUsersPage(prev => Math.min(totalUsersPages, prev + 1))}
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

                    {/* Modale Création Assistant — Design Sublimé Orange */}
                    {showCreateAssistant && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/50 animate-in zoom-in slide-in-from-bottom-8 duration-500">
                                <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 rounded-t-[2.5rem]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                                            <Key className="w-6 h-6 text-[#FF6600]" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 leading-tight">Recruter un Assistant</h2>
                                            <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Accès Privilégié Admin</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateAssistant(false)}
                                        className="p-3 rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all active:scale-90"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom *</label>
                                            <input type="text" value={assistantForm.first_name} onChange={e => setAssistantForm(f => ({ ...f, first_name: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium" placeholder="Jean" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom *</label>
                                            <input type="text" value={assistantForm.last_name} onChange={e => setAssistantForm(f => ({ ...f, last_name: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium" placeholder="Kouassi" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Identifiant *</label>
                                        <div className="relative">
                                            <input type="email" value={assistantForm.email} onChange={e => setAssistantForm(f => ({ ...f, email: e.target.value }))} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium" placeholder="assistant@racinesplus.ci" />
                                            <Users className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe temporaire *</label>
                                        <div className="relative">
                                            <input type="password" value={assistantForm.password} onChange={e => setAssistantForm(f => ({ ...f, password: e.target.value }))} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium" placeholder="Min. 8 caractères" />
                                            <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                                            <input type="tel" value={assistantForm.phone} onChange={e => setAssistantForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium" placeholder="+225 ..." />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Poste / Fonction</label>
                                            <input type="text" value={assistantForm.poste} onChange={e => setAssistantForm(f => ({ ...f, poste: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium" placeholder="Modérateur" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Affiliation Village</label>
                                        <select value={assistantForm.village_origin} onChange={e => setAssistantForm(f => ({ ...f, village_origin: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 outline-none transition-all font-bold appearance-none">
                                            <option value="">-- Aucune affiliation --</option>
                                            {villages.map(v => <option key={v.id} value={v.nom}>{v.nom}</option>)}
                                        </select>
                                    </div>

                                    <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100/50">
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-4">Permissions & Pouvoirs</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                                            {([
                                                { key: 'can_validate_users', label: 'Valider utilisateurs' },
                                                { key: 'can_manage_villages', label: 'Gérer villages' },
                                                { key: 'can_manage_ancestors', label: 'Gérer ancêtres' },
                                                { key: 'can_manage_memorial', label: 'Gérer mémorial' },
                                                { key: 'can_issue_certificates', label: 'Délivrer certificats' },
                                                { key: 'can_manage_invitations', label: 'Gérer invitations' },
                                                { key: 'can_export_data', label: 'Exporter données' },
                                                { key: 'can_manage_roles', label: 'Gérer Rôles' },
                                                { key: 'can_view_audit_logs', label: 'Voir Audit' },
                                                { key: 'can_manage_settings', label: 'Gérer Paramètres' },
                                            ] as const).map(item => (
                                                <label key={item.key} className="flex items-center gap-3 text-xs font-bold text-gray-700 cursor-pointer group/perm">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={assistantPerms[item.key]}
                                                            onChange={e => setAssistantPerms(p => ({ ...p, [item.key]: e.target.checked }))}
                                                            className="w-5 h-5 rounded-lg border-2 border-gray-200 checked:bg-[#FF6600] checked:border-[#FF6600] transition-colors appearance-none outline-none cursor-pointer"
                                                        />
                                                        <CheckCircle className={`w-3 h-3 text-white absolute left-1 transition-opacity ${assistantPerms[item.key] ? 'opacity-100' : 'opacity-0'}`} />
                                                    </div>
                                                    <span className="group-hover/perm:text-[#FF6600] transition-colors">{item.label}</span>
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
                                                setAssistantPerms({
                                                    can_validate_users: false, can_manage_villages: false, can_manage_ancestors: false,
                                                    can_manage_memorial: false, can_issue_certificates: false, can_manage_invitations: false,
                                                    can_export_data: false, can_manage_roles: false, can_view_audit_logs: false, can_manage_settings: false
                                                });
                                                window.location.reload();
                                            } else {
                                                alert(`❌ Erreur : ${result.error}`);
                                            }
                                        }}
                                        className="w-full py-5 bg-[#FF6600] hover:bg-[#e55c00] disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-[1.5rem] font-black text-base transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-orange-100"
                                    >
                                        {isCreatingAssistant ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                                <span>CRÉATION PRIVILÉGIÉE...</span>
                                            </div>
                                        ) : (
                                            <><ShieldCheck className="w-6 h-6" /> GÉNÉRER L'ACCÈS ASSISTANT</>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-gray-400 text-center font-bold tracking-widest uppercase">L'activation est instantanée • Protocole de Sécurité S-Class</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                                <tr>
                                    <th className="text-left py-4 px-6 min-w-[200px]">Assistant</th>
                                    <th className="text-center py-4 px-2">Validations</th>
                                    <th className="text-center py-4 px-2">Villages</th>
                                    <th className="text-center py-4 px-2">Ancêtres</th>
                                    <th className="text-center py-4 px-2">Mémorial</th>
                                    <th className="text-center py-4 px-2">Certificats</th>
                                    <th className="text-center py-4 px-2">Export</th>
                                    <th className="text-center py-4 px-2">Rôles</th>
                                    <th className="text-center py-4 px-2">Audit</th>
                                    <th className="text-center py-4 px-2">Settings</th>
                                    <th className="text-center py-4 px-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(() => {
                                    const assistants = profiles.filter(p => p.role === 'admin' && p.id !== currentUserId);
                                    const paginatedAssistants = assistants.slice((assistantPage - 1) * itemsPerPage, assistantPage * itemsPerPage);
                                    const totalPages = Math.ceil(assistants.length / itemsPerPage);

                                    return (
                                        <>
                                            {paginatedAssistants.map(p => {
                                                const perms = assistantPermissions[p.id] || {
                                                    can_validate_users: false, can_manage_villages: false,
                                                    can_manage_ancestors: false, can_manage_memorial: false,
                                                    can_issue_certificates: false, can_export_data: false,
                                                    can_manage_roles: false, can_view_audit_logs: false, can_manage_settings: false
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
                                                            { key: 'can_export_data', icon: Download },
                                                            { key: 'can_manage_roles', icon: Users },
                                                            { key: 'can_view_audit_logs', icon: Activity },
                                                            { key: 'can_manage_settings', icon: Settings }
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
                                            {assistants.length === 0 && (
                                                <tr>
                                                    <td colSpan={11} className="py-12 text-center text-gray-600 italic text-sm">Aucun assistant désigné pour le moment.</td>
                                                </tr>
                                            )}
                                            {totalPages > 1 && (
                                                <tr>
                                                    <td colSpan={11} className="py-4 px-6 border-t border-gray-50">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <button disabled={assistantPage === 1} onClick={() => setAssistantPage(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Précédent</button>
                                                            <span className="text-sm font-semibold text-gray-600">Page {assistantPage} sur {totalPages}</span>
                                                            <button disabled={assistantPage === totalPages} onClick={() => setAssistantPage(prev => Math.min(totalPages, prev + 1))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-50 bg-white">Suivant</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }

            {/* Gestion Villages */}
            {
                activeTab === 'villages' && (
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
                )
            }

            {/* Validations */}
            {/* Validations (Suivi Ultra-Détaillé) */}
            {activeTab === 'validations' && (
                <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Suivi des <span className="text-[#FF6600]">Validations</span></h1>
                            <p className="text-gray-500 font-medium mt-1">Gérez le flux de certification national en temps réel.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 group hover:shadow-2xl hover:shadow-green-200/40 transition-all duration-700 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-4xl font-black text-gray-900 mb-1">{stats.confirmedUsers}</div>
                                <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">Citoyens Certifiés</p>
                            </div>
                        </div>

                        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 group hover:shadow-2xl hover:shadow-orange-200/40 transition-all duration-700 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                                    <Clock className="w-6 h-6 text-orange-500" />
                                </div>
                                <div className="text-4xl font-black text-gray-900 mb-1">{stats.pendingUsers}</div>
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Flux en Attente</p>
                            </div>
                        </div>

                        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/40 group hover:shadow-2xl hover:shadow-red-200/40 transition-all duration-700 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-[4rem] -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="text-4xl font-black text-gray-900 mb-1">{stats.rejectedUsers}</div>
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Dossiers Rejetés</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white/80 shadow-2xl shadow-gray-200/50 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center">
                                        <Filter className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Registre Global</h2>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-orange-400 blur rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity" />
                                        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher un citoyen..."
                                            value={valSearchTerm}
                                            onChange={e => setValSearchTerm(e.target.value)}
                                            className="pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm w-full md:w-80 focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium shadow-sm"
                                        />
                                    </div>
                                    <div className="h-8 w-[2px] bg-gray-100 hidden md:block" />
                                    <select value={valFilterStatus} onChange={e => setValFilterStatus(e.target.value)} className="px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-[#FF6600] focus:ring-4 focus:ring-orange-50 transition-all cursor-pointer shadow-sm appearance-none min-w-[160px]">
                                        <option value="all">Tous Statuts</option>
                                        <option value="confirmed">CERTIFIÉ ✅</option>
                                        <option value="probable">PROBABLE 🟠</option>
                                        <option value="pending">NOUVEAU ⏳</option>
                                        <option value="rejected">REJETÉ 🔴</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                        <th className="text-left py-6 px-8">Citoyen & Identité (Naissance / Genre)</th>
                                        <th className="text-left py-6 px-6">Origines & Résidence</th>
                                        <th className="text-left py-6 px-6">Lignée Parentale (Père / Mère)</th>
                                        <th className="text-left py-6 px-6">Profession & Études</th>
                                        <th className="text-center py-6 px-6">État de Validation</th>
                                        <th className="text-right py-6 px-8">Inscription</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedValidations.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-orange-50/20 transition-all duration-300 group">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-white shadow-xl overflow-hidden flex-shrink-0">
                                                        {p.avatar_url ? (
                                                            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-orange-100 text-[#FF6600] font-black text-sm">
                                                                {(p.first_name?.[0] || '?').toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-gray-900 group-hover:text-[#FF6600] transition-colors truncate">{p.first_name} {p.last_name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.gender === 'Homme' ? '♂️ M' : p.gender === 'Femme' ? '♀️ F' : 'GNR'}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <span className="text-[10px] font-bold text-gray-500">{p.birth_date ? new Date(p.birth_date).toLocaleDateString('fr-FR') : 'Date ?'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                                                        <MapPin className="w-3 h-3 text-orange-400" />
                                                        {p.village_origin} <span className="text-gray-400 mx-1">/</span> {p.quartier_nom || '—'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg w-fit">
                                                        <Home className="w-3 h-3 text-blue-400" />
                                                        Habite à : {p.residence_city || '—'}, {p.residence_country || '—'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="space-y-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Père :</span>
                                                        <p className="text-[11px] font-bold text-gray-900 truncate">
                                                            {p.metadata?.father_first_name || '—'} {p.metadata?.father_last_name || ''}
                                                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[8px] ${p.metadata?.father_status === 'Vivant' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {p.metadata?.father_status || '—'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Mère :</span>
                                                        <p className="text-[11px] font-bold text-gray-900 truncate">
                                                            {p.metadata?.mother_first_name || '—'} {p.metadata?.mother_last_name || ''}
                                                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[8px] ${p.metadata?.mother_status === 'Vivante' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {p.metadata?.mother_status || '—'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-black text-gray-900 truncate">{p.emploi || p.fonction || 'Non renseigné'}</p>
                                                    <div className="flex flex-col gap-0.5">
                                                        {p.phone_1 && <p className="text-[10px] font-bold text-gray-600">📞 {p.phone_1}</p>}
                                                        {p.whatsapp_1 && <p className="text-[10px] font-bold text-green-600">🟢 {p.whatsapp_1}</p>}
                                                        <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full uppercase tracking-tighter w-fit">{p.niveau_etudes || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6 text-center">
                                                <span className={`text-[10px] px-4 py-2 rounded-2xl font-black tracking-widest inline-flex items-center gap-2 shadow-sm border ${p.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' : p.status === 'probable' ? 'bg-orange-50 text-orange-700 border-orange-100' : p.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'confirmed' ? 'bg-green-500' : p.status === 'probable' ? 'bg-orange-500' : p.status === 'rejected' ? 'bg-red-500' : 'bg-gray-400'}`} />
                                                    {p.status === 'confirmed' ? 'CERTIFIÉ ✅' : p.status === 'probable' ? 'PROBABLE 🟠' : p.status === 'rejected' ? 'REJETÉ 🔴' : 'EN ATTENTE ⏳'}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <p className="text-xs font-black text-gray-400 tracking-widest">{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Mémorial 2010 */}
            {
                activeTab === 'memorial' && (
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
                )
            }

            {/* Journal d'Audit */}
            {/* Journal d'Audit (Design Premium) */}
            {activeTab === 'audit' && (
                <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="absolute inset-0 bg-orange-400 blur-lg rounded-full opacity-20 animate-pulse" />
                                <div className="relative w-16 h-16 bg-gray-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
                                    <Activity className="w-8 h-8 text-[#FF6600]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tour de <span className="text-[#FF6600]">Contrôle</span></h1>
                                <p className="text-gray-500 font-medium">Surveillance cryptographique et journalisation des flux.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-orange-50/50 px-6 py-3 rounded-2xl border border-orange-100/50">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Flux temps RÉEL ACTIF</p>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white/80 shadow-2xl shadow-gray-200/50 overflow-hidden">
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                        <th className="text-left py-6 px-8">Horodatage</th>
                                        <th className="text-left py-6 px-6">Opérateur</th>
                                        <th className="text-center py-6 px-6">Action Réalisée</th>
                                        <th className="text-center py-6 px-6">Cible Système</th>
                                        <th className="text-right py-6 px-8">Audit JSON</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(() => {
                                        const paginatedLogs = auditLogs.slice((logsPage - 1) * itemsPerPage, logsPage * itemsPerPage);
                                        return paginatedLogs.map(log => {
                                            const authorProfile = profiles.find(p => p.id === log.user_id);
                                            const role = authorProfile?.role || 'user';
                                            const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
                                                admin: { label: 'ADMIN', color: 'text-purple-700', bg: 'bg-purple-50' },
                                                cho: { label: 'CHO', color: 'text-green-700', bg: 'bg-green-50' },
                                                choa: { label: 'CHOa', color: 'text-blue-700', bg: 'bg-blue-50' },
                                                ambassadeur: { label: 'AMB.', color: 'text-amber-700', bg: 'bg-amber-50' },
                                                user: { label: 'MBRE', color: 'text-gray-600', bg: 'bg-gray-100' },
                                            };
                                            const rc = roleConfig[role] || roleConfig['user'];
                                            const actionLabels: Record<string, string> = {
                                                INSERT: 'CRÉATION ➕',
                                                UPDATE: 'MODIFICATION ✏️',
                                                DELETE: 'SUPPRESSION ❌',
                                                BATCH_RESET_PENDING_CHOA: 'MIGRATION 🔄',
                                                STATUS_CHANGE: 'STATUT 🟠',
                                            };

                                            return (
                                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="py-6 px-8 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-gray-900 leading-none">{new Date(log.timestamp).toLocaleDateString('fr-FR')}</span>
                                                            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative w-10 h-10 rounded-xl bg-white shadow-md border-2 border-white overflow-hidden flex items-center justify-center text-[10px] font-black text-gray-900">
                                                                {authorProfile?.avatar_url ? (
                                                                    <img src={authorProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (log.user_details?.first_name?.[0] || 'A').toUpperCase()
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 group-hover:text-[#FF6600] transition-colors">
                                                                    {log.user_id === currentUserId ? 'Vous' : `${log.user_details?.first_name || ''} ${log.user_details?.last_name || 'Assistant'}`}
                                                                </p>
                                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${rc.bg} ${rc.color}`}>{rc.label}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6 text-center">
                                                        <span className={`px-4 py-2 rounded-2xl text-[9px] font-black tracking-widest shadow-sm border ${log.action_type === 'INSERT' ? 'bg-green-50 text-green-700 border-green-100'
                                                            : log.action_type === 'DELETE' ? 'bg-red-50 text-red-700 border-red-100'
                                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                            }`}>
                                                            {actionLabels[log.action_type] || log.action_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-6 text-center text-[10px] font-black text-gray-400 font-mono tracking-tighter bg-gray-50/30 group-hover:bg-orange-50/50 transition-colors">
                                                        {log.table_name || 'SYSTEM'}
                                                    </td>
                                                    <td className="py-6 px-8 text-right">
                                                        <button
                                                            onClick={() => alert(JSON.stringify(log.new_data || log.old_data, null, 2))}
                                                            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#FF6600] transition-all active:scale-90"
                                                        >
                                                            Inspections
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Invitations */}
            {
                activeTab === 'invitations' && currentUserId && (
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
                )
            }

            {/* Certificats */}
            {
                activeTab === 'certificates' && (
                    <div className="space-y-6 mt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <Stamp className="w-6 h-6 text-amber-600" />
                                    </div>
                                    Gestion des <span className="text-amber-600">Certificats</span>
                                </h1>
                                <p className="text-sm text-gray-500 font-medium">Délivrez les certificats d&apos;appartenance aux membres validés.</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-amber-50/20">
                                <h2 className="font-black text-[10px] text-amber-800 uppercase tracking-widest">
                                    Demandes de <span className="text-amber-600">CERTIFICATS</span> en attente
                                </h2>
                            </div>
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50/50 text-[10px] text-gray-400 uppercase font-black tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="text-left py-5 px-8">Identité Membre</th>
                                            <th className="text-left py-5 px-6">Localité d&apos;Origine</th>
                                            <th className="text-center py-5 px-6">Statut de la Demande</th>
                                            <th className="text-right py-5 px-8">Action Décisive</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {(() => {
                                            const requests = profiles.filter(p => p.certificate_requested && !p.certificate_issued);
                                            const paginatedRequests = requests.slice((certificatesPage - 1) * itemsPerPage, certificatesPage * itemsPerPage);
                                            const totalCertPages = Math.ceil(requests.length / itemsPerPage);

                                            return (
                                                <>
                                                    {paginatedRequests.map(p => (
                                                        <tr key={p.id} className="hover:bg-amber-50/30 transition-all group">
                                                            <td className="py-5 px-8">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xs border border-white shadow-sm transition-transform group-hover:scale-110">
                                                                        {p.avatar_url ? (
                                                                            <img src={p.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
                                                                        ) : (
                                                                            (p.first_name?.[0] || '?').toUpperCase()
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors">{p.first_name} {p.last_name}</p>
                                                                        <p className="text-[10px] text-gray-500 font-medium">{p.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-6">
                                                                <p className="text-gray-900 font-bold text-sm">{p.village_origin || '—'}</p>
                                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{p.quartier_nom || 'Quartier non défini'}</p>
                                                            </td>
                                                            <td className="py-5 px-6 text-center">
                                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black border border-amber-100 shadow-sm animate-pulse">
                                                                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                                                    EN ATTENTE
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-8 text-right">
                                                                <button
                                                                    onClick={() => handleIssueCertificate(p.id)}
                                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black shadow-lg shadow-amber-200 transition-all active:scale-95 hover:translate-x-1"
                                                                >
                                                                    <Stamp className="w-3.5 h-3.5" /> DÉLIVRER LE CERTIFICAT
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {requests.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="py-24 text-center">
                                                                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                                    <Stamp className="w-8 h-8 text-gray-200" />
                                                                </div>
                                                                <p className="text-gray-400 font-bold text-sm">Aucune demande de certificat en attente.</p>
                                                                <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Le registre est à jour</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {totalCertPages > 1 && (
                                                        <tr>
                                                            <td colSpan={4} className="py-6 px-8 border-t border-gray-50 bg-gray-50/30">
                                                                <div className="flex justify-center items-center gap-4">
                                                                    <button
                                                                        disabled={certificatesPage === 1}
                                                                        onClick={() => setCertificatesPage(prev => Math.max(1, prev - 1))}
                                                                        className="w-10 h-10 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-amber-600 hover:border-amber-200 disabled:opacity-30 transition-all shadow-sm"
                                                                    >
                                                                        ←
                                                                    </button>
                                                                    <span className="text-[11px] font-black text-gray-500 tracking-widest uppercase">Page {certificatesPage} <span className="text-gray-200">/</span> {totalCertPages}</span>
                                                                    <button
                                                                        disabled={certificatesPage === totalCertPages}
                                                                        onClick={() => setCertificatesPage(prev => Math.min(totalCertPages, prev + 1))}
                                                                        className="w-10 h-10 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-amber-600 hover:border-amber-200 disabled:opacity-30 transition-all shadow-sm"
                                                                    >
                                                                        →
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Paramètres */}
            {activeTab === 'settings' && (
                <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configuration <span className="text-[#FF6600]">Système</span></h1>
                            <p className="text-gray-500 font-medium mt-1">Gérez les constantes et l'identité de la plateforme Racines+.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Section 1: Informations Générales */}
                        <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 shadow-xl p-8 space-y-6 hover:shadow-2xl transition-all duration-500">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Identité Plateforme</h2>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Nom du Projet', value: 'Racines+', icon: ShieldCheck },
                                    { label: 'Slogan National', value: 'Retrouver ses racines, bâtir demain', icon: Star },
                                    { label: 'Village Pilote', value: 'Toa-Zéo', icon: MapPin },
                                    { label: 'Région Active', value: 'Guémon, Côte d\'Ivoire', icon: Globe },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <span className="text-xs font-black text-gray-900">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Identité Visuelle */}
                        <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 shadow-xl p-8 space-y-6 hover:shadow-2xl transition-all duration-500">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                    <Flame className="w-6 h-6 text-[#FF6600]" />
                                </div>
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Charte & Design</h2>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Logo Officiel</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Format PNG/SVG transparent</p>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded-xl">
                                        <Image src="/LOGO_Racines.png" alt="Logo" width={60} height={20} className="object-contain mix-blend-multiply opacity-50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-[#FF6600] rounded-2xl shadow-lg shadow-orange-100 flex flex-col items-center justify-center gap-1 text-white">
                                        <span className="text-[10px] font-black uppercase">Couleur Primaire</span>
                                        <span className="text-xs font-bold">#FF6600</span>
                                    </div>
                                    <div className="p-4 bg-gray-950 rounded-2xl shadow-lg shadow-gray-100 flex flex-col items-center justify-center gap-1 text-white">
                                        <span className="text-[10px] font-black uppercase">Couleur Texte</span>
                                        <span className="text-xs font-bold">#030712</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Infrastructure & Sécurité */}
                        <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 shadow-xl p-8 space-y-6 hover:shadow-2xl transition-all duration-500">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-purple-600" />
                                </div>
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Sécurité & API</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                        <span className="text-xs font-black text-green-700 uppercase tracking-widest">Supabase RLS</span>
                                    </div>
                                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-[9px] font-black">ACTIF</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                                    <div className="flex items-center gap-3">
                                        <Key className="w-4 h-4 text-purple-500" />
                                        <span className="text-xs font-black text-purple-700 uppercase tracking-widest">Accès JWT</span>
                                    </div>
                                    <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-[9px] font-black">SÉCURISÉ</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-7">Version Build</span>
                                    <span className="text-xs font-black text-gray-900 font-mono tracking-tighter">v1.2.4-stable</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Maintenance & Outils */}
                        <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 shadow-xl p-8 space-y-6 hover:shadow-2xl transition-all duration-500">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                                    <Activity className="w-6 h-6 text-red-600" />
                                </div>
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Maintenance</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-4 bg-gray-50 hover:bg-white hover:shadow-lg rounded-[1.5rem] border border-gray-100 transition-all group flex flex-col items-center gap-2">
                                    <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Nettoyer Cache</span>
                                </button>
                                <button className="p-4 bg-gray-50 hover:bg-white hover:shadow-lg rounded-[1.5rem] border border-gray-100 transition-all group flex flex-col items-center gap-2">
                                    <Activity className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Sync Database</span>
                                </button>
                                <button className="p-4 bg-gray-50 hover:bg-white hover:shadow-lg rounded-[1.5rem] border border-gray-100 transition-all group flex flex-col items-center gap-2">
                                    <Download className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Backup SQL</span>
                                </button>
                                <button className="p-4 bg-gray-50 hover:bg-white hover:shadow-lg rounded-[1.5rem] border border-gray-100 transition-all group flex flex-col items-center gap-2">
                                    <Bell className="w-5 h-5 text-gray-400 group-hover:text-[#FF6600] transition-colors" />
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Test Alertes</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Banner footer */}
                    <div className="bg-gray-900 rounded-[2.5rem] p-10 relative overflow-hidden flex items-center justify-between">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6600] opacity-10 rounded-full -mr-20 -mt-20 blur-3xl" />
                        <div className="relative z-10">
                            <p className="text-[#FF6600] text-xs font-black uppercase tracking-[0.3em] mb-2">Protocole de Sécurité S-Class</p>
                            <h3 className="text-white text-2xl font-black max-w-md leading-tight">Le système Racines+ est optimisé pour Toa-Zéo.</h3>
                            <p className="text-gray-400 text-sm mt-3 font-medium">Toutes les actions de maintenance sont tracées dans le journal d'audit cryptographique.</p>
                        </div>
                        <div className="relative z-10 hidden md:block">
                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center backdrop-blur-md">
                                <Shield className="w-10 h-10 text-[#FF6600]" />
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </AppLayout>
    );
}
