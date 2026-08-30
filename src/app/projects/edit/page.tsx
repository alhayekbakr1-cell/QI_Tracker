"use client"

import { createClient } from "@/utils/supabase/client";
import { AUTH_BYPASS, DEV_USER } from "@/utils/auth/devBypass";
import { useRouter, useSearchParams } from "next/navigation";
import { Project } from "@/types";
import PHIWarning from "@/components/PHIWarning";
import { ArrowLeft, Save, Sparkles, Loader2, LayoutGrid, Users, Target, TrendingUp, Trophy, Info, FileText, FileDown, RefreshCw, ChevronDown, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import FileUploader from "@/components/FileUploader";
import Section from "@/components/Section";
import { useEffect, useState, useTransition, Suspense } from "react";
import { PROJECT_CATEGORIES, PROJECT_SUBCATEGORIES, CONFERENCE_OPTIONS, PROJECT_STATUSES } from "@/constants/projectData";
import { draftSummary, auditProjectQuality, suggestMetrics, generateSMARTAim } from "@/utils/ai";
import { toast, CustomConfirmDialog, Skeleton } from "@/components/ui/custom-ui";
import { createNotification } from "@/utils/createNotification";

const FACULTY_MENTORS_PRESET = [
  "Dr. Lidia Sepulveda Rubiera",
  "Dr. Claudia Kroker-Bode (Dr. KB)",
  "Dr. Anna Hadid",
  "Dr. Muhammad Anwar",
  "Dr. Sara Bibi",
  "Dr. Thomas Carson",
  "Dr. Asha Ramsakal",
  "Dr. Faheem Ahmad",
  "Dr. Mounica Banala",
  "Dr. Ryan Brink",
  "Dr. Raja Ramesh Gummalla",
  "Dr. Carlos Santos De Jesus",
  "Dr. James Vernace",
  "Dr. Christopher Yanichko"
];

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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Updates and Barriers</label>
                    <span className="text-[10px] text-slate-300 font-bold italic">Quick bullet points or active barriers</span>
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
                name="updates_and_barriers"
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    onChange(e.target.value);
                }}
                placeholder="Enter bullet points (e.g. - IRB approved, - Data collection started) then click 'Draft with AI'..."
                className="w-full p-5 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all min-h-[150px] resize-none text-sm placeholder:text-slate-300 shadow-inner"
            />
        </div>
    );
}

function AIAuditCard({ project }: { project: any }) {
    const [audit, setAudit] = useState<{ score: number, feedback: string } | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);

    const runAudit = async () => {
        setIsAuditing(true);
        try {
            const result = await auditProjectQuality(project);
            const scoreMatch = result.match(/(\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[0]) : 70;
            const feedback = result.replace(/Quality Score: \d+\.?\s*/i, '');
            setAudit({ score, feedback });
            toast.success("AI quality audit completed successfully!");
        } catch (error: any) {
            console.error("Audit failed:", error);
            toast.error("AI Audit failed. Check your API settings.");
        } finally {
            setIsAuditing(false);
        }
    };

    return (
        <div className="bg-advent-navy/5 border border-advent-navy/10 rounded-3xl p-6 space-y-4 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center text-advent-navy">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-advent-navy" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">AI Quality Audit</h3>
                </div>
                <button
                    type="button"
                    onClick={runAudit}
                    disabled={isAuditing}
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-white hover:bg-slate-50 transition-all border border-advent-navy/10 px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-50 shadow-sm"
                >
                    {isAuditing ? <Loader2 className="w-3 h-3 animate-spin text-advent-navy" /> : <RefreshCw className="w-3 h-3 text-advent-navy" />}
                    {audit ? "Re-Audit" : "Run Audit"}
                </button>
            </div>

            {audit && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-advent-navy/10">
                        <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="28" cy="28" r="24"
                                    fill="none" stroke="currentColor" strokeWidth="3"
                                    className="text-slate-100"
                                />
                                <circle
                                    cx="28" cy="28" r="24"
                                    fill="none" stroke="currentColor" strokeWidth="3"
                                    strokeDasharray="150.8"
                                    strokeDashoffset={150.8 - (150.8 * audit.score) / 100}
                                    className={audit.score > 80 ? 'text-emerald-500' : audit.score > 50 ? 'text-amber-500' : 'text-rose-500'}
                                />
                            </svg>
                            <span className="absolute text-xs font-black text-slate-800">{audit.score}%</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score Assessment</h4>
                            <p className="text-[11px] text-slate-600 font-bold leading-normal italic mt-0.5">
                                &quot;{audit.feedback}&quot;
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!audit && !isAuditing && (
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center py-2 italic">
                    Analyze project completeness and audit GME academic requirements.
                </p>
            )}
        </div>
    );
}

