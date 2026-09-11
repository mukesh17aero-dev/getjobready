"use client";

// The visible half of exam lockdown. Two jobs: tell somebody the rules before
// the sitting rather than by punishing them mid-answer, and say something
// specific when a restriction fires.
//
// The tone matters more than it looks. A student who pastes out of habit and
// is met with "BLOCKED" learns that the product suspects them. The same person
// met with "pasting is off for this sitting" learns a rule. Only one of those
// is recoverable.

export type LockdownWarning = {
  text: string;
  /** Bumped per occurrence so a repeat of the same warning re-announces. */
  seq: number;
} | null;

export function LockdownBanner({
  warning,
  fullscreen,
  canFullscreen,
  onFullscreen,
}: {
  warning: LockdownWarning;
  fullscreen: boolean;
  canFullscreen: boolean;
  onFullscreen: () => void;
}) {
  return (
    <div className="mb-3 space-y-2">
      {/* Only offered where it exists. On iPhone the Fullscreen API covers
          <video> only, so a button here would be a button that does nothing. */}
      {canFullscreen && !fullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3.5 py-2.5">
          <p className="text-[0.82rem] text-amber-950">
            This sitting runs fullscreen.
          </p>
          <button
            type="button"
            onClick={onFullscreen}
            className="inline-flex min-h-11 items-center rounded-lg bg-amber-900 px-3.5 text-[0.8rem] font-semibold text-white"
          >
            Go fullscreen
          </button>
        </div>
      )}

      {/* Announced politely: it is information, not an alarm, and an alarm
          role would interrupt a screen reader mid-sentence while typing. */}
      <p aria-live="polite" className="sr-only">
        {warning?.text ?? ""}
      </p>
      {warning && (
        <div
          key={warning.seq}
          className="rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-[0.82rem] text-slate-700"
        >
          {warning.text}
        </div>
      )}
    </div>
  );
}

/** The rules, said once, before the first scene. */
export function LockdownRules() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[0.78rem] font-bold uppercase tracking-wide text-slate-500">
        How this sitting runs
      </p>
      <ul className="mt-2 space-y-1.5 text-[0.84rem] leading-snug text-slate-700">
        <li>Copy and paste are off. Write your answer here.</li>
        <li>It runs fullscreen where your device supports it.</li>
        <li>
          Leaving the tab is noted — not to catch you out, but because a result
          should say how it was produced.
        </li>
        <li>
          Where a scene says the assistant is available, using it is expected,
          not a penalty.
        </li>
      </ul>
    </div>
  );
}
