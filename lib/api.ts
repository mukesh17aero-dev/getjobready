import type { AnswerSignals } from "./integrity-signals";
import { API_URL, API_URL_LABEL } from "./api-base";

// Re-exported so the many modules that already import it from here are
// unaffected; lib/api-base.ts explains why it is not simply the env var.
export { API_URL };

// Request correlation: every call carries an id the API adopts, logs and
// stamps onto the rows it writes, so one user action can be traced across
// frontend, API, database and AI calls.
export function newRequestId(): string {
  return crypto.randomUUID();
}

export function requestHeaders(options: {
  token?: string | null;
  json?: boolean;
  idempotencyKey?: string;
  requestId?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Request-Id": options.requestId ?? newRequestId(),
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.json) headers["Content-Type"] = "application/json";
  if (options.idempotencyKey)
    headers["Idempotency-Key"] = options.idempotencyKey;
  return headers;
}

// ---- Outcome Router (journey module) ----

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
const READ_TIMEOUT_MS = 10_000;

/**
 * The same idea for the calls that make something rather than read it.
 *
 * Generating a review or a resume is model work and can honestly take most of
 * a minute, so it gets its own, longer deadline - but it gets one.
 */
const GENERATE_TIMEOUT_MS = 90_000;

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
async function readOnce(
  url: string,
  init: RequestInit,
): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), READ_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: abort.signal });
      if (res.ok || res.status < 500) return res;
    } catch {
      // Timed out, refused, or the connection dropped. Worth one more go.
    } finally {
      clearTimeout(timer);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
  }
  return null;
}

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

// ---- Discovery (discovery module) ----

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

async function apiCall<T>(
  token: string,
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
async function generateCall<T extends { ok: boolean }>(
  token: string,
  path: string,
  body: unknown,
): Promise<T | { ok: false; reason: string }> {
  // A deadline, like every other read in this file.
  //
  // This was the one fetch with none, and it is the one behind the longest
  // waits in the product - a page that opens a stored result sits on
  // "opening your results" forever if the connection is accepted and then
  // goes quiet. Ninety seconds is long enough for a genuine generation on a
  // cold instance and short enough that somebody is told rather than left.
  let res: Response;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), GENERATE_TIMEOUT_MS);
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: requestHeaders({ token, json: true }),
      body: JSON.stringify(body),
      signal: abort.signal,
    });
  } catch {
    return {
      ok: false,
      reason: abort.signal.aborted
        ? "That took too long to come back. Reload the page and it will pick up where it left off."
        : `Could not reach the server at ${API_URL_LABEL}. Check the backend is running.`,
    };
  } finally {
    clearTimeout(timer);
  }

  if (res.ok) return (await res.json()) as T;

  // The server's own words where it gave any; its status where it did not.
  const said = await res
    .json()
    .then((d: { error?: string }) => d?.error ?? "")
    .catch(() => "");

  const reason =
    res.status === 401 || res.status === 403
      ? "Your session expired, or this account is not an admin. Reload and sign in again."
      : res.status === 404
        ? `The server has no route at ${path}. It is probably running an older build - restart the backend.`
        : res.status === 400
          ? `The server rejected the request${said ? `: ${said}` : ""}. This usually means a field on the role is empty or longer than the endpoint allows.`
          : res.status === 503
            ? said || "No AI key is configured on the server."
            : said || `The server answered ${res.status}.`;
  return { ok: false, reason };
}

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

// ---- Interview Story Bank (story-bank module) ----
//
// A story is what somebody can actually say in an interview. Two fields carry
// the design and both come from the server: `evidence.proof` says whether it
// rests on something they were shown doing or on their own account, and
// `spokenAt` is null until they have told it out loud. A drafted story nobody
// has said is a script, and the UI marks it as one.

export type StarPart = "situation" | "task" | "action" | "result";
export type Star = Partial<Record<StarPart, string>>;

export type StoryEvidence = {
  kind: "simulation" | "interview" | "passport" | "resume" | "told";
  label: string;
  ref?: string | null;
  proof: boolean;
};

export type Story = {
  id: string;
  title: string;
  competency: string;
  star: Star;
  evidence: StoryEvidence;
  roles: string[];
  answers: string[];
  spokenAt: string | null;
  updatedAt: string;
};

export type StoryStrength = "proven" | "usable" | "draft";

/** Mirrors strength() in the backend module - one rule, stated in both places. */
export const storyStrength = (s: Story): StoryStrength =>
  !s.spokenAt ? "draft" : s.evidence.proof ? "proven" : "usable";

export type PracticeQuestion = {
  id: string;
  q: string;
  round: "hr" | "managerial";
  competency: string;
  testing: string;
  roles: string[];
  /** Stories of theirs that answer it. Empty means nothing to say yet. */
  storyIds: string[];
};

export type StoryCoverage = {
  competency: string;
  best: StoryStrength | null;
  storyIds: string[];
  questions: number;
};

export type StoryBank = {
  stories: Story[];
  competencies: string[];
  coverage: StoryCoverage[];
  questions: PracticeQuestion[];
  roleId: string | null;
};

/** A draft, or a plain refusal. Both are real answers about their record. */
export type StoryDraft =
  | {
      questionId: string;
      ok: true;
      draft: {
        title: string;
        star: Star;
        evidence: StoryEvidence;
        missing: StarPart[];
      };
    }
  | { questionId: string; ok: false; reason: string; suggest: string };

/**
 * The question library on its own, served to anybody.
 *
 * Reading what an interview asks is reading, and reading is free. Nothing in
 * this response is personal - it is the same list for everyone - so it takes
 * no token and needs no account.
 */
export type QuestionState = "weak" | "solid" | "unattempted";

/** A question as the library shows it: what it is, and where you stand on it. */
export type LibraryQuestion = Omit<PracticeQuestion, "storyIds"> & {
  state: QuestionState;
  attempts: number;
  /** The one note from the last attempt. Null when there was nothing to say. */
  note: string | null;
  hasStory: boolean;
};

