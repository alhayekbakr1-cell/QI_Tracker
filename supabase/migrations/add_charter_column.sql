-- Migration: Add charter JSONB column to projects table
-- Run this in the Supabase SQL Editor for project: ixthdiezadmpmyczmckf

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS charter jsonb DEFAULT NULL;

COMMENT ON COLUMN projects.charter IS 'IHI-style project charter with 8 sections: problemStatement, aimStatement, teamMembers, scopeIn, scopeOut, timeline, resources, successMeasures';
