import { differenceInDays } from "date-fns";

/**
 * Single source of truth for project staleness.
 *
 * This logic was previously copy-pasted across admin/dashboard, projects/page,
 * and StaleNudgePanel with three different comparisons (`>= 30`, `> 30`, `> 60`),
 * so the same project could read as healthy on one screen and stale on another.
 *
 * Thresholds come from the project spec: yellow past 30 days, red past 60.
 */
export const STALE_WARNING_DAYS = 30;
export const STALE_CRITICAL_DAYS = 60;

export type HealthLevel = "complete" | "ok" | "warning" | "critical";

export interface ProjectHealth {
    level: HealthLevel;
    days: number;
    label: string;
    /** True when the project needs a human to do something about it. */
    needsAttention: boolean;
}

/** Completed work is never "stale" — it is done. */
function isComplete(status?: string | null): boolean {
    if (!status) return false;
    return /completed|impacted \(completed\)|archived/i.test(status);
}

export function daysSinceUpdate(lastUpdated?: string | null): number {
    if (!lastUpdated) return Number.POSITIVE_INFINITY;
    const parsed = new Date(lastUpdated);
    if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
    return differenceInDays(new Date(), parsed);
}

export function getProjectHealth(project: {
    status?: string | null;
    last_updated_date?: string | null;
}): ProjectHealth {
    if (isComplete(project.status)) {
        return { level: "complete", days: 0, label: "Completed", needsAttention: false };
    }

    const days = daysSinceUpdate(project.last_updated_date);

    // A project with no recorded update date is treated as critical rather than
    // healthy: an unknown last-touched date is a problem, not a pass.
    if (!Number.isFinite(days)) {
        return { level: "critical", days: 0, label: "No update recorded", needsAttention: true };
    }

    if (days >= STALE_CRITICAL_DAYS) {
        return { level: "critical", days, label: `Stalled ${days} days`, needsAttention: true };
    }
    if (days >= STALE_WARNING_DAYS) {
        return { level: "warning", days, label: `${days} days since update`, needsAttention: true };
    }
    return { level: "ok", days, label: `Updated ${days}d ago`, needsAttention: false };
}

/** Tailwind classes per level, so every surface renders health identically. */
export const HEALTH_STYLES: Record<HealthLevel, { badge: string; dot: string; text: string }> = {
    complete: { badge: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400", text: "text-slate-500" },
    ok: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700" },
    warning: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", text: "text-amber-700" },
    critical: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", text: "text-rose-700" },
};

/** Most urgent first, so an at-risk list needs no extra sorting logic. */
export function byUrgency<T extends { status?: string | null; last_updated_date?: string | null }>(a: T, b: T): number {
    const order: Record<HealthLevel, number> = { critical: 0, warning: 1, ok: 2, complete: 3 };
    const ha = getProjectHealth(a);
    const hb = getProjectHealth(b);
    if (order[ha.level] !== order[hb.level]) return order[ha.level] - order[hb.level];
    return hb.days - ha.days;
}
