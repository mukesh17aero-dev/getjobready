"use client";

// The list of interviews already sat.

import { type InterviewHome } from "@/features/interview";
import { whenLabel } from "@/lib/when";
import { InterviewSummary } from "@/features/interview";
import { ChevronIcon } from "./interview-chrome";
export function PastInterviews({
  history,
  open,
  onToggle,
  example = false,
}: {
  history: InterviewHome["history"];
  open: number | null;
  onToggle: (index: number) => void;
  /**
   * Signed out, this shelf holds one worked example instead of nothing.
   * Labelled as such on the heading and again on the card - somebody must
   * never be able to mistake it for something they did.
   */
  example?: boolean;
}) {
  if (history.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="flex flex-wrap items-center gap-2 text-[0.8rem] font-bold uppercase tracking-wide text-brand-ink">
        {example ? "What you get afterwards" : "Your past interviews"}
        {example && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-800">
            Example
          </span>
        )}
      </h2>
      {example && (
        <p className="mt-1 text-[0.8rem] leading-snug text-slate-500">
          One finished interview, opened up. Yours is written from your own
          answers — this one belongs to nobody.
        </p>
      )}
      {/* A grid of cards rather than a stack of rows: past interviews are
          things to glance across, and a card each is how a shelf reads.
          The one being read opens to the full width - a transcript in a
          third of the page would be a letterbox. */}
      <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {history.map((past, i) => (
          <div
            key={`${past.completedAt}-${i}`}
            className={`rounded-2xl border border-slate-200 bg-surface ${
              open === i ? "sm:col-span-2 lg:col-span-3" : ""
            }`}
          >
            <div className="flex flex-col items-start gap-2.5 px-4 py-3.5">
              <span className="min-w-0 self-stretch">
                <span className="block text-[0.9rem] font-semibold leading-tight text-brand-ink">
                  {past.roleTitle}
                </span>
                <span className="mt-1.5 block">
                  <span className="rounded-full bg-brand-teal-deep/10 px-2 py-0.5 text-[0.7rem] font-semibold text-teal-700">
                    {past.round === "managerial" ? "Managerial" : "HR"} round
                  </span>
                </span>
                <span className="mt-1.5 block text-[0.72rem] text-slate-400">
                  {whenLabel(past.completedAt)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onToggle(i)}
                aria-expanded={open === i}
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-brand-teal-deep/50 px-4 text-[0.78rem] font-bold text-teal-700 transition-colors hover:bg-teal-50 motion-reduce:transition-none"
              >
                {open === i ? "Hide feedback" : "View feedback"}
                <ChevronIcon
                  className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
            {open === i && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                {/* The read-out first: it is why anyone opens this. The
                    transcript is underneath and folded away - the questions
                    are already quoted in the feedback, so reading them twice
                    buries the part worth reading. */}
                <InterviewSummary
                  summary={past.summary}
                  roleTitle={past.roleTitle}
                  turns={past.turns}
                />
                <details className="group mt-5 border-t border-slate-200 pt-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-[0.8rem] font-semibold text-slate-500 [&::-webkit-details-marker]:hidden">
                    Read the whole interview
                    <ChevronIcon className="h-3.5 w-3.5 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <div className="mt-3 grid gap-3">
                    {past.turns.map((turn, ti) => (
                      <div key={ti}>
                        <p className="text-[0.8rem] font-semibold text-brand-ink">
                          {turn.question}
                        </p>
                        {turn.answer && (
                          <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-[0.8rem] leading-relaxed text-slate-600">
                            {turn.answer}
                          </p>
                        )}
                        {turn.closing && (
                          <p className="mt-1 text-[0.8rem] italic text-teal-700">
                            {turn.closing}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>

                {/* The last thing on the page is the thing to do next. */}
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-bold text-brand-ink transition-colors hover:border-slate-400 motion-reduce:transition-none"
                  >
                    Retake interview
                  </button>
                  <p className="text-xs text-slate-500">
                    Your next interview will check on these areas.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
