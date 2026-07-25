import { Project, ProjectStatus } from "@/types";
import { format, differenceInDays } from "date-fns";
import { Calendar, User, ChevronRight, AlertTriangle, FileCheck } from "lucide-react";
import StatusBadge from "./StatusBadge";
import Link from "next/link";

const PROGRESS_MAP: Record<ProjectStatus, { progress: number; color: string }> = {
    'Idea': { progress: 20, color: 'bg-violet-500' },
    'Pre-Intervention': { progress: 40, color: 'bg-blue-500' },
    'Intervention Ongoing': { progress: 60, color: 'bg-amber-500' },
    'Sustain the Gains': { progress: 80, color: 'bg-cyan-500' },
    'Impacted (Completed)': { progress: 100, color: 'bg-emerald-500' },
};

export default function ProjectCard({ project }: { project: Project }) {
    const isImpacted = project.status === 'Impacted (Completed)';
    const daysSinceUpdate = differenceInDays(new Date(), new Date(project.last_updated_date));

    // Traffic Light Logic (only if not completed)
    const isRed = !isImpacted && daysSinceUpdate > 60;
    const isYellow = !isImpacted && daysSinceUpdate > 30 && daysSinceUpdate <= 60;

    const stageConfig = PROGRESS_MAP[project.status] || PROGRESS_MAP['Idea'];

    return (
        <Link
            href={`/projects/view?id=${project.id}`}
            prefetch={false}
            className={`group academic-card p-6 flex flex-col h-full relative overflow-hidden active:scale-[0.98] transition-all duration-500 ${
                isRed ? 'ring-1.5 ring-red-500/30 bg-red-50/10' :
                isYellow ? 'ring-1.5 ring-amber-400/30 bg-amber-50/10' :
                isImpacted ? 'border-emerald-200/60 shadow-md shadow-emerald-500/5 bg-gradient-to-br from-white to-emerald-50/5' :
                ''
            }`}
        >
            {/* Stale Warning Ribbon */}
            {(isRed || isYellow) && (
                <div className={`absolute -right-10 top-5 rotate-45 px-12 py-0.5 flex items-center gap-1 justify-center shadow-xs z-10 ${isRed ? 'bg-rose-600 text-white' : 'bg-amber-400 text-slate-900'
                    }`}>
                    <AlertTriangle className="w-2 h-2" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em]">
                        {isRed ? 'Urgent' : 'Stale'}
                    </span>
                </div>
            )}

            {/* Hover Indicator */}
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-500 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-advent-navy" />
            </div>

            {/* Fine line highlight on hover */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-advent-navy to-advent-green transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

            <div className="flex items-center gap-1.5 mb-4">
                <StatusBadge status={project.status} />
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.15em] bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60 shadow-2xs">
                    Cycle {project.pdsa_cycle}
                </span>
                {project.faculty_approved_protocol && project.faculty_approved_pdsa && (
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200/50 shadow-2xs animate-in fade-in zoom-in duration-500">
                        <FileCheck className="w-3 h-3 text-emerald-600" />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em]">Approved</span>
                    </div>
                )}
            </div>

            <h3 className="text-base font-serif font-bold text-slate-800 mb-4 leading-snug group-hover:text-advent-navy transition-colors line-clamp-2">
                {project.title}
            </h3>

            {/* Visual Stage Progress Bar */}
            <div className="mb-4 mt-2">
                <div className="flex items-center justify-between mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <span>Research Stage Progress</span>
                    <span className={`font-mono ${stageConfig.color.replace('bg-', 'text-')}`}>{stageConfig.progress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${stageConfig.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${stageConfig.progress}%` }}
                    />
                </div>
            </div>

            <div className="mt-auto space-y-3.5 pt-4 border-t border-slate-100/80">
                <div className="flex items-center gap-2 text-slate-500">
                    <User className="w-3.5 h-3.5 text-advent-navy/60" />
                    <span className="text-xs font-semibold truncate text-slate-700">
                        {(project.lead_proponents || [])[0] || 'Unassigned Investigator'}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 ${isRed ? 'text-rose-600 font-bold' : isYellow ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                            {format(new Date(project.last_updated_date), 'MMM d, yyyy')}
                        </span>
                        {(isRed || isYellow) && (
                            <span className="text-[10px] opacity-60">({daysSinceUpdate}d ago)</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

