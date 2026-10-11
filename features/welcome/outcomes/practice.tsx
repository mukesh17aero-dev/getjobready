"use client";

// Worked outputs: the question library and practice.

// ---------------------------------------------------- question library
// The three screens the question library walkthrough describes.

import { Check } from "@/components/ui/icons";
/** Search, filters, and cards that say where you stand. */
export function PracticeLibrary() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[0.75rem] text-slate-500">
        Search questions…
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {[
          ["Everything", false],
          ["HR round", true],
          ["Handling conflict", false],
        ].map(([label, on]) => (
          <span
            key={label as string}
            className={`rounded-full px-2 py-0.5 text-[0.75rem] font-semibold ${
              on
                ? "bg-brand-teal-deep text-white"
                : "bg-surface text-slate-600 ring-1 ring-inset ring-slate-300"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {[
          {
            q: "A customer asks for something the policy does not allow.",
            note: "You never said what happened to the customer in the end.",
            chip: "Went badly",
            tone: "bg-rose-50 text-rose-800 ring-rose-500/25",
            story: true,
          },
          {
            q: "Give me an example of a mistake you made.",
            note: "Whether you can name a real one.",
            chip: "Never answered",
            tone: "bg-slate-100 text-slate-600 ring-slate-400/25",
            story: false,
          },
          {
            q: "Describe a time you had more to do than time to do it in.",
            note: "Whether you prioritise deliberately or simply go faster.",
            chip: "Never answered",
            tone: "bg-slate-100 text-slate-600 ring-slate-400/25",
            story: true,
          },
          {
            q: "Explain something you understand well to someone who does not.",
            note: "Whether you can be plain without being rude about it.",
            chip: "Solid",
            tone: "bg-teal-50 text-teal-800 ring-teal-600/25",
            story: false,
          },
        ].map((c) => (
          <li
            key={c.q}
            className="flex flex-col rounded-lg border border-slate-200 p-2.5"
          >
            <span className="text-[0.75rem] font-bold uppercase tracking-wide text-slate-500">
              HR round
            </span>
            <span className="mt-0.5 text-[0.75rem] font-bold leading-snug text-brand-ink">
              {c.q}
            </span>
            <span className="mt-1 text-[0.75rem] leading-snug text-slate-500">
              {c.note}
            </span>
            <span className="mt-auto flex flex-wrap items-center gap-1 pt-1.5">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.75rem] font-bold uppercase tracking-wide ring-1 ring-inset ${c.tone}`}
              >
                {c.chip}
              </span>
              {c.story && (
                <span className="rounded-full bg-brand-violet/10 px-1.5 py-0.5 text-[0.75rem] font-semibold text-brand-violet-deep">
                  You have a story
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Answering one: what it is testing, and a box to say it in. */
export function PracticeAnswer() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        HR round · Taking ownership
      </p>
      <p className="mt-0.5 text-[0.85rem] font-bold leading-snug text-brand-ink">
        Give me an example of a mistake you made.
      </p>
      <p className="mt-1 text-[0.75rem] leading-snug text-slate-600">
        <strong className="font-semibold text-brand-ink">
          What it is testing:
        </strong>{" "}
        Whether you can name a real one. An answer with no mistake in it is the
        wrong answer.
      </p>
      <div className="mt-2 min-h-[4.5rem] rounded-lg border border-slate-300 px-2.5 py-2 text-[0.75rem] leading-relaxed text-slate-500">
        Two tickets went onto the wrong account mid-shift. I caught it at the
        handover and flagged it myself rather than waiting to be asked…
      </div>
      <p className="mt-1 text-[0.75rem] text-slate-500">
        Long enough. One note comes back, not a report.
      </p>
      <span className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-brand-teal-deep px-3 text-[0.75rem] font-bold text-white">
        <Check size={11} />
        See how it landed
      </span>
    </div>
  );
}

/** What comes back. One note - or nothing, which is a real answer. */
export function PracticeNote() {
  return (
    <div className="grid gap-2">
      <div className="rounded-xl border border-brand-violet/30 bg-brand-violet/[0.06] p-3">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-brand-violet-deep">
          One thing
        </p>
        <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-700">
          You said you caught it and fixed it, but never said what it cost — an
          interviewer will ask whether the customer noticed, and the answer to
          that is the whole story.
        </p>
      </div>

      <div className="rounded-xl border border-brand-teal/40 bg-teal-50/60 p-3">
        <p className="text-[0.8rem] font-bold text-brand-ink">
          That would hold up.
        </p>
        <p className="mt-0.5 text-[0.75rem] leading-relaxed text-slate-700">
          An interviewer would move on rather than press. Nothing to change.
        </p>
      </div>

      <p className="text-[0.75rem] leading-snug text-slate-500">
        Sometimes there is nothing to say, and saying so is better than
        manufacturing a criticism. Your answer is kept either way.
      </p>
    </div>
  );
}
