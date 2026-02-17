export interface Conference {
    id: string;
    name: string;
    fullName: string;
    month: number; // 0-indexed (0 = Jan)
    day: number;
    website: string;
}

export const CONFERENCES: Conference[] = [
    {
        id: 'SHM',
        name: 'SHM Converge',
        fullName: 'Society of Hospital Medicine',
        month: 10, // November
        day: 24,
        website: 'https://shmabstracts.org/'
    },
    {
        id: 'ACP',
        name: 'ACP IM',
        fullName: 'American College of Physicians Internal Medicine Meeting',
        month: 10, // November
        day: 21,
        website: 'https://www.acponline.org/membership/medical-students/abstract-competitions'
    },
    {
        id: 'ASCO',
        name: 'ASCO Quality',
        fullName: 'American Society of Clinical Oncology Quality Care Symposium',
        month: 5, // June (Estimated based on 2025)
        day: 10,
        website: 'https://meetings.asco.org/quality/abstracts'
    },
    {
        id: 'IHI',
        name: 'IHI Forum',
        fullName: 'Institute for Healthcare Improvement Forum',
        month: 8, // September
        day: 1,
        website: 'https://forum.ihi.org/'
    }
];

export function getNextDeadline(conf: Conference): Date {
    const now = new Date();
    const currentYear = now.getFullYear();
    const deadline = new Date(currentYear, conf.month, conf.day, 23, 59, 59);

    if (now > deadline) {
        deadline.setFullYear(currentYear + 1);
    }

    return deadline;
}
