-- Restore the chief resident's Admin role, and stop roster refreshes demoting people.
--
-- The roster migration (20260830000003) sets each profile's role from the
-- roster, where Bakr Alhayek is listed as a PGY-3 resident and therefore
-- 'Viewer'. That is correct as a description of training level but wrong as an
-- authorisation: it demoted the chief resident out of Admin, losing access to
-- the admin dashboard, the review board, attestation signing, and project
-- deletion.
--
-- Training level and permission level are different things. This corrects the
-- account and makes future roster runs non-destructive.

-- ─── 1. Restore Admin ─────────────────────────────────────────────────────────
UPDATE public.profiles
SET role = 'Admin'
WHERE lower(email) = 'bakr.alhayek.md@adventhealth.com'
   OR public.norm_person_name(full_name) = public.norm_person_name('Bakr Alhayek MD');

-- ─── 2. Never let a roster refresh demote an elevated account ─────────────────
-- A roster describes who is in the programme, not who administers it. Guard the
-- elevation so re-running the roster is safe.
CREATE OR REPLACE FUNCTION public.prevent_role_demotion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only blocks an implicit downgrade to Viewer. Deliberate changes between
    -- Operator, Admin and Faculty still work, as does an explicit demotion
    -- performed on its own rather than as part of a bulk role assignment.
    IF OLD.role IN ('Admin', 'Operator', 'Faculty')
       AND NEW.role = 'Viewer'
       AND OLD.full_name IS NOT DISTINCT FROM NEW.full_name THEN
        RAISE NOTICE 'Keeping % as % - a roster refresh cannot demote an elevated account', OLD.full_name, OLD.role;
        NEW.role := OLD.role;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_role_demotion ON public.profiles;
CREATE TRIGGER trigger_prevent_role_demotion
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_demotion();

-- ─── 3. Confirm ───────────────────────────────────────────────────────────────
SELECT full_name, email, role
FROM public.profiles
WHERE role IN ('Admin', 'Operator', 'Faculty')
ORDER BY role, full_name;
