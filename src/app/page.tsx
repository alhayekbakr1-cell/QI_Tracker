"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import PHIWarning from "@/components/PHIWarning";
import ProjectCard from "@/components/ProjectCard";
import { Project, ProjectStatus } from "@/types";
import { Plus, Search, Filter, ArrowRight, List, LayoutPanelLeft, Activity, ChevronDown, ChevronRight, AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardCharts from "@/components/DashboardCharts";
import ConferenceMatcher from "@/components/ConferenceMatcher";
import ActivityFeed from "@/components/ActivityFeed";
import AcademicToolkit from "@/components/AcademicToolkit";
import { Skeleton } from "@/components/ui/custom-ui";
import RequestPortal from "@/components/RequestPortal";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{ role: string; full_name: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'initiatives' | 'toolkit' | 'analytics'>('initiatives');
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
      setUserId(user.id);

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
    Operator: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Viewer: 'bg-slate-800 text-slate-400 border-slate-700'
  }[role as 'Admin' | 'Faculty' | 'Operator' | 'Viewer'] || 'bg-slate-800 text-slate-400 border-slate-700';

  const roleLabel = {
    Admin: 'Overseer',
    Faculty: 'Faculty Mentor',
    Operator: 'Faculty Mentor',
    Viewer: 'Viewer'
  }[role as 'Admin' | 'Faculty' | 'Operator' | 'Viewer'] || 'Viewer';

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Unified Registry Dashboard Header, Welcome Card, and Compact Stats */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-advent-cobalt p-6 sm:p-8 rounded-[2rem] shadow-xl border border-slate-800 text-white animate-in fade-in duration-500">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch gap-8">
          {/* Welcome Info and PHI Warning Strip */}
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Institutional Registry
                </div>
                <span className="text-slate-650">•</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded border shadow-3xs ${roleBadgeStyles}`}>
                  {roleLabel}
                </span>
                <span className="text-slate-650">•</span>
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Active Portfolio</span>
              </div>
              <h1 className="text-2xl sm:text-3.5xl font-serif font-bold tracking-tight italic text-white leading-tight">
                Welcome back, <span className="text-emerald-400 font-sans not-italic font-black">{displayName}</span>
              </h1>
              <p className="text-slate-300 font-medium text-xs max-w-xl leading-relaxed">
                Monitoring clinical outcomes, PDSA cycles, and active resident initiatives under AdventHealth IM GME.
              </p>
            </div>

            {/* Embedded PHI Warning Banner */}
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-200/90 px-4 py-3 rounded-2xl text-[10px] font-semibold leading-normal max-w-xl shadow-inner">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 uppercase tracking-wider block mb-0.5">Protected Health Information (PHI) Notice</strong>
                Never enter patient identifiers (names, MRNs, DOBs). Ensure all data is fully de-identified per HIPAA Safe Harbor guidelines.
              </div>
            </div>
          </div>

          {/* Compact Stats 3x2 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-96 shrink-0 lg:border-l lg:border-slate-800 lg:pl-8">
            {[
              { label: "Total Portfolio", value: stats.Total, style: "border-slate-800 bg-slate-950/45 text-white" },
              { label: "Phase: Idea", value: stats.Idea, style: "border-violet-500/20 bg-violet-950/20 text-violet-300" },
              { label: "Pre-Intervention", value: stats['Pre-Intervention'], style: "border-blue-500/20 bg-blue-950/20 text-blue-300" },
              { label: "Ongoing PDSA", value: stats['Intervention Ongoing'], style: "border-amber-500/20 bg-amber-950/20 text-amber-300" },
              { label: "Sustained Gains", value: stats['Sustain the Gains'], style: "border-cyan-500/20 bg-cyan-950/20 text-cyan-300" },
              { label: "Impacted", value: stats['Impacted (Completed)'], style: "border-emerald-500/20 bg-emerald-950/20 text-emerald-300" },
            ].map((chip) => (
              <div
                key={chip.label}
                className={`flex flex-col justify-between p-3 rounded-xl border shadow-3xs transition-all hover:scale-[1.02] ${chip.style}`}
              >
                <span className="text-[8px] font-extrabold uppercase tracking-widest opacity-70 leading-tight">{chip.label}</span>
                <span className="text-xl sm:text-2.5xl font-black mt-1 leading-none">{chip.value}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative ambient blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl -mb-16 pointer-events-none" />
      </div>

      {/* Main Content Grid with Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Premium 3-Tab Dashboard Canvas */}
        <div className="lg:col-span-2 space-y-6">
          {/* High-density tab control */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
            {[
              { id: 'initiatives', label: 'Active Initiatives', icon: List },
              { id: 'toolkit', label: 'Scholarly Toolkit', icon: Sparkles },
              { id: 'analytics', label: 'Surveillance & Analytics', icon: Activity }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeMainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id as 'initiatives' | 'toolkit' | 'analytics')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-advent-navy animate-pulse" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Conditional Views depending on activeMainTab */}
          <div className="animate-in fade-in duration-300">
            {activeMainTab === 'initiatives' && (
              <div className="space-y-6">
                {role === 'Viewer' ? (
                  <RequestPortal userId={userId} />
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200/70 shadow-3xs">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900 text-white p-2 rounded-lg border border-slate-800 shadow-3xs">
                          <List className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Projects</span>
                          <h2 className="text-sm font-serif italic font-bold text-slate-900">
                            Active Quality Initiatives
                          </h2>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href="/projects/kanban"
                          prefetch={false}
                          className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-advent-navy flex items-center gap-1 transition-all"
                        >
                          Pipeline <LayoutPanelLeft className="w-3 h-3 text-slate-450" />
                        </Link>
                        <span className="text-slate-300">|</span>
                        <Link
                          href="/projects"
                          prefetch={false}
                          className="text-[8px] font-black uppercase tracking-[0.15em] text-advent-navy hover:text-advent-green flex items-center gap-1 transition-all"
                        >
                          View All <List className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recentProjects.length > 0 ? (
                        recentProjects.map(project => (
                          <ProjectCard key={project.id} project={project} />
                        ))
                      ) : (
                        <div className="col-span-2 py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-350">
                            <Filter className="w-6 h-6" />
                          </div>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active projects found.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeMainTab === 'toolkit' && (
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
                <AcademicToolkit />
              </div>
            )}

            {activeMainTab === 'analytics' && (
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-slate-900 text-white p-2 rounded-lg border border-slate-800 shadow-3xs">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Registry Surveillance</span>
                    <h2 className="text-sm font-serif italic font-bold text-slate-900">
                      Surveillance & Quality Metrics
                    </h2>
                  </div>
                </div>
                <DashboardCharts statusData={statusChartData} categoryData={categoryChartData} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Sidebar above the fold */}
        <div className="space-y-6 sticky top-6">
          {/* 1. Academic Deadlines & Conference Matcher (Strictly Above the Fold) */}
          <ConferenceMatcher />

          {/* 2. Quick Discovery & Filter Tools */}
          <div className="academic-card p-6 sm:p-8 space-y-6 bg-white border border-slate-200 rounded-3xl shadow-xs">
            <section className="space-y-3">
              <h3 className="academic-subheading flex items-center gap-2 text-[9px] font-extrabold text-slate-450 uppercase tracking-widest">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                Quick Discovery
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search GME initiatives..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-xl text-xs font-semibold focus:ring-3 focus:ring-advent-navy/5 focus:border-advent-navy outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350" />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="academic-subheading flex items-center gap-2 text-[9px] font-extrabold text-slate-450 uppercase tracking-widest">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Status Filter
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {['Idea', 'Pre-Intervention', 'Intervention Ongoing', 'Sustain the Gains', 'Impacted (Completed)'].map(s => (
                  <Link
                    key={s}
                    href={`/projects?status=${s}`}
                    prefetch={false}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-advent-navy hover:text-advent-navy rounded-lg text-[8px] font-black uppercase tracking-[0.12em] text-slate-500 transition-all duration-300 shadow-3xs"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="academic-subheading flex items-center gap-2 text-[9px] font-extrabold text-slate-450 uppercase tracking-widest">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Live Pulse
              </h3>
              <ActivityFeed />
            </section>
          </div>

          {/* 3. Quick Analytics Card - Scholarly Data Ledgers */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-advent-cobalt p-6 rounded-3xl shadow-xl border border-slate-800 text-white group cursor-pointer hover:shadow-slate-900/40 transition-all duration-500">
            <div className="relative z-10 flex flex-col h-full">
              <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Quantitative Ledger
              </div>
              <h3 className="font-serif italic font-bold text-xl mb-2 text-white">
                Analytics Suite
              </h3>
              <p className="text-[11px] text-slate-300 mb-5 font-medium leading-relaxed">
                Export comprehensive clinical data sets, measure PDSA cycle progression, and track residency QI compliance.
              </p>
              <div className="mt-auto">
                <Link
                  href="/metrics"
                  prefetch={false}
                  className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-emerald-400 hover:text-slate-950 flex items-center justify-center gap-2 group-hover:scale-102 duration-300 shadow-sm"
                >
                  Enter Analytics <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

