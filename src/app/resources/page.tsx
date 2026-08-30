"use client"

import { createClient } from "@/utils/supabase/client";
import { INSTITUTIONAL_RESOURCES } from "@/constants/institutionalResources";
import { AUTH_BYPASS, DEV_USER } from "@/utils/auth/devBypass";
import { useRouter } from "next/navigation";
import { BookOpen, CheckSquare, Lightbulb, ExternalLink, Activity, ArrowRight, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import QIHandbook from "@/components/QIHandbook";

export default function ResourcesPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'overview' | 'handbook'>('overview');

    useEffect(() => {
        async function checkAuth() {
            const { data: { user: authedUser } } = await supabase.auth.getUser();
            const user = authedUser ?? (AUTH_BYPASS ? (DEV_USER as any) : null);
            if (!user) {
                router.push("/login");
            } else {
                setIsLoading(false);
            }
        }
        checkAuth();
    }, [supabase, router]);

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (view === 'handbook') {
        return <QIHandbook onBack={() => setView('overview')} />;
    }

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                    Knowledge & Resources
                </h1>
                <p className="text-slate-500 max-w-2xl mt-2">
                    Shared concepts, guidelines, and toolkits for Internal Medicine QI projects.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* NEW: Interactive Handbook Card (Primary Feature) */}
                <div
                    onClick={() => setView('handbook')}
                    className="md:col-span-2 group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all duration-300"
                >
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                <Activity className="w-3 h-3" /> New Interactive Guide
                            </div>
                            <h2 className="text-3xl font-black mb-2 tracking-tight">The Residency QI Handbook</h2>
                            <p className="text-blue-100 max-w-lg text-lg leading-relaxed">
                                A complete interactive guide covering everything from "Project Selection" to "Publication".
                                Includes an AI Toolkit, IRB Wizard, and interactive checklists.
                            </p>
                            <div className="mt-6 flex items-center gap-2 font-bold bg-white text-blue-700 px-5 py-3 rounded-xl w-fit shadow-lg group-hover:bg-blue-50 transition-colors">
                                Access Handbook <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                        {/* Decorative Icon */}
                        <div className="hidden md:block bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                            <BookOpen className="w-16 h-16 text-white" />
                        </div>
                    </div>
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 blur-3xl -mr-32 -mt-32 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 blur-3xl -ml-20 -mb-20 rounded-full" />
                </div>

                {/* Resident Checklist */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                        <CheckSquare className="w-5 h-5 text-green-600" />
                        Quick Checklist
                    </h2>
                    <ul className="space-y-4">
                        <CheckItem label="Project Charter Completed" active />
                        <CheckItem label="Faculty Mentor Identified" active />
                        <CheckItem label="Problem Statement & SMART Aim" active />
                        <CheckItem label="IRB Determination / Approval" />
                        <CheckItem label="Pre-intervention Data Collection" />
                        <CheckItem label="First PDSA Cycle Documented" />
                        <CheckItem label="Progress Report in Tracker" />
                    </ul>
                </div>

                {/* Lean Six Sigma */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        Lean Six Sigma Concepts
                    </h2>
                    <div className="space-y-6">
                        <ConceptItem
                            title="DMAIC Framework"
                            description="Define, Measure, Analyze, Improve, Control. Use this as your roadmap for larger QI initiatives."
                        />
                        <ConceptItem
                            title="PDSA Cycles"
                            description="Plan, Do, Study, Act. Small, rapid tests of change. Multiple cycles are usually needed for success."
                        />
                        <ConceptItem
                            title="SMART Goals"
                            description="Specific, Measurable, Achievable, Relevant, and Time-bound aims are the foundation of any project."
                        />
                    </div>
                </div>

                {/* AdventHealth resources. Kept visually distinct from the public
                    links below: these sit behind the institutional tenant and are
                    the ones residents are actually expected to use. */}
                <div className="md:col-span-2 bg-white border border-advent-navy/15 p-8 rounded-2xl shadow-sm">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="bg-advent-navy/5 border border-advent-navy/10 p-2.5 rounded-xl shrink-0">
                            <Building2 className="w-5 h-5 text-advent-navy" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">AdventHealth Resources</h2>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">
                                Institutional support for your research and QI work.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {INSTITUTIONAL_RESOURCES.map(r => (
                            <a
                                key={r.href}
                                href={r.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block p-5 rounded-2xl border border-slate-200/80 hover:border-advent-navy/30 hover:bg-slate-50/70 transition-all"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-sm font-bold text-slate-900 group-hover:text-advent-navy transition-colors">
                                        {r.label}
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-advent-navy shrink-0 transition-colors" />
                                </div>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed mt-1.5">
                                    {r.description}
                                </p>
                                {r.requiresSignIn && (
                                    <span className="inline-block mt-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Sign in with your AdventHealth account
                                    </span>
                                )}
                            </a>
                        ))}
                    </div>
                </div>

                {/* External Resources */}
                <div className="md:col-span-2 bg-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                        <div>
                            <h2 className="text-2xl font-black mb-2 tracking-tight italic">Expand Your Skills</h2>
                            <p className="text-slate-400 max-w-lg">Learn more from industry leaders in healthcare quality improvement.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                            <ExternalLinkBtn label="IHI Open School" href="https://www.ihi.org" />
                            <ExternalLinkBtn label="ACP Quality Hub" href="https://www.acponline.org" />
                            <ExternalLinkBtn label="Check the Handbook" href="#" onClick={(e) => { e.preventDefault(); setView('handbook'); }} />
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-3xl -mr-32 -mt-32 rounded-full" />
                </div>
            </div>
        </div>
    )
}

function CheckItem({ label, active }: { label: string, active?: boolean }) {
    return (
        <li className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded border ${active ? 'bg-green-600 border-green-600' : 'bg-slate-50 border-slate-200'} flex items-center justify-center`}>
                {active && <CheckSquare className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm ${active ? 'text-slate-900 font-semibold' : 'text-slate-400 font-medium'}`}>{label}</span>
        </li>
    )
}

function ConceptItem({ title, description }: { title: string, description: string }) {
    return (
        <div className="border-b border-slate-50 last:border-0 pb-4 last:pb-0">
            <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
    )
}

function ExternalLinkBtn({ label, href, onClick }: { label: string, href: string, onClick?: (e: React.MouseEvent) => void }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={onClick}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
        >
            {label}
            <ExternalLink className="w-3 h-3" />
        </a>
    )
}
