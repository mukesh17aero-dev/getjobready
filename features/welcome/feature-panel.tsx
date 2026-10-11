"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Pause, Play } from "@/components/ui/icons";
import {
  DiscoveryChat,
  DiscoveryIndustries,
  DiscoveryRole,
  DiscoveryShortlist,
  DiscoveryTour,
  InterviewAudio,
  InterviewOutcome,
  InterviewSetup,
  ResumeOutcome,
  ResumeRead,
  FitDashboard,
  FitLines,
  FitPaste,
  PracticeAnswer,
  ProfileCompare,
  ProfileIdentity,
  ProfileSkills,
  ReadinessHelp,
  ReadinessReport,
  ReadinessScene,
  PracticeLibrary,
  PracticeNote,
  ResumeScribe,
  StoryDrafter,
  StoryGrid,
  StoryQuestions,
  ResumeAts,
  ProfileKeep,
  FitActions,
  InterviewAnswer,
  StoryRefine,
  PracticeProgress,
  ReadinessAiUse,
} from "./feature-outcome";
import { STATUS_LABEL, type Beat, type Feature } from "./marketing-features";

// The walkthrough beside the feature list: what a feature gets you, who it is
// for, how you work it, and what comes back.
//
// It was eight tabs and three pictures, so five of the eight showed something
// the reader had already been shown - and each one held the panel for seven
// seconds to do it. Four tabs, four pictures, nothing repeated: the tabs that
// went were the ones whose only content was a rephrasing of a neighbour.
//
// Framed as a browser window, because the sections that matter most - how to
// read the result - render the app's own components on the app's own data.
// The address is the page the walkthrough is about, so the chrome is a label
// rather than a claim that every section is a screenshot; the prose sections
// still read as prose, and the example output still says it belongs to nobody.
//
// It plays on its own, and pausing is now a control rather than a side effect
// of touching it. That was the flaw in the first version: scrolling stopped it
// for good with no way back, so anybody who paused by accident lost the rest.
// Reduced motion never starts the timer at all - the controls remain, so the
// walkthrough is still fully usable by hand.
//
// Features that are not built have no walkthrough, and get the plain three
// answers instead. "How to read the result" cannot be written for something
// that produces no result, and writing it anyway is how a landing page starts
// making promises the product cannot keep.

const DWELL_MS = 7000;
const TICK_MS = 60;

/** Beat.art names a renderer; this is where the name is resolved. */
const ART: Record<NonNullable<Beat["art"]>, () => React.ReactNode> = {
  "resume-output": () => <ResumeOutcome compact />,
  "resume-read": () => <ResumeRead />,
  "resume-scribe": () => <ResumeScribe />,
  "resume-ats": () => <ResumeAts />,
  "interview-output": () => <InterviewOutcome />,
  "interview-audio": () => <InterviewAudio />,
  "interview-setup": () => <InterviewSetup />,
  "interview-answer": () => <InterviewAnswer />,
  "discovery-role": () => <DiscoveryRole />,
  "discovery-chat": () => <DiscoveryChat />,
  "discovery-industries": () => <DiscoveryIndustries />,
  "discovery-tour": () => <DiscoveryTour />,
  "discovery-shortlist": () => <DiscoveryShortlist />,
  "readiness-scene": () => <ReadinessScene />,
  "readiness-help": () => <ReadinessHelp />,
  "readiness-report": () => <ReadinessReport />,
  "readiness-ai": () => <ReadinessAiUse />,
  "story-questions": () => <StoryQuestions />,
  "story-drafter": () => <StoryDrafter />,
  "story-grid": () => <StoryGrid />,
  "story-refine": () => <StoryRefine />,
  "practice-library": () => <PracticeLibrary />,
  "practice-answer": () => <PracticeAnswer />,
  "practice-note": () => <PracticeNote />,
  "practice-progress": () => <PracticeProgress />,
  "fit-dashboard": () => <FitDashboard />,
  "fit-paste": () => <FitPaste />,
  "fit-lines": () => <FitLines />,
  "fit-actions": () => <FitActions />,
  "profile-compare": () => <ProfileCompare />,
  "profile-identity": () => <ProfileIdentity />,
  "profile-skills": () => <ProfileSkills />,
  "profile-keep": () => <ProfileKeep />,
};

