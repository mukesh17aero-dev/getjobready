// Outcome Router — where this person is in the journey.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Outcome Router (journey module) ----

import { API_URL, requestHeaders } from "./core";
import { readOnce } from "./core";
export type ResolvedRoute = { href: string; note: string | null };

export type JourneyRouteInfo = {
  id: string;
  title: string;
  need: string;
  output: string;
  // One concrete, checkable thing about how this works — enough to make
  // someone curious about the how, never a claim about other users.
  teaser?: string;
  // What actually happens, in three short lines.
  steps?: string[];
  time: string;
  price: string;
  landing: string;
  recommended?: boolean;
  resolved: ResolvedRoute;
};

export type JourneySelection = {
  route: string;
  selectedAt: string;
  resolved: ResolvedRoute;
};

// What this person has actually done, decided by the journey module so the
// screens never have to work it out from three separate fetches.
export type JourneyProgress = {
  told: number;
  // How complete each stage is, not merely whether it is finished. Optional
  // for the same reason `progress` itself is: an API one deploy behind.
  profile?: { filled: number; total: number };
  discovery?: { answered: number; done: boolean };
  // The role they are aiming at, with what it pays and where it leads.
  role?: {
    id: string;
    title: string;
    pitch: string;
    payMonthly: { min: number; max: number } | null;
    next: { title: string; when: string } | null;
    // The engine's own reason for putting them in this role, kept from the day
    // they finished the survey.
    why?: string | null;
  } | null;
  name: string | null;
  track: string | null;
  discoveryDone: boolean;
  selectedRole: string | null;
};

export type HomeWorkItem = {
  id: string;
  title: string;
  status: "in_progress" | "in_review" | "follow_up";
  reason: string;
  source: string;
  updatedAt: string;
  action: { label: string; href: string };
};

export type JourneyState = {
  routes: JourneyRouteInfo[];
  current: JourneySelection | null;
  /** Null/missing means unavailable, never an empty saved-work shelf. */
  work?: HomeWorkItem[] | null;
  // Optional on purpose: an API one deploy behind does not send this, and a
  // screen must degrade rather than break. Read it through progressOf().
  progress?: JourneyProgress;
};

/**
 * How long any one read of the API may take before it is called off.
 *
 * Every fetch in this file used to have none. A page is server-rendered, so an
 * API that accepts a connection and then goes quiet does not fail - it hangs,
 * the render never finishes, and the browser sits on a loading screen with no
 * error and no way forward. That is the "Discover and Start load forever"
 * report: not a slow API, an absent deadline.
 *
 * Ten seconds is long enough for a cold start on a sleeping instance and short
 * enough that somebody is told rather than left waiting.
 */

/**
 * The same idea for the calls that make something rather than read it.
 *
 * Generating a review or a resume is model work and can honestly take most of
 * a minute, so it gets its own, longer deadline - but it gets one.
 */

/**
 * One fetch, with a deadline and one retry.
 *
 * The retry exists for the same reason the upload has one: the API sleeps when
 * idle and the first request after that is often refused outright, which is
 * why a page loaded on one visit and not the next. Only connection-level
 * failures and 5xx are retried - a 404 is an answer.
 *
 * It returns the Response rather than the body so each caller keeps its own
 * reading of what a non-OK status means.
 */

export async function getJourneyState(
  token: string | null,
): Promise<JourneyState | null> {
  const res = await readOnce(`${API_URL}/v1/journey/routes`, {
    cache: "no-store",
    headers: requestHeaders({ token }),
  });
  if (!res?.ok) return null;
  try {
    return (await res.json()) as JourneyState;
  } catch {
    return null;
  }
}
