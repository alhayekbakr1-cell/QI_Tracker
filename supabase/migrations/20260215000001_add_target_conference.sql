-- Migration: Add Target Conference to Projects
-- Date: 2026-02-15
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS target_conference TEXT;
-- Create an index for searching projects by conference
CREATE INDEX IF NOT EXISTS idx_projects_target_conference ON public.projects(target_conference);