"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Project } from "@/types";
import PHIWarning from "@/components/PHIWarning";
import { ArrowLeft, Save, Sparkles, Loader2, LayoutGrid, Users, Target, TrendingUp, Trophy, Layers, Info, FileText, FileDown, RefreshCw, ChevronDown } from "lucide-react";
import Link from "next/link";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import FileUploader from "@/components/FileUploader";
import Section from "@/components/Section";
import { useEffect, useState } from "react";
import { PROJECT_CATEGORIES, PROJECT_SUBCATEGORIES, CONFERENCE_OPTIONS, PROJECT_STATUSES } from "@/constants/projectData";
import { draftSummary, auditProjectQuality, suggestMetrics, generateSMARTAim } from "@/utils/ai";


function AIUpdateSection({ initialValue }: { initialValue: string }) {
    const [value, setValue] = useState(initialValue);
    const [isDrafting, setIsDrafting] = useState(false);

    const handleAIDraft = async () => {
        if (!value || value.length < 10) {
            alert("Please enter some bullet points or notes first to help the AI draft a summary.");
            return;
        }
        setIsDrafting(true);
        try {
            const drafted = await draftSummary(value);
            setValue(drafted);
        } catch (error: any) {
            console.error("AI Drafting error:", error);
            alert(`AI Drafting failed: ${error.message || "Unknown error"}. Check Supabase or GEMINI_API_KEY.`);
        } finally {
            setIsDrafting(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Updates and Barriers</label>
                <button
                    type="button"
                    onClick={handleAIDraft}
                    disabled={isDrafting}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-advent-navy bg-advent-navy/5 px-3 py-1.5 rounded-lg hover:bg-advent-navy/10 transition-all border border-advent-navy/10 disabled:opacity-50"
                >
                    {isDrafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Draft with AI
                </button>
            </div>
            <textarea
                name="updates_and_barriers"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter bullet points (e.g. - IRB approved, - Data collection started) then click 'Draft with AI'..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all min-h-[150px] resize-none"
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
        } catch (error) {
            console.error("Audit failed:", error);
        } finally {
            setIsAuditing(false);
        }
    };

    return (
        <div className="bg-advent-navy/5 border border-advent-navy/10 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center text-advent-navy">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="text-xs font-black uppercase tracking-widest">AI Quality Assessment</h3>
                </div>
                <button
                    type="button"
                    onClick={runAudit}
                    disabled={isAuditing}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-advent-navy/20 hover:bg-advent-navy/5 transition-all disabled:opacity-50"
                >
                    {isAuditing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {audit ? "Re-Audit" : "Run AI Audit"}
                </button>
            </div>

            {audit && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle
                                    cx="32" cy="32" r="28"
                                    fill="none" stroke="currentColor" strokeWidth="4"
                                    className="text-slate-200"
                                />
                                <circle
                                    cx="32" cy="32" r="28"
                                    fill="none" stroke="currentColor" strokeWidth="4"
                                    strokeDasharray="176"
                                    strokeDashoffset={176 - (176 * audit.score) / 100}
                                    className={audit.score > 80 ? 'text-emerald-500' : audit.score > 50 ? 'text-amber-500' : 'text-red-500'}
                                />
                            </svg>
                            <span className="absolute text-sm font-black text-slate-900">{audit.score}</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-slate-600 font-bold leading-relaxed italic">
                                &quot;{audit.feedback}&quot;
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!audit && !isAuditing && (
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">
                    Click to analyze project completeness and quality
                </p>
            )}
        </div>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

function MetricSuggester({ title, onSelect }: { title: string, onSelect: (val: string) => void }) {
    const [suggestions, setSuggestions] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const getSuggestions = async () => {
        setIsGenerating(true);
        try {
            const raw = await suggestMetrics(title);
            setSuggestions(raw);
        } catch (error) {
            console.error("Metric suggestion error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={getSuggestions}
                disabled={isGenerating}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-advent-blue bg-advent-blue/5 px-4 py-2 rounded-xl hover:bg-advent-blue/10 transition-all border border-advent-blue/10 disabled:opacity-50"
            >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Get AI Suggested Metrics
            </button>

            {suggestions && (
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-3">AI Recommendations</p>
                    <div className="text-xs text-slate-600 font-bold whitespace-pre-wrap leading-relaxed">
                        {suggestions}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EditProjectPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [project, setProject] = useState<Project | null>(null);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [selectedProponentIds, setSelectedProponentIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (!id) {
            router.push("/projects");
            return;
        }

        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
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
            setSelectedLeadIds(proj.lead_proponent_ids || []);
            setSelectedProponentIds(proj.proponent_ids || []);

            // Fetch all profiles
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .order('full_name');
            setAllProfiles(profiles || []);

            setIsLoading(false);
        }

        fetchData();
    }, [id, supabase, router]);

    const facultyProfiles = allProfiles.filter(p => p.role === 'Faculty' || p.role === 'Admin');
    const residentProfiles = allProfiles.filter(p => p.role !== 'Faculty' && p.role !== 'Admin');

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!project || !id) return;
        setIsSaving(true);

        const formData = new FormData(e.currentTarget);

        // Combine manual names and linked profiles for labels
        const proponentsText = formData.get('proponents_text') as string;
        const leadProponentsText = formData.get('lead_proponents_text') as string;

        const manualProponents = proponentsText ? proponentsText.split(',').map(s => s.trim()).filter(Boolean) : [];
        const manualLeads = leadProponentsText ? leadProponentsText.split(',').map(s => s.trim()).filter(Boolean) : [];

        const linkedProponentNames = allProfiles.filter(p => selectedProponentIds.includes(p.id)).map(p => p.full_name);
        const linkedLeadNames = allProfiles.filter(p => selectedLeadIds.includes(p.id)).map(p => p.full_name);

        const updates = {
            title: formData.get('title') as string,
            status: formData.get('status') as any,
            category: formData.get('category') as string,
            subcategory: formData.get('subcategory') as string,
            pdsa_cycle: parseInt(formData.get('pdsa_cycle') as string) || 1,
            faculty: formData.get('faculty_name') as string,
            faculty_id: formData.get('faculty_id') === "" ? null : formData.get('faculty_id') as string,
            primary_outcome: formData.get('primary_outcome') as string,
            proponents: Array.from(new Set([...manualProponents, ...linkedProponentNames])),
            lead_proponents: Array.from(new Set([...manualLeads, ...linkedLeadNames])),
            proponent_ids: selectedProponentIds,
            lead_proponent_ids: selectedLeadIds,
            updates_and_barriers: formData.get('updates_and_barriers') as string,
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
            alert(error.message);
        } else {
            router.push(`/projects/view?id=${id}`);
            router.refresh();
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
            alert(error.message);
        } else {
            router.push('/projects');
            router.refresh();
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!project) return null;

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href={`/projects/view?id=${id}`} prefetch={false} className="flex items-center gap-2 text-slate-500 hover:text-advent-blue mb-6 transition-colors text-sm font-semibold group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Details
            </Link>

            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Edit Project</h1>
                    <p className="text-slate-500 mt-2 font-medium">Update the details for this QI initiative.</p>
                </div>

                <DeleteProjectButton onDelete={handleDelete} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
                <div className="lg:col-span-2">
                    <PHIWarning />
                </div>
                <div className="lg:col-span-1">
                    <AIAuditCard project={project} />
                </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-12 pb-20">
                <div className="grid grid-cols-1 gap-12">
                    <Section title="Core Project Information" icon={<LayoutGrid className="w-5 h-5 text-advent-blue" />}>
                        <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Project Title</label>
                                <input
                                    name="title"
                                    required
                                    defaultValue={project.title}
                                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Current Lifecycle Status</label>
                                    <div className="relative">
                                        <select
                                            name="status"
                                            defaultValue={project.status}
                                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer appearance-none"
                                        >
                                            {PROJECT_STATUSES.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Primary Category</label>
                                    <select
                                        name="category"
                                        defaultValue={project.category || ''}
                                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer"
                                    >
                                        <option value="">-- Select Category --</option>
                                        {project.category && !PROJECT_CATEGORIES.includes(project.category) && (
                                            <option value={project.category}>{project.category} (Legacy)</option>
                                        )}
                                        {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sub-Specialty Focus</label>
                                    <select
                                        name="subcategory"
                                        defaultValue={project.subcategory || ''}
                                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer"
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
                                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Project Stakeholders" icon={<Users className="w-5 h-5 text-emerald-500" />}>
                        <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Faculty Mentor / PI</label>
                                    <div className="space-y-4">
                                        <input
                                            name="faculty_name"
                                            placeholder="Mentor's full name..."
                                            defaultValue={project.faculty || ''}
                                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all"
                                        />
                                        <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block italic">Link to System Account</label>
                                            <select
                                                name="faculty_id"
                                                defaultValue={project.faculty_id || ""}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-advent-blue/10 text-xs font-bold text-slate-600"
                                            >
                                                <option value="">-- No Account Linked --</option>
                                                {facultyProfiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lead Investigators</label>
                                    <div className="space-y-4">
                                        <input
                                            name="lead_proponents_text"
                                            placeholder="Other investigators (manual list)..."
                                            defaultValue={project.lead_proponents.filter(name => !allProfiles.some(p => p.full_name === name && selectedLeadIds.includes(p.id))).join(', ')}
                                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 text-xs font-bold transition-all"
                                        />
                                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Registered Members:</p>
                                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2">
                                                {residentProfiles.map(p => (
                                                    <label key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer group">
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
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Extended Performance & Impact" icon={<TrendingUp className="w-5 h-5 text-advent-blue" />}>
                        <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end ml-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        Primary Outcome Goal (SMART Aim)
                                        <Sparkles className="w-3 h-3 text-advent-blue/40" />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const titleVal = (document.getElementsByName('title')[0] as HTMLInputElement).value;
                                            const currentAim = (document.getElementsByName('primary_outcome')[0] as HTMLTextAreaElement).value;
                                            if (!titleVal) return alert("Please enter a title first.");
                                            const btn = document.getElementById('edit-smart-aim-btn');
                                            if (btn) btn.innerHTML = '<span class="animate-spin text-emerald-500">🌀</span> Polishing...';
                                            try {
                                                const smart = await generateSMARTAim(titleVal, currentAim);
                                                (document.getElementsByName('primary_outcome')[0] as HTMLTextAreaElement).value = smart;
                                            } catch (e: any) {
                                                alert("AI Error: " + e.message);
                                            } finally {
                                                if (btn) btn.innerHTML = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg> Optimize Aim';
                                            }
                                        }}
                                        id="edit-smart-aim-btn"
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 active:scale-95 shadow-sm shadow-emerald-500/10"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Optimize Aim
                                    </button>
                                </div>
                                <textarea
                                    name="primary_outcome"
                                    defaultValue={project.primary_outcome || ''}
                                    placeholder="Describe the main goal of this project..."
                                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all min-h-[120px] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                            placeholder="e.g., 150"
                                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all pl-14"
                                        />
                                        <Users className="absolute left-6 top-5 w-5 h-5 text-slate-300 group-focus-within:text-advent-blue transition-colors" />
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
                                            placeholder="e.g., 5000.00"
                                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all pl-14"
                                        />
                                        <span className="absolute left-6 top-5 text-xl font-black text-slate-300 group-focus-within:text-emerald-500 transition-colors">$</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Academic Target & Publication" icon={<Trophy className="w-5 h-5 text-amber-500" />}>
                        <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Conference Pathway</label>
                                <div className="relative">
                                    <select
                                        name="target_conference"
                                        defaultValue={project.target_conference || ""}
                                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="">-- No Conference Targeted --</option>
                                        {CONFERENCE_OPTIONS.map(conf => (
                                            <option key={conf.id} value={conf.id}>{conf.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    Abstract Summary
                                    <FileText className="w-3 h-3 text-slate-400" />
                                </label>
                                <textarea
                                    name="abstract_summary"
                                    defaultValue={project.abstract_summary || ''}
                                    placeholder="Draft your executive summary or abstract here..."
                                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all min-h-[180px] resize-none"
                                />
                            </div>
                        </div>
                    </Section>

                    <Section title="Updates and Barriers" icon={<Info className="w-5 h-5 text-advent-lightblue" />}>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                             <AIUpdateSection initialValue={project.updates_and_barriers || ''} />
                        </div>
                    </Section>

                    <Section title="Project Depot" icon={<FileText className="w-5 h-5 text-slate-400" />}>
                        <div className="space-y-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Template</span>
                                            <span className="text-[10px] text-slate-300 font-bold italic">Standard GME Requirement</span>
                                        </div>
                                        <a
                                            href="/QI_Tracker/templates/QI_Project_Protocol_Template_AdventHealth_IMGME_Tampa.docx"
                                            download
                                            className="flex items-center gap-2 text-advent-blue text-[10px] font-black uppercase tracking-widest hover:underline"
                                        >
                                            <FileDown className="w-3 h-3" />
                                            Download
                                        </a>
                                    </div>
                                    <FileUploader
                                        projectId={id!}
                                        fieldName="protocol_url"
                                        currentUrl={project.protocol_url}
                                        onUploadComplete={(url) => setProject({ ...project, protocol_url: url })}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presentation Template</span>
                                            <span className="text-[10px] text-slate-300 font-bold italic">AdventHealth Branded .pptx</span>
                                        </div>
                                        <a
                                            href="/QI_Tracker/templates/AdventHealth IM GME QI Template.pptx"
                                            download
                                            className="flex items-center gap-2 text-advent-blue text-[10px] font-black uppercase tracking-widest hover:underline"
                                        >
                                            <FileDown className="w-3 h-3" />
                                            Download
                                        </a>
                                    </div>
                                    <FileUploader
                                        projectId={id!}
                                        fieldName="presentation_url"
                                        currentUrl={project.presentation_url}
                                        onUploadComplete={(url) => setProject({ ...project, presentation_url: url })}
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

                <div className="flex justify-end pt-10 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-3 bg-advent-blue text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-advent-dark-blue transition-all shadow-2xl shadow-advent-blue/30 active:scale-95 group disabled:opacity-50"
                    >
                        <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        {isSaving ? "Syncing..." : "Save Project Changes"}
                    </button>
                </div>
            </form >
        </div >
    )
}
