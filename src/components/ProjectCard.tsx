import { Project } from "@/types";
import { format } from "date-fns";
import { Calendar, User, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import Link from "next/link";

export default function ProjectCard({ project }: { project: Project }) {
    return (
        <Link
            href={`/projects/view?id=${project.id}`}
            prefetch={false}
            className="group glass-card p-6 flex flex-col h-full relative overflow-hidden active:scale-[0.99]"
        >
            {/* Hover Indicator */}
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
                <ChevronRight className="w-5 h-5 text-advent-cobalt" />
            </div>

            {/* Gradient Line on Hover */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-advent-navy to-advent-green transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

            <div className="flex items-center gap-2 mb-4">
                <StatusBadge status={project.status} />
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    Cycle {project.pdsa_cycle}
                </span>
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
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {format(new Date(project.last_updated_date), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
