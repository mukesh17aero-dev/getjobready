"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Clock } from "@/components/icons";
import { A4Frame, ResumeSheet } from "@/components/resume-builder";
import { SAMPLE_ATS, SAMPLE_RESUME, SAMPLE_REVIEW } from "@/lib/samples";

// Temporary preview: the right-hand panel for a feature landing page.
//
// Eight beats, in the order somebody actually needs them: what this gets you,
// who it is for, how it helps, what makes it different, how it starts, how you
// work it, how to read what comes back, and where you go next. The preview of
// the real output sits inside the beat that is about the output, rather than
// floating beside all of them.
//
// Both scroll modes, because both were asked for and they are not in conflict:
// it advances on its own until the person touches it, and then it is theirs
// and stays theirs. An auto-scroll that fights the reader is worse than none,
// so there is no resume-after-idle.
//
// Reduced motion stops the timer outright - not a shorter one, none.
//
// Shown here for the Resume Builder only. Judge the shape and how much copy a
// beat wants before this is written twelve more times.

type Beat = {
  id: string;
  /** The rail label. Two words at most - it is a signpost, not a summary. */
  tab: string;
  head: string;
  body: string;
  points?: string[];
  /** The worked example, for the beats that are about the output. */
  art?: React.ReactNode;
};

// The real renderer, on the real data. Nothing here is drawn twice: the sheet
// below is the same component the builder puts on screen, and the checks are
// the same shapes the API returns - so this panel cannot promise a document
// the product does not produce.
function RealResume() {
  return (
    <div>
      {/* The builder's own preview box: one A4 page tall, scrolled rather than
          grown. A4Frame alone scales the width but leaves the sheet free to
          lay itself out over two pages, and the spare one shows as blank
          paper. */}
      <div className="relative aspect-[1/1.414] w-full overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white">
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
  );
}