export type QuestionLibrary = {
  questions: LibraryQuestion[];
  total: number;
  competencies: string[];
  signedIn: boolean;
};

/** One attempt at a question, and the single note that came back. */
export type PracticeAttempt = {
  id: string;
  questionId: string;
  answer: string;
  answeredVia: "text" | "voice";
  note: string | null;
  heldUp: boolean | null;
  createdAt: string;
};

export async function getPracticeQuestions(
  token?: string | null,
): Promise<QuestionLibrary | null> {
  try {
    const res = await fetch(`${API_URL}/v1/practice-questions`, {
      cache: "no-store",
      headers: requestHeaders({ token }),
    });
    if (!res.ok) return null;
    return (await res.json()) as QuestionLibrary;
  } catch {
    return null;
  }
}

export const answerPracticeQuestion = (
  token: string,
  id: string,
  answer: string,
) =>
  apiCall<PracticeAttempt>(token, `/v1/practice-questions/${id}/answer`, {
    method: "POST",
    body: { answer, via: "text" },
  });

export const getStoryBank = (token: string) =>
  apiCall<StoryBank>(token, "/v1/stories");

export const draftStory = (token: string, questionId: string) =>
  apiCall<StoryDraft>(token, "/v1/stories/draft", {
    method: "POST",
    body: { questionId },
  });

export const saveStory = (
  token: string,
  body: {
    title: string;
    competency: string;
    star: Star;
    evidence: StoryEvidence;
    answers?: string[];
    /** Only true when they have just told it. Never set on their behalf. */
    spoken?: boolean;
  },
) => apiCall<Story>(token, "/v1/stories", { method: "POST", body });

export const patchStory = (
  token: string,
  id: string,
  body: { title?: string; star?: Star; competency?: string; spoken?: true },
) => apiCall<Story>(token, `/v1/stories/${id}`, { method: "PATCH", body });

// ---- Job fit (job-fit module) ----
//
// One posting, checked against what this person has actually done. The
// readiness figure is arithmetic over the requirement marks, computed on the
// server - it is never a model's opinion, and it is readiness against this
// posting rather than any kind of chance of being hired.

export type ReqState = "proof" | "claim" | "gap";

export type FitRequirement = {
  need: string;
  state: ReqState;
  from: string;
  note: string;
};

export type FitAxis = {
  label: string;
  you: number;
  need: number;
  /** The rows behind the number, in words. */
  basis: string;
};

/** The only next steps that exist. Each maps to a route in the app. */
export type NextAction = "practice-question" | "story" | "interview" | "record";

export type JobFitCheck = {
  id: string;
  roleTitle: string;
  /** False when the posting is outside what this product prepares for. */
  inScope: boolean;
  nextAction: NextAction | null;
  requirements: FitRequirement[];
  axes: FitAxis[];
  readiness: number;
  verdict: string;
  nextStep: string | null;
  createdAt: string;
};

export type JobFitState = { checks: JobFitCheck[]; axes: FitAxis[] };

/** Either a finished check, or a plain reason the posting could not be read. */
export type JobFitResult =
  { ok: true; check: JobFitCheck } | { ok: false; reason: string };

// ---- The skill check attached to one posting ----
//
// The same readiness questions an admin published, chosen by the skill they
// measure, for the skills this posting asks for. Nothing is authored on the
// fly; what comes back is a situation, the workplace it belongs to and the
// skill it is about.

export type SkillCheckQuestion = {
  id: string;
  skill: string;
  /** The line from the posting that sent us here. */
  need: string;
  workplace: string;
  buddy: string;
  title: string;
  brief: string;
  minutes: number;
};

export type SkillMark = { skill: string; score: number; why: string };

export type SkillCheckReview = {
  marks: SkillMark[];
  perQuestion: Array<{ id: string; did: string; better: string }>;
  strengths: string[];
  workOn: string[];
  summary: string;
  confidence: "low" | "medium";
  basis: { answered: number; asked: number };
};

export type SkillCheck = {
  skills: Array<{ skill: string; need: string }>;
  questions: SkillCheckQuestion[];
  answers: Record<string, string>;
  review: SkillCheckReview | null;
  startedAt: string;
  reviewedAt: string | null;
};

export type SkillCheckResult =
  | { ok: true; check: SkillCheck }
  | { ok: false; reason: string };

export const getSkillCheck = (token: string, checkId: string) =>
  apiCall<SkillCheckResult>(token, `/v1/job-fit/${checkId}/skill-check`);

export const saveSkillCheckAnswer = (
  token: string,
  checkId: string,
  questionId: string,
  response: string,
) =>
  apiCall<{ ok: true; answered: number }>(
    token,
    `/v1/job-fit/${checkId}/skill-check/answer`,
    { method: "PUT", body: { questionId, response } },
  );

export const reviewSkillCheck = (token: string, checkId: string) =>
  apiCall<
    { ok: true; review: SkillCheckReview; fresh: boolean } | { ok: false; reason: string }
  >(token, `/v1/job-fit/${checkId}/skill-check/review`, { method: "POST", body: {} });

export const getJobFit = (token: string) =>
  apiCall<JobFitState>(token, "/v1/job-fit");

export const checkJobFit = (token: string, posting: string) =>
  apiCall<JobFitResult>(token, "/v1/job-fit", {
    method: "POST",
    body: { posting },
  });

// ---- Professional profile (profile-builder module) ----
//
// Two halves kept apart on purpose: `suggested` is what Ascend wrote, and
// `accepted` is what this person read and kept. Only the second half is ever
// presented back as their profile, and only they move a section across.

export type ProfileSectionId =
  "photo" | "headline" | "about" | "experience" | "skills" | "openTo";

/** One project, internship or job as it would read on the profile. */
export type ProfileEntry = {
  title: string;
  organisation: string;
  bullets: string[];
};

export type ProfileVoice = "formal" | "genz";

