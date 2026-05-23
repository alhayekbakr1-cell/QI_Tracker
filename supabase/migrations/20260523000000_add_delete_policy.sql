-- Migration: Add Deletion Policy on Project Registration Requests
-- Date: 2026-05-23

-- Enable DELETE RLS Policy on project requests so creators can delete their proposals
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.project_registration_requests;
CREATE POLICY "Users can delete their own requests" ON public.project_registration_requests
    FOR DELETE TO authenticated USING (created_by = auth.uid());
