"use client";

import { useEffect, useState } from "react";
import { Check } from "@/components/icons";

// The pause between finishing Discovery and seeing the result.
//
// The match scores are arithmetic and could show instantly, but the personal
// read-out ("Why this suits you") is written, and lands a beat later. Roles
// appearing first with their reasons popping in afterwards read as a page
// loading broken — so the whole result now arrives at once, and this screen
// owns the wait. The narration advances line by line so nobody wonders if it
// is stuck; it holds on the last line however long the writing takes.
//
// Violet marks throughout: this is Ascend working, not something earned.

const STEPS = [
  "Reading your answers…",
  "Weighing the moments you chose…",
  "Lining up your three closest matches…",
  "Writing why each one suits you…",
  "Checking it against what you told us…",
];

// The first visit really does take ~20–30s: the read-out is written by a
// model, fresh, from this person's answers. The pacing spreads the five
// lines across that wait so the screen keeps visibly moving through it —
// a narration that finishes in 7 seconds of a 25-second wait reads as hung
// for the remaining 18.
const STEP_MS = 4500;

export function BuildingMatches() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      STEP_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-md flex-col justify-center px-4 pb-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-teal-deep">
        Discovery
      </p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
        Building your matches
      </h1>
      {/* The list is decoration for the eye; the one live line below it is
          what a screen reader hears, so it is not read the whole list over
          again on every tick. */}
      <ul aria-hidden className="mt-5 grid gap-2.5">
        {STEPS.map((label, i) => {
          const done = i < step;
          const now = i === step;
          return (
            <li key={label} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {done ? (
                  <span className="text-brand-violet">
                    <Check size={14} />
                  </span>
                ) : now ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-violet border-t-transparent motion-reduce:animate-none" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </span>
              <span
                className={`text-[0.92rem] transition-colors duration-300 ${
                  now
                    ? "font-semibold text-slate-900"
                    : done
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      {/* The honest expectation, stated up front. A wait someone was warned
          about is a process; the same wait unannounced is a hang. */}
      <p className="mt-5 text-[0.8rem] leading-relaxed text-slate-400">
        Your read-out is written fresh from your answers — this takes about
        half a minute the first time. After that it opens instantly.
      </p>
      <p role="status" className="sr-only">
        {STEPS[step]}
      </p>
    </main>
  );
}
