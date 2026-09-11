"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  checkJobFit,
  type NextAction,
  type FitAxis,
  type JobFitCheck,
  type ReqState,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/signup-gate";
import { FitRadar, ReadinessRing } from "@/components/fit-chart";
import { WorkShelf } from "@/components/work-rail";

// The Job Fit dashboard: paste a posting, see where you stand against it.
//
// The number is readiness against this one posting and it is labelled that
// way every single time it appears. It is not odds of an offer, nobody can
// give those, and the moment this screen implies otherwise it is lying to
// somebody about the most important thing in their week.
//
// The requirement list underneath is what makes the number defensible.
// Anybody who doubts it can see the four to six lines it was built from and
// exactly what each one rests on - which is also why the middle state exists:
// "claimed" means it is on your record and nothing backs it up, and those are
// the questions you will be asked and cannot answer.

const MIN_POSTING = 120;

// The four things somebody can actually do about a gap, and where each one
// opens. The analyser picks from exactly this list - free prose here would
// wander into portfolios, courses and certifications, all of which may be true
// advice and none of which this product can help with.
const ACTIONS: Record<NextAction, { href: string; label: string }> = {
  "practice-question": {
    href: "/interview/questions",
    label: "Practise the questions this tests",
  },
  // The story bank is closed while it is finished, so its suggestion points
  // at the place the story would come from instead of at a shut door.
  story: {
    href: "/interview/questions",
    label: "Practise answering it",
  },
  interview: { href: "/interview/practice", label: "Run a practice interview" },
  record: { href: "/profile", label: "Add it to your record" },
};

const TONE: Record<ReqState, { chip: string; word: string }> = {
  proof: { chip: "bg-teal-50 text-teal-800 ring-teal-600/25", word: "Proven" },
  claim: {
    chip: "bg-amber-50 text-amber-900 ring-amber-600/25",
    word: "Claimed",
  },
  gap: {
    chip: "bg-slate-100 text-slate-600 ring-slate-400/25",
    word: "Nothing yet",
  },
};

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

