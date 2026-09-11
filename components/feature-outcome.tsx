"use client";

import { A4Frame, ResumeSheet } from "@/components/resume-builder";
import { InterviewSummary } from "@/components/interview-summary";
import { Check, Clock } from "@/components/icons";
import { PayProgression } from "@/components/pay-progression";
import { FitRadar, ReadinessRing } from "@/components/fit-chart";
import { LinkedInPreview } from "@/components/linkedin-preview";
import { RoleBrief } from "@/components/role-brief";
import {
  SAMPLE_PROFILE,
  SAMPLE_JOB_FIT,
  SAMPLE_FIT,
  SAMPLE_GROWTH,
  SAMPLE_PAY_NOTE,
  SAMPLE_VOICE,
  SAMPLE_ATS,
  SAMPLE_INTERVIEW,
  SAMPLE_RESUME,
  SAMPLE_REVIEW,
} from "@/lib/samples";

// What a feature hands back, rendered by the components that actually hand it
// back. One copy, used by the walkthrough panel on a landing page and by the
// worked example at the foot of the builder.
//
// The rule these exist to keep: a marketing surface may not draw its own
// version of the product's output. The moment it does, the two drift, and the
// page is promising a document the app no longer produces.

/** The resume, its applicant-tracking check and the written review. */
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
              resume={SAMPLE_RESUME}
              template="classic"
              roleLine="Customer Success Associate"
              mini
            />
          </A4Frame>
        </div>
        <p className="mt-1.5 text-center text-[0.55rem] uppercase tracking-[0.15em] text-slate-400">
          Example — not a real person
        </p>
      </div>

      <div className="min-w-0 space-y-2.5">
        <div className="rounded-xl border border-teal-600/25 bg-teal-50/60 px-3.5 py-2.5">
          <p className="text-[0.72rem] font-bold uppercase tracking-wide text-teal-800">
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
          <p className="text-[0.72rem] font-bold uppercase tracking-wide text-brand-teal-deep">
            Where this stands · {SAMPLE_REVIEW.standing.level}
          </p>
          <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-600">
            {SAMPLE_REVIEW.standing.why}
          </p>
        </div>

        <div>
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-slate-400">
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
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-slate-400">
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
      <h4 className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
        Work on it with Scribe
      </h4>

      {/* A conversation, drawn the way the builder draws it: your ask on the
          right, Scribe's answer on the left, and the undo that goes with it.
          The earlier version showed a menu of phrasings, which is the one
          thing Scribe is not - there is nothing to pick from. */}
      <ol className="mt-2.5 grid gap-2">
        <li className="grid gap-1.5">
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-3 py-2 text-[0.74rem] leading-relaxed text-teal-900">
            Move the college fest above the store job
          </p>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-3 py-2">
            <p className="text-[0.74rem] leading-relaxed text-slate-700">
              Done — the placement drive is now your first entry and the store
              job sits under it. The dates still read correctly.
            </p>
            <span
              aria-hidden
              className="mt-1 grid h-6 w-6 place-items-center rounded-full text-slate-400"
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
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-3 py-2 text-[0.74rem] leading-relaxed text-teal-900">
            Add that I handled about 60 customers a day
          </p>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-3 py-2">
            <p className="text-[0.74rem] leading-relaxed text-slate-700">
              Added to the store job. Make sure you can stand behind that number
              in the interview.
            </p>
          </div>
        </li>
      </ol>

      {/* The box itself: a text area you type into, send inside it bottom
          right, exactly where a chat box puts it. */}
      <div className="relative mt-2.5">
        <div className="min-h-[3.6rem] w-full rounded-xl border border-slate-300 py-2 pl-2.5 pr-11 text-[0.74rem] leading-relaxed text-slate-400">
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
      <p className="mt-1 text-[0.64rem] text-slate-400">
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
          <p className="text-[0.68rem] font-bold text-white/85">You</p>
          <span className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-wide text-white/60">
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-semibold text-white/90">
            <Mic />
            Check my microphone
          </span>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Round
          </p>
          <div className="mt-1 flex gap-1">
            {[
              ["HR round", true],
              ["Managerial", false],
            ].map(([label, on]) => (
              <span
                key={label as string}
                className={`flex-1 rounded-md px-1.5 py-1 text-center text-[0.66rem] font-semibold ${
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
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Your interviewer
          </p>
          <div className="mt-1 flex gap-1">
            {[
              ["Asha", true],
              ["Ravi", false],
            ].map(([name, on]) => (
              <span
                key={name as string}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[0.66rem] font-semibold ${
                  on
                    ? "bg-brand-mist text-brand-ink ring-1 ring-brand-teal"
                    : "bg-brand-mist text-slate-400"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-4 w-4 place-items-center rounded-full text-[0.55rem] font-bold ${
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

      <p className="mt-2 text-[0.7rem] leading-snug text-slate-600">
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
      <p className="mt-1.5 text-center text-[0.66rem] text-slate-500">
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
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
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
        <span className="shrink-0 text-[0.68rem] font-bold text-brand-teal-deep">
          Listening
        </span>
      </div>

      <p className="mt-2.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[0.76rem] leading-snug text-slate-500">
        &ldquo;I&rsquo;d ask what they actually needed first, because a refund
        is not always the thing they came for…&rdquo;
      </p>
      <p className="mt-1.5 text-[0.68rem] text-slate-400">
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
          <span className="block text-[0.7rem] text-slate-500">
            PDF, Word or a LinkedIn export
          </span>
        </span>
      </div>

      <p className="mt-2.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
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
              <span className="block text-[0.7rem] font-semibold text-brand-ink">
                {k}
              </span>
              <span className="block truncate text-[0.7rem] text-slate-500">
                {v}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.68rem] text-slate-400">
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
      <p className="mt-2 text-center text-[0.55rem] uppercase tracking-[0.15em] text-slate-400">
        Example — not a real person
      </p>
    </div>
  );
}

// ------------------------------------------------------------- discovery
// Discovery has no single artefact the way a resume does - it is a question,
// a tour and a shortlist. All three are drawn from the flow's own wording.

/** Picking industries, then the questions that narrow them. */
export function DiscoveryIndustries() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.8rem] font-bold text-brand-ink">
        Which of these interest you?
      </p>
      <p className="mt-0.5 text-[0.68rem] text-slate-500">
        Tap as many as you like.
      </p>
      <ul className="mt-2 grid gap-1.5">
        {[
          {
            t: "Retail & Commerce",
            c: "Stores, sales, category, operations",
            g: "\u{1F6CD}\u{FE0F}",
            tint: "244 114 182",
            on: true,
          },
          {
            t: "Logistics & E-commerce",
            c: "Fulfilment, planning, partner ops",
            g: "\u{1F4E6}",
            tint: "45 212 191",
            on: false,
          },
          {
            t: "Customer Operations",
            c: "Support, quality, workforce",
            g: "\u{1F3A7}",
            tint: "167 139 250",
            on: true,
          },
        ].map((w) => (
          <li
            key={w.t}
            className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 ${
              w.on ? "border-brand-teal bg-teal-50/60" : "border-slate-200"
            }`}
          >
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base"
              style={{ background: `rgb(${w.tint} / 0.14)` }}
            >
              {w.g}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.75rem] font-bold leading-tight text-brand-ink">
                {w.t}
              </span>
              <span className="block text-[0.65rem] leading-snug text-slate-500">
                {w.c}
              </span>
            </span>
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                w.on
                  ? "border-brand-teal bg-brand-teal text-white"
                  : "border-slate-300 text-transparent"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
            </span>
          </li>
        ))}
      </ul>
      <span className="mt-2.5 flex min-h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 px-4 text-[0.74rem] font-bold text-white">
        Show me all roles <span aria-hidden>{"\u2192"}</span>
      </span>
    </div>
  );
}