/** What a recruiter's search, then the recruiter, will see - counted by the backend. */
export type ProfileCheckItem = {
  id: string;
  label: string;
  status: "pass" | "fix" | "info";
  detail: string;
  /** An instruction Scribe can follow on its own. */
  fix?: string;
  /** A question only the person can answer - their fact, their claim. */
  ask?: string;
  /** When the answer belongs in their record rather than in the draft. */
  link?: { href: string; label: string };
};
export type ProfileChecklist = { items: ProfileCheckItem[]; passed: number; counted: number };

export type ProfileDraft = {
  /** Which of the two the writer decided this person is. */
  audience?: "student" | "professional";
  /** How it was asked to sound. */
  voice?: ProfileVoice;
  /** Uploaded by them. The writer never touches this. */
  photo?: string;
  headline?: string;
  /** Three angles on the same person. They pick; we never pick for them. */
  headlineOptions?: string[];
  about?: string;
  experience?: ProfileEntry[];
  skills?: string[];
  openTo?: string;
};

export type ProfileState = {
  suggested: ProfileDraft;
  accepted: ProfileDraft;
  /** The one sentence the rest was written from. */
  identity: string | null;
  identityAgreed: boolean;
  updatedAt: string | null;
  /** Their own name, for the preview. Null when the record has none. */
  name?: string | null;
  targetRole?: string | null;
  /** How much the writer had to work with. An empty profile is an empty record. */
  sourceCount?: number;
  provenCount?: number;
  /** The recruiter-search read of whatever is being worked on. */
  checklist?: ProfileChecklist;
};

export type ProfileWriteResult =
  ({ ok: true } & ProfileState) | { ok: false; reason: string };

export const getProfessionalProfile = (token: string) =>
  apiCall<ProfileState>(token, "/v1/professional-profile");

export const writeProfessionalProfile = (token: string, voice: ProfileVoice = "formal") =>
  apiCall<ProfileWriteResult>(token, "/v1/professional-profile/write", {
    method: "POST",
    body: { voice },
  });

/** One turn of Scribe: what changed, what it refused, what it took on trust. */
export type ProfileRevision = {
  draft: ProfileDraft;
  changed: string[];
  /** Facts that arrived through your instruction. Reported, never absorbed. */
  added: string[];
  declined: string | null;
  reply: string;
  followUp: string | null;
  didChange: boolean;
};

export type ProfileReviseResult =
  | ({ ok: true; revision: ProfileRevision } & ProfileState)
  | { ok: false; reason: string };

export const reviseProfessionalProfile = (
  token: string,
  ask: string,
  /**
   * The turns so far, oldest first. Without it a reply to Scribe's own
   * question arrives as a fresh instruction, and it asks the same thing
   * again - which is a loop, not caution.
   */
  history: Array<{ ask: string; reply: string; followUp: string | null }> = [],
  /** Switch the voice with this revision; otherwise the draft's own stands. */
  voice?: ProfileVoice,
) =>
  apiCall<ProfileReviseResult>(token, "/v1/professional-profile/revise", {
    method: "POST",
    body: { ask, history: history.slice(-4), ...(voice ? { voice } : {}) },
  });

export const acceptProfileSection = (
  token: string,
  section: ProfileSectionId,
  value: string | string[] | ProfileEntry[],
) =>
  apiCall<ProfileState>(token, "/v1/professional-profile/accept", {
    method: "POST",
    body: { section, value },
  });

/** Importing an existing LinkedIn PDF, and the photo. Both are multipart. */
export type ProfileImportResult =
  | ({ ok: true; imported: ProfileDraft } & ProfileState)
  | { ok: false; reason: string };

async function postFile<T>(
  token: string,
  path: string,
  file: File | Blob,
  filename: string,
): Promise<T | { error: string } | null> {
  try {
    const body = new FormData();
    body.append("file", file, filename);
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: requestHeaders({ token }),
      body,
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "That did not work. Try again in a moment.";
      return { error: message };
    }
    return data as T;
  } catch {
    return null;
  }
}

export const importLinkedInPdf = (token: string, file: File) =>
  postFile<ProfileImportResult>(
    token,
    "/v1/professional-profile/import",
    file,
    file.name,
  );

export const uploadProfilePhoto = (token: string, blob: Blob) =>
  postFile<{ ok: true; photo: string } & ProfileState>(
    token,
    "/v1/professional-profile/photo",
    blob,
    "photo.jpg",
  );

export const agreeProfileIdentity = (token: string) =>
  apiCall<ProfileState>(token, "/v1/professional-profile/identity", {
    method: "POST",
    body: {},
  });

// ---- Career Passport (passport module) ----
//
// Created when a role is chosen in Discovery; issued only when there is
// measured work in it. Pages are read from evidence rather than stored, so a
// page can never disagree with the work behind it.

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

// ---- Assessment arcs (admin, assessment-arc module) ----
//
// The first thirty days, per role. Two prompts: the built-in one is the
// product's opinion about what an assessment is and is read-only; the optional
// one is the admin's and is subordinate to it.

export type ArcSupport = "both" | "assistant" | "buddy" | "none";
export type ArcAnswer = "typed" | "spoken" | "artefact";

export type SceneInteraction =
  | { kind: "routing"; choices: Array<{ id: string; label: string; detail?: string }>; messageLabel: string }
  | { kind: "prioritisation"; items: Array<{ id: string; label: string; detail?: string }>; reasonLabel: string }
  | { kind: "handover"; fields: Array<{ id: string; label: string; options?: string[]; required?: boolean }> };

export type InteractionResponse =
  | { kind: "routing"; choiceId: string; message: string }
  | { kind: "prioritisation"; orderedIds: string[]; reason: string }
  | { kind: "handover"; values: Record<string, string> };

export type AssessmentAnswerDraft = {
  integrity?: AnswerSignals;
  sceneId: string;
  response: string;
  answeredVia?: ArcAnswer;
  seconds?: number;
  askedAssistantAtSeconds?: number;
  askedBuddyAtSeconds?: number;
  helpLog?: { assistant?: AssistTurn[]; buddy?: AssistTurn[] };
  interactionResponse?: InteractionResponse;
};

