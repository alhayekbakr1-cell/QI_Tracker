"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Project } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { MoreHorizontal, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format, subDays, isBefore } from "date-fns";
import ExportCSVButton from "@/components/ExportCSVButton";
import ProjectFilters from "@/components/ProjectFilters";
import NudgeButton from "@/components/NudgeButton";
import { useEffect, useState } from "react";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

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
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
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

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty Mentor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Leads</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Updated</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.map(project => (
                                <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={project.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/projects/view?id=${project.id}`} prefetch={false} className="text-sm font-bold text-slate-900 group-hover:text-advent-blue line-clamp-2 transition-colors flex items-center gap-2">
                                            {project.title}
                                            {isBefore(new Date(project.last_updated_date), subDays(new Date(), 30)) && (
                                                <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-black uppercase tracking-widest" title="No updates in >30 days">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    Stale
                                                </span>
                                            )}
                                        </Link>
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mt-1">{project.category} • {project.subcategory}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {project.faculty || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="flex flex-wrap gap-1">
                                            {project.lead_proponents.length > 0 ? (
                                                project.lead_proponents.map(lead => (
                                                    <span key={lead} className="bg-advent-blue/10 text-advent-blue px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                                                        {lead}
                                                    </span>
                                                ))
                                            ) : '—'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {format(new Date(project.last_updated_date), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end gap-2">
                                        <NudgeButton project={project} />
                                        <button className="text-slate-400 hover:text-slate-600 p-1">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
