// Professional profile (the LinkedIn-facing builder).
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Professional profile (profile-builder module) ----
//
// Two halves kept apart on purpose: `suggested` is what Ascend wrote, and
// `accepted` is what this person read and kept. Only the second half is ever
// presented back as their profile, and only they move a section across.

import { API_URL, requestHeaders } from "./core";
import { apiCall } from "./core";
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
