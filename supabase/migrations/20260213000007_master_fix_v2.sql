-- MASTER FIX V2: Ensure Permissions AND Policies match.

-- 1. Grant Table Access (Required to see the table exists)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.directory TO anon, authenticated, service_role;

-- 2. Enable RLS (Good practice, was done before)
ALTER TABLE public.directory ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies (Required to see ROWS if RLS is on)
-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON public.directory;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.directory;

-- Create comprehensive read policy
CREATE POLICY "Allow public read access" ON public.directory
FOR SELECT TO anon, authenticated, service_role
USING (true);

-- 4. Re-run Name Fixes (Just to be absolutely sure)
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
