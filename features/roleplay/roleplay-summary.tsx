// The roleplay feedback: fair, specific, grounded in what was actually said.
// Teal marks what the person earned; scores below the bar read as amber, not
// as failure — a rehearsal, not a hiring decision.

import type { RoleplaySummaryView } from "./roleplay-api";

export function RoleplaySummary({
  summary,
  scenarioTitle,
  onRetry,
}: {
  summary: RoleplaySummaryView;
  scenarioTitle: string;
  /** Try this scenario again. Omitted where the page places the action itself. */
  onRetry?: () => void;
}) {
  const score = summary.score;
  const cleared = score ? score.overall >= score.bar : false;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
          Your roleplay feedback
        </p>
        <h1 className="mt-1 text-2xl font-bold text-brand-ink">
          How your {scenarioTitle.toLowerCase()} conversation went
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Everything below comes from what you actually said in this conversation — nothing else.
        </p>
      </header>

      {score ? (
        <section
          aria-label="Your score"
          className={`rounded-2xl border p-5 sm:flex sm:items-center sm:gap-6 ${cleared ? "border-brand-teal/40 bg-teal-50" : "border-amber-200 bg-amber-50"}`}
        >
          <p className="flex shrink-0 items-baseline gap-1">
            <span className={`text-5xl font-bold tracking-tight ${cleared ? "text-teal-700" : "text-amber-800"}`}>
              {score.overall}
            </span>
            <span className="text-sm font-semibold text-slate-500">/ 100</span>
          </p>
          <div className="mt-3 sm:mt-0">
            <h2 className="text-[0.75rem] font-bold uppercase tracking-wide text-slate-600">
              Your score for this rehearsal
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              The score a conversation needs to hold up as a real handling of this situation is{" "}
              <strong className="text-brand-ink">{score.bar}</strong>: every part of the rubric
              mostly there.{" "}
              {cleared
                ? "You cleared it this time."
                : `You are ${score.bar - score.overall} under it this time, and the ratings below say where.`}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Scored by a fixed rule from the feedback&apos;s ratings. A score for this rehearsal,
              not a judgement of you.
            </p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-surface p-4">
          <h2 className="text-[0.75rem] font-bold uppercase tracking-wide text-teal-700">
            What went well
          </h2>
          <ul className="mt-2.5 space-y-2">
            {summary.strengths.map((point) => (
              <li key={point} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <span aria-hidden className="mt-0.5 font-bold text-teal-600">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-surface p-4">
          <h2 className="text-[0.75rem] font-bold uppercase tracking-wide text-slate-500">
            What to improve
          </h2>
          <ul className="mt-2.5 space-y-2">
            {summary.improvements.map((point) => (
              <li key={point} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <span aria-hidden className="mt-0.5 text-slate-500">
                  →
                </span>
                {point}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-brand-violet/40 bg-violet-50 p-4">
          <h2 className="text-[0.75rem] font-bold uppercase tracking-wide text-violet-700">
            Focus on this next
          </h2>
          <p className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-700">
            {summary.focusNext}
          </p>
        </section>
      </div>

      {score && score.perCriterion.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold text-brand-ink">What we looked for</h2>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="How this score was made">
            {score.perCriterion.map((c) => (
              <li
                key={c.id}
                className={`rounded-md border px-2.5 py-1.5 text-[0.75rem] font-semibold ${c.rating >= 2 ? "border-teal-200 text-teal-700" : "border-amber-200 text-amber-800"}`}
              >
                {c.label} {c.rating}/3
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {onRetry ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-bold text-brand-ink transition-colors hover:border-slate-400 motion-reduce:transition-none"
          >
            Try another scenario
          </button>
          <p className="text-xs text-slate-500">Saved to your record.</p>
        </div>
      ) : null}
    </div>
  );
}
