"use client"

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, ArrowRight, Inbox } from "lucide-react";
import { Project } from "@/types";
import { getProjectHealth, byUrgency, HEALTH_STYLES } from "@/utils/projectHealth";

/**
 * Answers "what needs me today?" for a faculty mentor.
 *
 * The Faculty Portal previously showed a pending-approval queue and a flat list
 * of mentored projects, which meant a project quietly stalling for 70 days
 * looked exactly like one updated yesterday.
 */
export default function MentorWorkloadPanel({
    projects,
    pendingApprovalCount,
}: {
    projects: Project[];
    pendingApprovalCount: number;
}) {
    const ranked = [...projects].sort(byUrgency);
    const atRisk = ranked.filter(p => getProjectHealth(p).needsAttention);
    const critical = atRisk.filter(p => getProjectHealth(p).level === "critical");
    const healthy = ranked.length - atRisk.length;

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    What needs you
                </h3>
                {atRisk.length === 0 && pendingApprovalCount === 0 && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        All clear
                    </span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3">
                <Stat label="Stalled 60d+" value={critical.length} tone={critical.length > 0 ? "critical" : "muted"} />
                <Stat label="Need a nudge" value={atRisk.length - critical.length} tone={atRisk.length - critical.length > 0 ? "warning" : "muted"} />
                <Stat label="On track" value={healthy} tone="ok" />
            </div>

            {pendingApprovalCount > 0 && (
                <div className="flex items-center gap-3 bg-advent-navy/5 border border-advent-navy/10 rounded-2xl px-4 py-3">
                    <Inbox className="w-4 h-4 text-advent-navy shrink-0" />
                    <p className="text-xs font-bold text-advent-navy">
                        {pendingApprovalCount} proposal{pendingApprovalCount === 1 ? "" : "s"} waiting on your sponsorship
                    </p>
                </div>
            )}

            {atRisk.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Most urgent first
                    </p>
                    {atRisk.slice(0, 6).map(project => {
                        const health = getProjectHealth(project);
                        const styles = HEALTH_STYLES[health.level];
                        return (
                            <Link
                                key={project.id}
                                href={`/projects/view?id=${project.id}`}
                                className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/70 transition-all group"
                            >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} aria-hidden="true" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-bold text-slate-900 truncate">
                                        {project.title}
                                    </span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text}`}>
                                        {health.label}
                                    </span>
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </Link>
                        );
                    })}
                    {atRisk.length > 6 && (
                        <p className="text-[10px] font-bold text-slate-400 pl-3">
                            + {atRisk.length - 6} more needing attention
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-xs font-medium text-slate-400 italic">
                    {ranked.length === 0
                        ? "No projects are assigned to you yet."
                        : "Every mentored project has been updated within the last 30 days."}
                </p>
            )}
        </div>
    );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "critical" | "warning" | "ok" | "muted" }) {
    const tones = {
        critical: "text-rose-600",
        warning: "text-amber-600",
        ok: "text-emerald-600",
        muted: "text-slate-300",
    } as const;
    const Icon = tone === "critical" ? AlertTriangle : tone === "warning" ? Clock : CheckCircle2;
    return (
        <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3 h-3 ${tones[tone]}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight">{label}</span>
            </div>
            <p className={`text-2xl font-black leading-none ${tones[tone]}`}>{value}</p>
        </div>
    );
}
