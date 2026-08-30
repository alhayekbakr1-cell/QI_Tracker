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
