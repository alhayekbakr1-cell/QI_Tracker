-- Master PostgreSQL Migration Script for QI Project Tracker
-- Target: Supabase / PostgreSQL Engine
-- Features: Multi-User RBAC, Row Level Security (RLS), Auto-Audit Triggers, Indexes

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('Idea', 'Pre-Intervention', 'Intervention Ongoing', 'Sustain the Gains', 'Impacted (Completed)');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Faculty', 'Operator', 'Viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role user_role DEFAULT 'Viewer'::user_role NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    status project_status DEFAULT 'Idea'::project_status NOT NULL,
    category TEXT,
    subcategory TEXT,
    primary_outcome TEXT,
    pdsa_cycle NUMERIC DEFAULT 0,
    proponents TEXT[] DEFAULT '{}',
    lead_proponents TEXT[] DEFAULT '{}',
    proponent_ids UUID[] DEFAULT '{}',
    lead_proponent_ids UUID[] DEFAULT '{}',
    faculty TEXT,
    faculty_id UUID REFERENCES public.profiles(id),
    updates_and_barriers TEXT,
    internal_notes TEXT,
    protocol_url TEXT,
    presentation_url TEXT,
    target_conference TEXT,
    faculty_approved_protocol BOOLEAN DEFAULT FALSE,
    faculty_approved_pdsa BOOLEAN DEFAULT FALSE,
    total_patients_impacted NUMERIC,
    estimated_cost_savings NUMERIC,
    abstract_summary TEXT,
    charter JSONB,
    last_updated_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 4. METRICS TABLE
CREATE TABLE IF NOT EXISTS public.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    month DATE NOT NULL,
    value NUMERIC NOT NULL,
    pdsa_cycle_id NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES public.profiles(id),
    assignee_name TEXT,
    due_date TIMESTAMPTZ,
    status task_status DEFAULT 'todo'::task_status NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROJECT FILES TABLE
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_faculty_id ON public.projects(faculty_id);
CREATE INDEX IF NOT EXISTS idx_projects_lead_ids ON public.projects USING GIN (lead_proponent_ids);
CREATE INDEX IF NOT EXISTS idx_metrics_project_id ON public.metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

-- 10. ROW LEVEL SECURITY (RLS) MULTI-USER POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Projects
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
CREATE POLICY "Authenticated users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Leads, Faculty, and Admins can update projects" ON public.projects;
CREATE POLICY "Leads, Faculty, and Admins can update projects" ON public.projects FOR UPDATE USING (
    auth.uid() = ANY(lead_proponent_ids)
    OR auth.uid() = ANY(proponent_ids)
    OR auth.uid() = faculty_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Faculty', 'Operator'))
);

DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects" ON public.projects FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Operator'))
);

-- RLS Policies for Metrics, Comments, Tasks, Project Files
DROP POLICY IF EXISTS "Anyone can view metrics" ON public.metrics;
CREATE POLICY "Anyone can view metrics" ON public.metrics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Project contributors can insert metrics" ON public.metrics;
CREATE POLICY "Project contributors can insert metrics" ON public.metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners and Admins can delete comments" ON public.comments;
CREATE POLICY "Owners and Admins can delete comments" ON public.comments FOR DELETE USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- 11. AUTOMATED TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'Viewer')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for Auto-Auditing Project Updates
CREATE OR REPLACE FUNCTION public.log_project_status_changes() RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.audit_log (project_id, user_id, field_name, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'status', OLD.status::text, NEW.status::text);
    END IF;
    IF (OLD.pdsa_cycle IS DISTINCT FROM NEW.pdsa_cycle) THEN
        INSERT INTO public.audit_log (project_id, user_id, field_name, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'pdsa_cycle', OLD.pdsa_cycle::text, NEW.pdsa_cycle::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_project_changes ON public.projects;
CREATE TRIGGER trigger_audit_project_changes
AFTER UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.log_project_status_changes();
