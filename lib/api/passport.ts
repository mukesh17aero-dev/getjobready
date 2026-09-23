// Career Passport.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Career Passport (passport module) ----
//
// Created when a role is chosen in Discovery; issued only when there is
// measured work in it. Pages are read from evidence rather than stored, so a
// page can never disagree with the work behind it.

import { apiCall } from "./core";
export type PassportLevel = "Emerging" | "Working" | "Strong";

export type PassportPage = {
  skill: string;
  level: PassportLevel;
  /** 0-100. Never shown without what it was measured on. */
  score: number;
  attained: string;
  issuedBy: string;
  evidence: string[];
  ref: string;
  /** One reading only. Marked on the face of the page. */
  provisional: boolean;
};

export type Passport = {
  number: string;
  roleId: string;
  roleTitle: string;
  createdAt: string;
  /** Null until Ascend seals it. The whole difference in the booklet. */
  issuedAt: string | null;
  pages: PassportPage[];
  blankPages: string[];
  issueRule: string;
  towardsIssue: string;
};

export const getPassport = (token: string) =>
  apiCall<{ passport: Passport | null }>(token, "/v1/passport");
