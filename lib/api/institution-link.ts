// A student's own institution links (institution module, student-facing).
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

import { apiCall } from "./core";
import type { LinkStatus } from "./institution";

export type InstitutionLink = {
  id: string;
  userId: string;
  institutionId: string;
  institutionName: string;
  status: LinkStatus;
  requestedAt: string;
  respondedAt: string | null;
  revokedAt: string | null;
};

export const myInstitutionLinks = (token: string) =>
  apiCall<{ links: InstitutionLink[] }>(token, "/v1/me/institution-links");

export const acceptInstitutionLink = (token: string, linkId: string) =>
  apiCall<{ link: InstitutionLink }>(token, `/v1/me/institution-links/${linkId}/accept`, {
    method: "POST",
  });

export const declineInstitutionLink = (token: string, linkId: string) =>
  apiCall<{ link: InstitutionLink }>(token, `/v1/me/institution-links/${linkId}/decline`, {
    method: "POST",
  });

export const revokeInstitutionLink = (token: string, linkId: string) =>
  apiCall<{ revoked: true }>(token, `/v1/me/institution-links/${linkId}`, {
    method: "DELETE",
  });
