-- Create Conference Registry Table
CREATE TABLE IF NOT EXISTS public.conferences_registry (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    deadline_month INT NOT NULL,
    -- 0-indexed
    deadline_day INT NOT NULL,
    website TEXT NOT NULL,
    last_ai_check TIMESTAMPTZ,
    ai_confidence TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.conferences_registry ENABLE ROW LEVEL SECURITY;
-- Allow read access for everyone (signed in users)
CREATE POLICY "Allow read for all authenticated users" ON public.conferences_registry FOR
SELECT USING (auth.role() = 'authenticated');
-- Allow Admin to update
CREATE POLICY "Allow admin to update" ON public.conferences_registry FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'Admin'
        )
    );
-- Seed Initial Data
INSERT INTO public.conferences_registry (
        id,
        name,
        full_name,
        deadline_month,
        deadline_day,
        website
    )
VALUES (
        'SHM',
        'SHM Converge',
        'Society of Hospital Medicine',
        10,
        24,
        'https://shmabstracts.org/'
    ),
    (
        'ACP',
        'ACP IM',
        'American College of Physicians Internal Medicine Meeting',
        10,
        21,
        'https://www.acponline.org/membership/medical-students/abstract-competitions'
    ),
    (
        'SGIM',
        'SGIM Annual',
        'Society of General Internal Medicine',
        11,
        12,
        'https://www.sgim.org/meetings/annual-meeting'
    ),
    (
        'ATS',
        'ATS Intl',
        'American Thoracic Society International Conference',
        10,
        5,
        'https://conference.thoracic.org/program/abstracts/'
    ),
    (
        'CHEST',
        'CHEST Annual',
        'American College of Chest Physicians',
        1,
        26,
        'https://www.chestnet.org/learning/events/chest-annual-meeting'
    ),
    (
        'ACC',
        'ACC Session',
        'American College of Cardiology Scientific Session',
        8,
        30,
        'https://accscientificsession.acc.org/'
    ),
    (
        'AHA',
        'AHA Sessions',
        'American Heart Association Scientific Sessions',
        5,
        1,
        'https://scientificsessions.heart.org/'
    ),
    (
        'DDW',
        'DDW Week',
        'Digestive Disease Week',
        11,
        4,
        'https://ddw.org/abstracts/'
    ),
    (
        'ACG',
        'ACG Scientific',
        'American College of Gastroenterology',
        5,
        1,
        'https://gi.org/meetings/abstract-submission-information/'
    ),
    (
        'ASCO',
        'ASCO Quality',
        'American Society of Clinical Oncology Quality Care',
        5,
        10,
        'https://meetings.asco.org/quality/abstracts'
    ),
    (
        'IDWEEK',
        'IDWeek',
        'Infectious Diseases Week',
        3,
        30,
        'https://idweek.org/abstract-submissions/'
    ),
    (
        'IHI',
        'IHI Forum',
        'Institute for Healthcare Improvement Forum',
        8,
        1,
        'https://forum.ihi.org/'
    ) ON CONFLICT (id) DO NOTHING;