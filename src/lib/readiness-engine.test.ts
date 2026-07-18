import { describe, expect, it } from "vitest";
import { calculateDimensionStatus, type DimensionRule } from "./readiness-engine";

const now = new Date("2026-07-18T00:00:00Z");

const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const standardRule: DimensionRule = {
  threshold: 70,
  strongThreshold: 85,
  minEvidenceCount: 2,
  validityDays: 90,
};

describe("calculateDimensionStatus", () => {
  it("returns not_assessed with zero evidence items", () => {
    const result = calculateDimensionStatus({
      evidenceItems: [],
      rule: standardRule,
      now,
    });
    expect(result).toEqual({ status: "not_assessed", effectiveScore: null });
  });

  it("returns not_assessed when evidence exists but none is verified", () => {
    const result = calculateDimensionStatus({
      evidenceItems: [{ score: 80, createdAt: daysAgo(1), verified: false }],
      rule: standardRule,
      now,
    });
    expect(result).toEqual({ status: "not_assessed", effectiveScore: null });
  });

  it("returns outdated when verified evidence is all older than the validity window", () => {
    const result = calculateDimensionStatus({
      evidenceItems: [{ score: 80, createdAt: daysAgo(100), verified: true }],
      rule: standardRule,
      now,
    });
    expect(result).toEqual({ status: "outdated", effectiveScore: null });
  });

  it("returns meets_standard at score 78 with 2 valid items (threshold 70)", () => {
    const result = calculateDimensionStatus({
      evidenceItems: [
        { score: 78, createdAt: daysAgo(1), verified: true },
        { score: 78, createdAt: daysAgo(2), verified: true },
      ],
      rule: standardRule,
      now,
    });
    expect(result).toEqual({ status: "meets_standard", effectiveScore: 78 });
  });

  it("returns strong at score 90 with 3 valid items (strong_threshold 85)", () => {
    const result = calculateDimensionStatus({
      evidenceItems: [
        { score: 90, createdAt: daysAgo(1), verified: true },
        { score: 90, createdAt: daysAgo(2), verified: true },
        { score: 90, createdAt: daysAgo(3), verified: true },
      ],
      rule: standardRule,
      now,
    });
    expect(result).toEqual({ status: "strong", effectiveScore: 90 });
  });

  it("returns meets_standard, not strong, at score 90 with only 2 items (strong needs min_evidence+1=3)", () => {
    const result = calculateDimensionStatus({
      evidenceItems: [
        { score: 90, createdAt: daysAgo(1), verified: true },
        { score: 90, createdAt: daysAgo(2), verified: true },
      ],
      rule: standardRule,
      now,
    });
    expect(result).toEqual({ status: "meets_standard", effectiveScore: 90 });
  });

  it("returns developing when score 65 is below threshold 70", () => {
    const result = calculateDimensionStatus({
      evidenceItems: [
        { score: 65, createdAt: daysAgo(1), verified: true },
        { score: 65, createdAt: daysAgo(2), verified: true },
      ],
      rule: standardRule,
      now,
    });
    expect(result).toEqual({ status: "developing", effectiveScore: 65 });
  });

  it("ignores expired evidence: only the 2 valid items feed the score, not the 3 expired ones", () => {
    const result = calculateDimensionStatus({
      evidenceItems: [
        { score: 80, createdAt: daysAgo(1), verified: true },
        { score: 90, createdAt: daysAgo(2), verified: true },
        { score: 10, createdAt: daysAgo(100), verified: true },
        { score: 20, createdAt: daysAgo(120), verified: true },
        { score: 30, createdAt: daysAgo(150), verified: true },
      ],
      rule: standardRule,
      now,
    });
    expect(result).toEqual({ status: "meets_standard", effectiveScore: 85 });
  });

  it("counts a score exactly equal to the threshold as meeting it", () => {
    const result = calculateDimensionStatus({
      evidenceItems: [
        { score: 70, createdAt: daysAgo(1), verified: true },
        { score: 70, createdAt: daysAgo(2), verified: true },
      ],
      rule: standardRule,
      now,
    });
    expect(result).toEqual({ status: "meets_standard", effectiveScore: 70 });
  });
});
