-- Migration: Database Improvements (Constraints & Realtime)
-- Date: 2026-07-25

-- 1. ADD DATA INTEGRITY CONSTRAINTS
-- Ensure patients impacted cannot be negative
ALTER TABLE public.projects 
ADD CONSTRAINT check_total_patients_impacted_positive 
CHECK (total_patients_impacted >= 0);

-- Ensure cost savings cannot be negative
ALTER TABLE public.projects 
ADD CONSTRAINT check_cost_savings_positive 
CHECK (estimated_cost_savings >= 0);

-- Ensure project title is at least 5 characters long
ALTER TABLE public.projects 
ADD CONSTRAINT check_title_length 
CHECK (char_length(title) >= 5);

-- 2. ENABLE REAL-TIME SUBSCRIPTIONS
-- Supabase uses publications for real-time. We add our core tables to `supabase_realtime`.
-- First check if the publication exists, create it if not (Supabase creates this by default, but safe to check)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
