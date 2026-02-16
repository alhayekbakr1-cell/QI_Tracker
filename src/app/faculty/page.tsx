"use client"

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import ProjectCard from "@/components/ProjectCard";
import {
    Users,
    CheckCircle2,
    AlertCircle,
    FileCheck,
    MessageSquare,
    ChevronRight,
    Search,
    Filter
} from "lucide-react";
import Link from "next/link";

export default function FacultyDashboard() {
    const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchFacultyData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch profile to verify role
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setUserProfile(profile);

            // Fetch projects where faculty_id matches
            const { data: projects } = await supabase
                .from('projects')
                .select('*')
                .eq('faculty_id', user.id);

            if (projects) {
                setAssignedProjects(projects as Project[]);
            }
            setIsLoading(false);
        }
        fetchFacultyData();
    }, [supabase]);

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading Faculty Portal...</div>;
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

    const pendingApprovals = assignedProjects.filter(p => !p.faculty_approved_protocol || !p.faculty_approved_pdsa).length;

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
                    <p className="text-slate-500 font-medium">Monitoring QI progress for <span className="text-advent-navy font-bold">{userProfile?.full_name || 'Assigned Resident Projects'}</span></p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Projects</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{assignedProjects.length}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Pending Actions</p>
                            <p className="text-xl font-black text-rose-600 leading-none">{pendingApprovals}</p>
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
                            <button className="w-full text-left px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:border-advent-navy transition-all">
                                All My Projects
                            </button>
                            <button className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-all">
                                Protocol Sign-off Needed
                            </button>
                            <button className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-all">
                                PDSA Approvals
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                            <FileCheck className="w-4 h-4" />
                            Sign-off Guide
                        </h3>
                        <p className="text-[11px] leading-relaxed text-emerald-800">
                            Once you verify a resident's methodology and safety protocols, use the single-click sign-off in the project view to validate their progress.
                        </p>
                    </div>
                </div>

                {/* Projects Feed */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200">
                        <div className="flex-1 flex items-center gap-2 px-4 py-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by resident name or project title..."
                                className="bg-transparent border-none outline-none text-sm w-full font-medium"
                            />
                        </div>
                    </div>

                    {assignedProjects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {assignedProjects.map(project => (
                                <div key={project.id} className="group relative">
                                    <ProjectCard project={project} />

                                    {/* Faculty Overlay for pending actions */}
                                    {(!project.faculty_approved_protocol || !project.faculty_approved_pdsa) && (
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            {!project.faculty_approved_protocol && (
                                                <span className="bg-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-rose-200 shadow-sm animate-pulse">
                                                    Action Required: Protocol
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-2 flex items-center gap-4 px-4 overflow-hidden h-0 group-hover:h-8 transition-all duration-300">
                                        <Link
                                            href={`/projects/view?id=${project.id}`}
                                            className="text-[10px] font-black uppercase tracking-widest text-advent-navy hover:underline flex items-center gap-1"
                                        >
                                            Review Project <ChevronRight className="w-3 h-3" />
                                        </Link>
                                        <div className="h-3 w-px bg-slate-200" />
                                        <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-advent-navy transition-colors flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" /> Add Feedback
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">You haven't been assigned as a mentor for any projects yet.</p>
                            <p className="text-xs text-slate-400 mt-2 italic px-8">Ask residents to select you as their Faculty Mentor in their project settings.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
