"use client"

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { BadgeCheck, Loader2, ShieldCheck, Undo2 } from "lucide-react";
import { toast } from "@/components/ui/custom-ui";

type Milestone = "protocol" | "pdsa" | "presentation";

interface Attestation {
    id: string;
    project_id: string;
    faculty_id: string;
    faculty_name: string;
    milestone: Milestone;
    statement: string | null;
    signed_at: string;
    revoked_at: string | null;
}

const MILESTONES: { key: Milestone; label: string; statement: string }[] = [
    {
        key: "protocol",
        label: "QI Protocol Approved",
        statement: "I attest that I have reviewed this QI protocol and consider it methodologically sound and appropriate for implementation.",
    },
    {
        key: "pdsa",
        label: "PDSA Cycles Completed",
        statement: "I attest that the resident has completed at least two iterative PDSA cycles with documented measurement.",
    },
    {
        key: "presentation",
        label: "Institutional Presentation",
        statement: "I attest that the resident has formally presented this work at an institutional or external academic venue.",
    },
];

/**
 * Durable, signed milestone attestations.
 *
 * Faculty sign-off was previously two booleans on the project row, which cannot
 * answer "who signed this, when, and is it still valid" — the exact questions a
 * GME board packet has to answer. Un-ticking the box also erased the fact that a
 * signature ever existed. Here signatures are records, and withdrawal is itself
 * recorded rather than deleting history.
 */
export default function AttestationPanel({
    projectId,
    currentUser,
    onMilestoneChange,
}: {
    projectId: string;
    // full_name is nullable on profiles, so an attestation must not depend on it
    // being present — faculty_name is NOT NULL in the table.
    currentUser: { id: string; full_name: string | null; role?: string | null } | null;
    /** Lets the project page reflect the legacy approval flags without a refetch. */
    onMilestoneChange?: (updated: Record<string, boolean>) => void;
}) {
    const [attestations, setAttestations] = useState<Attestation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busy, setBusy] = useState<Milestone | null>(null);
    const supabase = createClient();

    const canSign = currentUser?.role === "Faculty" || currentUser?.role === "Admin" || currentUser?.role === "Operator";

    const load = async () => {
        const { data, error } = await supabase
            .from("attestations")
            .select("*")
            .eq("project_id", projectId)
            .order("signed_at", { ascending: false });
        if (error) console.error("Failed to load attestations:", error);
        setAttestations((data as Attestation[]) || []);
        setIsLoading(false);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // The Faculty Portal still counts pending work from projects.faculty_approved_*,
    // and the project page derives its approved badge from them. Attestations are
    // the source of truth now, so mirror them onto those columns rather than
    // leaving that UI permanently stale.
    const syncLegacyFlag = async (m: Milestone, approved: boolean) => {
        const column =
            m === "protocol" ? "faculty_approved_protocol" :
            m === "pdsa" ? "faculty_approved_pdsa" : null;
        if (!column) return;
        const { error } = await supabase
            .from("projects")
            .update({ [column]: approved })
            .eq("id", projectId);
        if (error) {
            console.error("Failed to sync legacy approval flag:", error);
            return;
        }
        onMilestoneChange?.({ [column]: approved });
    };

    const activeFor = (m: Milestone) => attestations.find(a => a.milestone === m && !a.revoked_at);

    const sign = async (m: Milestone) => {
        if (!currentUser) return;
        setBusy(m);
        const entry = MILESTONES.find(x => x.key === m)!;
        const { error } = await supabase.from("attestations").insert({
            project_id: projectId,
            faculty_id: currentUser.id,
            // faculty_name is NOT NULL; fall back rather than failing the insert.
            faculty_name: currentUser.full_name?.trim() || "Faculty member",
            milestone: m,
            statement: entry.statement,
        });
        setBusy(null);
        if (error) {
            toast.error(error.message);
            return;
        }
        await syncLegacyFlag(m, true);
        toast.success(`${entry.label} attested.`);
        load();
    };

    const revoke = async (a: Attestation) => {
        setBusy(a.milestone);
        const { error } = await supabase
            .from("attestations")
            .update({ revoked_at: new Date().toISOString(), revoked_reason: "Withdrawn by signer" })
            .eq("id", a.id);
        setBusy(null);
        if (error) {
            toast.error(error.message);
            return;
        }
        await syncLegacyFlag(a.milestone, false);
        toast.success("Attestation withdrawn. The record is retained.");
        load();
    };

    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading attestations</span>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-advent-navy" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Faculty attestations
                </h3>
            </div>

            <div className="space-y-2">
                {MILESTONES.map(entry => {
                    const active = activeFor(entry.key);
                    const isBusy = busy === entry.key;
                    return (
                        <div
                            key={entry.key}
                            className={`rounded-2xl border p-4 ${active ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200/70 bg-slate-50/40"}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        {active && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                                        <p className="text-sm font-bold text-slate-900">{entry.label}</p>
                                    </div>
                                    {active ? (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mt-1">
                                            Signed by {active.faculty_name} · {new Date(active.signed_at).toLocaleDateString()}
                                        </p>
                                    ) : (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                            Not yet attested
                                        </p>
                                    )}
                                </div>

                                {canSign && (
                                    active ? (
                                        active.faculty_id === currentUser?.id && (
                                            <button
                                                type="button"
                                                onClick={() => revoke(active)}
                                                disabled={isBusy}
                                                className="shrink-0 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                                            >
                                                {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
                                                Withdraw
                                            </button>
                                        )
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => sign(entry.key)}
                                            disabled={isBusy}
                                            className="shrink-0 bg-advent-navy hover:bg-advent-cobalt text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Attest"}
                                        </button>
                                    )
                                )}
                            </div>

                            {active?.statement && (
                                <p className="text-[11px] font-medium text-slate-500 italic mt-2 leading-relaxed border-l-2 border-emerald-200 pl-3">
                                    “{active.statement}”
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {attestations.some(a => a.revoked_at) && (
                <details className="text-[10px]">
                    <summary className="font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600">
                        Withdrawn signatures ({attestations.filter(a => a.revoked_at).length})
                    </summary>
                    <ul className="mt-2 space-y-1">
                        {attestations.filter(a => a.revoked_at).map(a => (
                            <li key={a.id} className="text-slate-400 font-medium">
                                {a.faculty_name} · {a.milestone} · signed {new Date(a.signed_at).toLocaleDateString()},
                                withdrawn {new Date(a.revoked_at!).toLocaleDateString()}
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            {!canSign && (
                <p className="text-[11px] font-medium text-slate-400 italic">
                    Only faculty and programme staff can attest milestones.
                </p>
            )}
        </div>
    );
}
