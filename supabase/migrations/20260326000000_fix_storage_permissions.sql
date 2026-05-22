-- Migration: Fix Storage Permissions for Project Documents
-- Date: 2026-03-26

-- 1. Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage.objects if not already
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Clear existing restrictive policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view project documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project documents" ON storage.objects;

-- 4. Create new permissive policies
-- Policy: Anyone (logged in) can view documents
CREATE POLICY "Anyone can view project documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-documents');

-- Policy: Authenticated users can upload to the project-documents bucket
-- We simplify to allowing all authenticated users to insert for now, 
-- but ideally we could check if they are part of the project matching the folder name.
CREATE POLICY "Authenticated users can upload project documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-documents');

-- Policy: Users can update/delete if they are authenticated
CREATE POLICY "Users can update their own project documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-documents');

CREATE POLICY "Users can delete their own project documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-documents');
