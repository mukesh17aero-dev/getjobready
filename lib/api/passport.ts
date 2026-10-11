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

import { API_URL, apiCall, requestHeaders } from "./core";

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

/** Something achieved toward the role: marked or submitted work only. */
export type PassportCaseVerification={roleId:string;runId:string;activityId:string;releaseVersion:number;ruleVersion:number;equivalenceGroup:string;caseFingerprint:string;confidence:'medium';scope:'case';unseen:true;criteria:{id:string;label:string;score:number;weight:number;required:number;observations:{points:number;evidence:string;actionId:string}[]}[]};
export type PassportAchievement = {
  verification?:PassportCaseVerification;
  id: string;
  kind: "assessment" | "interview" | "training" | "roleplay";
  title: string;
  detail: string;
  at: string;
  state: "scored" | "completed" | "in_progress";
  score: number | null;
  /** Hidden by the candidate: left out of the showcase and of any shared copy. */
  hidden?: boolean;
};

/** The best of one kind, at the top of the Passport - pinned by the candidate, or suggested. */
export type PassportShowcaseItem = { kind: PassportAchievement["kind"]; pinned: boolean; item: PassportAchievement };
export type ShowcaseAction = "pin" | "unpin" | "hide" | "show";

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
  /** Scored sittings, missions, interviews and roleplays toward the role, newest first. */
  achievements?: PassportAchievement[];
  showcase?: PassportShowcaseItem[];
  summary: {
    completedModules: number;
    totalModules: number;
    assessedSkills: number;
    evidenceCount: number;
  };
  sharing: PassportSharing;
  limitations: string[];
};

export type ActivePassportShare = { token: string; expiresAt: string };
export type PassportSharing = {
  /** True once there is real evidence to show — an empty passport cannot be shared. */
  enabled: boolean;
  /** The one currently live share link, if any. */
  active: ActivePassportShare | null;
  /** How long a new link stays open. From the backend, never typed here. */
  lifetimeDays: number;
  reason: string;
};

export const getPassportOverview = (token: string) =>
  apiCall<{ overview: PassportOverview }>(token, "/v1/passport/overview");

/** Pin, unpin, hide or show one achievement. True when saved. */
export async function setPassportShowcase(token: string, body: { action: ShowcaseAction; kind: PassportAchievement["kind"]; id: string }): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/v1/passport/showcase`, {
      method: "PUT",
      cache: "no-store",
      headers: requestHeaders({ token, json: true }),
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type SharePassportResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; reason: string };

/**
 * Freezes the current overview and issues (or replaces) a revocable link.
 * Not apiCall: a refusal (no evidence yet) comes back with a specific reason
 * worth showing the candidate, not apiCall's generic null-on-failure.
 */
export async function sharePassport(token: string): Promise<SharePassportResult> {
  try {
    const res = await fetch(`${API_URL}/v1/passport/share`, {
      method: "POST",
      cache: "no-store",
      headers: requestHeaders({ token }),
    });
    const body = (await res.json().catch(() => null)) as
      | { ok: true; token: string; expiresAt: string }
      | { error: string }
      | null;
    if (res.ok && body && "ok" in body) return body;
    return { ok: false, reason: body && "error" in body ? body.error : "Could not share your passport right now. Try again in a moment." };
  } catch {
    return { ok: false, reason: "Could not reach the server. Try again in a moment." };
  }
}

/**
 * Not apiCall: a successful revoke returns 204 with no body, which apiCall's
 * JSON parse would read as a failure. The status code is the whole answer.
 */
export async function revokePassportShare(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/v1/passport/share`, {
      method: "DELETE",
      cache: "no-store",
      headers: requestHeaders({ token }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Public: what anyone holding a share link sees. No account, no token. */
export async function getSharedPassport(shareToken: string, viewerToken?: string): Promise<{ overview: PassportOverview } | null> {
  try {
    const res = await fetch(`${API_URL}/v1/passport/share/${encodeURIComponent(shareToken)}`, {
      cache: "no-store",
      headers: viewerToken ? requestHeaders({token:viewerToken}) : undefined,
    });
    if (!res.ok) return null;
    return (await res.json()) as { overview: PassportOverview };
  } catch {
    return null;
  }
}

export type RecipientShare={id:string;token:string;recipientEmail:string;createdAt:string;expiresAt:string;revokedAt:string|null;accesses:string[];outcomes?:{action:string;note:string;recordedAt:string}[]};
export const getRecipientShares=(token:string)=>apiCall<{shares:RecipientShare[]}>(token,'/v1/passport/recipients');
export const createRecipientShare=(token:string,email:string,days:number)=>apiCall<{ok:boolean;token:string;expiresAt:string}>(token,'/v1/passport/recipients',{method:'POST',body:{email,days,consent:true}});
export const revokeRecipientShare=(token:string,id:string)=>apiCall<{ok:boolean}>(token,`/v1/passport/recipients/${encodeURIComponent(id)}`,{method:'DELETE'});
export const recordRecipientOutcome=(token:string,shareToken:string,action:'shortlisted'|'interview'|'onboarding',note:string,evidenceId?:string)=>apiCall<{ok:boolean}>(token,'/v1/passport/recipient-outcomes',{method:'POST',body:{token:shareToken,action,note,evidenceId,consent:true}});
