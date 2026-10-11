// Shared request plumbing for every call to the API.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

import { API_URL, API_URL_LABEL } from "../api-base";

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

// Shared call helpers. Every module file in this folder goes through these,
// so retries, timeouts and error shaping are decided in exactly one place.

export const READ_TIMEOUT_MS = 10_000;

export const GENERATE_TIMEOUT_MS = 90_000;

export async function apiCall<T>(
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

export async function generateCall<T extends { ok: boolean }>(
  token: string,
  path: string,
  body: unknown,
  timeoutMs: number = GENERATE_TIMEOUT_MS,
): Promise<T | { ok: false; reason: string }> {
  // No model request leaves this client without a session. The server also authenticates.
  if (!token.trim()) return { ok: false, reason: "Sign in to use AI assistance and create your own results." };

  // A deadline, like every other read in this file.
  //
  // This was the one fetch with none, and it is the one behind the longest
  // waits in the product - a page that opens a stored result sits on
  // "opening your results" forever if the connection is accepted and then
  // goes quiet. Ninety seconds is long enough for a genuine generation on a
  // cold instance and short enough that somebody is told rather than left.
  let res: Response;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
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

export async function readOnce(
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
