// Deterministic readiness rules. No database calls, no AI calls, no side effects.
// See docs/BUILD_GUIDE.md section 2.4 for the specification.

export type DimensionStatus =
  | "not_assessed"
  | "developing"
  | "meets_standard"
  | "strong"
  | "outdated";

export interface EvidenceItem {
  score: number;
  createdAt: Date;
  verified: boolean;
}

export interface DimensionRule {
  threshold: number;
  strongThreshold: number;
  minEvidenceCount: number;
  validityDays: number;
}

export interface DimensionStatusResult {
  status: DimensionStatus;
  effectiveScore: number | null;
}

export function calculateDimensionStatus(input: {
  evidenceItems: EvidenceItem[];
  rule: DimensionRule;
  now: Date;
}): DimensionStatusResult {
  const { evidenceItems, rule, now } = input;

  const verified = evidenceItems.filter((e) => e.verified);
  if (verified.length === 0) {
    return { status: "not_assessed", effectiveScore: null };
  }

  const validCutoff = new Date(
    now.getTime() - rule.validityDays * 24 * 60 * 60 * 1000
  );
  const valid = verified.filter((e) => e.createdAt >= validCutoff);
  if (valid.length === 0) {
    return { status: "outdated", effectiveScore: null };
  }

  // Effective score = mean of the best 3 valid scores (fewer if fewer exist).
  const top3 = [...valid].sort((a, b) => b.score - a.score).slice(0, 3);
  const effectiveScore =
    top3.reduce((sum, e) => sum + e.score, 0) / top3.length;

  if (
    valid.length >= rule.minEvidenceCount + 1 &&
    effectiveScore >= rule.strongThreshold
  ) {
    return { status: "strong", effectiveScore };
  }

  if (
    valid.length >= rule.minEvidenceCount &&
    effectiveScore >= rule.threshold
  ) {
    return { status: "meets_standard", effectiveScore };
  }

  return { status: "developing", effectiveScore };
}

// Weighted average of dimension scores, mapped from 0-100 to 300-800.
// A null effectiveScore (not_assessed/outdated) contributes 0 to the
// numerator but its weight still counts in the denominator — an
// unmeasured dimension drags the score down, which is intentional.
export function calculatePRI(
  dims: { weight: number; effectiveScore: number | null }[]
): number {
  const totalWeight = dims.reduce((sum, d) => sum + d.weight, 0);
  const weightedSum = dims.reduce(
    (sum, d) => sum + d.weight * (d.effectiveScore ?? 0),
    0
  );
  const pct = weightedSum / totalWeight;
  return Math.round(300 + (pct / 100) * 500);
}

// Passport eligibility: ALL active dimensions must be meets_standard or strong.
export function isPassportEligible(statuses: DimensionStatus[]): boolean {
  return (
    statuses.length > 0 &&
    statuses.every((s) => s === "meets_standard" || s === "strong")
  );
}
