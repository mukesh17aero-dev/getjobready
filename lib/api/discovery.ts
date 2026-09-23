// Discovery: roles, attempts, and the personal read-out of a role.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Discovery (discovery module) ----

import { API_URL, requestHeaders } from "./core";
import { generateCall, readOnce } from "./core";
/**
 * The depth behind a role, written per role by us. None of it can be inferred
 * from a job description, which is exactly the point: a tour built only on the
 * posting has nothing to say that the posting does not.
 *
 * Every field is optional because the backend sends none of them yet. What is
 * present is said; what is absent is admitted. See tourBriefing() in
 * components/discovery-assistant.tsx.
 */
export type RoleKnowledge = {
  /** What separates competent from good, at the points people are judged. */
  standards?: Array<{ when: string; looksLike: string }>;
  /** The tools someone will actually be handed, named. */
  tools?: string[];
  /** Where the sector is heading, including the parts that are shrinking. */
  industry?: Array<{ heading: string; detail: string }>;
  /** Moves sideways and out - what the experience is worth elsewhere. */
  transfers?: string[];
  /** What this role does not lead to. The assistant must be able to disappoint. */
  ceilings?: string[];
  /** What a given responsibility is really like, keyed by its exact text. */
  behind?: Record<string, string>;
  /** Why the job matters where it sits - what breaks without it. */
  importance?: string;
  /** The kinds of work this role opens up inside its industry. */
  opportunities?: string[];
  /** What the people who do well actually do. Not testimonials, not pay. */
  succeed?: string[];
  /** The few things that decide who moves up, and why each one. */
  skillsThatMatter?: Array<{ name: string; why: string }>;
  /** How hiring for it actually runs, and what each stage is really testing. */
  interview?: { stages: string[]; judgedOn: string[] };
  /** How the work is changing now that AI does part of it. */
  withAI?: string;
  /**
   * Sample text written to show the shape rather than researched. Rendered
   * with a banner saying so.
   */
  illustrative?: boolean;
};

export type RoleDetail = {
  roleId: string;
  sector: string;
  pitch: string;
  description: string;
  workMix: Array<{ label: string; share: number; detail: string }>;
  responsibilities: string[];
  skills: Array<{ name: string; why: string }>;
  workContext: {
    environment: string;
    hours: string;
    pace: string;
    team: string;
  };
  payMonthly: { min: number; max: number };
  payNote: string;
  growth: Array<{
    title: string;
    when: string;
    pay: { min: number; max: number };
  }>;
  hardTruths: string[];
  suitsYouIf: string[];
  voices: Array<{
    name: string;
    title: string;
    journey: string;
    quote: string;
  }>;
  voicesIllustrative: boolean;
  /**
   * Anything else known about this role, written by whoever publishes it.
   * Not a section of the role page - it is what the discovery assistant draws
   * on when somebody asks something the fields above do not answer.
   */
  assistantNotes?: string;
  /**
   * The five questions a student has that no section above answers, because
   * those describe the job and these describe the path into it. All optional
   * and all published content - a field nobody has written stays off the
   * screen rather than being filled in by this repo.
   */
  studentQuestions?: {
    entry?: string;
    where?: string;
    transfers?: string;
    changing?: string;
    seen?: string;
  };
  /** The same title is a different job in different industries. */
  acrossIndustries?: Array<{ industry: string; difference: string }>;
  /** The written depth. Absent today - see RoleKnowledge. */
  knowledge?: RoleKnowledge;
};

/**
 * The written introduction to an industry, for somebody who has never heard of
 * it. Optional, and absent today: it is prose about the real world - how the
 * sector got here, where it is going - which means it has to be written and
 * checked by a person with sources, not inferred by a screen. Until the
 * backend sends it, the industry dialog says what it can prove from the roles
 * and says plainly what it does not have. See components/industry-brief.tsx.
 */
export type IndustryBrief = {
  /** What the work in this industry actually is, in plain sentences. */
  what: string;
  /** How it got to be the way it is. */
  changed: string;
  /** Where it appears to be heading, including the parts that are shrinking. */
  heading: string;
  /** What that means for somebody starting out in it now. */
  starting: string;
  /** Where the claims above come from. Required if the brief makes any. */
  sources?: string[];
  /**
   * Sample text, written to show the shape rather than researched. Rendered
   * with a banner saying so - the same treatment RoleDetail.voicesIllustrative
   * gets, and for the same reason: unattributed prose about somebody's industry
   * must never be able to pass for fact.
   */
  illustrative?: boolean;
};

