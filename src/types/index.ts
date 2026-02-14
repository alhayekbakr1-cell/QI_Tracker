export type ProjectStatus = 'Idea' | 'Pre-Intervention' | 'Intervention Ongoing' | 'Sustain the Gains';
export type UserRole = 'Operator' | 'Viewer' | 'Admin';

export interface Profile {
    id: string;
    full_name: string | null;
    role: UserRole;
    created_at: string;
}

export interface Project {
    id: string;
    status: ProjectStatus;
    title: string;
    category: string | null;
    subcategory: string | null;
    primary_outcome: string | null;
    pdsa_cycle: number;
    proponents: string[];
    lead_proponents: string[];
    faculty: string | null;
    updates_and_barriers: string | null;
    internal_notes: string | null;
    last_updated_date: string;
    created_at: string;
    updated_at: string;
    updated_by: string | null;
    protocol_url: string | null;
    presentation_url: string | null;
}

export interface Comment {
    id: string;
    project_id: string;
    user_id: string;
    content: string;
    parent_id: string | null;
    is_resolved: boolean;
    created_at: string;
}

export interface Metric {
    id: string;
    project_id: string;
    label: string;
    month: string;
    value: number;
    pdsa_cycle_id: number | null;
}

export interface DirectoryEntry {
    id: string;
    name: string;
    email: string;
    created_at: string;
}