export function DiscoveryShortlist() {
  return (
    <div>
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
        Where you have been
      </p>
      <p className="mt-0.5 font-display text-[1rem] font-bold leading-tight text-brand-ink">
        Did you find your dream role?
      </p>
      <ul className="mt-2 grid gap-2">
        {[
          {
            t: "Customer Success Associate",
            note: "Liked that the whole job is being the one who actually sorts it out.",
            chosen: true,
          },
          {
            t: "Operations Coordinator",
            note: "The stock side sounded fine. The supplier calls did not.",
          },
          {
            t: "Guest Experience Executive",
            note: "Shifts would be the hard part for me.",
          },
        ].map((r) => (
          <li
            key={r.t}
            className="rounded-xl border border-slate-200 bg-surface px-3 py-2.5"
          >
            <p className="text-[0.78rem] font-bold text-brand-ink">{r.t}</p>
            <p className="mt-0.5 text-[0.72rem] leading-snug text-slate-600">
              &ldquo;{r.note}&rdquo;
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[0.68rem] font-bold ${
                r.chosen
                  ? "bg-brand-teal text-white"
                  : "border border-slate-300 text-brand-ink"
              }`}
            >
              {r.chosen ? "Your selected role" : "Choose this role"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[0.66rem] text-slate-400">
        Example — the words would be your own.
      </p>

      {/* And the read-out that comes with the role you pick. The product's own
          component again, so the panel cannot promise a shape the app does not
          produce. */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-surface p-3">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-teal-800">
          Why this role fits you
        </p>
        <div className="mt-1.5">
          <RoleBrief brief={SAMPLE_FIT} />
        </div>
      </div>
    </div>
  );
}

/** The tour stop: a role, the assistant beside it, and the note you leave. */
export function DiscoveryTour() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
      <div className="border-b border-slate-200 bg-brand-mist px-3 py-2">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Stop 2 of 3
        </p>
        <p className="text-[0.85rem] font-bold leading-snug text-brand-ink">
          Operations Coordinator
        </p>
      </div>

      <div className="space-y-2 p-3">
        <div className="rounded-lg bg-brand-mist px-2.5 py-2">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Discovery assistant
          </p>
          <p className="mt-1 text-[0.72rem] leading-snug text-slate-500">
            Ask me whenever you want.
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {["What does good look like here?", "Where does this lead?"].map(
              (q) => (
                <span
                  key={q}
                  className="rounded-full bg-surface px-2 py-0.5 text-[0.65rem] font-semibold text-brand-teal-deep ring-1 ring-inset ring-slate-200"
                >
                  {q}
                </span>
              ),
            )}
          </div>
        </div>

        <div>
          <p className="text-[0.72rem] font-semibold text-brand-ink">
            What do you make of this role?
          </p>
          <p className="mt-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[0.72rem] italic text-slate-400">
            Honestly, what stood out was…
          </p>
        </div>

        <div className="flex gap-1.5">
          <span className="rounded-lg bg-brand-teal-deep px-2.5 py-1.5 text-[0.7rem] font-bold text-white">
            On to the next one
          </span>
          <span className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[0.7rem] font-bold text-slate-500">
            Choose this role
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * A role, as the role page shows it: what it pays now, what it pays later, and
 * somebody who has done it. PayProgression is the product's own chart rather
 * than a drawing of one - the same rule the resume sheet follows.
 */
export function DiscoveryRole() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.82rem] font-bold leading-snug text-brand-ink">
        Customer Success Associate
      </p>
      <p className="text-[0.66rem] text-slate-400">Customer Operations</p>

      <p className="mt-2.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-slate-400">
        Pay and career growth{" "}
        <span className="font-medium normal-case tracking-normal text-slate-400">
          · monthly, indicative
        </span>
      </p>
      <div className="mt-1.5">
        <PayProgression growth={SAMPLE_GROWTH} />
      </div>
      <p className="mt-1.5 text-[0.64rem] leading-snug text-slate-400">
        {SAMPLE_PAY_NOTE}
      </p>

      <p className="mt-3 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-slate-400">
        People doing this job
      </p>
      {/* The warning travels with the quote. An invented person shown without
          it is fabricated social proof, whatever the intention was. */}
      <p className="mt-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[0.63rem] leading-snug text-slate-600">
        <strong className="font-semibold">Illustrative:</strong> a composite
        written from the pay and progression data above, not a real individual.
      </p>
      <div className="mt-1.5 rounded-xl bg-slate-50 p-2.5">
        <p className="text-[0.72rem] italic leading-relaxed text-slate-700">
          &ldquo;{SAMPLE_VOICE.quote}&rdquo;
        </p>
        <p className="mt-1 text-[0.66rem] font-semibold text-slate-700">
          {SAMPLE_VOICE.name}{" "}
          <span className="font-normal text-slate-500">
            · {SAMPLE_VOICE.title}
          </span>
        </p>
        <p className="text-[0.62rem] text-slate-400">{SAMPLE_VOICE.journey}</p>
      </div>
    </div>
  );
}

/** The assistant, mid-tour: a real conversation, not a menu of prompts. */
export function DiscoveryChat() {
  const said = [
    {
      who: "assistant",
      text: "This tells you what the job is. It does not tell you where it goes afterwards, or what the pay does past the first step. Ask me either.",
    },
    { who: "you", text: "What does good look like here?" },
    {
      who: "assistant",
      text: "Closing your own tickets without escalating, and being the one people hand the angry customer to. Both are noticed within a year.",
    },
    { who: "you", text: "Where does this lead?" },
    {
      who: "assistant",
      text: "Team lead is the usual next step, and quality or workforce planning after that. It does not lead into engineering - if that is where you are aiming, this is a detour.",
    },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
      <div className="border-b border-slate-200 bg-brand-mist px-3 py-1.5">
        <span className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-slate-400">
          Stop 2 of 3
        </span>
        <p className="text-[0.78rem] font-bold leading-snug text-brand-ink">
          Operations Coordinator
        </p>
      </div>

      <ol className="grid gap-2 p-3">
        {said.map((line, i) => (
          <li
            key={i}
            className={line.who === "you" ? "flex justify-end" : "flex gap-1.5"}
          >
            {line.who === "assistant" && (
              <span
                aria-hidden
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-violet text-[0.55rem] font-bold text-white"
              >
                A
              </span>
            )}
            <p
              className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[0.71rem] leading-relaxed ${
                line.who === "you"
                  ? "rounded-tr-sm bg-teal-50 text-slate-700"
                  : "rounded-tl-sm border border-slate-200 text-slate-800"
              }`}
            >
              {line.text}
            </p>
          </li>
        ))}
      </ol>

      <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {["What would put me off it?", "What does it pay past year two?"].map(
            (q) => (
              <span
                key={q}
                className="rounded-full border border-slate-300 bg-surface px-2.5 py-1 text-[0.65rem] font-semibold text-slate-700"
              >
                {q}
              </span>
            ),
          )}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <span className="min-h-7 flex-1 rounded-full border border-slate-300 bg-surface px-3 py-1 text-[0.7rem] text-slate-400">
            Ask anything…
          </span>
          <span className="rounded-full border border-slate-300 bg-surface px-3 py-1 text-[0.7rem] font-bold text-slate-700">
            Ask
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------- story bank
// The three screens the Story Bank walkthrough describes. The sample stories
// are the same ones a signed-out visitor sees on the page itself, so the
// panel and the product cannot drift apart.

/** The question list: what they ask, and whether you have anything for it. */
export function StoryQuestions() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex gap-1 border-b border-slate-200 pb-1.5">
        <span className="rounded-t px-2 py-1 text-[0.65rem] font-bold text-slate-400">
          My stories (2)
        </span>
        <span className="border-b-2 border-brand-teal-deep px-2 py-1 text-[0.65rem] font-bold text-brand-ink">
          What they will ask (14)
        </span>
      </div>
      <ul className="mt-2 grid gap-1.5">
        {[
          {
            q: "A customer asks for something the policy does not allow.",
            meta: "HR round · Handling conflict",
            have: "You would tell: The refund I could not give",
            chip: "Proven",
            tone: "bg-teal-50 text-teal-800",
            cta: "Build another",
            solid: false,
          },
          {
            q: "Give me an example of a mistake you made.",
            meta: "HR round · Taking ownership",
            have: "Whether you can name a real one.",
            chip: "Nothing yet",
            tone: "bg-slate-100 text-slate-600",
            cta: "Build a story",
            solid: true,
          },
          {
            q: "How do you go about picking up a system you have never used?",
            meta: "HR round · Learning quickly",
            have: "Whether you have a method, or you just hope.",
            chip: "Nothing yet",
            tone: "bg-slate-100 text-slate-600",
            cta: "Build a story",
            solid: true,
          },
        ].map((r) => (
          <li
            key={r.q}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[0.58rem] font-bold uppercase tracking-wide text-slate-400">
                {r.meta}
              </span>
              <span className="block text-[0.76rem] font-semibold leading-snug text-brand-ink">
                {r.q}
              </span>
              <span className="block text-[0.68rem] leading-snug text-slate-500">
                {r.have}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide ${r.tone}`}
            >
              {r.chip}
            </span>
            <span
              className={`shrink-0 rounded-md px-2 py-1 text-[0.65rem] font-bold ${
                r.solid
                  ? "bg-brand-teal-deep text-white"
                  : "border border-slate-300 text-brand-ink"
              }`}
            >
              {r.cta}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The drafter, mid-refusal: it fills what it can and names what it will not. */
export function StoryDrafter() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Building a story for
      </p>
      <p className="text-[0.8rem] font-bold leading-snug text-brand-ink">
        Give me an example of a mistake you made.
      </p>

      <div className="mt-2 rounded-lg border border-slate-200 p-2.5">
        <p className="text-[0.78rem] font-bold text-brand-ink">
          The two tickets I filed wrong
        </p>
        <dl className="mt-1.5 grid gap-1.5">
          {[
            [
              "Situation",
              "Mid-shift, two tickets went onto the wrong customer account.",
              true,
            ],
            [
              "Task",
              "Left blank on purpose — your record does not say, and I am not going to make it up.",
              false,
            ],
            [
              "Action",
              "I spotted it at the next handover, flagged it myself rather than waiting to be asked, and corrected both.",
              true,
            ],
            [
              "Result",
              "Left blank on purpose — I know what you did, not what happened afterwards.",
              false,
            ],
          ].map(([label, text, filled]) => (
            <div
              key={label as string}
              className="border-l-2 border-brand-violet/35 pl-2"
            >
              <dt className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                {label}
              </dt>
              <dd
                className={`mt-0.5 text-[0.72rem] leading-snug ${
                  filled ? "text-slate-700" : "italic text-amber-800"
                }`}
              >
                {text}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-1.5 text-[0.64rem] text-slate-400">
          Drawn from: Busy shift simulation
        </p>
      </div>

      <p className="mt-2 rounded-lg bg-brand-mist px-2.5 py-2 text-[0.7rem] leading-snug text-slate-600">
        Read it, then say it out loud once in your own words. A story you have
        only read is a script.
      </p>
      <span className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-brand-teal-deep px-3 text-[0.7rem] font-bold text-white">
        <Check size={11} />I have said it — keep it
      </span>
    </div>
  );
}

/** The bank itself: one open, the rest collapsed, each marked for what it is. */
export function StoryGrid() {
  return (
    <div className="grid gap-2">
      <div className="rounded-xl border-2 border-brand-violet/50 bg-surface p-3">
        <p className="text-[0.58rem] font-bold uppercase tracking-wide text-brand-violet-deep">
          Handling conflict
        </p>
        <p className="mt-0.5 text-[0.82rem] font-bold leading-snug text-brand-ink">
          The refund I could not give
        </p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {[
            [
              "Situation",
              "She wanted a refund eleven days in, after someone else quoted her fourteen.",
            ],
            [
              "Task",
              "Hold the policy without making her feel she had been lied to.",
            ],
            [
              "Action",
              "I said the earlier answer had been wrong and apologised for that specifically.",
            ],
            ["Result", "She took the credit note and stayed."],
          ].map(([label, text]) => (
            <div key={label} className="rounded-lg bg-brand-mist p-2">
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                {label}
              </p>
              <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-700">
                {text}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-teal-800 ring-1 ring-inset ring-teal-600/25">
            Proven
          </span>
          <span className="text-[0.65rem] text-slate-500">
            Customer Success interview · HR round
          </span>
        </div>
      </div>

      {[
        {
          comp: "Working under pressure",
          title: "The Saturday I ran the counter alone",
          line: "Sixty customers between eleven and four, and no billing errors.",
          chip: "Yours, unproven",
          tone: "bg-amber-50 text-amber-900 ring-amber-600/25",
          from: "Your experience, as you told us",
        },
        {
          comp: "Taking ownership",
          title: "The two tickets I filed wrong",
          line: "Spotted it at handover and flagged it myself.",
          chip: "Not said yet",
          tone: "bg-slate-100 text-slate-600 ring-slate-400/25",
          from: "Busy shift simulation",
        },
      ].map((c) => (
        <div
          key={c.title}
          className="rounded-xl border border-slate-200 bg-surface p-2.5"
        >
          <p className="text-[0.58rem] font-bold uppercase tracking-wide text-brand-violet-deep">
            {c.comp}
          </p>
          <p className="mt-0.5 text-[0.78rem] font-bold leading-snug text-brand-ink">
            {c.title}
          </p>
          <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-500">
            {c.line}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide ring-1 ring-inset ${c.tone}`}
            >
              {c.chip}
            </span>
            <span className="text-[0.65rem] text-slate-500">{c.from}</span>
          </div>
        </div>
      ))}
      <p className="text-[0.66rem] text-slate-400">
        Example — yours would be written from your own record.
      </p>
    </div>
  );
}

