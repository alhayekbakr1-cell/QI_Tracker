import { Project } from "@/types";
import { format } from "date-fns";
import { Calendar, User, TrendingUp, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import Link from "next/link";

export default function ProjectCard({ project }: { project: Project }) {
    return (
        <Link
            href={`/projects/view?id=${project.id}`}
            prefetch={false}
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-advent-blue/30 transition-all flex flex-col h-full relative overflow-hidden"
        >
            {/* Hover Indicator */}
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all">
                <ChevronRight className="w-5 h-5 text-advent-blue" />
            </div>

            <div className="flex items-center gap-2 mb-4">
                <StatusBadge status={project.status} />
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    PDSA Cycle {project.pdsa_cycle}
                </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-3 leading-tight group-hover:text-advent-blue transition-colors line-clamp-2">
                {project.title}
            </h3>

            <div className="mt-auto space-y-3">
                <div className="flex items-center gap-2 text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold truncate">Lead: {project.lead_proponents[0] || 'Unassigned'}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {format(new Date(project.last_updated_date), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
