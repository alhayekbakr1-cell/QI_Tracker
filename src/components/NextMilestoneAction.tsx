"use client"

import Link from "next/link";
import { ArrowRight, GraduationCap, Rocket, FileUp, RefreshCw, Presentation } from "lucide-react";

/**
 * Turns the graduation checklist into a single instruction.
 *
 * The portfolio already showed three requirements as ticked or unticked, but
 * never said what to actually do next — a resident could see "2+ PDSA Cycles"
 * unticked without knowing where cycles get recorded.
 */
export default function NextMilestoneAction({
    projectCount,
    hasProtocol,
    totalPDSAs,
    hasPresentation,
    firstProjectId,
}: {
    projectCount: number;
    hasProtocol: boolean;
    totalPDSAs: number;
    hasPresentation: boolean;
    firstProjectId?: string | null;
}) {
    const projectHref = firstProjectId ? `/projects/view?id=${firstProjectId}` : "/projects";

    // Ordered by the sequence GME expects them to be completed in.
    const next = (() => {
        if (projectCount === 0) {
            return {
                Icon: Rocket,
                title: "Start your first QI project",
                detail: "Nothing is registered under your name yet. Creating a project is the first graduation requirement.",
                cta: "Create a project",
                href: "/projects/new",
            };
        }
        if (!hasProtocol) {
            return {
                Icon: FileUp,
                title: "Get your protocol approved and uploaded",
                detail: "Your project exists, but no approved protocol document is attached to it yet. This is requirement 1 of 3.",
                cta: "Open project",
                href: projectHref,
            };
        }
        if (totalPDSAs < 2) {
            const remaining = 2 - totalPDSAs;
            return {
                Icon: RefreshCw,
                title: `Complete ${remaining} more PDSA cycle${remaining === 1 ? "" : "s"}`,
                detail: `You have ${totalPDSAs} of the 2 cycles required. A single cycle is not sufficient for GME sign-off — record the next one on your project.`,
                cta: "Record a cycle",
                href: projectHref,
            };
        }
        if (!hasPresentation) {
            return {
                Icon: Presentation,
                title: "Present your work and attach the evidence",
                detail: "Both earlier requirements are met. Present at GME Research Day or a regional/national conference, then attach the presentation to your project.",
                cta: "Find a conference",
                href: "/resources",
            };
        }
        return null;
    })();

    if (!next) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-start gap-4">
                <GraduationCap className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                    <p className="text-sm font-black text-emerald-900">All three GME requirements are met.</p>
                    <p className="text-xs font-medium text-emerald-700 mt-1">
                        You are board ready. Export your portfolio for your CV or fellowship applications.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                Your next step
            </p>
            <div className="flex items-start gap-4">
                <div className="bg-advent-navy/5 border border-advent-navy/10 p-3 rounded-2xl shrink-0">
                    <next.Icon className="w-5 h-5 text-advent-navy" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-base font-black text-slate-900 leading-snug">{next.title}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{next.detail}</p>
                    <Link
                        href={next.href}
                        className="inline-flex items-center gap-2 mt-4 bg-advent-navy hover:bg-advent-cobalt text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        {next.cta}
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
