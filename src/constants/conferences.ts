import { createClient } from "@/utils/supabase/client";

export interface Conference {
    id: string;
    name: string;
    fullName: string;
    month: number; // 0-indexed (0 = Jan)
    day: number;
    website: string;
    last_ai_check?: string;
    ai_confidence?: string;
    submissionUrl?: string;
    abstractLimit?: string;
    requiredSections?: string;
    posterDimensions?: string;
    gmeTips?: string;
}

export const DEFAULT_CONFERENCES: Conference[] = [
    {
        id: 'SHM',
        name: 'SHM Converge',
        fullName: 'Society of Hospital Medicine',
        month: 10, // November
        day: 24,
        website: 'https://www.shmconverge.org/',
        submissionUrl: 'https://www.shmconverge.org/submit-an-abstract',
        abstractLimit: '300 words',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
        posterDimensions: "4' x 4' (48\" x 48\") Square",
        gmeTips: 'Focus heavily on inpatient team-based care, interdisciplinary workflows (RN/MD coordination), and inpatient metrics (e.g. length of stay, 30-day readmissions).'
    },
    {
        id: 'ACP',
        name: 'ACP IM',
        fullName: 'American College of Physicians Internal Medicine Meeting',
        month: 10, // November
        day: 21,
        website: 'https://annualmeeting.acponline.org/',
        submissionUrl: 'https://www.acponline.org/membership/residents/abstracts',
        abstractLimit: '250 words',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, DISCUSSION',
        posterDimensions: "4' x 6' (48\" x 72\") Horizontal",
        gmeTips: 'Highly competitive clinical vignette and QI tracks. Emphasize patient outcomes, safety incidents avoided, and regional/national relevance of the local improvement.'
    },
    {
        id: 'SGIM',
        name: 'SGIM Annual',
        fullName: 'Society of General Internal Medicine',
        month: 11, // December
        day: 12,
        website: 'https://sgim.org/annual-meeting',
        submissionUrl: 'https://www.sgim.org/meetings/submit-an-abstract',
        abstractLimit: '300 words',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, DISCUSSION',
        posterDimensions: "4' x 6' (48\" x 72\") Horizontal",
        gmeTips: 'Ideal for outpatient clinic improvements, health policy, health equity, medical education, or primary care delivery models.'
    },
    {
        id: 'ATS',
        name: 'ATS Intl',
        fullName: 'American Thoracic Society International Conference',
        month: 10, // November
        day: 5,
        website: 'https://conference.thoracic.org/',
        submissionUrl: 'https://conference.thoracic.org/speakers/abstract-submission/',
        abstractLimit: '400 words (Strict 3,300 character limit)',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
        posterDimensions: "4' x 8' (48\" x 96\") Horizontal",
        gmeTips: 'Must relate to pulmonary, critical care, or sleep medicine. Highlight ventilatory protocols, ICU sedation, or COPD/asthma discharge bundles.'
    },
    {
        id: 'CHEST',
        name: 'CHEST Annual',
        fullName: 'American College of Chest Physicians',
        month: 1, // February
        day: 26,
        website: 'https://www.chestnet.org/learning-and-events/chest-annual-meeting',
        submissionUrl: 'https://www.chestnet.org/learning-and-events/chest-annual-meeting/abstracts-and-case-reports',
        abstractLimit: '2,500 characters (~300 words)',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
        posterDimensions: "4' x 6' (48\" x 72\") Horizontal",
        gmeTips: 'Emphasize critical care pathways, rapid response systems, ventilator safety, or outpatient pulmonary/asthma clinic improvements.'
    },
    {
        id: 'ACC',
        name: 'ACC Session',
        fullName: 'American College of Cardiology Scientific Session',
        month: 8, // September
        day: 30,
        website: 'https://accscientificsession.acc.org/',
        submissionUrl: 'https://accscientificsession.acc.org/Submit-Your-Science',
        abstractLimit: '2,800 characters (~350 words)',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
        posterDimensions: "4' x 8' (48\" x 96\") Horizontal",
        gmeTips: 'Excellent for projects targeting telemetry reduction, heart failure discharge checklists, ACS pathway adherence, or cardiac clinic transitions.'
    },
    {
        id: 'AHA',
        name: 'AHA Sessions',
        fullName: 'American Heart Association Scientific Sessions',
        month: 5, // June (Estimated)
        day: 1,
        website: 'https://professional.heart.org/en/meetings/scientific-sessions',
        submissionUrl: 'https://professional.heart.org/en/meetings/scientific-sessions/abstract-submissions',
        abstractLimit: '1,950 characters (~250 words)',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
        posterDimensions: "4' x 8' (48\" x 96\") Horizontal",
        gmeTips: 'Must emphasize cardiovascular outcomes. Stroke metrics, CPR quality, inpatient telemetry usage, or outpatient hypertension tracking fit well here.'
    },
    {
        id: 'DDW',
        name: 'DDW Week',
        fullName: 'Digestive Disease Week',
        month: 11, // December
        day: 4,
        website: 'https://ddw.org/',
        submissionUrl: 'https://ddw.org/submit-an-abstract/',
        abstractLimit: '255 words',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
        posterDimensions: "4' x 8' (48\" x 96\") Horizontal",
        gmeTips: 'Great for GI quality metrics, inpatient GI bleeding bundles, colonoscopy preparation quality, or inpatient cirrhosis pathways.'
    },
    {
        id: 'ACG',
        name: 'ACG Scientific',
        fullName: 'American College of Gastroenterology',
        month: 5, // June
        day: 1,
        website: 'https://acgmeetings.gi.org/',
        submissionUrl: 'https://acgmeetings.gi.org/submit-an-abstract/',
        abstractLimit: '300 words',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, DISCUSSION',
        posterDimensions: "4' x 6' (48\" x 72\") Horizontal",
        gmeTips: 'Emphasize screening compliance, inpatient endoscopy workflows, paracentesis safety bundles, or outpatient inflammatory bowel disease care.'
    },
    {
        id: 'ASCO',
        name: 'ASCO Quality',
        fullName: 'ASCO Quality Care Symposium',
        month: 5, // June
        day: 10,
        website: 'https://meetings.asco.org/quality/abstracts',
        submissionUrl: 'https://meetings.asco.org/quality/abstracts',
        abstractLimit: '2,000 characters (~250 words)',
        requiredSections: 'BACKGROUND, METHODS, RESULTS, CONCLUSIONS',
        posterDimensions: "4' x 8' (48\" x 96\") Horizontal",
        gmeTips: 'The premier quality-focused oncology conference. Highly values solid chemotherapy safety workflows, immunotherapy tracking, or oncology supportive care.'
    },
    {
        id: 'IDWEEK',
        name: 'IDWeek',
        fullName: 'Infectious Diseases Week',
        month: 3, // April
        day: 30,
        website: 'https://idweek.org/',
        submissionUrl: 'https://idweek.org/abstracts/',
        abstractLimit: '1,950 characters (~250 words)',
        requiredSections: 'BACKGROUND, METHODS, RESULTS, CONCLUSION',
        posterDimensions: "4' x 8' (48\" x 96\") Horizontal",
        gmeTips: 'Strongly focused on antimicrobial stewardship, CLABSI/CAUTI reduction bundles, C. diff auditing, or vaccine hesitancy counseling clinics.'
    },
    {
        id: 'IHI',
        name: 'IHI Forum',
        fullName: 'Institute for Healthcare Improvement Forum',
        month: 10, // November (Posters)
        day: 3,
        website: 'https://www.ihi.org/forum',
        submissionUrl: 'https://www.ihi.org/forum/posters',
        abstractLimit: '250 words',
        requiredSections: 'CONTEXT, AIM, INTERVENTION, MEASURES, RESULTS, LESSONS LEARNED',
        posterDimensions: "3' x 4' (36\" x 48\") Horizontal",
        gmeTips: 'The gold standard for dedicated quality improvement science. Emphasize human factors design, Run Charts (show median shifts), and long-term sustainability plans.'
    },
    {
        id: 'ASH',
        name: 'Annual ASH',
        fullName: 'American Society of Hematology Annual Meeting',
        month: 11, // December
        day: 5,
        website: 'https://www.hematology.org/meetings/annual-meeting',
        submissionUrl: 'https://www.hematology.org/meetings/annual-meeting/abstracts',
        abstractLimit: '3,800 characters (~500 words)',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS',
        posterDimensions: "4' x 8' (48\" x 96\") Horizontal",
        gmeTips: 'Target projects focusing on DVT prophylaxis, sickle cell crisis treatment protocols, blood transfusion stewardship, or heparin safety bundles.'
    },
    {
        id: 'AHRD',
        name: 'AdventHealth Research Day',
        fullName: 'AdventHealth Orlando Annual Research Day',
        month: 3, // April
        day: 15,
        website: 'https://www.adventhealthresearchinstitute.com/',
        submissionUrl: 'https://www.adventhealthresearchinstitute.com/research-day',
        abstractLimit: '350 words',
        requiredSections: 'INTRODUCTION, METHODS, RESULTS, CONCLUSIONS/DISCUSSIONS',
        posterDimensions: "3' x 4' (36\" x 48\") Landscape",
        gmeTips: 'Our local institutional day. Focus on local patient impact under AdventHealth Tampa, multidisciplinary safety improvements, and GME collaboration.'
    }
];

