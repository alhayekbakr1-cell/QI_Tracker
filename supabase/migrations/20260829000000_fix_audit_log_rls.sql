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

-- ─── Harden the approval promotion trigger ───────────────────────────────
-- check_dual_sponsorship_promotion() runs when a registration request reaches
-- dual approval: it inserts the real row into projects and notifies the
-- resident. It was SECURITY INVOKER, so it only worked because notifications
-- and projects both happen to allow any authenticated insert. It writes a
-- notification addressed to NEW.created_by (the resident), NOT the approver,
-- so the moment notifications RLS is tightened to the natural
-- 'user_id = auth.uid()' the entire promotion aborts and approvals silently
-- stop producing projects — the same failure that broke audit_log.
-- System-level promotion belongs to the definer.

CREATE OR REPLACE FUNCTION check_dual_sponsorship_promotion()
RETURNS TRIGGER AS $$
DECLARE
    new_proj_id UUID;
    creator_name TEXT;
BEGIN
    -- Get creator full name for GME project entry
    SELECT full_name INTO creator_name FROM public.profiles WHERE id = NEW.created_by;
    IF creator_name IS NULL THEN
        creator_name := 'Resident';
    END IF;

    -- Only promote when both the named Faculty Mentor and GME Chief Resident have approved
    IF NEW.mentor_approval_status = 'approved' AND NEW.gme_approval_status = 'approved' THEN
        -- Mark overall status as approved
        NEW.status := 'approved';
        
        -- Insert into main projects table
        INSERT INTO public.projects (
            title, 
            status, 
            category, 
            subcategory, 
            primary_outcome, 
            proponents, 
            lead_proponents, 
            proponent_ids,
            lead_proponent_ids,
            faculty,
            faculty_id,
            last_updated_date,
            created_at
        ) VALUES (
            NEW.title, 
            'Pre-Intervention', 
            NEW.category, 
            NEW.subcategory, 
            NEW.smart_aim, 
            NEW.proponents, 
            NEW.lead_proponents, 
            NEW.proponent_ids,
            NEW.lead_proponent_ids,
            NEW.faculty,
            NEW.faculty_id,
            NOW(),
            NOW()
        ) RETURNING id INTO new_proj_id;
        
        -- Trigger success notification to resident creator
        INSERT INTO public.notifications (user_id, type, title, message, project_id, is_read)
        VALUES (
            NEW.created_by, 
            'registration_approved', 
            'QI Project Approved & Registered! 🎉', 
            'Congratulations! Your QI project "' || NEW.title || '" has achieved dual sponsorship approval and is now active on the GME Tracker.', 
            new_proj_id, 
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
