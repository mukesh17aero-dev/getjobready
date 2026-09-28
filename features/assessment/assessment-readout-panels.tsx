// The four tab panels the read-out is built from. Split out of
// assessment-readout.tsx: that file fetches and orchestrates, this file
// draws, and keeping the drawing here is most of what keeps the orchestrator
// readable and under the size ceiling.

import { ArrowRight, Check, ChevronRight } from "@/components/ui/icons";
import type { AssessmentReview, Readout } from "@/lib/api";
import type { WebAxis, WebBand } from "./skill-web";
import { SkillWeb } from "./skill-web";
import { Donut, Trend } from "./assessment-readout-charts";
import { clamp, Evidence, Panel, Ring, SkillGauge, TONE, toneOf } from "./assessment-readout-visuals";

/**
 * The glance view: the score, whether it moved since last time, how much of
 * what was written actually had something in it, and the two things worth
 * carrying away. Everything else is one click further in, in its own tab.
 */
export function OverviewPanel({
  readout,
  review,
  trendPoints,
}: {
  readout: Readout;
  review: AssessmentReview;
  trendPoints: Array<{ label: string; score: number }>;
}) {
  const partial = review.basis.scenesAttempted < review.basis.scenesInSitting;
  const heroTone = TONE[toneOf(review.readiness.score)];
  const attempted = review.scenes.filter((sc) => sc.attempted).length;
  const thin = review.scenes.length - attempted;

  return (
    <div className="grid gap-4">
      <div
        className={`rounded-2xl border p-5 sm:p-6 ${heroTone.border}`}
        style={{
          background: `radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, ${heroTone.ring} 10%, transparent), transparent 60%), var(--color-surface)`,
        }}
      >
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <Ring score={review.readiness.score} />
          {/* Wide enough to read: below the ring on a phone, beside it otherwise. */}
          <div className="min-w-[14rem] flex-1">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] ${heroTone.bg} ${heroTone.text}`}
            >
              {heroTone.label}
            </span>
            <p className="mt-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Productive readiness for this role
            </p>
            {review.readiness.why && (
              <p className="mt-1 text-[0.95rem] leading-relaxed text-slate-700">
                <Evidence text={review.readiness.why} />
              </p>
            )}
          </div>
        </div>
        {/* The number never travels without what it was read from. */}
        <p className="mt-4 border-t border-slate-900/10 pt-3 text-[0.82rem] leading-relaxed text-slate-500">
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

      {/* Two small charts, side by side where there is room for both: the
          trend only exists after a second attempt, the depth breakdown
          exists from the first one. Neither waits for the other. */}
      {(trendPoints.length >= 2 || review.scenes.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {trendPoints.length >= 2 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <Trend points={trendPoints} />
            </div>
          )}
          {review.scenes.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                How much of what you wrote had something to read
              </p>
              <div className="mt-2">
                <Donut
                  segments={[
                    { label: "Had something to read", value: attempted, color: TONE.strong.ring },
                    { label: "Too short to read", value: thin, color: TONE.developing.ring },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* "Scenes" is our word for them, not theirs. From the outside these
          were days at a job, and the read-out should use the same word the
          screen they just left used. */}
      <dl className="grid gap-3 sm:grid-cols-3">
        {(
          [
            { label: "Questions answered", value: `${readout.scenesAttempted}` },
            { label: "Time spent", value: `${readout.minutesSpent} min` },
            {
              label: "Skills you showed",
              value: `${readout.skills.filter((s) => s.attempted > 0).length} of ${readout.skills.length}`,
            },
          ] as const
        ).map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-200 p-3.5">
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
              {label}
            </dt>
            <dd className="mt-0.5 text-lg font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Icon + colour together, never colour alone, so the distinction
          survives greyscale and colour-blindness both. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            {
              title: "What you are already good at",
              items: review.strengths,
              icon: Check,
              text: "text-teal-700",
              bg: "bg-teal-50",
              iconBg: "bg-teal-100",
            },
            {
              title: "Where you can grow",
              items: review.workOn,
              icon: ArrowRight,
              text: "text-amber-700",
              bg: "bg-amber-50",
              iconBg: "bg-amber-100",
            },
          ] as const
        ).map(({ title, items, icon: Icon, text, bg, iconBg }) =>
          items.length > 0 ? (
            <section key={title} className={`rounded-xl border border-slate-200 p-4 ${bg}`}>
              <h2 className="text-[0.9rem] font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
              <ul className="mt-3 grid gap-2.5">
                {items.map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${iconBg} ${text}`}
                    >
                      <Icon size={12} />
                    </span>
                    <span className="text-[0.86rem] leading-relaxed text-slate-600">
                      <Evidence text={line} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>

      {review.summary && (
        <div className={`rounded-xl border-l-[3px] p-4 ${heroTone.border} ${heroTone.bg}`}>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500">
            The bottom line
          </p>
          <p className="mt-1 text-[0.9rem] leading-relaxed text-slate-700">
            <Evidence text={review.summary} />
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * The detail behind the score: the shape (or gauges, below three skills),
 * each skill's evidence behind a click rather than always open, and how much
 * of the job the sitting actually reached.
 */
export function SkillsPanel({
  readout,
  review,
  web,
  webBands,
  anyIllustrative,
  unmeasured,
}: {
  readout: Readout;
  review: AssessmentReview;
  web: WebAxis[];
  webBands: WebBand[];
  anyIllustrative: boolean;
  unmeasured: string[];
}) {
  return (
    <div className="grid gap-4">
      {review.skillScores.length > 0 && (
        <>
          <p className="text-[0.8rem] text-slate-500">
            Only skills your work actually showed. A skill whose scenes you did
            not reach is left out rather than scored — no evidence is not the
            same as doing badly. Tap a skill for the reason behind its score.
          </p>
          {web.length > 0 && web.length < 3 && (
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 rounded-xl border border-slate-200 p-5 sm:justify-start">
              {web.map((a) => (
                <SkillGauge key={a.skill} skill={a.skill} score={a.score} />
              ))}
            </div>
          )}
          {web.length >= 3 && (
            <div className="rounded-xl border border-slate-200 p-4">
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

          {/* Collapsed by default: the score and the gauge/shape above
              already say where they stand, so the reason behind it is a
              click away rather than another paragraph everyone scrolls
              past. */}
          <ul className="grid gap-2 lg:grid-cols-2">
            {review.skillScores.map((s) => (
              <li key={s.skill}>
                <details className="rounded-lg border border-slate-200 p-3 open:bg-slate-50">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.86rem]">
                    <span className="font-medium text-slate-700">{s.skill}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`font-semibold ${TONE[toneOf(s.score)].text}`}>
                        {s.score}
                      </span>
                      <ChevronRight size={13} className="text-slate-400" />
                    </span>
                  </summary>
                  {s.why && (
                    <p className="mt-2 text-[0.82rem] leading-relaxed text-slate-500">
                      <Evidence text={s.why} />
                    </p>
                  )}
                </details>
              </li>
            ))}
          </ul>
        </>
      )}

      <details className="rounded-xl border border-slate-200 p-3.5">
        <summary className="cursor-pointer text-[0.86rem] font-semibold text-slate-700">
          How much of the job you got to
        </summary>
        <p className="mt-1 text-[0.8rem] text-slate-500">
          This shows how often each skill appeared in your answered questions.
          Fewer examples mean there is less evidence for that skill.
        </p>
        <ul className="mt-3 grid gap-2.5">
          {readout.skills.map((s) => {
            const pct = clamp(s.inSitting === 0 ? 0 : (s.attempted / s.inSitting) * 100);
            return (
              <li key={s.skill}>
                <div className="flex items-baseline justify-between gap-3 text-[0.84rem]">
                  <span className="font-medium text-slate-700">{s.skill}</span>
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
                    className={`h-full rounded-full ${s.attempted === 0 ? "bg-slate-300" : "bg-brand-teal"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </details>

      {readout.repeated.length > 0 && (
        <Panel title="Situations you went back to">
          <ul className="grid gap-1.5 text-[0.84rem] text-slate-600">
            {readout.repeated.map((r) => (
              <li key={r.sceneTitle}>
                {r.sceneTitle} · {r.attempts} goes
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

/** How they worked with the AI assistant, on its own - one of the three
 * things this assessment measures, not a line inside the summary. */
export function AiPanel({ usingAI }: { usingAI: NonNullable<AssessmentReview["usingAI"]> }) {
  const tone = TONE[toneOf(usingAI.score)];
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[0.9rem] font-semibold tracking-tight text-slate-900">
          How you worked with the AI assistant
        </h2>
        <span className={`text-[1.1rem] font-semibold ${tone.text}`}>
          {usingAI.score}
          <span className="ml-1 text-[0.78rem] font-normal text-slate-400">of 100</span>
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={`Working with AI: ${usingAI.score} out of 100`}
      >
        <div className="h-full rounded-full" style={{ width: `${clamp(usingAI.score)}%`, background: tone.ring }} />
      </div>
      {usingAI.why && (
        <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-600">
          <Evidence text={usingAI.why} />
        </p>
      )}
    </div>
  );
}

/** Every answer, read back in full - the longest thing in the report and the
 * one part that proves the scores were read off real work. */
export function AnswersPanel({ scenes }: { scenes: AssessmentReview["scenes"] }) {
  return (
    <ul className="grid gap-3">
      {scenes.map((sc) => (
        <li key={sc.sceneId} className="rounded-xl bg-slate-50 p-3.5">
          {sc.did && (
            <p className="text-[0.86rem] leading-relaxed text-slate-700">
              <Evidence text={sc.did} />
            </p>
          )}
          {sc.better && (
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-slate-600">
              <span className="font-semibold">Stronger:</span> <Evidence text={sc.better} />
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
