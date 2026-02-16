-- Add 'Faculty' to user_role enum if it doesn't exist
-- Note: In Postgres, you can't easily add a value to an enum in a transaction in some environments.
-- We'll use a DO block to check and add.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role'
        AND e.enumlabel = 'Faculty'
) THEN ALTER TYPE user_role
ADD VALUE 'Faculty';
END IF;
END $$;
-- Add faculty-related columns to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS faculty_approved_protocol BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS faculty_approved_pdsa BOOLEAN DEFAULT FALSE;
-- Add RLS policies for faculty if needed (though existing policies might cover it)
-- For now, ensure faculty can view and update their assigned projects
CREATE POLICY "Faculty can update their assigned projects" ON public.projects FOR
UPDATE USING (auth.uid() = faculty_id) WITH CHECK (auth.uid() = faculty_id);