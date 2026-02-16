-- Add 'Admin' and 'Faculty' to user_role enum
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'Admin'
) THEN ALTER TYPE user_role
ADD VALUE 'Admin';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'Faculty'
) THEN ALTER TYPE user_role
ADD VALUE 'Faculty';
END IF;
END $$;
-- Update directory roles
-- 1. Elevate Bakr Alhayek to Admin
UPDATE directory
SET role = 'Admin'
WHERE email = 'Bakr.Alhayek.MD@AdventHealth.com';
-- 2. Update Faculty roles
UPDATE directory
SET role = 'Faculty'
WHERE email IN (
        'Muhammad.Anwar.MD@AdventHealth.com',
        'Christopher.Yanichko.DO@AdventHealth.com',
        'Mounica.Banala.MD@AdventHealth.com',
        'Carlos.SantosDeJesus.MD@AdventHealth.com',
        'CLAUDIA.KROKERBODE.MD@AdventHealth.com',
        'Ryan.Brink.DO@AdventHealth.com',
        'RajaRamesh.Gummalla.MD@AdventHealth.com',
        'Asha.Ramsakal.DO@AdventHealth.com',
        'Faheem.Ahmad.MD@AdventHealth.com',
        'Lidia.SepulvedaRubiera.MD@AdventHealth.com',
        'Sara.Bibi.MD@AdventHealth.com',
        'James.Vernace@AdventHealth.com',
        'Anna.Hadid.MD@AdventHealth.com'
    );
-- Ensure profiles are synced (Trigger on_auth_user_created handles this for new users, 
-- but we should backfill for existing ones)
UPDATE profiles p
SET role = d.role,
    full_name = d.name
FROM directory d
WHERE lower(p.email) = lower(d.email);
-- Linkage Repair: Add ID-based proponents to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS lead_proponent_ids UUID [] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS proponent_ids UUID [] DEFAULT '{}';
-- Fix existing RLS policies to allow Admins to do everything
-- (Admins already have full access if we check for role = 'Admin' in policies)
-- Update existing policies to include Admin
DROP POLICY IF EXISTS "Operators can insert projects" ON projects;
CREATE POLICY "Operators/Admins can insert projects" ON projects FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('Operator', 'Admin')
        )
    );
DROP POLICY IF EXISTS "Operators can update projects" ON projects;
CREATE POLICY "Operators/Admins can update projects" ON projects FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('Operator', 'Admin', 'Faculty')
        )
    );
DROP POLICY IF EXISTS "Operators can delete projects" ON projects;
CREATE POLICY "Operators/Admins can delete projects" ON projects FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('Operator', 'Admin')
    )
);