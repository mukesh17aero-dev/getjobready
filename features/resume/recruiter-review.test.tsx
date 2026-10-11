import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RecruiterReview } from "./recruiter-review";
import type { ResumeReview } from "./resume-api";

// The AI Recruiter Review: short takeaways and one next step from what they have done.

const review: ResumeReview = {
  strengths: ["Your store job shows billing at volume."],
  redFlags: ["'Promotion expected in March 2026' - that date has passed."],
  gaps: [],
  expectations: [{ what: "Billing and reconciliation", shown: true }, { what: "GST filing", shown: false }],
  standing: { level: "competitive", why: "Real work, but few results." },
  nextStep: { route: "practice", why: "" },
  roleIdeas: [{ role: "Accounts Assistant", why: "You handled billing every day.", roleId: "accounts_assistant" }],
  coverage: { covered: [], missing: [] },
  fromRules: false,
};
const page = (next: Parameters<typeof RecruiterReview>[0]["next"], role = "Accounts Assistant") => renderToStaticMarkup(<RecruiterReview review={review} next={next} role={role} />);

describe("the AI Recruiter Review", () => {
  it("gives the key takeaways: what they expect, what stands out, what to avoid", () => {
    const html = page({ kind: "readiness", roleId: "accounts_assistant", roleTitle: "Accounts Assistant" });
    expect(html).toContain("A RECRUITER FOR ACCOUNTS ASSISTANT WOULD SAY");
    expect(html).toContain("On track - ready to be considered");
    expect(html).toMatch(/data-shown="true"[\s\S]*?Billing and reconciliation/);
    expect(html).toMatch(/GST filing<span[^>]*> · to add<\/span>/);
    expect(html).toContain("What will stand out");
    expect(html).toContain("Small changes that will help");
    // Encouraging, never discouraging: no red crosses, no footnote.
    expect(html).not.toContain("✗");
    expect(html).not.toContain("An AI reading, not a hiring score.");
    // No coverage ring, no "Not assessed" card, no long evidence lists.
    expect(html).not.toContain("DOCUMENT COVERAGE");
    expect(html).not.toContain("Not assessed");
  });

  it("ends on one step decided from what they have done for the role", () => {
    expect(page({ kind: "readiness", roleId: "accounts_assistant", roleTitle: "Accounts Assistant" })).toMatch(/href="\/practice\/readiness\?role=accounts_assistant&amp;begin=1"[^>]*>Check my readiness/);
    expect(page({ kind: "simulation", roleId: "accounts_assistant", roleTitle: "Accounts Assistant" })).toMatch(/href="\/practice\/missions\?role=accounts_assistant"[^>]*>Try a simulation/);
    expect(page({ kind: "interview", roleId: "accounts_assistant", roleTitle: "Accounts Assistant" })).toMatch(/href="\/interview\/practice"[^>]*>Start an AI interview/);
  });

  it("points a resume aimed at no role to roles from our list to explore", () => {
    const html = page({ kind: "explore" }, "");
    expect(html).toContain("Roles your experience points to");
    expect(html).toMatch(/href="\/discover\?role=accounts_assistant"[^>]*>Explore this role/);
  });
});

it("shows the closest roles from our list when the target role is one we do not cover", () => {
  const html = renderToStaticMarkup(<RecruiterReview review={review} next={{ kind: "explore" }} role="System Development Engineer" />);
  expect(html).toContain("Roles closest to System Development Engineer");
  expect(html).toContain("is not one of the roles you can practise here yet");
  expect(html).toMatch(/href="\/discover\?role=accounts_assistant"[^>]*>Explore this role/);
});

it("carries no disclaimer lines on the page", async () => {
  const { readFileSync } = await import("node:fs");
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  expect(studio).not.toContain("An AI read to help you decide; it is not a hiring score.");
  expect(page({ kind: "explore" }, "")).not.toContain("not a verdict");
});
