// The interview read-out: fair, specific, grounded in what was actually
// said. Teal marks what the person earned; the companion's pointers to what
// to do next carry the violet guidance colour. Weak skills point at Practice
// missions — the read-out's one call to action.
//
// The verdict is a trio of cards - went well, to improve, focus next - and
// the question-by-question detail folds away behind native accordions.

import Link from "next/link";
import type { InterviewSummaryView } from "@/lib/interview-api";

export function InterviewSummary({
  summary,
  roleTitle,
  turns,
  onRetake,
}: {
  summary: InterviewSummaryView;
  roleTitle: string;
  /** The interview's own turns: the read-out quotes the question as it was
      actually asked rather than the model's shorthand for it. */
  turns?: Array<{ index: number; question: string }>;
  /** Start a fresh interview. Omitted where the page places the action
      itself - in the past-interview list it belongs below the transcript. */
  onRetake?: () => void;
}) {
  const askedQuestion = (index: number | undefined) =>
    typeof index === "number"
      ? turns?.find((turn) => turn.index === index)?.question
      : undefined;
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
          Your interview read-out
        </p>
        <h1 className="mt-1 text-2xl font-bold text-brand-ink">
          How your {roleTitle} practice went
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Everything below comes from what you actually said in this interview - nothing else.
        </p>
      </header>

      {summary.progressNote ? (
        <div className="rounded-2xl border border-brand-teal/40 bg-teal-50 p-4">
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-teal-700">
            Progress you have earned
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
            {summary.progressNote}
          </p>
        </div>
      ) : null}

      {/* The verdict, as a trio. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-surface p-4">
          <h2 className="text-[0.72rem] font-bold uppercase tracking-wide text-teal-700">
            What went well
          </h2>
          <ul className="mt-2.5 space-y-2">
            {summary.wentWell.map((point) => (
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
          <h2 className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-500">
            What to improve
          </h2>
          <ul className="mt-2.5 space-y-2">
            {summary.toImprove.map((point) => (
              <li key={point} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <span aria-hidden className="mt-0.5 text-slate-400">
                  →
                </span>
                {point}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-brand-violet/40 bg-violet-50 p-4">
          <h2 className="text-[0.72rem] font-bold uppercase tracking-wide text-violet-700">
            Focus on this next
          </h2>
          <p className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-700">
            {summary.focusNext}
          </p>
        </section>
      </div>

      {summary.perQuestion.length > 0 ? (
        <section>
          <h2 className="text-sm font-bold text-brand-ink">Question by question</h2>
          <ol className="mt-3 space-y-2">
            {summary.perQuestion.map((entry, i) => (
              <li key={`${entry.index ?? "x"}-${i}`}>
                <details className="group rounded-2xl border border-slate-200 bg-surface">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-500">
                        Question {i + 1}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-brand-ink">
                        {askedQuestion(entry.index) ?? entry.question}
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                    <p className="text-sm leading-relaxed text-slate-700">
                      <span className="font-semibold text-teal-700">Strength:</span>{" "}
                      {entry.strength}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      <span className="font-semibold text-brand-ink">Try:</span>{" "}
                      {entry.improvement}
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {summary.growthAreas.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-surface p-5">
          <h2 className="text-sm font-bold text-brand-ink">Skills to build</h2>
          <ul className="mt-3 space-y-3">
            {summary.growthAreas.map((area) => (
              <li key={area.skill} className="text-sm leading-relaxed text-slate-700">
                <span className="font-semibold text-brand-ink">{area.skill}</span> -{" "}
                {area.note}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            These are exactly what Practice missions are built for - real workplace
            situations where you build the skill by using it.
          </p>
          <Link
            href="/practice"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white transition-colors hover:bg-brand-teal motion-reduce:transition-none"
          >
            Close the gap in Practice →
          </Link>
        </section>
      ) : null}

      {onRetake ? (
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-bold text-brand-ink transition-colors hover:border-slate-400 motion-reduce:transition-none"
        >
          Retake interview
        </button>
        <p className="text-xs text-slate-500">
          Saved to your record - your next interview will check on these areas.
        </p>
      </div>
      ) : null}
    </div>
  );
}