export type ArcScene = {
  interaction?: SceneInteraction;
  id: string;
  day: string;
  title: string;
  brief: string;
  minutes: number;
  support: ArcSupport;
  answer: ArcAnswer;
  fields: string[];
  measures: string[];
  /** Admin-only checks for the answer; separate from role skill mappings. */
  criteria?: string[];
  easier?: string;
  harder?: string;
  /** Which workplace this scene belongs to. A sitting is served from one. */
  team?: string;
  /** Whether this scene is worth drawing. Most are not. */
  needsImage?: boolean;
  /** What to draw, in a picture's terms rather than the task's. */
  imageBrief?: string;
  /** Set when this scene repeats an earlier one, harder. */
  repeatsSceneId?: string;
  /**
   * A picture of the situation, in our own bucket. Drawn only when an admin
   * asks. Most scenes do not need one - a picture earns its place when the
   * work is visual and is noise when it is not.
   */
  image?: string;
};

/** One workplace the role can be done in. A sitting happens in exactly one. */
export type ArcTeam = {
  id: string;
  industry: string;
  company: string;
  buddy: string;
};

export type AssessmentArc = {
  roleId: string;
  roleTitle: string;
  /** Absent on arcs published before teams existed. */
  teams?: ArcTeam[];
  company: string;
  buddy: string;
  scenes: ArcScene[];
  skills: string[];
};

export type ArcBank = { arcs: AssessmentArc[] };

export type ArcGenerateResult =
  | { ok: true; arc: AssessmentArc; warnings: string[] }
  | { ok: false; reason: string };

// ---- Sitting the readiness assessment (assessment-run module) ----
//
// A scene as the person sitting it sees it. `measures` and the easier/harder
// variants are deliberately absent: telling somebody what is being looked for
// is the fastest way to measure the wrong thing.

export type StudentScene = {
  interaction?: SceneInteraction;
  id: string;
  day: string;
  title: string;
  brief: string;
  minutes: number;
  support: ArcSupport;
  answer: ArcAnswer;
  fields: string[];
  image?: string;
};

export type RunState = {
  serverNow?: string;
  begunAt?: string | null;
  deadlineAt?: string | null;
  timeLimitSeconds?: number;
  questionLimit?: number | null;
  draft?: AssessmentAnswerDraft | null;
  runId: string;
  roleId: string;
  company: string;
  buddy: string;
  /**
   * The scene to do now, or null when the sitting is finished.
   *
   * One at a time, not a list: the next scene is chosen from how this one
   * went, so there is no plan for the client to hold.
   */
  scene: StudentScene | null;
  answered: number;
  estimatedRemaining: number;
  startedAt: string;
  finishedAt: string | null;
};

/** The acknowledgement of an answer carries the next scene with it. */
export type AnswerAccepted = {
  recorded: boolean;
  expired?: boolean;
  scene: StudentScene | null;
  answered: number;
  remaining: number;
};

/**
 * What a finished sitting shows. Counts of evidence, never marks: one sitting
 * cannot establish proficiency, so nothing here is a score.
 */
export type Readout = {
  runId: string;
  roleId: string;
  finishedAt: string | null;
  scenesAttempted: number;
  scenesInSitting: number;
  minutesSpent: number;
  skills: Array<{ skill: string; attempted: number; inSitting: number }>;
  reachedFor: Array<{
    sceneTitle: string;
    assistantAtSeconds: number | null;
    buddyAtSeconds: number | null;
  }>;
  repeated: Array<{ sceneTitle: string; attempts: number }>;
};

/**
 * A read of what somebody wrote, with scores.
 *
 * `basis` and `confidence` travel with the numbers on purpose: a readiness
 * score from a sitting where half the scenes went unattempted is not the same
 * object as one where they all did, and only these say which. Never render a
 * score without them.
 */
export type AssessmentReview = {
  scenes: Array<{
    sceneId: string;
    did: string;
    better: string;
    attempted: boolean;
  }>;
  skillScores: Array<{ skill: string; score: number; why: string }>;
  /**
   * How they worked with the AI assistant, scored on the same 0-100 scale.
   *
   * Null when the assistant was offered on fewer than two situations they
   * attempted - a reading of AI judgement from one scene is not a reading.
   * It scores the judgement, not the amount of use: not asking at all is a
   * real gap, and sending back the assistant's own words is the worst of the
   * patterns, because the judgement never happened.
   */
  usingAI: { score: number; why: string } | null;
  readiness: { score: number; why: string };
  confidence: "low" | "medium";
  strengths: string[];
  workOn: string[];
  summary: string;
  basis: { scenesAttempted: number; scenesInSitting: number };
};

export type ReviewResult =
  | { ok: true; review: AssessmentReview; fresh: boolean }
  | { ok: false; reason: string };

export const reviewAssessmentRun = (token: string, runId: string) =>
  generateCall<{ ok: true; review: AssessmentReview; fresh: boolean }>(
    token,
    `/v1/assessment/run/${runId}/review`,
    {},
  );

/**
 * The first situation of a role's assessment, to anybody.
 *
 * No token, no run created, nothing kept. It exists so somebody can see what
 * a question actually involves before being asked for an account - the
 * argument for the feature is that it is the job's own work rather than a
 * test, and that is seen in one scene and cannot be told.
 */
export const getAssessmentPreview = (roleId: string) =>
  apiCall<{
    roleId: string;
    company: string;
    buddy: string;
    scene: StudentScene;
  }>("", `/v1/assessment/preview/${roleId}`);

export const getPreviewAssessmentRoles = () =>
  apiCall<{ roles: Array<{ roleId: string; title: string }> }>(
    "",
    "/v1/assessment/preview/roles",
  );

export const startAssessmentRun = (token: string, roleId: string) =>
  apiCall<RunState>(token, "/v1/assessment/run", {
    method: "POST",
    body: { roleId },
  });

export const sendSceneAnswer = (
  token: string,
  runId: string,
  body: AssessmentAnswerDraft,
) =>
  apiCall<AnswerAccepted>(token, `/v1/assessment/run/${runId}/answer`, {
    method: "POST",
    body,
  });

