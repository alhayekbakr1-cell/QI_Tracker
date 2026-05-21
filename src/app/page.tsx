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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200/60 pb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
            <span className="w-6 h-px bg-slate-300" /> Institutional Registry
          </div>
          <h1 className="text-4.5xl sm:text-5xl font-serif italic font-semibold text-slate-900 tracking-tight leading-none">
            Quality Improvement <span className="font-sans not-italic text-advent-navy font-black tracking-normal">Tracker</span>
          </h1>
          <p className="text-slate-500 font-medium text-base pt-2 leading-relaxed max-w-2xl">
            Monitoring clinical outcomes, PDSA cycles, and resident-led initiatives across the GME enterprise.
          </p>
        </div>

        <Link
          href="/projects/new"
          prefetch={false}
          className="group flex items-center gap-2.5 bg-gradient-to-br from-advent-navy to-advent-cobalt text-white px-6 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] shadow-md shadow-advent-cobalt/15 hover:scale-102 hover:shadow-lg transition-all duration-300 active:scale-98 border border-white/10"
        >
          <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500 text-advent-green" />
          <span>New Initiative</span>
        </Link>
      </div>

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-advent-cobalt p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-800 text-white animate-in fade-in duration-500">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                GME Investigator Portal
              </span>
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-md border shadow-sm ${roleBadgeStyles}`}>
                {roleLabel}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight italic text-white leading-tight">
              Welcome back, <span className="text-advent-green font-sans not-italic font-black">{displayName}</span>
            </h2>
            <p className="text-slate-300 font-medium text-xs sm:text-sm max-w-xl leading-relaxed">
              Here is the live status of clinical outcomes and residency-led quality improvement initiatives.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="text-right">
              <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Active Registry</div>
              <div className="text-xs font-bold text-white">AdventHealth IM GME</div>
            </div>
          </div>
        </div>
        {/* Decorative ambient blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-advent-sky/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-12 w-48 h-48 bg-advent-green/5 rounded-full blur-2xl -mb-16" />
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
          <div className="flex justify-between items-center bg-slate-50/30 px-6 py-4 rounded-2xl border border-slate-200/50">
            <h2 className="text-xl font-serif italic font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="bg-gradient-to-br from-advent-navy to-advent-cobalt text-white p-2 rounded-xl border border-white/10 shadow-xs">
                <Activity className="w-4 h-4 text-advent-green" />
              </div>
              Recently Updated
            </h2>
            <div className="flex items-center gap-4">
              <Link href="/projects/kanban" prefetch={false} className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-advent-navy flex items-center gap-1.5 transition-all">
                Pipeline <LayoutPanelLeft className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <span className="text-slate-350">|</span>
              <Link href="/projects" prefetch={false} className="text-[9px] font-black uppercase tracking-[0.15em] text-advent-navy hover:text-advent-green flex items-center gap-1.5 transition-all">
                View All <List className="w-3.5 h-3.5" />
              </Link>
            </div>
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
          <div className="academic-card p-8 space-y-8">
            <section>
              <h3 className="academic-subheading mb-6 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                Quick Discovery
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search initiatives..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:ring-3 focus:ring-advent-navy/5 focus:border-advent-navy outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350" />
              </div>
            </section>

            <section>
              <h3 className="academic-subheading mb-6 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Status Filter
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Idea', 'Pre-Intervention', 'Intervention Ongoing', 'Sustain the Gains', 'Impacted (Completed)'].map(s => (
                  <Link
                    key={s}
                    href={`/projects?status=${s}`}
                    prefetch={false}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-advent-navy hover:text-advent-navy rounded-lg text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 transition-all duration-300 shadow-2xs"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h3 className="academic-subheading mb-6 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Live Pulse
              </h3>
              <ActivityFeed />
            </section>

            <ConferenceMatcher />
          </div>

          {/* Quick Analytics Card - Professional Accent */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-advent-cobalt p-8 rounded-3xl shadow-xl border border-slate-800 text-white group cursor-pointer hover:shadow-slate-900/40 transition-all duration-500">
            <div className="relative z-10 flex flex-col h-full">
              <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Quantitative Ledger
              </div>
              <h3 className="font-serif italic font-bold text-2xl mb-3 text-white">
                Analytics Suite
              </h3>
              <p className="text-xs text-slate-350 mb-6 font-medium leading-relaxed">
                Export comprehensive clinical data sets, measure PDSA cycle progression, and track residency QI compliance.
              </p>
              <div className="mt-auto">
                <Link
                  href="/metrics"
                  prefetch={false}
                  className="bg-white text-slate-900 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-advent-green hover:text-white flex items-center justify-center gap-2 group-hover:scale-102 duration-355 shadow-sm border border-transparent"
                >
                  Enter Analytics <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-advent-sky/5 rounded-full blur-3xl -mr-12 -mt-12" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-advent-green/5 rounded-full blur-2xl -ml-12 -mb-12" />
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
      border: 'border-l-3 border-l-slate-800',
      bg: 'bg-white',
      valueColor: 'text-slate-900 font-serif italic font-semibold',
      labelColor: 'text-slate-500',
      badge: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    'Idea': {
      border: 'border-l-3 border-l-violet-500',
      bg: 'bg-white',
      valueColor: 'text-violet-950 font-serif italic font-semibold',
      labelColor: 'text-violet-600',
      badge: 'bg-violet-50 text-violet-700 border-violet-200/50',
    },
    'Pre-Intervention': {
      border: 'border-l-3 border-l-blue-500',
      bg: 'bg-white',
      valueColor: 'text-blue-950 font-serif italic font-semibold',
      labelColor: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200/50',
    },
    'Intervention Ongoing': {
      border: 'border-l-3 border-l-amber-500',
      bg: 'bg-white',
      valueColor: 'text-amber-950 font-serif italic font-semibold',
      labelColor: 'text-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/50',
    },
    'Sustain the Gains': {
      border: 'border-l-3 border-l-cyan-500',
      bg: 'bg-white',
      valueColor: 'text-cyan-950 font-serif italic font-semibold',
      labelColor: 'text-cyan-600',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200/50',
    },
    'Impacted (Completed)': {
      border: 'border-l-3 border-l-emerald-500',
      bg: 'bg-white',
      valueColor: 'text-emerald-950 font-serif italic font-semibold',
      labelColor: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    }
  }[status];

  return (
    <div className={`academic-card ${config.border} p-6 flex flex-col items-start justify-between min-h-[140px] relative overflow-hidden group`}>
      <span className={`text-[9px] uppercase font-black tracking-[0.2em] mb-2 z-10 ${config.labelColor}`}>
        {label}
      </span>
      <span className={`text-4xl sm:text-5xl z-10 transition-all group-hover:scale-102 duration-300 ${config.valueColor}`}>
        {value}
      </span>
      <div className={`absolute bottom-3 right-3 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border shadow-2xs z-10 ${config.badge}`}>
        {status === 'Total' ? 'Enterprise' : 'Stage'}
      </div>
      {/* Decorative hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-0" />
    </div>
  )
}

// Import Activity for header
