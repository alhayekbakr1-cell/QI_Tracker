"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import ProjectCard from "@/components/ProjectCard";
import SkeletonProjectCard from "@/components/SkeletonProjectCard";
import { Project } from "@/types";
import { List, LayoutPanelLeft, Filter } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/custom-ui";
import RequestPortal from "@/components/RequestPortal";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
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
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserEmail(user.email || "bakr.alhayek@adventhealth.com");
          setUserId(user.id);

          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .single();

          setUserProfile(profile || { role: "Admin", full_name: "Bakr Alhayek MD" });

          const { data, error } = await supabase
            .from("projects")
            .select("*")
            .order("last_updated_date", { ascending: false });

          if (!error && data && data.length > 0) {
            setProjects(data as Project[]);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Supabase connection fallback to local preview mode:", err);
      }

      // Default fallback demo state for local dev preview
      setUserEmail("bakr.alhayek@adventhealth.com");
      setUserId("demo-user-id");
      setUserProfile({ role: "Admin", full_name: "Bakr Alhayek MD" });
      setProjects([
        {
          id: "demo-1",
          title: "MASH Screening with FIB-4 Score in Primary Care IM Clinic",
          category: "Outpatient",
          status: "Intervention Ongoing",
          lead_proponents: ["Dr. Muhammad Adnan", "Dr. Hadid"],
          faculty: "Dr. Ramsakal",
          current_pdsa_cycle: 2,
          last_updated_date: new Date().toISOString(),
          updates_and_barriers: "PDSA Cycle 2 ongoing. Electronic health record screening template deployed.",
          metrics: [{ date: "2026-07-01", numerator: 45, denominator: 50 }]
        },
        {
          id: "demo-2",
          title: "Improving DXA Scan Screening for Female Inpatients > 65 Years",
          category: "Inpatient",
          status: "Pre-Intervention",
          lead_proponents: ["Dr. Alhayek"],
          faculty: "Dr. Sepulveda",
          current_pdsa_cycle: 1,
          last_updated_date: new Date().toISOString(),
          updates_and_barriers: "Baseline data collection complete. Intervention order set pending approval.",
          metrics: []
        },
        {
          id: "demo-3",
          title: "Carvedilol vs Metoprolol Tartrate Discharge Optimization in HFrEF",
          category: "Inpatient",
          status: "Sustain the Gains",
          lead_proponents: ["Dr. Gummalla"],
          faculty: "Dr. Ramsakal",
          current_pdsa_cycle: 3,
          last_updated_date: new Date().toISOString(),
          updates_and_barriers: "Sustained 94.8% target adherence across 3 consecutive clinical cycles.",
          metrics: []
        }
      ] as Project[]);
      setIsLoading(false);
    }

    fetchDashboardData();

    // 🔴 Real-Time Dashboard Updates Listener
    const channel = supabase
      .channel('realtime-projects')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Re-fetch to ensure all related data is current
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

        {/* Recent & Sidebar Skeleton */}
        <div className="grid grid-cols-1 gap-12 pt-4">
          <div className="space-y-8">
            <Skeleton className="h-16 w-full rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonProjectCard />
              <SkeletonProjectCard />
              <SkeletonProjectCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      {/* 🏥 Premium Clinical Command Center Welcome Banner */}
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
          </div>
        </div>
        
        {/* Beautiful ambient visual glow blobs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-advent-navy/15 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mb-20 pointer-events-none" />
      </div>

      {/* 🏛️ Main Interactive Content Workspace */}
      <div className="space-y-8 mt-8">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentProjects.length > 0 ? (
                    recentProjects.map(project => (
                      <ProjectCard key={project.id} project={project} />
                    ))
                  ) : (
                    <div className="col-span-3 py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center p-8">
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
        </div>
      </div>
    </div>
  );
}
