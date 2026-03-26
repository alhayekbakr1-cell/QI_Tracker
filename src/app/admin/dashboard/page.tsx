"use client"

import { useEffect, useState } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
    TrendingUp, Users, AlertTriangle, CheckCircle2, 
    Clock, ArrowRight, Activity, ShieldCheck
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Project } from "@/types";
import { differenceInDays } from "date-fns";

const ADVENT_COLORS = ['#003057', '#00A3E0', '#FFBD31', '#007A53', '#626469'];

export default function ExecutiveDashboard() {
    const supabase = createClient();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const { data, error } = await supabase.from('projects').select('*');
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

    // 1. PROJECT STATUS DISTRIBUTION
    const statusCounts = projects.reduce((acc, p) => {
        const s = p.status || 'Active';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 2. STAGNANT PROJECTS (> 30 Days)
    const stagnantProjects = projects.filter(p => {
        const lastUpdate = new Date(p.last_updated_date);
        return differenceInDays(new Date(), lastUpdate) >= 30 && p.status !== 'Impacted (Completed)';
    });

    // 3. DEPARTMENTAL ACTIVITY (Top 5)
    // Assuming 'lead_proponents' or a future 'department' field
    // For now, let's group by lead proponent role or just show a fallback
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
        { label: "High Impact", value: projects.filter(p => p.status === 'Impacted (Completed)').length, icon: CheckCircle2, color: "text-emerald-600" },
        { label: "Active Residents", value: 42, icon: Users, color: "text-advent-blue" }, // Hardcoded for demo
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-advent-navy text-white rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Strategic Intelligence</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
                <p className="text-slate-500 font-bold mt-2">Real-time QI performance and institutional impact oversight.</p>
            </header>

            {/* QUICK STATS */}
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
                {/* STATUS DISTRIBUTION */}
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
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* DEPARTMENTAL TRENDS */}
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
                    <div className="mt-6 flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-advent-navy"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Projects</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-advent-blue"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Impact Score</span>
                        </div>
                    </div>
                </div>

                {/* STAGNANT PROJECTS LIST */}
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
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Days Stale</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stagnantProjects.map((p, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 font-bold text-slate-700 max-w-md truncate">{p.title}</td>
                                        <td className="py-4 text-xs font-medium text-slate-500">{p.lead_proponents?.join(", ")}</td>
                                        <td className="py-4 text-xs font-bold text-slate-400">{p.last_updated_date}</td>
                                        <td className="py-4">
                                            <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black">
                                                {differenceInDays(new Date(), new Date(p.last_updated_date))} Days
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button className="text-advent-blue font-black text-[10px] uppercase tracking-widest hover:underline">
                                                Nudge Manager
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
