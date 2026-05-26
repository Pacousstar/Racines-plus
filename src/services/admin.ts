import { getServiceClient } from './supabase';
import type { Profile, StatsData } from '@/types';

export async function loadAdminDashboard() {
    const svc = getServiceClient();
    const user = await svc.getAuthUser();
    const token = await svc.getSessionToken();

    const [villages, quartiers, memorialVictims] = await Promise.all([
        svc.getVillages(),
        svc.getQuartiers(),
        svc.getMemorialVictims(),
    ]);

    return { user, token, villages, quartiers, memorialVictims };
}

export function computeStats(profiles: Profile[]): StatsData {
    const typedProfiles = profiles as Profile[];
    const usersOnly = typedProfiles.filter(p => p.role === 'user');
    const collaborateurs = typedProfiles.filter(
        p => ['cho', 'choa', 'admin'].includes(p.role) || p.is_ambassadeur
    );

    return {
        totalUsers: usersOnly.length,
        totalCollaborateurs: collaborateurs.length,

        confirmedUsers: usersOnly.filter(p => p.status === 'confirmed').length,

        confirmedPrelim: typedProfiles.filter(
            p => ['cho', 'choa', 'admin'].includes(p.role) && p.status === 'confirmed'
        ).length,

        pendingUsers: usersOnly.filter(
            p => !p.status || ['pending', 'pending_choa', 'pre_approved', 'probable'].includes(p.status)
        ).length,

        rejectedUsers: usersOnly.filter(p => p.status === 'rejected').length,

        genderStats: {
            male: usersOnly.filter(p => p.gender === 'Homme').length,
            female: usersOnly.filter(p => p.gender === 'Femme').length,
            unknown: usersOnly.filter(p => !p.gender).length,
        },

        educationStats: usersOnly.reduce<Record<string, number>>((acc, p) => {
            const level = p.niveau_etudes || 'Non renseigné';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {}),

        pendingCertificates: usersOnly.filter(p => p.certificate_requested && !p.certificate_issued).length,
        pendingExports: usersOnly.filter(p => p.export_requested && !p.export_authorized).length,
        pendingRecours: usersOnly.filter(p => p.status === 'pending_choa').length,

        contactStats: {
            hasPhone: usersOnly.filter(p => p.phone_1).length,
            hasWhatsapp: usersOnly.filter(p => p.whatsapp_1).length,
        },
    };
}

export function filterProfiles(
    profiles: Profile[],
    searchTerm: string,
    role: string,
    status: string,
    village: string
): Profile[] {
    return profiles.filter(p => {
        const matchSearch =
            !searchTerm ||
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.village_origin?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchRole = role === 'all' || p.role === role;
        const matchStatus = status === 'all' || p.status === status;
        const matchVillage = village === 'all' || p.village_origin === village;

        return matchSearch && matchRole && matchStatus && matchVillage;
    });
}
