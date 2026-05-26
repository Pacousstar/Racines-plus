import { describe, it, expect } from 'vitest';
import { computeStats, filterProfiles } from '../admin';
import type { Profile } from '@/types';

const baseProfile = (overrides: Partial<Profile> = {}): Profile => ({
    id: '1',
    first_name: 'Jean',
    last_name: 'Kouassi',
    role: 'user',
    status: 'pending',
    village_origin: 'Toa-Zéo',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
});

const profiles: Profile[] = [
    baseProfile({ id: '1', role: 'user', status: 'confirmed', gender: 'Homme', niveau_etudes: 'Bac', phone_1: '+2250102030405', whatsapp_1: '+2250102030405' }),
    baseProfile({ id: '2', role: 'user', status: 'pending', gender: 'Femme', niveau_etudes: 'Master' }),
    baseProfile({ id: '3', role: 'user', status: 'rejected', gender: 'Homme' }),
    baseProfile({ id: '4', role: 'cho', status: 'confirmed', is_ambassadeur: true }),
    baseProfile({ id: '5', role: 'admin', status: 'confirmed' }),
    baseProfile({ id: '6', role: 'user', status: 'pending_choa', phone_1: '+2250607080910' }),
    baseProfile({ id: '7', role: 'user', status: 'confirmed', gender: 'Femme', niveau_etudes: 'Bac', whatsapp_1: '+2250607080910' }),
    baseProfile({ id: '8', role: 'user', status: 'pending', gender: undefined }),
    baseProfile({ id: '9', role: 'choa', status: 'confirmed' }),
    baseProfile({ id: '10', role: 'user', status: 'confirmed', certificate_requested: true, certificate_issued: false }),
    baseProfile({ id: '11', role: 'user', status: 'confirmed', export_requested: true, export_authorized: false }),
    baseProfile({ id: '12', role: 'user', status: 'confirmed', gender: 'Homme', niveau_etudes: 'Doctorat' }),
    baseProfile({ id: '13', role: 'user', status: 'pending', gender: 'Femme' }),
    baseProfile({ id: '14', role: 'user', status: 'confirmed', gender: 'Homme' }),
];

describe('computeStats', () => {
    const stats = computeStats(profiles);

    it('calcule totalUsers (role=user uniquement)', () => {
        expect(stats.totalUsers).toBe(11);
    });

    it('calcule totalCollaborateurs (cho, choa, admin, ambassadeurs)', () => {
        // id:4 (cho + ambassadeur), id:5 (admin), id:9 (choa) = 3 uniques
        expect(stats.totalCollaborateurs).toBe(3);
    });

    it('calcule confirmedUsers (role=user et status=confirmed)', () => {
        // id:1, id:7, id:10, id:11, id:12, id:14 = 6
        expect(stats.confirmedUsers).toBe(6);
    });

    it('calcule pendingUsers (pending, pending_choa, pre_approved, probable)', () => {
        // id:2 (pending), id:6 (pending_choa), id:8 (pending), id:13 (pending) = 4
        expect(stats.pendingUsers).toBe(4);
    });

    it('calcule rejectedUsers', () => {
        expect(stats.rejectedUsers).toBe(1);
    });

    it('calcule genderStats correctement', () => {
        expect(stats.genderStats.male).toBe(4);
        expect(stats.genderStats.female).toBe(3);
        expect(stats.genderStats.unknown).toBe(4);
    });

    it('calcule educationStats', () => {
        expect(stats.educationStats['Bac']).toBe(2);
        expect(stats.educationStats['Master']).toBe(1);
        expect(stats.educationStats['Doctorat']).toBe(1);
        expect(stats.educationStats['Non renseigné']).toBe(7);
    });

    it('calcule pendingCertificates', () => {
        expect(stats.pendingCertificates).toBe(1);
    });

    it('calcule pendingExports', () => {
        expect(stats.pendingExports).toBe(1);
    });

    it('calcule pendingRecours (pending_choa)', () => {
        expect(stats.pendingRecours).toBe(1);
    });

    it('calcule contactStats', () => {
        expect(stats.contactStats.hasPhone).toBe(2);
        expect(stats.contactStats.hasWhatsapp).toBe(2);
    });

    it('retourne 0 pour tout sur un tableau vide', () => {
        const empty = computeStats([]);
        expect(empty.totalUsers).toBe(0);
        expect(empty.totalCollaborateurs).toBe(0);
        expect(empty.genderStats.male).toBe(0);
        expect(empty.pendingCertificates).toBe(0);
    });
});

describe('filterProfiles', () => {
    it('filtre par searchTerm (nom complet)', () => {
        const r = filterProfiles(profiles, 'Jean Kouassi', 'all', 'all', 'all');
        expect(r.length).toBeGreaterThanOrEqual(1);
    });

    it('filtre par searchTerm (nom partiel, doublon volontaire)', () => {
        const r = filterProfiles(profiles, 'Jean K', 'all', 'all', 'all');
        expect(r.length).toBeGreaterThanOrEqual(1);
    });

    it('filtre par searchTerm (village)', () => {
        const r = filterProfiles(profiles, 'Toa-Zéo', 'all', 'all', 'all');
        expect(r.length).toBe(profiles.length);
    });

    it('filtre par rôle', () => {
        const r = filterProfiles(profiles, '', 'cho', 'all', 'all');
        expect(r.every(p => p.role === 'cho')).toBe(true);
        expect(r.length).toBe(1);
    });

    it('filtre par statut', () => {
        const r = filterProfiles(profiles, '', 'all', 'rejected', 'all');
        expect(r.every(p => p.status === 'rejected')).toBe(true);
        expect(r.length).toBe(1);
    });

    it('filtre par village', () => {
        const r = filterProfiles(profiles, '', 'all', 'all', 'Toa-Zéo');
        expect(r.length).toBe(profiles.length);
    });

    it('filtre combiné rôle + statut', () => {
        const r = filterProfiles(profiles, '', 'user', 'confirmed', 'all');
        expect(r.every(p => p.role === 'user' && p.status === 'confirmed')).toBe(true);
        expect(r.length).toBe(6);
    });

    it('retourne tous les profils si aucun filtre', () => {
        const r = filterProfiles(profiles, '', 'all', 'all', 'all');
        expect(r.length).toBe(profiles.length);
    });

    it('retourne tableau vide si aucun match', () => {
        const r = filterProfiles(profiles, '', 'all', 'all', 'Inexistant');
        expect(r.length).toBe(0);
    });
});
