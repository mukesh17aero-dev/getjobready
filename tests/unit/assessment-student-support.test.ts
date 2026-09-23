import { describe, expect, it } from "vitest";
import type { ArcBank } from "@/lib/api";
import { assessmentTerms } from "@/features/assessment";
import { importAssessmentWording } from "@/features/assessment";

const bank: ArcBank = { arcs: [{ roleId: "one", roleTitle: "One", company: "Fictional", buddy: "Alex", skills: ["Accuracy"], scenes: [{ id: "s1", title: "A question", day: "Day 1", brief: "Original", minutes: 2, support: "assistant", answer: "typed", fields: [], measures: ["Accuracy"], criteria: ["Preserves the deadline"] }] }] };
describe("student reading support", () => {
  it("matches relevant terms without matching parts of other words", () => {
    expect(assessmentTerms("Update the CRM ticket and escalate the discrepancy.").map(t => t.term)).toEqual(["Support ticket", "CRM", "Escalation", "Discrepancy"]);
    expect(assessmentTerms("The dispatcher leads a premium-quality stockroom.").some(t => t.term === "Dispatch")).toBe(false);
    expect(assessmentTerms("CRM")).toEqual(assessmentTerms("CRM"));
  });
  it("changes only briefs, preserving skills, criteria and the original bank", () => {
    const result = importAssessmentWording(bank, { updates: [{ roleId: "one", sceneId: "s1", before: "Original", brief: "Shorter" }] });
    expect(result.changed).toBe(1);
    expect(result.bank.arcs[0].scenes[0]).toEqual({ ...bank.arcs[0].scenes[0], brief: "Shorter" });
    expect(bank.arcs[0].scenes[0].brief).toBe("Original");
  });
  it("rejects an entire import when one source changed", () => {
    expect(() => importAssessmentWording(bank, { updates: [{ roleId: "one", sceneId: "s1", before: "Older wording", brief: "Shorter" }] })).toThrow("has changed");
    expect(bank.arcs[0].scenes[0].brief).toBe("Original");
  });
  it("rejects duplicate and missing questions instead of silently overwriting", () => {
    const update = { roleId: "one", sceneId: "s1", before: "Original", brief: "Shorter" };
    expect(() => importAssessmentWording(bank, { updates: [update, update] })).toThrow("Duplicate");
    expect(() => importAssessmentWording(bank, { updates: [{ ...update, roleId: "two" }] })).toThrow("missing");
    expect(() => importAssessmentWording(bank, { updates: [{ ...update, brief: " " }] })).toThrow();
  });
});
