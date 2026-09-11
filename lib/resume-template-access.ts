import type { ResumeTemplate } from "./resume-api";
import type { PlanId } from "./plans";

const BASIC: ResumeTemplate[] = ["classic"];
const STARTER: ResumeTemplate[] = ["classic", "compact", "sidebar"];
const ALL: ResumeTemplate[] = [...STARTER, "minimal", "graduate", "professional"];

/** Temporary UI gate based on the selected plan, not payment verification. */
export function previewTemplates(plan: PlanId | null, signedOut: boolean): ResumeTemplate[] {
  if (signedOut || !plan) return BASIC;
  return plan === "starter" ? STARTER : ALL;
}

/** Saved versions and other pickers cannot reveal a layout outside this selection. */
export function previewTemplate(requested: ResumeTemplate, allowed: readonly ResumeTemplate[]): ResumeTemplate {
  return allowed.includes(requested) ? requested : "classic";
}
