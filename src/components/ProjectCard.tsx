import { Project } from "@/types";
import { format, differenceInDays } from "date-fns";
import { Calendar, User, ChevronRight, AlertTriangle, FileCheck } from "lucide-react";
import StatusBadge from "./StatusBadge";
import Link from "next/link";

export default function ProjectCard({ project }: { project: Project }) {
    const daysSinceUpdate = differenceInDays(new Date(), new Date(project.last_updated_date));

    // Traffic Light Logic
    const isRed = daysSinceUpdate > 60;
    const isYellow = daysSinceUpdate > 30 && daysSinceUpdate <= 60;

    return (
        <Link
            href={`/projects/view?id=${project.id}`}
            prefetch={false}
            className={`group glass-card p-6 flex flex-col h-full relative overflow-hidden active:scale-[0.99] transition-all duration-500 ${isRed ? 'ring-2 ring-red-500/50 bg-red-50/10' :
                isYellow ? 'ring-2 ring-amber-400/50 bg-amber-50/10' :
                    'hover:border-advent-navy'
                }`}
        >
            {/* Stale Warning Ribbon */}
            {(isRed || isYellow) && (
                <div className={`absolute -right-12 top-6 rotate-45 px-14 py-1 flex items-center gap-1.5 shadow-sm z-10 ${isRed ? 'bg-red-500 text-white' : 'bg-amber-400 text-advent-navy'
                    }`}>
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">
                        {isRed ? 'Urgent' : 'Stale'}
                    </span>
                </div>
            )}

            {/* Hover Indicator */}
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300 pointer-events-none">
                <ChevronRight className="w-5 h-5 text-advent-cobalt" />
            </div>

            {/* Gradient Line on Hover */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-advent-navy to-advent-green transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

            <div className="flex items-center gap-2 mb-4">
                <StatusBadge status={project.status} />
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    Cycle {project.pdsa_cycle}
                </span>
                {project.faculty_approved_protocol && project.faculty_approved_pdsa && (
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 animate-in fade-in zoom-in duration-500">
                        <FileCheck className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Signed Off</span>
                    </div>
                )}
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-3 leading-tight group-hover:text-advent-navy transition-colors line-clamp-2">
                {project.title}
            </h3>

            <div className="mt-auto space-y-4">
                <div className="flex items-center gap-2 text-slate-500">
                    <User className="w-3.5 h-3.5 text-advent-cobalt/70" />
                    <span className="text-xs font-semibold truncate text-slate-600">
                        {project.lead_proponents[0] || 'Unassigned'}
                    </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100/80">
                    <div className={`flex items-center gap-2 ${isRed ? 'text-red-500 font-bold' : isYellow ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {format(new Date(project.last_updated_date), 'MMM d, yyyy')}
                        </span>
                        {(isRed || isYellow) && (
                            <span className="text-[8px] opacity-60">({daysSinceUpdate}d)</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
