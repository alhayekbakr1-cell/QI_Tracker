-- ============================================================
-- QI Chief Tracker — Feature Expansion Migration
-- Run this in your Supabase SQL Editor (one time)
-- ============================================================

-- 1. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES profiles(id),
  assignee_name TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON tasks;
CREATE POLICY "Authenticated users can manage tasks"
  ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. PROJECT FILES TABLE (general attachments beyond protocol/presentation)
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage project files" ON project_files;
CREATE POLICY "Authenticated users can manage project files"
  ON project_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. AUDIT LOGS TABLE (activity tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  action TEXT NOT NULL DEFAULT 'UPDATE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can manage audit logs"
  ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Done! Run this once and you're good.
