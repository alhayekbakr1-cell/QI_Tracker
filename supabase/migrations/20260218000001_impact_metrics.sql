-- Migration: Impact Tracking & Publication Support
-- Date: 2026-02-18
-- 1. Add Impact Columns to Projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS total_patients_impacted INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS estimated_cost_savings NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS abstract_summary TEXT;
-- 2. Update Audit Log Trigger to Track Impact Changes
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
-- Log Impact changes
IF (
    OLD.total_patients_impacted IS DISTINCT
    FROM NEW.total_patients_impacted
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
        'impact',
        OLD.total_patients_impacted::text,
        NEW.total_patients_impacted::text
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;