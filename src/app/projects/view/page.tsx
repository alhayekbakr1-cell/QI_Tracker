"use client"

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Project, Comment, Metric, Profile } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import PHIWarning from "@/components/PHIWarning";
import MetricCharts from "@/components/MetricCharts";
import Section from "@/components/Section";
import {
    ArrowLeft,
    MessageSquare,
    Paperclip,
    History,
    TrendingUp,
    Sparkles,
    Info,
    CheckCircle2,
    Clock,
    Plus,
    Edit3,
    FileText,
    Presentation,
    Trophy,
    FileCheck,
    ChevronRight,
    Users,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import MetricEntryForm from "@/components/MetricEntryForm";
import NudgeButton from "@/components/NudgeButton";
import PDSAAnalyzer from "@/components/PDSAAnalyzer";
import MetricSuggester from "@/components/MetricSuggester";
import QualityAudit from "@/components/QualityAudit";
import ProjectTags from "@/components/ProjectTags";
import ProtocolWizard from "@/components/ProtocolWizard";
import ConferenceMatcher from "@/components/ConferenceMatcher";
import ProjectReportGenerator from "@/components/ProjectReportGenerator";
import { sendEmail, TEMPLATES } from "@/utils/email";
import ConferenceCountdown from "@/components/ConferenceCountdown";
import FacultySignOff from "@/components/FacultySignOff";
import ProjectComments from "@/components/ProjectComments";
import PublicationAssistant from "@/components/PublicationAssistant";
import TaskManager from "@/components/TaskManager";
import ProjectFileManager from "@/components/ProjectFileManager";
import { useEffect, useState } from "react";

export default function ProjectDetailPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [project, setProject] = useState<Project | null>(null);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isPubAssistantOpen, setIsPubAssistantOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (!id) {
            router.push("/projects");
            return;
        }

        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Fetch profile
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setUserProfile(profile);
            }

            // Fetch project details
            const { data: projectData } = await supabase
                .from("projects")
                .select("*")
                .eq("id", id)
                .single();

            if (!projectData) {
                router.push("/404");
                return;
            }
            setProject(projectData as Project);

            // Fetch metrics
            const { data: metricsData } = await supabase
                .from("metrics")
                .select("*")
                .eq("project_id", id)
                .order("month", { ascending: true });
            setMetrics(metricsData || []);

            setIsLoading(false);
        }

        fetchData();
    }, [id, supabase, router]);

    // handleSubmitComment, newComment, isSubmittingComment, comments, currentUser states are removed as ProjectComments component handles them.

    const [activeTab, setActiveTab] = useState<'overview' | 'charter' | 'pdsa' | 'metrics' | 'files' | 'activity'>('overview');

    if (isLoading || !project) {
        return (
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
                {/* Back link skeleton */}
                <div className="w-32 h-5 bg-slate-200 rounded" />
                
                {/* Title & header skeleton */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-24 h-6 bg-slate-200 rounded-full" />
                        <div className="w-32 h-4 bg-slate-200 rounded" />
                    </div>
                    <div className="h-10 bg-slate-200 rounded w-2/3" />
                    <div className="h-5 bg-slate-100 rounded w-1/4" />
                </div>

                {/* Tab bar skeleton */}
                <div className="flex gap-4 border-b border-slate-200 pb-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="w-28 h-8 bg-slate-200 rounded" />
                    ))}
                </div>

                {/* Layout skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="h-32 bg-slate-50 border border-slate-200/60 rounded-3xl" />
                        <div className="h-48 bg-slate-50 border border-slate-200/60 rounded-3xl" />
                    </div>
                    <div className="space-y-6">
                        <div className="h-[250px] bg-slate-50 border border-slate-200/60 rounded-3xl" />
                        <div className="h-[200px] bg-slate-50 border border-slate-200/60 rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    const workflow: ProjectStatus[] = ['Idea', 'Pre-Intervention', 'Intervention Ongoing', 'Sustain the Gains', 'Impacted (Completed)'];
    const currentIndex = workflow.indexOf(project.status);

    const isFacultyApproved = project.faculty_approved_protocol && project.faculty_approved_pdsa;

    const TABS = [
        { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
        { id: 'charter', label: 'Charter', icon: <FileText className="w-4 h-4" /> },
        { id: 'pdsa', label: 'PDSA Cycles', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'metrics', label: 'Metrics', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'files', label: 'Files', icon: <Paperclip className="w-4 h-4" /> },
        { id: 'activity', label: 'Activity Feed', icon: <MessageSquare className="w-4 h-4" /> },
    ];

    const STEP_COLORS: Record<string, { active: string, bg: string, text: string }> = {
        'Idea': { active: 'bg-violet-600 border-violet-600', bg: 'bg-violet-50 text-violet-700', text: 'text-violet-600' },
        'Pre-Intervention': { active: 'bg-blue-600 border-blue-600', bg: 'bg-blue-50 text-blue-700', text: 'text-blue-600' },
        'Intervention Ongoing': { active: 'bg-amber-600 border-amber-600', bg: 'bg-amber-50 text-amber-700', text: 'text-amber-600' },
        'Sustain the Gains': { active: 'bg-cyan-600 border-cyan-600', bg: 'bg-cyan-50 text-cyan-700', text: 'text-cyan-600' },
        'Impacted (Completed)': { active: 'bg-emerald-600 border-emerald-600', bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-600' }
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <Link href="/projects" prefetch={false} className="flex items-center gap-2 text-slate-500 hover:text-advent-blue transition-colors text-sm font-semibold group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Masterlist
            </Link>

            {/* Governance Review Top Banner */}
            {isFacultyApproved ? (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-800">Faculty Sign-Off Complete</p>
                            <p className="text-slate-500 text-xs mt-0.5 font-medium">This project protocol and PDSA cycle have been approved by the Faculty Mentor.</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">Approved</span>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <Clock className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-amber-800">Faculty Sign-Off Pending</p>
                            <p className="text-slate-500 text-xs mt-0.5 font-medium">Waiting for the Faculty Mentor to review and sign off on the latest cycle protocol.</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">Pending Review</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <StatusBadge status={project.status} />
                                <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                                    <Clock className="w-3.5 h-3.5" />
                                    Updated {format(new Date(project.last_updated_date), 'MMM d, yyyy')}
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                {project.title}
                            </h1>
                            <ProjectTags title={project.title} category={project.category || ""} />
                        </div>

                        <div className="flex items-center gap-3">
                            <ProjectReportGenerator project={project} metrics={metrics} />
                            <NudgeButton project={project} variant="full" />
                            <Link
                                href={`/projects/edit?id=${id}`}
                                prefetch={false}
                                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold shadow-sm hover:border-advent-blue hover:text-advent-blue transition-all"
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit Project
                            </Link>
                        </div>
                    </div>

                    {/* 5-Stage Workflow Indicator */}
                    <div className="flex items-center w-full max-w-3xl mt-8 mb-4 px-2">
                        {workflow.map((step, idx) => {
                            const stepColors = STEP_COLORS[step] || STEP_COLORS['Idea'];
                            const isCompleted = idx < currentIndex;
                            const isCurrent = idx === currentIndex;
                            const isPastOrCurrent = idx <= currentIndex;

                            return (
                                <div key={step} className="flex-1 flex items-center last:flex-none">
                                    <div className="relative flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-sm ${
                                            isCurrent ? `${stepColors.active} text-white` :
                                            isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-300 font-normal'
                                        }`}>
                                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                                        </div>
                                        <span className={`absolute top-10 whitespace-nowrap text-[9px] font-black uppercase tracking-widest ${
                                            isPastOrCurrent ? 'text-slate-700' : 'text-slate-300'
                                        }`}>
                                            {step.split(' ')[0]}
                                        </span>
                                    </div>
                                    {idx < workflow.length - 1 && (
                                        <div className={`flex-1 h-[2px] mx-2 ${idx < currentIndex ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="h-10" />

                    <PHIWarning />

                    {/* Fluid Client-side Tabs */}
                    <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px scrollbar-hide">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                                        isActive
                                            ? 'border-advent-navy text-advent-navy font-black scale-100'
                                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Panels */}
                    <div className="mt-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* Overview Metadata Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-200">
                                    <DetailItem label="Category" value={project.category} icon={<Info className="w-4 h-4 text-advent-navy" />} />
                                    <DetailItem label="Subcategory" value={project.subcategory} icon={<Info className="w-4 h-4 text-slate-400" />} />
                                    <DetailItem
                                        label="Faculty Mentor"
                                        value={project.faculty}
                                        icon={<Users className="w-4 h-4 text-emerald-500" />}
                                        isLinked={!!project.faculty_id}
                                    />
                                    <DetailItem label="PDSA Cycle" value={`Cycle ${project.pdsa_cycle}`} icon={<TrendingUp className="w-4 h-4 text-advent-green" />} />
                                    <DetailItem
                                        label="Lead(s)"
                                        value={project.lead_proponents.join(', ')}
                                        icon={<Users className="w-4 h-4 text-advent-navy" />}
                                        isLinked={(project.lead_proponent_ids?.length || 0) > 0}
                                    />
                                    <DetailItem
                                        label="Proponents"
                                        value={project.proponents.join(', ')}
                                        icon={<Users className="w-4 h-4 text-slate-400" />}
                                        isLinked={(project.proponent_ids?.length || 0) > 0}
                                    />
                                </div>

                                <Section title="Primary Outcome" icon={<TrendingUp className="w-5 h-5 text-advent-blue" />}>
                                    <p className="text-slate-700 text-lg font-medium leading-relaxed">
                                        {project.primary_outcome || "No outcome defined yet."}
                                    </p>
                                </Section>

                                {/* Impact Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 bg-slate-50/50 rounded-[2.5rem] px-8 border border-slate-100">
                                    <div className="space-y-2">
                                        <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Users className="w-3 h-3 text-advent-cobalt" />
                                            Institutional Impact
                                        </dt>
                                        <dd className="text-3xl font-black text-advent-navy tracking-tight">
                                            {project.total_patients_impacted || 0} <span className="text-sm font-bold text-slate-400">Patients</span>
                                        </dd>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Volume reached across all cycles</p>
                                    </div>

                                    <div className="space-y-2">
                                        <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Trophy className="w-3 h-3 text-amber-500" />
                                            Estimated Savings
                                        </dt>
                                        <dd className="text-3xl font-black text-emerald-600 tracking-tight">
                                            ${(Number(project.estimated_cost_savings) || 0).toLocaleString()} <span className="text-sm font-bold text-slate-400">USD</span>
                                        </dd>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Calculated based on institutional value</p>
                                    </div>
                                </div>

                                <Section title="Updates and Barriers" icon={<Info className="w-5 h-5 text-advent-blue" />}>
                                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl font-medium">
                                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                                            "{project.updates_and_barriers || "No updates recorded."}"
                                        </p>
                                    </div>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'charter' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <Section title="Project Charter Compliance" icon={<FileText className="w-5 h-5 text-advent-navy" />}>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
                                        A formal charter outlines the strategic alignment, mentor approvals, and scope validation for this quality improvement initiative.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Aim Statement Alignment</h4>
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                <strong>Global AIM:</strong> Focuses on enhancing patient outcomes, standardizing protocol workflows, and maximizing clinician compliance within AdventHealth GME.
                                            </p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Strategic Parameters</h4>
                                            <ul className="space-y-2.5 text-xs text-slate-600 font-semibold">
                                                <li className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-advent-navy" />
                                                    Department: Internal Medicine Residency
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-advent-green" />
                                                    Institutional Goal: Patient Safety & High-Value Care
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </Section>
                                
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <QualityAudit project={project} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'pdsa' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <Section title="PDSA Roadmap & Active Tasks" icon={<TrendingUp className="w-5 h-5 text-advent-blue" />}>
                                    <p className="text-slate-500 text-sm mb-6 font-medium">
                                        Track the iterative cycles of Plan-Do-Study-Act defining this initiative's execution path.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-4 gap-4 p-6 bg-slate-50/50 border border-slate-150 rounded-3xl mb-8">
                                        {[
                                            { step: 'Plan', desc: 'Formulate intervention protocols' },
                                            { step: 'Do', desc: 'Deploy testing and carry out changes' },
                                            { step: 'Study', desc: 'Collect and analyze objective metrics' },
                                            { step: 'Act', desc: 'Standardize or adjust process steps' }
                                        ].map((step, idx) => {
                                            const isCompleted = project.pdsa_cycle > idx;
                                            const isCurrent = project.pdsa_cycle === idx + 1;
                                            return (
                                                <div key={step.step} className={`p-4 bg-white border rounded-2xl shadow-sm relative transition-all duration-300 ${
                                                    isCurrent ? 'ring-2 ring-advent-blue/60 border-transparent bg-advent-blue/5' :
                                                    isCompleted ? 'border-emerald-200 bg-emerald-50/5' : 'border-slate-200 bg-slate-50/20'
                                                }`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                                                        isCurrent ? 'bg-advent-blue text-white border-advent-blue' :
                                                        isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                                                    }`}>
                                                        {step.step}
                                                    </span>
                                                    <h4 className="text-sm font-bold text-slate-800 mt-3 leading-snug">{step.step} Stage</h4>
                                                    <p className="text-xs text-slate-500 mt-1 leading-normal font-medium">{step.desc}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Section>

                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <PDSAAnalyzer project={project} metrics={metrics} />
                                </div>

                                <TaskManager projectId={project.id} currentUserProfile={userProfile} projectTitle={project.title} />
                            </div>
                        )}

                        {activeTab === 'metrics' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <Section title="Project Metrics" icon={<TrendingUp className="w-5 h-5 text-advent-blue" />}>
                                    <MetricSuggester projectTitle={project.title} />
                                    <div className="flex justify-end mb-6">
                                        <MetricEntryForm projectId={id!} />
                                    </div>
                                    {metrics.length > 0 ? (
                                        <MetricCharts data={metrics} />
                                    ) : (
                                        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 text-sm font-black uppercase tracking-widest">No metric data points yet</p>
                                        </div>
                                    )}
                                </Section>
                            </div>
                        )}

                        {activeTab === 'files' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <Section title="Initiative Attachments" icon={<Paperclip className="w-5 h-5 text-slate-400" />}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {project.protocol_url ? (
                                            <a
                                                href={project.protocol_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-all group"
                                            >
                                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-black">QI Protocol</span>
                                                    <span>View Document</span>
                                                </div>
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => setIsWizardOpen(true)}
                                                className="flex items-center gap-3 p-4 bg-white border border-dashed border-slate-300 rounded-xl text-advent-blue font-bold text-sm hover:bg-advent-blue/5 hover:border-advent-blue transition-all group animate-pulse"
                                            >
                                                <div className="w-8 h-8 bg-advent-blue/10 rounded-lg flex items-center justify-center text-advent-blue group-hover:scale-110 transition-transform">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-[9px] uppercase tracking-widest text-advent-blue/40 font-black">QI Protocol</span>
                                                    <span>Generate with AI</span>
                                                </div>
                                            </button>
                                        )}

                                        {project.presentation_url ? (
                                            <a
                                                href={project.presentation_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 font-bold text-sm hover:bg-amber-100 transition-all group"
                                            >
                                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                                    <Presentation className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase tracking-widest text-amber-500 font-black">QI Presentation</span>
                                                    <span>View Slides</span>
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm italic">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                                                    <Presentation className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-[9px] uppercase tracking-widest text-slate-300 font-black">QI Presentation</span>
                                                    <span>Missing Slides</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Section>

                                <ProjectFileManager projectId={project.id} currentUserProfile={userProfile} />
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <ProjectComments projectId={project.id} currentUserProfile={userProfile} />

                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="font-black text-slate-400 mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                                        <History className="w-4 h-4 text-advent-navy" />
                                        Audit Logs
                                    </h3>
                                    <div className="space-y-4">
                                        <HistoryItem date={format(new Date(project.last_updated_date), 'MMM d, yyyy')} action={`Status: ${project.status}`} user="System Log" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Governance Sidebar Console */}
                <div className="space-y-6">
                    {/* Faculty Sign-off Governance Control */}
                    <FacultySignOff
                        project={project}
                        userRole={userProfile?.role || null}
                        onUpdate={(updated) => setProject(updated)}
                    />

                    {/* Academic Toolkit Portal */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-400 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                            <Sparkles className="w-4 h-4 text-advent-blue" />
                            Academic Toolkit
                        </h3>
                        <button
                            onClick={() => setIsPubAssistantOpen(true)}
                            className="w-full flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white font-bold text-sm hover:bg-slate-800 transition-all group shadow-lg shadow-slate-900/20"
                        >
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black">Publication</span>
                                <span>AI Assistant</span>
                            </div>
                            <ChevronRight className="w-4 h-4 ml-auto text-slate-600 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Target Conference Targets */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-400 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            Academic Target
                        </h3>
                        {project.target_conference ? (
                            <div className="space-y-4">
                                <ConferenceCountdown targetConferenceId={project.target_conference} />
                                <button
                                    onClick={async () => {
                                        const { error } = await supabase.from('projects').update({ target_conference: null }).eq('id', project.id);
                                        if (!error) setProject({ ...project, target_conference: null });
                                    }}
                                    className="w-full text-[10px] font-black uppercase text-slate-400 hover:text-red-600 transition-colors text-center"
                                >
                                    Remove Target
                                </button>
                            </div>
                        ) : (
                            <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">No conference targeted</p>
                                <Link
                                    href={`/projects/edit?id=${project.id}`}
                                    className="inline-flex items-center gap-2 text-xs font-bold text-advent-blue hover:underline"
                                >
                                    Set Academic Goal <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isWizardOpen && project && (
                <ProtocolWizard
                    projectId={project.id}
                    projectTitle={project.title}
                    onClose={() => setIsWizardOpen(false)}
                />
            )}
            {project && (
                <PublicationAssistant
                    project={project}
                    metrics={metrics}
                    isOpen={isPubAssistantOpen}
                    onClose={() => setIsPubAssistantOpen(false)}
                />
            )}
        </div>
    );
}

function DetailItem({ label, value, icon, isLinked }: { label: string, value: string | null, icon: React.ReactNode, isLinked?: boolean }) {
    return (
        <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1 text-slate-300">{icon}</div>
            <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    {label}
                    {isLinked && (
                        <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[7px] border border-emerald-100 uppercase tracking-tighter">Linked</span>
                    )}
                </dt>
                <dd className="text-sm font-semibold text-slate-800">{value || '—'}</dd>
            </div>
        </div>
    )
}

function HistoryItem({ date, action, user }: { date: string, action: string, user: string }) {
    return (
        <div className="border-l-2 border-slate-100 pl-4 py-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{date}</p>
            <p className="text-xs font-bold text-slate-700 leading-tight my-1">{action}</p>
            <p className="text-[10px] text-slate-500 italic">by {user}</p>
        </div>
    )
}

