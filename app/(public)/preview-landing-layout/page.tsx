"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Pause, Play } from "@/components/icons";
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
} from "@/components/feature-outcome";
import {
  INTERVIEW,
  RESUME,
  isOpen,
  type Beat,
  type Feature,
} from "@/lib/features";

// Temporary comparison page: the landing layout from the reference.
//
// Three differences from what is live, and each is a real trade:
//
//   the list becomes a narrow rail    - more room for the panel, less for the
//                                       thing somebody came to choose between
//   text and preview sit side by side - the walkthrough and its example are
//                                       readable at once instead of stacked
//   progress becomes a dot stepper    - reads as steps in a sequence rather
//                                       than as a video timeline
//
// Real categories, real walkthroughs, real output components - so the
// comparison is about the layout rather than about placeholder content.

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

const GLYPHS: Record<string, React.ReactNode> = {
  "ai-interview": (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
  "story-bank": (
    <>
      <path d="M6 3.5h8L18 8v12.5H6z" />
      <path d="M14 3.5V8h4M9 12.5h6M9 16h4" />
    </>
  ),
  "practice-questions": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.5a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.8.6-.8 1.1v.5M12 16.5v.5" />
    </>
  ),
  "resume-builder": (
    <>
      <path d="M6 3.5h8L18 8v12.5H6z" />
      <path d="M14 3.5V8h4M9 12h6M9 15.5h4" />
    </>
  ),
  "profile-builder": (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  "job-fit": (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 3.5 3.5" />
    </>
  ),
};

const DWELL = 7000;
const TICK = 60;

function Glyph({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[id] ?? GLYPHS["profile-builder"]}
    </svg>
  );
}