export const saveAssessmentDraft = (token: string, runId: string, body: AssessmentAnswerDraft) =>
  apiCall<{ saved: boolean; expired?: boolean }>(token, `/v1/assessment/run/${runId}/draft`, {
    method: "PUT", body,
  });

/** One turn with the assistant while a scene is open. */
export type AssistTurn = { who: "them" | "assistant"; text: string };

export const askSceneAssistant = (
  token: string,
  runId: string,
  body: {
    sceneId: string;
    question: string;
    conversation: AssistTurn[];
    /** Buddy is retained for legacy clients; the server rejects new buddy requests. */
    who?: "assistant" | "buddy";
  },
) =>
  generateCall<{ ok: true; reply: string }>(
    token,
    `/v1/assessment/run/${runId}/assist`,
    body,
  );

/**
 * The assistant on the preview's first situation, for a visitor with no
 * account. Same three-question limit as a sitting, plus a small allowance
 * per address on the server.
 */
export const askPreviewAssistant = (
  roleId: string,
  body: { sceneId: string; question: string; conversation: AssistTurn[] },
) =>
  generateCall<{ ok: true; reply: string }>(
    "",
    `/v1/assessment/preview/${roleId}/assist`,
    body,
  );

/** A recording, transcribed server-side. Spoken scenes measure what was said. */
export async function transcribeSceneAnswer(
  token: string,
  runId: string,
  audio: Blob,
): Promise<{ text: string } | { error: string }> {
  const form = new FormData();
  form.append("file", audio, "answer.webm");
  try {
    const res = await fetch(`${API_URL}/v1/assessment/run/${runId}/speak`, {
      method: "POST",
      headers: requestHeaders({ token }),
      body: form,
    });
    if (res.ok) return (await res.json()) as { text: string };
    const said = await res
      .json()
      .then((d: { error?: string }) => d?.error ?? "")
      .catch(() => "");
    return { error: said || `The server answered ${res.status}.` };
  } catch {
    return { error: "Could not reach the server." };
  }
}

/**
 * Begin the 12-question assessment.
 *
 * The run exists from the moment the screen opens - the induction needs the
 * company and the buddy - but the clock starts here, when they press go.
 */
export const beginAssessmentRun = (token: string, runId: string) =>
  apiCall<{ serverNow: string; startedAt: string; begunAt: string | null; deadlineAt: string | null; timeLimitSeconds: number; questionLimit: number | null; finishedAt: string | null }>(
    token,
    `/v1/assessment/run/${runId}/begin`,
    { method: "POST", body: {} },
  );

export const finishAssessmentRun = (token: string, runId: string) =>
  apiCall<Readout>(token, `/v1/assessment/run/${runId}/finish`, {
    method: "POST",
    body: {},
  });

export const getAssessmentReadout = (token: string, runId: string) =>
  apiCall<Readout>(token, `/v1/assessment/run/${runId}/readout`);

/**
 * One finished sitting, as a line in a list of them.
 *
 * `readiness` is null when a sitting was never reviewed - a review can fail,
 * and a sitting is complete without one. Null means "not read", never zero.
 */
export type PastRun = {
  runId: string;
  roleId: string;
  roleTitle: string;
  startedAt: string;
  finishedAt: string;
  scenesAttempted: number;
  readiness: number | null;
  confidence: "low" | "medium" | null;
};

export const listAssessmentRuns = (token: string) =>
  apiCall<{ runs: PastRun[] }>(token, "/v1/assessment/runs");

/**
 * A role this person can be assessed on.
 *
 * Every role with a published assessment, not only the one Discovery settled
 * on - somebody weighing up three jobs should be able to see where they stand
 * on each. The API enforces the same list, so a role that reaches the request
 * some other way is refused there rather than merely being absent here.
 */
export type AssessableRole = {
  roleId: string;
  roleTitle: string;
  /** Picked in Discovery, as opposed to simply available. */
  chosen: boolean;
  /** The one Discovery settled on most recently. At most one is true. */
  current: boolean;
  /** Whether anybody has published an assessment for it yet. */
  hasAssessment: boolean;
  sittings: number;
  lastReadiness: number | null;
};

export const listAssessableRoles = (token: string) =>
  apiCall<{ roles: AssessableRole[] }>(token, "/v1/assessment/roles");

/**
 * A line to compare a readiness score against.
 *
 * `source` is the field that matters. "measured" means something counted real
 * rows - stored reviews, or a bar an admin set against a real hiring process.
 * "illustrative" means it is a stand-in until there is data, and it must never
 * be drawn or described as anything else: a number on a chart is read long
 * before its footnote, and this one is read by somebody deciding whether they
 * are employable.
 */
export type ReferenceBand = {
  id: "cohort" | "sixMonths" | "employerBar";
  label: string;
  source: "measured" | "illustrative";
  readiness: number;
  /** Per-skill scores where known; empty means flat at `readiness`. */
  skills: Array<{ skill: string; score: number }>;
  /** How many people it is the mean of. Only ever on a measured band. */
  cohort?: number;
};

export const getRoleBenchmarks = (token: string, roleId: string) =>
  apiCall<{ bands: ReferenceBand[] }>(
    token,
    `/v1/assessment/role/${roleId}/benchmark`,
  );

export const adminArcPrompt = (token: string) =>
  apiCall<{ prompt: string }>(token, "/v1/admin/assessment/arc/prompt");

export const adminGenerateArc = (
  token: string,
  body: {
    roleId: string;
    roleTitle: string;
    roleSummary?: string;
    skills: string[];
    /** The admin's own prompt. Appended to the built-in one, never replacing it. */
    guidance?: string;
    /**
     * How many scenes to write. A sitting has 12 questions and uses a
     * handful; the pool is larger so the sitting can be chosen from it and two
     * people do not get the same scenes.
     */
    want?: number;
    /**
     * How many workplaces to spread the pool across. Unset lets the model pick
     * two or three from what actually hires for the role.
     */
    teams?: number;
  },
) =>
  apiCall<ArcGenerateResult>(token, "/v1/admin/assessment/arc/generate", {
    method: "POST",
    body,
  });

