import { createClient } from "@/utils/supabase/client";

export interface Conference {
    id: string;
    name: string;
    fullName: string;
    month: number; // 0-indexed (0 = Jan)
    day: number;
    website: string;
    group?: string; // specialty group for <optgroup> rendering
    last_ai_check?: string;
    ai_confidence?: string;
}

export const DEFAULT_CONFERENCES: Conference[] = [
    // ── QI & Patient Safety ──────────────────────────────────────────────
    { id: 'IHI',    name: 'IHI Forum',      fullName: 'Institute for Healthcare Improvement National Forum',              month: 10, day: 3,  website: 'https://www.ihi.org/forum',                                                              group: 'QI & Patient Safety' },
    { id: 'NPSF',   name: 'NPSF Congress',  fullName: 'National Patient Safety Foundation Congress',                      month: 4,  day: 1,  website: 'https://www.ihi.org/education/conferences',                                               group: 'QI & Patient Safety' },
    { id: 'AHRQ',   name: 'AHRQ Annual',    fullName: 'Agency for Healthcare Research & Quality Annual Conference',       month: 8,  day: 1,  website: 'https://www.ahrq.gov/conferences',                                                        group: 'QI & Patient Safety' },
    { id: 'ISQUA',  name: 'ISQua Annual',   fullName: 'International Society for Quality in Health Care Annual Meeting',  month: 9,  day: 1,  website: 'https://isqua.org/annual-conference/',                                                    group: 'QI & Patient Safety' },
    { id: 'AH_RD',  name: 'AH Research Day',fullName: 'AdventHealth Research Day',                                       month: 3,  day: 1,  website: 'https://www.adventhealth.com',                                                            group: 'QI & Patient Safety' },

    // ── Internal Medicine & GME ───────────────────────────────────────────
    { id: 'SHM',    name: 'SHM Converge',   fullName: 'Society of Hospital Medicine Annual Conference',                   month: 10, day: 24, website: 'https://www.shmconverge.org/',                                                            group: 'Internal Medicine & GME' },
    { id: 'ACP',    name: 'ACP IM',         fullName: 'American College of Physicians Internal Medicine Meeting',         month: 10, day: 21, website: 'https://annualmeeting.acponline.org/',                                                    group: 'Internal Medicine & GME' },
    { id: 'SGIM',   name: 'SGIM Annual',    fullName: 'Society of General Internal Medicine Annual Meeting',              month: 11, day: 12, website: 'https://sgim.org/annual-meeting',                                                         group: 'Internal Medicine & GME' },
    { id: 'ACGME',  name: 'ACGME Annual',   fullName: 'ACGME Annual Educational Conference',                             month: 2,  day: 1,  website: 'https://www.acgme.org/meetings-and-educational-activities/annual-educational-conference/', group: 'Internal Medicine & GME' },
    { id: 'AAIM',   name: 'AAIM Annual',    fullName: 'Alliance for Academic Internal Medicine Annual Conference',        month: 9,  day: 15, website: 'https://www.im.org/aaim/',                                                                group: 'Internal Medicine & GME' },
    { id: 'APDIM',  name: 'APDIM Spring',   fullName: 'Association of Program Directors in IM Spring Meeting',           month: 3,  day: 20, website: 'https://www.im.org/apdim/',                                                               group: 'Internal Medicine & GME' },

    // ── Cardiology ────────────────────────────────────────────────────────
    { id: 'ACC',    name: 'ACC Session',    fullName: 'American College of Cardiology Scientific Session',               month: 2,  day: 28, website: 'https://www.acc.org/Annual-Scientific-Session',                                           group: 'Cardiology' },
    { id: 'AHA',    name: 'AHA Sessions',   fullName: 'American Heart Association Scientific Sessions',                  month: 10, day: 15, website: 'https://professional.heart.org/en/meetings/scientific-sessions',                          group: 'Cardiology' },
    { id: 'HRS',    name: 'HRS Annual',     fullName: 'Heart Rhythm Society Annual Scientific Sessions',                 month: 4,  day: 1,  website: 'https://www.hrsonline.org/hrs-annual-scientific-sessions',                                group: 'Cardiology' },

    // ── Pulmonology & Critical Care ───────────────────────────────────────
    { id: 'ATS',    name: 'ATS Intl',       fullName: 'American Thoracic Society International Conference',              month: 4,  day: 15, website: 'https://conference.thoracic.org/',                                                         group: 'Pulmonology & Critical Care' },
    { id: 'CHEST',  name: 'CHEST Annual',   fullName: 'American College of Chest Physicians Annual Meeting',             month: 9,  day: 20, website: 'https://www.chestnet.org/learning-and-events/chest-annual-meeting',                       group: 'Pulmonology & Critical Care' },
    { id: 'SCCM',   name: 'SCCM Congress',  fullName: 'Society of Critical Care Medicine Critical Care Congress',        month: 1,  day: 15, website: 'https://www.sccm.org/Annual-Congress',                                                    group: 'Pulmonology & Critical Care' },

    // ── Gastroenterology ─────────────────────────────────────────────────
    { id: 'DDW',    name: 'DDW Week',       fullName: 'Digestive Disease Week',                                          month: 4,  day: 15, website: 'https://ddw.org/',                                                                         group: 'Gastroenterology' },
    { id: 'ACG',    name: 'ACG Scientific', fullName: 'American College of Gastroenterology Annual Scientific Meeting',  month: 9,  day: 1,  website: 'https://acgmeetings.gi.org/',                                                             group: 'Gastroenterology' },
    { id: 'ASGE',   name: 'ASGE Annual',    fullName: 'American Society for Gastrointestinal Endoscopy Annual Meeting',  month: 4,  day: 1,  website: 'https://www.asge.org/home/education-meetings/endoscopy2025',                              group: 'Gastroenterology' },

    // ── Hematology & Oncology ─────────────────────────────────────────────
    { id: 'ASH',         name: 'Annual ASH',    fullName: 'American Society of Hematology Annual Meeting',              month: 11, day: 5,  website: 'https://www.hematology.org/meetings/annual-meeting',                                       group: 'Hematology & Oncology' },
    { id: 'ASCO',        name: 'ASCO Quality',  fullName: 'ASCO Quality Care Symposium',                                month: 8,  day: 25, website: 'https://meetings.asco.org/quality/abstracts',                                              group: 'Hematology & Oncology' },
    { id: 'ASCO_ANNUAL', name: 'ASCO Annual',   fullName: 'American Society of Clinical Oncology Annual Meeting',       month: 4,  day: 1,  website: 'https://meetings.asco.org/',                                                               group: 'Hematology & Oncology' },

    // ── Endocrinology & Diabetes ──────────────────────────────────────────
    { id: 'ADA',    name: 'ADA Sessions',   fullName: 'American Diabetes Association Scientific Sessions',               month: 2,  day: 1,  website: 'https://diabetes.org/scientific-sessions',                                                group: 'Endocrinology & Diabetes' },
    { id: 'ENDO',   name: 'ENDO Annual',    fullName: 'Endocrine Society Annual Meeting (ENDO)',                         month: 5,  day: 1,  website: 'https://www.endocrine.org/meetings-and-events/endo-annual-meetings',                       group: 'Endocrinology & Diabetes' },

    // ── Nephrology ────────────────────────────────────────────────────────
    { id: 'ASN',    name: 'ASN Kidney Week',fullName: 'American Society of Nephrology Kidney Week',                      month: 9,  day: 25, website: 'https://www.asn-online.org/education/kidneyweek/',                                        group: 'Nephrology' },

    // ── Rheumatology ──────────────────────────────────────────────────────
    { id: 'ACR',    name: 'ACR Convergence',fullName: 'American College of Rheumatology Annual Meeting',                month: 10, day: 10, website: 'https://www.rheumatology.org/Annual-Meeting',                                              group: 'Rheumatology' },

    // ── Infectious Disease ────────────────────────────────────────────────
    { id: 'IDWEEK', name: 'IDWeek',         fullName: 'Infectious Diseases Week (IDSA/SHEA/HIVMA/SIDP)',                month: 9,  day: 10, website: 'https://idweek.org/',                                                                      group: 'Infectious Disease' },
    { id: 'SHEA',   name: 'SHEA Spring',    fullName: 'Society for Healthcare Epidemiology of America Spring Conf.',    month: 3,  day: 25, website: 'https://shea-online.org/shea-spring-conference/',                                          group: 'Infectious Disease' },

    // ── Neurology ─────────────────────────────────────────────────────────
    { id: 'AAN',    name: 'AAN Annual',     fullName: 'American Academy of Neurology Annual Meeting',                   month: 3,  day: 1,  website: 'https://www.aan.com/conferences/',                                                         group: 'Neurology' },

    // ── Radiology ─────────────────────────────────────────────────────────
    { id: 'RSNA',   name: 'RSNA Annual',    fullName: 'Radiological Society of North America Annual Meeting',           month: 10, day: 25, website: 'https://www.rsna.org/annual-meeting',                                                      group: 'Radiology' },

    // ── Florida / Regional ────────────────────────────────────────────────
    { id: 'FMA',    name: 'FMA Annual',     fullName: 'Florida Medical Association Annual Meeting',                     month: 7,  day: 1,  website: 'https://www.flmedical.org/',                                                               group: 'Florida / Regional' },
    { id: 'FL_ACP', name: 'FL ACP',         fullName: 'Florida Chapter ACP Annual Scientific Meeting',                  month: 9,  day: 1,  website: 'https://www.floridaacp.org/',                                                              group: 'Florida / Regional' },
    { id: 'FHA',    name: 'FHA Annual',     fullName: 'Florida Hospital Association Annual Meeting',                    month: 10, day: 1,  website: 'https://www.fha.org/',                                                                     group: 'Florida / Regional' },
    
    // ── Other Major Specialties ───────────────────────────────────────────
    { id: 'AAP',    name: 'AAP NCE',        fullName: 'American Academy of Pediatrics National Conference & Exhibition',month: 9,  day: 1,  website: 'https://aapexperience.org/',                                                               group: 'Pediatrics' },
    { id: 'ACS',    name: 'ACS Clin Cong',  fullName: 'American College of Surgeons Clinical Congress',                 month: 9,  day: 15, website: 'https://www.facs.org/for-medical-professionals/education/clinical-congress/',            group: 'Surgery' },
    { id: 'ACOG',   name: 'ACOG ADM',       fullName: 'American College of Obstetricians and Gynecologists Meeting',    month: 4,  day: 1,  website: 'https://www.acog.org/education-and-events/annual-clinical-and-scientific-meeting',     group: 'Obstetrics & Gynecology' },
    { id: 'ACEP',   name: 'ACEP Scientific',fullName: 'American College of Emergency Physicians Scientific Assembly',   month: 9,  day: 10, website: 'https://www.acep.org/sa',                                                                  group: 'Emergency Medicine' },
    { id: 'APA',    name: 'APA Annual',     fullName: 'American Psychiatric Association Annual Meeting',                month: 4,  day: 15, website: 'https://www.psychiatry.org/psychiatrists/meetings/annual-meeting',                       group: 'Psychiatry' },
    { id: 'ESMO',   name: 'ESMO Congress',  fullName: 'European Society for Medical Oncology Congress',                 month: 9,  day: 1,  website: 'https://www.esmo.org/meetings',                                                            group: 'Hematology & Oncology' },
    { id: 'AMA',    name: 'AMA Annual',     fullName: 'American Medical Association Annual Meeting',                    month: 5,  day: 10, website: 'https://www.ama-assn.org/about/events',                                                    group: 'General Medicine' },
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

    return data.map(d => ({
        id: d.id,
        name: d.name,
        fullName: d.full_name,
        month: d.deadline_month,
        day: d.deadline_day,
        website: d.website,
        last_ai_check: d.last_ai_check,
        ai_confidence: d.ai_confidence
    }));
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
