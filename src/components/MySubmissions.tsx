"use client"

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Clock, CheckCircle2, XCircle, FileText, Loader2, ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";

type Gate = "pending" | "approved" | "rejected";

interface RegistrationRequest {
    id: string;
    title: string;
    category: string | null;
    mentor_approval_status: Gate;
    gme_approval_status: Gate;
    status: "pending" | "approved" | "revisions_requested";
    reviewer_feedback: string | null;
    faculty: string | null;
    created_at: string;
    reviewed_at: string | null;
}

/**
 * Shows a resident where a submitted proposal actually stands.
 *
 * Before this, submitting a proposal was a void: the request row carried both
 * approval gates and reviewer feedback, but nothing in the resident's portfolio
 * ever read it. Residents had no way to know whether they were waiting on their
 * mentor, waiting on GME, or being asked for changes.
 */
export default function MySubmissions({ userId }: { userId: string | null }) {
    const [requests, setRequests] = useState<RegistrationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        let cancelled = false;

        (async () => {
            const { data, error } = await supabase
                .from("project_registration_requests")
                .select("id, title, category, mentor_approval_status, gme_approval_status, status, reviewer_feedback, faculty, created_at, reviewed_at")
                .eq("created_by", userId)
                .order("created_at", { ascending: false });

            if (cancelled) return;
            if (error) console.error("Failed to load submissions:", error);
            setRequests((data as RegistrationRequest[]) || []);
            setIsLoading(false);
        })();

        return () => { cancelled = true; };
    }, [userId, supabase]);

    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading your submissions</span>
            </div>
        );
    }

    // Fully approved proposals become real projects and show in the list below,
    // so only surface what is still in flight.
    const inFlight = requests.filter(r => r.status !== "approved");
    if (inFlight.length === 0) return null;

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-advent-navy" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Submitted proposals ({inFlight.length})
                </h3>
            </div>

            <div className="space-y-3">
                {inFlight.map(request => {
                    const needsRevision = request.status === "revisions_requested"
                        || request.mentor_approval_status === "rejected"
                        || request.gme_approval_status === "rejected";

                    return (
                        <div
                            key={request.id}
                            className={`rounded-2xl border p-4 space-y-3 ${
                                needsRevision ? "border-rose-200 bg-rose-50/40" : "border-slate-200/70 bg-slate-50/40"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{request.title}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Submitted {new Date(request.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {needsRevision && (
                                    <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-rose-700 bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg">
                                        Action needed
                                    </span>
                                )}
                            </div>

                            {/* The two sponsorship gates, so it is obvious who is being waited on. */}
                            <div className="grid grid-cols-2 gap-2">
                                <GateChip
                                    label={request.faculty ? `Mentor · ${request.faculty}` : "Faculty mentor"}
                                    state={request.mentor_approval_status}
                                />
                                <GateChip label="GME review" state={request.gme_approval_status} />
                            </div>

                            {request.reviewer_feedback && (
                                <div className="flex gap-2 bg-white border border-slate-200/70 rounded-xl p-3">
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Reviewer feedback</p>
                                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{request.reviewer_feedback}</p>
                                    </div>
                                </div>
                            )}

                            <p className="text-[11px] font-medium text-slate-500 italic">
                                {needsRevision
                                    ? "Address the feedback above, then contact your mentor or the GME office to re-submit."
                                    : request.mentor_approval_status === "pending"
                                        ? "Waiting on your faculty mentor to sponsor this proposal."
                                        : "Mentor sponsored. Waiting on GME review to activate the project."}
                            </p>
                        </div>
                    );
                })}
            </div>

            <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-advent-navy hover:text-advent-cobalt transition-colors"
            >
                Start another project
                <ArrowRight className="w-3 h-3" />
            </Link>
        </div>
    );
}

function GateChip({ label, state }: { label: string; state: Gate }) {
    const config = {
        approved: { Icon: CheckCircle2, cls: "text-emerald-700 bg-emerald-50 border-emerald-200", word: "Approved" },
        rejected: { Icon: XCircle, cls: "text-rose-700 bg-rose-50 border-rose-200", word: "Changes requested" },
        pending: { Icon: Clock, cls: "text-amber-700 bg-amber-50 border-amber-200", word: "Pending" },
    }[state];

    return (
        <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${config.cls}`}>
            <config.Icon className="w-3.5 h-3.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70 truncate">{label}</p>
                <p className="text-[11px] font-black">{config.word}</p>
            </div>
        </div>
    );
}
