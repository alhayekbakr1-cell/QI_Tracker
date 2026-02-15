-- Migration: Add Email to Profiles for improved registration logging
-- Date: 2026-02-15
-- 1. Add Email column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;
-- 2. Retroactively sync emails from auth.users (requires security definer or superuser)
-- Note: This might require manual execution or a higher-privilege context
DO $$ BEGIN
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
    AND p.email IS NULL;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Could not retroactively sync emails: %',
SQLERRM;
END $$;
-- 3. Update the handle_new_user function to include email sync
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE directory_name TEXT;
directory_role user_role;
BEGIN -- Lookup in Gatekeeper Directory (Directory table)
SELECT name,
    role INTO directory_name,
    directory_role
FROM public.directory
WHERE lower(email) = lower(NEW.email);
-- Insert/Update Profile with synced email
INSERT INTO public.profiles (id, full_name, role, email)
VALUES (
        NEW.id,
        COALESCE(
            directory_name,
            NEW.raw_user_meta_data->>'full_name',
            'Unknown'
        ),
        COALESCE(directory_role, 'Viewer'),
        NEW.email -- Syncing email here
    ) ON CONFLICT (id) DO
UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;