/** What the backend drafts for the five student questions, plus industries. */
export type RoleContextDraft = {
  entry: string;
  where: string;
  transfers: string;
  changing: string;
  seen: string;
  acrossIndustries: Array<{ industry: string; difference: string }>;
};

export type RoleContextGenerateResult =
  | { ok: true; draft: RoleContextDraft; warnings: string[] }
  | { ok: false; reason: string };

export const adminRoleContextPrompt = (token: string) =>
  apiCall<{ prompt: string }>(token, "/v1/admin/roles/context/prompt");

export const adminGenerateRoleContext = (
  token: string,
  body: {
    roleId: string;
    roleTitle: string;
    sector?: string;
    description?: string;
    responsibilities?: string[];
    skills?: Array<{ name: string; why: string }>;
    workContext?: {
      environment: string;
      hours: string;
      pace: string;
      team: string;
    };
    hardTruths?: string[];
    /**
     * Sources, employer notes and corrections. Unlike the arc's guidance this
     * is authoritative over the model, because three of these fields are
     * claims about the world only a person with a source can settle.
     */
    guidance?: string;
  },
) =>
  generateCall<Extract<RoleContextGenerateResult, { ok: true }>>(
    token,
    "/v1/admin/roles/context/generate",
    body,
  );

/**
 * Practice interview questions for one role. Deliberately NOT a record of
 * what employers ask - no dataset covers that, and what real employers ask is
 * field research. These are rehearsal, drawn from the role's own skills.
 */
export type InterviewQuestion = {
  round: "hr" | "managerial";
  question: string;
  /** Which of the role's skills this rehearses. */
  measures: string;
  /** What a strong answer shows. For the reviewer and the coach, not the student. */
  looksLike: string;
};

export type InterviewQuestionSet = {
  roleId: string;
  roleTitle: string;
  questions: InterviewQuestion[];
};

export type InterviewBank = { sets: InterviewQuestionSet[] };

export type InterviewBankGenerateResult =
  | { ok: true; set: InterviewQuestionSet; warnings: string[] }
  | { ok: false; reason: string };

/**
 * The body of a role, written or enriched from an instruction. Pay, growth
 * and testimonials are deliberately absent: the writer cannot touch them, so
 * whatever is on the role stays.
 */
export type RoleDetailDraft = {
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
  hardTruths: string[];
  suitsYouIf: string[];
};

export type RoleDetailGenerateResult =
  | { ok: true; draft: RoleDetailDraft; warnings: string[] }
  | { ok: false; reason: string };

/**
 * A student's own question about a role, answered by the backend from the
 * published material only. `answered: false` is a decline for want of
 * material, not an error - the assistant saying so is the feature.
 */
export type RoleAnswer = {
  answer: string;
  /** Which material it drew on: role, catalogue, assessment, interview, notes. */
  grounded: string[];
  answered: boolean;
};

export const askAboutRole = (token: string, roleId: string, question: string) =>
  generateCall<{ ok: true; result: RoleAnswer }>(token, "/v1/discovery/ask", {
    roleId,
    question,
  });

export const adminRoleDetailPrompt = (token: string) =>
  apiCall<{ prompt: string }>(token, "/v1/admin/roles/detail/prompt");

export const adminGenerateRoleDetail = (
  token: string,
  body: Partial<RoleDetailDraft> & {
    roleId: string;
    roleTitle: string;
    roleSummary?: string;
    /** What you want written or changed. Authoritative over the model. */
    instruction: string;
  },
) =>
  generateCall<Extract<RoleDetailGenerateResult, { ok: true }>>(
    token,
    "/v1/admin/roles/detail/generate",
    body,
  );

/**
 * A drawn scene.
 *
 * Three shapes, not one: a URL when the upload to our bucket worked, raw
 * base64 when the bucket was unavailable and the picture came back inline, or
 * an error. Reading only `url` - which is what this type used to say - meant
 * every successful draw looked like a failure and the count stayed at zero.
 */
export type SceneImage =
  | { id: string; imageUrl: string }
  | { id: string; imageB64: string }
  | { id: string; error: string };

/** The picture as something an <img> can use, whichever shape it came in. */
export function sceneImageSrc(image: SceneImage): string | null {
  if ("imageUrl" in image) return image.imageUrl;
  if ("imageB64" in image) return `data:image/png;base64,${image.imageB64}`;
  return null;
}

/** Which industries genuinely hire for a role. Asked before generating. */
export const adminArcIndustries = (
  token: string,
  body: { roleTitle: string; roleSummary?: string; guidance?: string },
) =>
  apiCall<{ teams: ArcTeam[] }>(token, "/v1/admin/assessment/arc/industries", {
    method: "POST",
    body,
  });

export const adminGenerateArcImages = (
  token: string,
  scenes: Array<{ id: string; scene: string }>,
) =>
  apiCall<{ images: SceneImage[] }>(token, "/v1/admin/assessment/arc/images", {
    method: "POST",
    body: { scenes },
  });

export const adminInterviewPrompt = (token: string) =>
  apiCall<{ prompt: string }>(token, "/v1/admin/interview/questions/prompt");

export const adminGenerateInterviewQuestions = (
  token: string,
  body: {
    roleId: string;
    roleTitle: string;
    sector?: string;
    description?: string;
    responsibilities?: string[];
    skills?: Array<{ name: string; why: string }>;
    workContext?: {
      environment: string;
      hours: string;
      pace: string;
      team: string;
    };
    hardTruths?: string[];
    /** Notes from a real employer conversation, if you have them. */
    guidance?: string;
  },
) =>
  generateCall<Extract<InterviewBankGenerateResult, { ok: true }>>(
    token,
    "/v1/admin/interview/questions/generate",
    body,
  );

// ---- Admin console (content module) ----

export type ContentDoc = {
  kind: string;
  version: number;
  status: "draft" | "published";
  data: Record<string, unknown>;
  note: string | null;
  updatedAt: string;
  publishedAt: string | null;
};

