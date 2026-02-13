"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Project } from "@/types";
import PHIWarning from "@/components/PHIWarning";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import { useEffect, useState } from "react";

export default function EditProjectPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (!id) {
            router.push("/projects");
            return;
        }

        async function fetchProject() {
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

            setProject(data as Project);
            setIsLoading(false);
        }

        fetchProject();
    }, [id, supabase, router]);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!project || !id) return;
        setIsSaving(true);

        const formData = new FormData(e.currentTarget);
        const updates = {
            title: formData.get('title') as string,
            status: formData.get('status') as any,
            category: formData.get('category') as string,
            faculty: formData.get('faculty') as string,
            primary_outcome: formData.get('primary_outcome') as string,
            proponents: (formData.get('proponents') as string).split(',').map(s => s.trim()),
            lead_proponents: (formData.get('lead_proponents') as string).split(',').map(s => s.trim()),
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
                            <input
                                name="faculty"
                                defaultValue={project.faculty || ''}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lead(s) (comma separated)</label>
                            <input
                                name="lead_proponents"
                                defaultValue={project.lead_proponents.join(', ')}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Proponents (comma separated)</label>
                            <input
                                name="proponents"
                                defaultValue={project.proponents.join(', ')}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Primary Outcome</label>
                        <textarea
                            name="primary_outcome"
                            defaultValue={project.primary_outcome || ''}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-advent-blue/10 focus:border-advent-blue text-slate-900 font-bold transition-all min-h-[120px] resize-none"
                        />
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
