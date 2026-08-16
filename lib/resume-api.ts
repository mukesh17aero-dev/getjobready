// Typed calls for the AI Resume Builder. Self-contained on purpose: the
// resume feature ships as one vertical slice (this file, the builder
// component, the page), so it re-declares the two career-record calls it
// needs instead of reaching into lib/api.ts.

// NEXT_PUBLIC_* must be accessed statically so Next.js can inline it into
// the browser bundle.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function headers(token: string, json = false): Record<string, string> {
  const h: Record<string, string> = {
    "X-Request-Id": crypto.randomUUID(),
    Authorization: `Bearer ${token}`,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function call<T>(
  token: string,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: init?.method ?? "GET",
      cache: "no-store",
      headers: headers(token, init?.body !== undefined),
      ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---- Types ----

export type ResumeTarget = {
  role: { id: string; title: string } | null;
  keywords: string[];
};

// The three ATS-safe looks the backend can render. All single column, no
// tables or graphics - only spacing, alignment and type differ.
export type ResumeTemplate = "classic" | "compact" | "sidebar";

export type GapQuestion = { field: string; question: string };

export type GapCheckResult = {
  targetRole: string;
  keywords: string[];
  missing: GapQuestion[];
  ready: boolean;
};

export type ResumeData = {
  header: { name: string; city: string; email: string };
  summary: string;
  skills: Array<{ group: string; items: string[] }>;
  experienceHeading: string;
  experience: Array<{
    title: string;
    organisation: string;
    period: string;
    bullets: string[];
  }>;
  education: Array<{
    qualification: string;
    institution: string;
    period: string;
    detail: string;
  }>;
  languages: string[];
  activities: string[];
  keywordsUsed: string[];
};

export type GenerateResult = {
  resume: ResumeData;
  targetRole: string;
  keywords: string[];
};

// Same shape lib/api.ts declares - re-declared here so this slice stands
// alone.
export type ResumeCareerProfile = {
  version: number;
  education: Array<Record<string, unknown>>;
  experience: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  achievements: Array<Record<string, unknown>>;
  preferences: Record<string, unknown>;
  createdAt: string;
};

type TargetBody = {
  targetRole?: string;
  jobDescription?: string;
  /** Which look to record with the build; the backend defaults to classic. */
  template?: ResumeTemplate;
};

// ---- Calls ----

export const getResumeTarget = (token: string) =>
  call<ResumeTarget>(token, "/v1/resume/context");

export const resumeGapCheck = (token: string, body: TargetBody) =>
  call<GapCheckResult>(token, "/v1/resume/gap-check", {
    method: "POST",
    body,
  });

export const generateResume = (token: string, body: TargetBody) =>
  call<GenerateResult>(token, "/v1/resume/generate", { method: "POST", body });

export const getResumeRecord = (token: string) =>
  call<{ profile: ResumeCareerProfile | null }>(token, "/v1/career-record");

// The existing PUT /v1/career-record/profile shape: the popup's answers land
// in preferences.resumeExtras, acknowledged new skills merge into
// preferences.skills.
export const saveResumeProfile = (
  token: string,
  profile: {
    education: Array<Record<string, unknown>>;
    experience: Array<Record<string, unknown>>;
    projects: Array<Record<string, unknown>>;
    achievements: Array<Record<string, unknown>>;
    preferences: Record<string, unknown>;
  },
) =>
  call<ResumeCareerProfile>(token, "/v1/career-record/profile", {
    method: "PUT",
    body: profile,
  });

// A binary download, so it cannot go through call(): the response is a Word
// file, not JSON.
export async function downloadResumeDocx(
  token: string,
  resume: ResumeData,
  template: ResumeTemplate = "classic",
  targetRole?: string,
): Promise<Blob | null> {
  try {
    const res = await fetch(`${API_URL}/v1/resume/export/docx`, {
      method: "POST",
      cache: "no-store",
      headers: headers(token, true),
      body: JSON.stringify({ resume, template, targetRole }),
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}
