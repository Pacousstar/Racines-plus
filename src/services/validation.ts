import { getServiceClient } from './supabase';

export interface ValidationComment {
    id: string;
    profile_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author_name?: string;
}

export async function loadComments(profileId: string) {
    const svc = getServiceClient();
    const { data, error } = await svc.supabase
        .from('validation_comments')
        .select('*, author:author_id(first_name, last_name)')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(c => ({
        ...c,
        author_name: c.author ? `${c.author.first_name} ${c.author.last_name}`.trim() : 'Inconnu',
    })) as ValidationComment[];
}

export async function postComment(profileId: string, authorId: string, content: string) {
    const svc = getServiceClient();
    const { error } = await svc.supabase
        .from('validation_comments')
        .insert({ profile_id: profileId, author_id: authorId, content });
    if (error) throw error;
}

export async function validateProfile(
    profileId: string,
    newStatus: string,
    isFinal: boolean,
    motif?: string,
    observations?: string
) {
    const svc = getServiceClient();
    const { error } = await svc.supabase.rpc('record_validation', {
        p_profile_id: profileId,
        p_new_status: newStatus,
        p_final: isFinal,
        p_motif: motif || null,
        p_observations: observations || null,
    });
    if (error) throw error;
}

export interface NotifCount {
    count: number;
}

export async function getUnreadNotificationCount(userId: string) {
    const svc = getServiceClient();
    const { data, error } = await svc.supabase
        .from('notifications')
        .select('count', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    if (error) throw error;
    return data?.length ?? 0;
}

export async function markNotificationsAsRead(userId: string) {
    const svc = getServiceClient();
    const { error } = await svc.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .is('is_read', false);
    if (error) throw error;
}

export async function insertNotification(notification: {
    user_id: string;
    type: string;
    title: string;
    message?: string;
    profile_id?: string;
}) {
    const svc = getServiceClient();
    const { error } = await svc.supabase
        .from('notifications')
        .insert(notification);
    if (error) throw error;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportProfilesToCSV(profiles: any[], filename: string) {
    const header = 'Nom;Prenoms;Quartier;Statut;Inscrit le';
    const rows = profiles.map(p =>
        [
            p.last_name || '',
            p.first_name || '',
            p.quartier_nom || '',
            p.status || '',
            p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '',
        ].join(';')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