// ---------------------------------------------------- question library
// The three screens the question library walkthrough describes.

/** Search, filters, and cards that say where you stand. */
export function PracticeLibrary() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[0.72rem] text-slate-400">
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
            className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
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
            <span className="text-[0.55rem] font-bold uppercase tracking-wide text-slate-400">
              HR round
            </span>
            <span className="mt-0.5 text-[0.74rem] font-bold leading-snug text-brand-ink">
              {c.q}
            </span>
            <span className="mt-1 text-[0.66rem] leading-snug text-slate-500">
              {c.note}
            </span>
            <span className="mt-auto flex flex-wrap items-center gap-1 pt-1.5">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide ring-1 ring-inset ${c.tone}`}
              >
                {c.chip}
              </span>
              {c.story && (
                <span className="rounded-full bg-brand-violet/10 px-1.5 py-0.5 text-[0.55rem] font-semibold text-brand-violet-deep">
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
      <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        HR round · Taking ownership
      </p>
      <p className="mt-0.5 text-[0.85rem] font-bold leading-snug text-brand-ink">
        Give me an example of a mistake you made.
      </p>
      <p className="mt-1 text-[0.7rem] leading-snug text-slate-600">
        <strong className="font-semibold text-brand-ink">
          What it is testing:
        </strong>{" "}
        Whether you can name a real one. An answer with no mistake in it is the
        wrong answer.
      </p>
      <div className="mt-2 min-h-[4.5rem] rounded-lg border border-slate-300 px-2.5 py-2 text-[0.72rem] leading-relaxed text-slate-500">
        Two tickets went onto the wrong account mid-shift. I caught it at the
        handover and flagged it myself rather than waiting to be asked…
      </div>
      <p className="mt-1 text-[0.64rem] text-slate-500">
        Long enough. One note comes back, not a report.
      </p>
      <span className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-brand-teal-deep px-3 text-[0.7rem] font-bold text-white">
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
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-violet-deep">
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
        <p className="mt-0.5 text-[0.74rem] leading-relaxed text-slate-700">
          An interviewer would move on rather than press. Nothing to change.
        </p>
      </div>

      <p className="text-[0.66rem] leading-snug text-slate-400">
        Sometimes there is nothing to say, and saying so is better than
        manufacturing a criticism. Your answer is kept either way.
      </p>
    </div>
  );
}

// -------------------------------------------------------------- job fit
// The product's own ring and radar on the worked example, so the panel and
// the page cannot show different shapes.

const FIT_TONE: Record<string, string> = {
  proof: "bg-teal-50 text-teal-800 ring-teal-600/25",
  claim: "bg-amber-50 text-amber-900 ring-amber-600/25",
  gap: "bg-slate-100 text-slate-600 ring-slate-400/25",
};
const FIT_WORD: Record<string, string> = {
  proof: "Proven",
  claim: "Claimed",
  gap: "Nothing yet",
};

/** Paste the posting. It refuses a job title rather than guessing at one. */
export function FitPaste() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.8rem] font-bold text-brand-ink">
        Am I ready for this job?
      </p>
      <div className="mt-2 min-h-[5rem] rounded-lg border border-slate-300 px-2.5 py-2 text-[0.7rem] leading-relaxed text-slate-500">
        Customer Success Associate — Bengaluru
        <br />• Handle 40-60 customer queries a day over calls and email
        <br />• Own escalations end to end and keep the customer informed
        <br />• Maintain CRM records accurately
      </div>
      <p className="mt-1 text-[0.64rem] text-slate-500">
        A job title on its own is not enough to check you against.
      </p>
      <span className="mt-2 inline-flex min-h-8 items-center rounded-lg bg-brand-teal-deep px-3 text-[0.7rem] font-bold text-white">
        Check my fit
      </span>
    </div>
  );
}

/** The lines, and why the middle one is the point. */
export function FitLines() {
  return (
    <div>
      <ul className="grid gap-1.5">
        {SAMPLE_JOB_FIT.requirements.map((r) => (
          <li
            key={r.need}
            className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-surface px-2.5 py-2"
          >
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide ring-1 ring-inset ${FIT_TONE[r.state]}`}
            >
              {FIT_WORD[r.state]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.74rem] font-semibold leading-snug text-brand-ink">
                {r.need}
              </span>
              <span className="block text-[0.66rem] leading-snug text-slate-500">
                {r.note}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[0.7rem] leading-snug text-amber-900">
        <strong className="font-semibold">
          Two things here are claimed and not proven.
        </strong>{" "}
        In an interview those are the questions you will be asked and cannot
        answer.
      </p>
    </div>
  );
}