function RealAts() {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-teal-600/25 bg-teal-50/60 px-3 py-2">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-teal-800">
          Read by the filter — {SAMPLE_ATS.found.length} role keywords found
        </p>
        <p className="mt-1 text-[0.72rem] leading-snug text-teal-900">
          {SAMPLE_ATS.found.join(" · ")}
        </p>
      </div>
      {SAMPLE_ATS.problems.map((problem) => (
        <div
          key={problem.what}
          className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
        >
          <span
            aria-hidden
            className="mt-0.5 text-[0.8rem] font-bold text-amber-700"
          >
            !
          </span>
          <span className="min-w-0">
            <span className="block text-[0.74rem] font-semibold text-amber-900">
              {problem.what}
            </span>
            <span className="mt-0.5 block text-[0.72rem] leading-snug text-amber-800">
              {problem.why}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function RealReview() {
  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-slate-200 bg-surface px-3 py-2">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-brand-teal-deep">
          Where this stands · {SAMPLE_REVIEW.standing.level}
        </p>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-slate-600">
          {SAMPLE_REVIEW.standing.why}
        </p>
      </div>
      <div>
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-slate-400">
          What works
        </p>
        <ul className="mt-1 space-y-1">
          {SAMPLE_REVIEW.strengths.map((x) => (
            <li
              key={x}
              className="flex gap-1.5 text-[0.75rem] leading-snug text-slate-600"
            >
              <span className="mt-1 grid h-3 w-3 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                <Check size={7} />
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
        <ul className="mt-1 space-y-1.5">
          {SAMPLE_REVIEW.gaps.map((g) => (
            <li key={g.what} className="rounded-lg bg-surface px-2.5 py-1.5">
              <span className="block text-[0.74rem] font-semibold text-brand-ink">
                {g.what}
              </span>
              <span className="mt-0.5 block text-[0.72rem] leading-snug text-slate-500">
                {g.how}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const BEATS: Beat[] = [
  {
    id: "what",
    tab: "What",
    head: "What you get",
    body: "A complete resume, written for one specific role, in your choice of three layouts. Downloadable as Word or PDF, and saved so you can come back and change it.",
  },
  {
    id: "who",
    tab: "Who",
    head: "Who it is for",
    body: "Students and early-career applicants writing their first or second resume. You do not need existing work experience — the builder works from a part-time job, a college project or an internship, and tells you which sections are thin.",
  },
  {
    id: "helps",
    tab: "Why",
    head: "How it helps",
    body: "Most applications are rejected by software before a person reads them. The builder writes content that passes those filters and still reads well to a hiring manager, using details you have already given Ascend rather than a blank form.",
  },
  {
    id: "standout",
    tab: "Features",
    head: "Key features",
    body: "Four things a resume template does not do:",
    points: [
      "AI writes each section from your career record, in your own details",
      "Automatic check against applicant tracking systems, with a score",
      "Targeted at one named role rather than written generically",
      "Saved and versioned, so a second role takes minutes not hours",
    ],
  },
  {
    id: "trigger",
    tab: "Start",
    head: "How to start",
    body: "Three choices, then the builder runs. It takes about fifteen minutes end to end.",
    art: (
      <div className="space-y-2">
        {[
          ["1", "Choose a layout", "Classic, Compact or Sidebar"],
          [
            "2",
            "Name the target role",
            "For example: Customer Success Associate",
          ],
          [
            "3",
            "Start fresh or improve",
            "Upload an existing resume if you have one",
          ],
        ].map(([n, label, hint]) => (
          <div
            key={n}
            className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-surface px-2.5 py-2"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-teal-deep text-[0.62rem] font-bold text-white">
              {n}
            </span>
            <span className="min-w-0">
              <span className="block text-[0.76rem] font-semibold text-brand-ink">
                {label}
              </span>
              <span className="block text-[0.68rem] text-slate-500">
                {hint}
              </span>
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "use",
    tab: "Use",
    head: "How to use it",
    body: "The builder asks only for details it does not already have. The preview updates as you answer, so you can see the document take shape rather than waiting until the end. You can edit any section after it is written.",
  },
  {
    id: "read",
    tab: "Output",
    head: "How to read the result",
    body: "Three things come back: the resume itself, a check of how applicant tracking software reads it, and a written review of where it stands. Below is a real example, rendered by the same component the builder uses.",
    art: (
      <div className="grid gap-3">
        <RealResume />
        <RealAts />
        <RealReview />
      </div>
    ),
  },
  {
    id: "next",
    tab: "Next",
    head: "What to do next",
    body: "Download the resume and apply. Build a second version for a different role — your record is saved, so it takes minutes. Most people go to interview practice next, which uses the same role you targeted here.",
  },
];

const DWELL_MS = 6500;

export default function PreviewFeaturePanel() {
  const [at, setAt] = useState(0);
  // Once somebody has touched it, it is theirs. There is deliberately no path
  // back to auto: a panel that starts moving again while you are reading is
  // worse than one that never moved.
  const [manual, setManual] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const go = useCallback((i: number) => {
    setManual(true);
    setAt(i);
  }, []);

  useEffect(() => {
    if (manual) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setAt((n) => (n + 1) % BEATS.length), DWELL_MS);
    return () => clearInterval(t);
  }, [manual]);

  // The panel scrolls back to its own top on each beat, so a long one does not
  // leave the next one starting halfway down.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [at]);

  const beat = BEATS[at];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-400">
        Preview · not linked · it advances on its own until you touch it
      </p>
      <h1 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        The feature panel, in eight beats
      </h1>
      <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
        The panel moves through the eight sections on its own. Click any
        section, or use the arrows, to take control — it stops advancing once
        you do.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_27rem]">
        {/* The left side, as it already is - here only so the panel is judged
            at its real width beside real content. */}
        <div className="space-y-3">
          {[
            ["Resume Builder", "Available now", true],
            ["LinkedIn Profile Builder", "Not released yet", false],
            ["Basic Job Fit Analyzer", "Not released yet", false],
          ].map(([title, status, live], i) => (
            <div
              key={title as string}
              className={`rounded-2xl border bg-surface p-4 ${
                i === 0 ? "border-brand-teal" : "border-slate-200 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-[1.02rem] font-bold text-brand-ink">
                  {title}
                </h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ring-1 ring-inset ${
                    live
                      ? "bg-teal-50 text-teal-700 ring-teal-600/20"
                      : "bg-slate-100 text-slate-500 ring-slate-400/25"
                  }`}
                >
                  {status}
                </span>
              </div>

              {/* The action sits on the tile it belongs to. In the panel it
                  read as "open the thing you are reading about", which is
                  the wrong object - the panel describes, the tile acts. */}
              {live ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-teal-deep px-4 py-2 text-[0.79rem] font-bold text-white">
                    Open Resume Builder
                    <ArrowRight size={13} />
                  </span>
                  <span className="inline-flex items-center gap-1 text-[0.72rem] text-slate-400">
                    <Clock size={11} />
                    15-20 min
                  </span>
                </div>
              ) : (
                <p className="mt-3 text-[0.72rem] font-semibold text-slate-400">
                  Not available yet
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ---- the panel ---- */}
        <aside
          aria-label="Resume Builder, in detail"
          onWheel={() => setManual(true)}
          onPointerDown={() => setManual(true)}
          className="flex max-h-[34rem] flex-col rounded-2xl border border-slate-200 bg-brand-mist lg:sticky lg:top-24"
        >
          {/* The rail. Doubles as the progress indicator - the filled dot is
              where you are, and it is also the control. */}
          <div className="flex items-center gap-1 border-b border-slate-200 px-3 py-2">
            {BEATS.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                aria-current={i === at ? "step" : undefined}
                aria-label={`${i + 1}. ${b.tab}`}
                className={`min-w-0 flex-1 cursor-pointer rounded-md px-1 py-1 text-[0.6rem] font-bold uppercase tracking-wide transition-colors ${
                  i === at
                    ? "bg-brand-teal-deep text-white"
                    : "text-slate-400 hover:bg-slate-200/70 hover:text-brand-ink"
                }`}
              >
                {b.tab}
              </button>
            ))}
          </div>

          <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto p-4">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              {at + 1} of {BEATS.length}
            </p>
            <h3 className="mt-1 font-display text-[1.15rem] font-bold leading-tight text-brand-ink">
              {beat.head}
            </h3>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-600">
              {beat.body}
            </p>

            {beat.points && (
              <ul className="mt-3 space-y-1.5">
                {beat.points.map((p) => (
                  <li
                    key={p}
                    className="flex gap-2 text-[0.8rem] text-slate-600"
                  >
                    <span className="mt-1 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                      <Check size={8} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            )}

            {beat.art && <div className="mt-3.5">{beat.art}</div>}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2.5">
            <div className="flex gap-1">
              {/* Arrows only. The words were doing no work the icon and the
                  section rail were not already doing, and they crowded a
                  footer that also carries the position. */}
              <button
                type="button"
                onClick={() => go((at - 1 + BEATS.length) % BEATS.length)}
                aria-label="Previous section"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-slate-300 bg-surface text-slate-500 transition-colors hover:text-brand-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => go((at + 1) % BEATS.length)}
                aria-label="Next section"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-slate-300 bg-surface text-slate-500 transition-colors hover:text-brand-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
            <span className="text-[0.72rem] text-slate-400">
              {at + 1} of {BEATS.length}
            </span>
          </div>
        </aside>
      </div>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-brand-mist p-5">
        <h2 className="font-display text-[1.05rem] font-bold text-brand-ink">
          Before this goes on all four landing pages
        </h2>
        <ul className="mt-3 space-y-2.5 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-brand-ink">
              Eight beats is right for a built feature and wrong for an unbuilt
              one.
            </strong>{" "}
            Ten of the twelve features have no output, so &ldquo;how to read
            it&rdquo; and &ldquo;what next&rdquo; would be invention. Those get
            the first four beats and a plain line saying the rest arrives when
            the feature does.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              This is a lot of writing.
            </strong>{" "}
            Eight beats across twelve features is roughly ninety pieces of copy.
            Resume Builder and AI Interview I can write from what the code
            actually does. For the unbuilt ten I would be writing your product
            claims — tell me if you want to draft those yourself.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Auto-scroll never resumes.
            </strong>{" "}
            Once somebody clicks, scrolls or presses a key it is theirs for the
            rest of the visit. A panel that starts moving again while you are
            reading is worse than one that never moved. Reduced motion stops the
            timer outright.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              The example resume is badged as one.
            </strong>{" "}
            &ldquo;A. Sample&rdquo;, and the paper says so at the bottom. Nobody
            should mistake the shop window for their own document.
          </li>
        </ul>
      </section>
    </main>
  );
}
