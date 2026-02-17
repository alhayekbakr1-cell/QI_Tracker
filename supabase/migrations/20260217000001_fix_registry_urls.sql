-- Fix Conference Registry URLs and Deadlines
UPDATE conferences_registry
SET website = 'https://www.shmconverge.org/',
    deadline_month = 10,
    deadline_day = 24
WHERE id = 'SHM';
UPDATE conferences_registry
SET website = 'https://annualmeeting.acponline.org/',
    deadline_month = 10,
    deadline_day = 21
WHERE id = 'ACP';
UPDATE conferences_registry
SET website = 'https://sgim.org/annual-meeting',
    deadline_month = 11,
    deadline_day = 12
WHERE id = 'SGIM';
UPDATE conferences_registry
SET website = 'https://conference.thoracic.org/',
    deadline_month = 10,
    deadline_day = 5
WHERE id = 'ATS';
UPDATE conferences_registry
SET website = 'https://www.chestnet.org/learning-and-events/chest-annual-meeting',
    deadline_month = 1,
    deadline_day = 26
WHERE id = 'CHEST';
UPDATE conferences_registry
SET website = 'https://www.acc.org/Annual-Scientific-Session',
    deadline_month = 8,
    deadline_day = 30
WHERE id = 'ACC';
UPDATE conferences_registry
SET website = 'https://professional.heart.org/en/meetings/scientific-sessions',
    deadline_month = 5,
    deadline_day = 1
WHERE id = 'AHA';
UPDATE conferences_registry
SET website = 'https://ddw.org/',
    deadline_month = 11,
    deadline_day = 4
WHERE id = 'DDW';
UPDATE conferences_registry
SET website = 'https://acgmeetings.gi.org/',
    deadline_month = 5,
    deadline_day = 1
WHERE id = 'ACG';
UPDATE conferences_registry
SET website = 'https://meetings.asco.org/',
    deadline_month = 5,
    deadline_day = 10
WHERE id = 'ASCO';
UPDATE conferences_registry
SET website = 'https://idweek.org/',
    deadline_month = 3,
    deadline_day = 30
WHERE id = 'IDWEEK';
UPDATE conferences_registry
SET website = 'https://www.ihi.org/forum',
    deadline_month = 10,
    deadline_day = 3
WHERE id = 'IHI';