/** The ring and the radar, drawn by the components the page itself uses. */
export function FitDashboard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.78rem] font-bold text-brand-ink">
        {SAMPLE_JOB_FIT.roleTitle}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3">
        <div className="text-center">
          <ReadinessRing value={SAMPLE_JOB_FIT.readiness} />
          <p className="mt-0.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Readiness
          </p>
        </div>
        <div className="min-w-[11rem] flex-1">
          <p className="text-center text-[0.62rem] font-bold text-slate-500">
            You against what this job asks
          </p>
          <FitRadar axes={SAMPLE_JOB_FIT.axes} />
          <div className="mt-0.5 flex justify-center gap-2.5 text-[0.58rem] font-semibold">
            <span className="flex items-center gap-1 text-teal-800">
              <span
                aria-hidden
                className="h-2 w-2 rounded-sm bg-brand-teal-deep"
              />
              You
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span aria-hidden className="h-2 w-2 rounded-sm bg-slate-400" />
              This job
            </span>
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-[0.74rem] font-semibold leading-snug text-brand-ink">
        {SAMPLE_JOB_FIT.verdict}
      </p>
      <p className="mt-1 text-[0.64rem] leading-snug text-slate-400">
        Readiness for this posting, from your own record. It is not a chance of
        being hired — nobody can tell you that.
      </p>
      <p className="mt-1.5 text-[0.64rem] text-slate-400">
        Example — yours would be measured against your own record.
      </p>
    </div>
  );
}