export type AdminContent = {
  kind: string;
  published: ContentDoc | null;
  draft: ContentDoc | null;
  builtIn: Record<string, unknown>;
  versions: Array<{
    version: number;
    publishedAt: string | null;
    note: string | null;
  }>;
};

export const adminAccess = (token: string) =>
  apiCall<{ isAdmin: boolean; openToEveryone: boolean; aiConfigured: boolean }>(
    token,
    "/v1/admin/access",
  );

export const adminContent = (token: string, kind: string) =>
  apiCall<AdminContent>(token, `/v1/admin/content/${kind}`);

/**
 * Why a draft would not save.
 *
 * apiCall collapses every failure to null, so a rejected save looked identical
 * to a network blip and the console could only say "could not save the draft".
 * The commonest cause is size - a sixty-scene pool is megabytes - and that has
 * a specific fix the admin can act on, so it is worth naming.
 */
export async function adminSaveDraftDetailed(
  token: string,
  kind: string,
  data: unknown,
  note?: string,
): Promise<{ ok: true; doc: ContentDoc } | { ok: false; reason: string }> {
  let res: Response;
  const body = JSON.stringify({ data, note });
  try {
    res = await fetch(`${API_URL}/v1/admin/content/${kind}/draft`, {
      method: "PUT",
      cache: "no-store",
      headers: requestHeaders({ token, json: true }),
      body,
    });
  } catch {
    return { ok: false, reason: `Could not reach the server at ${API_URL}.` };
  }
  if (res.ok) return { ok: true, doc: (await res.json()) as ContentDoc };

  const said = await res
    .json()
    .then((d: { error?: string }) => d?.error ?? "")
    .catch(() => "");
  const mb = (body.length / (1024 * 1024)).toFixed(1);
  const reason =
    res.status === 413
      ? `The draft is ${mb} MB, which the server refused. Restart the backend if you have not since the limit was raised, or write fewer scenes.`
      : res.status === 401 || res.status === 403
        ? "Your session expired, or this account is not an admin."
        : said || `The server answered ${res.status}.`;
  return { ok: false, reason };
}

export const adminSaveDraft = (
  token: string,
  kind: string,
  data: unknown,
  note?: string,
) =>
  apiCall<ContentDoc>(token, `/v1/admin/content/${kind}/draft`, {
    method: "PUT",
    body: { data, note },
  });

export const adminPublish = (token: string, kind: string) =>
  apiCall<ContentDoc>(token, `/v1/admin/content/${kind}/publish`, {
    method: "POST",
    body: {},
  });

export const adminDiscardDraft = (token: string, kind: string) =>
  apiCall<{ discarded: boolean }>(token, `/v1/admin/content/${kind}/draft`, {
    method: "DELETE",
  });

export type Skill = { id: string; name: string; description: string };
export type SkillModel = {
  skills: Skill[];
  traitSkill: Record<string, Record<string, number>>;
  skillRole: Record<string, Record<string, number>>;
  signalSkill: Record<string, Record<string, number>>;
  signalInfluence: 0 | 1 | 2;
};

export type SkillModelReview = {
  signals: Array<{
    id: string;
    label: string;
    meaning: string;
    source: "discovery" | "product";
    usedInScoring: boolean;
  }>;
  reviews: Array<{
    level: "problem" | "caution";
    scope: "skill" | "role" | "signal";
    message: string;
  }>;
  impact: {
    meaningful: boolean;
    runs: number;
    topRoleAgreement: number;
    decisiveRuns: number;
    decisiveAgreement: number;
    shifts: Array<{ from: string; to: string; runs: number }>;
  };
};

export type SkillSuggestion = {
  roleId: string;
  skills: Array<{ skillId: string; level: 1 | 2 | 3 }>;
  proposedNewSkills: Array<{ name: string; description: string }>;
};

export const adminSuggestSkills = (
  token: string,
  body: {
    roles: Array<{
      id: string;
      title: string;
      sector?: string;
      summary?: string;
    }>;
    catalogue: Array<{ id: string; name: string; description: string }>;
    examples?: Array<{
      title: string;
      skills: Array<{ skillId: string; level: 1 | 2 | 3 }>;
    }>;
  },
) =>
  apiCall<{ suggestions: SkillSuggestion[]; usedStub: boolean }>(
    token,
    "/v1/admin/skills/suggest",
    { method: "POST", body },
  );

export type SkillWeight = { skillId: string; level: 1 | 2 | 3 };

// Three shapes, per the Blueprint: paired work choices, micro-scenarios and one
// optional open question per skill.
/** The scene a question is set in, drawn. Stored on the question itself. */
export type QuestionPicture = { url: string; alt: string };

export type GeneratedQuestion =
  | {
      kind: "choice";
      id: string;
      forSkillId: string;
      prompt: string;
      picture?: QuestionPicture;
      a: { label: string; weights: SkillWeight[] };
      b: { label: string; weights: SkillWeight[] };
    }
  | {
      kind: "scenario";
      id: string;
      forSkillId: string;
      situation: string;
      picture?: QuestionPicture;
      options: Array<{ id: string; label: string; weights: SkillWeight[] }>;
    }
  | { kind: "explanation"; id: string; forSkillId: string; prompt: string };

export const adminReviewSkillModel = (token: string, model: SkillModel) =>
  apiCall<SkillModelReview>(token, "/v1/admin/skill-model/review", {
    method: "POST",
    body: { model },
  });

// ---- Career record / profile ----

export type CareerProfile = {
  version: number;
  education: Array<Record<string, unknown>>;
  experience: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  achievements: Array<Record<string, unknown>>;
  preferences: Record<string, unknown>;
  createdAt: string;
};

export type CareerRecord = {
  profile: CareerProfile | null;
  claims: Array<{
    id: string;
    kind: string;
    content: unknown;
    source: string;
    confidence: string;
  }>;
};

export type ImportSuggestion = {
  field: string;
  value: string;
  evidence: string;
};

