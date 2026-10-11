"use client";

// Worked outputs: the resume and the interview.

import { A4Frame, ResumeSheet } from "@/features/resume";
import { SAMPLE_ATS, EXAMPLE_RESUME, SAMPLE_REVIEW } from "@/features/resume";
import { Check } from "@/components/ui/icons";
import { SAMPLE_INTERVIEW } from "@/features/interview";
import { InterviewSummary } from "@/features/interview";
export function ResumeOutcome({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "grid gap-3"
          : "grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]"
      }
    >
      <div>
        {/* The builder's own preview box: one A4 page tall and scrolled, not
            grown. ResumeSheet paginates itself, so an unconstrained container
            lets it spill onto a second, blank sheet. */}
        <div className="relative mx-auto aspect-[1/1.414] w-full max-w-sm overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white shadow-sm">
          <A4Frame className="-mt-[2.6rem]">
            <ResumeSheet
              resume={EXAMPLE_RESUME}
              template="classic"
              roleLine="Customer Success Associate"
              mini
            />
          </A4Frame>
        </div>
        <p className="mt-1.5 text-center text-[0.75rem] uppercase tracking-[0.15em] text-slate-500">
          Example — not a real person
        </p>
      </div>

      <div className="min-w-0 space-y-2.5">
        <div className="rounded-xl border border-teal-600/25 bg-teal-50/60 px-3.5 py-2.5">
          <p className="text-[0.75rem] font-bold uppercase tracking-wide text-teal-800">
            Read by the filter — {SAMPLE_ATS.found.length} role keywords found
          </p>
          <p className="mt-1 text-[0.76rem] leading-snug text-teal-900">
            {SAMPLE_ATS.found.join(" · ")}
          </p>
        </div>

        {SAMPLE_ATS.problems.map((p) => (
          <div
            key={p.what}
            className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5"
          >
            <span aria-hidden className="mt-0.5 font-bold text-amber-700">
              !
            </span>
            <span className="min-w-0">
              <span className="block text-[0.78rem] font-semibold text-amber-900">
                {p.what}
              </span>
              <span className="mt-0.5 block text-[0.76rem] leading-relaxed text-amber-800">
                {p.why}
              </span>
            </span>
          </div>
        ))}

        <div className="rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5">
          <p className="text-[0.75rem] font-bold uppercase tracking-wide text-brand-teal-deep">
            Where this stands · {SAMPLE_REVIEW.standing.level}
          </p>
          <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-600">
            {SAMPLE_REVIEW.standing.why}
          </p>
        </div>

        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-slate-500">
            What works
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {SAMPLE_REVIEW.strengths.map((x) => (
              <li
                key={x}
                className="flex gap-2 text-[0.78rem] leading-snug text-slate-600"
              >
                <span className="mt-1 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                  <Check size={8} />
                </span>
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-slate-500">
            What to fix, and how
          </p>
          <ul className="mt-1.5 space-y-2">
            {SAMPLE_REVIEW.gaps.map((g) => (
              <li
                key={g.what}
                className="rounded-lg border border-slate-200 bg-surface px-3 py-2"
              >
                <span className="block text-[0.78rem] font-semibold text-brand-ink">
                  {g.what}
                </span>
                <span className="mt-0.5 block text-[0.76rem] leading-snug text-slate-500">
                  {g.how}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Scribe: asking for a change in words and watching the page change. */
export function ResumeScribe() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-3.5">
      <h4 className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
        Work on it with Scribe
      </h4>

      {/* A conversation, drawn the way the builder draws it: your ask on the
          right, Scribe's answer on the left, and the undo that goes with it.
          The earlier version showed a menu of phrasings, which is the one
          thing Scribe is not - there is nothing to pick from. */}
      <ol className="mt-2.5 grid gap-2">
        <li className="grid gap-1.5">
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-3 py-2 text-[0.75rem] leading-relaxed text-teal-900">
            Move the college fest above the store job
          </p>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-3 py-2">
            <p className="text-[0.75rem] leading-relaxed text-slate-700">
              Done — the placement drive is now your first entry and the store
              job sits under it. The dates still read correctly.
            </p>
            <span
              aria-hidden
              className="mt-1 grid h-6 w-6 place-items-center rounded-full text-slate-500"
              title="Undo this change"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5A5.5 5.5 0 0 1 20 14.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
            </span>
          </div>
        </li>
        <li className="grid gap-1.5">
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-3 py-2 text-[0.75rem] leading-relaxed text-teal-900">
            Add that I handled about 60 customers a day
          </p>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-3 py-2">
            <p className="text-[0.75rem] leading-relaxed text-slate-700">
              Added to the store job. Make sure you can stand behind that number
              in the interview.
            </p>
          </div>
        </li>
      </ol>

      {/* The box itself: a text area you type into, send inside it bottom
          right, exactly where a chat box puts it. */}
      <div className="relative mt-2.5">
        <div className="min-h-[3.6rem] w-full rounded-xl border border-slate-300 py-2 pl-2.5 pr-11 text-[0.75rem] leading-relaxed text-slate-500">
          This bullet is not true — take it out
        </div>
        <span
          aria-hidden
          className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-brand-violet text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </span>
      </div>
      <p className="mt-1 text-[0.75rem] text-slate-500">
        Enter to send, Shift + Enter for a new line.
      </p>
    </div>
  );
}

function Mic() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </svg>
  );
}

export function InterviewSetup() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-2.5 shadow-sm">
      {/* The green room, as the app draws it: your side dark, the mic question
          settled before the clock starts. */}
      <div className="rounded-xl bg-brand-panel p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.75rem] font-bold text-white/85">You</p>
          <span className="flex items-center gap-1.5 text-[0.75rem] font-bold uppercase tracking-wide text-white/60">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-white/40"
            />
            Not checked
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 py-2 text-center">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-[0.8rem] font-bold text-white/85"
          >
            A
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[0.75rem] font-semibold text-white/90">
            <Mic />
            Check my microphone
          </span>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
            Round
          </p>
          <div className="mt-1 flex gap-1">
            {[
              ["HR round", true],
              ["Managerial", false],
            ].map(([label, on]) => (
              <span
                key={label as string}
                className={`flex-1 rounded-md px-1.5 py-1 text-center text-[0.75rem] font-semibold ${
                  on
                    ? "bg-brand-teal-deep text-white"
                    : "bg-brand-mist text-slate-500"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
            Your interviewer
          </p>
          <div className="mt-1 flex gap-1">
            {[
              ["Asha", true],
              ["Ravi", false],
            ].map(([name, on]) => (
              <span
                key={name as string}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[0.75rem] font-semibold ${
                  on
                    ? "bg-brand-mist text-brand-ink ring-1 ring-brand-teal"
                    : "bg-brand-mist text-slate-500"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-4 w-4 place-items-center rounded-full text-[0.75rem] font-bold ${
                    on
                      ? "bg-brand-teal-deep text-white"
                      : "bg-slate-300 text-slate-600"
                  }`}
                >
                  {(name as string)[0]}
                </span>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-2 text-[0.75rem] leading-snug text-slate-600">
        Practising for{" "}
        <strong className="font-semibold text-brand-ink">
          Customer Success Associate
        </strong>
        . 10 minutes, up to ten questions, ends on time.
      </p>

      {/* The button the real page ends on, and the line under it. Without the
          call to act this stops being the screen and becomes a diagram of it. */}
      <span className="mt-2 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full bg-brand-teal-deep px-4 text-[0.76rem] font-bold text-white shadow-sm">
        <Mic />
        Join the interview
      </span>
      <p className="mt-1.5 text-center text-[0.75rem] text-slate-500">
        No mic today?{" "}
        <span className="font-semibold text-slate-600 underline underline-offset-2">
          Type your answers instead
        </span>
      </p>
    </div>
  );
}

/** The voice half of an interview: question, microphone, live transcript. */
export function InterviewAudio() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        Question 2 of 6
      </p>
      <p className="mt-1 text-[0.85rem] font-semibold leading-snug text-brand-ink">
        A customer asks for a refund outside policy. What do you do?
      </p>

      <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-brand-mist px-3 py-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-teal-deep text-white">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
          </svg>
        </span>
        {/* A level meter, not an animation: it says the microphone is open. */}
        <span aria-hidden className="flex flex-1 items-end gap-[3px]">
          {[7, 13, 20, 11, 24, 16, 9, 18, 12, 22, 8, 15, 10, 19].map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-brand-teal"
              style={{ height: `${h}px`, opacity: 0.35 + (h / 24) * 0.65 }}
            />
          ))}
        </span>
        <span className="shrink-0 text-[0.75rem] font-bold text-brand-teal-deep">
          Listening
        </span>
      </div>

      <p className="mt-2.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[0.76rem] leading-snug text-slate-500">
        &ldquo;I&rsquo;d ask what they actually needed first, because a refund
        is not always the thing they came for…&rdquo;
      </p>
      <p className="mt-1.5 text-[0.75rem] text-slate-500">
        Answer out loud or type — the transcript is kept either way, and the
        feedback quotes what you actually said.
      </p>
    </div>
  );
}

