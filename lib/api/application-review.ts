// The AI-guided application review: how a hiring manager would read the
// application for the chosen role. Guidance, not a prediction.

import { API_URL, apiCall, GENERATE_TIMEOUT_MS, requestHeaders } from "./core";

export type ReviewPlanTool = "readiness" | "missions" | "interview" | "roleplay" | "resume" | "linkedin" | "stories";
export type ApplicationReview = {
  firstImpression: string;
  standsOut: Array<{ point: string; evidence: string[] }>;
  pause: Array<{ point: string; evidence: string[] }>;
  questions: string[];
  plan: Array<{ step: string; tool: ReviewPlanTool }>;
};
export type SavedApplicationReview = { review: ApplicationReview; roleTitle: string; createdAt: string };
export type ApplicationReviewStatus =
  | { state: "no_role" }
  | { state: "locked"; roleTitle: string; missing: string[] }
  | { state: "ready"; roleTitle: string; saved: SavedApplicationReview | null; canWrite: boolean; why: string | null };

export const getApplicationReview = async (token: string) =>
  (await apiCall<{ status: ApplicationReviewStatus }>(token, "/v1/application-review"))?.status ?? null;

export type WriteReviewResult = { ok: true; saved: SavedApplicationReview } | { ok: false; reason: string };

/** Ask for a new review. A refusal carries the server's own reason. */
export async function writeApplicationReview(token: string): Promise<WriteReviewResult> {
  try {
    const res = await fetch(`${API_URL}/v1/application-review`, {
      method: "POST",
      cache: "no-store",
      headers: requestHeaders({ token }),
      signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => null)) as { saved?: SavedApplicationReview; error?: string } | null;
    if (res.ok && body?.saved) return { ok: true, saved: body.saved };
    if (res.status === 503) return { ok: false, reason: "Ascend's AI is unavailable right now. Your work is all saved - try again later." };
    return { ok: false, reason: body?.error ?? "We could not write your review just now. Try again in a moment." };
  } catch {
    return { ok: false, reason: "That took too long or the connection dropped. Try again in a moment." };
  }
}