// ------------------------------------------------------- profile builder

/** The sentence everything else is written from. */
export function ProfileIdentity() {
  return (
    <div className="rounded-xl border border-brand-teal/40 bg-teal-50/50 p-3">
      <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-teal-800">
        Who you are, professionally
      </p>
      <p className="mt-1 font-display text-[0.92rem] font-bold leading-snug text-brand-ink">
        {SAMPLE_PROFILE.identity}
      </p>
      <p className="mt-1.5 text-[0.7rem] leading-snug text-slate-600">
        Everything below follows from this one sentence. If it is wrong, nothing
        under it will be right — rewrite rather than patching the sections.
      </p>
      <p className="mt-1.5 text-[0.66rem] text-slate-500">
        Written from 9 things on your record, 4 of them proven.
      </p>
    </div>
  );
}

/** Scribe on the left, the profile as LinkedIn shows it on the right. */
export function ProfileCompare() {
  return (
    <div className="grid gap-2">
      <div className="rounded-xl border border-slate-200 bg-surface p-2.5">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-violet-deep">
          Work on it with Scribe
        </p>
        <div className="mt-1.5 grid gap-1.5">
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-2.5 py-1.5 text-[0.7rem] leading-relaxed text-teal-900">
            The About is too long — cut it to three sentences
          </p>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-2.5 py-1.5">
            <p className="text-[0.7rem] leading-relaxed text-slate-700">
              Done — it opens with the simulation now and the store job is one
              sentence.
            </p>
          </div>
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-2.5 py-1.5 text-[0.7rem] leading-relaxed text-teal-900">
            Say I led a team of ten
          </p>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-2.5 py-1.5">
            <p className="text-[0.7rem] leading-relaxed text-slate-700">
              I have left that out.
            </p>
            <p className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-[0.66rem] leading-snug text-amber-900">
              Nothing in your record says you led anybody. Tell me who and when
              and I will put it in.
            </p>
          </div>
        </div>
        <div className="relative mt-1.5">
          <div className="min-h-[2.2rem] rounded-lg border border-slate-300 py-1.5 pl-2 pr-9 text-[0.68rem] text-slate-400">
            Put the store job in the headline
          </div>
          <span
            aria-hidden
            className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-brand-violet text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </span>
        </div>
      </div>

      <div className="scale-[0.92] origin-top">
        <LinkedInPreview draft={SAMPLE_PROFILE.suggested} name="Anjali Kumar" />
      </div>
      <p className="text-[0.64rem] text-slate-400">
        Example — yours would be written from your own record.
      </p>
    </div>
  );
}

