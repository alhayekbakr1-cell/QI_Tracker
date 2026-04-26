"use client"

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import { AlertCircle, Clock, Send, Loader2, RefreshCw } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import Link from "next/link";

export default function StaleNudgePanel() {
    const [staleProjects, setStaleProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nudgingId, setNudgingId] = useState<string | null>(null);
    const [nudgedIds, setNudgedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchStaleProjects();
    }, []);

    async function fetchStaleProjects() {
        setIsLoading(true);
        const supabase = createClient();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .lt("last_updated_date", thirtyDaysAgo.toISOString())
            .order("last_updated_date", { ascending: true })
            .limit(20);

        if (!error) {
            setStaleProjects((data || []) as Project[]);
        }
        setIsLoading(false);
    }

    const handleNudge = async (project: Project) => {
        if (nudgingId) return;
        setNudgingId(project.id);

        try {
            const supabase = createClient();

            // Log the nudge action
            await supabase.from("audit_logs").insert({
                table_name: "projects",
                record_id: project.id,
                action: "UPDATE",
                new_data: { nudged_at: new Date().toISOString() },
                changed_by: null,
            }).throwOnError();

            setNudgedIds(prev => new Set([...prev, project.id]));
        } catch (err) {
            console.error("Nudge failed:", err);
            alert("Failed to send nudge. Check console.");
        } finally {
            setNudgingId(null);
        }
    };

    const urgentProjects = staleProjects.filter(p =>
        differenceInDays(new Date(), new Date(p.last_updated_date)) > 60
    );
    const staleOnly = staleProjects.filter(p => {
        const days = differenceInDays(new Date(), new Date(p.last_updated_date));
        return days > 30 && days <= 60;
    });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                        <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                            Stale Projects
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold">
                            {urgentProjects.length} urgent · {staleOnly.length} stale
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchStaleProjects}
                    disabled={isLoading}
                    className="p-2 text-slate-400 hover:text-advent-navy hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
            ) : staleProjects.length === 0 ? (
                <div className="py-10 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        All projects are up to date ✓
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {staleProjects.map(project => {
                        const days = differenceInDays(new Date(), new Date(project.last_updated_date));
                        const isUrgent = days > 60;
                        const isNudged = nudgedIds.has(project.id);

                        return (
                            <div key={project.id} className={`px-5 py-4 flex items-center gap-3 transition-colors ${isUrgent ? "bg-red-50/30" : "bg-amber-50/20"}`}>
                                {isUrgent ? (
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                ) : (
                                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/projects/view?id=${project.id}`}
                                        className="text-xs font-bold text-slate-800 hover:text-advent-blue transition-colors line-clamp-1"
                                    >
                                        {project.title}
                                    </Link>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isUrgent ? "text-red-500" : "text-amber-600"}`}>
                                            {days}d since update
                                        </span>
                                        {project.lead_proponents[0] && (
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                · {project.lead_proponents[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleNudge(project)}
                                    disabled={!!nudgingId || isNudged}
                                    title={isNudged ? "Nudge sent" : "Send nudge"}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${isNudged
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                        : isUrgent
                                            ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                                            : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
                                        } disabled:opacity-50`}
                                >
                                    {nudgingId === project.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Send className="w-3 h-3" />
                                    )}
                                    {isNudged ? "Sent" : "Nudge"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
