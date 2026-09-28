// College Cohort Portal (institution module, college-facing).
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

import { apiCall } from "./core";

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
