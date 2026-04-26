"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import PHIWarning from "@/components/PHIWarning";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { draftSummary, generateSMARTAim, checkDuplication, improveWriting } from "@/utils/ai";
import { Project } from "@/types";
import { sendEmail, TEMPLATES } from "@/utils/email";
import SmartTextarea from "@/components/SmartTextarea";
import { DEFAULT_CONFERENCES } from "@/constants/conferences";

function AIUpdateSection({ initialValue }: { initialValue: string }) {
    const [value, setValue] = useState(initialValue);
    const [isDrafting, setIsDrafting] = useState(false);
    const [isImproving, setIsImproving] = useState(false);

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

    const handleImprove = async () => {
        if (!value || value.trim().length < 10) {
            alert("Please enter some text first before improving.");
            return;
        }
        setIsImproving(true);
        try {
            const improved = await improveWriting(value, "Updates and Barriers");
            setValue(improved);
        } catch (error: any) {
            alert(`Improve failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsImproving(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initial Updates/Barriers (Optional)</label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleImprove}
                        disabled={isDrafting || isImproving}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-2.5 py-1.5 rounded-lg hover:bg-violet-100 transition-all border border-violet-100 disabled:opacity-50"
                    >
                        {isImproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Improve
                    </button>
                    <button
                        type="button"
                        onClick={handleAIDraft}
                        disabled={isDrafting || isImproving}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-advent-navy bg-advent-navy/5 px-3 py-1.5 rounded-lg hover:bg-advent-navy/10 transition-all border border-advent-navy/10 disabled:opacity-50"
                    >
                        {isDrafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Draft with AI
                    </button>
                </div>
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

function PrimaryOutcomeField() {
    const [value, setValue] = useState("");
    const [isWorking, setIsWorking] = useState<"smart" | "improve" | null>(null);

    const handleMakeSmart = async () => {
        const title = (document.getElementsByName('title')[0] as HTMLInputElement)?.value;
        if (!title) return alert("Please enter a project title first.");
        setIsWorking("smart");
        try {
            const smart = await generateSMARTAim(title, value);
            setValue(smart);
        } catch (e: any) {
            alert("AI Error: " + e.message);
        } finally {
            setIsWorking(null);
        }
    };

    const handleImprove = async () => {
        if (!value || value.trim().length < 10) return alert("Please enter some text first.");
        setIsWorking("improve");
        try {
            const improved = await improveWriting(value, "Primary Outcome / SMART Aim");
            setValue(improved);
        } catch (e: any) {
            alert("AI Error: " + e.message);
        } finally {
            setIsWorking(null);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Outcome (SMART Aim)</label>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={handleImprove} disabled={!!isWorking}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-2.5 py-1.5 rounded-lg hover:bg-violet-100 transition-all border border-violet-100 disabled:opacity-50">
                        {isWorking === "improve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Improve
                    </button>
                    <button type="button" onClick={handleMakeSmart} disabled={!!isWorking}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100 disabled:opacity-50">
                        {isWorking === "smart" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Make SMART
                    </button>
                </div>
            </div>
            <textarea
                name="primary_outcome"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="e.g., Increase rate of counseling from 20% to 50%..."
                rows={3}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300 resize-none"
            />
        </div>
    );
}

export default function NewProjectPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [selectedProponentIds, setSelectedProponentIds] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        async function checkAuth() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const isLocal = window.location.hostname === 'localhost';
            const bypass = isLocal && localStorage.getItem('bypassAuth') === 'true';

            if (!user && !bypass) {
                router.push("/login");
                return;
            }

            // Fetch all profiles for linkage
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .order('full_name');
            setAllProfiles(profiles || []);
        }
        checkAuth();
    }, [router]);

    const facultyProfiles = allProfiles.filter(p => p.role === 'Faculty' || p.role === 'Admin' || p.role === 'Operator');
    const residentProfiles = allProfiles.filter(p => p.role !== 'Faculty' && p.role !== 'Admin' && p.role !== 'Operator');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
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

        const newProject = {
            title: formData.get('title') as string,
            status: formData.get('status') as any,
            category: formData.get('category') as string,
            faculty: formData.get('faculty_name') as string,
            faculty_id: formData.get('faculty_id') === "" ? null : formData.get('faculty_id') as string,
            proponents: Array.from(new Set([...manualProponents, ...linkedProponentNames])),
            lead_proponents: Array.from(new Set([...manualLeads, ...linkedLeadNames])),
            proponent_ids: selectedProponentIds,
            lead_proponent_ids: selectedLeadIds,
            primary_outcome: formData.get('primary_outcome') as string,
            updates_and_barriers: formData.get('updates_and_barriers') as string,
            target_conference: formData.get('target_conference') as string || null,
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
            alert(error.message);
        } else {
            // Trigger Email to Mentor
            const triggerEmail = async () => {
                try {
                    let mentorEmail = "";
                    const mentorId = formData.get('faculty_id') as string;
                    const mentorName = formData.get('faculty_name') as string;

                    if (mentorId) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('id', mentorId)
                            .single();
                        mentorEmail = (profile as any)?.email;
                    }

                    if (!mentorEmail && mentorName) {
                        mentorEmail = mentorName.replace(/ /g, ".") + "@AdventHealth.com";
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
            triggerEmail();

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
                                        const { data: projects } = await createClient().from('projects').select('title').limit(50);
                                        const summaries = projects?.map(p => p.title).join(', ') || "";
                                        const result = await checkDuplication(title, summaries);
                                        alert("AI Duplicate Check:\n\n" + result);
                                    } catch (e: any) {
                                        alert("AI Error: " + e.message);
                                    } finally {
                                        if (btn) btn.innerHTML = '✦ Check Duplicates';
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
                                <option value="Impacted (Completed)">Impacted (Completed)</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Category</label>
                            <select name="category" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer">
                                <option value="Inpatient">Inpatient</option>
                                <option value="Outpatient">Outpatient</option>
                                <option value="Ambulatory">Ambulatory</option>
                                <option value="Procedural">Procedural</option>
                                <option value="Other">Other</option>
                            </select>
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
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lead(s)</label>
                            <div className="space-y-2">
                                <input name="lead_proponents_text" placeholder="Manual names (if not in system)..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 text-xs font-bold transition-all mb-2" />
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
                                <input name="proponents_text" placeholder="Manual names (if not in system)..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 text-xs font-bold transition-all mb-2" />
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

                    <PrimaryOutcomeField />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Total Patients Impacted</label>
                            <input
                                type="number"
                                name="total_patients_impacted"
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
                                placeholder="e.g., 5000.00"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <SmartTextarea
                        name="abstract_summary"
                        label="Publication Abstract / Summary (Draft)"
                        placeholder="Draft your abstract here or use it to store key results for publication..."
                        rows={5}
                        context="Publication Abstract for a QI project"
                    />

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Conference</label>
                        <select
                            name="target_conference"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer"
                        >
                            <option value="">-- No Conference Targeted --</option>
                            {DEFAULT_CONFERENCES.map(conf => (
                                <option key={conf.id} value={conf.name}>{conf.name} — {conf.fullName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-slate-100">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Project Depot (Protocols)</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1">Institutional templates & AI assistance for your protocol.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Template</span>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs text-slate-500 font-medium italic">Download the IM GME Tampa template to your OneDrive first.</p>
                                    <a
       