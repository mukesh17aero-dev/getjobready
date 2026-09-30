import { describe, it, expect } from "vitest";
import { homePlan } from "@/features/journey";
import type { JourneyState } from "@/lib/api";

const NOW = Date.parse("2026-10-01");
const state = (over: { focus?: "journey" | "interview" | "practice" | "presence" | null; role?: string; modules?: JourneyState["modules"]; weakest?: string; mark?: { mark: number; bar: number } }): JourneyState => ({
  routes: [],
  current: null,
  progress: {
    told: 1, name: "Varun", track: null, discoveryDone: Boolean(over.role), selectedRole: over.role ? "r" : null, focus: over.focus ?? null,
    role: over.role ? { id: "r", title: over.role, pitch: "", payMonthly: null, next: null } : null,
  },
  modules: over.modules ?? {},
  evidence: { readiness: [], weakestSkill: over.weakest ?? null, interview: over.mark ?? null },
});

describe("home plan", () => {
  it("sends a new student with no role to explore first", () => {
    const plan = homePlan(state({}), NOW);
    expect(plan.next.href).toBe("/discover");
    expect(plan.rail[0]).toMatchObject({ label: "Explore the role", state: "current" });
    expect(plan.alsoAvailable).toEqual([]);
  });

  it("moves a full-journey student on to missions once readiness is done, with the weakest skill as the reason", () => {
    const plan = homePlan(state({ role: "Operations Executive", modules: { readiness: "done" }, weakest: "Clear communication" }), NOW);
    expect(plan.heading).toBe("Your Operations Executive journey");
    expect(plan.next.href).toBe("/practice/missions");
    expect(plan.next.why).toContain("Clear communication");
    expect(plan.rail.map((s) => s.state)).toEqual(["done", "done", "current", "ahead", "ahead"]);
  });

  it("keeps an interview-only customer on interviews, with everything else under Also available", () => {
    const plan = homePlan(state({ focus: "interview", role: "Customer Success Associate", modules: { interview: "done" }, mark: { mark: 58, bar: 70 } }), NOW);
    expect(plan.heading).toBe("Your interview preparation · Customer Success Associate");
    expect(plan.next.title).toBe("Rehearse again, with your feedback");
    expect(plan.next.why).toContain("58");
    expect(plan.groups.map((g) => g.id)).toEqual(["interview"]);
    expect(plan.alsoAvailable.map((g) => g.id)).toEqual(["explore", "readiness", "presence"]);
  });

  it("points a resume-and-LinkedIn customer at the first thing not done", () => {
    const plan = homePlan(state({ focus: "presence", modules: { resume: "done", linkedin: "in_progress" } }), NOW);
    expect(plan.next.href).toBe("/profile/professional");
    expect(plan.rail.map((s) => s.state)).toEqual(["done", "started", "ahead"]);
  });
});
