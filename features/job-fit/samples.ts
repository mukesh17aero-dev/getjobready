import type { JobFitCheck, ProfileFitReport } from "@/lib/api";

const report: ProfileFitReport = {
  ruleVersion: "profile-fit-v1", promptVersion: "v1", model: null, mode: "profile_comparison",
  score: 50, confidence: "low", confidenceReason: "This example has only one supporting profile section. All information is self-reported.",
  profileVersion: 1, profileUpdatedAt: "2026-09-23T00:00:00Z",
  sources: [{ id: "example-experience", section: "experience", label: "Example profile · retail experience", text: "Handled customer complaints at a retail counter." }],
  requirements: [
    { need: "Handle customer complaints", category: "skill", facets: [{ text: "customer complaints", sourceId: "example-experience", sourceLabel: "Example profile · retail experience", quote: "Handled customer complaints" }], status: "supported", supported: 1, total: 1, contribution: 1 },
    { need: "Maintain Salesforce records", category: "skill", facets: [{ text: "Salesforce", sourceId: null, sourceLabel: null, quote: null }], status: "not_evidenced", supported: 0, total: 1, contribution: 0 },
  ],
  recommendations: [{ kind: "profile", title: "Add any CRM experience", reason: "If you have used Salesforce, add the details. If not, this is an area to develop.", href: "/profile" }],
  summary: "One of two requirements is supported by the example profile. CRM experience is not evidenced.",
  method: "Each requirement has equal weight. One supported requirement out of two gives this example a profile-fit score of 50/100.",
  limitation: "This is an illustrative profile-fit estimate, not demonstrated performance, a market ranking or a hiring probability.",
};
export const SAMPLE_JOB_FIT: JobFitCheck = {
  id: "sample-check", roleTitle: "Customer Success Associate", readiness: 50, inScope: true,
  nextAction: null, nextStep: null, verdict: report.summary, requirements: [], axes: [],
  createdAt: "2026-09-23T00:00:00Z", profileFit: report,
};
