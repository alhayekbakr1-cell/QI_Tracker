-- Add ASH and update ASCO in the conference registry
INSERT INTO public.conferences_registry (
        id,
        name,
        full_name,
        deadline_month,
        deadline_day,
        website
    )
VALUES (
        'ASH',
        'Annual ASH',
        'American Society of Hematology Annual Meeting',
        11,
        5,
        'https://www.hematology.org/meetings/annual-meeting'
    ) ON CONFLICT (id) DO NOTHING;

-- Update ASCO naming and URL to better match 'ASCO Quality care symposium'
UPDATE public.conferences_registry
SET name = 'ASCO Quality',
    full_name = 'ASCO Quality Care Symposium',
    website = 'https://meetings.asco.org/quality/abstracts',
    updated_at = NOW()
WHERE id = 'ASCO';
