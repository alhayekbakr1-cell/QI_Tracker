"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Search, ArrowRight } from "lucide-react";
import { getProjectHealth, HEALTH_STYLES } from "@/utils/projectHealth";

/**
 * A-Z lifecycle of every project in the programme.
 *
 * The Review Board answered "what is waiting for me to approve". This answers
 * the different question the chief resident actually has: what exists, how far
 * has each project got, and has the faculty mentor signed it off. The chief is
 * no longer a gate in the approval path, so a queue is the wrong shape - this
 * is a status board, not an inbox.
 */

type Stage = "submitted" | "sponsored" | "protocol" | "attested" | "pdsa" | "presented";

const STAGES: { key: Stage; label: string; short: string }[] = [
    { key: "submitted", label: "Proposal submitted", short: "Submit" },
    { key: "sponsored", label: "Mentor sponsored", short: "Sponsor" },
    { key: "protocol", label: "Protocol written", short: "Proto" },
    { key: "attested", label: "Mentor attested", short: "Attest" },
    { key: "pdsa", label: "2+ PDSA cycles", short: "PDSA" },
    { key: "presented", label: "Presented", short: "Present" },
];

interface Row {
    id: string;
    title: string;
    status: string | null;
    faculty: string | null;
    lead: string;
    created_at: string | null;
    last_updated_date: string | null;
    pdsa_cycle: number | null;
    protocol_url: string | null;
    presentation_url: string | null;
    done: Record<Stage, boolean>;
    attestedBy: string | null;
    attestedAt: string | null;
    completed: number;
    isProposal?: boolean;
}

