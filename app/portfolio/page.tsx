"use client"

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { Project } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import {
    Award, CheckCircle2, Circle, FileText, ChevronRight,
    Trophy, GraduationCap, TrendingUp, Presentation,
    DollarSign, Users, Star, Sparkles, BookOpen,
    Activity, Printer, ExternalLink, Clock, Shield
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

// ─── Achievement badge definitions ───────────────────────────────────────────
interface Badge {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    check: (projects: Project[]) => boolean;
}

const BADGES: Badge[] = [
    {
        id: "first-project",
        label: "First Initiative",
        description: "Started your first QI project",
        icon: Sparkles,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        check: (p) => p.length >= 1,
    },
    {
        id: "pdsa-starter",
        label: "PDSA Starter",
        description: "Completed at least 1 PDSA cycle",
        icon: TrendingUp,
        color: "text-indigo-600 bg-indigo-50 border-indigo-200",
        check: (p) => p.some(x => x.pdsa_cycle >= 1),
    },
    {
        id: "pdsa-pro",
        label: "PDSA Pro",
        description: "Completed 3+ PDSA cycles total",
        icon: Activity,
        color: "text-violet-600 bg-violet-50 border-violet-200",
        check: (p) => p.reduce((s, x) => s + x.pdsa_cycle, 0) >= 3,
    },
    {
        id: "protocol-writer",
        label: "Protocol Writer",
        description: "Submitted an approved QI protocol",
        icon: FileText,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        check: (p) => p.some(x => x.protocol_url),
    },
    {
        id: "presenter",
        label: "Presenter",
        description: "Delivered an institutional QI presentation",
        icon: Presentation,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        check: (p) => p.some(x => x.presentation_url),
    },
    {
        id: "faculty-endorsed",
        label: "Faculty Endorsed",
        description: "Received full faculty sign-off on a project",
        icon: Shield,
        color: "text-teal-600 bg-teal-50 border-teal-200",
        check: (p) => p.some(x => x.faculty_approved_protocol && x.faculty_approved_pdsa),
    },
    {
        id: "impact-maker",
        label: "Impact Maker",
        description: "Projects impacted 100+ patients",
        icon: Users,
        color: "text-rose-600 bg-rose-50 border-rose-200",
        check: (p) => p.reduce((s, x) => s + (x.total_patients_impacted || 0), 0) >= 100,
    },
    {
        id: "cost-saver",
        label: "Cost Saver",
        description: "Contributed to $1,000+ in estimated savings",
        icon: DollarSign,
        color: "text-green-600 bg-green-50 border-green-200",
        check: (p) => p.reduce((s, x) => s + (Number(x.estimated_cost_savings) || 0), 0) >= 1000,
    },
    {
        id: "completionist",
        label: "Completionist",
        description: "Completed a project (Impacted status)",
        icon: Award,
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        check: (p) => p.some(x => x.status === "Impacted (Completed)"),
    },
    {
        id: "scholar",
        label: "QI Scholar",
        description: "Has 3+ projects in portfolio",
        icon: BookOpen,
        color: "text-cyan-600 bg-cyan-50 border-cyan-200",
        check: (p) => p.length >= 3,
    },
]

// ─── Graduation requirements ──────────────────────────────────────────────────
function getRequirements(projects: Project[]) {
    const totalPDSAs = projects.reduce((s, p) => s + p.pdsa_cycle, 0);
    const hasFullSignOff = projects.some(p => p.faculty_approved_protocol && p.faculty_approved_pdsa);
    return [
        {
            label: "QI Protocol Submitted",
            status: projects.some(p => p.protocol_url),
            sub: projects.some(p => p.protocol_url) ? "Uploaded" : "Missing",
            icon: FileText,
        },
        {
            label: "2+ PDSA Cycles",
            status: totalPDSAs >= 2,
            sub: `${totalPDSAs} / 2 cycles`,
            icon: TrendingUp,
        },
        {
            label: "Faculty Sign-off",
            status: hasFullSignOff,
            sub: hasFullSignOff ? "Protocol + PDSA approved" : "Pending mentor approval",
            icon: Shield,
        },
        {
            label: "Institutional Presentation",
            status: projects.some(p => p.presentation_url),
            sub: projects.some(p => p.presentation_url) ? "Delivered" : "Not yet submitted",
            icon: Presentation,
        },
    ];
}

export default function PortfolioPage() {
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchMyData() {
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
                if (!authUser && !bypass) { setIsLoading(false); return; }
                user = authUser;
                setUserEmail(user?.email ?? "Guest");
                if (user) {
                    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                    profile = profileData;
                    setUserProfile(profile);
                }
            }

            if (!user && !profile) { setIsLoading(false); return; }

            const userId = user?.id || profile?.id;
            const userFullName = profile?.full_name?.toLowerCase() || "";
            const emailPrefix = user?.email?.split('@')[0].toLowerCase() || "";
            const emailParts = emailPrefix.split('.');

            const { data: projects } = await supabase.from('projects').select('*');

            if (projects) {
                const filtered = projects.filter(p => {
                    const isIdMatch =
                        (p.lead_proponent_ids && p.lead_proponent_ids.includes(userId)) ||
                        (p.proponent_ids && p.proponent_ids.includes(userId)) ||
                        (p.faculty_id === userId);
                    if (isIdMatch) return true;

                    const nameMatch = (name: string) => {
                        if (!name) return false;
                        const lowName = name.toLowerCase();
                        if (userFullName && lowName.includes(userFullName)) return true;
                        if (lowName.includes(emailPrefix)) return true;
                        return emailParts.every((part: string) => part.length > 2 ? lowName.includes(part) : true);
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

    const isFaculty = userProfile?.role === 'Faculty' || userProfile?.role === 'Admin';

    const stats = useMemo(() => ({
        total: myProjects.length,
        completed: myProjects.filter(p => p.status === "Impacted (Completed)").length,
        totalPDSAs: myProjects.reduce((s, p) => s + p.pdsa_cycle, 0),
        patientsImpacted: myProjects.reduce((s, p) => s + (p.total_patients_impacted || 0), 0),
        costSavings: myProjects.reduce((s, p) => s + (Number(p.estimated_cost_savings) || 0), 0),
        fullyApproved: myProjects.filter(p => p.faculty_approved_protocol && p.faculty_approved_pdsa).length,
    }), [myProjects]);

    const requirements = useMemo(() => getRequirements(myProjects), [myProjects]);
    const completedReqs = requirements.filter(r => r.status).length;
    const progressPercent = Math.round((completedReqs / requirements.length) * 100);

    const unlockedBadges = BADGES.filter(b => b.check(myProjects));
    const lockedBadges = BADGES.filter(b => !b.check(myProjects));

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="w-8 h-8 border-4 border-[#004F9F] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const displayName = userProfile?.full_name || userEmail?.split('@')[0] || "Resident";

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:py-4">
            {/* Header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">
                        {isFaculty ? "Mentorship Portfolio" : "Resident Portfolio"}
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{displayName}</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {isFaculty
                            ? `Faculty mentor — ${stats.total} project${stats.total !== 1 ? "s" : ""} guided`
                            : `Quality Improvement & Academic Record`}
                    </p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="print:hidden flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:border-advent-navy hover:text-advent-navy transition-all shadow-sm"
                >
                    <Printer className="w-4 h-4" />
                    Export CV Summary
                </button>
            </header>

            {/* Impact Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                    { label: isFaculty ? "Projects Guided" : "Total Projects", value: stats.total, icon: BookOpen, color: "text-[#004F9F]", bg: "bg-[#004F9F]/5" },
                    { label: "PDSA Cycles", value: stats.totalPDSAs, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Patients Impacted", value: stats.patientsImpacted.toLocaleString(), icon: Users, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "Est. Savings", value: `$${stats.costSavings.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column */}
                <div className="space-y-6">
                    {/* Graduation / Mentorship card */}
                    <div className="bg-advent-navy text-white p-7 rounded-[2.5rem] shadow-2xl shadow-advent-navy/20 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 opacity-5">
                            {isFaculty ? <Award className="w-40 h-40" /> : <GraduationCap className="w-40 h-40" />}
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-5">
                                {isFaculty ? "Mentorship Impact" : "Graduation Tracker"}
                            </h2>

                            {isFaculty ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Projects</p>
                                            <p className="text-3xl font-black">{stats.total}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">PDSAs</p>
                                            <p className="text-3xl font-black">{stats.totalPDSAs}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                                        <span className="text-xs font-bold text-white/70">Fully Endorsed</span>
                                        <span className="text-xl font-black">{stats.fullyApproved}</span>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                                        <span className="text-xs font-bold text-white/70">Patient Reach</span>
                                        <span className="text-xl font-black">{stats.patientsImpacted.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-end gap-2 mb-3">
                                        <span className="text-5xl font-black">{progressPercent}%</span>
                                        <span className="text-xs font-bold text-white/50 mb-1.5 uppercase tracking-widest">Complete</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full mb-7 overflow-hidden">
                                        <div
                                            className="h-full bg-advent-green shadow-[0_0_12px_rgba(122,184,0,0.6)] transition-all duration-1000"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        {requirements.map((req, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${req.status ? 'bg-advent-green/20' : 'bg-white/5'}`}>
                                                        <req.icon className={`w-3.5 h-3.5 ${req.status ? 'text-advent-green' : 'text-white/30'}`} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold leading-none ${req.status ? 'text-white' : 'text-white/40'}`}>{req.label}</p>
                                                        <p className="text-[9px] text-white/30 mt-0.5">{req.sub}</p>
                                                    </div>
                                                </div>
                                                {req.status
                                                    ? <CheckCircle2 className="w-4 h-4 text-advent-green flex-shrink-0" />
                                                    : <Circle className="w-4 h-4 text-white/10 flex-shrink-0" />}
                                            </div>
                                        ))}
                                    </div>
                                    {progressPercent === 100 && (
                                        <div className="mt-6 p-3 bg-advent-green/20 border border-advent-green/30 rounded-2xl text-center">
                                            <p className="text-xs font-black text-advent-green">🎓 All Requirements Met!</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            Achievements
                            <span className="ml-auto text-[10px] font-black text-slate-400">{unlockedBadges.length}/{BADGES.length}</span>
                        </h3>

                        {unlockedBadges.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-2">Unlocked</p>
                                <div className="flex flex-wrap gap-2">
                                    {unlockedBadges.map(badge => (
                                        <div
                                            key={badge.id}
                                            title={badge.description}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black ${badge.color}`}
                                        >
                                            <badge.icon className="w-3 h-3" />
                                            {badge.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {lockedBadges.length > 0 && (
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-2">Locked</p>
                                <div className="flex flex-wrap gap-2">
                                    {lockedBadges.map(badge => (
                                        <div
                                            key={badge.id}
                                            title={badge.description}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 text-[10px] font-black grayscale"
                                        >
                                            <badge.icon className="w-3 h-3" />
                                            {badge.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column — Projects */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900">
                            {isFaculty ? "Projects Mentored" : "My Projects"}
                        </h2>
                        <div className="flex items-center gap-2">
                            {stats.completed > 0 && (
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {stats.completed} Completed
                                </span>
                            )}
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {stats.total} Total
                            </span>
                        </div>
                    </div>

                    {myProjects.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold mb-4">You aren't listed on any projects yet.</p>
                            <Link href="/projects/new" className="text-advent-navy font-black text-sm uppercase tracking-widest hover:underline flex items-center justify-center gap-1">
                                Start a New Project <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        myProjects
                            .sort((a, b) => new Date(b.last_updated_date).getTime() - new Date(a.last_updated_date).getTime())
                            .map(project => (
                                <PortfolioProjectCard key={project.id} project={project} isFaculty={isFaculty} />
                            ))
                    )}
                </div>
            </div>

            {/* Print-only CV summary */}
            <div className="hidden print:block mt-12 border-t-2 border-slate-200 pt-8">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Quality Improvement Portfolio Summary</h2>
                <div className="grid grid-cols-4 gap-4 mb-8 text-center">
                    <div className="border rounded-lg p-4"><div className="text-3xl font-black text-slate-900">{stats.total}</div><div className="text-xs text-slate-500 uppercase tracking-widest">Projects</div></div>
                    <div className="border rounded-lg p-4"><div className="text-3xl font-black text-slate-900">{stats.totalPDSAs}</div><div className="text-xs text-slate-500 uppercase tracking-widest">PDSA Cycles</div></div>
                    <div className="border rounded-lg p-4"><div className="text-3xl font-black text-slate-900">{stats.patientsImpacted.toLocaleString()}</div><div className="text-xs text-slate-500 uppercase tracking-widest">Patients Impacted</div></div>
                    <div className="border rounded-lg p-4"><div className="text-3xl font-black text-slate-900">${stats.costSavings.toLocaleString()}</div><div className="text-xs text-slate-500 uppercase tracking-widest">Cost Savings</div></div>
                </div>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-300">
                            <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-widest text-slate-500">Project</th>
                            <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-widest text-slate-500">Status</th>
                            <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-widest text-slate-500">PDSA</th>
                            <th className="text-left py-2 text-[10px] uppercase tracking-widest text-slate-500">Outcome</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myProjects.map(p => (
                            <tr key={p.id} className="border-b border-slate-100">
                                <td className="py-2 pr-4 font-semibold">{p.title}</td>
                                <td className="py-2 pr-4 text-slate-500">{p.status}</td>
                                <td className="py-2 pr-4 text-slate-500">×{p.pdsa_cycle}</td>
                                <td className="py-2 text-slate-500 text-xs">{p.primary_outcome || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="mt-8 text-xs text-slate-400">Generated from AdventHealth QI Chief Tracker · {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
}

// ─── Portfolio project card ───────────────────────────────────────────────────
function PortfolioProjectCard({ project, isFaculty }: { project: Project; isFaculty: boolean }) {
    const charterPct = useMemo(() => {
        if (!project.charter) return 0;
        const fields = Object.values(project.charter);
        const filled = fields.filter(v => v && v.trim().length > 0).length;
        return Math.round((filled / 8) * 100);
    }, [project.charter]);

    const daysSince = Math.floor(
        (Date.now() - new Date(project.last_updated_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    const signOffCount = (project.faculty_approved_protocol ? 1 : 0) + (project.faculty_approved_pdsa ? 1 : 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#004F9F]/20 transition-all">
            <div className="p-5">
                {/* Top row */}
                <div className="flex items-start gap-3 justify-between mb-3">
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
                        </div>
                        <h3 className="text-sm font-black text-slate-900 leading-snug">{project.title}</h3>
                    </div>
                    <Link
                        href={`/projects/view?id=${project.id}`}
                        className="flex-shrink-0 p-2 text-slate-400 hover:text-[#004F9F] transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>

                {/* Outcome */}
                {project.primary_outcome && (
                    <p className="text-xs text-slate-500 line-clamp-1 mb-4 italic">{project.primary_outcome}</p>
                )}

                {/* Status indicators row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {/* Charter completion */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" /> Charter
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${charterPct >= 80 ? 'bg-green-500' : charterPct >= 50 ? 'bg-amber-400' : 'bg-slate-300'}`}
                                style={{ width: `${charterPct}%` }}
                            />
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 mt-1">{charterPct}%</div>
                    </div>

                    {/* Faculty sign-off */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" /> Sign-off
                        </div>
                        <div className="flex gap-1">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${project.faculty_approved_protocol ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                Proto
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${project.faculty_approved_pdsa ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                PDSA
                            </span>
                        </div>
                    </div>

                    {/* Impact */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> Impact
                        </div>
                        <div className={`text-sm font-black ${project.total_patients_impacted ? 'text-rose-600' : 'text-slate-300'}`}>
                            {project.total_patients_impacted ? `${project.total_patients_impacted.toLocaleString()}` : "—"}
                        </div>
                        {project.total_patients_impacted ? (
                            <div className="text-[9px] text-slate-400">patients</div>
                        ) : null}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    {project.faculty && (
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-300" /> {project.faculty}
                        </span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {daysSince === 0 ? "Today" : `${daysSince}d ago`}
                    </span>
                </div>
            </div>
        </div>
    );
}