function Panel({ feature }: { feature: Feature }) {
  const beats = feature.walkthrough ?? null;
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const body = useRef<HTMLDivElement | null>(null);

  const go = useCallback((i: number) => {
    setPlaying(false);
    setElapsed(0);
    setAt(i);
  }, []);

  useEffect(() => {
    if (!beats || !playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setElapsed((e) => {
        if (e + TICK < DWELL) return e + TICK;
        setAt((n) => (n + 1) % beats.length);
        return 0;
      });
    }, TICK);
    return () => clearInterval(t);
  }, [beats, playing]);

  useEffect(() => {
    body.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [at]);

  const beat = beats?.[Math.min(at, (beats?.length ?? 1) - 1)];

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-surface p-5">
      <h2 className="font-display text-[1.6rem] font-bold leading-tight text-brand-ink">
        {feature.title}
      </h2>
      <p className="mt-1 text-[0.88rem] text-slate-500">
        {feature.blurb}
        {feature.time && ` ${feature.time}.`}
      </p>

      {!beats ? (
        <div className="mt-5 flex-1 space-y-4">
          {[
            ["What it is", feature.about],
            ["Who it is for", feature.forWho],
            ["What to expect", feature.expect],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                {k}
              </p>
              <p className="mt-1 text-[0.85rem] leading-relaxed text-slate-600">
                {v}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Text left, example right - the layout's whole point: the section
              and the thing it is describing are readable at the same time. */}
          <div className="mt-5 grid min-h-0 flex-1 gap-6 lg:grid-cols-2">
            <div ref={body} className="min-h-0 overflow-y-auto pr-1">
              <h3 className="font-display text-[1.05rem] font-bold text-brand-ink">
                {beat!.head}
              </h3>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-600">
                {beat!.body}
              </p>
              {beat!.points && (
                <ul className="mt-3 space-y-1.5">
                  {beat!.points.map((p) => (
                    <li
                      key={p}
                      className="flex gap-2 text-[0.8rem] leading-snug text-slate-600"
                    >
                      <span className="mt-1 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                        <Check size={8} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="min-h-0 overflow-y-auto">
              {beat!.art ? (
                ART[beat!.art]()
              ) : (
                // Not every section has something to show. An empty half is
                // better than a decorative one - the reference fills it every
                // time, which would mean inventing five more screenshots.
                <div className="grid h-full min-h-[10rem] place-items-center rounded-xl border border-dashed border-slate-200 px-4 text-center">
                  <p className="text-[0.76rem] leading-snug text-slate-400">
                    No screen for this section — it is about what the feature is
                    for, not what it looks like.
                  </p>
                </div>
              )}
            </div>
          </div>

          {isOpen(feature) && (
            <Link
              href={feature.href!}
              className="mt-5 block cursor-pointer rounded-xl bg-brand-teal-deep px-5 py-3 text-center text-[0.9rem] font-bold text-white transition-colors hover:bg-brand-teal"
            >
              Open {feature.title}
            </Link>
          )}

          {/* Dot stepper: reads as steps in a sequence rather than a timeline.
              The live dot carries the countdown as a ring. */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex flex-1 items-center">
              {beats.map((b, i) => (
                <div
                  key={b.tab}
                  className="flex flex-1 items-center last:flex-none"
                >
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`${i + 1}. ${b.tab}`}
                    title={b.tab}
                    className="grid h-4 w-4 shrink-0 cursor-pointer place-items-center"
                  >
                    <span
                      className={`block rounded-full transition-all ${
                        i === at
                          ? "h-3.5 w-3.5 bg-surface ring-2 ring-brand-teal-deep"
                          : i < at
                            ? "h-2.5 w-2.5 bg-brand-teal-deep"
                            : "h-2.5 w-2.5 bg-slate-300"
                      }`}
                      style={
                        i === at
                          ? {
                              background: `conic-gradient(var(--color-brand-teal-deep) ${(elapsed / DWELL) * 360}deg, transparent 0)`,
                            }
                          : undefined
                      }
                    />
                  </button>
                  {i < beats.length - 1 && (
                    <span
                      aria-hidden
                      className={`h-0.5 min-w-2 flex-1 ${i < at ? "bg-brand-teal-deep" : "bg-slate-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause" : "Play"}
              className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded text-slate-400 hover:text-brand-ink"
            >
              {playing ? <Pause size={11} /> : <Play size={11} />}
            </button>
            <span className="shrink-0 text-[0.75rem] text-slate-400">
              {at + 1} of {beats.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function Layout({ category }: { category: typeof INTERVIEW }) {
  const [id, setId] = useState(category.features[0].id);
  const feature =
    category.features.find((f) => f.id === id) ?? category.features[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* The rail: icon, name, status. Narrow on purpose - the panel is the
          page, and this is only how you change what is in it. */}
      <div
        role="tablist"
        aria-label={category.title}
        className="flex flex-col gap-1"
      >
        {category.features.map((f) => {
          const on = f.id === feature.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setId(f.id)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                on
                  ? "border-brand-teal bg-surface"
                  : "border-transparent hover:bg-surface/60"
              }`}
            >
              <span
                className={`shrink-0 ${on ? "text-brand-teal-deep" : "text-slate-400"}`}
              >
                <Glyph id={f.id} />
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-[0.84rem] ${
                  on ? "font-bold text-brand-ink" : "text-slate-600"
                }`}
              >
                {f.title}
              </span>
              {isOpen(f) && (
                <span className="shrink-0 rounded-full bg-teal-50 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-teal-700 ring-1 ring-inset ring-teal-600/20">
                  Live
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Panel key={feature.id} feature={feature} />
    </div>
  );
}

export default function PreviewLandingLayout() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-400">
        Preview · not linked · both are playing
      </p>
      <h1 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        The landing pages in the rail layout
      </h1>
      <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
        Real features, real walkthroughs, the real output components — only the
        arrangement is from your reference. Switch features in the rail and let
        a walkthrough play.
      </p>

      <div className="mt-9 space-y-10">
        <section>
          <h2 className="mb-3 font-display text-[1.05rem] font-bold text-brand-ink">
            Interview practice
          </h2>
          <Layout category={INTERVIEW} />
        </section>
        <section>
          <h2 className="mb-3 font-display text-[1.05rem] font-bold text-brand-ink">
            Your resume
          </h2>
          <Layout category={RESUME} />
        </section>
      </div>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-brand-mist p-5">
        <h2 className="font-display text-[1.05rem] font-bold text-brand-ink">
          What this layout wins and what it costs
        </h2>
        <ul className="mt-3 space-y-2.5 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-brand-ink">
              Wins: the example is beside the words about it.
            </strong>{" "}
            Today the resume page and the paragraph explaining how to read it
            are stacked, so you scroll between them. Side by side is plainly
            better for the sections that have something to show.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Costs: the features stop selling themselves.
            </strong>{" "}
            The rail gives each one a line of text. The current cards carry a
            sentence on what it does, the time it takes and a status — which is
            what somebody choosing between three tools actually reads.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Five of eight sections have nothing to show.
            </strong>{" "}
            &ldquo;Who it is for&rdquo; is prose. The reference fills that half
            every time, which would mean inventing five more screenshots per
            feature. Here it says so instead — but a half-empty panel is the
            honest version of the same problem.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              The stepper is better than the chapter bar.
            </strong>{" "}
            Dots with a connecting line read as steps in a sequence; the
            segmented bar read as a video scrubber. This is a walkthrough, so
            steps is the truer metaphor — worth taking whichever layout wins.
          </li>
        </ul>
      </section>
    </main>
  );
}