/** Skills, and the sections it declines to write. */
export function ProfileSkills() {
  return (
    <div className="grid gap-2">
      <div className="rounded-xl border border-slate-200 bg-surface p-3">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Yours now
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {["MS Office", "Communication", "Leadership", "Hardworking"].map(
            (s) => (
              <span
                key={s}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-500 line-through"
              >
                {s}
              </span>
            ),
          )}
        </div>
        <p className="mt-1.5 text-[0.66rem] leading-snug text-slate-500">
          Three of these nobody can check, and one is not a skill.
        </p>

        <p className="mt-2.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-teal-800">
          Written from your record
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {(SAMPLE_PROFILE.suggested.skills ?? []).map((s) => (
            <span
              key={s}
              className="rounded-full bg-teal-50 px-2 py-0.5 text-[0.65rem] font-semibold text-teal-800"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <p className="rounded-xl bg-amber-50 px-3 py-2 text-[0.7rem] leading-snug text-amber-900">
        <strong className="font-semibold">Where it declines to write:</strong> a
        section your record cannot support comes back empty and says so, rather
        than being filled with something that sounds right.
      </p>
    </div>
  );
}

// ---- role readiness assessment --------------------------------------------
//
// Three close-ups of the one feature under Practice that is actually built: a
// situation as it arrives, the help beside it, and the reading that comes back.
//
// Everything here is drawn with the same tokens as the real screens, and the
// content is illustrative - it is a worked example belonging to nobody, which
// is what the panel's caption says. No score is presented as anybody's, and no
// count of users appears, because those are the two places a preview turns
// into a claim.

/** A situation, as it lands: a day, a company, and something that happened. */
export function ReadinessScene() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Zolvit Technologies · Day 8
        </p>
        <span className="inline-flex items-center gap-1 text-[0.62rem] font-semibold tabular-nums text-slate-500">
          <Clock size={10} />
          14:12 left
        </span>
      </div>
      <p className="mt-0.5 text-[0.85rem] font-bold leading-snug text-brand-ink">
        The refund you cannot give.
      </p>
      <p className="mt-1 text-[0.7rem] leading-snug text-slate-600">
        A customer wants a refund eleven days into a fourteen-day window, and
        the courier note says the item arrived damaged. The policy covers one of
        those two things. Handle it.
      </p>
      <div className="mt-2 min-h-[3.6rem] rounded-lg border border-slate-300 px-2.5 py-2 text-[0.72rem] leading-relaxed text-slate-500">
        Thanks for calling, and I am sorry the blender turned up in that state.
        The damage is on the courier note, so this one is on us either way…
      </div>
      <p className="mt-1 text-[0.64rem] text-slate-500">
        What you write is the answer. Nothing here is multiple choice.
      </p>
    </div>
  );
}

/** The help beside the work, and the fact that using it is counted, not penalised. */
export function ReadinessHelp() {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/45 px-2.5 py-1 text-[0.66rem] font-bold text-brand-teal-deep">
          Ask Priya
          <span className="rounded-full bg-brand-teal/20 px-1.5 text-[0.6rem]">
            2 left
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-violet/45 px-2.5 py-1 text-[0.66rem] font-bold text-brand-violet-deep">
          Ask the AI assistant
          <span className="rounded-full bg-brand-violet/20 px-1.5 text-[0.6rem]">
            3 left
          </span>
        </span>
      </div>
      <div className="rounded-xl border border-slate-200 bg-surface p-3">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-teal-deep">
          Priya · two years in this job
        </p>
        <div className="mt-2 grid gap-1.5">
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-100 px-2.5 py-1.5 text-[0.7rem] leading-snug text-slate-700">
            Do I just refund it?
          </p>
          <p className="max-w-[90%] rounded-2xl rounded-tl-sm bg-brand-teal/10 px-2.5 py-1.5 text-[0.7rem] leading-snug text-slate-800">
            The courier note changes which rule applies — that is the bit
            everyone misses. What are you going to lead with?
          </p>
        </div>
      </div>
      <p className="text-[0.64rem] leading-snug text-slate-500">
        Using them is expected. What gets read is when you reached and what you
        did with the answer — not how often.
      </p>
    </div>
  );
}

