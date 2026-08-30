-- Link the three faculty whose compound surnames stopped the roster matching.
--
-- The roster refresh matches on email, falling back to a normalised name. Three
-- accounts matched on neither:
--
--   profile 'Carlos SantosDeJesus'    vs roster 'Santos De Jesus MD, Carlos'
--   profile 'Lidia SepulvedaRubiera'  vs roster 'Sepulveda Rubiera MD, Lidia'
--   profile 'RajaRamesh Gummalla MD'  vs roster 'Gummalla MD, Raja Ramesh'
--
-- The surnames are stored concatenated in profiles and spaced in the roster, so
-- the token comparison produced different token sets. Their profiles.email was
-- NULL, so the email branch could not save it either. With no match they kept
-- their previous Operator role and received no address.
--
-- Matched explicitly here rather than by loosening the name matcher: a fuzzier
-- comparison risks attaching the wrong person, which is the failure mode that
-- previously assigned uninvolved colleagues as faculty mentors.

UPDATE public.profiles SET
    email = 'carlos.santosdejesus.md@adventhealth.com',
    full_name = 'Santos De Jesus MD, Carlos',
    role = 'Faculty'
WHERE full_name ILIKE '%SantosDeJesus%' OR full_name ILIKE '%Santos De Jesus%';

UPDATE public.profiles SET
    email = 'lidia.sepulvedarubiera.md@adventhealth.com',
    full_name = 'Sepulveda Rubiera MD, Lidia',
    role = 'Faculty'
WHERE full_name ILIKE '%SepulvedaRubiera%' OR full_name ILIKE '%Sepulveda Rubiera%';

UPDATE public.profiles SET
    email = 'rajaramesh.gummalla.md@adventhealth.com',
    full_name = 'Gummalla MD, Raja Ramesh',
    role = 'Faculty'
WHERE full_name ILIKE '%Gummalla%';

-- Keep the directory consistent with the corrected profile names, so the
-- people-picker and these accounts refer to the same person.
UPDATE public.directory SET name = 'Santos De Jesus MD, Carlos'
WHERE email = 'carlos.santosdejesus.md@adventhealth.com';
UPDATE public.directory SET name = 'Sepulveda Rubiera MD, Lidia'
WHERE email = 'lidia.sepulvedarubiera.md@adventhealth.com';
UPDATE public.directory SET name = 'Gummalla MD, Raja Ramesh'
WHERE email = 'rajaramesh.gummalla.md@adventhealth.com';

-- ─── Confirm ──────────────────────────────────────────────────────────────────
-- Everyone holding an elevated role, and whether they can be emailed.
SELECT
    full_name,
    email,
    role,
    CASE WHEN email IS NULL THEN 'NO EMAIL - cannot be notified' ELSE 'ok' END AS notify
FROM public.profiles
WHERE role IN ('Admin', 'Operator', 'Faculty')
ORDER BY role, full_name;
