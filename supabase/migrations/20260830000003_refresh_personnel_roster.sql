-- Refresh the personnel directory: 2026 faculty and resident roster.
--
-- Generated from the roster supplied by the chief resident. Emails are the
-- stable key; names in this programme are entered inconsistently ("Ahmad Anees"
-- vs "Anees Ahmad MD"), so matching on them is unreliable.
--
-- IMPORTANT - what this does NOT do:
--
-- profiles.id REFERENCES auth.users(id), so a profile cannot exist for someone
-- who has never signed in. This therefore does not create accounts. It refreshes
-- the directory, which is what the protocol wizard's people-picker reads and
-- what mentor notification falls back to, and it corrects the email and role on
-- profiles that already exist.
--
-- It also does NOT delete profiles. Deleting a profile cascades from
-- auth.users and would orphan every projects.proponent_ids reference pointing
-- at it - which is exactly the breakage repaired in
-- 20260830000000_repair_project_person_links (57 of 59 references were dangling).
-- Departed residents are better deactivated than deleted, so their completed
-- work keeps its authorship.

-- ─── 0. Backup the current directory ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.directory_backup_20260830 AS
SELECT *, NOW() AS backed_up_at FROM public.directory;

-- ─── 1. Columns the roster needs ──────────────────────────────────────────────
ALTER TABLE public.directory ADD COLUMN IF NOT EXISTS pgy_level TEXT;
ALTER TABLE public.directory ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── 2. The roster ────────────────────────────────────────────────────────────
CREATE TEMP TABLE roster_2026 (name TEXT, email TEXT, role TEXT, pgy_level TEXT) ON COMMIT DROP;

INSERT INTO roster_2026 (name, email, role, pgy_level) VALUES
-- Faculty (14)
    ('Sepulveda Rubiera MD, Lidia', 'lidia.sepulvedarubiera.md@adventhealth.com', 'Faculty', NULL),
    ('Ahmad MD, Faheem', 'faheem.ahmad.md@adventhealth.com', 'Faculty', NULL),
    ('Banala MD, Mounica', 'mounica.banala.md@adventhealth.com', 'Faculty', NULL),
    ('Brink DO, Ryan', 'ryan.brink.do@adventhealth.com', 'Faculty', NULL),
    ('Gummalla MD, Raja Ramesh', 'rajaramesh.gummalla.md@adventhealth.com', 'Faculty', NULL),
    ('Santos De Jesus MD, Carlos', 'carlos.santosdejesus.md@adventhealth.com', 'Faculty', NULL),
    ('Vernace, James', 'james.vernace@adventhealth.com', 'Faculty', NULL),
    ('Yanichko DO, Christopher', 'christopher.yanichko.do@adventhealth.com', 'Faculty', NULL),
    ('Hadid MD, Anna', 'anna.hadid.md@adventhealth.com', 'Faculty', NULL),
    ('Abdalla MD, Mahmoud', 'mahmoud.abdalla.md@adventhealth.com', 'Faculty', NULL),
    ('Bibi MD, Sara', 'sara.bibi.md@adventhealth.com', 'Faculty', NULL),
    ('Jones Ince, Ingrid', 'ingrid.jonesince.md@adventhealth.com', 'Faculty', NULL),
    ('Kroker-Bode MD, Claudia', 'claudia.krokerbode.md@adventhealth.com', 'Faculty', NULL),
    ('Ramsakal DO, Asha', 'asha.ramsakal.do@adventhealth.com', 'Faculty', NULL),
