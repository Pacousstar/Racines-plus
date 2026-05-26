import { createClient } from '@/lib/supabase';
import type { Profile, Village, Quartier, MemorialVictim, AdminPermission, ActivityLog } from '@/types';

export function getServiceClient() {
    const supabase = createClient();

    async function getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }

    async function getSessionToken() {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    }

    async function getProfileById(id: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as Profile;
    }

    async function getProfilesByRole(role: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', role);
        if (error) throw error;
        return data as Profile[];
    }

    async function getVillages() {
        const { data, error } = await supabase
            .from('villages')
            .select('*')
            .order('nom', { ascending: true });
        if (error) throw error;
        return data as Village[];
    }

    async function getQuartiers() {
        const { data, error } = await supabase
            .from('quartiers')
            .select('*')
            .order('nom', { ascending: true });
        if (error) throw error;
        return data as Quartier[];
    }

    async function getMemorialVictims() {
        const { data, error } = await supabase
            .from('memorial_victims')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as MemorialVictim[];
    }

    async function updateProfile(id: string, updates: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as Profile;
    }

    async function deleteProfile(id: string) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async function getAdminPermissions() {
        const { data, error } = await supabase
            .from('admin_permissions')
            .select('*');
        if (error) throw error;
        return data as AdminPermission[];
    }

    async function updateAdminPermission(userId: string, key: keyof AdminPermission, value: boolean) {
        const { error } = await supabase
            .from('admin_permissions')
            .update({ [key]: value })
            .eq('user_id', userId);
        if (error) throw error;
    }

    async function getAuditLogs() {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*, user_details:user_id(first_name, last_name)')
            .order('timestamp', { ascending: false });
        if (error) throw error;
        return data as ActivityLog[];
    }

    async function addVillage(nom: string, region: string) {
        const { data, error } = await supabase
            .from('villages')
            .insert({ nom, region })
            .select()
            .single();
        if (error) throw error;
        return data as Village;
    }

    async function updateVillage(id: string, nom: string, region: string) {
        const { error } = await supabase
            .from('villages')
            .update({ nom, region })
            .eq('id', id);
        if (error) throw error;
    }

    async function deleteVillage(id: string) {
        const { error } = await supabase
            .from('villages')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async function addQuartier(villageId: string, nom: string) {
        const { data, error } = await supabase
            .from('quartiers')
            .insert({ village_id: villageId, nom })
            .select()
            .single();
        if (error) throw error;
        return data as Quartier;
    }

    async function updateQuartier(id: string, nom: string) {
        const { error } = await supabase
            .from('quartiers')
            .update({ nom })
            .eq('id', id);
        if (error) throw error;
    }

    async function deleteQuartier(id: string) {
        const { error } = await supabase
            .from('quartiers')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async function addMemorialVictim(victim: Partial<MemorialVictim>) {
        const { data, error } = await supabase
            .from('memorial_victims')
            .insert(victim)
            .select()
            .single();
        if (error) throw error;
        return data as MemorialVictim;
    }

    async function deleteMemorialVictim(id: string) {
        const { error } = await supabase
            .from('memorial_victims')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async function getAuthUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    }

    return {
        supabase,
        getCurrentUser,
        getSessionToken,
        getProfileById,
        getProfilesByRole,
        getVillages,
        getQuartiers,
        getMemorialVictims,
        updateProfile,
        deleteProfile,
        getAdminPermissions,
        updateAdminPermission,
        getAuditLogs,
        addVillage,
        updateVillage,
        deleteVillage,
        addQuartier,
        updateQuartier,
        deleteQuartier,
        addMemorialVictim,
        deleteMemorialVictim,
        getAuthUser,
    };
}
