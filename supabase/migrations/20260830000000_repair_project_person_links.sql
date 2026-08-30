-- Repair orphaned person references on projects, and add the missing Faculty role.
--
-- Measured against live data before writing this:
--   * 57 of 59 stored id references resolve to NO profile at all (18 of 21
--     projects affected). Something rebuilt profiles and left every reference
--     dangling, which is why the app matches people by fuzzy name everywhere.
--   * 64 of 71 names in proponents[]/lead_proponents[] resolve to exactly ONE
--     profile, with zero ambiguous cases. The remaining 7 are partial entries
--     ("Khan", "M. Ahmad", "Hamood") that cannot be resolved safely and are
--     deliberately left alone.
--
-- This rebuilds the id arrays from the names, which are the trustworthy column.

-- ─── 0. Backup ────────────────────────────────────────────────────────────────
-- Take a copy before touching anything. Drop it once you are satisfied.
CREATE TABLE IF NOT EXISTS public.projects_person_link_backup AS
SELECT id, proponent_ids, lead_proponent_ids, faculty_id, NOW() AS backed_up_at
FROM public.projects;

-- ─── 1. Name normalisation ────────────────────────────────────────────────────
-- Mirrors the client-side matcher: lowercase, drop honorifics and degree
-- suffixes as whole words, strip punctuation, keep tokens of 3+ characters, and
-- sort them so "Ahmad Anees" and "Anees Ahmad MD" normalise identically.
CREATE OR REPLACE FUNCTION public.norm_person_name(raw TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT COALESCE(
        (
            SELECT string_agg(tok, ' ' ORDER BY tok)
            FROM unnest(
                string_to_array(
                    regexp_replace(
                        regexp_replace(lower(COALESCE(raw, '')), '\m(dr\.?|md|do|mbbs|phd)\M', ' ', 'g'),
                        '[^a-z0-9 ]', ' ', 'g'
                    ),
                    ' '
                )
            ) AS t(tok)
            WHERE length(tok) > 2
        ),
        ''
    );
$$;

-- ─── 2. Rebuild the id arrays from names ──────────────────────────────────────
-- Only names resolving to exactly one profile are linked; everything else is
-- skipped rather than guessed at.
WITH resolved AS (
    SELECT norm_person_name(full_name) AS key, MIN(id::text)::uuid AS profile_id
    FROM public.profiles
    WHERE norm_person_name(full_name) <> ''
    GROUP BY norm_person_name(full_name)
    HAVING COUNT(*) = 1
),
rebuilt AS (
    SELECT
        p.id AS project_id,
        (
            SELECT COALESCE(array_agg(DISTINCT r.profile_id), '{}')
            FROM unnest(COALESCE(p.proponents, '{}')) AS n(name)
            JOIN resolved r ON r.key = norm_person_name(n.name)
        ) AS new_proponent_ids,
        (
            SELECT COALESCE(array_agg(DISTINCT r.profile_id), '{}')
            FROM unnest(COALESCE(p.lead_proponents, '{}')) AS n(name)
            JOIN resolved r ON r.key = norm_person_name(n.name)
        ) AS new_lead_ids
    FROM public.projects p
)
UPDATE public.projects p
SET proponent_ids      = rebuilt.new_proponent_ids,
    lead_proponent_ids = rebuilt.new_lead_ids
FROM rebuilt
WHERE rebuilt.project_id = p.id
  -- Never blank out existing links: only write when we actually resolved someone.
  AND (cardinality(rebuilt.new_proponent_ids) > 0 OR cardinality(rebuilt.new_lead_ids) > 0);

-- ─── 3. Link faculty where the mentor exists as a profile ─────────────────────
-- Only 1 of 13 faculty names currently resolves, because faculty are not
-- profiles yet (see section 4). This will link more as faculty are onboarded;
-- re-run it then.
UPDATE public.projects p
SET faculty_id = r.profile_id
FROM (
    SELECT norm_person_name(full_name) AS key, MIN(id::text)::uuid AS profile_id
    FROM public.profiles
    WHERE norm_person_name(full_name) <> ''
    GROUP BY norm_person_name(full_name)
    HAVING COUNT(*) = 1
) r
WHERE p.faculty_id IS NULL
  AND p.faculty IS NOT NULL
  AND r.key = norm_person_name(p.faculty);

-- ─── 4. Add the missing Faculty role ──────────────────────────────────────────
-- The live enum is (Operator, Viewer, Admin) — there is no Faculty value, so no
-- profile can hold that role, yet the application branches on
-- `role === 'Faculty'` in ten places. All of those branches are currently dead,
-- which is why Operators are standing in as mentors.
-- ADD VALUE IF NOT EXISTS is used rather than a DO block: inside a function or
-- DO body Postgres can reject ALTER TYPE ... ADD VALUE with 'cannot be executed
-- inside a transaction block'. The native guard avoids that entirely.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Faculty';

-- ─── 5. Report ────────────────────────────────────────────────────────────────
-- Run this after the migration to confirm the repair.
--
--   SELECT
--     SUM(cardinality(COALESCE(proponent_ids,'{}')) +
--         cardinality(COALESCE(lead_proponent_ids,'{}'))) AS id_refs,
--     COUNT(*) FILTER (WHERE faculty_id IS NOT NULL)      AS faculty_linked
--   FROM public.projects;
--
-- Expect roughly 64 id references (up from 2 resolving) and faculty_linked >= 1.
