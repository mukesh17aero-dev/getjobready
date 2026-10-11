"use client";

// Worked outputs: ATS, kept sections, fit actions and answers.

// ---------------------------------------------------------------- added
// One per feature whose walkthrough had three pictures and eight tabs, so
// five of the eight repeated a picture the reader had already seen. A tab
// that shows the same thing again teaches nothing and costs the reader the
// seven seconds it holds the panel.

import { Check } from "@/components/ui/icons";
import { SAMPLE_ATS } from "@/features/resume";
/** The applicant-tracking check: what a filter reads, and what it trips on. */
export function ResumeAts() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
          Screening check
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[0.75rem] font-bold text-teal-800">
          <Check size={10} />
          Machine readable
        </span>
      </div>

      <p className="mt-2.5 text-[0.75rem] font-semibold text-slate-500">
        Skills the filter found
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {SAMPLE_ATS.found.slice(0, 6).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-brand-mist px-2 py-0.5 text-[0.75rem] font-medium text-slate-600"
          >
            {skill}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[0.75rem] font-semibold text-slate-500">
        What it would trip on
      </p>
      <ul className="mt-1.5 grid gap-1.5">
        {SAMPLE_ATS.problems.slice(0, 2).map((problem) => (
          <li
            key={problem.what}
            className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5"
          >
            <span className="block text-[0.75rem] font-semibold text-amber-900">
              {problem.what}
            </span>
            <span className="mt-0.5 block text-[0.75rem] leading-snug text-amber-800">
              {problem.why}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.75rem] text-slate-500">
        Every build is checked. Nothing is changed without you saying so.
      </p>
    </div>
  );
}

/** Nothing on the profile is yours until you keep it, section by section. */
export function ProfileKeep() {
  const rows: Array<[string, "kept" | "waiting"]> = [
    ["Headline", "kept"],
    ["About", "kept"],
    ["Experience", "waiting"],
    ["Skills", "waiting"],
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        Yours only when you say so
      </p>
      <ul className="mt-2 grid gap-1.5">
        {rows.map(([name, state]) => (
          <li
            key={name}
            className="flex items-center justify-between gap-3 rounded-lg bg-brand-mist px-2.5 py-2"
          >
            <span className="text-[0.75rem] font-semibold text-brand-ink">
              {name}
            </span>
            {state === "kept" ? (
              <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-teal-700">
                <Check size={10} />
                Kept
              </span>
            ) : (
              <span className="inline-flex h-6 items-center rounded-md bg-brand-violet px-2.5 text-[0.75rem] font-bold text-white">
                Keep
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[0.75rem] leading-snug text-slate-500">
        Two sections kept, two still drafts. A draft is never on your profile
        and never sent anywhere.
      </p>
    </div>
  );
}

/** What to change before you apply, in the order that moves the number. */
export function FitActions() {
  const moves: Array<[string, string]> = [
    ["Name the billing system by its name", "The ad asks for it twice"],
    ["Add the shift-work line to your summary", "It is a stated requirement"],
    ["Drop the school prizes", "Nothing in the ad asks for them"],
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
          Before you apply
        </p>
        <span className="text-[0.75rem] font-semibold text-slate-500">
          3 changes
        </span>
      </div>
      <ol className="mt-2 grid gap-1.5">
        {moves.map(([what, why], i) => (
          <li
            key={what}
            className="flex gap-2.5 rounded-lg bg-brand-mist px-2.5 py-2"
          >
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-teal/20 text-[0.75rem] font-bold text-brand-teal-deep">
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[0.75rem] font-semibold text-brand-ink">
                {what}
              </span>
              <span className="block text-[0.75rem] text-slate-500">{why}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[0.75rem] text-slate-500">
        Taken from the advert you pasted, not from a general checklist.
      </p>
    </div>
  );
}

/** What you actually said, read back with the marks on it. */
export function InterviewAnswer() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        Your answer, read back
      </p>
      <p className="mt-2 rounded-lg bg-brand-mist px-3 py-2 text-[0.75rem] leading-relaxed text-slate-700">
        &ldquo;There was a delivery that went missing and the customer was
        <mark className="bg-teal-100 text-teal-900"> really angry</mark>, so I
        checked the tracking and{" "}
        <mark className="bg-teal-100 text-teal-900">called the hub myself</mark>
        , and then I told her what happened.&rdquo;
      </p>
      <ul className="mt-2 grid gap-1.5">
        {[
          ["Kept", "You said what you did, not what the team did"],
          ["Add", "How it ended - did she get the parcel?"],
          ["Cut", "Three 'so I' in one sentence; slow down"],
        ].map(([mark, note]) => (
          <li key={mark} className="flex gap-2">
            <span
              className={`mt-0.5 grid h-4 w-9 shrink-0 place-items-center rounded text-[0.75rem] font-bold uppercase ${
                mark === "Kept"
                  ? "bg-teal-100 text-teal-800"
                  : mark === "Add"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {mark}
            </span>
            <span className="text-[0.75rem] leading-snug text-slate-600">
              {note}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A story, tightened - and the same story kept for reuse. */
export function StoryRefine() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        Before
      </p>
      <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[0.75rem] leading-relaxed text-slate-500 line-through decoration-slate-300">
        I helped out a lot at the shop and customers were happy with me.
      </p>
      <p className="mt-2.5 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-brand-teal-deep dark:text-brand-teal-soft">
        After
      </p>
      <p className="mt-1.5 rounded-lg border border-brand-teal/40 bg-teal-50/60 px-2.5 py-2 text-[0.75rem] leading-relaxed text-slate-700">
        Ran the counter alone through the festival rush, about 60 customers a
        day, and settled billing disputes without calling the owner in.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {["Pressure", "Ownership", "Customer conflict"].map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-brand-mist px-2 py-0.5 text-[0.75rem] font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[0.75rem] text-slate-500">
        Tagged, so the same story comes back for every question it answers.
      </p>
    </div>
  );
}

/** What changed between the first attempt and the last. */
export function PracticeProgress() {
  const rows: Array<[string, number, number]> = [
    ["Said what you did", 2, 4],
    ["Gave the outcome", 1, 4],
    ["Kept it under a minute", 3, 4],
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
          Across four attempts
        </p>
        <span className="text-[0.75rem] font-semibold text-slate-500">
          first &rarr; last
        </span>
      </div>
      <ul className="mt-2.5 grid gap-2.5">
        {rows.map(([label, from, to]) => (
          <li key={label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[0.75rem] font-semibold text-brand-ink">
                {label}
              </span>
              <span className="text-[0.75rem] font-semibold text-teal-700">
                {from} &rarr; {to}
              </span>
            </div>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  aria-hidden
                  className={`h-1.5 flex-1 rounded-full ${
                    n <= from
                      ? "bg-brand-teal"
                      : n <= to
                        ? "bg-brand-teal/35"
                        : "bg-slate-100"
                  }`}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[0.75rem] text-slate-500">
        Kept per question, so you can see whether practising is working.
      </p>
    </div>
  );
}

/** How the work was done with the assistant beside it, which is measured too. */
export function ReadinessAiUse() {
  const rows: Array<[string, string, boolean]> = [
    ["Asked it twice, in your own words", "Situation 2", true],
    ["Took the answer and reworked it", "Situation 2", true],
    ["Did not reach for it at all", "Situation 4", false],
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        How you worked with the assistant
      </p>
      <p className="mt-2 text-[0.75rem] leading-relaxed text-slate-600">
        Using it is expected, and how you use it is part of the reading -
        employers hire people who work well with these tools, not people who
        avoid them.
      </p>
      <ul className="mt-2.5 grid gap-1.5">
        {rows.map(([what, where, good]) => (
          <li
            key={what}
            className="flex items-center justify-between gap-3 rounded-lg bg-brand-mist px-2.5 py-2"
          >
            <span className="min-w-0">
              <span className="block text-[0.75rem] font-semibold text-brand-ink">
                {what}
              </span>
              <span className="block text-[0.75rem] text-slate-500">
                {where}
              </span>
            </span>
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.75rem] font-bold ${
                good
                  ? "bg-teal-100 text-teal-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {good ? <Check size={10} /> : "-"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.75rem] text-slate-500">
        Taking an answer whole and taking it apart read differently, and both
        are recorded.
      </p>
    </div>
  );
}
