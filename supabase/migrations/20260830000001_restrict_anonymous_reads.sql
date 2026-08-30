-- Stop the registry being readable by anyone on the internet.
--
-- The anon key is public by design — it ships inside the JavaScript bundle of a
-- statically exported site. Every SELECT policy below was written as
-- `USING (true)` with no role restriction, which grants the `public` role and
-- therefore `anon`. Verified against production before writing this: an
-- unauthenticated request carrying only the anon key returns full project
-- titles, faculty names, and the entire resident roster.
--
-- No PHI is involved, but resident names tied to clinical project topics are
-- institutional data and should not be world-readable or search-indexable.
--
-- The fix is narrow: keep the same permissive USING clause, but scope each
-- policy to the `authenticated` role. Signed-in users are unaffected; every
-- page in the app already requires a session. Only anonymous access changes.
--
-- TO REVERT: re-run each block with `TO anon, authenticated` instead.
--
-- NOTE: the local dev auth bypass fakes a session without a real JWT, so after
-- this it will render empty tables. That is correct behaviour, not a fault.

-- ─── profiles ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles FOR SELECT TO authenticated USING (true);

-- ─── projects ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
CREATE POLICY "Authenticated users can view projects"
    ON public.projects FOR SELECT TO authenticated USING (true);

-- ─── metrics ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view metrics" ON public.metrics;
CREATE POLICY "Authenticated users can view metrics"
    ON public.metrics FOR SELECT TO authenticated USING (true);

-- ─── comments ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Authenticated users can view comments"
    ON public.comments FOR SELECT TO authenticated USING (true);

-- ─── resources ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
CREATE POLICY "Authenticated users can view resources"
    ON public.resources FOR SELECT TO authenticated USING (true);

-- ─── audit_log ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view audit log" ON public.audit_log;
CREATE POLICY "Authenticated users can view audit log"
    ON public.audit_log FOR SELECT TO authenticated USING (true);

-- ─── directory ────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'directory') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.directory';
        EXECUTE 'CREATE POLICY "Authenticated users can view directory" ON public.directory FOR SELECT TO authenticated USING (true)';
    END IF;
END
$$;

-- ─── Verify ───────────────────────────────────────────────────────────────────
-- After running, this should return NO rows. Any row listed is still readable
-- by anonymous callers:
--
--   SELECT tablename, policyname, roles
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND cmd = 'SELECT'
--     AND ('anon' = ANY(roles) OR 'public' = ANY(roles));
--
-- And from a shell, this should come back as an empty array [] rather than data:
--
--   curl "$SUPABASE_URL/rest/v1/projects?select=title&limit=1" -H "apikey: $ANON_KEY"