function Chip({ s }: { s: ReqState }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ring-1 ring-inset ${TONE[s].chip}`}
    >
      {TONE[s].word}
    </span>
  );
}

/**
 * A date the same on the server and in the browser.
 *
 * Intl with a local timezone renders differently in the two, which React
 * reports as a hydration mismatch on a page nobody was looking at the date on.
 * UTC parts are the same everywhere.
 */
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function JobFit({
  checks: initialChecks,
  axes,
  signedOut = false,
}: {
  /** Their checks, newest first - or the one worked example when signed out. */
  checks: JobFitCheck[];
  axes: FitAxis[];
  signedOut?: boolean;
}) {
  const [posting, setPosting] = useState("");
  const [checks, setChecks] = useState<JobFitCheck[]>(initialChecks);
  // Which half of the feature is showing: the check you are about to run, or
  // the ones you have run before. The same two-way switch the resume builder
  // and the interview console have, so "where are my old ones" is answered
  // the same way on every feature that keeps any.
  const [pane, setPane] = useState<"make" | "keep">("make");
  // Nothing is on screen until they ask for it.
  //
  // Opening on the most recent check put an old result beside an empty box,
  // which reads as the answer to whatever you are about to paste - and the
  // one thing this screen must never do is attach a verdict to the wrong job.
  // Past checks are one press away in the list below; they are not the
  // default view.
  //
  // Signed out is the exception: the worked example is the only thing on that
  // page worth looking at, and it is labelled as somebody else's.
  const [selectedId, setSelectedId] = useState<string | null>(
    signedOut ? (initialChecks[0]?.id ?? null) : null,
  );
  const check = checks.find((c) => c.id === selectedId) ?? null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<GatedAction | null>(null);

  const run = useCallback(async () => {
    if (signedOut) {
      setGate({
        what: "a fit check against your own record",
        why: "Checking you against a posting means reading everything you have done here - your stories, your answers, your interviews - so there has to be a record, and it has to belong to somebody. The example below is what it produces.",
      });
      return;
    }
    if (posting.trim().length < MIN_POSTING) return;
    setBusy(true);
    setError(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Your session expired. Reload the page and sign in again.");
      return;
    }
    const result = await checkJobFit(t, posting.trim());
    setBusy(false);
    if (!result) {
      setError("Could not reach the analyser — try again in a moment.");
      return;
    }
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setChecks((list) => [result.check, ...list]);
    setSelectedId(result.check.id);
    setPosting("");
  }, [posting, signedOut]);

  const left = MIN_POSTING - posting.trim().length;
  const counts = check
    ? {
        proof: check.requirements.filter((r) => r.state === "proof").length,
        claim: check.requirements.filter((r) => r.state === "claim").length,
        gap: check.requirements.filter((r) => r.state === "gap").length,
      }
    : null;

  return (
    <>
      {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}

      {pane === "keep" && !signedOut && checks.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h1 className="font-display text-[1.35rem] font-bold tracking-tight text-brand-ink">
              Your checks
            </h1>
            <WorkShelf
              make={{ label: "New check", sub: "Paste a posting" }}
              keep={{
                label: "Your checks",
                sub: `Newest ${shortDate(checks[0]!.createdAt)}`,
                count: checks.length,
              }}
              at={pane}
              onPick={setPane}
            />
          </div>
          <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-500">
            Every check is kept, so a second run three weeks later can be read
            beside the first.
          </p>
          <ul className="mt-3 grid gap-2">
            {checks.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id);
                    setPane("make");
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left transition-colors hover:border-brand-teal/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9rem] font-semibold leading-snug text-brand-ink">
                      {c.roleTitle}
                    </span>
                    <span className="block text-[0.74rem] text-slate-400">
                      Checked {shortDate(c.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.95rem] font-bold text-brand-teal-deep">
                    {c.readiness}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* ---- the ask ---- */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-tight text-brand-ink">
                Am I ready for this job?
              </h1>
              {/* The same control every other feature has, so "where are the
                ones I ran before" is answered the same way everywhere. The
                list below is still there; this is the way in from the top of
                the page, which is where somebody looks first. */}
              {!signedOut && checks.length > 0 && (
                <WorkShelf
                  make={{ label: "New check", sub: "Paste a posting" }}
                  keep={{
                    label: "Your checks",
                    sub: `Newest ${shortDate(checks[0]!.createdAt)}`,
                    count: checks.length,
                  }}
                  at={selectedId ? "keep" : "make"}
                  onPick={(next: "make" | "keep") =>
                    setSelectedId(
                      next === "keep" ? (checks[0]?.id ?? null) : null,
                    )
                  }
                />
              )}
            </div>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-slate-600">
              Paste a job description. Ascend compares it against what you have
              actually done here and shows your match, your gaps, and what to
              improve before applying.
            </p>

            <label htmlFor="posting" className="sr-only">
              The job description
            </label>
            <textarea
              id="posting"
              rows={9}
              value={posting}
              disabled={busy}
              onChange={(e) => setPosting(e.target.value)}
              placeholder="Paste the responsibilities and what they are asking for…"
              className="mt-3 min-h-[11rem] w-full resize-y rounded-xl border border-slate-300 bg-surface px-3.5 py-2.5 text-[0.85rem] leading-relaxed outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25 disabled:opacity-60"
            />
            <p className="mt-1.5 text-[0.78rem] text-slate-500">
              {left > 0 && posting.length > 0
                ? `${left} more characters — the responsibilities are the part that matters.`
                : "A job title on its own is not enough to check you against."}
            </p>

            {error && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.83rem] leading-relaxed text-amber-900">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={busy || (!signedOut && left > 0)}
              onClick={() => void run()}
              className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-brand-teal-deep px-6 text-[0.88rem] font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-40 sm:w-auto"
            >
              {busy ? "Reading the posting…" : "Check my fit"}
            </button>

            {axes.length >= 3 && (
              <dl className="mt-5 grid gap-1.5 border-t border-slate-200 pt-4">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                  What the chart counted, and where from
                </p>
                {axes.map((a) => (
                  <div key={a.label} className="flex gap-2 text-[0.8rem]">
                    <dt className="w-24 shrink-0 font-semibold text-brand-ink">
                      {a.label}
                    </dt>
                    <dd className="min-w-0 flex-1 text-slate-500">{a.basis}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* ---- the answer ---- */}
          <div className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-5">
            {!check ? (
              <div className="py-10 text-center">
                <p className="text-[0.88rem] text-slate-500">
                  Paste a posting and the result appears here.
                </p>
                {checks.length > 0 && (
                  <p className="mt-1.5 text-[0.8rem] text-slate-400">
                    Or open one of the {checks.length} you have already run.
                  </p>
                )}
              </div>
            ) : (
              <>
                {signedOut && (
                  <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-[0.78rem] leading-snug text-slate-600">
                    <strong className="font-semibold">An example</strong> — this
                    is somebody else&apos;s check, not yours. Yours would be
                    measured against your own record.
                  </p>
                )}

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[0.9rem] font-bold text-brand-ink">
                    {check.roleTitle}
                  </p>
                  {!signedOut && (
                    <p className="text-[0.75rem] text-slate-400">
                      Checked {shortDate(check.createdAt)}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-5">
                  <div className="text-center">
                    <ReadinessRing value={check.readiness} />
                    <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Readiness
                    </p>
                  </div>
                  {check.axes.length >= 3 && (
                    <div className="min-w-[13rem] flex-1">
                      <p className="text-center text-[0.7rem] font-bold text-slate-500">
                        You against what this job asks
                      </p>
                      <FitRadar axes={check.axes} />
                      <div className="mt-1 flex justify-center gap-3 text-[0.65rem] font-semibold">
                        <span className="flex items-center gap-1 text-teal-800">
                          <span
                            aria-hidden
                            className="h-2 w-2 rounded-sm bg-brand-teal-deep"
                          />
                          You
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <span
                            aria-hidden
                            className="h-2 w-2 rounded-sm bg-slate-400"
                          />
                          This job
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-[0.88rem] font-semibold leading-snug text-brand-ink">
                  {check.verdict}
                </p>
                {/* Said wherever the number is, without exception. */}
                <p className="mt-1 text-[0.75rem] leading-snug text-slate-400">
                  Readiness for this posting, from your own record. It is not a
                  chance of being hired — nobody can tell you that.
                </p>

                <ul className="mt-3 grid gap-2 border-t border-slate-200 pt-3">
                  {check.requirements.map((r) => (
                    <li key={r.need} className="flex flex-wrap gap-2">
                      <Chip s={r.state} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.83rem] font-semibold leading-snug text-brand-ink">
                          {r.need}
                        </span>
                        <span className="block text-[0.78rem] leading-snug text-slate-500">
                          {r.note}
                        </span>
                        <span className="block text-[0.7rem] text-slate-400">
                          {r.from}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                {counts && counts.claim > 0 && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-amber-900">
                    <strong className="font-semibold">
                      {counts.claim === 1
                        ? "One thing here is claimed and not proven."
                        : `${counts.claim} things here are claimed and not proven.`}
                    </strong>{" "}
                    In an interview those are the questions you will be asked
                    and cannot answer.
                  </p>
                )}

                {/* Said before anything else, because a readiness figure for a
                  job this product does not prepare anybody for is a number
                  about the wrong thing. */}
                {check.inScope === false && (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[0.83rem] leading-relaxed text-amber-900">
                    <strong className="font-semibold">
                      This is not the kind of work Ascend gets you ready for.
                    </strong>{" "}
                    It prepares people for early-career non-technical roles. The
                    marks below are still honest about what you have — they are
                    just measured against a job we cannot coach you into.
                  </p>
                )}

                {check.nextStep && (
                  <div className="mt-3 rounded-xl border border-brand-teal/40 bg-teal-50/50 p-3.5">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-teal-800">
                      The one thing to do next
                    </p>
                    <p className="mt-1 text-[0.85rem] leading-relaxed text-slate-700">
                      {check.nextStep}
                    </p>
                    {/* The readiness assessment leads, whatever the specific
                        advice above says.

                        A fit check reads a posting against the record
                        somebody already has - so a gap it finds is either
                        something they have never done, or something they did
                        and we have no measure of. Both are answered by the
                        assessment: twenty minutes on the job's own work,
                        marked, which is the only thing here that turns a
                        claim into evidence. Sending somebody straight to
                        interview questions skips the step that would have
                        told them what to practise.

                        The backend's own suggestion is kept underneath rather
                        than dropped - it is more specific than this, and a
                        button that says one thing and goes somewhere else is
                        the thing to avoid. */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <Link
                        href="/practice/readiness"
                        className="inline-flex min-h-10 cursor-pointer items-center rounded-xl bg-brand-teal-deep px-4 text-[0.82rem] font-bold text-white transition-colors hover:bg-brand-teal"
                      >
                        Check where you stand for this role
                      </Link>
                      {check.nextAction && (
                        <Link
                          href={ACTIONS[check.nextAction].href}
                          className="min-h-10 cursor-pointer text-[0.8rem] font-semibold text-slate-500 underline underline-offset-2 transition-colors hover:text-brand-ink"
                        >
                          {ACTIONS[check.nextAction].label}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
