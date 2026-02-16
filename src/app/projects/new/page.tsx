"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import PHIWarning from "@/components/PHIWarning";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { draftSummary, generateSMARTAim, suggestMetrics, checkDuplication } from "@/utils/ai";
import { Project } from "@/types";

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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initial Updates/Barriers (Optional)</label>
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

export default function NewProjectPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [facultyProfiles, setFacultyProfiles] = useState<any[]>([]);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            // Auth bypass for local dev/verification
            const isLocal = window.location.hostname === 'localhost';
            const bypass = isLocal && localStorage.getItem('bypassAuth') === 'true';

            if (!user && !bypass) {
                router.push("/login");
                return;
            }

            // Fetch faculty profiles (including Admins who can mentor)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('role', ['Faculty', 'Admin']);
            setFacultyProfiles(profiles || []);
        }
        checkAuth();
    }, [supabase, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        const formData = new FormData(e.currentTarget);
        const newProject = {
            title: formData.get('title') as string,
            status: formData.get('status') as any,
            category: formData.get('category') as string,
            faculty: formData.get('faculty_name') as string,
            faculty_id: formData.get('faculty_id') === "" ? null : formData.get('faculty_id') as string,
            proponents: (formData.get('proponents') as string).split(',').map(s => s.trim()),
            lead_proponents: (formData.get('lead_proponents') as string).split(',').map(s => s.trim()),
            primary_outcome: formData.get('primary_outcome') as string,
            updates_and_barriers: formData.get('updates_and_barriers') as string,
            last_updated_date: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('projects')
            .insert(newProject)
            .select()
            .single();

        setIsSaving(false);
        if (error) {
            alert(error.message);
        } else {
            router.push(`/projects/view?id=${data.id}`);
            router.refresh();
        }
    };

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/projects" prefetch={false} className="flex items-center gap-2 text-slate-500 hover:text-advent-blue mb-6 transition-colors text-sm font-semibold group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Masterlist
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create New Project</h1>
                <p className="text-slate-500 mt-2 font-medium">Enter the details for the new QI initiative.</p>
            </div>

            <PHIWarning />

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end ml-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project Title</label>
                            <button
                                type="button"
                                onClick={async () => {
                                    const title = (document.getElementsByName('title')[0] as HTMLInputElement).value;
                                    if (!title || title.length < 5) return alert("Please enter at least 5 characters for the title.");
                                    const btn = document.getElementById('duplicate-check-btn');
                                    if (btn) btn.innerHTML = '<span class="animate-spin text-[8px]">🌀</span> Checking...';
                                    try {
                                        const { data: projects } = await supabase.from('projects').select('title').limit(50);
                                        const summaries = projects?.map(p => p.title).join(', ') || "";
                                        const result = await checkDuplication(title, summaries);
                                        alert("AI Duplicate Check:\n\n" + result);
                                    } catch (e: any) {
                                        alert("AI Error: " + e.message);
                                    } finally {
                                        if (btn) btn.innerHTML = '<svg class="w-3 h-3" ...>...</svg> Check Duplicates';
                                    }
                                }}
                                id="duplicate-check-btn"
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-all border border-amber-100"
                            >
                                <Sparkles className="w-3 h-3" />
                                Check Duplicates
                            </button>
                        </div>
                        <input
                            id="project-title-input"
                            name="title"
                            required
                            placeholder="e.g., Smoking Cessation in Outpatient Clinic"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Initial Status</label>
                            <select id="status-select" name="status" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer">
                                <option value="Idea">Idea</option>
                                <option value="Pre-Intervention">Pre-Intervention</option>
                                <option value="Intervention Ongoing">Intervention Ongoing</option>
                                <option value="Sustain the Gains">Sustain the Gains</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Category</label>
                            <input name="category" placeholder="e.g., Outpatient" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Faculty Mentor</label>
                            <div className="flex flex-col gap-2">
                                <input
                                    id="faculty-name-input"
                                    name="faculty_name"
                                    placeholder="e.g., Dr. Vernace"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300"
                                />
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 italic">Link to Registered User</label>
                                    <select
                                        id="faculty-id-select"
                                        name="faculty_id"
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

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lead(s) (comma separated)</label>
                            <input name="lead_proponents" placeholder="Khan, Malone" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300" />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Proponents (comma separated)</label>
                            <input name="proponents" placeholder="Alhayek, Malone, Mislay" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end ml-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Outcome (SMART Aim)</label>
                            <button
                                type="button"
                                onClick={async () => {
                                    const title = (document.getElementsByName('title')[0] as HTMLInputElement).value;
                                    const currentAim = (document.getElementsByName('primary_outcome')[0] as HTMLTextAreaElement).value;
                                    if (!title) return alert("Please enter a title first.");
                                    const btn = document.getElementById('smart-aim-btn');
                                    if (btn) btn.innerHTML = '<span class="animate-spin">🌀</span> Working...';
                                    try {
                                        const smart = await generateSMARTAim(title, currentAim);
                                        (document.getElementsByName('primary_outcome')[0] as HTMLTextAreaElement).value = smart;
                                    } catch (e: any) {
                                        alert("AI Error: " + e.message);
                                    } finally {
                                        if (btn) btn.innerHTML = '<svg class="w-3 h-3" ...>...</svg> Make SMART';
                                    }
                                }}
                                id="smart-aim-btn"
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100"
                            >
                                <Sparkles className="w-3 h-3" />
                                Make SMART
                            </button>
                        </div>
                        <textarea
                            id="primary-outcome-textarea"
                            name="primary_outcome"
                            placeholder="e.g., Increase rate of counseling from 20% to 50%..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300 min-h-[100px] resize-none"
                        />
                    </div>

                    <AIUpdateSection initialValue="" />
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                        id="create-project-submit"
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-advent-blue text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-advent-dark-blue transition-all shadow-xl shadow-advent-blue/20 active:scale-95 group disabled:opacity-50"
                    >
                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {isSaving ? "Creating..." : "Create Project"}
                    </button>
                </div>
            </form>
        </div>
    )
}
