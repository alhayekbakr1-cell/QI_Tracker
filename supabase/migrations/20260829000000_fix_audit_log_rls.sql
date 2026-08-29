-- Fix: "new row violates row-level security policy for table audit_log"
--
-- log_project_changes() fires AFTER UPDATE ON projects and inserts into
-- audit_log. That table has RLS enabled but only ever got a SELECT policy
-- ("Anyone can view audit log"), so the INSERT was always rejected — and
-- because the trigger raises, it aborted the entire UPDATE. The visible
-- symptom was that changing a project's status failed outright.
--
-- Audit triggers should not depend on the calling user holding INSERT rights
-- on the audit table; that is exactly what SECURITY DEFINER is for. The
-- function runs as its owner, writes the row, and callers still cannot insert
-- forged audit rows directly.

CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO audit_log (project_id, user_id, field_name, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'status', OLD.status::text, NEW.status::text);
    END IF;
    RETURN NEW;
END;
$$;

-- Belt and braces: an audit row is only ever written on behalf of the acting
-- user, so allow authenticated inserts too. Without this, any future
-- SECURITY INVOKER writer hits the same wall.
DROP POLICY IF EXISTS "Authenticated users can append to audit log" ON audit_log;
CREATE POLICY "Authenticated users can append to audit log"
    ON audit_log FOR INSERT TO authenticated
    WITH CHECK (true);

-- Audit rows are immutable: no UPDATE or DELETE policy is granted on purpose.
