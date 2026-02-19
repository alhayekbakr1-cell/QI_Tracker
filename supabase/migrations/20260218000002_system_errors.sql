-- Create system_errors table for production error monitoring
CREATE TABLE IF NOT EXISTS public.system_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component_name TEXT,
    user_id UUID REFERENCES auth.users(id),
    url TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
-- Allow anyone to insert errors (for public monitoring)
-- But only Admins can view them
CREATE POLICY "Allow anyone to report errors" ON public.system_errors FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow Admins to view errors" ON public.system_errors FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'Admin'
        )
    );
-- Add to Audit Log exclusion if necessary, but errors are useful to keep