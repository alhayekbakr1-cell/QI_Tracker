"use client"

import { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import {
    TrendingUp, Users, AlertTriangle, CheckCircle2,
    Clock, ArrowRight, Activity, ShieldCheck, Mail, Loader2, Search, Filter
} from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import CohortOverview from "@/components/CohortOverview";
import ProjectLifecycleBoard from "@/components/ProjectLifecycleBoard";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Project } from "@/types";
import { differenceInDays, format } from "date-fns";

const ADVENT_COLORS = ['#003057', '#00A3E0', '#FFBD31', '#007A53', '#626469'];

export default function ExecutiveDashboard() {
    const supabase = createClient();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNudging, setIsNudging] = useState<string | null>(null);
    const [productionMode, setProductionMode] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'search' | 'updates'>('search');

    useEffect(() => {
        async function fetchData() {
            const { data } = await supabase.from('projects').select('*');
            if (data) setProjects(data);
            setIsLoading(false);
        }
        fetchData();
    }, [supabase]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-advent-navy"></div>
            </div>
        );
    }

    const statusCounts = projects.reduce((acc, p) => {
        const s = p.status || 'Idea';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const stagnantProjects = projects.filter((p) => {
        const lastUpdate = new Date(p.last_updated_date);
        return differenceInDays(new Date(), lastUpdate) >= 30 && p.status !== 'Impacted (Completed)';
    });

    const deptData = [
        { name: 'Internal Medicine', projects: 12, impact: 85 },
        { name: 'Cardiology', projects: 8, impact: 92 },
        { name: 'Pediatrics', projects: 6, impact: 78 },
        { name: 'Emergency', projects: 5, impact: 64 },
        { name: 'Nursing', projects: 4, impact: 90 },
    ];

    const stats = [
        { label: "Total Projects", value: projects.length, icon: Activity, color: "text-advent-navy" },
        { label: "Stagnant", value: stagnantProjects.length, icon: AlertTriangle, color: "text-amber-600" },
        { label: "High Impact", value: projects.filter((p) => p.status === 'Impacted (Completed)').length, icon: CheckCircle2, color: "text-emerald-600" },
        { label: "Active Residents", value: 42, icon: Users, color: "text-advent-blue" },
    ];

    const handleNudge = async (p: Project) => {
        setIsNudging(p.id);
        try {
            const leadNames = p.lead_proponents || [];
            const emails = leadNames.map((name) => name.replace(/ /g, ".") + "@AdventHealth.com").join(",");
            const lastUpdated = new Date(p.last_updated_date);
            const daysSinceUpdate = differenceInDays(new Date(), lastUpdated);
            const recipient = productionMode ? emails : "bakr.alhayek.md@adventhealth.com";
            const subject = encodeURIComponent(`QI Update Requested: ${p.title}`);
            const body = encodeURIComponent(
                `Hi ${leadNames.join(", ") || "Team"},\n\n` +
                `This is a formal nudge from the Athena Clinical Wisdom office. Our records show "${p.title}" has not been updated in ${daysSinceUpdate} days.\n\n` +
                `Please log in to the Athena platform and provide an update on your progress, metrics, and any barriers you are facing.\n\n` +
                `Last recorded update: ${format(lastUpdated, 'MMM d, yyyy')}\n` +
                `Tracker Link: ${window.location.origin}/QI_Tracker/\n\n` +
                `Thanks,\nAthena Office`
            );

            window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
        } catch (err: unknown) {
            console.error("Nudge draft error:", err);
            alert(`Failed to open email draft: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsNudging(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-advent-navy text-white rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Strategic Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
                    <p className="text-slate-500 font-bold mt-2">Real-time QI performance and institutional impact oversight.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Mode</span>
                        <span className={`text-xs font-black ${productionMode ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {productionMode ? 'PRODUCTION' : 'TEST (DRAFTS TO YOU)'}
                        </span>
                    </div>
                    <button
                        onClick={() => setProductionMode(!productionMode)}
                        className={`w-12 h-6 rounded-full transition-all relative ${productionMode ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${productionMode ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>
            </header>

            {/* Program-level view. Every other surface is scoped to one resident
                or one mentor, so nobody could see the cohort as a whole. */}
            <div className="mb-10">
                <CohortOverview />
            </div>

            {/* A-Z status of every project. Replaces needing to work an approval
                queue: the chief is no longer a gate, so this is a status board. */}
            <div className="mb-10">
                <ProjectLifecycleBoard />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {stats.map((s, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-slate-50 ${s.color}`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400">v1.2</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 mb-1">{s.value}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-advent-navy" />
                        Project Lifecycle
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={ADVENT_COLORS[index % ADVENT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                        <ArrowRight className="w-5 h-5 text-advent-blue" />
                        Departmental Performance
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94A3B8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94A3B8' }} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="projects" fill="#003057" radius={[10, 10, 0, 0]} barSize={40} />
                                <Bar dataKey="impact" fill="#00A3E0" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Stagnant Projects (30+ Days No Update)
                        </h3>
                        <span className="bg-amber-50 text-amber-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {stagnantProjects.length} Flagged
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Project Title</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Leads</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Update</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stagnantProjects.map((p, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 font-bold text-slate-700 max-w-md truncate">{p.title}</td>
                                        <td className="py-4 text-xs font-medium text-slate-500">{p.lead_proponents?.join(", ")}</td>
                                        <td className="py-4 text-xs font-bold text-slate-400">{p.last_updated_date}</td>
                                        <td className="py-4 text-right">
                                            <button
                                                onClick={() => handleNudge(p)}
                                                disabled={isNudging === p.id}
                                                className="flex items-center gap-2 text-advent-blue font-black text-[10px] uppercase tracking-widest hover:underline disabled:opacity-50 ml-auto"
                                            >
                                                {isNudging === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                                                {isNudging === p.id ? "Opening..." : "Draft Nudge"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* GME Registry Control Console */}
                <div className="lg:col-span-1 bg-white border border-slate-200/60 rounded-[2.5rem] p-7 shadow-sm space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-advent-navy via-amber-500 to-advent-green" />
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Command Center</span>
                            <h3 className="text-sm font-serif italic font-bold text-slate-900">Academic Console</h3>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200/60 shadow-sm">
                            Active Surveillance
                        </span>
                    </div>

                    <div className="flex p-1 bg-slate-50 border border-slate-200/70 rounded-2xl relative shadow-inner">
                        {[
                            { id: 'search', label: 'Search', icon: Search, color: 'text-advent-navy' },
                            { id: 'updates', label: 'Updates', icon: Activity, color: 'text-emerald-500' }
                        ].map((tab) => {
                            const TabIcon = tab.icon;
                            const isActive = activeSidebarTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveSidebarTab(tab.id as 'search' | 'updates')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                        isActive
                                            ? "bg-white text-slate-900 border border-slate-200/65 shadow-sm scale-105"
                                            : "text-slate-500 hover:text-slate-950 hover:bg-white/50"
                                    }`}
                                >
                                    <TabIcon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-400'}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[250px] flex flex-col justify-between">
                        {activeSidebarTab === 'search' && (
                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                        <Search className="w-3.5 h-3.5 text-advent-navy/60" />
                                        Registry Search
                                    </h4>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Search GME initiatives..."
                                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-advent-navy/10 focus:border-advent-navy outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                                        />
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-advent-navy transition-colors" />
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                        <Filter className="w-3.5 h-3.5 text-advent-navy/60" />
                                        Status Quick Filters
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { name: 'Idea', dot: 'bg-violet-400' },
                                            { name: 'Pre-Intervention', dot: 'bg-blue-400' },
                                            { name: 'Intervention Ongoing', dot: 'bg-amber-400' },
                                            { name: 'Sustain the Gains', dot: 'bg-cyan-400' },
                                            { name: 'Impacted (Completed)', dot: 'bg-emerald-400' }
                                        ].map(s => (
                                            <Link
                                                key={s.name}
                                                href={`/projects?status=${s.name}`}
                                                prefetch={false}
                                                className="px-3 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-advent-navy rounded-lg text-[8px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-advent-navy transition-all duration-300 flex items-center gap-1.5"
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot} inline-block`} />
                                                {s.name}
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeSidebarTab === 'updates' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                    <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                        <Activity className="w-3.5 h-3.5 text-emerald-500/80 animate-pulse" />
                                        Real-Time Updates
                                    </h4>
                                </div>
                                <div className="max-h-[360px] overflow-y-auto pr-1">
                                    <ActivityFeed />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
