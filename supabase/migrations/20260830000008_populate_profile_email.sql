-- Store the email on the profile at sign-up, and backfill existing accounts.
--
-- handle_new_user() copies name and role from the directory but never wrote
-- profiles.email, so most accounts carried NULL there. That is why the admin
-- user list showed rows with a name and no address, and it is why the roster
-- refresh had to fall back to fragile name matching for anyone whose email was
-- missing - which is exactly how three faculty ended up stranded as Operators.
--
-- Mentor notification already falls back to the directory, so this is not
-- fixing a broken feature; it removes the ambiguity that keeps causing
-- matching to fail.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    directory_name TEXT;
    directory_role user_role;
BEGIN
    SELECT name, role INTO directory_name, directory_role
    FROM public.directory
    WHERE lower(email) = lower(NEW.email);

    INSERT INTO public.profiles (id, full_name, role, email)
    VALUES (
        NEW.id,
        COALESCE(directory_name, NEW.raw_user_meta_data->>'full_name', 'Unknown'),
        COALESCE(directory_role, 'Viewer'),
        lower(NEW.email)
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role      = EXCLUDED.role,
        -- Keep an address already on file rather than overwriting it.
        email     = COALESCE(public.profiles.email, EXCLUDED.email);

    RETURN NEW;
END;
$$;

-- Backfill from auth.users, which holds the address every account signed in with.
UPDATE public.profiles p
SET email = lower(u.email)
FROM auth.users u
WHERE u.id = p.id
  AND p.email IS NULL
  AND u.email IS NOT NULL;

-- ─── Confirm ──────────────────────────────────────────────────────────────────
SELECT
    COUNT(*) AS profiles,
    COUNT(*) FILTER (WHERE email IS NULL) AS still_without_email,
    COUNT(*) FILTER (WHERE role = 'Faculty') AS faculty_accounts
FROM public.profiles;