export type DiscoveryContent = {
  version: string;
  worlds: Array<{
    id: string;
    title: string;
    caption: string;
    brief?: IndustryBrief;
  }>;
  // Every role, so a student can browse beyond their own matches.
  catalogue: Array<{
    id: string;
    title: string;
    world: string;
    summary: string;
  }>;
  roles: RoleDetail[];
};

export type AttemptSignals = {
  answersQuickly: boolean;
  changedAnswers: number;
  skippedOptional: boolean;
  rereadOptions: number;
};

export type DiscoveryMatch = {
  roleId: string;
  title: string;
  world: string;
  summary: string;
  score: number;
  band: "strong" | "adjacent" | "stretch";
  why: string[];
  uncertainty: string | null;
};

export type DiscoveryAttempt = {
  id: string;
  contentVersion: string;
  status: "in_progress" | "completed";
  matches: {
    matches: DiscoveryMatch[];
    coverage: number;
    /**
     * Whether any of this has earned the word "recommended". The matches are
     * always returned - they order the roles somebody browses, which is useful
     * long before it is a recommendation - and this says whether a screen may
     * present them AS one.
     *
     * Optional because an API one deploy behind does not send it; absent is
     * read as "not yet", which is the safe direction.
     */
    enough?: boolean;
  } | null;
  selectedRole: string | null;
};

export type DiscoveryState = {
  content: DiscoveryContent;
  attempt: DiscoveryAttempt | null;
};

// Token is optional here where it is required elsewhere, because GET
// /v1/discovery serves the role catalogue to anybody. Sending no bearer is a
// normal request, not a degraded one.
/**
 * An admin generate call that never returns null.
 *
 * apiCall collapses every failure - a 400, a 401, a 503 with no API key, a
 * 502 from the provider, a dropped connection - into null, and the console
 * then had to guess, which it did as "Could not reach the writer". That
 * sentence was wrong for most of the cases it appeared in and told nobody
 * what to do. These endpoints already answer with {ok:false, reason} for
 * content problems, so HTTP problems are reported the same way and every
 * caller keeps one branch.
 */

async function discoveryCall<T>(
  token: string | null,
  path: string,
  init?: { method?: string; body?: unknown; idempotencyKey?: string },
): Promise<T | null> {
  const res = await readOnce(`${API_URL}${path}`, {
    method: init?.method ?? "GET",
    cache: "no-store",
    headers: requestHeaders({
      token,
      json: init?.body !== undefined,
      idempotencyKey: init?.idempotencyKey,
    }),
    ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  if (!res?.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getDiscovery = (token: string | null) =>
  discoveryCall<DiscoveryState>(token, "/v1/discovery");

export const startDiscoveryAttempt = (token: string, fresh = false) =>
  discoveryCall<DiscoveryAttempt>(token, "/v1/discovery/attempts", {
    method: "POST",
    body: { fresh },
  });

export const completeDiscoveryAttempt = (token: string) =>
  discoveryCall<DiscoveryAttempt>(
    token,
    "/v1/discovery/attempts/current/complete",
    {
      method: "POST",
      body: {},
    },
  );

export const selectDiscoveryRole = (
  token: string,
  roleId: string,
  idempotencyKey: string,
) =>
  discoveryCall<DiscoveryAttempt>(
    token,
    "/v1/discovery/attempts/current/select-role",
    { method: "POST", body: { roleId }, idempotencyKey },
  );

// The adaptive question bank used to live here: a ten-ish question run that
// produced the matches. Discovery does not ask questions any more - it opens
// an industry, shows every role in it and walks a few of them - so the client
// for /v1/discovery/adaptive is gone. The endpoints still exist on the API;
// nothing in this app calls them.

// ---- The personal read-out of a role ----
//
// It used to be fetched: a written explanation of why a matched role suited
// somebody, produced from their survey answers. The survey is gone, so there
// are no answers to write it from and /v1/discovery/brief went with them.
// The shape stays because it is the shape the sample read-out in lib/samples
// is written in, and the landing pages still render one - clearly labelled as
// an example rather than anybody's result.

export type BriefPoint = { point: string; basedOn: string[] };
export type BriefStep = { title: string; how: string; basedOn: string[] };

export type RoleBrief = {
  roleId: string;
  // Why this work suits them, grounded in what they chose.
  fit: BriefPoint[];
  // How to become good at it quickly.
  excel: BriefStep[];
  // What will be hard, and what to do about it.
  watch: BriefStep[];
};

/**
 * "Why this role fits you", written from what this person did in Discovery.
 * The server writes it only for a role the ranking recommends or the person
 * chose; otherwise `ok: false` says why not.
 */
export const getWhyRoleFits = (token: string, roleId: string) =>
  generateCall<{ ok: true; brief: RoleBrief }>(token, `/v1/discovery/why/${roleId}`, {});
