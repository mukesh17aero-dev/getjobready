// Career record and profile.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Career record / profile ----

import { API_URL, newRequestId, requestHeaders } from "./core";
import type { ContentDoc } from "./admin";
import type { JourneySelection } from "./journey";
import { apiCall } from "./core";
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

/** Atomic preference update: never replaces resume or education fields. */
export const saveExplorationPreference = (token: string, patch: {roleId?: string; saved?: boolean; track?: "student" | "early_career"}) =>
  apiCall<CareerProfile>(token, "/v1/career-record/exploration", {method:"PATCH",body:patch});
