-- Migration: Activity Tracking & System Hardening
-- Date: 2026-02-18
-- 1. Ensure Audit Log Table exists and is exposed
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- Policy: Anyone logged in can view activity
DROP POLICY IF EXISTS "Anyone can view audit log" ON audit_log;
CREATE POLICY "Anyone can view audit log" ON audit_log FOR
SELECT USING (auth.role() = 'authenticated');
-- 2. Enhanced Triggers for Project Logging
CREATE OR REPLACE FUNCTION log_comprehensive_project_changes() RETURNS TRIGGER AS $$ BEGIN -- Log Status Changes
    IF (
        OLD.status IS DISTINCT
        FROM NEW.status
    ) THEN
INSERT INTO audit_log (
        project_id,
        user_id,
        field_name,
        old_value,
        new_value
    )
VALUES (
        NEW.id,
        auth.uid(),
        'status',
        OLD.status::text,
        NEW.status::text
    );
END IF;
-- Log PDSA Cycle Changes
IF (
    OLD.pdsa_cycle IS DISTINCT
    FROM NEW.pdsa_cycle
) THEN
INSERT INTO audit_log (
        project_id,
        user_id,
        field_name,
        old_value,
        new_value
    )
VALUES (
        NEW.id,
        auth.uid(),
        'pdsa_cycle',
        OLD.pdsa_cycle::text,
        NEW.pdsa_cycle::text
    );
END IF;
-- Log Milestone Links (Protocol/Presentation)
IF (
    OLD.protocol_url IS DISTINCT
    FROM NEW.protocol_url
) THEN
INSERT INTO audit_log (
        project_id,
        user_id,
        field_name,
        old_value,
        new_value
    )
VALUES (
        NEW.id,
        auth.uid(),
        'protocol_url',
        'None',
        'Document Uploaded'
    );
END IF;
IF (
    OLD.presentation_url IS DISTINCT
    FROM NEW.presentation_url
) THEN
INSERT INTO audit_log (
        project_id,
        user_id,
        field_name,
        old_value,
        new_value
    )
VALUES (
        NEW.id,
        auth.uid(),
        'presentation_url',
        'None',
        'Document Uploaded'
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_log_project_comprehensive_changes ON projects;
CREATE TRIGGER trigger_log_project_comprehensive_changes
AFTER
UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION log_comprehensive_project_changes();
-- 3. Membership-Based RLS for Projects
-- Remove old permissive policies
DROP POLICY IF EXISTS "Operators can update projects" ON projects;
DROP POLICY IF EXISTS "Operators can delete projects" ON projects;
-- NEW: Membership-based UPDATE policy
CREATE POLICY "Leads and Faculty can update projects" ON projects FOR
UPDATE USING (
        auth.uid() = ANY(lead_proponent_ids)
        OR auth.uid() = ANY(proponent_ids)
        OR auth.uid() = faculty_id
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role = 'Admin'
        )
    );
-- NEW: Admin-only DELETE policy
CREATE POLICY "Admins can delete projects" ON projects FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'Admin'
    )
);
-- 4. Owner-Based RLS for Comments
-- Remove old permissive policies
DROP POLICY IF EXISTS "Operators can delete comments" ON comments;
-- NEW: Delete policy (Owner or Admin)
CREATE POLICY "Owners and Admins can delete comments" ON comments FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'Admin'
    )
);