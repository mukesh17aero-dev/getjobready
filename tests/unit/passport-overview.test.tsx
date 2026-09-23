import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PassportOverview } from "@/features/passport";
import type { PassportOverview as PassportOverviewData } from "@/lib/api";

const base: PassportOverviewData = {
  version: "passport-overview-v1",
  generatedAt: "2026-09-23T09:00:00Z",
  mode: "candidate_preview",
  role: { id: "role-1", title: "Customer Success Associate" },
  candidate: { state: "pending", data: null },
  sources: { journey: "pending", assessments: "pending", training: "pending", interviews: "pending" },
  journey: [
    { module: "discovery", title: "Career direction", status: "completed", at: "2026-08-01T09:00:00Z", detail: "Chose a direction.", sourceId: "src-1" },
    { module: "assessment", title: "Starting assessment", status: "awaiting_data", at: null, detail: "Journey progress has not been connected yet.", sourceId: null },
  ],
  skills: [],
  training: [],
  interviews: [],
  evidence: [],
  summary: { completedModules: 1, totalModules: 6, assessedSkills: 0, evidenceCount: 0 },
  sharing: { enabled: false, state: "private", reason: "Private preview. Employer sharing requires candidate approval, a frozen snapshot and a revocable link." },
  limitations: ["Module completion is not proof of proficiency.", "Missing results mean not available, not a score of zero."],
};

const render = (overview: PassportOverviewData, name = "Aarav Mehta") =>
  renderToStaticMarkup(createElement(PassportOverview, { overview, name, photo: null }));

describe("Passport overview page", () => {
  it("shows a dash rather than zero when a source has not connected yet", () => {
    const html = render(base);
    expect(html).toContain("Journey stages completed");
    expect(html).not.toContain("1 / 6");
    expect(html).toContain("—"); // em dash standing in for the unmeasured stats
  });

  it("gives each empty section an honest, distinct explanation", () => {
    const html = render(base);
    expect(html).toContain("Skill results will appear here");
    expect(html).toContain("A missing score is never shown as zero");
    expect(html).toContain("Training evidence is on its way");
    expect(html).toContain("Interview results will appear here");
    expect(html).toContain("A place for proof");
    expect(html).toContain("Education has not been added yet");
    expect(html).toContain("Experience has not been added yet");
  });

  it("marks an unavailable feed as a failure rather than silence", () => {
    const html = render({ ...base, sources: { ...base.sources, training: "unavailable" } });
    expect(html).toContain("could not be loaded");
  });

  it("never renders sharing as available", () => {
    const html = render(base);
    expect(html).toContain("Sharing unavailable");
    expect(html).toContain(base.sharing.reason);
    expect(html).not.toContain("Share this passport");
  });

  it("falls back to a plain prompt when no role has been chosen", () => {
    const html = render({ ...base, role: null });
    expect(html).toContain("Choose a target role");
  });

  it("renders a populated record without inventing numbers", () => {
    const populated: PassportOverviewData = {
      ...base,
      candidate: {
        state: "available",
        data: {
          name: "Aarav Mehta",
          summary: "Early-career candidate building customer support experience.",
          location: "Bengaluru, India",
          education: [{ title: "Bachelor of Commerce", organisation: "Example College", period: "2023 – 2026" }],
          experience: [{ title: "Customer support project", organisation: "Fictional student project", period: "2026" }],
        },
      },
      sources: { journey: "available", assessments: "available", training: "available", interviews: "available" },
      skills: [
        {
          id: "care",
          name: "Customer care",
          before: { score: 48, assessmentId: "a1", at: "2026-08-03T09:00:00Z", basis: "Missed some required actions.", confidence: "medium", rubricVersion: "v1" },
          after: { score: 78, assessmentId: "a2", at: "2026-09-03T09:00:00Z", basis: "Met more rubric criteria.", confidence: "medium", rubricVersion: "v1" },
          change: 30,
          explanation: "Percentage-point change on the same rubric.",
        },
      ],
      training: [
        {
          id: "t1", roleId: "role-1", title: "Customer support workplace practice", status: "completed",
          completedAt: "2026-09-01T09:00:00Z", tasksSubmitted: 9, tasksTotal: 9, skillIds: ["care"],
          provenance: { sourceId: "t1", recordedAt: "2026-09-01T09:00:00Z", confidence: "medium", evidence: [{ id: "t1-e", title: "Complaint response task" }] },
        },
      ],
      interviews: [
        {
          id: "i1", roleId: "role-1", title: "Customer success practice interview", score: 72, scoringVersion: "demo-v1",
          strengths: ["Explained personal actions with concrete examples."], improvements: ["Make the result more specific."],
          provenance: { sourceId: "i1", recordedAt: "2026-09-05T09:00:00Z", confidence: "medium", evidence: [{ id: "i1-e", title: "Recorded interview" }] },
        },
      ],
      evidence: [{ id: "t1-e", title: "Complaint response task", module: "training", sourceId: "t1", recordedAt: "2026-09-01T09:00:00Z", confidence: "medium", consent: "private" }],
      summary: { completedModules: 1, totalModules: 6, assessedSkills: 1, evidenceCount: 1 },
    };
    const html = render(populated);
    expect(html).toContain("Aarav Mehta");
    expect(html).toContain("Bengaluru, India");
    expect(html).toContain("Customer care");
    expect(html).toContain("+30 pts");
    expect(html).toContain("9 of 9 tasks submitted");
    expect(html).toContain("Explained personal actions with concrete examples.");
    expect(html).toContain("Complaint response task");
    expect(html).toContain("Bachelor of Commerce");
    expect(html).not.toContain("Not comparable");
  });
});