/** Reading an existing resume: upload, parse, fields filled in. */
export function ResumeRead() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-brand-teal/50 bg-brand-mist px-3 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-teal-deep text-white">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4m0 0L8 8m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-[0.8rem] font-semibold text-brand-ink">
            Reading your resume…
          </span>
          <span className="block text-[0.75rem] text-slate-500">
            PDF, Word or a LinkedIn export
          </span>
        </span>
      </div>

      <p className="mt-2.5 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        Found and filled in
      </p>
      <ul className="mt-1.5 grid gap-1">
        {[
          ["Name and contact", "A. Sample · Coimbatore"],
          ["Most recent role", "Sales Assistant, regional apparel chain"],
          ["Dates", "Jan 2025 - Mar 2026"],
          ["Skills", "Complaint handling, POS, returns"],
        ].map(([k, v]) => (
          <li
            key={k}
            className="flex items-start gap-2 rounded-lg bg-brand-mist px-2.5 py-1.5"
          >
            <span className="mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
              <Check size={8} />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.75rem] font-semibold text-brand-ink">
                {k}
              </span>
              <span className="block truncate text-[0.75rem] text-slate-500">
                {v}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.75rem] text-slate-500">
        Nothing is retyped. Anything it could not find is asked for, and only
        that.
      </p>
    </div>
  );
}

/** The interview read-out, through the same component the app shows it with. */
export function InterviewOutcome() {
  const past = SAMPLE_INTERVIEW[0];
  return (
    // Given the panel's own width and left to breathe: the read-out is the
    // longest thing in any walkthrough, and cramming it makes the one section
    // somebody most wants to read the hardest one to.
    <div className="rounded-xl border border-slate-200 bg-surface p-3.5 [&_h2]:text-[0.95rem] [&_h3]:text-[0.82rem] [&_li]:leading-relaxed [&_p]:leading-relaxed">
      <InterviewSummary summary={past.summary} roleTitle={past.roleTitle} />
      <p className="mt-2 text-center text-[0.75rem] uppercase tracking-[0.15em] text-slate-500">
        Example — not a real person
      </p>
    </div>
  );
}
