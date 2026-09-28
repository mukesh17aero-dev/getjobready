"use client";

// What a finished sitting shows: a readiness score for the role, a score per
// skill, and the work behind both - as a set of tabs rather than one long
// scroll, so the default view stays small and visual and the dense analysis
// only appears once somebody asks for a specific section.
//
// THE NUMBERS NEVER TRAVEL ALONE. A readiness score read off twenty minutes
// is a real thing to act on and a poor thing to be summed up by, so `basis`
// (how many scenes were actually attempted) and `confidence` are rendered with
// it rather than tucked underneath. A sitting where half the scenes went
// unreached produces a different claim from one where they all did, and the
// screen has to say which it is - otherwise the reader supplies the confident
// version themselves.
//
// Skills with no evidence are absent rather than zeroed, here and in the
// prompt: not reaching a scene is missing evidence, not evidence of inability,
// and a zero would read as the second.
//
// Every chart is drawn in SVG rather than pulled from a chart library: the
// stack forbids component libraries, and none of these need one.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRoleBenchmarks,
  listAssessmentRuns,
  reviewAssessmentRun,
  type AssessmentReview,
  type Readout,
  type ReferenceBand,
} from "@/lib/api";
import type { WebAxis, WebBand } from "./skill-web";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Tabs, type TabDef } from "./assessment-readout-tabs";
import { AiPanel, AnswersPanel, OverviewPanel, SkillsPanel } from "./assessment-readout-panels";

