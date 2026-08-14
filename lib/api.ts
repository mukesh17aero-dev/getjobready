// The one place the backend URL is known. NEXT_PUBLIC_* must be accessed
// statically so Next.js can inline it into the browser bundle.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
  return headers;
}

// ---- Outcome Router (journey module) ----

export type ResolvedRoute = { href: string; note: string | null };

export type JourneyRouteInfo = {
  id: string;
  title: string;
  need: string;
  output: string;
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

export type JourneyState = {
  routes: JourneyRouteInfo[];
  current: JourneySelection | null;
};

export async function getJourneyState(
  token: string | null,
): Promise<JourneyState | null> {
  try {
    const res = await fetch(`${API_URL}/v1/journey/routes`, {
      cache: "no-store",
      headers: requestHeaders({ token }),
    });
    if (!res.ok) return null;
    return (await res.json()) as JourneyState;
  } catch {
    return null;
  }
}

// ---- Discovery (discovery module) ----

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
  growth: Array<{ title: string; when: string; pay: { min: number; max: number } }>;
  hardTruths: string[];
  suitsYouIf: string[];
  voices: Array<{ name: string; title: string; journey: string; quote: string }>;
  voicesIllustrative: boolean;
};

export type DiscoveryContent = {
  version: string;
  worlds: Array<{ id: string; title: string; caption: string }>;
  // Every role, so a student can browse beyond their own matches.
  catalogue: Array<{ id: string; title: string; world: string; summary: string }>;
  roles: RoleDetail[];
  choices: Array<{ id: string; prompt: string; a: string; b: string }>;
  scenarios: Array<{
    id: string;
    situation: string;
    options: Array<{ id: string; label: string }>;
  }>;
};

export type AttemptSignals = {
  answersQuickly: boolean;
  changedAnswers: number;
  skippedOptional: boolean;
  rereadOptions: number;
};

export type DiscoveryAnswers = {
  choices: Record<string, "a" | "b">;
  scenarios: Record<string, string>;
  explanation?: string;
  // How the person answered, not what — see the admin console's Signals.
  signals?: Partial<AttemptSignals>;
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
  answers: DiscoveryAnswers;
  status: "in_progress" | "completed";
  matches: { matches: DiscoveryMatch[]; coverage: number } | null;
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
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: init?.method ?? "GET",
      cache: "no-store",
      headers: requestHeaders({
        token,
        json: init?.body !== undefined,
        idempotencyKey: init?.idempotencyKey,
      }),
      ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function discoveryCall<T>(
  token: string,
  path: string,
  init?: { method?: string; body?: unknown; idempotencyKey?: string },
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: init?.method ?? "GET",
      cache: "no-store",
      headers: requestHeaders({
        token,
        json: init?.body !== undefined,
        idempotencyKey: init?.idempotencyKey,
      }),
      ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getDiscovery = (token: string) =>
  discoveryCall<DiscoveryState>(token, "/v1/discovery");

export const startDiscoveryAttempt = (token: string, fresh = false) =>
  discoveryCall<DiscoveryAttempt>(token, "/v1/discovery/attempts", {
    method: "POST",
    body: { fresh },
  });

export const saveDiscoveryAnswers = (token: string, answers: DiscoveryAnswers) =>
  discoveryCall<DiscoveryAttempt>(token, "/v1/discovery/attempts/current", {
    method: "PATCH",
    body: answers,
  });

export const completeDiscoveryAttempt = (token: string) =>
  discoveryCall<DiscoveryAttempt>(token, "/v1/discovery/attempts/current/complete", {
    method: "POST",
    body: {},
  });

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

// ---- Adaptive Discovery (the published question bank) ----

export type AskedQuestion =
  | { kind: "choice"; id: string; prompt: string; options: Array<{ id: string; label: string }> }
  | { kind: "scenario"; id: string; situation: string; options: Array<{ id: string; label: string }> }
  | { kind: "explanation"; id: string; prompt: string };

export type AdaptiveState = {
  askedCount: number;
  behaviourApplied?: number;
  fromYourProfile?: string[];
  openAnswer: string | null;
  question: AskedQuestion | null;
  done: boolean;
  matches: DiscoveryMatch[];
  strongestSkills: Array<{ skillId: string; name: string; score: number }>;
};

export const getAdaptive = (token: string) =>
  discoveryCall<AdaptiveState>(token, "/v1/discovery/adaptive");

export const answerAdaptive = (
  token: string,
  body: {
    questionId: string;
    optionId: string;
    signals?: Partial<AttemptSignals>;
  },
) =>
  discoveryCall<AdaptiveState>(token, "/v1/discovery/adaptive/answer", {
    method: "POST",
    body,
  });

export const answerAdaptiveOpen = (
  token: string,
  body: { questionId: string; text: string },
) =>
  discoveryCall<AdaptiveState>(token, "/v1/discovery/adaptive/open", {
    method: "POST",
    body,
  });

export const restartAdaptive = (token: string) =>
  discoveryCall<AdaptiveState>(token, "/v1/discovery/adaptive/restart", {
    method: "POST",
    body: {},
  });

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
  versions: Array<{ version: number; publishedAt: string | null; note: string | null }>;
};

export const adminAccess = (token: string) =>
  apiCall<{ isAdmin: boolean; openToEveryone: boolean; aiConfigured: boolean }>(
    token,
    "/v1/admin/access",
  );

export const adminContent = (token: string, kind: string) =>
  apiCall<AdminContent>(token, `/v1/admin/content/${kind}`);

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
    roles: Array<{ id: string; title: string; sector?: string; summary?: string }>;
    catalogue: Array<{ id: string; name: string; description: string }>;
    examples?: Array<{ title: string; skills: Array<{ skillId: string; level: 1 | 2 | 3 }> }>;
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
export type GeneratedQuestion =
  | {
      kind: "choice";
      id: string;
      forSkillId: string;
      prompt: string;
      a: { label: string; weights: SkillWeight[] };
      b: { label: string; weights: SkillWeight[] };
    }
  | {
      kind: "scenario";
      id: string;
      forSkillId: string;
      situation: string;
      options: Array<{ id: string; label: string; weights: SkillWeight[] }>;
    }
  | { kind: "explanation"; id: string; forSkillId: string; prompt: string };

export const adminGenerateQuestions = (
  token: string,
  body: {
    catalogue: Array<{ id: string; name: string; description: string }>;
    wanted: Array<{
      skillId: string;
      choices: number;
      scenarios: number;
      explanations: number;
    }>;
    existingPrompts?: string[];
    guidance?: string;
  },
) =>
  apiCall<{ questions: GeneratedQuestion[]; usedStub: boolean }>(
    token,
    "/v1/admin/questions/generate",
    { method: "POST", body },
  );

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
  claims: Array<{ id: string; kind: string; content: unknown; source: string; confidence: string }>;
};

export type ImportSuggestion = { field: string; value: string; evidence: string };

export type ImportResult = {
  languages?: string[];
  source: "resume" | "linkedin";
  characters: number;
  suggestions: ImportSuggestion[];
  skills: string[];
  activities: string[];
};

// Uploads go through fetch directly: the browser sets the multipart boundary,
// so we must not set Content-Type ourselves.
async function upload<T>(
  token: string,
  path: string,
  file: File,
  extra?: Record<string, string>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
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
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: String(body.error ?? "That upload did not work.") };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: "Could not reach the server." };
  }
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
    const res = await fetch(`${API_URL}/v1/admin/content/role_catalogue/template`, {
      headers: requestHeaders({ token }),
    });
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
