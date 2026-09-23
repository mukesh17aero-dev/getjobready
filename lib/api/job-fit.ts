// Job fit, and the skill check attached to one posting.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Job fit (job-fit module) ----
//
// One posting, checked against what this person has actually done. The
// readiness figure is arithmetic over the requirement marks, computed on the
// server - it is never a model's opinion, and it is readiness against this
// posting rather than any kind of chance of being hired.

import { apiCall, generateCall } from "./core";
export type ReqState = "proof" | "claim" | "gap";

export type FitRequirement = {
  need: string;
  state: ReqState;
  from: string;
  note: string;
};

export type FitAxis = {
  label: string;
  you: number;
  need: number;
  /** The rows behind the number, in words. */
  basis: string;
};

/** The only next steps that exist. Each maps to a route in the app. */
export type NextAction = "practice-question" | "story" | "interview" | "record";

export type JobFitCheck = {
  id: string;
  roleTitle: string;
  /** False when the posting is outside what this product prepares for. */
  inScope: boolean;
  nextAction: NextAction | null;
  requirements: FitRequirement[];
  axes: FitAxis[];
  readiness: number;
  verdict: string;
  nextStep: string | null;
  createdAt: string;
  profileFit?: ProfileFitReport | null;
  opportunityId?: string | null;
  posting?: string;
};

export type JobFitState = { checks: JobFitCheck[]; axes: FitAxis[] };

/** Either a finished check, or a plain reason the posting could not be read. */
export type JobFitResult =
  { ok: true; check: JobFitCheck } | { ok: false; reason: string };

// ---- The skill check attached to one posting ----
//
// The same readiness questions an admin published, chosen by the skill they
// measure, for the skills this posting asks for. Nothing is authored on the
// fly; what comes back is a situation, the workplace it belongs to and the
// skill it is about.

export type SkillCheckQuestion = {
  id: string;
  skill: string;
  /** The line from the posting that sent us here. */
  need: string;
  workplace: string;
  buddy: string;
  title: string;
  brief: string;
  minutes: number;
};

export type SkillMark = { skill: string; score: number; why: string };

export type SkillCheckReview = {
  marks: SkillMark[];
  perQuestion: Array<{ id: string; did: string; better: string }>;
  strengths: string[];
  workOn: string[];
  summary: string;
  confidence: "low" | "medium";
  basis: { answered: number; asked: number };
};

export type SkillCheck = {
  skills: Array<{ skill: string; need: string }>;
  questions: SkillCheckQuestion[];
  answers: Record<string, string>;
  review: SkillCheckReview | null;
  startedAt: string;
  reviewedAt: string | null;
};

export type SkillCheckResult =
  | { ok: true; check: SkillCheck }
  | { ok: false; reason: string };

export const getSkillCheck = (token: string, checkId: string) =>
  apiCall<SkillCheckResult>(token, `/v1/job-fit/${checkId}/skill-check`);

export const saveSkillCheckAnswer = (
  token: string,
  checkId: string,
  questionId: string,
  response: string,
) =>
  apiCall<{ ok: true; answered: number }>(
    token,
    `/v1/job-fit/${checkId}/skill-check/answer`,
    { method: "PUT", body: { questionId, response } },
  );

export const reviewSkillCheck = (token: string, checkId: string) =>
  apiCall<
    { ok: true; review: SkillCheckReview; fresh: boolean } | { ok: false; reason: string }
  >(token, `/v1/job-fit/${checkId}/skill-check/review`, { method: "POST", body: {} });

export const getJobFit = (token: string, checkId?: string | null) =>
  apiCall<JobFitState>(token, `/v1/job-fit${checkId ? `?checkId=${encodeURIComponent(checkId)}` : ""}`);

export const checkJobFit = (token: string, input: string | { opportunityId: string } | { checkId: string }) =>
  generateCall<JobFitResult>(token, "/v1/job-fit", typeof input === "string" ? { posting: input } : input);

export type ProfileFitRequirement = {
  need: string; category: "skill" | "experience" | "education" | "qualification" | "language" | "availability";
  facets: Array<{ text: string; sourceId: string | null; sourceLabel: string | null; quote: string | null }>;
  status: "supported" | "partial" | "not_evidenced" | "unreviewed";
  supported: number; total: number; contribution: number;
};
export type FitRecommendation = { title: string; reason: string; href: string; kind: "profile" | "interview" | "simulation" };
export type ProfileFitReport = {
  ruleVersion: string; promptVersion: string; model: string | null;
  mode: "profile_comparison" | "needs_profile" | "analysis_unavailable";
  score: number | null; confidence: "low" | "medium"; confidenceReason: string;
  profileVersion: number | null; profileUpdatedAt: string | null;
  sources: Array<{ id: string; section: string; label: string; text: string }>;
  requirements: ProfileFitRequirement[]; recommendations: FitRecommendation[];
  summary: string; method: string; limitation: string;
};
