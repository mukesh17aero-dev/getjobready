// Opportunities (employer module).
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Opportunities ----
//
// Real, live job listings, read from the NewEra job portal - a separate
// product. Ascend never stores these; every read reflects what NewEra
// actually has open right now. Public: no personal record is involved yet,
// so no token is needed.

import { API_URL, requestHeaders } from "./core";

export type Opportunity = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  openings: number;
  salary: string;
  description: string;
  requirements: string;
  skills: string;
  experience: string;
  experienceBands?: Array<"0-1" | "1-3">;
  shift: string;
  languages: string;
  publishedAt: string | null;
  lastCheckedAt?: string;
  applyUrl: string;
};

export type OpportunitiesStatus = "fetched" | "not_configured" | "unavailable";

export async function getOpportunities(): Promise<{ opportunities: Opportunity[]; status: OpportunitiesStatus } | null> {
  try {
    const res = await fetch(`${API_URL}/v1/opportunities`, {
      cache: "no-store",
      headers: requestHeaders({}),
    });
    if (!res.ok) return null;
    return (await res.json()) as { opportunities: Opportunity[]; status: OpportunitiesStatus };
  } catch {
    return null;
  }
}
