-- COMPLETE REBUILD SCRIPT
-- This script safely creates the directory table, populates it, and sets up permissions.

-- 1. Create the Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS directory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Populate Data (Upsert to prevent duplicates)
INSERT INTO directory (name, email) VALUES
-- PGY3
('Mahmoud Abdalla MD', 'mahmoud.abdalla.md@adventhealth.com'),
('Anees Ahmad MD', 'anees.ahmad@adventhealth.com'),
('Mahnoor Anjum MD', 'mahnoor.anjum.md@adventhealth.com'),
('Tiagpaul Bhamber MD', 'tiagpaul.bhamber.md@adventhealth.com'),
('AbdulMueezAlam Kayani MD', 'abdulmueezalam.kayani.md@adventhealth.com'),
('Nasar Khan MD', 'nasar.khan.md@adventhealth.com'),
('RohitKumar Maheshwari MD', 'rohitkumar.maheshwari.md@adventhealth.com'),
('JoelianAndrew Mislay MD', 'joelianandrew.mislay.md@adventhealth.com'),
('Fnu Naina MD', 'fnu.naina.md@adventhealth.com'),
('MuhammadAffan Rashid MD', 'muhammadaffan.rashid.md@adventhealth.com'),
('Vipul Reddy MD', 'vipul.reddy.md@adventhealth.com'),
('Orlando Telleria DO', 'orlando.telleria.do@adventhealth.com'),
('Haniya Waseem MD', 'haniya.waseem.md@adventhealth.com'),
-- PGY2
('Ali Mashadi MD', 'Ali.Mashadi.MD@AdventHealth.com'),
('Ariba Khan MD', 'Ariba.Khan.MD@AdventHealth.com'),
('Bakr Alhayek MD', 'Bakr.Alhayek.MD@AdventHealth.com'),
('Ben Baang MD', 'Ben.Baang.MD@AdventHealth.com'),
('Bilal Khan MD', 'Bilal.Khan.MD@AdventHealth.com'),
('Hamood Chaudhry MD', 'Hamood.Chaudhry.MD@AdventHealth.com'),
('Iktimal Alwan MD', 'Iktimal.Alwan.MD@AdventHealth.com'),
('Jahid Wahabzai MD', 'Jahid.Wahabzai.MD@AdventHealth.com'),
('Muhammad Ahmad MD', 'Muhammad.Ahmad.MD@AdventHealth.com'),
('Muhammad Umair MD', 'Muhammad.Umair.MD@AdventHealth.com'),
('Muhammad Umar MD', 'Muhammad.Umar@AdventHealth.com'),
('Sahil Raj MD', 'Sahil.Raj.MD@AdventHealth.com'),
('Xiaowei Malone DO', 'Xiaowei.Malone.DO@AdventHealth.com'),
-- Faculty
('Anna Hadid MD', 'Anna.Hadid.MD@AdventHealth.com'),
('Asha Ramsakal DO', 'Asha.Ramsakal.DO@AdventHealth.com'),
('Claudia Kroker-Bode MD', 'CLAUDIA.KROKERBODE.MD@AdventHealth.com'),
('Muhammad Anwar MD', 'Muhammad.Anwar.MD@AdventHealth.com'),
('Sara Bibi MD', 'Sara.Bibi.MD@AdventHealth.com'),
('Carlos SantosDeJesus MD', 'Carlos.SantosDeJesus.MD@AdventHealth.com'),
('Lidia SepulvedaRubiera MD', 'Lidia.SepulvedaRubiera.MD@AdventHealth.com'),
('Ryan Brink DO', 'Ryan.Brink.DO@AdventHealth.com'),
('RajaRamesh Gummalla MD', 'RajaRamesh.Gummalla.MD@AdventHealth.com'),
('Christopher Yanichko DO', 'Christopher.Yanichko.DO@AdventHealth.com'),
('Faheem Ahmad MD', 'Faheem.Ahmad.MD@AdventHealth.com'),
('Mounica Banala MD', 'Mounica.Banala.MD@AdventHealth.com'),
('James Vernace', 'James.Vernace@AdventHealth.com')
ON CONFLICT (name) DO UPDATE SET email = EXCLUDED.email;

-- 3. Setup RBAC (Safely)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN 
    CREATE TYPE user_role AS ENUM ('Operator', 'Viewer'); 
  END IF; 
END $$;

ALTER TABLE directory ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'Viewer' NOT NULL;

-- 4. Assign Operator Roles
UPDATE directory 
SET role = 'Operator' 
WHERE email IN (
    'Anna.Hadid.MD@AdventHealth.com',
    'Asha.Ramsakal.DO@AdventHealth.com',
    'CLAUDIA.KROKERBODE.MD@AdventHealth.com',
    'Muhammad.Anwar.MD@AdventHealth.com',
    'Sara.Bibi.MD@AdventHealth.com',
    'Carlos.SantosDeJesus.MD@AdventHealth.com',
    'Lidia.SepulvedaRubiera.MD@AdventHealth.com',
    'Ryan.Brink.DO@AdventHealth.com',
    'RajaRamesh.Gummalla.MD@AdventHealth.com',
    'Christopher.Yanichko.DO@AdventHealth.com',
    'Faheem.Ahmad.MD@AdventHealth.com',
    'Mounica.Banala.MD@AdventHealth.com',
    'James.Vernace@AdventHealth.com',
    'Bakr.Alhayek.MD@AdventHealth.com'
);

-- 5. Master Fix for Permissions & RLS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.directory TO anon, authenticated, service_role;

ALTER TABLE public.directory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.directory;
CREATE POLICY "Allow public read access" ON public.directory
FOR SELECT TO anon, authenticated, service_role
USING (true);

-- 6. Trigger Setup (Idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    directory_name TEXT;
    directory_role user_role;
BEGIN
    SELECT name, role INTO directory_name, directory_role
    FROM public.directory
    WHERE lower(email) = lower(NEW.email);

    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(directory_name, NEW.raw_user_meta_data->>'full_name', 'Unknown'),
        COALESCE(directory_role, 'Viewer')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
