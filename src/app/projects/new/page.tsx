"use client"

import { createClient } from "@/utils/supabase/client";
import { AUTH_BYPASS, DEV_USER } from "@/utils/auth/devBypass";
import { useRouter } from "next/navigation";
import PHIWarning from "@/components/PHIWarning";
import { ArrowLeft, Save, Sparkles, Loader2, LayoutGrid, Users, Target, TrendingUp, Trophy, Info, FileText, FileDown, CheckSquare, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import Section from "@/components/Section";
import { useEffect, useState } from "react";
import { draftSummary, generateSMARTAim, checkDuplication } from "@/utils/ai";
import { sendEmail, TEMPLATES } from "@/utils/email";
import { PROJECT_CATEGORIES, PROJECT_SUBCATEGORIES, CONFERENCE_OPTIONS, PROJECT_STATUSES } from "@/constants/projectData";
import { toast, CustomConfirmDialog } from "@/components/ui/custom-ui";
import { createNotification } from "@/utils/createNotification";
import { scanForPHI } from "@/utils/phi_guard";

// The form is a stepped wizard, but every step stays MOUNTED and is hidden with
// CSS rather than unmounted. handleSubmit reads uncontrolled inputs via
// `new FormData(e.currentTarget)`; unmounting a step would drop its fields from
// that FormData and silently discard the resident's answers.
const WIZARD_STEPS = [
    { label: "Foundation", hint: "What the project is" },
    { label: "Team", hint: "Who is accountable" },
    { label: "Aims", hint: "What success looks like" },
    { label: "Dissemination", hint: "Where it goes" },
] as const;

// Which validation keys belong to which step, so a failed check can send the
// resident back to the step that actually contains the offending field.
const STEP_FIELDS: Record<number, string[]> = {
    0: ['title', 'category'],
    1: [],
    2: ['primary_outcome', 'total_patients_impacted', 'estimated_cost_savings'],
    3: ['updates_and_barriers', 'abstract_summary'],
};

// Faculty are loaded from the directory at runtime (see facultyDirectory below).
// This used to be a hardcoded array of 14 names, which silently went stale
// every time the roster changed and could not carry email addresses.
function AIUpdateSection({ initialValue, onChange }: { initialValue: string, onChange: (val: string) => void }) {
    const [value, setValue] = useState(initialValue);
    const [isDrafting, setIsDrafting] = useState(false);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleAIDraft = async () => {
        if (!value || value.length < 10) {
            toast.warning("Please enter some bullet points or notes first to help the AI draft a summary.");
            return;
        }
        setIsDrafting(true);
        try {
            const drafted = await draftSummary(value);
            setValue(drafted);
            onChange(drafted);
            toast.success("AI drafted summary successfully!");
        } catch (error: any) {
            console.error("AI Drafting error:", error);
            toast.error(`AI Drafting failed: ${error.message || "Unknown error"}.`);
        } finally {
            setIsDrafting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ml-1">
                <div className="flex flex-col">
                    <label htmlFor="updates-textarea" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Initial Updates/Barriers (Optional)</label>
                    <span className="text-[10px] text-slate-300 font-bold italic">Quick notes or current operational state</span>
                </div>
                <button
                    type="button"
                    onClick={handleAIDraft}
                    disabled={isDrafting}
                    className="flex items-center gap-2 self-start text-[10px] font-black uppercase tracking-widest text-advent-navy bg-advent-navy/5 hover:bg-advent-navy/10 px-4 py-2 rounded-xl transition-all border border-advent-navy/10 disabled:opacity-50 active:scale-[0.98]"
                >
                    {isDrafting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-advent-navy" /> : <Sparkles className="w-3.5 h-3.5 text-advent-navy" />}
                    Draft with AI
                </button>
            </div>
            <textarea
                id="updates-textarea"
                name="updates_and_barriers"
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    onChange(e.target.value);
                }}
                placeholder="Enter bullet points (e.g. - IRB approved, - Data collection started) then click 'Draft with AI'..."
                className="w-full p-5 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all min-h-[150px] resize-none text-sm placeholder:text-slate-300"
            />
        </div>
    );
}

export default function NewProjectPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [selectedProponentIds, setSelectedProponentIds] = useState<string[]>([]);
    const [updatesText, setUpdatesText] = useState("");
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const [isPolishingAim, setIsPolishingAim] = useState(false);
    const [primaryOutcome, setPrimaryOutcome] = useState("");
    const [title, setTitle] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [step, setStep] = useState(0);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [selectedFaculty, setSelectedFaculty] = useState("");
    const [facultyDirectory, setFacultyDirectory] = useState<{ name: string; email: string }[]>([]);

    // Custom Modal Dialog state
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        onConfirm?: () => void;
        variant?: 'danger' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
    });

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function checkAuth() {
            const { data: { user: authedUser } } = await supabase.auth.getUser();
            const user = authedUser ?? (AUTH_BYPASS ? (DEV_USER as any) : null);

            if (!user) {
                router.push("/login");
                return;
            }

            // Fetch all profiles for linkage
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .order('full_name');
            setAllProfiles(profiles || []);

            // Faculty rarely hold app accounts, so they live in the directory
            // rather than in profiles.
            const { data: facultyRows } = await supabase
                .from('directory')
                .select('name, email')
                .eq('role', 'Faculty')
                .order('name');
            setFacultyDirectory(facultyRows || []);

            const current = profiles?.find(p => p.id === user.id);
            if (current) {
                setCurrentUserProfile(current);
            }
        }
        checkAuth();
    }, [supabase, router]);

    const facultyProfiles = allProfiles.filter(p => p.role === 'Faculty' || p.role === 'Admin' || p.role === 'Operator');
    const residentProfiles = allProfiles.filter(p => p.role !== 'Faculty' && p.role !== 'Admin' && p.role !== 'Operator');

    const handleDuplicateCheck = async () => {
        if (!title || title.length < 5) {
            toast.warning("Please enter at least 5 characters for the project title first.");
            return;
        }
        setIsCheckingDuplicates(true);
        try {
            const { data: projects } = await supabase.from('projects').select('title').limit(50);
            const summaries = projects?.map(p => p.title).join(', ') || "";
            const result = await checkDuplication(title, summaries);

            setDialogState({
                isOpen: true,
                title: "AI Duplication Check Result",
                message: result,
                confirmLabel: "Understood",
                cancelLabel: "",
                onConfirm: () => setDialogState(prev => ({ ...prev, isOpen: false }))
            });
        } catch (e: any) {
            toast.error("AI Error: " + e.message);
        } finally {
            setIsCheckingDuplicates(false);
        }
    };

    const handleMakeSMART = async () => {
        if (!title) {
            toast.warning("Please enter a project title first.");
            return;
        }
        setIsPolishingAim(true);
        try {
            const smart = await generateSMARTAim(title, primaryOutcome);
            setPrimaryOutcome(smart);
            toast.success("Primary Outcome polished into SMART Aim!");
        } catch (e: any) {
            toast.error("AI Error: " + e.message);
        } finally {
            setIsPolishingAim(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Pressing Enter in any text input submits the form natively. On a stepped
        // form that would create the project from step 1, half-filled. Advance
        // instead of submitting until the resident is actually on the last step.
        if (step < WIZARD_STEPS.length - 1) {
            setStep(s => Math.min(s + 1, WIZARD_STEPS.length - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const formData = new FormData(e.currentTarget);
        
        // Inline Validation
        const errors: Record<string, string> = {};
        if (!title.trim()) {
            errors.title = "Project Title is required";
        }
        if (!formData.get('category')) {
            errors.category = "Category is required";
        }
        if (!primaryOutcome.trim()) {
            errors.primary_outcome = "A SMART Aim is required. Use the AI polish button if you need help shaping one.";
        }

        // Numeric fields were previously coerced with `parseInt(x) || 0`, so a typo
        // like "1o0" silently persisted as 0 and quietly corrupted the impact
        // dashboard. Reject bad input instead of guessing.
        const patientsRaw = (formData.get('total_patients_impacted') as string || '').trim();
        if (patientsRaw && !/^\d+$/.test(patientsRaw)) {
            errors.total_patients_impacted = "Enter a whole number of patients (digits only).";
        }
        const savingsRaw = (formData.get('estimated_cost_savings') as string || '').trim();
        if (savingsRaw && !/^\d+(\.\d{1,2})?$/.test(savingsRaw)) {
            errors.estimated_cost_savings = "Enter an amount like 12000 or 12000.50.";
        }

        // Zero-PHI is the core promise of this registry. scanForPHI already runs
        // before text is sent to the AI, but nothing checked it on the way into
        // the database — which is the copy that persists.
        const phiFields: [string, string, string][] = [
            ['title', 'Project Title', title],
            ['primary_outcome', 'SMART Aim', primaryOutcome],
            ['updates_and_barriers', 'Updates & Barriers', updatesText],
            ['abstract_summary', 'Abstract Summary', (formData.get('abstract_summary') as string) || ''],
        ];
        for (const [field, label, value] of phiFields) {
            if (!value) continue;
            const findings = scanForPHI(value);
            if (findings.length > 0) {
                const shown = findings.slice(0, 3).map(f => `${f.type} "${f.value}"`).join(', ');
                // The MRN rule matches any bare 7-9 digit run, so a legitimate large
                // count ("1250000 charts") trips it. Comma-formatting sidesteps the
                // pattern and reads better anyway, so say so rather than leaving the
                // resident stuck with no way forward.
                const hasBareNumber = findings.some(f => f.type === 'MRN' && /^\d{7,9}$/.test(f.value));
                errors[field] =
                    `${label} looks like it contains PHI (${shown}). Remove it before saving — this registry stores aggregate data only.` +
                    (hasBareNumber ? ` If that is a legitimate count or amount, write it with commas (e.g. 1,250,000).` : '');
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            // Send the resident to the step that actually contains the first
            // problem. Otherwise a PHI hit on the Aims step reads as an
            // unexplained refusal while they are looking at Dissemination.
            const failed = Object.keys(errors);
            const targetStep = Number(
                Object.keys(STEP_FIELDS).find(s =>
                    STEP_FIELDS[Number(s)].some(f => failed.includes(f))
                ) ?? step
            );
            setStep(targetStep);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        setFormErrors({});
        setIsSaving(true);

        const facultyId = formData.get('faculty_id') === "" ? null : formData.get('faculty_id') as string;
        let facultyName = formData.get('faculty_name') as string || "";
        if (facultyName === "Other") {
            facultyName = formData.get('faculty_name_manual') as string || "";
        }

        // Robust matching & synchronization of faculty names/IDs:
        let finalFacultyId = facultyId;
        let finalFacultyName = facultyName;

        if (finalFacultyId) {
            // Dropdown selected: set facultyName to the linked profile's full name
            const matchingProfile = facultyProfiles.find(p => p.id === finalFacultyId);
            if (matchingProfile) {
                finalFacultyName = matchingProfile.full_name;
            }
        } else if (finalFacultyName.trim()) {
            // Dropdown not selected, but a name was typed: try to match a registered faculty/operator by name (case-insensitive)
            const cleanName = finalFacultyName.trim().toLowerCase().replace(/^dr\.\s+/i, '');
            // Only auto-link when the typed name resolves to exactly ONE profile.
            // This used to take the first substring hit, so typing "John" could
            // silently attach "Johnson" as the faculty mentor — who would then be
            // notified and emailed about a project they have nothing to do with.
            const candidates = facultyProfiles.filter(p => {
                const cleanProfileName = p.full_name.toLowerCase().replace(/^dr\.\s+/i, '');
                return cleanProfileName === cleanName ||
                       cleanProfileName.includes(cleanName) ||
                       cleanName.includes(cleanProfileName);
            });
            const exact = candidates.find(p =>
                p.full_name.toLowerCase().replace(/^dr\.\s+/i, '') === cleanName
            );
            const resolved = exact ?? (candidates.length === 1 ? candidates[0] : null);
            if (resolved) {
                finalFacultyId = resolved.id;
                finalFacultyName = resolved.full_name; // Standardize to database profile spelling
            } else if (candidates.length > 1) {
                // Ambiguous: keep the typed name, link nothing, and say so rather
                // than guessing at a mentor.
                toast.error(`"${finalFacultyName}" matches ${candidates.length} faculty profiles. Pick one from the dropdown to link them.`);
            }
        }

        // Combine manual names and linked profiles for labels
        const proponentsText = formData.get('proponents_text') as string;
        const leadProponentsText = formData.get('lead_proponents_text') as string;

        const manualProponents = proponentsText ? proponentsText.split(',').map(s => s.trim()).filter(Boolean) : [];
        const manualLeads = leadProponentsText ? leadProponentsText.split(',').map(s => s.trim()).filter(Boolean) : [];

        const linkedProponentNames = allProfiles.filter(p => selectedProponentIds.includes(p.id)).map(p => p.full_name);
        const linkedLeadNames = allProfiles.filter(p => selectedLeadIds.includes(p.id)).map(p => p.full_name);

        const proponentsArray = Array.from(new Set([...manualProponents, ...linkedProponentNames]));
        const leadProponentsArray = Array.from(new Set([...manualLeads, ...linkedLeadNames]));

        // Nothing gates this form on the profile having loaded, and RLS lets any
        // authenticated user insert into `projects`. So when currentUserProfile was
        // still null, `?.role === 'Viewer'` evaluated false and a resident fell
        // straight through to the direct-insert path — silently bypassing mentor and
        // GME approval. Refuse to guess at identity.
        if (!currentUserProfile) {
            setIsSaving(false);
            toast.error("Your profile is still loading. Give it a second and try again.");
            return;
        }

        // Fail closed: only explicitly privileged roles may write straight to
        // `projects`. Any other or unrecognised role goes through approval.
        const canPublishDirectly =
            currentUserProfile.role === 'Operator' ||
            currentUserProfile.role === 'Admin' ||
            currentUserProfile.role === 'Faculty';

        if (!canPublishDirectly) {
            const defaultProtocolData = {
                title: title,
                setting: "AdventHealth Tampa",
                pi: currentUserProfile.full_name || "",
                coInvestigators: proponentsText || "",
                mentor: finalFacultyName || "",
                sponsor: "AdventHealth IM GME — Tampa, FL",
                committee: "",
                irbStatus: "QI Exempt",
                irbNumber: "",
                problem: "",
                aim: primaryOutcome || "",
                intervention: "",
                outcomeMeasure: "",
                processMeasure: "",
                balancingMeasure: "",
                targetPop: "",
                duration: "6 months",
                background: "",
                baselineData: "",
                evidence: "",
                evidenceGaps: "",
                citations: "",
                outcomesTable: [
                    { type: "Primary Outcome", def: primaryOutcome || "", source: "Epic chart review", target: "" }
                ],
                design: "PDSA",
                designOtherText: "",
                designDesc: "Plan-Do-Study-Act cycles allow rapid testing of workflow changes on medicine wards.",
                settingDetails: "General Internal Medicine wards at AdventHealth Tampa.",
                popDetails: "Adult patients admitted to General Medicine services.",
                inclusionCriteria: "Age >= 18; admitted to general medicine units.",
                exclusionCriteria: "ICU admissions; comfort care / hospice status.",
                baselineTimeframe: "Pre-intervention window (e.g. Month 1)",
                postTimeframe: "Post-intervention tracking (e.g. Months 4-6)",
                chartReviewDesc: "",
                educationDesc: "",
                emrToolsDesc: "",
                responsibilitiesDesc: "",
                pdsaCycles: [
                    { cycle: "PDSA 1", plan: "Huddle education with Team A residents.", do: "Implemented during morning sign-out.", study: "Track order completion rates.", act: "Refine checklist and roll out to Team B." }
                ],
                measuresTable: [
                    { measure: "Primary Measure", type: "Outcome", def: "", denNum: "", freq: "Weekly", source: "Epic chart review" }
                ],
                epicReviewSource: true,
                registrySource: false,
                surveySource: false,
                otherSource: false,
                otherSourceText: "",
                dataAbstractionPlan: "PI and co-investigators will perform retrospective and prospective electronic chart audits using a standardized template in OneDrive.",
                spreadsheetFile: true,
                pdfFile: false,
                redcapFile: false,
                otherFile: false,
                otherFileText: "",
                dataManagementDetails: "All data stored on HIPAA-compliant AdventHealth OneDrive. Only investigators have access. Patient MRN is used; no names or direct identifiers.",
                timelineChart: [
                    { phase: "Retrospective chart/source review (Month 1)", dates: "", owner: "", deliverable: "Baseline data" },
                    { phase: "Patient outreach & education (Month 2-3)", dates: "", owner: "", deliverable: "Education rollout" },
                    { phase: "Intervention implementation (Month 3-5)", dates: "", owner: "", deliverable: "Active intervention" },
                    { phase: "Post-intervention data collection/analysis (Month 6)", dates: "", owner: "", deliverable: "Final metrics" },
                    { phase: "Presentation/poster preparation", dates: "", owner: "", deliverable: "QI Conference Poster" }
                ],
                meetingMonthly: true,
                meetingBiweekly: false,
                meetingOther: false,
                meetingOtherText: "",
                tasksTable: [
                    { investigator: currentUserProfile.full_name || "", role: "Principal Investigator", tasks: "Data abstraction, coordination, draft protocol", dates: "" }
                ],
                excelAnalysis: true,
                epicAnalysis: false,
                pythonAnalysis: false,
                otherAnalysis: false,
                otherAnalysisText: "",
                analysisPlan: "Descriptive statistics (percentages, means) will summarize inclusion/exclusion cohorts. Run charts will display weekly compliance percentages to evaluate trend shifts using standard run chart rules.",
                resultsPlan: "Metrics will be summarized in tabular and graphical formats (run charts). No PHI will be shared outside the direct clinical registry.",
                discussionText: "",
                sustainability: "Handoff to incoming resident quality leaders; EMR tools will remain active; unit charge nurses will own daily audits.",
                ethical: "Minimal expected risk. This study constitutes quality improvement surveillance of standard healthcare delivery and does not expose patients to experimental therapies.",
                fundingNone: true,
                fundingDept: false,
                fundingGrant: false,
                fundingOther: false,
                fundingOtherText: "",
                stipendsNone: true,
                stipendsYes: false,
                stipendsText: "",
                materialsNeeded: "",
                dissemination: "QI presentation (5 minutes) at the local Quality Initiative Conference and abstract submission to GME Research Day.",
                references: "1. Standards for Quality Improvement Reporting Excellence (SQUIRE 2.0) guidelines.\n2. Institute for Healthcare Improvement (IHI) Quality Improvement Toolkit."
            };

            const registrationRequest = {
                title: title,
                category: formData.get('category') as string,
                subcategory: formData.get('subcategory') as string,
                proponents: Array.from(new Set([...proponentsArray, currentUserProfile.full_name])),
                lead_proponents: Array.from(new Set([...leadProponentsArray, currentUserProfile.full_name])),
                proponent_ids: selectedProponentIds.includes(currentUserProfile.id) ? selectedProponentIds : [...selectedProponentIds, currentUserProfile.id],
                lead_proponent_ids: selectedLeadIds.includes(currentUserProfile.id) ? selectedLeadIds : [...selectedLeadIds, currentUserProfile.id],
                faculty: finalFacultyName || null,
                faculty_id: finalFacultyId,
                smart_aim: primaryOutcome || null,
                squire_rationale: null,
                protocol_data: defaultProtocolData,
                mentor_approval_status: 'pending',
                gme_approval_status: 'pending',
                status: 'pending',
                created_by: currentUserProfile.id
            };

            const { data, error } = await supabase
                .from('project_registration_requests')
                .insert(registrationRequest)
                .select()
                .single();

            setIsSaving(false);
            if (error) {
                toast.error(error.message);
            } else {
                if (finalFacultyId) {
                    try {
                        await createNotification({
                            user_id: finalFacultyId,
                            type: 'general',
                            title: 'Assigned as Faculty Mentor',
                            message: `You have been assigned as the faculty mentor for the new project proposal: "${title}". Please review it and provide feedback.`,
                            project_id: data?.id
                        });
                    } catch (err) {
                        console.error("Failed to trigger proposal notification:", err);
                    }
                }
                toast.success("Project proposal submitted for sponsorship and GME approval! 🚀");
                router.push("/");
                router.refresh();
            }
            return;
        }

        const newProject = {
            title: title,
            status: formData.get('status') as any,
            category: formData.get('category') as string,
            subcategory: formData.get('subcategory') as string,
            faculty: finalFacultyName,
            faculty_id: finalFacultyId,
            proponents: proponentsArray,
            lead_proponents: leadProponentsArray,
            proponent_ids: selectedProponentIds,
            lead_proponent_ids: selectedLeadIds,
            primary_outcome: primaryOutcome,
            target_conference: formData.get('target_conference') as string || null,
            updates_and_barriers: updatesText,
            total_patients_impacted: parseInt(formData.get('total_patients_impacted') as string) || 0,
            estimated_cost_savings: parseFloat(formData.get('estimated_cost_savings') as string) || 0,
            abstract_summary: formData.get('abstract_summary') as string,
            last_updated_date: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('projects')
            .insert(newProject)
            .select()
            .single();

        setIsSaving(false);
        if (error) {
            toast.error(error.message);
        } else {
            if (finalFacultyId) {
                try {
                    await createNotification({
                        user_id: finalFacultyId,
                        type: 'general',
                        title: 'Assigned as Faculty Mentor',
                        message: `You have been assigned as the faculty mentor for the active project: "${title}".`,
                        project_id: data?.id
                    });
                } catch (err) {
                    console.error("Failed to trigger active project notification:", err);
                }
            }
            toast.success("Initiative created successfully!");
            // Trigger Email to Mentor
            const triggerEmail = async () => {
                try {
                    let mentorEmail = "";
                    const mentorId = finalFacultyId;
                    const mentorName = finalFacultyName;

                    if (mentorId) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('id', mentorId)
                            .single();
                        mentorEmail = (profile as any)?.email;
                    }

                    // Deliberately NOT guessing an address here. This used to build
                    // `First.Last@AdventHealth.com` from whatever name was typed and
                    // email it — which either bounced or, worse, reached a real
                    // colleague who had nothing to do with the project. If the mentor
                    // is not a linked profile with a known address, send nothing.
                    if (!mentorEmail && mentorName) {
                        console.info(
                            `No stored email for mentor "${mentorName}" — skipping notification. ` +
                            `Link them from the faculty dropdown to enable mentor emails.`
                        );
                    }

                    if (mentorEmail) {
                        await sendEmail(TEMPLATES.MENTOR_ASSIGNED, {
                            to_email: mentorEmail,
                            to_name: mentorName,
                            project_title: newProject.title,
                            message: `A new QI project "${newProject.title}" has been created and you have been assigned as the Faculty Mentor. Please log in to review the protocol.`
                        });
                    }
                } catch (e) {
                    console.error("Failed to send mentor email:", e);
                }
            };
            // Awaited on purpose: navigating away mid-flight cancelled the request,
            // so mentor emails were being dropped non-deterministically.
            // triggerEmail swallows its own errors, so this cannot block the redirect.
            await triggerEmail();

            if (data?.id) {
                // Straight into the protocol wizard: it is the next required step,
                // and the create page can only point at it, not open it.
                router.push(`/projects/view?id=${data.id}&protocol=1`);
                router.refresh();
            } else {
                // Insert reported success but returned no row — don't navigate to a
                // broken detail page with an undefined id.
                toast.error("Project saved, but its ID could not be read. Opening the project list instead.");
                router.push('/projects');
            }
        }
    };

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            <Link href="/projects" prefetch={false} className="flex items-center gap-2 text-slate-500 hover:text-advent-navy mb-6 transition-colors text-xs font-black uppercase tracking-widest group">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                Back to Masterlist
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create New Initiative</h1>
                <p className="text-slate-500 mt-1 text-sm font-semibold">Enter details below to scaffold and register a new Quality Improvement project.</p>
            </div>

            <PHIWarning />

            <form onSubmit={handleSubmit} noValidate className="space-y-10 mt-8">
                <div className="grid grid-cols-1 gap-10">

                    {/* Wizard progress. Steps are clickable so nothing is trapped:
                        every field stays mounted, so jumping around never loses data. */}
                    <nav aria-label="Project creation progress" className="bg-white border border-slate-200/80 rounded-3xl p-2 shadow-sm">
                        <ol className="flex flex-col sm:flex-row gap-1">
                            {WIZARD_STEPS.map((s, i) => {
                                const isCurrent = i === step;
                                const isDone = i < step;
                                return (
                                    <li key={s.label} className="flex-1">
                                        <button
                                            type="button"
                                            onClick={() => { setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            aria-current={isCurrent ? 'step' : undefined}
                                            className={`w-full text-left px-4 py-3 rounded-2xl transition-all ${
                                                isCurrent
                                                    ? 'bg-advent-navy text-white shadow-md'
                                                    : isDone
                                                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                                        : 'text-slate-400 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                                                    isCurrent ? 'bg-white/20 text-white'
                                                        : isDone ? 'bg-emerald-500 text-white'
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    {isDone ? '✓' : i + 1}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{s.label}</span>
                                            </span>
                                            <span className={`block mt-1 ml-7 text-[10px] font-medium ${isCurrent ? 'text-white/70' : 'text-slate-400'}`}>
                                                {s.hint}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>

                    {/* Validation summary. Individual fields only render errors for
                        title and category, so without this a failed PHI or SMART-Aim
                        check would block saving with nothing shown on screen. */}
                    {Object.keys(formErrors).length > 0 && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="bg-rose-50 border border-rose-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2"
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 mb-2">
                                {Object.keys(formErrors).length === 1
                                    ? "1 issue needs fixing before saving"
                                    : `${Object.keys(formErrors).length} issues need fixing before saving`}
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                {Object.entries(formErrors).map(([field, message]) => (
                                    <li key={field} className="text-xs font-semibold text-rose-700">{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* SECTION 1: CORE PROJECT METADATA */}
                    <Section title="Project Metadata" className={step === 0 ? "" : "hidden"} icon={<LayoutGrid className="w-5 h-5 text-advent-navy" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 ml-1">
                                    <label htmlFor="project-title-input" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                        Project Title <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleDuplicateCheck}
                                        disabled={isCheckingDuplicates}
                                        className="flex items-center gap-2 self-start text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-200/60 px-3 py-1.5 rounded-lg active:scale-[0.98] disabled:opacity-50 shadow-sm shadow-amber-500/5"
                                    >
                                        {isCheckingDuplicates ? <Loader2 className="w-3 h-3 animate-spin text-amber-600" /> : <Sparkles className="w-3 h-3 text-amber-600" />}
                                        Check Duplicates
                                    </button>
                                </div>
                                <input
                                    id="project-title-input"
                                    name="title"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Smoking Cessation in Outpatient Clinic"
                                    className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 text-slate-900 font-bold transition-all placeholder:text-slate-300 text-sm shadow-inner ${formErrors.title ? 'border-rose-500 focus:border-rose-500 bg-rose-50' : 'border-slate-200/80 focus:border-advent-navy'}`}
                                />
                                {formErrors.title && <p className="text-rose-500 text-xs font-bold mt-1 ml-1 animate-in fade-in">{formErrors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label htmlFor="status-select" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Initial Status</label>
                                    <select 
                                        id="status-select" 
                                        name="status" 
                                        className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm"
                                    >
                                        {PROJECT_STATUSES.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="category-select" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                                        Category <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                    <select
                                        id="category-select"
                                        name="category"
                                        required
                                        className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 text-slate-900 font-bold transition-all cursor-pointer text-sm ${formErrors.category ? 'border-rose-500 focus:border-rose-500 bg-rose-50' : 'border-slate-200/80 focus:border-advent-navy'}`}
                                    >
                                        <option value="">-- Select Category --</option>
                                        {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    {formErrors.category && <p className="text-rose-500 text-xs font-bold mt-1 ml-1 animate-in fade-in">{formErrors.category}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label htmlFor="subcategory-select" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Sub-Category</label>
                                    <select
                                        id="subcategory-select"
                                        name="subcategory"
                                        className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm"
                                    >
                                        <option value="">-- Select Sub-Category --</option>
                                        {PROJECT_SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="pdsa-input" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">PDSA Cycle Number</label>
                                    <input
                                        id="pdsa-input"
                                        type="number"
                                        name="pdsa_cycle"
                                        defaultValue={1}
                                        className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* SECTION 2: PROJECT TEAM & PEOPLE */}
                    <Section title="Proponents & Governance" className={step === 1 ? "" : "hidden"} icon={<Users className="w-5 h-5 text-emerald-500" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="space-y-5">
                                <div className="flex flex-col">
                                    <label htmlFor="faculty-name-select" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Faculty Mentor</label>
                                    <span className="text-[9px] text-slate-300 font-bold ml-1 italic mb-2">Faculty advisor guiding the academic charter</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select
                                            id="faculty-name-select"
                                            name="faculty_name"
                                            value={selectedFaculty}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedFaculty(val);
                                                
                                                if (val && val !== "Other") {
                                                    const cleanName = val.toLowerCase().replace(/^dr\.\s+/i, '');
                                                    const match = facultyProfiles.find(p => {
                                                        const cleanProfileName = p.full_name.toLowerCase().replace(/^dr\.\s+/i, '');
                                                        return cleanProfileName === cleanName || 
                                                               cleanProfileName.includes(cleanName) || 
                                                               cleanName.includes(cleanProfileName);
                                                    });
                                                    const selectEl = document.getElementById("faculty-id-select") as HTMLSelectElement;
                                                    if (selectEl) {
                                                        selectEl.value = match ? match.id : "";
                                                    }
                                                }
                                            }}
                                            className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm"
                                        >
                                            <option value="">-- Select Faculty Mentor --</option>
                                            {facultyDirectory.map(({ name }) => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                            <option value="Other">Other / Manual Entry...</option>
                                        </select>
                                        <select
                                            id="faculty-id-select"
                                            name="faculty_id"
                                            className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm"
                                        >
                                            <option value="">-- Link registered user account --</option>
                                            {facultyProfiles.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {selectedFaculty === 'Other' && (
                                        <div className="animate-in slide-in-from-top-1 duration-200">
                                            <input
                                                id="faculty-name-input-manual"
                                                name="faculty_name_manual"
                                                placeholder="Dr. Full Name (Enter custom name)"
                                                className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all placeholder:text-slate-350 text-sm shadow-inner"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-100 my-6" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* LEAD PROPONENTS */}
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <label htmlFor="lead-proponents-input" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Lead Proponents</label>
                                        <span className="text-[9px] text-slate-300 font-bold ml-1 italic mb-2">Principal investigators driving operations</span>
                                    </div>
                                    <input 
                                        id="lead-proponents-input"
                                        name="lead_proponents_text" 
                                        placeholder="Comma-separated manual names..." 
                                        className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 text-xs font-bold transition-all mb-2" 
                                    />
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Link Registered Members:</p>
                                        <div className="grid grid-cols-1 gap-1">
                                            {residentProfiles.map(p => (
                                                <label key={p.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLeadIds.includes(p.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedLeadIds([...selectedLeadIds, p.id]);
                                                            else setSelectedLeadIds(selectedLeadIds.filter(id => id !== p.id));
                                                        }}
                                                        className="w-4 h-4 rounded border-slate-300 text-advent-navy focus:ring-advent-navy"
                                                    />
                                                    <span className="text-xs font-bold text-slate-600 group-hover:text-advent-navy transition-colors">{p.full_name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ASSOCIATE PROPONENTS (TEAM MEMBERS) */}
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <label htmlFor="team-members-input" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Team Members</label>
                                        <span className="text-[9px] text-slate-300 font-bold ml-1 italic mb-2">Co-investigators and project collaborators</span>
                                    </div>
                                    <input 
                                        id="team-members-input"
                                        name="proponents_text" 
                                        placeholder="Comma-separated manual names..." 
                                        className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 text-xs font-bold transition-all mb-2" 
                                    />
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Link Registered Members:</p>
                                        <div className="grid grid-cols-1 gap-1">
                                            {residentProfiles.map(p => (
                                                <label key={p.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProponentIds.includes(p.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedProponentIds([...selectedProponentIds, p.id]);
                                                            else setSelectedProponentIds(selectedProponentIds.filter(id => id !== p.id));
                                                        }}
                                                        className="w-4 h-4 rounded border-slate-300 text-advent-navy focus:ring-advent-navy"
                                                    />
                                                    <span className="text-xs font-bold text-slate-600 group-hover:text-advent-navy transition-colors">{p.full_name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* SECTION 3: STRATEGIC AIMS & OUTCOMES */}
                    <Section title="Strategic Aims & Outcomes" className={step === 2 ? "" : "hidden"} icon={<TrendingUp className="w-5 h-5 text-advent-navy" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 ml-1">
                                    <div className="flex flex-col">
                                        <label htmlFor="primary-outcome-textarea" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                            Primary Outcome Goal (SMART Aim)
                                        </label>
                                        <span className="text-[9px] text-slate-300 font-bold italic">Should be Specific, Measurable, Achievable, Relevant, and Time-bound</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleMakeSMART}
                                        disabled={isPolishingAim}
                                        className="flex items-center gap-2 self-start text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-100 px-4 py-2 rounded-xl active:scale-[0.98] shadow-sm shadow-emerald-500/5 disabled:opacity-50"
                                    >
                                        {isPolishingAim ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                                        Make SMART
                                    </button>
                                </div>
                                <textarea
                                    id="primary-outcome-textarea"
                                    name="primary_outcome"
                                    value={primaryOutcome}
                                    onChange={(e) => setPrimaryOutcome(e.target.value)}
                                    placeholder="e.g., By June 2024, decrease the rate of inpatient falls by 20% on Unit 4N..."
                                    className="w-full p-5 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all min-h-[120px] resize-none text-sm placeholder:text-slate-300"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label htmlFor="patients-impacted-input" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        Patients Impacted
                                        <Users className="w-3 h-3 text-slate-400" />
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="patients-impacted-input"
                                            type="number"
                                            name="total_patients_impacted"
                                            placeholder="Estimated count..."
                                            className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all pl-12 text-sm"
                                        />
                                        <Users className="absolute left-4 top-4 w-4 h-4 text-slate-300 group-focus-within:text-advent-navy transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label htmlFor="cost-savings-input" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        Estimated Cost Savings
                                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                                    </label>
                                    <div className="relative group">
                                        <input
                                            id="cost-savings-input"
                                            type="number"
                                            name="estimated_cost_savings"
                                            step="0.01"
                                            placeholder="Annualized savings..."
                                            className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all pl-12 text-sm"
                                        />
                                        <span className="absolute left-4 top-3.5 text-base font-black text-slate-300 group-focus-within:text-emerald-500 transition-colors">$</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* SECTION 4: ACADEMIC TARGET & PUBLICATION */}
                    <Section title="Academic Pathway & Dissemination" className={step === 3 ? "" : "hidden"} icon={<Trophy className="w-5 h-5 text-amber-500" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="space-y-3">
                                <label htmlFor="conference-select" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Target Conference Venue</label>
                                <select
                                    id="conference-select"
                                    name="target_conference"
                                    className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm"
                                >
                                    <option value="">-- Select Target Venue --</option>
                                    {CONFERENCE_OPTIONS.map(conf => (
                                        <option key={conf.id} value={conf.id}>{conf.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    Abstract Summary
                                </label>
                                <textarea
                                    id="abstract-textarea"
                                    name="abstract_summary"
                                    placeholder="Draft your executive summary or abstract here..."
                                    className="w-full p-5 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all min-h-[160px] resize-none text-sm placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* SECTION 5: UPDATES & BARRIERS */}
                    <Section title="Updates and Barriers" className={step === 3 ? "" : "hidden"} icon={<Info className="w-5 h-5 text-sky-500" />}>
                        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                             <AIUpdateSection initialValue="" onChange={setUpdatesText} />
                        </div>
                    </Section>

                    {/* SECTION 6: INSTITUTIONAL DEPOT */}
                    <Section title="Project Depot (Protocols)" className={step === 3 ? "" : "hidden"} icon={<Save className="w-5 h-5 text-slate-400" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Protocol Template</span>
                                        <p className="text-xs text-slate-500 font-medium italic leading-relaxed">Download the institutional QI template to ensure compliance with AdventHealth standards.</p>
                                    </div>
                                    <a
                                        href="/QI_Tracker/templates/QI_Project_Protocol_Template_AdventHealth_IMGME_Tampa.docx"
                                        download
                                        className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-white border border-slate-200/80 hover:border-slate-300 text-advent-navy rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm group active:scale-[0.98] mt-4"
                                    >
                                        <FileDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                        Download Template
                                    </a>
                                </div>

                                <div className="p-6 bg-emerald-50/20 border border-emerald-100 rounded-2xl space-y-4 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Protocol AI Assistant</span>
                                        <p className="text-xs text-emerald-800/80 font-medium italic leading-relaxed">The 14-section protocol wizard opens automatically once you save, with the template&apos;s guidance built into every section.</p>
                                    </div>
                                    {/* Deliberately not a button. It used to be clickable and its only
                                        behaviour was a modal saying it was locked - a dead end that
                                        looked like a feature. Saving now redirects straight into it. */}
                                    <div
                                        aria-hidden="true"
                                        className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-white/50 border border-dashed border-emerald-200 text-emerald-700/60 rounded-xl text-xs font-black uppercase tracking-widest mt-4 select-none"
                                    >
                                        <Sparkles className="w-4 h-4 text-emerald-500/60" />
                                        Opens after you save
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* STICKY BOTTOM ACTIONS FOOTER */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/60 px-6 py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center animate-in slide-in-from-bottom duration-300">
                    <div className="w-full max-w-4xl flex items-center justify-between">
                        {step === 0 ? (
                            <Link
                                href="/projects"
                                className="px-6 py-3 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all hover:border-slate-300 active:scale-95"
                            >
                                Cancel
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => { setStep(s => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all hover:border-slate-300 active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        )}

                        <div className="flex items-center gap-3">
                            <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Step {step + 1} of {WIZARD_STEPS.length}
                            </span>

                            {step < WIZARD_STEPS.length - 1 && (
                                <button
                                    type="button"
                                    onClick={() => { setStep(s => Math.min(WIZARD_STEPS.length - 1, s + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="flex items-center gap-2.5 bg-advent-navy hover:bg-advent-cobalt text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-advent-navy/10 active:scale-95 transition-all"
                                >
                                    Continue
                                </button>
                            )}

                        <button
                            id="create-project-submit"
                            type="submit"
                            disabled={isSaving}
                            hidden={step < WIZARD_STEPS.length - 1}
                            className="flex items-center gap-2.5 bg-advent-navy hover:bg-advent-cobalt text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-advent-navy/10 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 text-white" />
                                    Save Initiative
                                </>
                            )}
                        </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Custom Modal Confirmation Dialog */}
            <CustomConfirmDialog
                isOpen={dialogState.isOpen}
                title={dialogState.title}
                message={dialogState.message}
                confirmLabel={dialogState.confirmLabel}
                cancelLabel={dialogState.cancelLabel}
                onConfirm={dialogState.onConfirm || (() => setDialogState(prev => ({ ...prev, isOpen: false })))}
                onCancel={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
                variant={dialogState.variant}
            />
        </div>
    )
}
