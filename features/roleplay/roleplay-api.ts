// Typed calls for the AI Roleplay endpoints. Self-contained on purpose —
// everything the roleplay screens need from the backend lives here, so the
// shared client stays untouched.

import { API_URL } from "@/lib/api-base";

export type Difficulty = "standard" | "challenging";

export type RubricCriterionView = { id: string; label: string; description: string };

export type RoleplayScenario = {
  id: string;
  title: string;
  description: string;
  brief: string;
  personaName: string;
  rubric: RubricCriterionView[];
};

export type RoleplayTurnView = {
  index: number;
  personaLine: string;
  concluding: boolean;
  reply: string | null;
};

export type RoleplayMarkView = {
  overall: number;
  bar: number;
  perCriterion: Array<{ id: string; label: string; rating: number }>;
  ruleVersion: string;
};

export type RoleplaySummaryView = {
  strengths: string[];
  improvements: string[];
  focusNext: string;
  /** Null when nothing could be scored. Never the model's own number — see the backend's marking rule. */
  score: RoleplayMarkView | null;
};

export type RoleplaySessionView = {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  personaName: string;
  difficulty: Difficulty;
  status: "in_progress" | "completed";
  startedAt: string;
  maxTurns: number;
  /** True once the conversation has naturally concluded, or hit its safety cap. */
  done: boolean;
  /** Lets the audio element stream the persona's voice straight from the server. */
  speechTicket?: string;
  rubric: RubricCriterionView[];
  turns: RoleplayTurnView[];
};

export type RoleplayHome = {
  scenarios: RoleplayScenario[];
  speechAvailable: boolean;
  session: RoleplaySessionView | null;
  history: Array<{
    scenarioId: string;
    scenarioTitle: string;
    difficulty: Difficulty;
    completedAt: string;
    summary: RoleplaySummaryView;
    turns: RoleplayTurnView[];
  }>;
};

function headers(token: string, json = false): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-Request-Id": crypto.randomUUID(),
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

// No token required — the scenario catalogue is published, not personal.
// A token attaches this person's own in-progress session and history.
export async function getRoleplayHome(token?: string): Promise<RoleplayHome | null> {
  try {
    const res = await fetch(`${API_URL}/v1/roleplay`, {
      cache: "no-store",
      headers: token ? headers(token) : { "X-Request-Id": crypto.randomUUID() },
    });
    if (!res.ok) return null;
    return (await res.json()) as RoleplayHome;
  } catch {
    return null;
  }
}

export const startRoleplay = (token: string, body: { scenarioId: string; difficulty: Difficulty }) =>
  call<RoleplaySessionView>(token, "/v1/roleplay/sessions", { method: "POST", body });

/** Close a roleplay nobody replied to yet: no feedback, no model call spent. */
export const leaveRoleplay = (token: string) =>
  call<{ ok: true }>(token, "/v1/roleplay/sessions/current", { method: "DELETE" });

type ReplyResult =
  | { ok: true; transcript: string; session: RoleplaySessionView }
  | { ok: false; error: string; session?: RoleplaySessionView; finished?: boolean };

export const replyWithText = async (token: string, text: string): Promise<ReplyResult> => {
  try {
    const res = await fetch(`${API_URL}/v1/roleplay/sessions/current/reply`, {
      method: "POST",
      cache: "no-store",
      headers: headers(token, true),
      body: JSON.stringify({ text }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error: String(body.error ?? "That reply did not go through. Try again."),
        ...(body.session ? { session: body.session as RoleplaySessionView } : {}),
        ...(body.finished === true ? { finished: true } : {}),
      };
    }
    const data = body as unknown as { transcript: string; session: RoleplaySessionView };
    return { ok: true, transcript: data.transcript, session: data.session };
  } catch {
    return { ok: false, error: "Could not reach the server. Try again in a moment." };
  }
};

// Voice replies go up as multipart so the server can transcribe them. A
// failure returns the server's own explanation — the screen offers typing.
export async function replyWithAudio(
  token: string,
  audio: Blob,
  filename: string,
): Promise<ReplyResult> {
  try {
    const form = new FormData();
    form.append("file", audio, filename);
    const res = await fetch(`${API_URL}/v1/roleplay/sessions/current/reply`, {
      method: "POST",
      headers: headers(token),
      body: form,
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error: String(body.error ?? "That recording did not go through. Try typing instead."),
        ...(body.session ? { session: body.session as RoleplaySessionView } : {}),
        ...(body.finished === true ? { finished: true } : {}),
      };
    }
    const data = body as unknown as { transcript: string; session: RoleplaySessionView };
    return { ok: true, transcript: data.transcript, session: data.session };
  } catch {
    return { ok: false, error: "Could not reach the server. Try typing your reply." };
  }
}

/**
 * Where the audio element can stream a persona line from. Handing the
 * element a URL rather than a finished file means it starts playing on the
 * first chunk instead of after the last one.
 */
export function personaLineAudioUrl(ticket: string, turnIndex: number): string {
  return `${API_URL}/v1/roleplay/sessions/current/speech/${turnIndex}?t=${encodeURIComponent(ticket)}`;
}

/** The persona's line read aloud, as a playable object URL. Null when speech is off. */
export async function fetchPersonaAudio(token: string, turnIndex: number): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/v1/roleplay/sessions/current/speech/${turnIndex}`, {
      headers: headers(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return URL.createObjectURL(await res.blob());
  } catch {
    return null;
  }
}

export async function finishRoleplay(
  token: string,
): Promise<{ summary: RoleplaySummaryView } | { error: string }> {
  try {
    const res = await fetch(`${API_URL}/v1/roleplay/sessions/current/finish`, {
      method: "POST",
      headers: headers(token, true),
      body: JSON.stringify({}),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || !body.summary) {
      return {
        error: String(body.error ?? "We could not write your feedback just now. Try again in a moment."),
      };
    }
    return { summary: body.summary as RoleplaySummaryView };
  } catch {
    return { error: "Could not reach the server. Your roleplay is saved — try again." };
  }
}
