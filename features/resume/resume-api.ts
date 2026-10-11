// Typed calls for the AI Resume Builder. Self-contained on purpose: the
// resume feature ships as one vertical slice (this file, the builder
// component, the page), so it re-declares the two career-record calls it
// needs instead of reaching into lib/api.ts.

// NEXT_PUBLIC_* must be accessed statically so Next.js can inline it into
// the browser bundle.
import { API_URL } from "@/lib/api-base";

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
      signal: AbortSignal.timeout(init?.method && init.method !== "GET" ? 90_000 : 15_000),
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
  /**
   * Skills to offer as one-tap choices: the role's own, or without a role the
   * ones most of the catalogue's roles ask for. Optional so an older backend
   * still works; the builder then falls back to the keywords.
   */
  suggestedSkills?: string[];
};

// The three ATS-safe looks the backend can render. All single column, no
// tables or graphics - only spacing, alignment and type differ.
export type ResumeTemplate = "classic" | "compact" | "sidebar" | "minimal" | "graduate" | "professional";
/** The looks the Word export knows. The newer on-screen looks share a base structure with one of these. */
export type ExportTemplate = "classic" | "compact" | "sidebar";
export const exportTemplate = (template: ResumeTemplate): ExportTemplate =>
  template === "compact" || template === "minimal" ? "compact" : template === "sidebar" ? "sidebar" : "classic";

export type ResumeData = {
  header: {
    name: string;
    city: string;
    email: string;
    /** A resume with no phone number on it is a resume nobody rings. */
    phone?: string;
    /** LinkedIn or a portfolio. One link; more than one is clutter. */
    link?: string;
  };
  summary: string;
  skills: Array<{ group: string; items: string[] }>;
  experienceHeading: string;
  /** "Summary" for someone with work behind them, "Career objective" for a student. */
  summaryHeading?: string;
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
  /**
   * Academic and personal projects, kept apart from experience: for somebody
   * with no employment this is usually the strongest section on the page, and
   * a college project written into experience reads as a job that was not one.
   */
  projects?: Array<{ title: string; detail: string; tools: string[] }>;
  certifications?: Array<{ title: string; issuer: string; year: string }>;
  /** Awards, ranks, published work. One line each. */
  achievements?: string[];
  languages: string[];
  /** What they organised or took responsibility for. */
  activities: string[];
  /** Hobbies. Kept apart from activities, which are read very differently. */
  interests?: string[];
  keywordsUsed: string[];
};

/** What a parser found - and could not find - in the file we would hand over. */
export type AtsCheck = {
  readable: boolean;
  problems: Array<{ what: string; why: string }>;
  found: string[];
};

/**
 * What a screener and a recruiter will see, counted from the document by
 * the backend. Items a rewrite can close carry a Scribe instruction.
 */
export type ChecklistItem = {
  id: string;
  label: string;
  status: "pass" | "fix" | "info";
  detail: string;
  /** An instruction Scribe can follow on its own. */
  fix?: string;
  /** A question only the person can answer - their fact, their claim. */
  ask?: string;
  /** When the answer belongs in their record rather than in the document. */
  link?: { href: string; label: string };
};
export type ResumeChecklist = { items: ChecklistItem[]; passed: number; counted: number };

export type GenerateResult = {
  /** The parse-back of the real Word file, run on every build. */
  ats?: AtsCheck;
  resume: ResumeData;
  targetRole: string;
  keywords: string[];
  checklist?: ResumeChecklist;
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
  /** The draft already built, so the questions land on its actual lines. */
  resume?: ResumeData;
  targetRole?: string;
  jobDescription?: string;
  /** Which look to record with the build; the backend defaults to classic. */
  template?: ResumeTemplate;
  /** Aimed at no particular role - the Discovery role is set aside too. */
  general?: boolean;
  /** The text of a resume they already have, from readResumeUpload. */
  existingResume?: string;
  /** The same upload as our parser read it - see readResumeUpload. */
  existingParsed?: Record<string, unknown>;
};

// ---- Calls ----

export const getResumeTarget = (token: string) =>
  call<ResumeTarget>(token, "/v1/resume/context");

