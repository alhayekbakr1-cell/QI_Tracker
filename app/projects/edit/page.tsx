"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Project } from "@/types";
import PHIWarning from "@/components/PHIWarning";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import FileUploader from "@/components/FileUploader";
import { useEffect, useState } from "react";
import { FileDown, RefreshCw } from "lucide-react";
import { draftSummary, auditProjectQuality, suggestMetrics } from "@/utils/ai";

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

    useEffect(() => {
        if (!id) {
            router.push("/projects");
            return;
        }

        async function fetchData() {
            const supabase = createClient();
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
    }, [id, router]);

    const facultyProfiles = allProfiles.filter(p => p.role === 'Faculty' || p.role === 'Admin');
    const residentProfiles = allProfiles.filter(p => p.role !== 'Faculty' && p.role !== 'Admin');

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!project || !id) return;
        setIsSaving(true);
        const supabase = createClient();

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

        const { error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id);

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
        const supabase = createClient();
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

            <form onSubmit={handleUpdate} className="space-y-8 bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Project Title</label>
                        <input
                            name="title"
                            required
                            defaultValue={project.title}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Current Status</label>
                            <select
                                name="status"
                                defaultValue={project.status}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer"
                            >
                                <option value="Idea">Idea</option>
                                <option value="Pre-Intervention">Pre-Intervention</option>
                                <option value="Intervention Ongoing">Intervention Ongoing</option>
                                <option value="Sustain the Gains">Sustain the Gains</option>
                                <option value="Impacted (Completed)">Impacted (Completed)</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Faculty Mentor</label>
                            <div className="flex flex-col gap-2">
                                <input
                                    name="faculty_name"
                                    placeholder="Enter mentor's full name..."
                                    defaultValue={project.faculty || ''}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all"
                                />
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 italic">Link to Registered User (Required for Portal Access)</label>
                                    <select
                                        name="faculty_id"
                                        defaultValue={project.faculty_id || ""}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-advent-blue/10 text-xs font-bold text-slate-600 cursor-pointer"
                                    >
                                        <option value="">-- [None Selected] --</option>
                                        {facultyProfiles.map(p => (
                                            <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lead(s)</label>
                            <div className="space-y-2">
                                <input
                                    name="lead_proponents_text"
                                    placeholder="Manual names (if not in system)..."
                                    defaultValue={project.lead_proponents.filter(name => !allProfiles.some(p => p.full_name === name && selectedLeadIds.includes(p.id))).join(', ')}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 text-xs font-bold transition-all mb-2"
                                />
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 italic">Link Registered Members:</p>
                                    <div className="grid grid-cols-1 gap-1">
                                        {residentProfiles.map(p => (
                                            <label key={p.id} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-advent-navy cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeadIds.includes(p.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedLeadIds([...selectedLeadIds, p.id]);
                                                        else setSelectedLeadIds(selectedLeadIds.filter(id => id !== p.id));
                                                    }}
                                                    className="w-3 h-3 rounded text-advent-navy"
                                                />
                                                {p.full_name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Proponents</label>
                            <div className="space-y-2">
                                <input
                                    name="proponents_text"
                                    placeholder="Manual names (if not in system)..."
                                    defaultValue={project.proponents.filter(name => !allProfiles.some(p => p.full_name === name && selectedProponentIds.includes(p.id))).join(', ')}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 text-xs font-bold transition-all mb-2"
                                />
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 italic">Link Registered Members:</p>
                                    <div className="grid grid-cols-1 gap-1">
                                        {residentProfiles.map(p => (
                                            <label key={p.id} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-advent-navy cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProponentIds.includes(p.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedProponentIds([...selectedProponentIds, p.id]);
                                                        else setSelectedProponentIds(selectedProponentIds.filter(id => id !== p.id));
                                                    }}
                                                    className="w-3 h-3 rounded text-advent-navy"
                                                />
                                                {p.full_name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Primary Outcome</label>
                        <div className="space-y-6">
                            <textarea
                                name="primary_outcome"
                                defaultValue={project.primary_outcome || ''}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all min-h-[100px] resize-none"
                            />
                            <MetricSuggester title={project.title} onSelect={(val) => {
                                const ta = document.querySelector('textarea[name="primary_outcome"]') as HTMLTextAreaElement;
                                if (ta) ta.value = (ta.value ? ta.value + '\n\n' : '') + val;
                            }} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Targeting Conference</label>
                        <select
                            name="target_conference"
                            defaultValue={project.target_conference || ""}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer"
                        >
                            <option value="">-- No Conference Targeted --</option>
                            <option value="ACP National (Internal Medicine)">ACP National (Internal Medicine)</option>
                            <option value="SHM Converge (Hospital Medicine)">SHM Converge (Hospital Medicine)</option>
                            <option value="SGIM Annual Meeting">SGIM Annual Meeting</option>
                            <option value="AdventHealth Research Day">AdventHealth Research Day</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Total Patients Impacted</label>
                            <input
                                type="number"
                                name="total_patients_impacted"
                                defaultValue={project.total_patients_impacted || 0}
                                placeholder="e.g., 150"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Estimated Cost Savings ($)</label>
                            <input
                                type="number"
                                name="estimated_cost_savings"
                                step="0.01"
                                defaultValue={project.estimated_cost_savings || 0}
                                placeholder="e.g., 5000.00"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Publication Abstract / Summary (Draft)</label>
                        <textarea
                            name="abstract_summary"
                            defaultValue={project.abstract_summary || ''}
                            placeholder="Draft your abstract here or use it to store key results for publication..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300 min-h-[150px] resize-none"
                        />
                    </div>

                    <AIUpdateSection initialValue={project.updates_and_barriers || ''} />

                    <div className="space-y-6 pt-10 border-t border-slate-100">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Project Depot</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">Manage institutional templates and project documents.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Template</span>
                                    <a
                                        href="/QI_Tracker/templates/QI_Project_Protocol_Template_AdventHealth_IMGME_Tampa.docx"
                                        download
                                        className="flex items-center gap-2 text-advent-blue text-xs font-bold hover:underline"
                                    >
                                        <FileDown className="w-3 h-3" />
                                        Download .docx
                                    </a>
                                </div>
                                <FileUploader
                                    projectId={id!}
                                    fieldName="protocol_url"
                                    currentUrl={project.protocol_url}
                                    onUploadComplete={(url) => setProject({ ...project, protocol_url: url })}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presentation Template</span>
                                    <a
                                        href="/QI_Tracker/templates/AdventHealth%20IM%20GME%20QI%20Template.pptx"
                                        download
                                        className="flex items-center gap-2 text-advent-blue text-xs font-bold hover:underline"
                                    >
                                        <FileDown className="w-3 h-3" />
                                        Download .pptx
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
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-advent-blue text-white px-10 py-4 rounded-2