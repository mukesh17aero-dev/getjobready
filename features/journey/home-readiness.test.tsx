import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { HomeEvidence } from "@/lib/api";
import { HomeReadiness } from "./home-readiness";

const role = { id: "operations", title: "Operations Executive", pitch: "", payMonthly: null, next: null };
const result = { roleId: "operations", score: 67, at: "2026-10-03T12:00:00Z", confidence: "medium", basis: { scenesAttempted: 5, scenesInSitting: 10 }, runId: "run-1" };
const evidence = (readiness: HomeEvidence["readiness"]): HomeEvidence => ({ readiness, weakestSkill: null, interview: null });

describe("Home readiness evidence", () => {
  it("keeps role, denominator, source, confidence and timestamp beside the backend score", () => {
    const html = renderToStaticMarkup(<HomeReadiness role={role} evidence={evidence([result])} />);
    for (const copy of ["Operations Executive", "67", " / 100", "5", "10", "medium", "Source: role skills assessment", "2026-10-03T12:00:00Z", "not a hiring prediction", "/practice/readiness/results/run-1"]) expect(html).toContain(copy);
  });
  it("does not present another role's score as the selected direction", () => {
    const html = renderToStaticMarkup(<HomeReadiness role={role} evidence={evidence([{ ...result, roleId: "other" }])} />);
    expect(html).not.toContain("67");
    expect(html).toContain("Try a role task");
  });
  it("withholds incomplete scores while keeping the assessment accessible", () => {
    for (const incomplete of [{ ...result, confidence: null }, { ...result, basis: null }, { ...result, at: "invalid" }]) {
      const html = renderToStaticMarkup(<HomeReadiness role={role} evidence={evidence([incomplete])} />);
      expect(html).not.toContain("67");
      expect(html).toContain("Review my evidence");
    }
  });
});
