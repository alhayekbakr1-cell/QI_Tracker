"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import PHIWarning from "@/components/PHIWarning";
import { ArrowLeft, Save, Sparkles, Loader2, LayoutGrid, Users, Target, TrendingUp, Trophy, Layers, Info, FileText, FileDown } from "lucide-react";
import Link from "next/link";
import Section from "@/components/Section";
import { useEffect, useState } from "react";
import { draftSummary, generateSMARTAim, suggestMetrics, checkDuplication } from "@/utils/ai";
import { Project } from "@/types";
import { sendEmail, TEMPLATES } from "@/utils/email";

const CATEGORIES = [
    "Clinical Quality",
    "Patient Safety",
    "Operational Efficiency",
    "Patient Experience",
    "Educational/Research",
    "Equity & Access"
];

const SUBCATEGORIES = [
    "Workflow Optimization",
    "Documentation/EMR",
    "Patient Education",
    "Staff Training",
    "Cost Reduction",
    "Access to Care",
    "Clinical Protocols",
    "Medication Safety"
];

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
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
    const [selectedProponentIds, setSelectedProponentIds] = useState<string[]>([]);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();

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
        }
        checkAuth();
    }, [supabase, router]);

    const facultyProfiles = allProfiles.filter(p => p.role === 'Faculty' || p.role === 'Admin' || p.role === 'Operator');
    const residentProfiles = allProfiles.filter(p => p.role !== 'Faculty' && p.role !== 'Admin' && p.role !== 'Operator');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

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
            subcategory: formData.get('subcategory') as string,
            faculty: formData.get('faculty_name') as string,
            faculty_id: formData.get('faculty_id') === "" ? null : formData.get('faculty_id') as string,
            proponents: Array.from(new Set([...manualProponents, ...linkedProponentNames])),
            lead_proponents: Array.from(new Set([...manualLeads, ...linkedLeadNames])),
            proponent_ids: selectedProponentIds,
            lead_proponent_ids: selectedLeadIds,
            primary_outcome: formData.get('primary_outcome') as string,
            target_conference: formData.get('target_conference') as string || null,
            updates_and_barriers: formData.get('updates_and_barriers') as string,
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
                <div className="grid grid-cols-1 gap-12">
                    <Section title="Core Information" icon={<LayoutGrid className="w-4 h-4 text-advent-blue" />}>
                        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
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
                                    <input
                                        name="category"
                                        list="categories-list"
                                        placeholder="e.g., Clinical Quality"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300"
                                    />
                                    <datalist id="categories-list">
                                        {CATEGORIES.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sub-Category</label>
                                    <input
                                        name="subcategory"
                                        list="subcategories-list"
                                        placeholder="e.g., Workflow Optimization"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all placeholder:text-slate-300"
                                    />
                                    <datalist id="subcategories-list">
                                        {SUBCATEGORIES.map(s => <option key={s} value={s} />)}
                                    </datalist>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">PDSA Cycle Number</label>
                                    <input
                                        type="number"
                                        name="pdsa_cycle"
                                        defaultValue={1}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Project Team" icon={<Users className="w-4 h-4 text-emerald-500" />}>
                        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lead Proponents</label>
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
                                            const titleInput = document.getElementsByName('title')[0] as HTMLInputElement;
                                            const currentAim = (document.getElementsByName('primary_outcome')[0] as HTMLTextAreaElement).value;
                                            if (!titleInput.value) return alert("Please enter a project title first.");
                                            const btn = document.getElementById('smart-aim-btn');
                                            if (btn) btn.innerHTML = '<span class="animate-spin text-emerald-500">🌀</span> Polishing...';
                                            try {
                                                const smart = await generateSMARTAim(titleInput.value, currentAim);
                                                (document.getElementsByName('primary_outcome')[0] as HTMLTextAreaElement).value = smart;
                                            } catch (e: any) {
                                                alert("AI Error: " + e.message);
                                            } finally {
                                                if (btn) btn.innerHTML = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg> Make SMART';
                                            }
                                        }}
                                        id="smart-aim-btn"
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm shadow-emerald-500/10 active:scale-95"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Make SMART
                                    </button>
                                </div>
                                <textarea
                                    name="primary_outcome"
                                    placeholder="e.g., By June 2024, decrease the rate of inpatient falls by 20% on Unit 4N..."
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
                                            placeholder="Estimated count..."
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
                                            placeholder="Annualized savings..."
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
                                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="">-- Select Target Venue --</option>
                                        <option value="ACP">ACP National Meeting</option>
                                        <option value="SHM">SHM Converge (Hospital Medicine)</option>
                                        <option value="SGIM">SGIM Annual Meeting</option>
                                        <option value="AHRD">AdventHealth GME Research Day</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <LayoutGrid className="w-4 h-4 text-slate-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    Abstract Summary
                                    <FileText className="w-3 h-3 text-slate-400" />
                                </label>
                                <textarea
                                    name="abstract_summary"
                                    placeholder="Draft your executive summary or abstract here..."
                                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all min-h-[180px] resize-none"
                                />
                            </div>
                        </div>
                    </Section>

                    <Section title="Updates and Barriers" icon={<Info className="w-5 h-5 text-advent-lightblue" />}>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                             <AIUpdateSection initialValue="" />
                        </div>
                    </Section>

                    <Section title="Project Depot (Protocols)" icon={<Save className="w-5 h-5 text-slate-400" />}>
                        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Template</span>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-xs text-slate-500 font-medium italic">Download the institutional QI template to ensure compliance with AdventHealth standards.</p>
                                        <a
                                            href="/QI_Tracker/templates/QI_Project_Protocol_Template_AdventHealth_IMGME_Tampa.docx"
                                            download
                                            className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-slate-200 text-advent-navy rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm group"
                                        >
                                            <FileDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                            Download Template
                                        </a>
                                    </div>
                                </div>

                                <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Protocol AI Assistant</span>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-xs text-emerald-800 font-medium italic">Unlock the Protocol AI Wizard after creating your project to draft full sections automatically.</p>
                                        <button
                                            type="button"
                                            className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
                                            onClick={() => alert("The Protocol AI Wizard is available immediately after creating the project. Please save the project details first.")}
                                        >
                                            <Sparkles className="w-4 h-4 text-emerald-500" />
                                            Protocol AI Wizard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

                <div className="flex justify-end pt-8 border-t border-slate-100">
                    <button
                        id="create-project-submit"
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-3 bg-advent-blue text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-advent-dark-blue transition-all shadow-2xl shadow-advent-blue/30 active:scale-95 group disabled:opacity-50"
                    >
                        <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        {isSaving ? "Initializing..." : "Create QI Project"}
                    </button>
                </div>
            </form>
        </div>
    )
}
