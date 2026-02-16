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
import { FileDown } from "lucide-react";
import { draftSummary } from "@/utils/ai";

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
            faculty: formData.get('faculty_name') as string,
            faculty_id: formData.get('faculty_id') === "" ? null : formData.get('faculty_id') as string,
            primary_outcome: formData.get('primary_outcome') as string,
            proponents: Array.from(new Set([...manualProponents, ...linkedProponentNames])),
            lead_proponents: Array.from(new Set([...manualLeads, ...linkedLeadNames])),
            proponent_ids: selectedProponentIds,
            lead_proponent_ids: selectedLeadIds,
            updates_and_barriers: formData.get('updates_and_barriers') as string,
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

            <PHIWarning />

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
                        <textarea
                            name="primary_outcome"
                            defaultValue={project.primary_outcome || ''}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all min-h-[100px] resize-none"
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
                                        href="/QI_Tracker/templates/AdventHealth IM GME QI Template.pptx"
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
                        className="flex items-center gap-2 bg-advent-blue text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-advent-dark-blue transition-all shadow-xl shadow-advent-blue/20 active:scale-95 group disabled:opacity-50"
                    >
                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    )
}
