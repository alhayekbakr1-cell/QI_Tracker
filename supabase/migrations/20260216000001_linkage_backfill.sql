-- Migration: Backfill project linkage for existing registered users
-- Links Profile UUIDs to Projects based on name matching
DO $$
DECLARE p RECORD;
BEGIN FOR p IN
SELECT id,
    full_name
FROM profiles
WHERE full_name IS NOT NULL LOOP -- Link for Lead Proponents
UPDATE projects
SET lead_proponent_ids = array_append(COALESCE(lead_proponent_ids, '{}'), p.id)
WHERE p.full_name = ANY(lead_proponents)
    AND NOT (p.id = ANY(COALESCE(lead_proponent_ids, '{}')));
-- Link for Proponents
UPDATE projects
SET proponent_ids = array_append(COALESCE(proponent_ids, '{}'), p.id)
WHERE p.full_name = ANY(proponents)
    AND NOT (p.id = ANY(COALESCE(proponent_ids, '{}')));
-- Link for Faculty (if applicable)
-- We only update if faculty_id is null to avoid overwriting manual corrections
UPDATE projects
SET faculty_id = p.id
WHERE (
        p.full_name = faculty
        OR faculty ILIKE '%' || p.full_name || '%'
    )
    AND faculty_id IS NULL;
END FOR;
END $$;