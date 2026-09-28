"use client";

// The roleplay state machine: setup ↔ room ↔ feedback.

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useSignUpGate } from "@/components/auth/signup-gate";
import {
  startRoleplay,
  type Difficulty,
  type RoleplayHome,
  type RoleplaySessionView,
  type RoleplaySummaryView,
} from "@/features/roleplay";
import { RoleplaySetup } from "./roleplay-setup";
import { RoleplayRoom } from "./roleplay-room";
import { RoleplayFeedback } from "./roleplay-feedback";

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export function RoleplayFlow({
  initial,
  signedIn,
  exampleHistory = false,
}: {
  initial: RoleplayHome;
  signedIn: boolean;
  /** The history in `initial` is a worked example, not this person's own. */
  exampleHistory?: boolean;
}) {
  const { guard, prompt } = useSignUpGate(signedIn);
  const [session, setSession] = useState<RoleplaySessionView | null>(initial.session);
  const [view, setView] = useState<"setup" | "room" | "feedback">(
    initial.session && initial.session.status === "in_progress" ? "room" : "setup",
  );
  const [summary, setSummary] = useState<RoleplaySummaryView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = (scenarioId: string, difficulty: Difficulty) => {
    guard(
      {
        what: "this roleplay",
        why: "The conversation is generated for you as you go, and your feedback afterwards is saved so you can see what changed next time. That needs an account to sit in.",
      },
      () => void reallyStart(scenarioId, difficulty),
    );
  };

  const reallyStart = async (scenarioId: string, difficulty: Difficulty) => {
    setBusy(true);
    setError(null);
    const t = await token();
    const started = t ? await startRoleplay(t, { scenarioId, difficulty }) : null;
    setBusy(false);
    if (!started) {
      setError("We could not start the conversation. Check your connection and try again.");
      return;
    }
    setSession(started);
    setView("room");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {view === "setup" && (
        <RoleplaySetup
          scenarios={initial.scenarios}
          speechAvailable={initial.speechAvailable}
          busy={busy}
          error={error}
          history={initial.history}
          exampleHistory={exampleHistory}
          onStart={start}
        />
      )}
      {view === "room" && session && (
        <RoleplayRoom
          session={session}
          speechAvailable={initial.speechAvailable}
          getToken={token}
          onSessionUpdate={setSession}
          onFinished={(s) => {
            setSummary(s);
            setView("feedback");
          }}
          onLeft={() => {
            setSession(null);
            setView("setup");
          }}
        />
      )}
      {view === "feedback" && summary && session && (
        <RoleplayFeedback
          summary={summary}
          scenarioTitle={session.scenarioTitle}
          onRetry={() => {
            setSession(null);
            setSummary(null);
            setView("setup");
          }}
        />
      )}
      {prompt}
    </main>
  );
}