/** One gap in the record that a resume cannot be written without. */
export type ReadinessGap = { item: "name" | "phone" | "city" | "education" | "experience" | "skills"; label: string };

export async function generateResume(
  token: string,
  body: TargetBody,
): Promise<({ ok: true } & GenerateResult) | { ok: false; reason: string; missing?: ReadinessGap[] }> {
  try {
    const res = await fetch(`${API_URL}/v1/resume/generate`, {
      method: "POST",
      cache: "no-store",
      headers: headers(token, true),
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) return { ok: true, ...(data as GenerateResult) };
    if (data.error === "profile_incomplete" && Array.isArray(data.missing)) {
      return { ok: false, reason: "A few details are still missing from your profile.", missing: data.missing as ReadinessGap[] };
    }
    return { ok: false, reason: typeof data.error === "string" ? data.error : "The draft didn't come back this time. Nothing was lost - try again." };
  } catch {
    return { ok: false, reason: "Could not reach the server. Check your connection and try again." };
  }
}

/** The draft as it stands, saved as they work on it - and marked when downloaded. */
export const saveResumeDraft = (
  token: string,
  body: { resume: ResumeData; targetRole: string; jobDescription?: string; template?: ExportTemplate; displayTemplate?: ResumeTemplate; downloaded?: boolean; review?: ResumeReview },
) => call<{ saved: true }>(token, "/v1/resume/draft", { method: "PUT", body });

/**
 * A resume they already have, read into text. Nothing is stored server-side:
 * the text comes back here and goes up again with the build, so an upload
 * they think better of leaves nothing behind.
 */
export type ReadUpload = {
  filename: string;
  text: string;
  /** Counts of what the parser found, for telling them what we read. */
  read: { experience: number; education: number; skills: number };
  /** The document as fields, from the same parser the profile import uses. */
  parsed: Record<string, unknown> | null;
};

export async function readResumeUpload(
  token: string,
  file: File,
): Promise<({ ok: true } & ReadUpload) | { ok: false; error: string }> {
  try {
    const form = new FormData();
    form.append("file", file, file.name);
    const res = await fetch(`${API_URL}/v1/resume/read-upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "X-Request-Id": crypto.randomUUID() },
      body: form,
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error: String(body.error ?? "We could not read that file. Try a PDF or Word file."),
      };
    }
    const read = (body.read ?? {}) as Record<string, unknown>;
    const count = (key: string) => (typeof read[key] === "number" ? (read[key] as number) : 0);
    return {
      ok: true,
      filename: String(body.filename ?? file.name),
      text: String(body.text ?? ""),
      read: {
        experience: count("experience"),
        education: count("education"),
        skills: count("skills"),
      },
      parsed: (body.parsed as Record<string, unknown> | null) ?? null,
    };
  } catch {
    return { ok: false, error: "Could not reach the server. Try again in a moment." };
  }
}

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
  template: ExportTemplate = "classic",
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

// ---- Whether a resume may leave ----
//
// A draft is always readable on screen; downloading is the line. The same
// rules run on the server, which is the door the file really goes through -
// this copy is here so the button can explain itself before it is pressed.

export type ResumeGap = { section: string; fix: string };

const said = (value: string | undefined) => Boolean(value && value.trim().length > 1);

export function resumeCompleteness(resume: ResumeData): {
  ready: boolean;
  missing: ResumeGap[];
} {
  const missing: ResumeGap[] = [];
  if (!said(resume.header.name))
    missing.push({
      section: "Your name",
      fix: "Add your full name - a resume without it cannot be matched to you.",
    });
  if (!said(resume.header.email))
    missing.push({
      section: "A way to reach you",
      fix: "Add your email so an employer who wants to talk to you can.",
    });
  if (!said(resume.summary))
    missing.push({
      section: "Your profile",
      fix: "Two or three lines on what you can do and what you are aiming for.",
    });
  if (resume.skills.reduce((n, g) => n + g.items.length, 0) < 3)
    missing.push({
      section: "Skills",
      fix: "Name at least three things you can do and could show someone.",
    });
  if (!resume.experience.some((job) => said(job.title) && job.bullets.some(said)) && !resume.projects?.some(project => said(project.title) && said(project.detail)))
    missing.push({
      section: "What you have done",
      fix: "One job, internship, project or volunteering role - with a line or two on what you actually did.",
    });
  if (!resume.education.some((row) => said(row.qualification)))
    missing.push({
      section: "Education",
      fix: "What you studied and where, even if you have not finished yet.",
    });
  return { ready: missing.length === 0, missing };
}

// ---- The second read, and the revision loop ----

/** The one step after the AI Recruiter Review, decided from what they have done. */
export type ReviewNext =
  | { kind: "explore" }
  | { kind: "readiness" | "simulation" | "interview"; roleId: string; roleTitle: string };

export type ResumeReview = {
  /** What would make a recruiter keep reading. */
  strengths: string[];
  /** What would make a recruiter pass on it or hesitate. Absent on reviews saved before it existed. */
  redFlags?: string[];
  /** What would get it shortlisted, and how to change it truthfully. */
  gaps: Array<{ what: string; how: string }>;
  /** What a recruiter for the role expects to see, and whether it is shown. Absent on older saved reviews. */
  expectations?: Array<{ what: string; shown: boolean }>;
  standing: { level: "early" | "competitive" | "strong"; why: string };
  nextStep: {
    route: "readiness" | "practice" | "interview" | "profile";
    why: string;
  };
  /**
   * Only on a resume aimed at no role: directions their own record points
   * at, from our catalogue. Doors, never verdicts.
   */
  roleIdeas?: Array<{ role: string; why: string; roleId?: string }>;
  coverage: { covered: string[]; missing: string[] };
  /** True when the model was unavailable and the read came from the text. */
  fromRules: boolean;
};

/** An honest read of the built resume against the bar for its role. */
export const reviewResume = (
  token: string,
  body: {
    resume: ResumeData;
    targetRole?: string;
    jobDescription?: string;
    general?: boolean;
    /** Student or working: the standard it is written and read to. */
    track?: "student" | "early_career";
  },
) =>
  call<{ review: ResumeReview; next?: ReviewNext; targetRole: string; keywords: string[]; checklist?: ResumeChecklist }>(
    token,
    "/v1/resume/review",
    { method: "POST", body },
  );

/**
 * One revision, in the person's own words. The reply always carries a valid
 * resume - on a refusal it is the one that was sent, with `declined` saying
 * plainly what could not be done.
 */
export const refineResume = (
  token: string,
  body: {
    resume: ResumeData;
    comment: string;
    targetRole?: string;
    jobDescription?: string;
    general?: boolean;
    /** Student or working: the standard it is written and read to. */
    track?: "student" | "early_career";
    /** The conversation so far, oldest first. */
    history?: Array<{ ask: string; reply: string }>;
  },
) =>
  call<{
    resume: ResumeData;
    changed: string[];
    /** Facts the instruction brought in - the person's own claim. */
    added: string[];
    /** What the writer says back, always. */
    reply: string;
    /** One question that would make the change stronger, if there is one. */
    followUp?: string;
    declined: string | null;
    /** A better change Scribe would suggest, pressable as one instruction. */
    offer?: { label: string; instruction: string } | null;
    /** The rewritten file, read back the way a screening system reads it. */
    ats?: AtsCheck;
    checklist?: ResumeChecklist;
  }>(token, "/v1/resume/refine", { method: "POST", body });

// ---- One-field polish and the review's line fixes ----

/** The fields the ✦ can rewrite: the ones a person explains in their own words. */
export type PolishField = "summary" | "experience.bullets" | "projects.detail" | "education.detail" | "achievements" | "activities";

/** A rewrite to show, never to apply unasked - or why there is none. */
export type PolishResult = { ok: true; text: string; note: string } | { ok: false; reason: string };

/** Their notes for one field, shaped into resume wording by the backend. */
export const polishResumeField = (
  token: string,
  body: {
    field: PolishField;
    text: string;
    context?: { title?: string; organisation?: string; period?: string };
    resume: ResumeData;
    targetRole?: string;
    track?: "student" | "early_career";
  },
) => call<PolishResult>(token, "/v1/resume/polish", { method: "POST", body });

/** Where a suggested fix applies. */
export type ResumeFixPlace =
  | { section: "summary" }
  | { section: "experience"; entry: number; line: number }
  | { section: "projects"; entry: number }
  | { section: "education"; entry: number }
  | { section: "achievements" | "activities"; line: number }
  | { section: "jobTitle" | "qualification"; entry: number }
  | { section: "skills"; entry: number; line: number };

/** One exact replacement for one exact line, with why. */
export type ResumeFix = ResumeFixPlace & { before: string; after: string; why: string };

const sameText = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();

/**
 * The resume with one accepted fix in it, or null when that line has changed
 * since the fix was suggested - an edit made afterwards is never overwritten.
 */
export function applyResumeFix(resume: ResumeData, fix: ResumeFix): ResumeData | null {
  const swap = (list: string[] | undefined, at: number) =>
    list && list[at] !== undefined && sameText(list[at], fix.before) ? list.map((line, i) => (i === at ? fix.after : line)) : null;
  switch (fix.section) {
    case "summary":
      return sameText(resume.summary, fix.before) ? { ...resume, summary: fix.after } : null;
    case "experience": {
      const job = resume.experience[fix.entry];
      const bullets = swap(job?.bullets, fix.line);
      return job && bullets ? { ...resume, experience: resume.experience.map((row, i) => (i === fix.entry ? { ...row, bullets } : row)) } : null;
    }
    case "projects": {
      const project = resume.projects?.[fix.entry];
      return project && sameText(project.detail, fix.before) ? { ...resume, projects: resume.projects!.map((row, i) => (i === fix.entry ? { ...row, detail: fix.after } : row)) } : null;
    }
    case "education": {
      const row = resume.education[fix.entry];
      return row && sameText(row.detail, fix.before) ? { ...resume, education: resume.education.map((item, i) => (i === fix.entry ? { ...item, detail: fix.after } : item)) } : null;
    }
    case "achievements": {
      const achievements = swap(resume.achievements, fix.line);
      return achievements ? { ...resume, achievements } : null;
    }
    case "activities": {
      const activities = swap(resume.activities, fix.line);
      return activities ? { ...resume, activities } : null;
    }
    case "jobTitle": {
      const job = resume.experience[fix.entry];
      return job && sameText(job.title, fix.before) ? { ...resume, experience: resume.experience.map((row, i) => (i === fix.entry ? { ...row, title: fix.after } : row)) } : null;
    }
    case "qualification": {
      const row = resume.education[fix.entry];
      return row && sameText(row.qualification, fix.before) ? { ...resume, education: resume.education.map((item, i) => (i === fix.entry ? { ...item, qualification: fix.after } : item)) } : null;
    }
    case "skills": {
      const group = resume.skills[fix.entry];
      const items = swap(group?.items, fix.line);
      return group && items ? { ...resume, skills: resume.skills.map((row, i) => (i === fix.entry ? { ...row, items } : row)) } : null;
    }
  }
}

/** Typos, grammar and slips of logic: each one an edit to accept. */
export type ResumeCorrection = ResumeFix & { kind: "typo" | "grammar" | "logic" };

/** The check a person runs on a draft before they trust it. */
export type ResumeValidation = {
  missing: ResumeGap[];
  /** `ask` is there when closing it needs a fact only the person has: the question to put to them. */
  ats: Array<{ label: string; detail: string; ask?: string }>;
  /** A fact that cannot be right, the section it sits in, and whether only the person can say what is true. */
  logic: Array<{ section: "header" | "summary" | "experience" | "education" | "projects" | "achievements" | "activities"; where: string; detail: string; needsFact?: boolean }>;
  corrections: ResumeCorrection[];
  stronger: Array<{ what: string; how: string }>;
  /** True when only the counted checks ran - the proofreading model was unavailable. */
  fromRules: boolean;
};

export const validateResumeDraft = (token: string, body: { resume: ResumeData; template: ExportTemplate; targetRole?: string; track?: "student" | "early_career"; jobDescription?: string; general?: boolean }) =>
  call<ResumeValidation>(token, "/v1/resume/validate", { method: "POST", body });
