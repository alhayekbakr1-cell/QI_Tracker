-- Stop the registry being readable by anyone on the internet.
--
-- The anon key is public by design — it ships inside the JavaScript bundle of a
-- statically exported site. Several SELECT policies were written as
-- `USING (true)` with no role restriction, which grants the `public` role and
-- therefore `anon`. Verified against production: an unauthenticated request
-- carrying only the anon key returned full project titles, faculty names, and
-- the entire resident roster.
--
-- No PHI is involved, but resident names tied to clinical project topics are
-- institutional data and should not be world-readable or search-indexable.
--
-- Signed-in users are unaffected: every page in the app already requires a
-- session, and the policies keep the same permissive USING clause. Only the
-- role they are granted to changes.
--
-- Written defensively. An earlier version named public.resources, which does
-- not exist in this database, and the whole migration aborted on that one line.
-- This version discovers what is actually there and skips the rest.

DO $$
DECLARE
    t TEXT;
    pol RECORD;
    -- Every table that should be readable only by signed-in users.
    -- Missing tables are skipped rather than raising.
    targets TEXT[] := ARRAY[
        'profiles',
        'projects',
        'project_registration_requests',
        'metrics',
        'comments',
        'audit_log',
        'audit_logs',
        'directory',
        'resources',
        'conferences_registry',
        'tasks',
        'project_files'
    ];
BEGIN
    FOREACH t IN ARRAY targets LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
        ) THEN
            RAISE NOTICE 'skipping %, table not present', t;
            CONTINUE;
        END IF;

        -- Drop any SELECT policy that is currently granted to anon or public.
        -- Policy names differ across this project's history, so match on what
        -- the policy DOES rather than on its name.
        FOR pol IN
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = t
              AND cmd = 'SELECT'
              AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
        LOOP
            EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
            RAISE NOTICE 'dropped anon-readable policy % on %', pol.policyname, t;
        END LOOP;

        -- Recreate a signed-in-only equivalent, unless one already exists.
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public' AND tablename = t AND cmd = 'SELECT'
              AND 'authenticated' = ANY(roles)
        ) THEN
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
                'Authenticated users can view ' || t, t
            );
            RAISE NOTICE 'created authenticated-only SELECT policy on %', t;
        END IF;
    END LOOP;
END
$$;

-- ─── Verify ───────────────────────────────────────────────────────────────────
-- This should return NO rows. Anything listed is still readable anonymously.
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
ORDER BY tablename;

-- TO REVERT a single table, for example projects:
--   DROP POLICY "Authenticated users can view projects" ON public.projects;
--   CREATE POLICY "Anyone can view projects" ON public.projects
--       FOR SELECT USING (true);
