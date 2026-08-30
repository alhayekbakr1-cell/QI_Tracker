-- In-app file storage for project documents.
--
-- Today uploads go to OneDrive through Microsoft Graph, and the call is wrapped
-- in a try/catch that logs "Direct OneDrive upload bypassed or blocked". When it
-- fails the row is still written with file_url = NULL, so the generated protocol
-- exists only in whoever's Downloads folder produced it. Nothing is retrievable
-- by the mentor, the programme, or the resident on another machine.
--
-- This adds a private Supabase Storage bucket with access scoped to the people
-- who should actually have it: whoever uploaded the file, the residents on the
-- project, the project's faculty mentor, and programme staff (Operator/Admin).

-- ─── Bucket ───────────────────────────────────────────────────────────────────
-- Private. Downloads go through short-lived signed URLs, never a public path.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-files', 'project-files', false, 26214400)  -- 25 MB
ON CONFLICT (id) DO UPDATE
    SET public = false,
        file_size_limit = 26214400;

-- ─── Who may see a project's files ────────────────────────────────────────────
-- Object paths are "<project_id>/<filename>", so the first path segment
-- identifies the project. SECURITY DEFINER because it reads projects and
-- profiles on behalf of a caller who may not hold rights on both.
CREATE OR REPLACE FUNCTION public.can_access_project_file(object_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    pid UUID;
    uid UUID := auth.uid();
    urole TEXT;
BEGIN
    IF uid IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Programme staff see everything.
    SELECT role::text INTO urole FROM profiles WHERE id = uid;
    IF urole IN ('Operator', 'Admin') THEN
        RETURN TRUE;
    END IF;

    -- First path segment must be a project id.
    BEGIN
        pid := (string_to_array(object_path, '/'))[1]::uuid;
    EXCEPTION WHEN others THEN
        RETURN FALSE;
    END;

    RETURN EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = pid
          AND (
                p.faculty_id = uid
             OR uid = ANY(COALESCE(p.proponent_ids, '{}'))
             OR uid = ANY(COALESCE(p.lead_proponent_ids, '{}'))
          )
    );
END;
$$;

-- ─── Storage policies ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Project members can read project files" ON storage.objects;
CREATE POLICY "Project members can read project files"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'project-files' AND public.can_access_project_file(name));

DROP POLICY IF EXISTS "Project members can upload project files" ON storage.objects;
CREATE POLICY "Project members can upload project files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'project-files' AND public.can_access_project_file(name));

-- Overwriting the same path is how a protocol revision replaces its predecessor.
DROP POLICY IF EXISTS "Project members can update project files" ON storage.objects;
CREATE POLICY "Project members can update project files"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'project-files' AND public.can_access_project_file(name))
    WITH CHECK (bucket_id = 'project-files' AND public.can_access_project_file(name));

-- Deletion is restricted to programme staff on purpose: a resident should not be
-- able to remove an approved protocol from the record.
DROP POLICY IF EXISTS "Staff can delete project files" ON storage.objects;
CREATE POLICY "Staff can delete project files"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'project-files'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role::text IN ('Operator', 'Admin')
        )
    );

-- ─── Track the storage path alongside the existing external URL ───────────────
-- file_url stays for OneDrive links already recorded; storage_path is the
-- in-app copy, which is what download should prefer.
ALTER TABLE public.project_files
    ADD COLUMN IF NOT EXISTS storage_path TEXT;

COMMENT ON COLUMN public.project_files.storage_path IS
    'Path within the project-files bucket, "<project_id>/<filename>". Download via a signed URL; prefer this over file_url.';
