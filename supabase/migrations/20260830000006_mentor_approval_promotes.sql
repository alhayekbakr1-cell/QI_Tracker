-- Take the chief resident out of the approval path.
--
-- check_dual_sponsorship_promotion() previously required BOTH
-- mentor_approval_status = 'approved' AND gme_approval_status = 'approved'
-- before a registration request became a real project. That made the chief
-- resident a mandatory gate on every proposal in the programme.
--
-- The faculty mentor is the person with the clinical and methodological
-- standing to sponsor a project. The chief's role is oversight: seeing what
-- exists and how far along it is, not clearing a queue. Promotion now happens
-- on mentor approval alone, and gme_approval_status is recorded as 'approved'
-- at the same moment so the historic column stays meaningful rather than
-- sitting permanently pending.
--
-- TO REVERT: restore the AND condition on gme_approval_status below.

CREATE OR REPLACE FUNCTION check_dual_sponsorship_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_proj_id UUID;
    creator_name TEXT;
BEGIN
    SELECT full_name INTO creator_name FROM public.profiles WHERE id = NEW.created_by;
    IF creator_name IS NULL THEN
        creator_name := 'Resident';
    END IF;

    -- Mentor sponsorship alone promotes. Guard on status so re-saving an
    -- already-approved request cannot create the project twice.
    IF NEW.mentor_approval_status = 'approved' AND NEW.status IS DISTINCT FROM 'approved' THEN
        NEW.status := 'approved';
        NEW.gme_approval_status := 'approved';

        INSERT INTO public.projects (
            title, status, category, subcategory, primary_outcome,
            proponents, lead_proponents, proponent_ids, lead_proponent_ids,
            faculty, faculty_id, last_updated_date, created_at
        ) VALUES (
            NEW.title, 'Pre-Intervention', NEW.category, NEW.subcategory, NEW.smart_aim,
            NEW.proponents, NEW.lead_proponents, NEW.proponent_ids, NEW.lead_proponent_ids,
            NEW.faculty, NEW.faculty_id, NOW(), NOW()
        ) RETURNING id INTO new_proj_id;

        INSERT INTO public.notifications (user_id, type, title, message, project_id, is_read)
        VALUES (
            NEW.created_by,
            'registration_approved',
            'QI Project Approved & Registered! 🎉',
            'Your faculty mentor has sponsored "' || NEW.title || '". It is now active on the GME Tracker.',
            new_proj_id,
            false
        );
    END IF;
    RETURN NEW;
END;
$$;
