export interface Profile {
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
    diplomes?: string;
    emploi?: string;
    fonction?: string;
    retraite?: boolean;
    nombre_enfants?: number;
    birth_date?: string;
    export_authorized?: boolean;
    export_requested?: boolean;
    certificate_requested?: boolean;
    certificate_issued?: boolean;
    certificate_issued_at?: string;
    email?: string;
    phone_1?: string;
    phone_2?: string;
    whatsapp_1?: string;
    whatsapp_2?: string;
    quartier_nom?: string;
    residence_country?: string;
    residence_city?: string;
    adresse_residence?: string;
    metadata?: Record<string, any>;
    details_enfants?: Record<string, any>[];
    consentement_enfants?: boolean;
    rejection_motif?: string;
    rejection_observations?: string;
    choa_approvals?: string[];
}

export interface Village {
    id: string;
    nom: string;
    region: string;
    created_at: string;
}

export interface Quartier {
    id: string;
    village_id: string;
    nom: string;
}

export interface Victim {
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

export interface MemorialVictim {
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

export interface StatsData {
    totalUsers: number;
    totalCollaborateurs: number;
    confirmedUsers: number;
    confirmedPrelim: number;
    pendingUsers: number;
    rejectedUsers: number;
    genderStats: { male: number; female: number; unknown: number };
    educationStats: Record<string, number>;
    pendingCertificates: number;
    pendingExports: number;
    pendingRecours: number;
    contactStats: { hasPhone: number; hasWhatsapp: number };
}

export interface AdminPermission {
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

export interface ActivityLog {
    id: string;
    user_id: string;
    action_type: string;
    table_name: string;
    record_id: string;
    old_data: Record<string, unknown>;
    new_data: Record<string, unknown>;
    timestamp: string;
    user_details?: { first_name: string; last_name: string };
}
