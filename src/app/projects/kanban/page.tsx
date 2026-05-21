"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import KanbanBoard from "@/components/KanbanBoard";
import { ArrowLeft, LayoutPanelLeft, List, Plus } from "lucide-react";
import Link from "next/link";
import PHIWarning from "@/components/PHIWarning";

export default function KanbanPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchProjects() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("last_updated_date", { ascending: false });

            if (error) {
                console.error(error);
            } else {
                setProjects((data || []) as Project[]);
            }
            setIsLoading(false);
        }

        fetchProjects();
    }, [supabase, router]);

    if (isLoading) {
        return (
            <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-10">
                    <div className="space-y-3 w-full md:max-w-xl">
                        <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
                        <div className="h-10 bg-slate-200 rounded w-3/4 animate-pulse" />
                        <div className="h-5 bg-slate-200 rounded w-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="h-12 bg-slate-200 rounded-2xl w-32 animate-pulse" />
                        <div className="h-12 bg-slate-200 rounded-2xl w-40 animate-pulse" />
                    </div>
                </div>

                {/* PHI Warning Skeleton */}
                <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />

                {/* Pipeline Board Skeleton */}
                <div className="flex gap-6 overflow-x-auto pb-10 -mx-8 px-8">
                    {[1, 2, 3, 4, 5].map((col) => (
                        <div key={col} className="flex flex-col h-[600px] bg-slate-50/50 rounded-[2.5rem] border border-slate-100/50 p-4 min-w-[300px] space-y-4">
                            <div className="flex justify-between items-center px-4 py-3 mb-2 border-b border-slate-200/50 pb-3">
                                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                                <div className="h-5 bg-slate-200 rounded-full w-8 animate-pulse" />
                            </div>
                            {[1, 2].map((card) => (
                                <div key={card} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                    <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 animate-pulse" />
                                            <div className="w-6 h-6 rounded-full bg-slate-200 animate-pulse" />
                                        </div>
                                        <div className="h-3 bg-slate-200 rounded w-12 animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-advent-navy/60">
                        <Link href="/" className="hover:text-advent-navy transition-colors">Dashboard</Link>
                        <span className="text-slate-300">/</span>
                        <span className="text-advent-navy">Visual Pipeline</span>
                    </div>
                    <h1 className="text-5xl font-black text-advent-navy tracking-tight leading-none italic">
                        Project <span className="text-advent-green not-italic">Pipeline</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg pt-2 leading-relaxed">
                        Drag and drop projects to update their status and track progression.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/projects"
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        <List className="w-4 h-4" /> List View
                    </Link>
                    <Link
                        href="/projects/new"
                        className="flex items-center gap-2 px-6 py-3 bg-advent-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-advent-cobalt transition-all shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> New Initiative
                    </Link>
                </div>
            </div>

            <PHIWarning />

            {/* Kanban Board Container */}
            <div className="relative">
                <KanbanBoard initialProjects={projects} />
            </div>
        </div>
    );
}