/** The reading that comes back: a score, a shape, and the reason behind both. */
export function ReadinessReport() {
  const skills: Array<[string, number]> = [
    ["Handling a complaint", 74],
    ["Keeping the record true", 61],
    ["Working with AI", 68],
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex items-center gap-3">
        {/* The panel is small, so the ring is drawn at panel scale rather than
            pulled in at the size the fit page needs. */}
        <div
          role="img"
          aria-label="Productive readiness 68 out of 100"
          className="relative h-14 w-14 shrink-0"
        >
          <div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(var(--color-brand-violet) 68%, var(--color-slate-200) 0)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-[5px] grid place-items-center rounded-full bg-surface text-[0.95rem] font-bold text-slate-900"
          >
            68
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Productive readiness
          </p>
          <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-600">
            Held the policy line and said what happens next. The record you left
            behind is where it thins out.
          </p>
        </div>
      </div>
      <ul className="mt-2.5 grid gap-1.5">
        {skills.map(([skill, score]) => (
          <li key={skill}>
            <div className="flex items-baseline justify-between gap-2 text-[0.68rem]">
              <span className="font-medium text-slate-700">{skill}</span>
              <span className="font-semibold text-slate-900">{score}</span>
            </div>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-violet"
                style={{ width: `${score}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-slate-100 pt-1.5 text-[0.62rem] leading-snug text-slate-500">
        Skills the work never called on are left out, not scored zero. Every
        number quotes the writing it came from.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- added
// One per feature whose walkthrough had three pictures and eight tabs, so
// five of the eight repeated a picture the reader had already seen. A tab
// that shows the same thing again teaches nothing and costs the reader the
// seven seconds it holds the panel.

/** The applicant-tracking check: what a filter reads, and what it trips on. */
export function ResumeAts() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Screening check
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[0.68rem] font-bold text-teal-800">
          <Check size={10} />
          Machine readable
        </span>
      </div>

      <p className="mt-2.5 text-[0.68rem] font-semibold text-slate-500">
        Skills the filter found
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {SAMPLE_ATS.found.slice(0, 6).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-brand-mist px-2 py-0.5 text-[0.68rem] font-medium text-slate-600"
          >
            {skill}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[0.68rem] font-semibold text-slate-500">
        What it would trip on
      </p>
      <ul className="mt-1.5 grid gap-1.5">
        {SAMPLE_ATS.problems.slice(0, 2).map((problem) => (
          <li
            key={problem.what}
            className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5"
          >
            <span className="block text-[0.7rem] font-semibold text-amber-900">
              {problem.what}
            </span>
            <span className="mt-0.5 block text-[0.68rem] leading-snug text-amber-800">
              {problem.why}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.66rem] text-slate-400">
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
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Yours only when you say so
      </p>
      <ul className="mt-2 grid gap-1.5">
        {rows.map(([name, state]) => (
          <li
            key={name}
            className="flex items-center justify-between gap-3 rounded-lg bg-brand-mist px-2.5 py-2"
          >
            <span className="text-[0.74rem] font-semibold text-brand-ink">
              {name}
            </span>
            {state === "kept" ? (
              <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-teal-700">
                <Check size={10} />
                Kept
              </span>
            ) : (
              <span className="inline-flex h-6 items-center rounded-md bg-brand-violet px-2.5 text-[0.66rem] font-bold text-white">
                Keep
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[0.68rem] leading-snug text-slate-500">
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
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Before you apply
        </p>
        <span className="text-[0.68rem] font-semibold text-slate-500">
          3 changes
        </span>
      </div>
      <ol className="mt-2 grid gap-1.5">
        {moves.map(([what, why], i) => (
          <li
            key={what}
            className="flex gap-2.5 rounded-lg bg-brand-mist px-2.5 py-2"
          >
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-teal/20 text-[0.6rem] font-bold text-brand-teal-deep">
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[0.72rem] font-semibold text-brand-ink">
                {what}
              </span>
              <span className="block text-[0.68rem] text-slate-500">{why}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[0.66rem] text-slate-400">
        Taken from the advert you pasted, not from a general checklist.
      </p>
    </div>
  );
}

/** What you actually said, read back with the marks on it. */
export function InterviewAnswer() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Your answer, read back
      </p>
      <p className="mt-2 rounded-lg bg-brand-mist px-3 py-2 text-[0.74rem] leading-relaxed text-slate-700">
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
              className={`mt-0.5 grid h-4 w-9 shrink-0 place-items-center rounded text-[0.58rem] font-bold uppercase ${
                mark === "Kept"
                  ? "bg-teal-100 text-teal-800"
                  : mark === "Add"
                    ? "bg-violet-100 text-violet-800"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {mark}
            </span>
            <span className="text-[0.7rem] leading-snug text-slate-600">
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
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Before
      </p>
      <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[0.7rem] leading-relaxed text-slate-500 line-through decoration-slate-300">
        I helped out a lot at the shop and customers were happy with me.
      </p>
      <p className="mt-2.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-brand-teal-deep dark:text-brand-teal-soft">
        After
      </p>
      <p className="mt-1.5 rounded-lg border border-brand-teal/40 bg-teal-50/60 px-2.5 py-2 text-[0.72rem] leading-relaxed text-slate-700">
        Ran the counter alone through the festival rush, about 60 customers a
        day, and settled billing disputes without calling the owner in.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {["Pressure", "Ownership", "Customer conflict"].map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-brand-mist px-2 py-0.5 text-[0.66rem] font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[0.66rem] text-slate-400">
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
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Across four attempts
        </p>
        <span className="text-[0.68rem] font-semibold text-slate-500">
          first &rarr; last
        </span>
      </div>
      <ul className="mt-2.5 grid gap-2.5">
        {rows.map(([label, from, to]) => (
          <li key={label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[0.72rem] font-semibold text-brand-ink">
                {label}
              </span>
              <span className="text-[0.68rem] font-semibold text-teal-700">
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
      <p className="mt-2.5 text-[0.66rem] text-slate-400">
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
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        How you worked with the assistant
      </p>
      <p className="mt-2 text-[0.74rem] leading-relaxed text-slate-600">
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
              <span className="block text-[0.72rem] font-semibold text-brand-ink">
                {what}
              </span>
              <span className="block text-[0.66rem] text-slate-500">
                {where}
              </span>
            </span>
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold ${
                good
                  ? "bg-teal-100 text-teal-700"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {good ? <Check size={10} /> : "-"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.66rem] text-slate-400">
        Taking an answer whole and taking it apart read differently, and both
        are recorded.
      </p>
    </div>
  );
}