function Arrow({ back = false }: { back?: boolean }) {
  return (
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
      <path d={back ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

/**
 * Keyed on the feature by its caller, so selecting a different one remounts
 * this rather than resetting it. A different feature is a different story: it
 * starts at the beginning and gets its own timer back, even if the last one
 * had been taken over.
 */
export function FeaturePanel({ feature }: { feature: Feature }) {
  const beats = feature.walkthrough ?? null;
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const body = useRef<HTMLDivElement | null>(null);

  // Choosing a section pauses. Somebody who has reached for a control wants to
  // read, not to be moved on - but Play is right there when they are done.
  const go = useCallback((i: number) => {
    setPlaying(false);
    setElapsed(0);
    setAt(i);
  }, []);

  // The clock, counted outside React.
  //
  // This used to call setAt from inside the setElapsed updater. A state
  // updater has to be pure, and React deliberately runs it twice in
  // development to catch exactly that - so every tick that rolled over
  // advanced the section TWICE and the walkthrough skipped a tab each time
  // round. Counting in a local and setting state once per tick fixes it at
  // the cause rather than by slowing the timer down.
  useEffect(() => {
    if (!beats || !playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let spent = 0;
    const t = setInterval(() => {
      spent += TICK_MS;
      if (spent >= DWELL_MS) {
        spent = 0;
        setAt((n) => (n + 1) % beats.length);
      }
      setElapsed(spent);
    }, TICK_MS);
    return () => clearInterval(t);
  }, [beats, playing]);

  useEffect(() => {
    body.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [at]);

  // ---- no walkthrough: the three plain answers ----
  if (!beats) {
    return (
      <div className="p-4">
        <dl className="space-y-4">
          {[
            ["What it is", feature.about],
            ["Who it is for", feature.forWho],
            ["What to expect", feature.expect],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                {label}
              </dt>
              <dd className="mt-1 text-[0.85rem] leading-relaxed text-slate-600">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {/* Only said of something that is not built. A live feature with no
            walkthrough of its own is not waiting on anything - it opens, and
            the button below opens it. */}
        {feature.status !== "live" && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-surface px-3.5 py-3 text-[0.8rem] leading-relaxed text-slate-500">
            <strong className="font-semibold text-brand-ink">
              {STATUS_LABEL[feature.status]}.
            </strong>{" "}
            The full walkthrough — how it starts, how to use it and how to read
            what it gives back — arrives with the feature itself.
          </p>
        )}
      </div>
    );
  }

  const beat = beats[Math.min(at, beats.length - 1)];

  const address = `ascend.app${feature.href ?? ""}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ---- window chrome ---- */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-1.5">
        <span aria-hidden className="flex gap-1">
          {["#f87171", "#fbbf24", "#34d399"].map((c) => (
            <span
              key={c}
              className="h-2 w-2 rounded-full"
              style={{ background: c }}
            />
          ))}
        </span>
        <span className="ml-1 min-w-0 flex-1 truncate rounded-md bg-surface px-2 py-0.5 font-mono text-[0.75rem] text-slate-500">
          {address}
        </span>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
          className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded text-slate-500 transition-colors hover:text-brand-ink"
        >
          {playing ? <Pause size={12} /> : <Play size={12} />}
        </button>
      </div>
      {/* The rail is the progress indicator and the control at once. */}
      <div
        role="tablist"
        aria-label={`${feature.title}: sections`}
        className="flex items-center gap-0.5 border-b border-slate-200 px-2 py-2"
      >
        {beats.map((b, i) => (
          <button
            key={b.tab}
            type="button"
            role="tab"
            aria-selected={i === at}
            onClick={() => go(i)}
            className={`min-w-0 flex-1 cursor-pointer truncate rounded-md px-1 py-1 text-[0.75rem] font-bold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
              i === at
                ? "bg-brand-teal-deep text-white"
                : "text-slate-500 hover:bg-slate-200/70 hover:text-brand-ink"
            }`}
          >
            {b.tab}
          </button>
        ))}
      </div>

      <div ref={body} className="min-h-0 flex-1 overflow-y-auto p-4">
        <h3 className="font-display text-[1.1rem] font-bold leading-tight text-brand-ink">
          {beat.head}
        </h3>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-600">
          {beat.body}
        </p>

        {beat.points && (
          <ul className="mt-3 space-y-1.5">
            {beat.points.map((p) => (
              <li key={p} className="flex gap-2 text-[0.8rem] text-slate-600">
                <span className="mt-1 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                  <Check size={8} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        )}

        {beat.art && <div className="mt-3.5">{ART[beat.art]()}</div>}
      </div>

      {/* Chapter bar: how long this is and where you are, without a word. */}
      <div className="flex gap-1 border-t border-slate-200 px-3 pt-2.5">
        {beats.map((b, i) => (
          <button
            key={`bar-${b.tab}`}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to ${b.tab}`}
            className="group h-3 flex-1 cursor-pointer"
          >
            <span className="block h-1 overflow-hidden rounded-full bg-slate-300 group-hover:bg-slate-400">
              <span
                className="block h-full rounded-full bg-brand-teal-deep"
                style={{
                  width:
                    i < at
                      ? "100%"
                      : i === at
                        ? `${(elapsed / DWELL_MS) * 100}%`
                        : "0%",
                }}
              />
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => go((at - 1 + beats.length) % beats.length)}
            aria-label="Previous section"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-slate-300 bg-surface text-slate-500 transition-colors hover:text-brand-ink"
          >
            <Arrow back />
          </button>
          <button
            type="button"
            onClick={() => go((at + 1) % beats.length)}
            aria-label="Next section"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-slate-300 bg-surface text-slate-500 transition-colors hover:text-brand-ink"
          >
            <Arrow />
          </button>
        </div>
        <span className="text-[0.75rem] text-slate-500">
          {at + 1} of {beats.length}
        </span>
      </div>
    </div>
  );
}
