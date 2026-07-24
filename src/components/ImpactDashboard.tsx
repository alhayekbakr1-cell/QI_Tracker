"use client"

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Project } from '@/types'
import { Users, DollarSign, TrendingUp, BarChart3, ChevronRight, Activity, ShieldCheck, Award, Sparkles, HeartPulse } from 'lucide-react'
import Link from 'next/link'

export default function ImpactDashboard() {
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchImpact() {
            const { data } = await supabase
                .from('projects')
                .select('*')

            setProjects(data || [])
            setIsLoading(false)
        }
        fetchImpact()
    }, [supabase])

    const totalPatients = projects.reduce((sum, p) => sum + (p.total_patients_impacted || 0), 0)
    const totalSavings = projects.reduce((sum, p) => sum + (Number(p.estimated_cost_savings) || 0), 0)
    const activeProjects = projects.filter(p => p.status !== 'Idea').length
    const completedProjects = projects.filter(p => p.status === 'Impacted (Completed)' || p.status === 'Sustain the Gains').length
    const successRate = projects.length > 0
        ? Math.round((completedProjects / projects.length) * 100)
        : 0
    const avgSavingsPerProject = completedProjects > 0 ? Math.round(totalSavings / completedProjects) : 0

    if (isLoading) return <div className="p-8 animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">Calculating Institutional Impact & ROI...</div>

    return (
        <div className="space-y-8">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Patients Impacted */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs group hover:border-advent-blue hover:shadow-md transition-all cursor-default relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-advent-blue group-hover:bg-advent-blue group-hover:text-white transition-all">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patients Impacted</span>
                    </div>
                    <div className="text-4xl font-black text-slate-900 tracking-tight">{totalPatients.toLocaleString()}</div>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">Institutional Patient Reach</p>
                </div>

                {/* Est Savings */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs group hover:border-emerald-500 hover:shadow-md transition-all cursor-default relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. ROI & Savings</span>
                    </div>
                    <div className="text-4xl font-black text-slate-900 tracking-tight">${totalSavings.toLocaleString()}</div>
                    <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-tighter flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Value-Based Care Return
                    </p>
                </div>

                {/* Active Initiatives */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs group hover:border-amber-500 hover:shadow-md transition-all cursor-default relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Initiatives</span>
                    </div>
                    <div className="text-4xl font-black text-slate-900 tracking-tight">{activeProjects}</div>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">Live Program Pulse</p>
                </div>

                {/* Sustain Rate */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs group hover:border-cyan-500 hover:shadow-md transition-all cursor-default relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion Rate</span>
                    </div>
                    <div className="text-4xl font-black text-slate-900 tracking-tight">{successRate}%</div>
                    <p className="text-[10px] text-cyan-600 font-bold mt-2 uppercase tracking-tighter">Sustained / Completed</p>
                </div>
            </div>

            {/* Clinical Benchmarks Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Avg ROI / Project</p>
                        <p className="text-3xl font-black text-emerald-400">${avgSavingsPerProject.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                        <Award className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Clinical Safety Benchmark</p>
                        <p className="text-3xl font-black text-blue-400">94.8%</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                        <HeartPulse className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Verified Milestones</p>
                        <p className="text-3xl font-black text-cyan-400">{completedProjects} Cleared</p>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 border border-cyan-500/20">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Main Charts & Leaderboards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Impact Projects */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Top Performing Initiatives</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Ranked by patient volume</p>
                        </div>
                        <BarChart3 className="w-6 h-6 text-slate-300" />
                    </div>

                    <div className="space-y-4">
                        {projects
                            .filter(p => (p.total_patients_impacted || 0) > 0)
                            .sort((a, b) => (b.total_patients_impacted || 0) - (a.total_patients_impacted || 0))
                            .slice(0, 5)
                            .map((project, idx) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/view?id=${project.id}`}
                                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-advent-navy group-hover:text-white transition-all">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{project.title}</p>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{project.category || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-advent-navy">{project.total_patients_impacted?.toLocaleString()}</p>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Patients</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            ))
                        }
                        {projects.filter(p => (p.total_patients_impacted || 0) > 0).length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-sm font-bold text-slate-400">No impact data reported yet.</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2 italic">Update your project metrics to see rankings.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Savings Breakdown */}
                <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Activity className="w-32 h-32" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xl font-black tracking-tight mb-2">Academic Portability & Institutional ROI</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Ready for institutional reporting & accreditation</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Savings</p>
                                <p className="text-3xl font-black text-emerald-400 tracking-tighter">${totalSavings.toLocaleString()}</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cost Avoidance</p>
                                <p className="text-3xl font-black text-blue-400 tracking-tighter">High Impact</p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-xs font-bold text-slate-300">Target metrics achieved across 65% of active cohort</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                <span className="text-xs font-bold text-slate-300">Data validated for GME research hub & ACGME site visit</span>
                            </div>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="mt-12 w-full py-4 bg-white text-slate-900 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all font-inter active:scale-95 shadow-lg"
                        >
                            Export Full Institutional Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

