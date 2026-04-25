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
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-advent-navy border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Pipeline...</p>
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