-- Residents (46)
    ('Oleksandr Adzhymuratov, MD', 'oleksandr.adzhymuratov.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Jaden Alexander, DO', 'jaden.alexander.do@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Maria Alsarayreh, MD', 'maria.alsarayreh.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Aisuluu Alybaeva, MD', 'aisuluu.alybaeva.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Odaly Balasquide, MD', 'odaly.balasquide.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Neha Bhandari, DO', 'neha.bhandari.do@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Raychel Chubbs, MD', 'raychel.pannell.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Justin Elchak, DO', 'justin.elchak.do@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Gabriel Faget, MD', 'gabriel.faget.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Madhumitha Gautham, MD', 'madhumitha.gautham.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Ariana Greenwood, DO', 'ariana.greenwood1@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Nadzeya Grinevich, MD', 'nadzeya.grinevich.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Claudia Guerrero Diaz, DO', 'claudia.guerrerodiaz@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Daniela Gutierrez, DO', 'daniela.gutierrez.do@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Jaida Chacko Madathilethu, MD', 'jaidachacko.madathilethu@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Thais Morales Torres, MD', 'thais.moralestorres.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Benjamin Nguyen, MD', 'ben.nguyen.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Catherine Ortner, DO', 'catherine.ortner.do@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Anuksha Varghese, MD', 'anuksha.varghese.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Ryan Wu, MD', 'ryan.wu.md@adventhealth.com', 'Viewer', 'PGY-1'),
    ('Rebekah Alison, DO', 'rebekah.alison.do@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Diya Asad, MD', 'diya.asad.md@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Yaseen Dhemesh, MD', 'yaseen.dhemesh.md@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Lidetu Kayamo, MD', 'lidetu.kayamo.md@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Aqsa Khan, MD', 'aqsa.khan.md@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Rizwan Khawaja, DO', 'rizwan.khawaja.do@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Naga Maneesh Komireddy, MD', 'nagamaneesh.komireddy.md@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Ramish Rafay, MD', 'ramish.rafay.md@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Aqsa Saleem, MD', 'aqsa.saleem.md@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Joao Victor Souza Peres, DO', 'joaovictor.souzaperes.do@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Reynaldo Reynoso Figueroa, MD', 'reynaldo.reynosofigueroa.md@adventhealth.com', 'Viewer', 'PGY-2'),
    ('John Haffey, DO', 'john.haffey.do@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Amro Idilbi, MD', 'amro.idilbi.md@adventhealth.com', 'Viewer', 'PGY-2'),
    ('Muhammad Ahmad, MD', 'muhammad.ahmad.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Bakr Alhayek, MD', 'bakr.alhayek.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Iktimal Alwan, MD', 'iktimal.alwan.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Ben Baang, MD', 'ben.baang.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Ariba Khan, MD', 'ariba.khan.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Hamood Chaudhry, MD', 'hamood.chaudhry.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Bilal Khan, MD', 'bilal.khan.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Xiaowei Malone, DO', 'xiaowei.malone.do@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Ali Mashadi, MD', 'ali.mashadi.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Sahil Raj, MD', 'sahil.raj.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Muhammad Umair, MD', 'muhammad.umair.md@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Faiq Umar, MD', 'muhammad.umar@adventhealth.com', 'Viewer', 'PGY-3'),
    ('Jahid Wahabzai, MD', 'jahid.wahabzai.md@adventhealth.com', 'Viewer', 'PGY-3');

-- ─── 3. Upsert on email ───────────────────────────────────────────────────────
-- Email is the key. A name change (marriage, corrected spelling) updates the
-- existing row rather than creating a second entry for the same person.
INSERT INTO public.directory (name, email, role, pgy_level, is_active)
SELECT r.name, r.email, r.role::user_role, r.pgy_level, TRUE
FROM roster_2026 r
ON CONFLICT (email) DO UPDATE
    SET name      = EXCLUDED.name,
        role      = EXCLUDED.role,
        pgy_level = EXCLUDED.pgy_level,
        is_active = TRUE;

-- Same person re-added under a new email would collide on the unique name.
UPDATE public.directory d
SET email = r.email,
    role = r.role::user_role,
    pgy_level = r.pgy_level,
    is_active = TRUE
FROM roster_2026 r
WHERE d.name = r.name AND d.email <> r.email;

-- ─── 4. Retire everyone not on the roster ─────────────────────────────────────
-- Deactivated, not deleted: directory rows are referenced by name from historic
-- projects, and removing them would make old authorship unresolvable.
UPDATE public.directory
SET is_active = FALSE
WHERE email NOT IN (SELECT email FROM roster_2026);

-- ─── 5. Correct existing accounts ─────────────────────────────────────────────
-- Only touches profiles that already exist. Faculty who have never signed in
-- have no auth user and therefore no profile; they are reachable through the
-- directory until they first log in.
UPDATE public.profiles p
SET email = r.email,
    full_name = COALESCE(NULLIF(p.full_name, ''), r.name),
    role = r.role::user_role
FROM roster_2026 r
WHERE lower(p.email) = r.email
   OR public.norm_person_name(p.full_name) = public.norm_person_name(r.name);

-- ─── 6. Report ────────────────────────────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM public.directory WHERE is_active) AS active_directory,
    (SELECT COUNT(*) FROM public.directory WHERE is_active AND role = 'Faculty') AS active_faculty,
    (SELECT COUNT(*) FROM public.directory WHERE NOT is_active) AS retired,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'Faculty') AS faculty_accounts,
    (SELECT COUNT(*) FROM public.profiles WHERE email IS NOT NULL) AS profiles_with_email;
