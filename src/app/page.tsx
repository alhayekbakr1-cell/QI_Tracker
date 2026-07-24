"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import PHIWarning from "@/components/PHIWarning";
import ProjectCard from "@/components/ProjectCard";
import { Project, ProjectStatus } from "@/types";
import { Plus, Search, Filter, ArrowRight, List, LayoutPanelLeft, Activity, ChevronDown, ChevronRight, AlertTriangle, Sparkles, Trophy } from "lucide-react";
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
  const [activeMainTab, setActiveMainTab] = useState<'initiatives' | 'matcher' | 'toolkit' | 'analytics'>('initiatives');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'search' | 'updates'>('search');
  const [activeConcept, setActiveConcept] = useState<'concept1' | 'concept2' | 'concept3' | 'concept4'>('concept1');
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

  // Dynamic 6-month project cumulative growth calculation
  const getTimelineData = () => {
    const months: { name: string; year: number; monthNum: number; count: number }[] = [];
    const now = new Date();
    // Generate last 6 months labels, e.g., ["Dec", "Jan", "Feb", "Mar", "Apr", "May"]
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        count: 0
      });
    }

    // Distribute projects to months based on created_at or last_updated_date if created_at is missing
    projects.forEach(p => {
      const targetDateStr = p.created_at || p.last_updated_date;
      if (!targetDateStr) return;
      const createdDate = new Date(targetDateStr);
      // Find matching month
      const match = months.find(m => m.year === createdDate.getFullYear() && m.monthNum === createdDate.getMonth());
      if (match) {
        match.count++;
      } else {
        // If it was created before the 6-month window, it should count towards the baseline of the first month
        const firstMonthDate = new Date(months[0].year, months[0].monthNum, 1);
        if (createdDate < firstMonthDate) {
          months[0].count++;
        }
      }
    });

    // Compute cumulative sum
    let cumulative = 0;
    const timelineData = months.map(m => {
      cumulative += m.count;
      return {
        name: m.name,
        value: cumulative
      };
    });

    return timelineData;
  };

  const timelineChartData = getTimelineData();

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
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-750">
      {/* 🎨 Executive Design Concept Switcher Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/70 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-advent-navy text-white p-2 rounded-xl border border-white/10 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-serif font-bold text-slate-900 leading-none">Athena Redesign Preview</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Switch Concept Layouts in Real Time</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 text-[9px] font-black uppercase tracking-wider">
          {[
            { id: 'concept1', label: '1. Command Center' },
            { id: 'concept2', label: '2. Futuristic AI' },
            { id: 'concept3', label: '3. Editorial Showcase' },
            { id: 'concept4', label: '4. Modular Grid' },
          ].map((concept) => (
            <button
              key={concept.id}
              onClick={() => setActiveConcept(concept.id as any)}
              className={`px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer ${
                activeConcept === concept.id
                  ? 'bg-advent-navy text-white shadow-md font-bold scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {concept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render Selected Concept Layout */}
      {activeConcept === 'concept1' && (
        <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden premium-gradient-card p-8 sm:p-10 border border-slate-800/85 text-white animate-in fade-in duration-500">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch gap-10">
          {/* Welcome Info and Institutional Security Seals */}
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-950/45 text-emerald-400 px-3.5 py-1.5 rounded-full border border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.25em] neon-glow-emerald">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  Live Surveillance Registry
                </div>
                <span className="text-slate-700">•</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full border shadow-lg ${roleBadgeStyles} backdrop-blur-md`}>
                  {roleLabel}
                </span>
                <span className="text-slate-700">•</span>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                  IM GME Portfolio
                </span>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight italic text-white leading-none">
                  Welcome back, <span className="text-gradient-emerald font-sans not-italic font-black">{displayName}</span>
                </h1>
                <p className="text-slate-300 font-medium text-xs sm:text-sm max-w-xl leading-relaxed">
                  Monitoring clinical quality, active resident protocols, and institutional metrics under AdventHealth Tampa.
                </p>
              </div>
            </div>

            {/* Embedded PHI Warning Banner with Luxury Gold Glow */}
            <div className="flex items-start gap-4 bg-amber-500/5 border border-amber-500/15 text-amber-250/90 p-5 rounded-[2rem] text-xs font-semibold leading-relaxed max-w-2xl shadow-inner backdrop-blur-xs relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/40" />
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong className="text-amber-300 uppercase tracking-widest font-black block mb-1 text-[10px]">
                  Protected Health Information (PHI) Notice
                </strong>
                Never enter patient identifiers (names, MRNs, DOBs). Ensure all registry inputs are de-identified under HIPAA Safe Harbor guidelines.
              </div>
            </div>
          </div>

          {/* Compact Stats 3x2 Grid - styled as Luxury Registry Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 w-full lg:w-[26rem] shrink-0 lg:border-l lg:border-slate-800/80 lg:pl-10 relative">
            {[
              { label: "Total Initiatives", value: stats.Total, style: "border-slate-800 bg-slate-950/60 text-white shadow-inner" },
              { label: "Phase: Idea", value: stats.Idea, style: "border-violet-500/15 bg-violet-950/15 text-violet-300 neon-glow-violet" },
              { label: "Pre-Intervention", value: stats['Pre-Intervention'], style: "border-blue-500/15 bg-blue-950/15 text-blue-300 neon-glow-sky" },
              { label: "Ongoing PDSA", value: stats['Intervention Ongoing'], style: "border-amber-500/15 bg-amber-950/15 text-amber-300" },
              { label: "Sustained Gains", value: stats['Sustain the Gains'], style: "border-cyan-500/15 bg-cyan-950/15 text-cyan-300" },
              { label: "Completed Impact", value: stats['Impacted (Completed)'], style: "border-emerald-500/15 bg-emerald-950/15 text-emerald-300 neon-glow-emerald" },
            ].map((chip) => (
              <div
                key={chip.label}
                className={`flex flex-col justify-between p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] ${chip.style}`}
              >
                <span className="text-[8px] font-extrabold uppercase tracking-widest opacity-60 leading-tight block truncate">
                  {chip.label}
                </span>
                <span className="text-2xl sm:text-3.5xl font-black mt-2 leading-none font-sans">
                  {chip.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Beautiful ambient visual glow blobs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-advent-navy/15 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mb-20 pointer-events-none" />
      </div>

      {/* 🏛️ Main Interactive Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns: Dynamic Tabbed Canvas */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom Luxury Tab Switcher Container */}
          <div className="flex p-2 bg-slate-100/80 rounded-[2rem] border border-slate-200/80 shadow-[inset_0_2px_4px_rgba(15,23,42,0.03)] backdrop-blur-md">
            {[
              { id: 'initiatives', label: 'Active Initiatives', icon: List },
              { id: 'matcher', label: 'Conference Matcher', icon: Trophy },
              { id: 'toolkit', label: 'Scholarly Toolkit', icon: Sparkles },
              { id: 'analytics', label: 'Surveillance Hub', icon: Activity }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeMainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id as 'initiatives' | 'matcher' | 'toolkit' | 'analytics')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 sm:px-5 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-white text-advent-navy border border-slate-200/60 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.05)] scale-102"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  <TabIcon className={`w-4 h-4 transition-transform ${isActive ? "text-advent-navy animate-pulse" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Conditional Views with Smooth Animations */}
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            {activeMainTab === 'initiatives' && (
              <div className="space-y-6">
                {role === 'Viewer' ? (
                  <RequestPortal userId={userId} />
                ) : (
                  <>
                    {/* Header Panel for Initiatives */}
                    <div className="flex justify-between items-center bg-white px-8 py-5 rounded-[2rem] border border-slate-200/60 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-advent-navy to-advent-green" />
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-950 text-white p-3 rounded-2xl border border-slate-800 shadow-md">
                          <List className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Institutional Initiatives</span>
                          <h2 className="text-base font-serif italic font-bold text-slate-900">
                            Active Quality Registry
                          </h2>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Link
                          href="/projects/kanban"
                          prefetch={false}
                          className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-advent-navy flex items-center gap-1.5 transition-all"
                        >
                          Pipeline <LayoutPanelLeft className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                        <span className="text-slate-200">/</span>
                        <Link
                          href="/projects"
                          prefetch={false}
                          className="text-[9px] font-black uppercase tracking-[0.2em] text-advent-navy hover:text-advent-green flex items-center gap-1.5 transition-all"
                        >
                          View All <List className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Quality Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recentProjects.length > 0 ? (
                        recentProjects.map(project => (
                          <ProjectCard key={project.id} project={project} />
                        ))
                      ) : (
                        <div className="col-span-2 py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center p-8">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300 border border-slate-100 shadow-inner">
                            <Filter className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-serif italic font-bold text-slate-700 mb-2">No Active Initiatives</h3>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] max-w-sm leading-relaxed">
                            No project registrations have been finalized in this registry. Click the menu options above to register a new initiative.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeMainTab === 'matcher' && (
              <div className="bg-white rounded-[3rem] border border-slate-200/60 p-8 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                <ConferenceMatcher isTabbed={true} />
              </div>
            )}

            {activeMainTab === 'toolkit' && (
              <div className="bg-white rounded-[3rem] border border-slate-200/60 p-8 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-advent-navy via-advent-sky to-advent-green" />
                <AcademicToolkit />
              </div>
            )}

            {activeMainTab === 'analytics' && (
              <div className="bg-white rounded-[3rem] border border-slate-200/60 p-8 shadow-xs space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-slate-900 via-slate-950 to-advent-cobalt" />
                <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                  <div className="bg-slate-950 text-white p-3 rounded-2xl border border-slate-800 shadow-md">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Registry Analytics</span>
                    <h2 className="text-base font-serif italic font-bold text-slate-900">
                      Surveillance & Quality Metrics
                    </h2>
                  </div>
                </div>
                <DashboardCharts statusData={statusChartData} categoryData={categoryChartData} timelineData={timelineChartData} />
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Elegant Sticky Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24">
          
          {/* GME Registry Control Console */}
          <div className="academic-card bg-white border border-slate-200/60 rounded-[2.5rem] p-7 shadow-xs space-y-6 relative overflow-hidden">
            {/* Top highlight bar */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-advent-navy via-amber-500 to-advent-green" />
            
            {/* Command Console Title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Command Center</span>
                <h3 className="text-sm font-serif italic font-bold text-slate-900">Academic Console</h3>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200/60 shadow-3xs">
                Active Surveillance
              </span>
            </div>

            {/* Premium Mini-Segmented Tab Controller */}
            <div className="flex p-1 bg-slate-50 border border-slate-200/70 rounded-2xl relative shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]">
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
                        ? "bg-white text-slate-900 border border-slate-200/65 shadow-2xs scale-102"
                        : "text-slate-500 hover:text-slate-950 hover:bg-white/40"
                    }`}
                  >
                    <TabIcon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-400'}`} />
                    <span className="hidden sm:inline lg:hidden xl:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Console Views */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[250px] flex flex-col justify-between">
              {activeSidebarTab === 'search' && (
                <div className="space-y-6">
                  {/* Registry Search */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-450 uppercase tracking-[0.25em]">
                        <Search className="w-3.5 h-3.5 text-advent-navy/60" />
                        Registry Search
                      </h4>
                    </div>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Search GME initiatives..."
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-advent-navy/5 focus:border-advent-navy outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                      />
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-advent-navy transition-colors" />
                    </div>
                  </section>

                  {/* Status Quick Filters */}
                  <section className="space-y-3">
                    <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-450 uppercase tracking-[0.25em]">
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
                          className="px-3 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-advent-navy rounded-lg text-[8px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-advent-navy transition-all duration-300 shadow-3xs flex items-center gap-1.5"
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
                    <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-450 uppercase tracking-[0.25em]">
                      <Activity className="w-3.5 h-3.5 text-emerald-500/80 animate-pulse" />
                      Real-Time Updates
                    </h4>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                    <ActivityFeed />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Luxury Call-to-Action Analytics Suite Drawer */}
          <div className="relative overflow-hidden premium-gradient-card p-8 rounded-[2.5rem] border border-slate-800/80 text-white group cursor-pointer hover:shadow-2xl transition-all duration-500">
            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                  Institutional Ledgers
                </div>
                <h3 className="font-serif italic font-bold text-2xl mb-2 text-white">
                  Advanced Analytics
                </h3>
                <p className="text-[11px] text-slate-350 leading-relaxed font-medium">
                  Export aggregate clinical studies, monitor PDSA compliance, and download professional quality boards.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/metrics"
                  prefetch={false}
                  className="bg-white text-slate-900 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-emerald-400 hover:text-slate-950 flex items-center justify-center gap-2.5 group-hover:scale-102 duration-300 shadow-sm"
                >
                  Enter Registry Metrics <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            {/* Visual background details */}
            <div className="absolute top-0 right-0 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
          </div>
        </div>
      </div>
      </div>
      )}

      {/* ⚡ Concept 2: Futuristic Clinical AI Data Dashboard */}
      {activeConcept === 'concept2' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Futuristic Hero with Telemetry Glow */}
          <div className="bg-slate-950 p-8 sm:p-10 rounded-[2.5rem] border border-emerald-500/30 text-white relative overflow-hidden shadow-[0_0_50px_-12px_rgba(16,185,129,0.25)]">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8 relative z-10">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] neon-glow-emerald">
                  <Activity className="w-3.5 h-3.5 animate-pulse" /> AI Surveillance Telemetry Active
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  Futuristic <span className="text-gradient-emerald">AI Command</span> Dashboard
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                  Real-time neural telemetry tracking institutional compliance, resident velocity, and automated PDSA metrics under AdventHealth Tampa.
                </p>
              </div>

              {/* AI Composite Quality Score Circular Gauge */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-900/80 rounded-3xl border border-emerald-500/20 text-center shrink-0 neon-glow-emerald">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">AI Quality Score</span>
                <span className="text-4xl font-black text-white font-mono">96.4<span className="text-xs text-emerald-400">/100</span></span>
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Top 5% GME Benchmark</span>
              </div>
            </div>
          </div>

          {/* 3D Stage Funnel & Live Ticker Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white/95 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-200/60 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">3D Pipeline Funnel</span>
                  <h3 className="font-serif italic font-bold text-lg text-slate-900">Project Progression Velocity</h3>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">21 Active Protocols</span>
              </div>

              <div className="space-y-3">
                {[
                  { stage: 'Idea Phase', count: 5, pct: '24%', color: 'bg-violet-500' },
                  { stage: 'Pre-Intervention', count: 4, pct: '19%', color: 'bg-sky-500' },
                  { stage: 'Intervention Ongoing (PDSA)', count: 8, pct: '38%', color: 'bg-amber-500' },
                  { stage: 'Sustain the Gains', count: 4, pct: '19%', color: 'bg-cyan-500' },
                ].map((row) => (
                  <div key={row.stage} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{row.stage}</span>
                      <span className="font-mono text-slate-500">{row.count} projects ({row.pct})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div className={`h-full ${row.color} rounded-full transition-all duration-750`} style={{ width: row.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Activity Feed Sidebar */}
            <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-slate-800 text-white space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Live Activity Feed</h4>
              </div>
              <ActivityFeed />
            </div>
          </div>
        </div>
      )}

      {/* 📜 Concept 3: Editorial Academic Journal Showcase */}
      {activeConcept === 'concept3' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Editorial Banner */}
          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-200/80 shadow-md relative overflow-hidden">
            <div className="max-w-2xl space-y-4">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-advent-navy bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
                Academic Journal & Scholarly Registry
              </span>
              <h1 className="text-4xl sm:text-5xl font-serif italic font-bold tracking-tight text-slate-900">
                Editorial <span className="not-italic text-advent-navy font-sans font-black">Scholarly Showcase</span>
              </h1>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Highlighting top resident quality improvement publications, IRB-approved protocols, and national conference presentations under AdventHealth GME.
              </p>
            </div>
          </div>

          {/* Featured Project Carousel & Faculty Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-[2.5rem] text-white border border-slate-800 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-400">Featured Landmark Initiative</span>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">94.8% Compliance Target Cleared</span>
                </div>
                <h3 className="text-2xl font-serif italic font-bold text-white">
                  MASH Screening with FIB-4 Score in Primary Care IM Clinic
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Led by Dr. Muhammad Adnan & Dr. Hadid. Faculty Mentor: Dr. Ramsakal. Demonstrated a 42% increase in early metabolic liver disease screening.
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">ACP 2026 Poster Finalist</span>
                  <Link href="/projects" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5">
                    Read Full Case Study <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Publication Readiness Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentProjects.slice(0, 2).map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>

            {/* Faculty Mentorship Matrix */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-xs space-y-4">
              <h4 className="font-serif italic font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
                Faculty Mentorship Roster
              </h4>
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                {[
                  { name: 'Dr. Ramsakal', role: 'Program Director', count: 8 },
                  { name: 'Dr. Sepulveda', role: 'Associate PD', count: 5 },
                  { name: 'Dr. Gummalla', role: 'Research Chair', count: 4 },
                ].map((fac) => (
                  <div key={fac.name} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-200/50">
                    <div>
                      <div className="font-bold text-slate-900">{fac.name}</div>
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{fac.role}</div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-advent-navy/10 text-advent-navy px-2.5 py-1 rounded-full border border-advent-navy/20">
                      {fac.count} Projects
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎛️ Concept 4: Modular Grid Workspace */}
      {activeConcept === 'concept4' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-slate-100/90 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Custom Executive Workspace</span>
              <h2 className="text-xl font-serif italic font-bold text-slate-900">Modular Drag-and-Drop Grid</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-white px-4 py-2 rounded-2xl border border-slate-200 text-slate-700 shadow-3xs">
                Role Layout: Overseer
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-xs space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Widget 1: Action Items</span>
              <h4 className="font-serif italic font-bold text-base text-slate-900">My Assigned Tasks</h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 font-medium">
                  ✓ Review FIB-4 MASH Clinic PDSA Cycle 2 metrics
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 font-medium">
                  ⚠️ 2 projects require faculty mentor sign-off
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-xs space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Widget 2: Conference Deadlines</span>
              <h4 className="font-serif italic font-bold text-base text-slate-900">Upcoming Deadlines</h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold">
                  <span>ACP National Poster</span>
                  <span className="text-rose-600">14 Days Left</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold">
                  <span>SHM Annual Meeting</span>
                  <span className="text-amber-600">32 Days Left</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-xs space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Widget 3: Scratchpad</span>
              <h4 className="font-serif italic font-bold text-base text-slate-900">Quick Drafts & Notes</h4>
              <textarea
                placeholder="Jot down prospective project ideas..."
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-advent-navy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

