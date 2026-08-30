"use client"

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, GraduationCap, AlertTriangle, UserX, Search } from "lucide-react";
import { getProjectHealth } from "@/utils/projectHealth";
import { resolveMilestones, graduationPercent } from "@/utils/milestones";

interface Profile { id: string; full_name: string; role: string | null; }
interface ProjectRow {
    id: string;
    title: string;
    status: string | null;
    last_updated_date: string | null;
    protocol_url: string | null;
    presentation_url: string | null;
    pdsa_cycle: number | null;
    proponent_ids: string[] | null;
    lead_proponent_ids: string[] | null;
    proponents: string[] | null;
    lead_proponents: string[] | null;
}

/**
 * Names on projects are entered by hand ("Ahmad Anees" vs "Anees Ahmad MD"), so
 * compare on surname-ish tokens rather than exact strings. Deliberately requires
 * a token of 3+ characters to match, so short fragments cannot collide.
 */
function nameMatches(candidates: string[] | null, fullName: string | null): boolean {
    if (!candidates?.length || !fullName) return false;
    const strip = (v: string) =>
        v.toLowerCase().replace(/\b(dr\.?|md|do|mbbs)\b/g, "").replace(/[^a-z0-9 ]/g, " ");
    const mine = new Set(strip(fullName).split(/\s+/).filter(t => t.length > 2));
    if (mine.size === 0) return false;
    return candidates.some(c => {
        const theirs = strip(c).split(/\s+/).filter(t => t.length > 2);
        // Require at least two shared tokens when both names have several, so
        // "Khan" alone does not attach every Khan in the programme to a project.
        const shared = theirs.filter(t => mine.has(t)).length;
        return theirs.length >= 2 && mine.size >= 2 ? shared >= 2 : shared >= 1;
    });
}

interface ResidentRow {
    profile: Profile;
    projects: ProjectRow[];
    hasProtocol: boolean;
    pdsaCount: number;
    hasPresentation: boolean;
    metCount: number;
    stalledCount: number;
}

/**
 * Program-level view: who is on track for the three GME requirements, who has
 * no project at all, and where work is stalling.
 *
 * Every other surface is scoped to one resident or one mentor, so nobody could
 * see the cohort as a whole without exporting and eyeballing a spreadsheet.
 */
