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
        id: 'SGIM',
        name: 'SGIM Annual',
        fullName: 'Society of General Internal Medicine',
        month: 11, // December
        day: 12,
        website: 'https://www.sgim.org/meetings/annual-meeting'
    },
    {
        id: 'ATS',
        name: 'ATS Intl',
        fullName: 'American Thoracic Society International Conference',
        month: 10, // November
        day: 5,
        website: 'https://conference.thoracic.org/program/abstracts/'
    },
    {
        id: 'CHEST',
        name: 'CHEST Annual',
        fullName: 'American College of Chest Physicians',
        month: 1, // February
        day: 26,
        website: 'https://www.chestnet.org/learning/events/chest-annual-meeting'
    },
    {
        id: 'ACC',
        name: 'ACC Session',
        fullName: 'American College of Cardiology Scientific Session',
        month: 8, // September
        day: 30,
        website: 'https://accscientificsession.acc.org/'
    },
    {
        id: 'AHA',
        name: 'AHA Sessions',
        fullName: 'American Heart Association Scientific Sessions',
        month: 5, // June (Estimated)
        day: 1,
        website: 'https://scientificsessions.heart.org/'
    },
    {
        id: 'DDW',
        name: 'DDW Week',
        fullName: 'Digestive Disease Week',
        month: 11, // December
        day: 4,
        website: 'https://ddw.org/abstracts/'
    },
    {
        id: 'ACG',
        name: 'ACG Scientific',
        fullName: 'American College of Gastroenterology',
        month: 5, // June
        day: 1,
        website: 'https://gi.org/meetings/abstract-submission-information/'
    },
    {
        id: 'ASCO',
        name: 'ASCO Quality',
        fullName: 'American Society of Clinical Oncology Quality Care',
        month: 5, // June
        day: 10,
        website: 'https://meetings.asco.org/quality/abstracts'
    },
    {
        id: 'IDWEEK',
        name: 'IDWeek',
        fullName: 'Infectious Diseases Week',
        month: 3, // April
        day: 30,
        website: 'https://idweek.org/abstract-submissions/'
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
