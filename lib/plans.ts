// The Resume Studio plans, in one place so the studio and the account menu
// describe the same thing. Choosing a plan is a choice recorded on the
// person's record (preferences.resumePlan) and, before they have an account,
// in this browser - there is no billing behind it yet, so nowhere may it be
// described as a purchase.

export type PlanId = "starter" | "plus" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  /** Rupees, one-time, for a 30-day pass. */
  price: number;
  tag: string;
  intro: string;
  outcome: string;
  features: string[];
};

export const PLANS: Plan[] = [
  { id: "starter", name: "Resume Starter", price: 99, tag: "START SMALL", intro: "For your first application.", outcome: "One resume you can feel ready to share.", features: ["1 AI resume draft", "5 AI improvements", "Resume feedback", "PDF and Word downloads"] },
  { id: "plus", name: "Resume Plus", price: 199, tag: "RECOMMENDED FOR MULTIPLE APPLICATIONS", intro: "For a few different opportunities.", outcome: "Shape your story for up to three roles.", features: ["3 AI resume drafts", "15 AI improvements", "Feedback for each resume", "PDF and Word downloads"] },
  { id: "pro", name: "Career Pro", price: 499, tag: "THE CAREER WORKSPACE", intro: "For applications and interview preparation.", outcome: "Build your application. Practise what comes next.", features: ["All Resume Plus features", "5 resume drafts + 30 AI improvements total", "LinkedIn profile + 5 AI revisions", "5 job-fit checks", "2 AI mock interviews · 10 minutes each", "1 readiness assessment + 5 practice sets"] },
];

/** Where the choice waits in this browser until there is an account to keep it. */
export const PLAN_KEY = "ascend:resume-plan";

export const isPlan = (v: unknown): v is PlanId => v === "starter" || v === "plus" || v === "pro";

export const planById = (id: PlanId): Plan => PLANS.find((plan) => plan.id === id) ?? PLANS[1]!;