export function AssessmentReadout({
  readout,
  roleTitle,
  backHref,
  fresh = false,
  example = null,
}: {
  readout: Readout;
  roleTitle: string;
  backHref: string;
  /**
   * A review handed in rather than fetched: the worked example a visitor
   * sees before there is a sitting of their own. Nothing is requested for it.
   */
  example?: AssessmentReview | null;
  /**
   * Straight out of the sitting, so the read-through is genuinely happening
   * now. A sitting opened from the results list was marked days ago and the
   * scores are already stored - replaying "Reading everything you wrote…" at
   * somebody who came back to look at an old result is theatre about work
   * that is long finished, and it makes a stored page feel slow.
   */
  fresh?: boolean;
}) {
  const finished = readout.scenesAttempted >= readout.scenesInSitting;
  const [reading, setReading] = useState(true);
  // Stable, so naming it in the effect's dependencies below does not re-run
  // the effect on every render - which fired a fresh review each time, and the
  // score visibly changed as each one came back with its own answer.
  const settled = useCallback(() => setReading(false), []);

  if (readout.scenesAttempted === 0) return <section className="rounded-2xl border border-slate-200 bg-surface p-6">
    <p className="text-sm text-slate-500">Role readiness · {roleTitle}</p>
    <h1 className="mt-2 text-xl font-semibold text-slate-900">Start with a fresh assessment</h1>
    <p className="mt-3 text-sm leading-relaxed text-slate-600">This previous attempt ended without any submitted answers. There is no readiness result to show.</p>
    <a href={`/practice/readiness?role=${encodeURIComponent(readout.roleId)}&begin=1`} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-violet-700 px-5 py-3 text-sm font-semibold text-white">Start assessment →</a>
  </section>;

  return (
    <section>
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
        Role readiness · {roleTitle}
      </p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
        {finished ? "Your role readiness report" : "Your assessment progress"}
      </h1>

      <Scores readout={readout} onSettled={settled} fresh={fresh} example={example} />

      {/* One action, and it is the next piece of work rather than a way back.
          Simulation Missions is where a growth area above stops being a note
          and becomes practice - so the read-out ends by pointing at it. It
          waits for the same reason the tabs' content does: arithmetic is
          instant, but this sits below the score on purpose regardless. */}
      {!reading && (
        <>
          <div className="mt-8 rounded-2xl border border-brand-violet/25 bg-brand-violet/[0.04] p-4 sm:p-5">
            <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
              Work on this in Simulations
            </h2>
            <p className="mt-1 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
              Simulation Missions take the gaps above and put you back into the
              same kind of work until they close — scored against the same
              skills, so practice moves the number on this page rather than a
              different one.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/practice"
                className="inline-flex min-h-11 items-center rounded-lg bg-brand-violet px-5 text-[0.88rem] font-bold text-white transition-colors hover:bg-brand-violet-deep"
              >
                Go to Simulations
              </Link>
              <span className="text-[0.78rem] text-slate-500">
                Your simulation progress is tracked there.
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href={backHref}
              className="inline-flex min-h-11 items-center text-[0.85rem] font-semibold text-slate-500 hover:text-slate-900"
            >
              Back to Practice
            </Link>
            <Link
              href="/practice/readiness/results"
              className="inline-flex min-h-11 items-center text-[0.85rem] font-semibold text-slate-500 hover:text-slate-900"
            >
              See every sitting you have finished
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * The scored read of the answers, fetched after the read-out is already on
 * screen. Separate on purpose: what they DID is arithmetic and instant, this
 * takes a model a moment, and nobody should stare at a spinner to find out
 * whether they finished.
 *
 * A score is never rendered bare. The basis it came from and its confidence
 * sit with it, because a readiness number from a sitting where half the scenes
 * went unattempted is a different claim from one where they all did.
 */
// The read takes a few seconds because a model is genuinely reading what they
// wrote. A single frozen sentence reads as hung, so the wait narrates what is
// being done - the same pattern the resume review uses, and for the same
// reason: somebody who knows work is happening waits; somebody looking at
// "Loading…" leaves.
const READING_STEPS = [
  "Reading everything you wrote…",
  "Checking it against what the job actually needs…",
  "Working out which skills your answers showed…",
  "Seeing where you are strongest, and where there is room…",
  "Writing your results…",
];

function ReadingProgress() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, READING_STEPS.length - 1)),
      2600,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
      <ul aria-hidden className="grid gap-2.5">
        {READING_STEPS.map((label, i) => {
          const done = i < step;
          const now = i === step;
          return (
            <li key={label} className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center">
                {done ? (
                  <span className="text-[0.9rem] font-bold text-teal-700">
                    &#10003;
                  </span>
                ) : now ? (
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-violet-deep motion-reduce:animate-none" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </span>
              <span
                className={`text-[0.85rem] leading-relaxed ${
                  now ? "font-semibold text-brand-ink" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {READING_STEPS[step]}
      </p>
    </div>
  );
}

/** "12 Sep", fixed to no particular timezone - a trend axis label, not a
 * timestamp somebody needs to act on. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Scores({
  readout,
  onSettled,
  fresh,
  example,
}: {
  readout: Readout;
  /** Called once the read is over, whether it worked or not. */
  onSettled: () => void;
  /** Whether the marking is happening now or happened days ago. */
  fresh: boolean;
  /** Already known: shown as it is, nothing fetched. */
  example: AssessmentReview | null;
}) {
  const runId = readout.runId;
  const roleId = readout.roleId;
  const allSkills = readout.skills.map((s) => s.skill);

  const [review, setReview] = useState<AssessmentReview | null>(example);
  const [state, setState] = useState<"reading" | "done" | "failed">(example ? "done" : "reading");
  const [why, setWhy] = useState("");
  const [bands, setBands] = useState<ReferenceBand[]>([]);
  const [trendPoints, setTrendPoints] = useState<Array<{ label: string; score: number }>>([]);
  // One request per run, ever - and its result is kept.
  //
  // This is the bug behind "old results do not load". The guard was a ref plus
  // a `cancelled` flag, and in development the two fought each other: React
  // mounts an effect, tears it down and mounts it again. The first pass takes
  // the ref and starts the request; the teardown sets cancelled; the second
  // pass sees the ref already taken and does nothing at all. So the answer
  // arrives, finds cancelled true, and is thrown away - and the panel sits on
  // "opening your results" for ever, with a perfectly good review sitting in
  // the database.
  //
  // The dedupe now belongs to the request rather than to the mount: the
  // promise is remembered, a second mount awaits the SAME promise, and
  // nothing discards the result. The component is still mounted - that is the
  // whole point of a development double-mount - so setting state is correct.
  const asked = useRef<{
    id: string;
    job: Promise<Awaited<ReturnType<typeof reviewAssessmentRun>> | null>;
  } | null>(null);

  useEffect(() => {
    if (example) {
      onSettled();
      return;
    }
    const start = async () => {
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      if (!token) return null;
      return reviewAssessmentRun(token, runId);
    };
    if (asked.current?.id !== runId)
      asked.current = { id: runId, job: start() };

    void asked.current.job.then(async (result) => {
      if (!result) {
        setState("failed");
        setWhy("Sign in again to see this.");
        onSettled();
        return;
      }
      if (!result.ok) {
        setState("failed");
        setWhy(result.reason);
        onSettled();
        return;
      }
      setReview(result.review);
      setState("done");
      onSettled();
      // Neither of these is the finding, so neither may hold up the number
      // somebody actually came for - both are fetched after it is on screen,
      // and both are absent more often than not.
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      if (roleId) {
        const other = await getRoleBenchmarks(token, roleId);
        setBands(other?.bands ?? []);
      }
      const history = await listAssessmentRuns(token);
      const points = (history?.runs ?? [])
        .filter((r) => r.readiness !== null && (!roleId || r.roleId === roleId))
        .sort((a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime())
        .slice(-6)
        .map((r) => ({ label: shortDate(r.finishedAt), score: r.readiness! }));
      setTrendPoints(points);
    });
  }, [runId, roleId, onSettled, example]);

  if (state === "reading")
    return fresh ? (
      <ReadingProgress />
    ) : (
      // Already marked: fetching a stored result is not five steps of work,
      // and saying it is would be a story about the software rather than
      // about them.
      <p className="mt-3 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 text-[0.85rem] font-semibold text-slate-500">
        <span aria-hidden className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse" />
          <span
            className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-1.5 w-1.5 rounded-full bg-slate-400 motion-safe:animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
        </span>
        Opening your results
      </p>
    );
  if (state === "failed" || !review) {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
        <p className="text-[0.85rem] leading-relaxed text-amber-900">
          <strong className="font-semibold">No score for this one.</strong>{" "}
          {why || "The read-through is not ready."}
        </p>
        {/* Said plainly rather than left as a bare sentence on a page that
            otherwise looks like a result. Somebody opening an old sitting and
            meeting one grey line cannot tell whether the page is broken or
            whether there was never anything to read - and the difference
            matters, because only one of them is worth waiting for. */}
        <p className="mt-1.5 text-[0.8rem] leading-relaxed text-amber-800">
          What the sitting itself recorded is below.
        </p>
      </div>
    );
  }

  // Only skills the work actually called on go on the shape. A skill nobody
  // measured cannot be a point at zero - that reads as "bad at this" when the
  // truth is "not seen" - so it is named under the chart instead.
  const web: WebAxis[] = review.skillScores.map((s) => ({
    skill: s.skill,
    score: s.score,
  }));
  const webBands: WebBand[] = bands.map((b) => ({
    id: b.id,
    label: b.label,
    source: b.source,
    scores: Object.fromEntries(b.skills.map((s) => [s.skill, s.score])),
    flat: b.readiness,
    ...(b.cohort !== undefined ? { cohort: b.cohort } : {}),
  }));
  const anyIllustrative = bands.some((b) => b.source === "illustrative");
  const scored = new Set(review.skillScores.map((s) => s.skill));
  const unmeasured = allSkills.filter((s) => !scored.has(s));

  const tabs: TabDef[] = [
    {
      id: "overview",
      label: "Overview",
      content: <OverviewPanel readout={readout} review={review} trendPoints={trendPoints} />,
    },
    {
      id: "skills",
      label: "Skill breakdown",
      content: (
        <SkillsPanel
          readout={readout}
          review={review}
          web={web}
          webBands={webBands}
          anyIllustrative={anyIllustrative}
          unmeasured={unmeasured}
        />
      ),
    },
  ];
  if (review.usingAI) {
    tabs.push({ id: "ai", label: "Working with AI", content: <AiPanel usingAI={review.usingAI} /> });
  }
  if (review.scenes.some((sc) => sc.did || sc.better)) {
    tabs.push({ id: "answers", label: "Your answers", content: <AnswersPanel scenes={review.scenes} /> });
  }

  return <Tabs tabs={tabs} label="Report sections" />;
}
