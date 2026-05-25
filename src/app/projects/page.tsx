"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Project } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { MoreHorizontal, Clock, AlertCircle, Eye, Edit2, CheckSquare, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { format, subDays, isBefore } from "date-fns";
import ExportCSVButton from "@/components/ExportCSVButton";
import ProjectFilters from "@/components/ProjectFilters";
import NudgeButton from "@/components/NudgeButton";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/custom-ui";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        const handleOutsideClick = () => {
            setActiveDropdownId(null);
        };
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, []);

    const handleDeleteProject = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis will permanently remove the project, its PDSA cycles, task lists, files, and audit records. This action cannot be undone.`)) {
            return;
        }
        setDeletingId(id);
        try {
            const { error } = await supabase.from("projects").delete().eq("id", id);
            if (error) throw error;
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            console.error("Failed to delete project:", err);
            alert("Failed to delete project. " + (err.message || ""));
        } finally {
            setDeletingId(null);
            setActiveDropdownId(null);
        }
    };

    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const faculty = searchParams.get("faculty");
    const lead = searchParams.get("lead");

    useEffect(() => {
        async function fetchProjects() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            let query = supabase.from("projects").select("*");

            if (status) {
                query = query.eq("status", status);
            }
            if (q) {
                query = query.ilike("title", `%${q}%`);
            }
            if (category) {
                query = query.eq("category", category);
            }
            if (faculty) {
                query = query.ilike("faculty", `%${faculty}%`);
            }

            const { data, error } = await query.order("last_updated_date", { ascending: false });

            if (error) {
                console.error(error);
            } else {
                let filteredData = data || [];

                // Client-side filtering for lead_proponents to support partial case-insensitive matches
                if (lead) {
                    const searchLower = lead.toLowerCase();
                    filteredData = filteredData.filter(p =>
                        p.lead_proponents?.some((name: string) =>
                            name.toLowerCase().includes(searchLower)
                        )
                    );
                }

                setProjects(filteredData as Project[]);
            }
            setIsLoading(false);
        }

        fetchProjects();
    }, [status, q, category, faculty, lead, supabase, router]);

    if (isLoading) {
        return (
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-96 rounded-lg" />
                    </div>
                    <Skeleton className="h-10 w-40 rounded-xl" />
                </div>

                {/* Filter skeleton */}
                <div className="flex flex-wrap gap-4 items-center bg-slate-50/80 p-5 rounded-3xl border border-slate-100">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-10 w-64 rounded-xl" />
                </div>

                {/* Table skeleton */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-40" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-28" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-32" /></th>
                                    <th className="px-6 py-4"><Skeleton className="h-4 w-24" /></th>
                                    <th className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map((idx) => (
                                    <tr key={idx} className="border-b border-slate-100/80 odd:bg-white even:bg-slate-50/20">
                                        <td className="px-6 py-5 whitespace-nowrap"><Skeleton className="h-6 w-24 rounded-full" /></td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-3/4 rounded" />
                                                <Skeleton className="h-3 w-1/3 rounded" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap"><Skeleton className="h-4 w-24 rounded" /></td>
                                        <td className="px-6 py-5">
                                            <div className="flex gap-1">
                                                <Skeleton className="h-4 w-16 rounded" />
                                                <Skeleton className="h-4 w-12 rounded" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap"><Skeleton className="h-4 w-20 rounded" /></td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right"><Skeleton className="h-8 w-20 rounded-xl ml-auto" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Project Masterlist</h1>
                    <p className="text-sm font-medium text-slate-500">Manage and track all QI projects in the department.</p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportCSVButton projects={projects} />
                </div>
            </div>

            <ProjectFilters />

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty Mentor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Leads</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Updated</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                            {projects.map(project => {
                                const lastUpdate = new Date(project.last_updated_date);
                                const now = new Date();
                                const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

                                const isCompleted = project.status === "Impacted (Completed)";
                                let rowClass = "odd:bg-white even:bg-slate-50/20 hover:bg-slate-50/80 transition-all duration-300 group border-l-4 border-l-transparent";
                                let stalenessLabel = null;

                                if (!isCompleted) {
                                    if (diffDays > 60) {
                                        rowClass = "bg-rose-50/20 hover:bg-rose-100/30 transition-all duration-300 group border-l-4 border-l-rose-500";
                                        stalenessLabel = (
                                            <span className="inline-flex items-center gap-1 text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 font-black uppercase tracking-widest animate-pulse" title="No updates in >60 days - URGENT">
                                                <AlertCircle className="w-2.5 h-2.5" />
                                                Urgent
                                            </span>
                                        );
                                    } else if (diffDays > 30) {
                                        rowClass = "bg-amber-50/20 hover:bg-amber-100/30 transition-all duration-300 group border-l-4 border-l-amber-500";
                                        stalenessLabel = (
                                            <span className="inline-flex items-center gap-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-black uppercase tracking-widest" title="No updates in >30 days">
                                                <Clock className="w-2.5 h-2.5" />
                                                Stale
                                            </span>
                                        );
                                    }
                                } else {
                                    rowClass = "odd:bg-white even:bg-slate-50/10 hover:bg-emerald-50/10 transition-all duration-300 group border-l-4 border-l-emerald-500";
                                }

                                return (
                                    <tr key={project.id} className={rowClass}>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <StatusBadge status={project.status} />
                                        </td>
                                        <td className="px-6 py-5">
                                            <Link href={`/projects/view?id=${project.id}`} prefetch={false} className="text-sm font-bold text-slate-900 group-hover:text-advent-blue line-clamp-2 transition-colors flex items-center gap-2">
                                                {project.title}
                                                {stalenessLabel}
                                            </Link>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mt-1">{project.category} • {project.subcategory}</span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                                            {project.faculty || '—'}
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-600">
                                            <div className="flex flex-wrap gap-1">
                                                {(project.lead_proponents || []).length > 0 ? (
                                                    (project.lead_proponents || []).map(lead => (
                                                        <span key={lead} className="bg-advent-blue/10 text-advent-blue px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                                                            {lead}
                                                        </span>
                                                    ))
                                                ) : '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500 font-medium">
                                            {format(new Date(project.last_updated_date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right flex items-center justify-end gap-2 relative">
                                            <NudgeButton project={project} />
                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdownId(activeDropdownId === project.id ? null : project.id);
                                                    }}
                                                    className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100/60 rounded-xl transition-all cursor-pointer"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                                
                                                {activeDropdownId === project.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <Link 
                                                            href={`/projects/view?id=${project.id}`}
                                                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-advent-navy hover:bg-slate-50 transition-colors text-left"
                                                        >
                                                            <Eye className="w-4 h-4 text-slate-400" />
                                                            View Details
                                                        </Link>
                                                        <Link 
                                                            href={`/projects/edit?id=${project.id}`}
                                                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-advent-navy hover:bg-slate-50 transition-colors text-left"
                                                        >
                                                            <Edit2 className="w-4 h-4 text-slate-400" />
                                                            Edit Project
                                                        </Link>
                                                        <Link 
                                                            href={`/projects/kanban?id=${project.id}`}
                                                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-advent-navy hover:bg-slate-50 transition-colors text-left"
                                                        >
                                                            <CheckSquare className="w-4 h-4 text-slate-400" />
                                                            Manage Tasks
                                                        </Link>
                                                        <hr className="border-slate-100 my-1" />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteProject(project.id, project.title);
                                                            }}
                                                            disabled={deletingId === project.id}
                                                            className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 transition-colors disabled:opacity-50"
                                                        >
                                                            {deletingId === project.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4 text-rose-450" />
                                                            )}
                                                            Delete Project
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {projects.length === 0 && (
                    <div className="py-24 text-center">
                        <p className="text-slate-400">No projects match the current criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
