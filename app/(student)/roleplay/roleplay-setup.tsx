"use client";

// Choosing a scenario and difficulty before the conversation starts.

import Link from "next/link";
import { useState } from "react";
import { whenLabel } from "@/lib/when";
import {
  RoleplayScenarioPicker,
  RoleplaySummary,
  type Difficulty,
  type RoleplayHome,
  type RoleplayScenario,
} from "@/features/roleplay";

export function RoleplaySetup({
  scenarios,
  speechAvailable,
  busy,
  error,
  history,
  exampleHistory = false,
  onStart,
}: {
  scenarios: RoleplayScenario[];
  speechAvailable: boolean;
  busy: boolean;
  error: string | null;
  history: RoleplayHome["history"];
  /** The history shown is a worked example, not this person's own. */
  exampleHistory?: boolean;
  onStart: (scenarioId: string, difficulty: Difficulty) => void;
}) {
  const [selected, setSelected] = useState<string | null>(scenarios[0]?.id ?? null);
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
          AI Roleplay
        </p>
        <h1 className="mt-1 text-2xl font-bold text-brand-ink">Practise a real conversation</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Pick a situation. You&apos;ll record your side of the conversation, hear the other
          person reply, and get specific feedback afterwards — not a live phone call, but a
          back-and-forth you can repeat until it sticks.
        </p>
        {!speechAvailable && (
          <p className="mt-2 text-xs text-slate-500">
            Voice is unavailable right now — you can still do this by typing.
          </p>
        )}
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </p>
      )}

      <RoleplayScenarioPicker
        scenarios={scenarios}
        selected={selected}
        difficulty={difficulty}
        onSelect={setSelected}
        onDifficulty={setDifficulty}
      />

      <button
        type="button"
        disabled={!selected || busy}
        onClick={() => selected && onStart(selected, difficulty)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-violet px-6 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Starting…" : "Start the conversation →"}
      </button>

      {history.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-surface p-4">
          <summary className="cursor-pointer text-sm font-bold text-brand-ink">
            {exampleHistory ? "See what feedback looks like" : "Your last conversation"}
          </summary>
          <div className="mt-4">
            {exampleHistory && (
              <p className="mb-3 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">
                Example — not your own work
              </p>
            )}
            <RoleplaySummary summary={history[0]!.summary} scenarioTitle={history[0]!.scenarioTitle} />
          </div>
        </details>
      )}

      {!exampleHistory && history.some((h) => h.id) && (
        <section aria-labelledby="past-roleplays" className="rounded-2xl border border-slate-200 bg-surface p-4">
          <h2 id="past-roleplays" className="text-sm font-bold text-brand-ink">Your past conversations</h2>
          <ul className="mt-2 grid gap-1">
            {history.filter((h) => h.id).map((h) => (
              <li key={h.id}>
                <Link href={`/roleplay/report/${h.id}`} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 text-[0.85rem] hover:bg-slate-50">
                  <span className="min-w-0">
                    <span className="font-semibold text-brand-ink">{h.scenarioTitle}</span>
                    <span className="ml-2 text-[0.75rem] text-slate-500">{whenLabel(h.completedAt)}</span>
                  </span>
                  <span className="shrink-0 text-[0.8rem] font-semibold text-teal-700">
                    {h.summary.score ? `${Math.round(h.summary.score.overall)} / 100 · ` : ""}Open report →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
