"use client"

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { Project } from "@/types";
import {
    Users,
    CheckCircle2,
    AlertCircle,
    FileCheck,
    MessageSquare,
    ChevronRight,
    Search,
    Filter,
    Clock,
    FileText,
    TrendingUp,
    Loader2,
    X
} from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";

type FilterMode = "all" | "protocol" | "pdsa";

export default function FacultyDashboard() {
    const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>("all");
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchFacultyData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setUserProfile(profile);

            const { data: projects } = await supabase
                .from('projects')
                .select('*')
                .eq('faculty_id', user.id)
                .order('last_updated_date', { ascending: false });

            if (projects) setAssignedProjects(projects as Project[]);
            setIsLoading(false);
        }
        fetchFacultyData();
    }, [supabase]);

    const displayProjects = useMemo(() => {
        return assignedProjects.filter(p => {
            const q = searchQuery.toLowerCase();
            const matchSearch = !q || (
                p.title.toLowerCase().includes(q) ||
                p.lead_proponents.some(n => n.toLowerCase().includes(q)) ||
                p.proponents.some(n => n.toLowerCase().includes(q))
            );
            const matchFilter =
                filterMode === "all" ? true :
                filterMode === "protocol" ? !p.faculty_approved_protocol :
                !p.faculty_approved_pdsa;
            return matchSearch && matchFilter;
        });
    }, [assignedProjects, searchQuery, filterMode]);

    async function toggleApproval(project: Project, field: "faculty_approved_protocol" | "faculty_approved_pdsa") {
        setApprovingId(`${project.id}-${field}`);
        const newValue = !project[field];
        const { error } = await supabase
            .from('projects')
            .update({ [field]: newValue })
            .eq('id', project.id);
        if (!error) {
            setAssignedProjects(prev =>
                prev.map(p => p.id === project.id ? { ...p, [field]: newValue } : p)
            );
        }
        setApprovingId(null);
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="w-8 h-8 border-4 border-[#004F9F] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (userProfile?.role !== 'Faculty' && userProfile?.role !== 'Admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center uppercase tracking-widest font-black text-slate-300">
                <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
                <p>Access Restricted to Authorized Faculty Mentors</p>
                <Link href="/" className="mt-8 text-advent-navy hover:underline text-xs">Return to Dashboard</Link>
            </div>
        );
    }

    const pendingProtocol = assignedProjects.filter(p => !p.faculty_approved_protocol).length;
    const pendingPdsa = assignedProjects.filter(p => !p.faculty_approved_pdsa).length;
    const pendingTotal = assignedProjects.filter(p => !p.faculty_approved_protocol || !p.faculty_approved_pdsa).length;

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-advent-navy p-2 rounded-xl text-white">
                            <Users className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Faculty Mentor Portal</h1>
                    </div>
                    <p className="text-slate-500 font-medium">
                        Mentoring <span className="text-advent-navy font-bold">{userProfile?.full_name || 'assigned residents'}</span>
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{assignedProjects.length}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Actions Needed</p>
                            <p className="text-xl font-black text-rose-600 leading-none">{pendingTotal}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Quick Filters</h3>
                            <Filter className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => setFilterMode("all")}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                                    filterMode === "all"
                                        ? "bg-advent-navy text-white shadow-md"
                                        : "bg-white border border-slate-200 text-slate-600 hover:border-advent-navy"
                                }`}
                            >
                                All My Projects
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${filterMode === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                    {assignedProjects.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setFilterMode("protocol")}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                                    filterMode === "protocol"
                                        ? "bg-rose-600 text-white shadow-md"
                                        : "bg-white border border-slate-200 text-slate-600 hover:border-rose-400"
                                }`}
                            >
                                Protocol Sign-off Needed
                                {pendingProtocol > 0 && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${filterMode === "protocol" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`}>
                                        {pendingProtocol}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFilterMode("pdsa")}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                                    filterMode === "pdsa"
                                        ? "bg-amber-500 text-white shadow-md"
                                        : "bg-white border border-slate-200 text-slate-600 hover:border-amber-400"
                                }`}
                            >
                                PDSA Approvals Needed
                                {pendingPdsa > 0 && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${filterMode === "pdsa" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-600"}`}>
                                        {pendingPdsa}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                            <FileCheck className="w-4 h-4" />
                            Quick Sign-off
                        </h3>
                        <p className="text-[11px] leading-relaxed text-emerald-800">
                            Use the <span className="font-black">Protocol</span> and <span className="font-black">PDSA</span> buttons on each project card to approve directly — no need to open the full project view.
                        </p>
                    </div>
                </div>

                {/* Projects Feed */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Search */}
                    <div className="flex items-center gap-2 bg-white p-2 px-4 rounded-2xl border border-slate-200">
                        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by resident name or project title..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-slate-300"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")}>
                                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                            </button>
                        )}
                    </div>

                    {displayProjects.length === 0 && (
                        <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            {assignedProjects.length === 0 ? (
                                <>
                                    <p className="text-slate-400 font-bold">No assigned projects yet.</p>
                                    <p className="text-xs text-slate-400 mt-2 italic px-8">Ask residents to select you as their Faculty Mentor in their project settings.</p>
                                </>
                            ) : (
                                <p className="text-slate-400 font-bold">No projects match your filter.</p>
                            )}
                        </div>
                    )}

                    {displayProjects.map(project => (
                        <FacultyProjectCard
                            key={project.id}
                            project={project}
                            onToggle={toggleApproval}
                            approvingId={approvingId}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function FacultyProjectCard({
    project,
    onToggle,
    approvingId
}: {
    project: Project,
    onToggle: (p: Project, field: "faculty_approved_protocol" | "faculty_approved_pdsa") => void,
    approvingId: string | null
}) {
    const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(project.last_updated_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const isStale = daysSinceUpdate > 30;

    return (
        <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all ${
            isStale ? "border-amber-200" : "border-slate-100"
        }`}>
            <div className="p-5">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <StatusBadge status={project.status} />
                            {project.category && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {project.category}
                                </span>
                            )}
                            {project.pdsa_cycle > 0 && (
                                <span className="text-[9px] font-black text-[#004F9F] bg-[#004F9F]/10 px-2 py-0.5 rounded-full">
                                    PDSA ×{project.pdsa_cycle}
                                </span>
                            )}
                            {isStale && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> {daysSinceUpdate}d stale
                                </span>
                            )}
                        </div>
                        <h3 className="text-sm font-black text-slate-900 leading-snug">
                            {project.title}
                        </h3>
                    </div>
                    <Link
                        href={`/projects/view?id=${project.id}`}
                        className="flex-shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-advent-navy hover:text-advent-cobalt transition-colors"
                    >
                        Open <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Residents */}
                {project.lead_proponents.length > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-500 font-medium">
                            {project.lead_proponents.join(", ")}
                            {project.proponents.length > project.lead_proponents.length && (
                                <span className="text-slate-400"> +{project.proponents.length - project.lead_proponents.length} more</span>
                            )}
                        </span>
                    </div>
                )}

                {/* Outcome */}
                {project.primary_outcome && (
                    <p className="text-xs text-slate-500 line-clamp-1 mb-4 italic">
                        {project.primary_outcome}
                    </p>
                )}

                {/* Inline sign-off buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-1">Sign-off:</span>

                    <button
                        onClick={() => onToggle(project, "faculty_approved_protocol")}
                        disabled={approvingId === `${project.id}-faculty_approved_protocol`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                            project.faculty_approved_protocol
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                        }`}
                    >
                        {approvingId === `${project.id}-faculty_approved_protocol` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : project.faculty_approved_protocol ? (
                            <CheckCircle2 className="w-3 h-3" />
                        ) : (
                            <FileText className="w-3 h-3" />
                        )}
                        Protocol {project.faculty_approved_protocol ? "✓" : "—"}
                    </button>

                    <button
                        onClick={() => onToggle(project, "faculty_approved_pdsa")}
                        disabled={approvingId === `${project.id}-faculty_approved_pdsa`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                            project.faculty_approved_pdsa
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                        }`}
                    >
                        {approvingId === `${project.id}-faculty_approved_pdsa` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : project.faculty_approved_pdsa ? (
                            <CheckCircle2 className="w-3 h-3" />
                        ) : (
                            <TrendingUp className="w-3 h-3" />
                        )}
                        PDSA {project.faculty_approved_pdsa ? "✓" : "—"}
                    </button>

                    <Link
                        href={`/projects/view?id=${project.id}#comments`}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 border border-slate-200 hover:border-advent-navy hover:text-advent-navy transition-all"
                    >
                        <MessageSquare className="w-3 h-3" />
                        Comment
                    </Link>
                </div>
            </div>
        </div>
    );
}