export default function ProjectLifecycleBoard() {
    const [rows, setRows] = useState<Row[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState("");
    const supabase = createClient();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [{ data: projects }, { data: attestations }, { data: files }] = await Promise.all([
                supabase.from("projects").select(
                    "id, title, status, faculty, lead_proponents, created_at, last_updated_date, pdsa_cycle, protocol_url, presentation_url"
                ),
                supabase.from("attestations").select("project_id, milestone, faculty_name, signed_at, revoked_at"),
                supabase.from("project_files").select("project_id, file_name"),
            ]);

            // Proposals still awaiting mentor sponsorship never reach the projects
            // table, so without this they would be invisible here - and the Review
            // Board that used to surface them has been removed.
            const { data: pending } = await supabase
                .from("project_registration_requests")
                .select("id, title, faculty, lead_proponents, created_at, mentor_approval_status, status")
                .neq("status", "approved");
            if (cancelled) return;

            const live = (attestations || []).filter((a: any) => !a.revoked_at);
            const hasProtocolFile = new Set(
                (files || [])
                    .filter((f: any) => /protocol/i.test(f.file_name || ""))
                    .map((f: any) => f.project_id)
            );

            const built: Row[] = (projects || []).map((p: any) => {
                const mine = live.filter((a: any) => a.project_id === p.id);
                const protocolAttestation = mine.find((a: any) => a.milestone === "protocol");
                const cycles = Number(p.pdsa_cycle) || 0;

                const done: Record<Stage, boolean> = {
                    submitted: true,
                    sponsored: true,
                    // A protocol counts as written if it produced a document, by
                    // either storage route.
                    protocol: !!p.protocol_url || hasProtocolFile.has(p.id),
                    attested: !!protocolAttestation,
                    pdsa: cycles >= 2,
                    presented: !!p.presentation_url || !!mine.find((a: any) => a.milestone === "presentation"),
                };

                return {
                    id: p.id,
                    title: p.title,
                    status: p.status,
                    faculty: p.faculty,
                    lead: (p.lead_proponents || [])[0] || "Unassigned",
                    created_at: p.created_at,
                    last_updated_date: p.last_updated_date,
                    pdsa_cycle: p.pdsa_cycle,
                    protocol_url: p.protocol_url,
                    presentation_url: p.presentation_url,
                    done,
                    attestedBy: protocolAttestation?.faculty_name ?? null,
                    attestedAt: protocolAttestation?.signed_at ?? null,
                    completed: STAGES.filter(s => done[s.key]).length,
                };
            });

            const proposals: Row[] = (pending || []).map((r: any) => ({
                id: r.id,
                title: r.title,
                status: r.mentor_approval_status === "rejected" ? "Revisions requested" : "Awaiting mentor sponsorship",
                faculty: r.faculty,
                lead: (r.lead_proponents || [])[0] || "Unassigned",
                created_at: r.created_at,
                // Proposals are not stale in the project sense; suppress the badge.
                last_updated_date: null,
                pdsa_cycle: 0,
                protocol_url: null,
                presentation_url: null,
                done: { submitted: true, sponsored: false, protocol: false, attested: false, pdsa: false, presented: false },
                attestedBy: null,
                attestedAt: null,
                completed: 1,
                isProposal: true,
            }));

            // Least progressed first: those are the ones needing a nudge.
            const all = [...proposals, ...built].sort((a, b) => a.completed - b.completed);
            setRows(all);
            setIsLoading(false);
        })();
        return () => { cancelled = true; };
    }, [supabase]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            r.title.toLowerCase().includes(q) ||
            (r.faculty || "").toLowerCase().includes(q) ||
            r.lead.toLowerCase().includes(q)
        );
    }, [rows, query]);

    const awaitingAttestation = rows.filter(r => r.done.protocol && !r.done.attested).length;
    const noProtocol = rows.filter(r => !r.isProposal && !r.done.protocol).length;
    const awaitingSponsor = rows.filter(r => r.isProposal).length;

    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading lifecycle</span>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Project lifecycle ({rows.length})
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        Registered through to presented. Least progressed first.
                    </p>
                </div>
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Project, resident or mentor..."
                        aria-label="Filter projects"
                        className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold outline-none focus:border-advent-navy transition-all w-full sm:w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Awaiting mentor sponsorship</span>
                    <p className={`text-2xl font-black leading-none mt-1 ${awaitingSponsor ? "text-sky-600" : "text-slate-300"}`}>
                        {awaitingSponsor}
                    </p>
                </div>
                <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Awaiting mentor attestation</span>
                    <p className={`text-2xl font-black leading-none mt-1 ${awaitingAttestation ? "text-amber-600" : "text-slate-300"}`}>
                        {awaitingAttestation}
                    </p>
                </div>
                <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">No protocol yet</span>
                    <p className={`text-2xl font-black leading-none mt-1 ${noProtocol ? "text-rose-600" : "text-slate-300"}`}>
                        {noProtocol}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                {filtered.map(r => {
                    const health = getProjectHealth(r);
                    const styles = HEALTH_STYLES[health.level];
                    return (
                        <Link
                            key={r.id}
                            href={r.isProposal ? "/faculty" : `/projects/view?id=${r.id}`}
                            className="block p-4 rounded-2xl border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60 transition-all group"
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">
                                        {r.lead}
                                        {r.faculty ? ` · mentor ${r.faculty}` : " · no mentor named"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${r.isProposal ? "bg-sky-50 text-sky-700 border-sky-200" : styles.badge}`}>
                                        {r.isProposal ? r.status : health.label}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>

                            {/* The A-Z track. */}
                            <div className="flex items-center gap-1">
                                {STAGES.map((s, i) => (
                                    <div key={s.key} className="flex items-center gap-1 flex-1 last:flex-none">
                                        <div className="flex flex-col items-center gap-1 min-w-0">
                                            <span
                                                title={s.label}
                                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                                    r.done[s.key]
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-slate-100 text-slate-300 border border-slate-200"
                                                }`}
                                            >
                                                {r.done[s.key] ? "✓" : i + 1}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase tracking-wider ${r.done[s.key] ? "text-emerald-700" : "text-slate-300"}`}>
                                                {s.short}
                                            </span>
                                        </div>
                                        {i < STAGES.length - 1 && (
                                            <div className={`h-0.5 flex-1 rounded-full ${r.done[STAGES[i + 1].key] ? "bg-emerald-400" : "bg-slate-100"}`} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {r.attestedBy && (
                                <p className="text-[10px] font-bold text-emerald-700 mt-2">
                                    Protocol attested by {r.attestedBy}
                                    {r.attestedAt ? ` · ${new Date(r.attestedAt).toLocaleDateString()}` : ""}
                                </p>
                            )}
                        </Link>
                    );
                })}
                {filtered.length === 0 && (
                    <p className="text-xs font-medium text-slate-400 italic py-4">No projects match that search.</p>
                )}
            </div>
        </div>
    );
}
