-- Enrich public.conferences_registry table with writing guidelines, submission URLs, poster criteria, and GME advice.

ALTER TABLE public.conferences_registry 
ADD COLUMN IF NOT EXISTS submission_url TEXT,
ADD COLUMN IF NOT EXISTS abstract_limit TEXT,
ADD COLUMN IF NOT EXISTS required_sections TEXT,
ADD COLUMN IF NOT EXISTS poster_dimensions TEXT,
ADD COLUMN IF NOT EXISTS gme_tips TEXT;

-- Update existing default conferences with guideline metadata
UPDATE public.conferences_registry 
SET 
    submission_url = 'https://www.shmconverge.org/submit-an-abstract',
    abstract_limit = '300 words',
    required_sections = 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
    poster_dimensions = '4'' x 4'' (48" x 48") Square',
    gme_tips = 'Focus heavily on inpatient team-based care, interdisciplinary workflows (RN/MD coordination), and inpatient metrics (e.g. length of stay, 30-day readmissions).'
WHERE id = 'SHM';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://www.acponline.org/membership/residents/abstracts',
    abstract_limit = '250 words',
    required_sections = 'INTRODUCTION, METHODS, RESULTS, DISCUSSION',
    poster_dimensions = '4'' x 6'' (48" x 72") Horizontal',
    gme_tips = 'Highly competitive clinical vignette and QI tracks. Emphasize patient outcomes, safety incidents avoided, and regional/national relevance of the local improvement.'
WHERE id = 'ACP';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://www.sgim.org/meetings/submit-an-abstract',
    abstract_limit = '300 words',
    required_sections = 'INTRODUCTION, METHODS, RESULTS, DISCUSSION',
    poster_dimensions = '4'' x 6'' (48" x 72") Horizontal',
    gme_tips = 'Ideal for outpatient clinic improvements, health policy, health equity, medical education, or primary care delivery models.'
WHERE id = 'SGIM';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://conference.thoracic.org/speakers/abstract-submission/',
    abstract_limit = '400 words (Strict 3,300 character limit)',
    required_sections = 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
    poster_dimensions = '4'' x 8'' (48" x 96\") Horizontal',
    gme_tips = 'Must relate to pulmonary, critical care, or sleep medicine. Highlight ventilatory protocols, ICU sedation, or COPD/asthma discharge bundles.'
WHERE id = 'ATS';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://www.chestnet.org/learning-and-events/chest-annual-meeting/abstracts-and-case-reports',
    abstract_limit = '2,500 characters (~300 words)',
    required_sections = 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
    poster_dimensions = '4'' x 6'' (48" x 72") Horizontal',
    gme_tips = 'Emphasize critical care pathways, rapid response systems, ventilator safety, or outpatient pulmonary/asthma clinic improvements.'
WHERE id = 'CHEST';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://www.acc.org/Annual-Scientific-Session/Submit-Abstracts',
    abstract_limit = '2,800 characters (~350 words)',
    required_sections = 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
    poster_dimensions = '4'' x 8'' (48" x 96\") Horizontal',
    gme_tips = 'Excellent for projects targeting telemetry reduction, heart failure discharge checklists, ACS pathway adherence, or cardiac clinic transitions.'
WHERE id = 'ACC';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://professional.heart.org/en/meetings/scientific-sessions/abstract-submissions',
    abstract_limit = '1,950 characters (~250 words)',
    required_sections = 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
    poster_dimensions = '4'' x 8'' (48" x 96\") Horizontal',
    gme_tips = 'Must emphasize cardiovascular outcomes. Stroke metrics, CPR quality, inpatient telemetry usage, or outpatient hypertension tracking fit well here.'
WHERE id = 'AHA';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://ddw.org/submit-an-abstract/',
    abstract_limit = '255 words',
    required_sections = 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
    poster_dimensions = '4'' x 8'' (48" x 96\") Horizontal',
    gme_tips = 'Great for GI quality metrics, inpatient GI bleeding bundles, colonoscopy preparation quality, or inpatient cirrhosis pathways.'
WHERE id = 'DDW';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://acgmeetings.gi.org/submit-an-abstract/',
    abstract_limit = '300 words',
    required_sections = 'INTRODUCTION, METHODS, RESULTS, DISCUSSION',
    poster_dimensions = '4'' x 6'' (48" x 72") Horizontal',
    gme_tips = 'Emphasize screening compliance, inpatient endoscopy workflows, paracentesis safety bundles, or outpatient inflammatory bowel disease care.'
WHERE id = 'ACG';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://meetings.asco.org/quality/abstracts',
    abstract_limit = '2,000 characters (~250 words)',
    required_sections = 'BACKGROUND, METHODS, RESULTS, CONCLUSIONS',
    poster_dimensions = '4'' x 8'' (48" x 96\") Horizontal',
    gme_tips = 'The premier quality-focused oncology conference. Highly values solid chemotherapy safety workflows, immunotherapy tracking, or oncology supportive care.'
WHERE id = 'ASCO';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://idweek.org/abstracts/',
    abstract_limit = '1,950 characters (~250 words)',
    required_sections = 'BACKGROUND, METHODS, RESULTS, CONCLUSION',
    poster_dimensions = '4'' x 8'' (48" x 96\") Horizontal',
    gme_tips = 'Strongly focused on antimicrobial stewardship, CLABSI/CAUTI reduction bundles, C. diff auditing, or vaccine hesitancy counseling clinics.'
WHERE id = 'IDWEEK';

UPDATE public.conferences_registry 
SET 
    submission_url = 'https://www.ihi.org/forum/posters',
    abstract_limit = '250 words',
    required_sections = 'CONTEXT, AIM, INTERVENTION, MEASURES, RESULTS, LESSONS LEARNED',
    poster_dimensions = '3'' x 4'' (36" x 48") Horizontal',
    gme_tips = 'The gold standard for dedicated quality improvement science. Emphasize human factors design, Run Charts (show median shifts), and long-term sustainability plans.'
WHERE id = 'IHI';

-- Ensure ASH and AHRD exist in the public database registry
INSERT INTO public.conferences_registry (id, name, full_name, deadline_month, deadline_day, website, submission_url, abstract_limit, required_sections, poster_dimensions, gme_tips)
VALUES 
    (
        'ASH',
        'Annual ASH',
        'American Society of Hematology Annual Meeting',
        11,
        5,
        'https://www.hematology.org/meetings/annual-meeting',
        'https://www.hematology.org/meetings/annual-meeting/abstracts',
        '3,800 characters (~500 words)',
        'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
        '4'' x 8'' (48" x 96\") Horizontal',
        'Target projects focusing on DVT prophylaxis, sickle cell crisis treatment protocols, blood transfusion stewardship, or heparin safety bundles.'
    ),
    (
        'AHRD',
        'AdventHealth Research Day',
        'AdventHealth Orlando Annual Research Day',
        3,
        15,
        'https://www.adventhealthresearchinstitute.com/',
        'https://www.adventhealthresearchinstitute.com/research-day',
        '350 words',
        'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS/DISCUSSIONS',
        '3'' x 4'' (36" x 48") Landscape',
        'Our local institutional day. Focus on local patient impact under AdventHealth Tampa, multidisciplinary safety improvements, and GME collaboration.'
    )
ON CONFLICT (id) DO UPDATE SET
    submission_url = EXCLUDED.submission_url,
    abstract_limit = EXCLUDED.abstract_limit,
    required_sections = EXCLUDED.required_sections,
    poster_dimensions = EXCLUDED.poster_dimensions,
    gme_tips = EXCLUDED.gme_tips;
