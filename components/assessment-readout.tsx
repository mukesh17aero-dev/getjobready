"use client";

// What a finished sitting shows: a readiness score for the role, a score per
// skill, and the work behind both.
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
// The bars are drawn in CSS rather than pulled from a chart library: the stack
// forbids component libraries, and a bar is two divs.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRoleBenchmarks,
  reviewAssessmentRun,
  type AssessmentReview,
  type Readout,
  type ReferenceBand,
} from "@/lib/api";
import { SkillWeb, type WebAxis, type WebBand } from "@/components/skill-web";
import { supabaseBrowser } from "@/lib/supabase-browser";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * The readiness score as a ring.
 *
 * A conic gradient and two divs - the stack has no chart library, and this
 * needs none. The number is the accessible content; the ring is a picture of
 * the number, which is why it is one `role="img"` with a label rather than
 * something a screen reader has to walk.
 *
 * Deliberately NOT a radar. A radar plots every skill on its own axis and
 * joins them, which requires a value on every axis - and a skill this sitting
 * never reached has no value. Plotting it as zero says "bad at this" when the
 * truth is "not seen", and dropping the axis silently changes the shape of the
 * polygon into something that looks like a finding. Bars can simply leave a
 * skill out.
 */
function Ring({ score }: { score: number }) {
  const pct = clamp(score);
  return (
    <div
      role="img"
      aria-label={`Readiness ${score} out of 100`}
      className="relative h-40 w-40 shrink-0"
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(var(--color-brand-violet) ${pct}%, var(--color-slate-200) 0)`,
        }}
      />
      {/* The disc has to be the card's own colour, not the page's: a surface
          that is nearly right reads as a smudge behind the number. */}
      <div
        aria-hidden
        className="absolute inset-[11px] flex flex-col items-center justify-center rounded-full bg-surface"
      >
        <span className="font-display text-[2.6rem] font-bold leading-none tracking-tight text-slate-900">
          {score}
        </span>
        <span className="mt-1 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
          of 100
        </span>
      </div>
    </div>
  );
}

/** A titled box. The read-out is panels now, not one long column. */
function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h2 className="text-[0.9rem] font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      {note && (
        <p className="mt-0.5 text-[0.78rem] leading-relaxed text-slate-500">
          {note}
        </p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

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
  const touched = readout.skills.filter((s) => s.attempted > 0).length;
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

      <Scores
        runId={readout.runId}
        roleId={readout.roleId}
        allSkills={readout.skills.map((s) => s.skill)}
        onSettled={settled}
        fresh={fresh}
        example={example}
      />

      {/* Everything below waits. It is arithmetic and instant, which is
          exactly why it used to be on screen first - a page that opens on
          "how much of the job you got to" while the score is still being
          written has buried the thing somebody came for. */}
      {!reading && (
        <>
          {/* "Scenes" is our word for them, not theirs. From the outside these
          were days at a job, and the read-out should use the same word the
          screen they just left used. */}
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Questions answered", `${readout.scenesAttempted}`],
              ["Time spent", `${readout.minutesSpent} min`],
              ["Skills you showed", `${touched} of ${readout.skills.length}`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 p-3.5"
              >
                <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {label}
                </dt>
                <dd className="mt-0.5 text-lg font-semibold text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <details className="mt-6 rounded-xl border border-slate-200 p-3.5">
            <summary className="cursor-pointer text-[0.86rem] font-semibold text-slate-700">
              How much of the job you got to
            </summary>
            <p className="mt-1 text-[0.8rem] text-slate-500">
              This shows how often each skill appeared in your answered questions.
              Fewer examples mean there is less evidence for that skill.
            </p>
            <ul className="mt-3 grid gap-2.5">
              {readout.skills.map((s) => {
                const pct = clamp(
                  s.inSitting === 0 ? 0 : (s.attempted / s.inSitting) * 100,
                );
                return (
                  <li key={s.skill}>
                    <div className="flex items-baseline justify-between gap-3 text-[0.84rem]">
                      <span className="font-medium text-slate-700">
                        {s.skill}
                      </span>
                      <span className="shrink-0 text-[0.78rem] text-slate-400">
                        {s.attempted} of {s.inSitting}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100"
                      role="img"
                      aria-label={`${s.skill}: called on ${s.attempted} of ${s.inSitting} times`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          s.attempted === 0 ? "bg-slate-300" : "bg-brand-teal"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>

          {readout.repeated.length > 0 && (
            <div className="mt-3">
              <Panel title="Situations you went back to">
                <ul className="grid gap-1.5 text-[0.84rem] text-slate-600">
                  {readout.repeated.map((r) => (
                    <li key={r.sceneTitle}>
                      {r.sceneTitle} · {r.attempts} goes
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}

          {/* One action, and it is the next piece of work rather than a way back.
          Simulation Missions is where a growth area above stops being a note
          and becomes practice - so the read-out ends by pointing at it.

          It is honest about not being finished. A button that says "Start" and
          opens a page saying "in development" is worse than a button that says
          so first. */}
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
                In development — the page says where it has got to.
              </span>
            </div>
          </div>

          <Link
            href={backHref}
            className="mt-5 inline-flex min-h-11 items-center text-[0.85rem] font-semibold text-slate-500 hover:text-slate-900"
          >
            Back to Practice
          </Link>
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

function Scores({
  runId,
  roleId,
  allSkills,
  onSettled,
  fresh,
  example,
}: {
  runId: string;
  roleId: string | null;
  /** Every skill this role claims, so the unscored ones can be named. */
  allSkills: string[];
  /** Called once the read is over, whether it worked or not. */
  onSettled: () => void;
  /** Whether the marking is happening now or happened days ago. */
  fresh: boolean;
  /** Already known: shown as it is, nothing fetched. */
  example: AssessmentReview | null;
}) {
  const [review, setReview] = useState<AssessmentReview | null>(example);
  const [state, setState] = useState<"reading" | "done" | "failed">(example ? "done" : "reading");
  const [why, setWhy] = useState("");
  const [bands, setBands] = useState<ReferenceBand[]>([]);
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
      // How everybody else did, fetched after the scores are on screen. It is
      // a comparison, not the finding - it must never hold up the number
      // somebody actually came for, and it is absent more often than not.
      if (!roleId) return;
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const other = await getRoleBenchmarks(token, roleId);
      setBands(other?.bands ?? []);
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

  const partial = review.basis.scenesAttempted < review.basis.scenesInSitting;

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

  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-5 sm:gap-7">
          <Ring score={review.readiness.score} />
          {/* Wide enough to read: below the ring on a phone, beside it otherwise. */}
          <div className="min-w-[14rem] flex-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Productive readiness for this role
            </p>
            {review.readiness.why && (
              <p className="mt-1 text-[0.92rem] leading-relaxed text-slate-700">
                {review.readiness.why}
              </p>
            )}
          </div>
        </div>
        {/* The number never travels without what it was read from. */}
        <p className="mt-3 border-t border-slate-100 pt-2.5 text-[0.82rem] leading-relaxed text-slate-500">
          This comes from your assessment, in which you worked through{" "}
          {review.basis.scenesAttempted} of {review.basis.scenesInSitting}{" "}
          situations
          {partial
            ? " — so parts of the job never came up, and this score can only speak for the parts that did"
            : ""}
          . It says what today showed. Do it again in a month and it will say
          something different.
        </p>
      </div>

      {review.skillScores.length > 0 && (
        <>
          <h2 className="mt-6 text-[0.95rem] font-semibold tracking-tight text-slate-900">
            Skill by skill
          </h2>
          <p className="mt-0.5 text-[0.8rem] text-slate-500">
            Only skills your work actually showed. A skill whose scenes you did
            not reach is left out rather than scored — no evidence is not the
            same as doing badly.
          </p>
          {web.length >= 3 && (
            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <SkillWeb axes={web} bands={webBands} />
              {anyIllustrative && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[0.78rem] leading-relaxed text-amber-900">
                  The lines marked{" "}
                  <strong className="font-semibold">illustrative</strong> are
                  placeholders, not measurements. They show roughly where those
                  levels sit while we gather the real figures — treat them as a
                  rough guide and nothing more.
                </p>
              )}
              {unmeasured.length > 0 && (
                <p className="mt-3 border-t border-slate-100 pt-2.5 text-[0.78rem] leading-relaxed text-slate-500">
                  Not on this shape: {unmeasured.join(", ")}. The work in front
                  of you never called on{" "}
                  {unmeasured.length === 1 ? "it" : "them"}, so there is nothing
                  to plot — which is not the same as a low score, and is why it
                  is named here instead of drawn as one.
                </p>
              )}
            </div>
          )}

          {/* Two columns on a wide screen. A dozen skills stacked one per row
              is a page nobody reaches the bottom of. */}
          <ul className="mt-3 grid gap-x-6 gap-y-3 lg:grid-cols-2">
            {review.skillScores.map((s) => (
              <li key={s.skill}>
                <div className="flex items-baseline justify-between gap-3 text-[0.86rem]">
                  <span className="font-medium text-slate-700">{s.skill}</span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    {s.score}
                  </span>
                </div>
                <div
                  className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100"
                  role="img"
                  aria-label={`${s.skill}: ${s.score} out of 100`}
                >
                  <div
                    className="h-full rounded-full bg-brand-violet"
                    style={{ width: `${clamp(s.score)}%` }}
                  />
                </div>
                {s.why && (
                  <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-500">
                    {s.why}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {review.summary && (
        <p className="mt-4 text-[0.9rem] leading-relaxed text-slate-700">
          {review.summary}
        </p>
      )}

      {/* Working with AI, given its own place rather than a line in the
          summary. It is one of the three things this assessment is for, and
          the one somebody is least likely to have been told about honestly:
          not asking is a habit people were taught, and pasting a draft is a
          judgement failure nobody flags at college. */}
      {review.usingAI && (
        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[0.9rem] font-semibold tracking-tight text-slate-900">
              How you worked with the AI assistant
            </h2>
            <span className="text-[1.1rem] font-semibold text-slate-900">
              {review.usingAI.score}
              <span className="ml-1 text-[0.78rem] font-normal text-slate-400">
                of 100
              </span>
            </span>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label={`Working with AI: ${review.usingAI.score} out of 100`}
          >
            <div
              className="h-full rounded-full bg-brand-violet"
              style={{ width: `${clamp(review.usingAI.score)}%` }}
            />
          </div>
          {review.usingAI.why && (
            <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-600">
              {review.usingAI.why}
            </p>
          )}
        </div>
      )}

      {/* Side by side, because they are two halves of one reading and stacking
          them made the second half look like an afterthought. */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(
          [
            ["What you are already good at", review.strengths],
            ["Where you can grow", review.workOn],
          ] as Array<[string, string[]]>
        ).map(([title, items]) =>
          items.length > 0 ? (
            <Panel key={title} title={title}>
              <ul className="grid gap-1.5 text-[0.86rem] leading-relaxed text-slate-600">
                {items.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span aria-hidden className="text-slate-300">
                      ·
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null,
        )}
      </div>

      {/* Your answers, read back. Folded away rather than cut: it is the
          longest thing on the page and the last thing most people want, but it
          is the one part that proves the scores were read off real work. */}
      {review.scenes.some((sc) => sc.did || sc.better) && (
        <details className="mt-3 rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer text-[0.9rem] font-semibold tracking-tight text-slate-900">
            Review your answers · scene by scene
          </summary>
          <ul className="mt-3 grid gap-3">
            {review.scenes.map((sc) => (
              <li key={sc.sceneId} className="rounded-xl bg-slate-50 p-3.5">
                {sc.did && (
                  <p className="text-[0.86rem] leading-relaxed text-slate-700">
                    {sc.did}
                  </p>
                )}
                {sc.better && (
                  <p className="mt-1.5 text-[0.86rem] leading-relaxed text-slate-600">
                    <span className="font-semibold">Stronger:</span> {sc.better}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
