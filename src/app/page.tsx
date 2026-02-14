"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import PHIWarning from "@/components/PHIWarning";
import ProjectCard from "@/components/ProjectCard";
import { Project, ProjectStatus } from "@/types";
import { Plus, Search, Filter, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("last_updated_date", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setProjects((data || []) as Project[]);
      }
      setIsLoading(false);
    }

    fetchDashboardData();
  }, [supabase, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Statistics
  const stats: Record<ProjectStatus | 'Total', number> = {
    'Total': projects.length,
    'Idea': projects.filter(p => p.status === 'Idea').length,
    'Pre-Intervention': projects.filter(p => p.status === 'Pre-Intervention').length,
    'Intervention Ongoing': projects.filter(p => p.status === 'Intervention Ongoing').length,
    'Sustain the Gains': projects.filter(p => p.status === 'Sustain the Gains').length,
  };

  const statusChartData = [
    { name: 'Idea', value: stats.Idea },
    { name: 'Pre-Intervention', value: stats['Pre-Intervention'] },
    { name: 'Intervention Ongoing', value: stats['Intervention Ongoing'] },
    { name: 'Sustain the Gains', value: stats['Sustain the Gains'] },
  ].filter(d => d.value > 0);

  const categoryChartData = [
    { name: 'Inpatient', value: projects.filter(p => p.category === 'Inpatient').length },
    { name: 'Outpatient', value: projects.filter(p => p.category === 'Outpatient').length },
  ];

  const recentProjects = projects.slice(0, 6);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-advent-navy tracking-tight mb-2">System Dashboard</h1>
          <p className="text-slate-500 font-medium text-lg">Active Quality Improvement Initiatives</p>
        </div>

        <Link
          href="/projects/new"
          prefetch={false}
          className="group flex items-center gap-2 bg-gradient-to-r from-advent-navy to-advent-cobalt text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-advent-cobalt/20 hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span>New Project</span>
        </Link>
      </div>

      <PHIWarning />

      {/* Stats Grid - Glassmorphism */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Projects" value={stats.Total} variant="primary" />
        <StatCard label="Ideas" value={stats.Idea} variant="default" />
        <StatCard label="Pre-Interv." value={stats['Pre-Intervention']} variant="default" />
        <StatCard label="Ongoing" value={stats['Intervention Ongoing']} variant="default" />
        <StatCard label="Sustained" value={stats['Sustain the Gains']} variant="success" />
      </div>

      <DashboardCharts statusData={statusChartData} categoryData={categoryChartData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Updates */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-advent-navy tracking-tight flex items-center gap-3">
              <Activity className="w-6 h-6 text-advent-kobalt" />
              Recently Updated
            </h2>
            <Link href="/projects" prefetch={false} className="text-sm font-bold text-advent-cobalt hover:text-advent-navy flex items-center gap-1 group transition-colors">
              View Masterlist <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentProjects.length > 0 ? (
              recentProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <div className="col-span-2 py-20 text-center bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 font-medium">No projects found. Start by creating a new one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Filters */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl">
            <h3 className="font-bold text-advent-navy mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-advent-cobalt" />
              Quick Find
            </h3>
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search Title or Proponent..."
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-advent-cobalt/20 focus:border-advent-cobalt outline-none transition-all placeholder:text-slate-400"
              />
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>

            <h3 className="font-bold text-advent-navy mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-advent-cobalt" />
              Filter by Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Idea', 'Pre-Intervention', 'Intervention Ongoing', 'Sustain the Gains'].map(s => (
                <Link
                  key={s}
                  href={`/projects?status=${s}`}
                  prefetch={false}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-advent-cobalt hover:text-advent-cobalt rounded-lg text-xs font-bold text-slate-500 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-advent-navy to-advent-cobalt p-8 rounded-2xl shadow-xl text-white group cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Metrics Snapshot
              </h3>
              <p className="text-sm text-blue-100 mb-6 font-medium leading-relaxed opacity-90">
                Track departmental PDSA cycles and project outcomes in real-time.
              </p>
              <Link
                href="/metrics"
                prefetch={false}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold transition-all backdrop-blur-sm"
              >
                View Analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {/* Decorative background blobs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-fullblur-2xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-advent-green/20 rounded-full blur-xl -ml-10 -mb-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string, value: number, variant: 'primary' | 'success' | 'default' }) {
  const styles = {
    primary: 'bg-gradient-to-br from-advent-navy to-advent-cobalt text-white border-transparent',
    success: 'bg-white text-slate-800 border-b-4 border-b-advent-green',
    default: 'bg-white text-slate-800 border-slate-200'
  }

  const valueStyles = {
    primary: 'text-white',
    success: 'text-advent-green',
    default: 'text-slate-900'
  }

  return (
    <div className={`${styles[variant]} p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden`}>
      <span className={`text-[10px] uppercase font-black tracking-widest opacity-70 mb-2 text-center z-10 ${variant === 'primary' ? 'text-blue-200' : 'text-slate-400'}`}>
        {label}
      </span>
      <span className={`text-4xl font-extrabold z-10 ${valueStyles[variant]}`}>
        {value}
      </span>

      {/* Subtle background decoration for primary card */}
      {variant === 'primary' && (
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
      )}
    </div>
  )
}
// Import Activity for header
import { Activity } from 'lucide-react';
