// The Resume Studio plans.
//
// There is no billing behind these yet, so the one rule that matters is that
// nothing here may read as a purchase. The rest is making sure the studio and
// the account menu cannot describe the same plan differently.

import { describe, expect, it } from "vitest";
import { isPlan, PLANS, PLAN_KEY, planById } from "@/features/resume";

describe("the plans on offer", () => {
  it("offers three, cheapest first", () => {
    expect(PLANS.map((p) => p.id)).toEqual(["starter", "plus", "pro"]);
    const prices = PLANS.map((p) => p.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("gives every plan the copy a card needs", () => {
    for (const plan of PLANS) {
      expect(plan.name, plan.id).toBeTruthy();
      expect(plan.intro, plan.id).toBeTruthy();
      expect(plan.outcome, plan.id).toBeTruthy();
      expect(plan.features.length, plan.id).toBeGreaterThan(0);
      expect(plan.price, plan.id).toBeGreaterThan(0);
    }
  });

  it("never describes a plan as something already bought", () => {
    const words = /\b(purchased|bought|paid|your subscription|billing)\b/i;
    for (const plan of PLANS) {
      const copy = [plan.name, plan.tag, plan.intro, plan.outcome, ...plan.features].join(" ");
      expect(copy, plan.id).not.toMatch(words);
    }
  });

  it("makes no claim about outcomes", () => {
    const promises = /\bguarantee|guaranteed|get hired|job offer|placement\b/i;
    for (const plan of PLANS) {
      expect([plan.intro, plan.outcome].join(" "), plan.id).not.toMatch(promises);
    }
  });
});

describe("reading a plan back", () => {
  it("accepts the three real ids and nothing else", () => {
    expect(["starter", "plus", "pro"].every(isPlan)).toBe(true);
    for (const junk of ["free", "", "STARTER", null, undefined, 1, {}]) {
      expect(isPlan(junk), String(junk)).toBe(false);
    }
  });

  it("falls back to the recommended plan rather than crashing", () => {
    // planById is given a PlanId, but the value reaching it came from storage.
    expect(planById("nonsense" as never).id).toBe("plus");
  });

  it("returns the plan asked for", () => {
    for (const plan of PLANS) expect(planById(plan.id)).toBe(plan);
  });

  it("namespaces the browser key so it cannot collide", () => {
    expect(PLAN_KEY.startsWith("ascend:")).toBe(true);
  });
});