export type ImportResult = {
  languages?: string[];
  source: "resume" | "linkedin";
  characters: number;
  suggestions: ImportSuggestion[];
  skills: string[];
  activities: string[];
  /** Every job the document lists, not only the first. */
  experience?: Array<{
    kind: string;
    title: string;
    organisation: string;
    from: string;
    to: string;
    current: boolean;
    detail: string;
  }>;
  /** Every qualification the document lists. */
  education?: Array<{
    qualification: string;
    institution: string;
    from: string;
    to: string;
    current: boolean;
    marks: string;
    stream: string;
  }>;
};

// Uploads go through fetch directly: the browser sets the multipart boundary,
// so we must not set Content-Type ourselves.
/**
 * The biggest file worth sending. Checked here as well as on the server so
 * somebody is told before they spend a minute uploading it.
 */
const BIGGEST_UPLOAD = 15 * 1024 * 1024;

/** How long to wait before calling it. The server parses with a model. */
const UPLOAD_TIMEOUT_MS = 90_000;

/**
 * Send a file, and say what actually went wrong when it does not arrive.
 *
 * Three faults, reported once as one sentence: "Could not reach the server."
 *
 *   NO TIMEOUT. A request that hung hung forever, and the only way out was to
 *   reload the page and lose the form.
 *
 *   NO RETRY. The API sleeps when idle and the first request after that can be
 *   refused outright. One attempt, one failure - which is exactly the reported
 *   symptom: it worked on one visit and not the next.
 *
 *   ONE MESSAGE FOR EVERY CAUSE. A file over the size limit, an expired
 *   session, a parse failure and a dropped connection all said the same thing,
 *   and it named the wrong culprit for three of the four - the server was
 *   fine, the upload was too big.
 *
 * Only transient faults are retried. A 4xx is an answer, not a failure: a file
 * the server has read and rejected will be rejected again, and retrying it
 * wastes a minute of somebody's time to arrive at the same sentence.
 */
async function upload<T>(
  token: string,
  path: string,
  file: File,
  extra?: Record<string, string>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (file.size > BIGGEST_UPLOAD) {
    return {
      ok: false,
      error: `That file is ${Math.round(file.size / 1024 / 1024)}MB, over the 15MB limit. Export it again at a smaller size, or upload a Word file instead.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: "That file is empty." };
  }

  let lastError = "Could not reach the server.";
  for (let attempt = 0; attempt < 2; attempt++) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), UPLOAD_TIMEOUT_MS);
    try {
      const form = new FormData();
      Object.entries(extra ?? {}).forEach(([k, v]) => form.append(k, v));
      form.append("file", file);
      const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Request-Id": newRequestId(),
        },
        body: form,
        signal: abort.signal,
      });
      const body = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (res.ok) return { ok: true, data: body as T };

      // The server answered. Whatever it said is the truth about this file,
      // and sending it again will not change it.
      if (res.status < 500) {
        return {
          ok: false,
          error: String(
            body.error ??
              (res.status === 401
                ? "Your session expired. Sign in again and retry."
                : "That file could not be read."),
          ),
        };
      }
      lastError = String(
        body.error ?? "The server had a problem reading that. Try again.",
      );
    } catch (err) {
      lastError =
        (err as Error)?.name === "AbortError"
          ? "That took too long to read. Try again, or upload a smaller file."
          : "Could not reach the server. Check your connection and try again.";
    } finally {
      clearTimeout(timer);
    }
    // A short pause before the second go: the commonest cause is an API that
    // was asleep, and it needs a moment to be awake.
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1200));
  }
  return { ok: false, error: lastError };
}

export const importCareerDocument = (
  token: string,
  file: File,
  source: "resume" | "linkedin",
) => upload<ImportResult>(token, "/v1/career-record/import", file, { source });

export type CatalogueImportResult = {
  draft: ContentDoc;
  added: string[];
  updated: string[];
  issues: Array<{ row: number; message: string }>;
};

// The template is a file download, so it needs the raw response rather than
// apiCall's JSON.
export async function adminRoleTemplate(token: string): Promise<Blob | null> {
  try {
    const res = await fetch(
      `${API_URL}/v1/admin/content/role_catalogue/template`,
      {
        headers: requestHeaders({ token }),
      },
    );
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export const adminImportCatalogue = (token: string, file: File) =>
  upload<CatalogueImportResult>(
    token,
    "/v1/admin/content/role_catalogue/import",
    file,
  );

export type ErasureReport = {
  removed: Record<string, number>;
  auditRowsAnonymised: number;
  completedAt: string;
};

export const eraseMyData = (token: string) =>
  apiCall<ErasureReport>(token, "/v1/account/erase", {
    method: "POST",
    body: { confirm: "DELETE" },
  });

export const getCareerRecord = (token: string) =>
  apiCall<CareerRecord>(token, "/v1/career-record");

export const saveCareerProfile = (
  token: string,
  profile: {
    education: Array<Record<string, unknown>>;
    experience: Array<Record<string, unknown>>;
    projects: Array<Record<string, unknown>>;
    achievements: Array<Record<string, unknown>>;
    preferences: Record<string, unknown>;
  },
) =>
  apiCall<CareerProfile>(token, "/v1/career-record/profile", {
    method: "PUT",
    body: profile,
  });

export type ProfileReflection = {
  issues: Array<{ field: string; message: string }>;
  summary: string | null;
};

// Advisory: the model double-checks the saved answers and reflects the
// person's story back. Failures return null and the caller moves on.
export const reflectCareerProfile = (
  token: string,
  preferences: Record<string, unknown>,
) =>
  apiCall<ProfileReflection>(token, "/v1/career-record/reflect", {
    method: "POST",
    body: { preferences },
  });

export async function selectJourneyRoute(
  token: string,
  route: string,
  idempotencyKey: string,
): Promise<JourneySelection | null> {
  try {
    const res = await fetch(`${API_URL}/v1/journey/select`, {
      method: "POST",
      headers: requestHeaders({ token, json: true, idempotencyKey }),
      body: JSON.stringify({ route }),
    });
    if (!res.ok) return null;
    return (await res.json()) as JourneySelection;
  } catch {
    return null;
  }
}
