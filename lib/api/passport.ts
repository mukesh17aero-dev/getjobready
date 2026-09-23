// Career Passport.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Career Passport (passport module) ----
//
// A private, read-only record assembled from evidence that already exists in
// other modules — never stored, never live-queried by anyone but the
// candidate. Missing data is a distinct state from a zero score: the shape
// below keeps "not connected yet" and "measured at zero" from ever colliding.

import { apiCall } from "./core";

export type PassportFeedState = "available" | "pending" | "unavailable";

export type PassportFeed<T> =
  | { state: "available"; data: T }
  | { state: "pending" | "unavailable"; data: null };

export type PassportJourneyModule =
  | "discovery"
  | "resume"
  | "assessment"
  | "training"
  | "reassessment"
  | "interview";

export type PassportJourneyStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "awaiting_data";

export type PassportJourneyStep = {
  module: PassportJourneyModule;
  title: string;
  status: PassportJourneyStatus;
  at: string | null;
  detail: string;
  sourceId: string | null;
};

export type PassportSkillReading = {
  score: number;
  assessmentId: string;
  at: string;
  basis: string;
  confidence: string;
  rubricVersion: string;
};

export type PassportSkillComparison = {
  id: string;
  name: string;
  before: PassportSkillReading | null;
  after: PassportSkillReading | null;
  /** Percentage points, same rubric only. Null when not yet comparable. */
  change: number | null;
  explanation: string;
};

export type PassportProvenance = {
  sourceId: string;
  recordedAt: string;
  confidence: "low" | "medium" | "high";
  evidence: { id: string; title: string }[];
};

export type PassportTraining = {
  id: string;
  roleId: string;
  title: string;
  status: "in_progress" | "completed";
  completedAt: string | null;
  tasksSubmitted: number;
  tasksTotal: number;
  skillIds: string[];
  provenance: PassportProvenance;
};

export type PassportInterview = {
  id: string;
  roleId: string;
  title: string;
  score: number | null;
  scoringVersion: string | null;
  strengths: string[];
  improvements: string[];
  provenance: PassportProvenance;
};

export type PassportEvidenceItem = {
  id: string;
  title: string;
  module: string;
  sourceId: string;
  recordedAt: string;
  confidence: "low" | "medium" | "high";
  consent: "private";
};

export type PassportCandidate = {
  name: string | null;
  summary: string | null;
  location: string | null;
  education: { title: string; organisation: string | null; period: string | null }[];
  experience: { title: string; organisation: string | null; period: string | null }[];
};

export type PassportOverview = {
  version: string;
  generatedAt: string;
  mode: "candidate_preview";
  role: { id: string; title: string } | null;
  candidate: PassportFeed<PassportCandidate>;
  sources: {
    journey: PassportFeedState;
    assessments: PassportFeedState;
    training: PassportFeedState;
    interviews: PassportFeedState;
  };
  journey: PassportJourneyStep[];
  skills: PassportSkillComparison[];
  training: PassportTraining[];
  interviews: PassportInterview[];
  evidence: PassportEvidenceItem[];
  summary: {
    completedModules: number;
    totalModules: number;
    assessedSkills: number;
    evidenceCount: number;
  };
  sharing: { enabled: false; state: "private"; reason: string };
  limitations: string[];
};

export const getPassportOverview = (token: string) =>
  apiCall<{ overview: PassportOverview }>(token, "/v1/passport/overview");
