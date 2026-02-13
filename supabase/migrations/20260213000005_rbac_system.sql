-- 0. Safely create user_role type if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN 
    CREATE TYPE user_role AS ENUM ('Operator', 'Viewer'); 
  END IF; 
END $$;

-- 1. Add role column to directory
ALTER TABLE directory ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'Viewer' NOT NULL;

-- 2. Set Faculty to 'Operator'
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
    'James.Vernace@AdventHealth.com'
);

-- 3. Set Chief (Bakr) to 'Operator'
UPDATE directory 
SET role = 'Operator' 
WHERE email = 'Bakr.Alhayek.MD@AdventHealth.com';

-- 4. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    directory_name TEXT;
    directory_role user_role;
BEGIN
    -- Check if email exists in directory
    SELECT name, role INTO directory_name, directory_role
    FROM public.directory
    WHERE lower(email) = lower(NEW.email);

    -- Insert into profiles (Safely handling if profiles table missing or different)
    -- We assume profiles table exists from standard setup, if not we create it implicitly? 
    -- No, insert will fail if table missing. 
    -- We assume profiles exists from app functionality.
    
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

-- 5. Create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill existing users
-- Ensure we handle potential casting issues if profiles.role is text
INSERT INTO public.profiles (id, full_name, role)
SELECT 
    u.id, 
    COALESCE(d.name, u.raw_user_meta_data->>'full_name', 'Unknown'),
    COALESCE(d.role, 'Viewer')
FROM auth.users u
LEFT JOIN public.directory d ON lower(u.email) = lower(d.email)
ON CONFLICT (id) DO UPDATE
SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