// Compatibility alias
export const CONFERENCES = DEFAULT_CONFERENCES;

export async function fetchRegistry(): Promise<Conference[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('conferences_registry')
        .select('*')
        .order('name');

    if (error || !data) {
        console.warn('Using default conference registry due to fetch error:', error);
        return DEFAULT_CONFERENCES;
    }

    return data.map(d => {
        const fallback = (DEFAULT_CONFERENCES.find(c => c.id === d.id) || {}) as any;
        return {
            id: d.id,
            name: d.name,
            fullName: d.full_name,
            month: d.deadline_month,
            day: d.deadline_day,
            website: d.website,
            last_ai_check: d.last_ai_check,
            ai_confidence: d.ai_confidence,
            submissionUrl: d.submission_url || fallback.submissionUrl || d.website,
            abstractLimit: d.abstract_limit || fallback.abstractLimit || "300 words",
            requiredSections: d.required_sections || fallback.requiredSections || "INTRODUCTION, METHODS, RESULTS, CONCLUSIONS",
            posterDimensions: d.poster_dimensions || fallback.posterDimensions || "4' x 8' (48\" x 96\") Horizontal",
            gmeTips: d.gme_tips || fallback.gmeTips || "Ensure a robust clinical quality aim is clearly specified."
        };
    });
}

export function getNextDeadline(conf: Conference): Date {
    const now = new Date();
    const currentYear = now.getFullYear();
    const deadline = new Date(currentYear, conf.month, conf.day, 23, 59, 59);

    if (now > deadline) {
        deadline.setFullYear(currentYear + 1);
    }

    return deadline;
}