export default function CohortOverview() {
    const [residents, setResidents] = useState<ResidentRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState("");
    const supabase = createClient();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [{ data: profiles }, { data: projects }, { data: attestations }] = await Promise.all([
                supabase.from("profiles").select("id, full_name, role").order("full_name"),
                supabase.from("projects").select("id, title, status, last_updated_date, protocol_url, presentation_url, pdsa_cycle, proponent_ids, lead_proponent_ids, proponents, lead_proponents"),
                supabase.from("attestations").select("project_id, milestone, faculty_name, signed_at, revoked_at"),
            ]);
            if (cancelled) return;

            // Residents are everyone who is not faculty/admin/operator — the schema
            // has no dedicated Resident role, they are stored as Viewer.
            const cohort = (profiles || []).filter(
                (p: Profile) => p.role !== "Faculty" && p.role !== "Admin" && p.role !== "Operator"
            );

            const rows: ResidentRow[] = cohort.map((profile: Profile) => {
                // Match on id AND on name. Many projects carry proponent_ids that
                // resolve to no profile at all — orphaned UUIDs, presumably from an
                // earlier profile rebuild — while the names in proponents[] are
                // correct. Matching on id alone reported most of the cohort as
                // having no project when they plainly do.
                const mine = (projects || []).filter((p: ProjectRow) =>
                    (p.proponent_ids || []).includes(profile.id) ||
                    (p.lead_proponent_ids || []).includes(profile.id) ||
                    nameMatches(p.proponents, profile.full_name) ||
                    nameMatches(p.lead_proponents, profile.full_name)
                );
                // Counts SIGNED milestones, matching the portfolio. Counting the
                // resident's own fields overstated readiness: the programme issues
                // board letters off these figures.
                const states = resolveMilestones(mine as any, (attestations || []) as any);
                const hasProtocol = states.find(x => x.key === "protocol")?.verified ?? false;
                const hasPresentation = states.find(x => x.key === "presentation")?.verified ?? false;
                const pdsaCount = mine.reduce((sum, p) => sum + (Number(p.pdsa_cycle) || 0), 0);
                const metCount = Math.round((graduationPercent(states) / 100) * 3);
                const stalledCount = mine.filter(p => getProjectHealth(p).needsAttention).length;
                return { profile, projects: mine, hasProtocol, pdsaCount, hasPresentation, metCount, stalledCount };
            });

            // Most at-risk first: fewest requirements met, then most stalled work.
            rows.sort((a, b) => a.metCount - b.metCount || b.stalledCount - a.stalledCount);
            setResidents(rows);
            setIsLoading(false);
        })();
        return () => { cancelled = true; };
    }, [supabase]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return residents;
        return residents.filter(r => (r.profile.full_name || "").toLowerCase().includes(q));
    }, [residents, query]);

    const noProject = residents.filter(r => r.projects.length === 0).length;
    const boardReady = residents.filter(r => r.metCount === 3).length;
    const anyStalled = residents.filter(r => r.stalledCount > 0).length;

    if (isLoading) {
        return (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading cohort</span>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Cohort progress ({residents.length} residents)
                </h3>
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Find a resident..."
                        aria-label="Filter residents by name"
                        className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold outline-none focus:border-advent-navy transition-all w-full sm:w-56"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <Tile Icon={GraduationCap} label="Board ready" value={boardReady} tone="text-emerald-600" />
                <Tile Icon={UserX} label="No project yet" value={noProject} tone={noProject ? "text-rose-600" : "text-slate-300"} />
                <Tile Icon={AlertTriangle} label="Has stalled work" value={anyStalled} tone={anyStalled ? "text-amber-600" : "text-slate-300"} />
            </div>

            <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[560px] text-left">
                    <thead>
                        <tr className="border-b border-slate-100">
                            {["Resident", "Protocol", "PDSA", "Presented", "Progress"].map(h => (
                                <th key={h} className="px-2 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r.profile.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                                <td className="px-2 py-2.5">
                                    <span className="text-xs font-bold text-slate-900">{r.profile.full_name || "Unnamed"}</span>
                                    {r.projects.length === 0 && (
                                        <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-rose-600">no project</span>
                                    )}
                                    {r.stalledCount > 0 && (
                                        <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-amber-600">
                                            {r.stalledCount} stalled
                                        </span>
                                    )}
                                </td>
                                <td className="px-2 py-2.5"><Tick on={r.hasProtocol} /></td>
                                <td className="px-2 py-2.5">
                                    <span className={`text-[10px] font-black ${r.pdsaCount >= 2 ? "text-emerald-600" : "text-slate-400"}`}>
                                        {r.pdsaCount}/2
                                    </span>
                                </td>
                                <td className="px-2 py-2.5"><Tick on={r.hasPresentation} /></td>
                                <td className="px-2 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${r.metCount === 3 ? "bg-emerald-500" : r.metCount === 0 ? "bg-rose-400" : "bg-amber-400"}`}
                                                style={{ width: `${(r.metCount / 3) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500">{r.metCount}/3</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <p className="text-xs font-medium text-slate-400 italic py-4 px-2">No resident matches that name.</p>
                )}
            </div>
        </div>
    );
}

function Tick({ on }: { on: boolean }) {
    return (
        <span className={`text-[10px] font-black ${on ? "text-emerald-600" : "text-slate-300"}`}>
            {on ? "✓" : "—"}
        </span>
    );
}

function Tile({ Icon, label, value, tone }: { Icon: any; label: string; value: number; tone: string }) {
    return (
        <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3 h-3 ${tone}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight">{label}</span>
            </div>
            <p className={`text-2xl font-black leading-none ${tone}`}>{value}</p>
        </div>
    );
}
