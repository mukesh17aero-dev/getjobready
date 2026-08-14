import { API_URL, requestHeaders } from "./api";
import { supabaseBrowser } from "./supabase-browser";

// Client side of App Footprint Intelligence: a tiny in-memory queue that
// batches interaction events and ships them to the backend. First-party
// only, signed-in users only (events are silently dropped without a
// session), and never allowed to block or break the UI.

export type FootprintFamily =
  | "interest"
  | "engagement"
  | "decision"
  | "communication"
  | "scenario"
  | "learning";

export type Footprint = {
  family: FootprintFamily;
  event: string;
  module: string;
  target?: string;
  meta?: Record<string, unknown>;
};

const FLUSH_AFTER_MS = 5000;
const FLUSH_AT_COUNT = 20;
const MAX_BATCH = 25;

const queue: Footprint[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

export function track(footprint: Footprint): void {
  queue.push(footprint);
  if (queue.length >= FLUSH_AT_COUNT) {
    void flushFootprints();
  } else if (timer === null) {
    timer = setTimeout(() => void flushFootprints(), FLUSH_AFTER_MS);
  }
}

export async function flushFootprints(): Promise<void> {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  const batch = queue.splice(0, MAX_BATCH);
  if (batch.length === 0) return;
  try {
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return; // signed out: drop, never store or retry
    await fetch(`${API_URL}/v1/footprints`, {
      method: "POST",
      keepalive: true, // lets a final flush survive page navigation
      headers: requestHeaders({ token, json: true }),
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    // Telemetry must never surface an error to the user.
  }
}
