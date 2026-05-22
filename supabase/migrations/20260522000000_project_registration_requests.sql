-- Migration: GME Project & User Registration Requests Flow (Dual Sponsorship)
-- Date: 2026-05-22

-- 1. Extend notifications table type check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN ('faculty_approval', 'comment', 'nudge', 'stale_warning', 'general', 'sponsorship_request', 'registration_approved', 'revision_requested')
);

-- 2. Create Project Registration Requests Table
CREATE TABLE IF NOT EXISTS public.project_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    proponents TEXT[] DEFAULT '{}',
    lead_proponents TEXT[] DEFAULT '{}',
    proponent_ids UUID[] DEFAULT '{}',
    lead_proponent_ids UUID[] DEFAULT '{}',
    faculty TEXT,
    faculty_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Links directly to the Faculty Profile
    smart_aim TEXT,
    squire_rationale TEXT,
    protocol_data JSONB NOT NULL, -- Full 14-section wizard state
    
    -- Dual Sponsorship Gates
    mentor_approval_status TEXT DEFAULT 'pending' NOT NULL CHECK (mentor_approval_status IN ('pending', 'approved', 'rejected')),
    gme_approval_status TEXT DEFAULT 'pending' NOT NULL CHECK (gme_approval_status IN ('pending', 'approved', 'rejected')),
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'revisions_requested')),
    
    reviewer_feedback TEXT, -- Comments from GME/Mentor review
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.project_registration_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Anyone authenticated can view registration requests" ON public.project_registration_requests;
CREATE POLICY "Anyone authenticated can view registration requests" ON public.project_registration_requests
    FOR SELECT TO authenticated USING (
        created_by = auth.uid() OR 
        faculty_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('Operator', 'Admin')
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create registration requests" ON public.project_registration_requests;
CREATE POLICY "Authenticated users can create registration requests" ON public.project_registration_requests
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own pending requests" ON public.project_registration_requests;
CREATE POLICY "Users can update their own pending requests" ON public.project_registration_requests
    FOR UPDATE TO authenticated USING (
        created_by = auth.uid() AND status IN ('pending', 'revisions_requested')
    );

DROP POLICY IF EXISTS "Faculty/Admins can review requests" ON public.project_registration_requests;
CREATE POLICY "Faculty/Admins can review requests" ON public.project_registration_requests
    FOR UPDATE TO authenticated USING (
        faculty_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('Operator', 'Admin')
        )
    );

-- 4. Trigger for Auto-Promotion on Dual Sponsorship
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_dual_sponsorship_promotion ON public.project_registration_requests;
CREATE TRIGGER trigger_check_dual_sponsorship_promotion
BEFORE UPDATE ON public.project_registration_requests
FOR EACH ROW
EXECUTE FUNCTION check_dual_sponsorship_promotion();

-- 5. Trigger for In-App Notifications on Request Operations
CREATE OR REPLACE FUNCTION notify_registration_request_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
    creator_name TEXT;
    mentor_name TEXT;
BEGIN
    -- Get creator name
    SELECT full_name INTO creator_name FROM public.profiles WHERE id = NEW.created_by;
    IF creator_name IS NULL THEN
        creator_name := 'A resident';
    END IF;

    -- CASE 1: New Submission -> Notify Faculty Mentor
    IF TG_OP = 'INSERT' AND NEW.faculty_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, is_read)
        VALUES (
            NEW.faculty_id,
            'sponsorship_request',
            'Sponsorship Request: ' || NEW.title,
            creator_name || ' has requested you to sponsor their new QI Project proposal: "' || NEW.title || '". Click here to review the 14-section protocol.',
            false
        );
    -- CASE 2: Status transition to 'revisions_requested' by Mentor or Chief
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'revisions_requested' AND OLD.status != 'revisions_requested' THEN
        INSERT INTO public.notifications (user_id, type, title, message, is_read)
        VALUES (
            NEW.created_by,
            'revision_requested',
            'Revisions Requested: ' || NEW.title,
            'Your QI project proposal requires revision. Feedback: "' || COALESCE(NEW.reviewer_feedback, 'Please check reviewer comments.') || '"',
            false
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_registration_request_lifecycle ON public.project_registration_requests;
CREATE TRIGGER trigger_notify_registration_request_lifecycle
AFTER INSERT OR UPDATE ON public.project_registration_requests
FOR EACH ROW
EXECUTE FUNCTION notify_registration_request_lifecycle();
