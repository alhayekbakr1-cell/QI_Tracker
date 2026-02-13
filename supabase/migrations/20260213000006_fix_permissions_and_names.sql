-- 1. FIX PERMISSIONS (Solves the 404 Error)
-- Grant usage on schema to be safe
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant access to the directory table
GRANT SELECT ON TABLE public.directory TO authenticated;
GRANT SELECT ON TABLE public.directory TO service_role;
-- If you want public (non-logged in) users to nudge, uncomment below:
-- GRANT SELECT ON TABLE public.directory TO anon; 

-- 2. FIX PGY3 NAMES (Solves the "Nudge not doing anything" for residents)
-- This aligns the directory names with the Project Tracker format "Firstname Lastname"
UPDATE directory SET name = 'Mahmoud Abdalla MD' WHERE email = 'mahmoud.abdalla.md@adventhealth.com';
UPDATE directory SET name = 'Anees Ahmad MD' WHERE email = 'anees.ahmad@adventhealth.com';
UPDATE directory SET name = 'Mahnoor Anjum MD' WHERE email = 'mahnoor.anjum.md@adventhealth.com';
UPDATE directory SET name = 'Tiagpaul Bhamber MD' WHERE email = 'tiagpaul.bhamber.md@adventhealth.com';
UPDATE directory SET name = 'AbdulMueezAlam Kayani MD' WHERE email = 'abdulmueezalam.kayani.md@adventhealth.com';
UPDATE directory SET name = 'Nasar Khan MD' WHERE email = 'nasar.khan.md@adventhealth.com';
UPDATE directory SET name = 'RohitKumar Maheshwari MD' WHERE email = 'rohitkumar.maheshwari.md@adventhealth.com';
UPDATE directory SET name = 'JoelianAndrew Mislay MD' WHERE email = 'joelianandrew.mislay.md@adventhealth.com';
UPDATE directory SET name = 'Fnu Naina MD' WHERE email = 'fnu.naina.md@adventhealth.com';
UPDATE directory SET name = 'MuhammadAffan Rashid MD' WHERE email = 'muhammadaffan.rashid.md@adventhealth.com';
UPDATE directory SET name = 'Vipul Reddy MD' WHERE email = 'vipul.reddy.md@adventhealth.com';
UPDATE directory SET name = 'Orlando Telleria DO' WHERE email = 'orlando.telleria.do@adventhealth.com';
UPDATE directory SET name = 'Haniya Waseem MD' WHERE email = 'haniya.waseem.md@adventhealth.com';

-- 3. VERIFY PGY2/PGY1/Faculty Consistency (Just in case)
-- (No updates needed if they were inserted correctly, but good to ensure RLS is on)
ALTER TABLE directory ENABLE ROW LEVEL SECURITY;
