"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import PHIWarning from "@/components/PHIWarning";
import ProjectCard from "@/components/ProjectCard";
import { Project, ProjectStatus } from "@/types";
import { Plus, Search, Filter, ArrowRight, List, LayoutPanelLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import ConferenceMatcher from "@/components/ConferenceMatcher";
import ActivityFeed from "@/components/ActivityFeed";
import { Activity } from "lucide-react";

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
    'Impacted (Completed)': projects.filter(p => p.status === 'Impacted (Completed)').length,
  };

  const statusChartData = [
    { name: 'Idea', value: stats.Idea },
    { name: 'Pre-Intervention', value: stats['Pre-Intervention'] },
    { name: 'Intervention Ongoing', value: stats['Intervention Ongoing'] },
    { name: 'Sustain the Gains', value: stats['Sustain the Gains'] },
    { name: 'Impacted (Completed)', value: stats['Impacted (Completed)'] },
  ].filter(d => d.value > 0);

  const categoryChartData = [
    { name: 'Inpatient', value: projects.filter(p => p.category === 'Inpatient').length },
    { name: 'Outpatient', value: projects.filter(p => p.category === 'Outpatient').length },
  ];

  const recentProjects = projects.slice(0, 6);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

      {/* Header Section - Academic Refinement */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-advent-navy/60">
            <span className="w-8 h-px bg-advent-navy/20" /> Institutional Analytics
          </div>
          <h1 className="text-5xl font-black text-advent-navy tracking-tight leading-none italic">
            Quality Improvement <span className="text-advent-green not-italic underline decoration-advent-green/30 underline-offset-8">Tracker</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg pt-2 leading-relaxed max-w-2xl">
            Monitoring clinical outcomes, PDSA cycles, and resident-led initiatives across the GME enterprise.
          </p>
        </div>

        <Link
          href="/projects/new"
          prefetch={false}
          className="group flex items-center gap-3 bg-advent-navy text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-advent-navy/30 hover:bg-advent-cobalt hover:scale-105 transition-all duration-500 active:scale-95"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span>New Initiative</span>
        </Link>
      </div>

      <PHIWarning />

      {/* Stats Grid - Professional Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard label="Total Portfolio" value={stats.Total} variant="primary" />
        <StatCard label="Phase: Idea" value={stats.Idea} variant="default" />
        <StatCard label="Pre-Interv." value={stats['Pre-Intervention']} variant="default" />
        <StatCard label="Ongoing" value={stats['Intervention Ongoing']} variant="default" />
        <StatCard label="Sustained" value={stats['Sustain the Gains']} variant="success" />
        <StatCard label="Impacted" value={stats['Impacted (Completed)']} variant="success" />
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-2 shadow-sm">
        <DashboardCharts statusData={statusChartData} categoryData={categoryChartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        {/* Recent Updates */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <h2 className="text-2xl font-black text-advent-navy tracking-tight flex items-center gap-3">
              <div className="bg-advent-navy text-white p-2 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              Recently Updated
            </h2>
            <Link href="/projects/kanban" prefetch={false} className="text-xs font-black uppercase tracking-widest text-advent-green hover:text-advent-navy flex items-center gap-2 group transition-all">
              Visual Pipeline <LayoutPanelLeft className="w-4 h-4" />
            </Link>
            <Link href="/projects" prefetch={false} className="text-xs font-black uppercase tracking-widest text-advent-navy hover:text-advent-green flex items-center gap-2 group transition-all">
              View All <List className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentProjects.length > 0 ? (
              recentProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <div className="col-span-2 py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Filter className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No active projects found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <section>
              <h3 className="font-black text-advent-navy mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] opacity-60">
                <Search className="w-4 h-4" />
                Quick Discovery
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-advent-navy/10 focus:border-advent-navy outline-none transition-all placeholder:text-slate-400 placeholder:font-medium"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              </div>
            </section>

            <section>
              <h3 className="font-black text-advent-navy mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] opacity-60">
                <Filter className="w-4 h-4" />
                Status Filter
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Idea', 'Pre-Intervention', 'Intervention Ongoing', 'Sustain the Gains', 'Impacted (Completed)'].map(s => (
                  <Link
                    key={s}
                    href={`/projects?status=${s}`}
                    prefetch={false}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 hover:border-advent-navy hover:bg-white hover:text-advent-navy rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all duration-300 shadow-sm"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-black text-advent-navy mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] opacity-60">
                <Activity className="w-4 h-4" />
                Live Pulse
              </h3>
              <ActivityFeed />
            </section>

            <ConferenceMatcher />
          </div>

          {/* Quick Analytics Card - Professional Accent */}
          <div className="relative overflow-hidden bg-advent-navy p-10 rounded-[2.5rem] shadow-2xl text-white group cursor-pointer hover:shadow-advent-navy/40 transition-all duration-500">
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="font-black text-2xl mb-3 flex items-center gap-3 italic">
                Analytics <span className="text-advent-green not-italic">Suite</span>
              </h3>
              <p className="text-sm text-blue-100/70 mb-8 font-medium leading-relaxed">
                Export comprehensive data sets or monitor PDSA cycle progression across departments.
              </p>
              <div className="mt-auto">
                <Link
                  href="/metrics"
                  prefetch={false}
                  className="bg-white text-advent-navy px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-advent-green hover:text-white flex items-center justify-center gap-2 group-hover:scale-105 duration-300 shadow-lg"
                >
                  Enter Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-advent-sky/10 rounded-full blur-3xl -mr-12 -mt-12" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-advent-green/20 rounded-full blur-2xl -ml-12 -mb-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string, value: number, variant: 'primary' | 'success' | 'default' }) {
  const styles = {
    primary: 'bg-advent-navy text-white border-transparent shadow-advent-navy/20',
    success: 'bg-white border-slate-200 text-slate-900', // Fixed contrast
    default: 'bg-white border-slate-200 text-slate-900'
  }

  const labelStyles = {
    primary: 'text-blue-200/80',
    success: 'text-advent-green', // Use brand green for the label to distinguish
    default: 'text-slate-400'
  }

  const valueStyles = {
    primary: 'text-white',
    success: 'text-slate-900', // Black text on white back avoids "white on white" issues
    default: 'text-advent-navy'
  }

  return (
    <div className={`${styles[variant]} p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden group`}>
      <span className={`text-[9px] uppercase font-black tracking-[0.2em] mb-3 text-center z-10 ${labelStyles[variant]}`}>
        {label}
      </span>
      <span className={`text-4xl font-black z-10 transition-all group-hover:scale-110 duration-500 ${valueStyles[variant]}`}>
        {value}
      </span>

      {/* Subtle background decoration */}
      {variant === 'primary' && (
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700" />
      )}
      {variant === 'success' && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-advent-green" />
      )}
    </div>
  )
}

// Import Activity for header
