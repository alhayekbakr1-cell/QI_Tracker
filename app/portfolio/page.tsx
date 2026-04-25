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
    Presentation,
    DollarSign,
    Users
} from "lucide-react";
import Link from "next/link";

export default function PortfolioPage() {
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchMyData() {
            // Check for simulated profile first (for browser testing)
            const simulated = localStorage.getItem('simulatedUserProfile');
            const isLocal = window.location.hostname === 'localhost';
            const bypass = isLocal && localStorage.getItem('bypassAuth') === 'true';

            let user: any = null;
            let profile: any = null;

            if (simulated) {
                profile = JSON.parse(simulated);
                user = { id: profile.id, email: profile.email || "simulated@example.com" };
                setUserProfile(profile);
                setUserEmail(user.email);
            } else {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser && !bypass) return;
                user = authUser;
                setUserEmail(user?.email ?? "Guest");

                if (user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    profile = profileData;
                    setUserProfile(profile);
                }
            }

            if (!user && !profile) {
                setIsLoading(false);
                return;
            }

            const userId = user?.id || profile?.id;
            const userFullName = profile?.full_name?.toLowerCase() || "";
            const emailPrefix = user?.email?.split('@')[0].toLowerCase() || "";
            const emailParts = emailPrefix.split('.');

            // Fetch projects where user is proponent, lead_proponent, OR faculty
            const { data: projects } = await supabase
                .from('projects')
                .select('*');

            if (projects) {
                const filtered = projects.filter(p => {
                    // Check ID linkage first
                    const isIdMatch =
                        (p.lead_proponent_ids && p.lead_proponent_ids.includes(userId)) ||
                        (p.proponent_ids && p.proponent_ids.includes(userId)) ||
                        (p.faculty_id === userId);

                    if (isIdMatch) return true;

                    // Fallback to name matching
                    const nameMatch = (name: string) => {
                        if (!name) return false;
                        const lowName = name.toLowerCase();
                        if (userFullName && lowName.includes(userFullName)) return true;
                        if (lowName.includes(emailPrefix)) return true;
                        return emailParts.every(part => part.length > 2 ? lowName.includes(part) : true);
                    };

                    return (p.lead_proponents && p.lead_proponents.some(nameMatch)) ||
                        (p.proponents && p.proponents.some(nameMatch)) ||
                        (p.faculty && nameMatch(p.faculty));
                });
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
                {/* Dynamic Tracker Card (Graduation vs Mentorship) */}
                <div className="lg:col-span-1 space-y-6">
                    {userProfile?.role === 'Operator' || userProfile?.role === 'Faculty' ? (
                        /* Faculty Mentorship Impact View */
                        <div className="bg-advent-navy text-white p-8 rounded-[2.5rem] shadow-2xl shadow-advent-navy/20 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Award className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/60 mb-2">Mentorship Impact</h2>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Academic CV Ready</h3>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Projects Guided</p>
                                        <p className="text-3xl font-black">{myProjects.length}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">PDSAs Mentored</p>
                                        <p className="text-3xl font-black">{myProjects.reduce((sum, p) => sum + p.pdsa_cycle, 0)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs font-bold">Total Patient Reach</span>
                                    </div>
                                    <span className="text-sm font-black">{myProjects.reduce((sum, p) => sum + (p.total_patients_impacted || 0), 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="w-4 h-4 text-emerald-400" />
                                        <span className="text-xs font-bold">Escaped Costs Guided</span>
                                    </div>
                                    <span className="text-sm font-black">${myProjects.reduce((sum, p) => sum + (Number(p.estimated_cost_savings) || 0), 0).toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="w-full mt-8 py-4 bg-white text-advent-navy rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-black/20 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Export Mentorship Report for CV
                            </button>
                        </div>
                    ) : (
                        /* Resident Graduation Status View */
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
                    )}

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
        </div >
    );
}
