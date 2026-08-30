/**
 * Instructional text for the QI Protocol wizard.
 *
 * Taken from the AdventHealth IM GME Tampa Word template
 * (QI_Project_Protocol_Template_AdventHealth_IMGME_Tampa.docx). The wizard
 * already captured every field the template asks for, but none of the template's
 * guidance — residents were filling in labelled boxes with no explanation of
 * what belonged in them, which the paper form actually provided.
 *
 * Keep the wording aligned with the Word template if that document changes.
 */

export interface StepGuidance {
    /** Which template sections this wizard step covers. */
    covers: string;
    /** The template's own instruction for these sections. */
    intro: string;
    /** Bullet guidance, verbatim from the template where it exists. */
    points: string[];
    /** Optional worked example the template supplies. */
    example?: { label: string; body: string; tips?: string[] };
}

export const PROTOCOL_GUIDANCE: Record<number, StepGuidance> = {
    1: {
        covers: "Cover sheet",
        intro: "Identify the project, the site, and everyone accountable for it. Replace all placeholders before submission.",
        points: [
            "Principal Investigator is the resident leading the project.",
            "Faculty mentor must be named — mentor sign-off is a graduation requirement.",
            "Record the IRB or QI determination: most QI work is Not Human Subjects Research, but anything seeking generalizable knowledge needs IRB review.",
        ],
    },
    2: {
        covers: "Section 1 — Project Overview",
        intro: "Briefly summarize the problem, the aim, and what you will change.",
        points: [
            "Keep the problem statement to 1–2 sentences.",
            "Every project needs an outcome, a process, and a balancing measure.",
            "Typical project duration is 3–6 months.",
        ],
        example: {
            label: "SMART Aim example",
            body: "Increase the percentage of internal medicine inpatients with medication reconciliation completed within 24 hours of admission from 58% to 85% by June 2026 on Team B.",
            tips: [
                "Specify WHO, WHAT, and WHERE",
                "Include both the baseline and the target",
                "Include a time-bound deadline",
            ],
        },
    },
    3: {
        covers: "Section 2 — Background & Evidence",
        intro: "Describe why this matters and what is known. Include brief local context.",
        points: [
            "Clinical problem and impact: patient outcomes, safety, experience, cost, efficiency.",
            "Current status and baseline data at your site — what is happening now.",
            "Evidence supporting your proposed change: summarize key studies or guidelines.",
            "Evidence gaps, or why prior efforts did not work, if applicable.",
            "Number references in the order cited, starting at 1.",
        ],
    },
    4: {
        covers: "Section 3 — Study Outcomes",
        intro: "Use SMART: Specific, Measurable, Achievable, Relevant, Time-bound.",
        points: [
            "Give every outcome an operational definition — how exactly it is counted.",
            "Name the data source for each outcome.",
            "State a numeric target, not a direction of travel.",
        ],
    },
    5: {
        covers: "Section 4 — Methods & PDSA",
        intro: "Specify your QI framework and why it fits, then describe each intervention in enough detail for someone else to replicate it.",
        points: [
            "Setting, population, inclusion and exclusion criteria, and both baseline and post-intervention timeframes.",
            "Retrospective review: which variables, which patients, which dates.",
            "Education and outreach: scripts, shared decision-making, handouts, staff education.",
            "Workflow and EMR tools: smart phrases, care gaps, templates, order sets, reminders.",
            "Responsibilities: who does what, and when.",
        ],
        example: {
            label: "PDSA cycle example",
            body: "Plan: Educate residents using a 5-minute huddle on admission workflow. Do: Pilot on one ward for 2 weeks. Study: Compare completion rates pre- and post-intervention. Act: Refine workflow and expand to additional teams.",
        },
    },
    6: {
        covers: "Sections 5 & 6 — Measures, Data & HIPAA",
        intro: "List outcome, process, and balancing measures with operational definitions, then say how the data will be handled.",
        points: [
            "Define a numerator and denominator for every measure.",
            "Data abstraction plan: who collects it, their training, the data dictionary, and how missing data is handled.",
            "Store data in a HIPAA-compliant location such as AdventHealth OneDrive or SharePoint.",
            "Limit access to QI investigators and mentors only.",
            "Prefer MRN only as an identifier — avoid names and addresses.",
            "Monthly spot-checks on 10% of entries by PI or mentor to verify accuracy.",
            "Retain records for 7 years per institutional policy.",
        ],
    },
    7: {
        covers: "Section 7 — Timeline & Team Roles",
        intro: "Typical total duration is 3–6 months; adjust as needed.",
        points: [
            "Give every phase an owner and a deliverable, not just dates.",
            "Suggested phases: retrospective review (Month 1), outreach and education (Months 2–3), implementation (Months 3–5), post-intervention analysis (Month 6), then presentation preparation.",
            "Agree a team meeting cadence for goal assessment and adjustment.",
        ],
    },
    8: {
        covers: "Sections 8–14 — Analysis, Reporting & Dissemination",
        intro: "State how you will analyse, report, sustain, and share the work.",
        points: [
            "Descriptive statistics: counts and percentages; summarize inclusion/exclusion cohorts.",
            "Comparative analysis: pre versus post, considering patient and system barriers to change.",
            "Visualization: run charts or control charts where appropriate.",
            "NNT where applicable: 1 / (pre rate − post rate) for the primary outcome.",
            "Sustainability: handoffs, ownership, EMR tools, education, audit-and-feedback.",
            "Ethics: state the QI versus research determination, risks (usually minimal), and privacy protections.",
            "Dissemination: typically a 5-minute presentation at the Quality Initiative Conference, reviewed with your mentor first.",
            "References: minimum of 3, from recognized journals or organizations (NEJM, CDC, USPSTF, ACP, CHEST, ACC, AHA, ACG).",
        ],
    },
};

/**
 * The template's "Submission Checklist (Required)".
 *
 * Each item carries a predicate so the wizard can tell a resident what is still
 * outstanding, rather than leaving them to self-assess against a paper list.
 * Predicates are deliberately forgiving — presence and rough shape, not
 * quality judgements, which are the mentor's job.
 */
export interface ChecklistItem {
    label: string;
    isMet: (d: any) => boolean;
}

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export const SUBMISSION_CHECKLIST: ChecklistItem[] = [
    { label: "SMART aim clearly defined", isMet: d => filled(d?.aim) && d.aim.trim().length > 25 },
    { label: "Baseline data reported", isMet: d => filled(d?.baselineData) },
    { label: "At least one outcome measure defined", isMet: d => filled(d?.outcomeMeasure) },
    { label: "At least one balancing measure included", isMet: d => filled(d?.balancingMeasure) },
    {
        label: "Numerator and denominator defined for all measures",
        isMet: d => Array.isArray(d?.measuresTable) && d.measuresTable.length > 0 &&
            d.measuresTable.every((m: any) => filled(m?.denNum)),
    },
    {
        label: "At least one PDSA cycle described with a prediction",
        isMet: d => Array.isArray(d?.pdsaCycles) && d.pdsaCycles.some((c: any) => filled(c?.plan) && filled(c?.do)),
    },
    {
        label: "Data source and HIPAA-compliant storage specified",
        isMet: d => (d?.epicReviewSource || d?.registrySource || d?.surveySource || d?.otherSource) &&
            filled(d?.dataManagementDetails),
    },
    { label: "Mentor reviewed and approved protocol", isMet: d => filled(d?.mentor) },
];
