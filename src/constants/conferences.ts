export interface Conference {
    id: string;
    name: string;
    fullName: string;
    deadline: string; // ISO format
    website: string;
}

export const CONFERENCES: Conference[] = [
    {
        id: 'SHM',
        name: 'SHM Converge',
        fullName: 'Society of Hospital Medicine',
        deadline: '2026-11-15T23:59:59Z',
        website: 'https://www.shmconverge.org/'
    },
    {
        id: 'ACP',
        name: 'ACP IM',
        fullName: 'American College of Physicians Internal Medicine Meeting',
        deadline: '2026-10-30T23:59:59Z',
        website: 'https://im2026.acponline.org/'
    },
    {
        id: 'ASCO',
        name: 'ASCO Quality',
        fullName: 'American Society of Clinical Oncology Quality Care Symposium',
        deadline: '2026-07-15T23:59:59Z',
        website: 'https://meetings.asco.org/quality/attendance'
    },
    {
        id: 'IHI',
        name: 'IHI Forum',
        fullName: 'Institute for Healthcare Improvement Forum',
        deadline: '2026-09-01T23:59:59Z',
        website: 'https://forum.ihi.org/'
    }
];
