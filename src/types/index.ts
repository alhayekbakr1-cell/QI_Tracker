export type ProjectStatus = 'Idea' | 'Pre-Intervention' | 'Intervention Ongoing' | 'Sustain the Gains' | 'Impacted (Completed)';
export type UserRole = 'Operator' | 'Viewer' | 'Admin' | 'Faculty';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Profile {
    id: string;
    full_name: string | null;
    role: UserRole;
    created_at: string;
    email?: string;
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
    proponent_ids: string[]; // UUIDs
    lead_proponent_ids: string[]; // UUIDs
    faculty: string | null;
    faculty_id: string | null;
    updates_and_barriers: string | null;
    internal_notes: string | null;
    last_updated_date: string;
    created_at: string;
    updated_at: string;
    updated_by: string | null;
    protocol_url: string | null;
    presentation_url: string | null;
    target_conference: string | null;
    faculty_approved_protocol: boolean;
    faculty_approved_pdsa: boolean;
    total_patients_impacted?: number | null;
    estimated_cost_savings?: number | null;
    abstract_summary?: string | null;
    charter?: ProjectCharter | null;
}

export interface ProjectCharter {
    problemStatement: string;
    aimStatement: string;
    teamMembers: string;
    scopeIn: string;
    scopeOut: string;
    timeline: string;
    resources: string;
    successMeasures: string;
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
    role: UserRole;
    created_at: string;
}

export interface AuditLog {
    id: string;
    table_name: string;
    record_id: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    old_data: any;
    new_data: any;
    changed_by: string | null;
    created_at: string;
}

export interface Task {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    assignee_id: string | null;
    assignee_name: string | null;
    due_date: string | null;
    status: TaskStatus;
    created_by: string | null;
    created_at: string;
}

export interface ProjectFile {
    id: string;
    project_id: string;
    file_name: string;
    file_type: string | null;
    file_url: string;
    uploaded_by: string | null;
    uploaded_by_name: string | null;
    created_at: string;
}
