-- ============================================================
-- QI Chief Tracker — Feature Expansion Migration
-- Standardized Supabase Database Migration
-- ============================================================

-- 1. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.profiles(id),
  assignee_name TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON public.tasks;
CREATE POLICY "Authenticated users can manage tasks"
  ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. PROJECT FILES TABLE (general attachments beyond protocol/presentation)
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage project files" ON public.project_files;
CREATE POLICY "Authenticated users can manage project files"
  ON public.project_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. AUDIT LOGS TABLE (activity tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  action TEXT NOT NULL DEFAULT 'UPDATE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can manage audit logs"
  ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