function MetricSuggester({ title }: { title: string }) {
    const [suggestions, setSuggestions] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const getSuggestions = async () => {
        if (!title) {
            toast.warning("Title is empty.");
            return;
        }
        setIsGenerating(true);
        try {
            const raw = await suggestMetrics(title);
            setSuggestions(raw);
            toast.success("AI Metrics generated!");
        } catch (error) {
            console.error("Metric suggestion error:", error);
            toast.error("AI metrics suggestion failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mt-4 space-y-4">
            <button
                type="button"
                onClick={getSuggestions}
                disabled={isGenerating}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-advent-navy bg-advent-navy/5 px-4 py-2 rounded-xl hover:bg-advent-navy/10 transition-all border border-advent-navy/10 disabled:opacity-50 active:scale-95"
            >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Get AI Suggested Metrics
            </button>

            {suggestions && (
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[9px] font-black text-advent-navy uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Suggested Metrics
                    </p>
                    <div className="text-xs text-slate-600 font-bold whitespace-pre-wrap leading-relaxed">
                        {suggestions}
                    </div>
                </div>
            )}
        </div>
    );
}

function EditProjectContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [project, setProject] = useState<Project | null>(null);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [selectedProponentIds, setSelectedProponentIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [updatesText, setUpdatesText] = useState("");
    const [primaryOutcome, setPrimaryOutcome] = useState("");
    const [title, setTitle] = useState("");
    const [isPolishingAim, setIsPolishingAim] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState("");

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
        if (!id) {
            router.push("/projects");
            return;
        }

        async function fetchData() {
            const { data: { user: authedUser } } = await supabase.auth.getUser();
            const user = authedUser ?? (AUTH_BYPASS ? (DEV_USER as any) : null);
            if (!user) {
                router.push("/login");
                return;
            }

            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !data) {
                router.push("/404");
                return;
            }

            const proj = data as Project;
            setProject(proj);
            setTitle(proj.title);
            setPrimaryOutcome(proj.primary_outcome || "");
            setUpdatesText(proj.updates_and_barriers || "");
            setSelectedLeadIds(proj.lead_proponent_ids || []);
            setSelectedProponentIds(proj.proponent_ids || []);
            if (proj.faculty) {
                const isPreset = FACULTY_MENTORS_PRESET.includes(proj.faculty);
                setSelectedFaculty(isPreset ? proj.faculty : "Other");
            } else {
                setSelectedFaculty("");
            }

            // Fetch all profiles
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .order('full_name');
            setAllProfiles(profiles || []);

            // Deleting a project is restricted to programme staff in RLS. Without
            // knowing the role here the button rendered for everyone, so residents
            // saw a Delete control that could only ever fail with a policy error.
            setCurrentUserRole(profiles?.find((p: any) => p.id === user.id)?.role ?? null);

            setIsLoading(false);
        }

        fetchData();
    }, [id, supabase, router]);

    const facultyProfiles = allProfiles.filter(p => p.role === 'Faculty' || p.role === 'Admin' || p.role === 'Operator');
    const residentProfiles = allProfiles.filter(p => p.role !== 'Faculty' && p.role !== 'Admin' && p.role !== 'Operator');

    const handleMakeSMART = async () => {
        if (!title) {
            toast.warning("Please enter a title first.");
            return;
        }
        setIsPolishingAim(true);
        try {
            const smart = await generateSMARTAim(title, primaryOutcome);
            setPrimaryOutcome(smart);
            toast.success("Aim polished into SMART target!");
        } catch (e: any) {
            toast.error("AI Error: " + e.message);
        } finally {
            setIsPolishingAim(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!project || !id) return;
        setIsSaving(true);

        const formData = new FormData(e.currentTarget);

        const proponentsText = formData.get('proponents_text') as string;
        const leadProponentsText = formData.get('lead_proponents_text') as string;

        const manualProponents = proponentsText ? proponentsText.split(',').map(s => s.trim()).filter(Boolean) : [];
        const manualLeads = leadProponentsText ? leadProponentsText.split(',').map(s => s.trim()).filter(Boolean) : [];

        const linkedProponentNames = allProfiles.filter(p => selectedProponentIds.includes(p.id)).map(p => p.full_name);
        const linkedLeadNames = allProfiles.filter(p => selectedLeadIds.includes(p.id)).map(p => p.full_name);

        let facultyName = formData.get('faculty_name') as string || "";
        if (facultyName === "Other") {
            facultyName = formData.get('faculty_name_manual') as string || "";
        }
        const facultyId = formData.get('faculty_id') === "" ? null : formData.get('faculty_id') as string;

        let finalFacultyId = facultyId;
        let finalFacultyName = facultyName;

        if (finalFacultyId) {
            const matchingProfile = facultyProfiles.find(p => p.id === finalFacultyId);
            if (matchingProfile) {
                finalFacultyName = matchingProfile.full_name;
            }
        } else if (finalFacultyName.trim()) {
            const cleanName = finalFacultyName.trim().toLowerCase().replace(/^dr\.\s+/i, '');
            const matchingProfile = facultyProfiles.find(p => {
                const cleanProfileName = p.full_name.toLowerCase().replace(/^dr\.\s+/i, '');
                return cleanProfileName === cleanName || 
                       cleanProfileName.includes(cleanName) || 
                       cleanName.includes(cleanProfileName);
            });
            if (matchingProfile) {
                finalFacultyId = matchingProfile.id;
                finalFacultyName = matchingProfile.full_name;
            }
        }

        const updates = {
            title: title,
            status: formData.get('status') as any,
            category: formData.get('category') as string,
            subcategory: formData.get('subcategory') as string,
            pdsa_cycle: parseInt(formData.get('pdsa_cycle') as string) || 1,
            faculty: finalFacultyName,
            faculty_id: finalFacultyId,
            primary_outcome: primaryOutcome,
            proponents: Array.from(new Set([...manualProponents, ...linkedProponentNames])),
            lead_proponents: Array.from(new Set([...manualLeads, ...linkedLeadNames])),
            proponent_ids: selectedProponentIds,
            lead_proponent_ids: selectedLeadIds,
            updates_and_barriers: updatesText,
            target_conference: formData.get('target_conference') as string || null,
            total_patients_impacted: parseInt(formData.get('total_patients_impacted') as string) || 0,
            estimated_cost_savings: parseFloat(formData.get('estimated_cost_savings') as string) || 0,
            abstract_summary: formData.get('abstract_summary') as string,
            last_updated_date: new Date().toISOString(),
        };

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || null;

        const fieldsToTrack = [
            'title',
            'status',
            'category',
            'subcategory',
            'pdsa_cycle',
            'faculty',
            'faculty_id',
            'primary_outcome',
            'updates_and_barriers',
            'target_conference',
            'total_patients_impacted',
            'estimated_cost_savings',
            'abstract_summary'
        ] as const;

        const logsToInsert: any[] = [];
        for (const field of fieldsToTrack) {
            const oldValue = project[field];
            const newValue = updates[field];

            let isChanged = false;
            if (field === 'estimated_cost_savings' || field === 'total_patients_impacted' || field === 'pdsa_cycle') {
                const oldNum = Number(oldValue) || 0;
                const newNum = Number(newValue) || 0;
                isChanged = oldNum !== newNum;
            } else {
                const oldStr = (oldValue === null || oldValue === undefined) ? '' : String(oldValue).trim();
                const newStr = (newValue === null || newValue === undefined) ? '' : String(newValue).trim();
                isChanged = oldStr !== newStr;
            }

            if (isChanged) {
                logsToInsert.push({
                    project_id: id,
                    user_id: userId,
                    field_name: field,
                    old_value: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
                    new_value: newValue !== null && newValue !== undefined ? String(newValue) : null,
                    action: 'UPDATE'
                });
            }
        }

        const { error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id);

        if (!error && logsToInsert.length > 0) {
            const { error: logError } = await supabase
                .from('audit_logs')
                .insert(logsToInsert);
            if (logError) {
                console.error("Failed to insert audit logs:", logError);
            }
        }

        setIsSaving(false);
        if (error) {
            toast.error(error.message);
        } else {
            if (updates.faculty_id && updates.faculty_id !== project.faculty_id) {
                try {
                    await createNotification({
                        user_id: updates.faculty_id,
                        type: 'general',
                        title: 'Assigned as Faculty Mentor',
                        message: `You have been assigned as the faculty mentor for the project: "${updates.title}". Please review it and provide feedback.`,
                        project_id: id
                    });
                } catch (notifyError) {
                    console.error("Assignment notification error:", notifyError);
                }
            }
            toast.success("Initiative updated successfully!");
            router.push(`/projects/view?id=${id}`);
            router.refresh();
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const { error } = await supabase.from('projects').delete().eq('id', id!);
        setIsDeleting(false);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Initiative deleted successfully.");
            router.push('/projects');
            router.refresh();
        }
    };

    const confirmDeleteWorkflow = () => {
        setDialogState({
            isOpen: true,
            title: "Delete Initiative",
            message: "Are you sure you want to delete this Quality Improvement project? This will permanently wipe all PDSA logs, metrics, files, and audit records. This action cannot be undone.",
            confirmLabel: "Delete permanently",
            cancelLabel: "Cancel",
            variant: "danger",
            onConfirm: () => {
                setDialogState(prev => ({ ...prev, isOpen: false }));
                handleDelete();
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-40 md:col-span-2" />
                    <Skeleton className="h-40 md:col-span-1" />
                </div>
                <Skeleton className="h-80 w-full" />
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            <Link href={`/projects/view?id=${id}`} prefetch={false} className="flex items-center gap-2 text-slate-500 hover:text-advent-navy mb-6 transition-colors text-xs font-black uppercase tracking-widest group">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                Back to Details
            </Link>

            <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Edit Initiative</h1>
                    <p className="text-slate-500 mt-1 text-sm font-semibold">Make amendments below to audit logs and live PDSA operations.</p>
                </div>

                {(currentUserRole === 'Admin' || currentUserRole === 'Operator') && (
                    <DeleteProjectButton onClick={confirmDeleteWorkflow} isPending={isDeleting} />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
                <div className="lg:col-span-2">
                    <PHIWarning />
                </div>
                <div className="lg:col-span-1">
                    <AIAuditCard project={{ ...project, title, primary_outcome: primaryOutcome }} />
                </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-10">
                <div className="grid grid-cols-1 gap-10">
                    
                    {/* CORE PROJECT METADATA */}
                    <Section title="Core Initiative Information" icon={<LayoutGrid className="w-5 h-5 text-advent-navy" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    Project Title <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <input
                                    name="title"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Smoking Cessation in Outpatient Clinic"
                                    className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all text-sm shadow-inner"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Current Status</label>
                                    <div className="relative">
                                        <select
                                            name="status"
                                            defaultValue={project.status}
                                            className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm appearance-none"
                                        >
                                            {PROJECT_STATUSES.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                        Primary Category <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        defaultValue={project.category || ''}
                                        className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm"
                                    >
                                        <option value="">-- Select Category --</option>
                                        {project.category && !PROJECT_CATEGORIES.includes(project.category) && (
                                            <option value={project.category}>{project.category} (Legacy)</option>
                                        )}
                                        {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sub-Specialty Focus</label>
                                    <select
                                        name="subcategory"
                                        defaultValue={project.subcategory || ''}
                                        className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm"
                                    >
                                        <option value="">-- Select Sub-Category --</option>
                                        {project.subcategory && !PROJECT_SUBCATEGORIES.includes(project.subcategory) && (
                                            <option value={project.subcategory}>{project.subcategory} (Legacy)</option>
                                        )}
                                        {PROJECT_SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">PDSA Cycle Iteration</label>
                                    <input
                                        type="number"
                                        name="pdsa_cycle"
                                        defaultValue={project.pdsa_cycle || 1}
                                        className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* PROJECT STAKEHOLDERS (TEAM) */}
                    <Section title="Project Stakeholders" icon={<Users className="w-5 h-5 text-emerald-500" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="space-y-5">
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Faculty Mentor</label>
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
                                                    const selectEl = document.getElementsByName("faculty_id")[0] as HTMLSelectElement;
                                                    if (selectEl) {
                                                        selectEl.value = match ? match.id : "";
                                                    }
                                                }
                                            }}
                                            className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm"
                                        >
                                            <option value="">-- Select Faculty Mentor --</option>
                                            {FACULTY_MENTORS_PRESET.map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                            <option value="Other">Other / Manual Entry...</option>
                                        </select>
                                        <select
                                            name="faculty_id"
                                            defaultValue={project.faculty_id || ""}
                                            className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm"
                                        >
                                            <option value="">-- No Account Linked --</option>
                                            {facultyProfiles.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {(selectedFaculty === 'Other' || (project.faculty && !FACULTY_MENTORS_PRESET.includes(project.faculty) && selectedFaculty === 'Other')) && (
                                        <div className="animate-in slide-in-from-top-1 duration-200">
                                            <input
                                                id="faculty-name-input-manual"
                                                name="faculty_name_manual"
                                                placeholder="Dr. Full Name (Enter custom name)"
                                                defaultValue={FACULTY_MENTORS_PRESET.includes(project.faculty || '') ? '' : (project.faculty || '')}
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
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lead Investigators</label>
                                        <span className="text-[9px] text-slate-300 font-bold ml-1 italic mb-2">Principal investigators driving operations</span>
                                    </div>
                                    <input 
                                        name="lead_proponents_text" 
                                        placeholder="Comma-separated manual names..." 
                                        defaultValue={(project.lead_proponents || []).filter(name => !allProfiles.some(p => p.full_name === name && selectedLeadIds.includes(p.id))).join(', ')}
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

                                {/* TEAM MEMBERS */}
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Team Members</label>
                                        <span className="text-[9px] text-slate-300 font-bold ml-1 italic mb-2">Collaborators and assistants on team</span>
                                    </div>
                                    <input 
                                        name="proponents_text" 
                                        placeholder="Comma-separated manual names..." 
                                        defaultValue={(project.proponents || []).filter(name => !allProfiles.some(p => p.full_name === name && selectedProponentIds.includes(p.id))).join(', ')}
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

                    {/* STRATEGIC AIMS & OUTCOMES */}
                    <Section title="Strategic Aims & Outcomes" icon={<TrendingUp className="w-5 h-5 text-advent-navy" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 ml-1">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
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
                                        Optimize Aim
                                    </button>
                                </div>
                                <textarea
                                    name="primary_outcome"
                                    value={primaryOutcome}
                                    onChange={(e) => setPrimaryOutcome(e.target.value)}
                                    placeholder="Describe the main outcome of this project..."
                                    className="w-full p-5 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all min-h-[120px] resize-none text-sm placeholder:text-slate-300"
                                />

                                {/* DYNAMIC INTEGRATION: AI Metric Suggester directly in the Outcome Panel */}
                                <MetricSuggester title={title} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        Patients Impacted
                                        <Users className="w-3 h-3 text-slate-400" />
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            name="total_patients_impacted"
                                            defaultValue={project.total_patients_impacted || 0}
                                            placeholder="Estimated count..."
                                            className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all pl-12 text-sm"
                                        />
                                        <Users className="absolute left-4 top-4 w-4 h-4 text-slate-300 group-focus-within:text-advent-navy transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        Estimated Cost Savings ($)
                                        <Target className="w-3 h-3 text-slate-400" />
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            name="estimated_cost_savings"
                                            step="0.01"
                                            defaultValue={project.estimated_cost_savings || 0}
                                            placeholder="Annualized savings..."
                                            className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all pl-12 text-sm"
                                        />
                                        <span className="absolute left-4 top-3.5 text-base font-black text-slate-300 group-focus-within:text-emerald-500 transition-colors">$</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* ACADEMIC TARGET & PUBLICATION */}
                    <Section title="Academic Pathway & Dissemination" icon={<Trophy className="w-5 h-5 text-amber-500" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Conference Pathway</label>
                                <div className="relative">
                                    <select
                                        name="target_conference"
                                        defaultValue={project.target_conference || ""}
                                        className="w-full p-4 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all cursor-pointer text-sm appearance-none"
                                    >
                                        <option value="">-- No Conference Targeted --</option>
                                        {CONFERENCE_OPTIONS.map(conf => (
                                            <option key={conf.id} value={conf.id}>{conf.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    Abstract Summary
                                </label>
                                <textarea
                                    name="abstract_summary"
                                    defaultValue={project.abstract_summary || ''}
                                    placeholder="Draft your executive summary or abstract here..."
                                    className="w-full p-5 bg-slate-50 border border-slate-200/80 rounded-2xl outline-none focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy text-slate-900 font-bold transition-all min-h-[160px] resize-none text-sm placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* UPDATES & BARRIERS */}
                    <Section title="Updates and Barriers" icon={<Info className="w-5 h-5 text-sky-500" />}>
                        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                             <AIUpdateSection initialValue={updatesText} onChange={setUpdatesText} />
                        </div>
                    </Section>

                    {/* PROJECT DEPOT */}
                    <Section title="Project Depot" icon={<FileText className="w-5 h-5 text-slate-400" />}>
                        <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Protocol Template</span>
                                            <a
                                                href="/QI_Tracker/templates/QI_Project_Protocol_Template_AdventHealth_IMGME_Tampa.docx"
                                                download
                                                className="flex items-center gap-1.5 text-advent-navy text-[9px] font-black uppercase tracking-widest hover:underline"
                                            >
                                                <FileDown className="w-3.5 h-3.5" />
                                                Get doc
                                            </a>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed">Required standard institutional GME Protocol form.</p>
                                    </div>
                                    <div className="mt-4">
                                        <FileUploader
                                            projectId={id!}
                                            fieldName="protocol_url"
                                            currentUrl={project.protocol_url}
                                            onUploadComplete={(url) => setProject({ ...project, protocol_url: url })}
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Presentation Template</span>
                                            <a
                                                href="/QI_Tracker/templates/AdventHealth IM GME QI Template.pptx"
                                                download
                                                className="flex items-center gap-1.5 text-advent-navy text-[9px] font-black uppercase tracking-widest hover:underline"
                                            >
                                                <FileDown className="w-3.5 h-3.5" />
                                                Get pptx
                                            </a>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed">AdventHealth corporate branded .pptx template.</p>
                                    </div>
                                    <div className="mt-4">
                                        <FileUploader
                                            projectId={id!}
                                            fieldName="presentation_url"
                                            currentUrl={project.presentation_url}
                                            onUploadComplete={(url) => setProject({ ...project, presentation_url: url })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* STICKY BOTTOM ACTIONS FOOTER */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/60 px-6 py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center animate-in slide-in-from-bottom duration-300">
                    <div className="w-full max-w-4xl flex items-center justify-between">
                        <Link 
                            href={`/projects/view?id=${id}`} 
                            className="px-6 py-3 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all hover:border-slate-300 active:scale-95"
                        >
                            Cancel
                        </Link>
                        
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2.5 bg-advent-navy hover:bg-advent-cobalt text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-advent-navy/10 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 text-white" />
                                    Save Changes
                                </>
                            )}
                        </button>
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

export default function EditProjectPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-slate-250 rounded-xl" />
                        <div className="h-4 w-72 bg-slate-200 rounded-lg" />
                    </div>
                </div>
                <div className="h-40 bg-slate-100 rounded-3xl" />
                <div className="h-80 bg-slate-100 rounded-[2.5rem]" />
            </div>
        }>
            <EditProjectContent />
        </Suspense>
    );
}
