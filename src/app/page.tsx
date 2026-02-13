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
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Dashboard</h1>
          <p className="text-slate-500">Overview of all active Quality Improvement projects.</p>
        </div>

        <Link
          href="/projects/new"
          prefetch={false}
          className="flex items-center gap-2 bg-advent-blue text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-advent-blue/20 hover:bg-advent-dark-blue transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </Link>
      </div>

      <PHIWarning />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Projects" value={stats.Total} color="bg-advent-blue" textColor="text-white" />
        <StatCard label="Ideas" value={stats.Idea} color="bg-white" textColor="text-slate-900" />
        <StatCard label="Pre-Interv." value={stats['Pre-Intervention']} color="bg-white" textColor="text-slate-900" />
        <StatCard label="Ongoing" value={stats['Intervention Ongoing']} color="bg-white" textColor="text-slate-900" />
        <StatCard label="Sustained" value={stats['Sustain the Gains']} valueColor="text-advent-green" color="bg-white" textColor="text-slate-900" />
      </div>

      <DashboardCharts statusData={statusChartData} categoryData={categoryChartData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Updates */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recently Updated</h2>
            <Link href="/projects" prefetch={false} className="text-sm font-bold text-advent-blue hover:text-advent-lightblue flex items-center gap-1 group">
              View all Masterlist <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentProjects.length > 0 ? (
              recentProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <div className="col-span-2 py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">No projects found. Start by importing or creating a new one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Filters */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Quick Find
            </h3>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search Title or Proponent..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>

            <h3 className="font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter by Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Idea', 'Pre-Intervention', 'Intervention Ongoing', 'Sustain the Gains'].map(s => (
                <Link
                  key={s}
                  href={`/projects?status=${s}`}
                  prefetch={false}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-xs font-semibold text-slate-600 transition-colors"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-6 rounded-xl shadow-lg text-white">
            <h3 className="font-bold mb-2">Metrics Snapshot</h3>
            <p className="text-sm text-blue-100 mb-4">Track PDSA cycles and project outcomes across the department.</p>
            <Link
              href="/metrics"
              prefetch={false}
              className="inline-block bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors backdrop-blur-sm"
            >
              Go to departmental metrics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, textColor, valueColor }: { label: string, value: number, color: string, textColor: string, valueColor?: string }) {
  return (
    <div className={`${color} p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[120px]`}>
      <span className={`text-[10px] uppercase font-black tracking-widest ${textColor} opacity-60 mb-2 text-center`}>{label}</span>
      <span className={`text-4xl font-black ${valueColor || textColor}`}>{value}</span>
    </div>
  )
}
