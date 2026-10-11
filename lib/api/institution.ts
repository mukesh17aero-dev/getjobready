// College Cohort Portal (institution module, college-facing).
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

import { API_URL, apiCall, requestHeaders } from "./core";

export type LinkStatus = "pending" | "active" | "revoked" | "declined";

export type RosterEntry = {
  linkId: string;
  userId: string;
  email: string;
  status: LinkStatus;
  requestedAt: string;
  respondedAt: string | null;
};

export type RequestLinkResult = {
  email: string;
  result: "requested" | "no_account" | "already_linked";
};

export type SkillAggregate = {
  id: string;
  name: string;
  averageScore: number;
  studentsAssessed: number;
};

export type FunnelStat = { label: string; count: number; total: number };

export type CohortOverview = {
  verificationFunnel?:{minimum:number;counts:Record<string,number|null>;useRate:number|null};
  recipientOutcomes?: {minimum:number;counts:Record<string,number|null>};
  totalConsented: number;
  funnel: FunnelStat[];
  skills: SkillAggregate[];
};

export const collegeAccess = (token: string) =>
  apiCall<{ isMember: boolean }>(token, "/v1/institution/access");

export const cohortRoster = (token: string) =>
  apiCall<{ roster: RosterEntry[] }>(token, "/v1/institution/roster");

export const cohortOverview = (token: string) =>
  apiCall<CohortOverview>(token, "/v1/institution/cohort-overview");

export const inviteStudents = (token: string, emails: string[]) =>
  apiCall<{ results: RequestLinkResult[] }>(token, "/v1/institution/students", {
    method: "POST",
    body: { emails },
  });

export const revokeStudentLink = (token: string, linkId: string) =>
  apiCall<{ revoked: true }>(token, `/v1/institution/students/${linkId}`, {
    method: "DELETE",
  });

// Operator-only: onboarding a college. Unlike the reads above these report why
// they failed, because "no account exists with that email yet" is the answer
// the operator needs, not a generic retry.
export type AdminInstitution = { id: string; name: string };
export type AdminResult<T> = { ok: true; data: T } | { ok: false; reason: string };

async function adminCall<T>(token: string, path: string, body?: unknown): Promise<AdminResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/admin/institutions${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: requestHeaders({ token, json: body !== undefined }),
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, reason: "Could not reach the server. Check your connection and try again." };
  }
  const json = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !json) {
    return { ok: false, reason: res.status === 403 ? "Only admins can do this." : res.status === 401 ? "Sign in again." : json?.error && json.error !== "unavailable" && json.error !== "invalid request" ? json.error : "That did not work. Check the details and try again." };
  }
  return { ok: true, data: json };
}

export const adminInstitutions = (token: string) => adminCall<{ institutions: AdminInstitution[] }>(token, "");
export const adminCreateInstitution = (token: string, name: string) => adminCall<{ institution: AdminInstitution }>(token, "", { name });
export const adminGrantInstitutionMember = (token: string, institutionId: string, email: string) =>
  adminCall<{ member: unknown }>(token, `/${institutionId}/members`, { email });
