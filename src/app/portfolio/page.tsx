"use client"

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import ProjectCard from "@/components/ProjectCard";
import {
    Award,
    CheckCircle2,
    Circle,
    FileText,
    ChevronRight,
    Trophy,
    GraduationCap,
    TrendingUp,
    Presentation
} from "lucide-react";
import Link from "next/link";

export default function PortfolioPage() {
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchMyData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserEmail(user.email ?? null);
            const userIdentifer = user.email?.split('@')[0] || user.id;

            // Fetch projects where user is proponent or lead_proponent
            // Note: Since multi-select is stored as JSONB/Array, 
            // we'll filter client-side for simplicity in this prototype
            const { data: projects } = await supabase
                .from('projects')
                .select('*');

            if (projects) {
                const filtered = projects.filter(p =>
                    p.lead_proponents.some((lp: string) => lp.toLowerCase().includes(userIdentifer.toLowerCase())) ||
                    p.proponents.some((pr: string) => pr.toLowerCase().includes(userIdentifer.toLowerCase()))
                );
                setMyProjects(filtered as Project[]);
            }
            setIsLoading(false);
        }
        fetchMyData();
    }, [supabase]);

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading Portfolio...</div>;
    }

    // Graduation Requirements Logic
    const hasProtocol = myProjects.some(p => p.protocol_url);
    const hasPresentation = myProjects.some(p => p.presentation_url);
    const totalPDSAs = myProjects.reduce((sum, p) => sum + p.pdsa_cycle, 0);
    const pdsaProgress = Math.min((totalPDSAs / 2) * 100, 100);

    const requirements = [
        { label: "QI Protocol Approved", status: hasProtocol, icon: FileText },
        { label: "2+ PDSA Cycles Completed", status: totalPDSAs >= 2, icon: TrendingUp, sub: `${totalPDSAs}/2 Cycles` },
        { label: "Institutional Presentation", status: hasPresentation, icon: Presentation }
    ];

    const completedCount = requirements.filter(r => r.status).length;
    const progressPercent = Math.round((completedCount / requirements.length) * 100);

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Academic Portfolio</h1>
                <p className="text-slate-500 font-medium">Tracking Quality Improvement & Graduation Milestones for <span className="text-advent-navy font-bold">{userEmail}</span></p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Graduation Tracker Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-advent-navy text-white p-8 rounded-[2.5rem] shadow-2xl shadow-advent-navy/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <GraduationCap className="w-32 h-32" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/60 mb-6">Graduation Status</h2>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-5xl font-black">{progressPercent}%</span>
                                <span className="text-xs font-bold text-white/60 mb-2 uppercase tracking-widest">Complete</span>
                            </div>

                            <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-advent-green shadow-[0_0_15px_rgba(74,222,128,0.5)] transition-all duration-1000"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            <div className="mt-8 space-y-4">
                                {requirements.map((req, idx) => (
                                    <div key={idx} className="flex items-center justify-between group/item">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${req.status ? 'bg-advent-green/20 text-advent-green' : 'bg-white/5 text-white/30'}`}>
                                                <req.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold leading-none ${req.status ? 'text-white' : 'text-white/40'}`}>{req.label}</p>
                                                {req.sub && <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-white/30">{req.sub}</p>}
                                            </div>
                                        </div>
                                        {req.status ? <CheckCircle2 className="w-4 h-4 text-advent-green" /> : <Circle className="w-4 h-4 text-white/10" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            Academic Achievements
                        </h3>
                        <div className="space-y-3">
                            {completedCount === requirements.length ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                    <Award className="w-5 h-5 text-emerald-600" />
                                    <p className="text-xs font-bold text-emerald-800">Board Ready / QI Milestone Met</p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic px-2">Complete all milestones to unlock your QI Board Certification Letter.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Projects List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Participating Projects</h2>
                        <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {myProjects.length} Active
                        </span>
                    </div>

                    {myProjects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {myProjects.map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold mb-4">You aren't listed on any projects yet.</p>
                            <Link href="/projects/new" className="text-advent-navy font-black text-sm uppercase tracking-widest hover:underline flex items-center justify-center gap-1">
                                Start a New Project <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
