-- Structured review feedback + durable faculty attestations.
--
-- Two gaps this closes:
--
-- 1. comments had no notion of WHICH part of a protocol a remark referred to,
--    so mentor feedback arrived as an undifferentiated thread and a resident had
--    to guess whether "this needs a baseline" meant the aim or the metrics.
--
-- 2. Faculty sign-off was two booleans on projects (faculty_approved_protocol,
--    faculty_approved_pdsa). A boolean cannot answer "who signed this, when, and
--    is it still valid" — which is exactly what a GME board packet must show.
--    Flipping the flag back off erased the fact it was ever signed.

-- ─── 1. Section-scoped review feedback ────────────────────────────────────────

ALTER TABLE public.comments
    ADD COLUMN IF NOT EXISTS section TEXT;

COMMENT ON COLUMN public.comments.section IS
    'Which part of the project this remark is about (e.g. smart_aim, metrics, pdsa, protocol). NULL = general thread comment.';

CREATE INDEX IF NOT EXISTS idx_comments_project_section
    ON public.comments (project_id, section);

-- ─── 2. Attestation records ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    faculty_name TEXT NOT NULL,
    milestone TEXT NOT NULL CHECK (milestone IN ('protocol', 'pdsa', 'presentation')),
    statement TEXT,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Withdrawal is recorded, never deleted: a board packet needs the history,
    -- and a signature that can silently vanish is not evidence of anything.
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_attestations_project ON public.attestations (project_id);
CREATE INDEX IF NOT EXISTS idx_attestations_faculty ON public.attestations (faculty_id);

-- Only one active attestation per project per milestone. Partial unique index so
-- revoked rows stay on the record and a milestone can be re-signed after one is
-- withdrawn.
CREATE UNIQUE INDEX IF NOT EXISTS idx_attestations_active_unique
    ON public.attestations (project_id, milestone)
    WHERE revoked_at IS NULL;

ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;

-- Readable by any authenticated user: residents must be able to show their own
-- signed milestones, and the GME office reviews across the cohort.
DROP POLICY IF EXISTS "Authenticated users can read attestations" ON public.attestations;
CREATE POLICY "Authenticated users can read attestations"
    ON public.attestations FOR SELECT TO authenticated
    USING (true);

-- You may only sign as yourself. Without this check any authenticated user could
-- forge an attestation in a faculty member's name.
DROP POLICY IF EXISTS "Faculty can sign as themselves" ON public.attestations;
CREATE POLICY "Faculty can sign as themselves"
    ON public.attestations FOR INSERT TO authenticated
    WITH CHECK (faculty_id = auth.uid());

-- Withdrawal is limited to the signer. Deliberately no DELETE policy: signatures
-- are revoked, not erased.
DROP POLICY IF EXISTS "Signers can revoke their own attestation" ON public.attestations;
CREATE POLICY "Signers can revoke their own attestation"
    ON public.attestations FOR UPDATE TO authenticated
    USING (faculty_id = auth.uid())
    WITH CHECK (faculty_id = auth.uid());
