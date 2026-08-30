/**
 * The three GME graduation milestones, and who gets to say they are met.
 *
 * Until now a milestone counted the moment a resident filled a field: a URL
 * pasted into protocol_url, a number typed into pdsa_cycle, any link in
 * presentation_url. Those fields are the resident's own claim. The programme
 * issues board-eligibility letters off them, so a claim is the wrong basis.
 *
 * A milestone is therefore modelled in two tiers:
 *
 *   evidenced  - the resident has produced the artefact
 *   verified   - a faculty mentor has signed an attestation for it
 *
 * Graduation counts VERIFIED. Evidenced-but-unverified is not failure, it is a
 * queue: it tells the resident what is waiting on their mentor, and tells the
 * mentor what is waiting on them. Nothing is lost by work done before
 * attestations existed - it shows as evidenced and needs one signature.
 */

export type MilestoneKey = "protocol" | "pdsa" | "presentation";

export const MILESTONE_LABELS: Record<MilestoneKey, string> = {
    protocol: "QI Protocol Approved",
    pdsa: "2+ PDSA Cycles Completed",
    presentation: "Institutional Presentation",
};

export interface AttestationLike {
    project_id: string;
    milestone: MilestoneKey | string;
    faculty_name?: string | null;
    signed_at?: string | null;
    revoked_at?: string | null;
}

export interface ProjectLike {
    id: string;
    protocol_url?: string | null;
    presentation_url?: string | null;
    pdsa_cycle?: number | null;
}

export interface MilestoneState {
    key: MilestoneKey;
    label: string;
    /** The resident has produced the artefact. */
    evidenced: boolean;
    /** A faculty mentor has signed for it. This is what graduation counts. */
    verified: boolean;
    verifiedBy?: string | null;
    verifiedAt?: string | null;
    /** Human-readable detail, e.g. cycle progress. */
    detail?: string;
}

export const REQUIRED_PDSA_CYCLES = 2;

/**
 * Resolves milestone state across all of a resident's projects.
 *
 * Evidence is summed across projects — a resident may present one project and
 * run cycles on another — while verification is per-milestone: one signature on
 * any project satisfies it, because it is the resident being certified.
 */
export function resolveMilestones(
    projects: ProjectLike[],
    attestations: AttestationLike[]
): MilestoneState[] {
    const live = attestations.filter(a => !a.revoked_at);
    const signedFor = (key: MilestoneKey) =>
        live.find(a => a.milestone === key && projects.some(p => p.id === a.project_id));

    const cycles = projects.reduce((sum, p) => sum + (Number(p.pdsa_cycle) || 0), 0);

    const evidence: Record<MilestoneKey, { evidenced: boolean; detail?: string }> = {
        protocol: { evidenced: projects.some(p => !!p.protocol_url) },
        pdsa: {
            evidenced: cycles >= REQUIRED_PDSA_CYCLES,
            detail: `${cycles}/${REQUIRED_PDSA_CYCLES} cycles`,
        },
        presentation: { evidenced: projects.some(p => !!p.presentation_url) },
    };

    return (Object.keys(MILESTONE_LABELS) as MilestoneKey[]).map(key => {
        const signature = signedFor(key);
        return {
            key,
            label: MILESTONE_LABELS[key],
            evidenced: evidence[key].evidenced,
            verified: !!signature,
            verifiedBy: signature?.faculty_name ?? null,
            verifiedAt: signature?.signed_at ?? null,
            detail: evidence[key].detail,
        };
    });
}

/** Percentage complete, counting only verified milestones. */
export function graduationPercent(states: MilestoneState[]): number {
    if (states.length === 0) return 0;
    return Math.round((states.filter(s => s.verified).length / states.length) * 100);
}

/** Milestones the resident has done but no mentor has signed. */
export function awaitingSignature(states: MilestoneState[]): MilestoneState[] {
    return states.filter(s => s.evidenced && !s.verified);
}

/** True only when every milestone carries a faculty signature. */
export function isBoardReady(states: MilestoneState[]): boolean {
    return states.length > 0 && states.every(s => s.verified);
}
