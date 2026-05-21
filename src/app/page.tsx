"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import PHIWarning from "@/components/PHIWarning";
import ProjectCard from "@/components/ProjectCard";
import { Project, ProjectStatus } from "@/types";
import { Plus, Search, Filter, ArrowRight, List, LayoutPanelLeft, Activity } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import ConferenceMatcher from "@/components/ConferenceMatcher";
import ActivityFeed from "@/components/ActivityFeed";
import { Skeleton } from "@/components/ui/custom-ui";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{ role: string; full_name: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const formatName = (email?: string, name?: string | null) => {
    if (name) return name;
    if (!email) return "User";
    return email.split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || "");

      // Fetch user profile role and full name
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      setUserProfile(profile || { role: "Viewer", full_name: null });

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
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-10">
          <div className="space-y-4 w-full md:w-2/3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-6 w-full" />
          </div>
          <Skeleton className="h-14 w-48 rounded-2xl animate-pulse" />
        </div>

        {/* Welcome Banner Skeleton */}
        <Skeleton className="h-44 w-full rounded-[2.5rem] animate-pulse" />

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-3xl animate-pulse" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <Skeleton className="h-96 w-full rounded-[2.5rem] animate-pulse" />

        {/* Recent & Sidebar Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-16 w-full rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-48 rounded-3xl animate-pulse" />
              <Skeleton className="h-48 rounded-3xl animate-pulse" />
            </div>
          </div>
          <div className="space-y-8">
            <Skeleton className="h-96 w-full rounded-[2.5rem] animate-pulse" />
          </div>
        </div>
      </div>
    );
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

  const displayName = formatName(userEmail, userProfile?.full_name);
  const role = userProfile?.role || "Viewer";

  const roleBadgeStyles = {
    Admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Faculty: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Operator: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Viewer: 'bg-slate-800 text-slate-400 border-slate-700'
  }[role as 'Admin' | 'Faculty' | 'Operator' | 'Viewer'] || 'bg-slate-800 text-slate-400 border-slate-700';

  const roleLabel = {
    Admin: 'Overseer',
    Faculty: 'Faculty Mentor',
    Operator: 'Operator',
    Viewer: 'Viewer'
  }[role as 'Admin' | 'Faculty' | 'Operator' | 'Viewer'] || 'Viewer';

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

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-advent-navy p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-800 text-white animate-in fade-in duration-500">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                GME Portal
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${roleBadgeStyles}`}>
                {roleLabel}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Welcome back, <span className="text-advent-green italic">{displayName}</span>
            </h2>
            <p className="text-slate-300 font-medium text-sm max-w-xl">
              Here is the live status of clinical outcomes and residency-led quality improvement initiatives.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-lg">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Workspace</div>
              <div className="text-sm font-black text-white">AdventHealth IM GME</div>
            </div>
          </div>
        </div>
        {/* Decorative ambient blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-advent-cobalt/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-12 w-48 h-48 bg-advent-green/10 rounded-full blur-2xl -mb-16" />
      </div>

      <PHIWarning />

      {/* Stats Grid - Professional Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard label="Total Portfolio" value={stats.Total} status="Total" />
        <StatCard label="Phase: Idea" value={stats.Idea} status="Idea" />
        <StatCard label="Pre-Interv." value={stats['Pre-Intervention']} status="Pre-Intervention" />
        <StatCard label="Ongoing" value={stats['Intervention Ongoing']} status="Intervention Ongoing" />
        <StatCard label="Sustained" value={stats['Sustain the Gains']} status="Sustain the Gains" />
        <StatCard label="Impacted" value={stats['Impacted (Completed)']} status="Impacted (Completed)" />
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

function StatCard({
  label,
  value,
  status
}: {
  label: string;
  value: number;
  status: 'Total' | 'Idea' | 'Pre-Intervention' | 'Intervention Ongoing' | 'Sustain the Gains' | 'Impacted (Completed)'
}) {
  const config = {
    'Total': {
      border: 'border-l-4 border-l-slate-800 border-slate-200/70',
      bg: 'bg-white',
      valueColor: 'text-slate-900',
      labelColor: 'text-slate-500',
      badge: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    'Idea': {
      border: 'border-l-4 border-l-violet-500 border-slate-200/70',
      bg: 'bg-violet-50/20',
      valueColor: 'text-violet-900',
      labelColor: 'text-violet-600',
      badge: 'bg-violet-100/60 text-violet-850 border-violet-200/30',
    },
    'Pre-Intervention': {
      border: 'border-l-4 border-l-blue-500 border-slate-200/70',
      bg: 'bg-blue-50/20',
      valueColor: 'text-blue-900',
      labelColor: 'text-blue-600',
      badge: 'bg-blue-100/60 text-blue-850 border-blue-200/30',
    },
    'Intervention Ongoing': {
      border: 'border-l-4 border-l-amber-500 border-slate-200/70',
      bg: 'bg-amber-50/20',
      valueColor: 'text-amber-900',
      labelColor: 'text-amber-600',
      badge: 'bg-amber-100/60 text-amber-850 border-amber-200/30',
    },
    'Sustain the Gains': {
      border: 'border-l-4 border-l-cyan-500 border-slate-200/70',
      bg: 'bg-cyan-50/20',
      valueColor: 'text-cyan-900',
      labelColor: 'text-cyan-600',
      badge: 'bg-cyan-100/60 text-cyan-850 border-cyan-200/30',
    },
    'Impacted (Completed)': {
      border: 'border-l-4 border-l-emerald-500 border-slate-200/70',
      bg: 'bg-emerald-50/20',
      valueColor: 'text-emerald-900',
      labelColor: 'text-emerald-600',
      badge: 'bg-emerald-100/60 text-emerald-850 border-emerald-200/30',
    }
  }[status];

  return (
    <div className={`bg-white ${config.border} p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start justify-between min-h-[140px] relative overflow-hidden group`}>
      <span className={`text-[9px] uppercase font-black tracking-[0.2em] mb-2 z-10 ${config.labelColor}`}>
        {label}
      </span>
      <span className={`text-4xl sm:text-5xl font-black z-10 transition-all group-hover:scale-105 duration-300 ${config.valueColor}`}>
        {value}
      </span>
      <div className={`absolute bottom-3 right-3 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border shadow-sm z-10 ${config.badge}`}>
        {status === 'Total' ? 'Enterprise' : 'Stage'}
      </div>
      {/* Decorative hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-0" />
    </div>
  )
}

// Import Activity for header
