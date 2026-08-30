/**
 * Development-only authentication bypass.
 *
 * Exists so the authenticated surfaces (portfolio, faculty portal, cohort
 * overview, project wizard) can be inspected locally without an institutional
 * OTP round-trip.
 *
 * Two independent conditions must BOTH hold, and the first one cannot be true
 * in the deployed site: `next build` for the static export runs with
 * NODE_ENV=production, so this constant folds to `false` and the bypass code is
 * dropped from the bundle entirely. Setting the env var in GitHub Actions would
 * still not enable it.
 *
 * Never gate anything that writes on this. It fakes a *session*, not a
 * Postgres identity — auth.uid() is still null, so every RLS-protected insert
 * (attestations, submissions, project creation) will still be refused.
 */
export const AUTH_BYPASS =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

/**
 * Identity assumed while AUTH_BYPASS is active.
 *
 * Set NEXT_PUBLIC_DEV_AUTH_USER_ID to a real profiles.id in .env.development.local.
 * Pages look the signed-in profile up with `.single()`, which returns HTTP 406
 * when nothing matches — so an unmatched id leaves the portfolio and faculty
 * portal stuck on their loading states rather than rendering.
 *
 * No id is hardcoded here on purpose: this file is committed, and a real
 * person's UUID does not belong in the repository.
 */
export const DEV_USER = {
    id: process.env.NEXT_PUBLIC_DEV_AUTH_USER_ID || "00000000-0000-0000-0000-000000000000",
    email: "dev.preview@local",
};

/**
 * Dev-only role override, for inspecting a role you do not hold.
 *
 * Set NEXT_PUBLIC_DEV_AUTH_ROLE in .env.development.local (Viewer, Operator,
 * Admin, Faculty). Viewer is the resident role — the schema has no separate
 * Resident value.
 *
 * Gated on AUTH_BYPASS, which is compile-time false in a production build, so
 * this cannot alter anyone's permissions on the deployed site. It only changes
 * what the local UI renders; the database still enforces the real role through
 * RLS, so this can show you a layout but never grant access.
 */
export function withDevRole<T extends { role?: string | null } | null>(profile: T): T {
    // AUTH_BYPASS is checked FIRST on purpose. It folds to a literal false in a
    // production build, so the minifier drops everything below it - including the
    // env lookup. Reading the env var first left it behind as a dead expression.
    if (!AUTH_BYPASS) return profile;
    const override = process.env.NEXT_PUBLIC_DEV_AUTH_ROLE;
    if (!override) return profile;
    return { ...(profile ?? {}), role: override } as T;
}
