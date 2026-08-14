"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  answerAdaptive,
  answerAdaptiveOpen,
  getAdaptive,
  getRoleBriefs,
  restartAdaptive,
  selectDiscoveryRole,
  type AdaptiveState,
  type DiscoveryState,
  type RoleBrief as RoleBriefData,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { track } from "@/lib/footprints";
import { RememberHub } from "@/components/remember-hub";
import { BackLink } from "@/components/back-link";
import { RolePreview } from "@/components/role-preview";
import { RoleCompare } from "@/components/role-compare";
import { RoleBrief } from "@/components/role-brief";
import { MatchForming } from "@/components/match-forming";
import { BuildingMatches } from "@/components/building-matches";
import { Check, ChevronRight, Circle, Spark } from "@/components/icons";

// The 3–5 minute Discovery flow (MVP deliverable 4). The server chooses each
// question from the published bank based on what has been answered so far, so
// no two people walk the same path and the run ends as soon as one role is
// clearly ahead. This screen holds no questions of its own — it renders
// whatever it is handed and sends back the answer.

type Stage = "intro" | "questions" | "explanation" | "results";

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

// How someone answered, measured in the browser because it is about pace and
// hesitation, which the server cannot see. Kept as a ref: it must never cause
// a re-render, and it is read only when a payload is built.
type SignalTally = {
  shownAt: number;
  perQuestionMs: number[];
  changedAnswers: number;
  rereadOptions: number;
  skippedOptional: boolean;
  seen: Set<string>;
};

const FAST_ANSWER_MS = 3500;

function emptyTally(): SignalTally {
  return {
    shownAt: 0,
    perQuestionMs: [],
    changedAnswers: 0,
    rereadOptions: 0,
    skippedOptional: false,
    seen: new Set<string>(),
  };
}

// Called from effects and event handlers only, never while rendering.
function markShown(tally: SignalTally, questionId: string): void {
  if (tally.seen.has(questionId)) tally.rereadOptions += 1;
  else tally.seen.add(questionId);
  tally.shownAt = Date.now();
}

// Returns how long the question was on screen, which the server uses to decide
// whether the answer could have been read at all.
function markAnswered(tally: SignalTally, wasAnsweredBefore: boolean): number {
  const elapsed = tally.shownAt > 0 ? Date.now() - tally.shownAt : 0;
  if (tally.shownAt > 0) tally.perQuestionMs.push(elapsed);
  if (wasAnsweredBefore) tally.changedAnswers += 1;
  tally.shownAt = Date.now();
  return elapsed;
}

function summarise(tally: SignalTally) {
  const times = tally.perQuestionMs;
  const quick =
    times.length >= 3 &&
    times.filter((ms) => ms < FAST_ANSWER_MS).length / times.length >= 0.75 &&
    tally.changedAnswers === 0;
  return {
    answersQuickly: quick,
    changedAnswers: tally.changedAnswers,
    skippedOptional: tally.skippedOptional,
    rereadOptions: tally.rereadOptions,
  };
}

export function DiscoveryFlow({ initial }: { initial: DiscoveryState | null }) {
  const content = initial?.content ?? null;
  const [run, setRun] = useState<AdaptiveState | null>(null);
  const [stage, setStage] = useState<Stage>("intro");
  // Arriving with a finished run — from "Continue path", or just coming back —
  // must show the result, never restart the survey.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const t = await token();
      if (!t) return;
      const state = await getAdaptive(t);
      if (cancelled || !state) return;
      if (state.done && state.matches.length > 0) {
        setRun(state);
        setStage("results");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const [selectedRole, setSelectedRole] = useState<string | null>(
    initial?.attempt?.selectedRole ?? null,
  );
  const tally = useRef<SignalTally>(emptyTally());
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Role reality and comparison are overlays over the matches, never
  // separate pages: opening one never loses the results behind it.
  const [previewRole, setPreviewRole] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  // Landing on a question counts as shown; seeing it twice is a re-read.
  useEffect(() => {
    const q = run?.question;
    if (q) markShown(tally.current, q.id);
  }, [run?.question]);

  // The personal read-out, fetched once the result is on screen. The scores
  // are arithmetic and appear instantly; this is written, so it arrives a
  // moment later rather than holding the whole page back. The server writes it
  // once per recommendation, so every later visit is a database read.
  const [briefs, setBriefs] = useState<RoleBriefData[] | null>(null);
  // A ref, not state: asking twice would be a wasted round trip, and guarding
  // with state would mean setting state from an effect body.
  const briefsAsked = useRef(false);
  const hasResults = stage === "results" && (run?.matches.length ?? 0) > 0;
  const briefsLoading = hasResults && briefs === null;
  useEffect(() => {
    if (!hasResults || briefsAsked.current) return;
    briefsAsked.current = true;
    let cancelled = false;
    void (async () => {
      // The read-out is written by a model on the first visit, and a single
      // slow or failed write used to land here as "no read-out at all" — the
      // page then showed matches with their why missing until the next
      // visit. So ask up to three times before accepting that. Once written
      // it is kept server-side, so a retry after a success is a cheap read.
      for (let attempt = 0; attempt < 3; attempt++) {
        const t = await token();
        const response = t ? await getRoleBriefs(t) : null;
        if (cancelled) return;
        if (response?.status === "ready") {
          setBriefs(response.briefs);
          return;
        }
        // "none" means no finished run — nothing a retry could change.
        if (response?.status === "none") break;
        await new Promise((resolve) => setTimeout(resolve, 2500));
        if (cancelled) return;
      }
      // An empty list is a real answer: the screen shows the engine's own
      // lines and says nothing about what is missing.
      setBriefs([]);
    })();
    return () => {
      cancelled = true;
      briefsAsked.current = false;
    };
  }, [hasResults]);

  if (!content) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Discovery couldn&apos;t load
        </h1>
        <p className="mt-3 text-slate-600">
          The server may just be waking up — give it a moment and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-brand-violet px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-violet-deep"
        >
          Try again
        </button>
      </main>
    );
  }

  async function begin(fresh: boolean) {
    setBusy(true);
    setError(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      return;
    }
    const state = fresh ? await restartAdaptive(t) : await getAdaptive(t);
    setBusy(false);
    if (!state) {
      setError("Could not start — try again.");
      return;
    }
    // A read-out kept from a previous run would hold the results gate open:
    // the next completion would skip "Building your matches" and show the
    // old why (or none) while the new one was still being written. Starting
    // a run always empties the shelf.
    setBriefs(null);
    setRun(state);
    setStage(state.done ? "results" : state.question?.kind === "explanation" ? "explanation" : "questions");
    track({ family: "engagement", event: "discovery_started", module: "discovery" });
  }

  // Send one answer, get the next question. The server decides what comes
  // next, so the sequence adapts to what has been said so far.
  async function answerCurrent(optionId: string) {
    const question = run?.question;
    if (!question || question.kind === "explanation") return;
    const ms = markAnswered(tally.current, false);
    track({
      family: question.kind === "choice" ? "interest" : "scenario",
      event: question.kind === "choice" ? "choice_answered" : "scenario_answered",
      module: "discovery",
      target: question.id,
    });
    setBusy(true);
    const t = await token();
    if (!t) {
      setBusy(false);
      return;
    }
    const state = await answerAdaptive(t, {
      questionId: question.id,
      optionId,
      ms,
      signals: summarise(tally.current),
    });
    setBusy(false);
    if (!state) {
      setError("Could not save that — try again.");
      return;
    }
    setRun(state);
    if (state.done) setStage("results");
    else if (state.question?.kind === "explanation") setStage("explanation");
  }

  async function finish(skip: boolean) {
    const question = run?.question;
    if (!question) return;
    tally.current.skippedOptional = skip || !explanation.trim();
    setBusy(true);
    setError(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      return;
    }
    const state = await answerAdaptiveOpen(t, {
      questionId: question.id,
      text: skip ? "" : explanation.trim(),
    });
    setBusy(false);
    if (!state) {
      setError("Could not finish — try again.");
      return;
    }
    setRun(state);
    setStage("results");
  }

  async function choose(roleId: string) {
    setBusy(true);
    setError(null);
    const t = await token();
    if (!t) return;
    const updated = await selectDiscoveryRole(t, roleId, crypto.randomUUID());
    if (!updated) {
      setError("Could not save your choice — try again.");
      setBusy(false);
      return;
    }
    setSelectedRole(roleId);
    setBusy(false);
    track({
      family: "decision",
      event: "discovery_role_selected",
      module: "discovery",
      target: roleId,
    });
  }

  // ---------- intro ----------
  if (stage === "intro") {
    const resuming = (run?.askedCount ?? 0) > 0 && !run?.done;
    return (
      <main className="mx-auto max-w-5xl px-4 pb-10">
        <RememberHub path="/discover" />
        <div className="pt-4">
          <BackLink />
        </div>
        <section className="mt-4 rounded-2xl bg-brand-panel px-6 py-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-teal-soft">
            Discovery
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Discover what fits you.
          </h1>
          <p className="mt-1.5 text-sm text-white/70">
            3–5 minutes of real work choices — no test, no wrong answers. Your
            picks build three explainable role matches.
          </p>
        </section>
        <section className="mt-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Five worlds your matches come from
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {content.worlds.map((w) => (
              <li
                key={w.id}
                title={w.caption}
                className="rounded-full border border-slate-200 bg-surface px-3 py-1.5 text-[0.82rem] font-semibold text-slate-700"
              >
                {w.title}
              </li>
            ))}
          </ul>
        </section>
        <button
          type="button"
          disabled={busy}
          onClick={() => void begin(false)}
          // Full width on a phone where it is the whole thumb target; sized to
          // its words on a wide screen, where a 64rem button looks like a bar.
          className="mt-6 w-full rounded-xl bg-brand-violet px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-50 sm:w-auto"
        >
          {resuming ? "Continue where you left off" : "Begin Discovery"}
        </button>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </main>
    );
  }

  // ---------- questions ----------
  if (stage === "questions") {
    const question = run?.question;
    if (!question || question.kind === "explanation") return null;
    const answered = run?.askedCount ?? 0;
    // Progress is how sure the run is, not how many questions have gone by.
    // The survey ends by knowing, so the bar has to measure knowing — and a
    // bar that stalls is telling the truth about a question that told us
    // little, which is more useful than one that always creeps forward.
    const sure = run?.confidence ?? 0;
    const prompt =
      question.kind === "choice" ? question.prompt : question.situation;

    return (
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col px-4 pb-8">
        <div className="pt-4">
          <BackLink />
        </div>

        {/* How close Ascend is to knowing — the only number on the screen. */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-slate-400">
              Moment {answered + 1}
            </span>
            <span className="text-[0.72rem] tabular-nums text-slate-400">
              {sure > 0 ? `${sure}% of the way to your match` : "Getting to know you"}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-teal transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.max(4, sure)}%` }}
            />
          </div>
        </div>

        <section className="mt-8" key={question.id}>
          {question.kind === "scenario" && (
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-brand-teal-deep">
              A moment on the job
            </p>
          )}
          <h1 className="mt-1.5 animate-fade-up text-[1.35rem] font-semibold leading-snug tracking-tight text-slate-900 sm:text-[1.6rem] [text-wrap:balance]">
            {prompt}
          </h1>

          {/* One option per row. Two long labels side by side turn a choice
              into a reading comprehension test; stacked, each one is read on
              its own and the eye travels down the same line every time. */}
          <div className="mt-5 grid gap-2.5">
            {question.options.map((option, i) => (
              <button
                key={option.id}
                type="button"
                disabled={busy}
                onClick={() => void answerCurrent(option.id)}
                style={{ animationDelay: `${60 + i * 70}ms` }}
                className="group flex min-h-14 animate-fade-up cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-surface px-4 py-4 text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand-violet hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet disabled:cursor-default disabled:opacity-60 motion-reduce:hover:translate-y-0 sm:px-5 sm:py-[1.15rem]"
              >
                <span className="min-w-0 flex-1 text-[0.98rem] leading-relaxed text-slate-800">
                  {option.label}
                </span>
                {/* Empty ring, filled on hover and focus. It says "this is a
                    choice" without numbering the choices, and it is the same
                    shape a person met on the landing page. */}
                <span className="shrink-0 text-slate-300 transition-colors group-hover:text-brand-violet">
                  <Circle size={22} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* What the last answer did to the picture. It is the only thing
            Ascend says back mid-survey, and it is what turns a form into a
            conversation — you answer, and something is visibly listening. */}
        <div className="mt-5 min-h-9">
          {run?.noted && (
            <p
              role="status"
              className="flex animate-fade-in gap-2 text-[0.85rem] text-slate-500"
            >
              <span className="mt-0.5 shrink-0 text-brand-teal">
                <Spark size={15} />
              </span>
              <span>{run.noted}</span>
            </p>
          )}
        </div>

        <MatchForming confidence={sure} answered={answered} />

        <p className="mt-auto pt-6 text-center text-xs text-slate-400">
          No wrong answers · saved as you go
        </p>
        {error && <p className="mt-3 text-center text-sm text-rose-600">{error}</p>}
      </main>
    );
  }

  // ---------- optional explanation ----------
  if (stage === "explanation") {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-10">
        <div className="pt-4">
          <BackLink />
        </div>
        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal-deep">
            One optional question
          </p>
          {/* The question the server chose for whatever they showed most of —
              not a fixed line. */}
          <h1 className="mt-1.5 text-lg font-semibold leading-snug tracking-tight text-slate-900">
            {run?.question?.kind === "explanation"
              ? run.question.prompt
              : "In your own words — what kind of work makes you feel useful?"}
          </h1>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            maxLength={2000}
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-surface px-4 py-3 text-[0.95rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/25"
            placeholder="Optional — a sentence or two is plenty."
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void finish(false)}
              className="w-full rounded-xl bg-brand-violet px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-50 sm:w-auto"
            >
              {busy ? "Working it out…" : "See my matches"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void finish(true)}
              className="rounded-xl px-4 py-2.5 text-sm text-slate-500 hover:text-slate-900"
            >
              Skip
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </section>
      </main>
    );
  }

  // ---------- results ----------
  // The whole result arrives at once. The roles are ready before the written
  // read-out is, but revealing them in two beats looked broken — so the wait
  // is owned by a screen that narrates what is happening instead.
  if (briefsLoading) {
    return <BuildingMatches />;
  }

  const matches = run?.matches ?? [];
  const worldTitle = (id: string) =>
    content.worlds.find((w) => w.id === id)?.title ?? id;
  const selected = selectedRole;
  const roleById = (id: string) => content.roles.find((r) => r.roleId === id);
  const matchLineFor = (id: string) => {
    const m = matches.find((x) => x.roleId === id);
    return m ? `${m.band} fit · ${m.score}% match with your choices` : undefined;
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-8">
      <div className="pt-3">
        <BackLink />
      </div>
      <section className="mt-3 rounded-2xl bg-brand-panel px-5 py-3 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-teal-soft">
          Your matches
        </p>
        <h1 className="mt-0.5 text-lg font-semibold tracking-tight">
          Three roles your choices kept pointing at
        </h1>
        <p className="mt-0.5 text-[0.74rem] text-white/65">
          The % is how closely a role matches your choices — not a score of
          your ability.
        </p>
      </section>

      {/* Said plainly rather than hidden: some answers came back faster than
          the question could be read, so they were left out. Better to name it
          and offer the fix than to present a thin result as a firm one. */}
      {(run?.rushed ?? 0) > 0 && (
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[0.82rem] leading-snug text-amber-900">
          <strong className="font-semibold">This is a first read.</strong>{" "}
          {run!.rushed === 1 ? "One answer came" : `${run!.rushed} answers came`}{" "}
          back faster than the question could be read, so{" "}
          {run!.rushed === 1 ? "it was" : "they were"} left out. Take it again
          slowly and these matches will sharpen.
        </p>
      )}

      <div className="mt-2 grid gap-2.5">
        {matches.map((match, i) => {
          const brief = briefs?.find((b) => b.roleId === match.roleId) ?? null;
          return (
            <section
              key={match.roleId}
              // Clicking the card opens the full picture. Anything genuinely
              // interactive inside it — the compare box, the read-out toggle,
              // the two buttons — does its own job instead. No role="button"
              // here: a button containing buttons is announced wrongly, and
              // "See the reality" below is the keyboard path.
              onClick={(event) => {
                const el = event.target as HTMLElement;
                if (el.closest("button, a, input, label, summary")) return;
                setPreviewRole(match.roleId);
              }}
              style={{ animationDelay: `${i * 90}ms` }}
              className={`animate-fade-up cursor-pointer rounded-2xl border bg-surface p-4 transition-colors hover:shadow-md ${
                selected === match.roleId
                  ? "border-brand-teal ring-2 ring-brand-teal/25"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-[1.05rem] font-semibold text-slate-900">
                  {i + 1}. {match.title}
                </h2>
                <span className="text-xs text-slate-400">{worldTitle(match.world)}</span>
                <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[0.75rem] text-slate-500 hover:text-slate-700">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(match.roleId)}
                    onChange={(e) =>
                      setCompareIds((ids) =>
                        e.target.checked
                          ? [...ids, match.roleId]
                          : ids.filter((id) => id !== match.roleId),
                      )
                    }
                    className="h-3.5 w-3.5 accent-[#6d5ce7]"
                  />
                  Compare
                </label>
              </div>
              <p className="mt-0.5 text-[0.82rem] text-slate-600">{match.summary}</p>

              {/* The engine's own line stays: it is the auditable reason this
                  role is here, and it renders with or without the read-out. */}
              <ul className="mt-1.5 grid gap-1">
                {match.why.slice(0, 1).map((reason) => (
                  <li key={reason} className="text-[0.8rem] leading-snug text-slate-500">
                    · {reason}
                  </li>
                ))}
              </ul>
              {match.uncertainty && (
                <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[0.72rem] text-amber-800">
                  {match.uncertainty}
                </p>
              )}

              {/* Folded away on every match, not just the ones below the top.
                  Three open read-outs is a wall of text, and a person who has
                  just been handed three roles wants the shortlist first and the
                  reasoning when they ask for it. */}
              {brief && (
                <details className="group mt-3">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[0.84rem] font-semibold text-brand-violet-deep [&::-webkit-details-marker]:hidden">
                    <span
                      aria-hidden
                      className="transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
                    >
                      <ChevronRight size={16} />
                    </span>
                    Why this suits you
                  </summary>
                  <div className="mt-2.5">
                    <RoleBrief brief={brief} title={match.title} />
                  </div>
                </details>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${
                    match.band === "strong"
                      ? "bg-teal-50 text-teal-700"
                      : match.band === "adjacent"
                        ? "bg-violet-50 text-violet-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {match.band} fit · {match.score}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewRole(match.roleId)}
                  className="text-[0.8rem] font-semibold text-slate-500 hover:text-slate-900"
                >
                  See the reality
                </button>
                <button
                  type="button"
                  disabled={busy || selected === match.roleId}
                  onClick={() => void choose(match.roleId)}
                  className={`ml-auto rounded-xl px-4 py-1.5 text-[0.82rem] font-bold transition-colors ${
                    selected === match.roleId
                      ? "bg-brand-teal text-white"
                      : "bg-brand-violet text-white hover:bg-brand-violet-deep"
                  } disabled:opacity-60`}
                >
                  {selected === match.roleId ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check size={14} /> Selected
                    </span>
                  ) : "Choose this role"}
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* The rest of the catalogue, plainly. Not a browse experience — just a
          way to look past your own three without being sold anything. */}
      {(() => {
        const matchedIds = new Set(matches.map((m) => m.roleId));
        const others = (content.catalogue ?? []).filter(
          (role) => !matchedIds.has(role.id),
        );
        if (others.length === 0) return null;
        return (
          <section className="mt-6">
            <h2 className="text-[0.95rem] font-semibold text-slate-900">
              Other roles
            </h2>
            <p className="mt-0.5 text-[0.82rem] text-slate-500">
              Your matches are a starting point, not a verdict.
            </p>
            {/* One per row, like the matches above — the page reads as a
                single list rather than two different layouts. */}
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {others.map((role) => (
                // A card, not a button: it carries its own compare and choose
                // controls, and a button cannot contain buttons.
                <div
                  key={role.id}
                  onClick={(event) => {
                    const el = event.target as HTMLElement;
                    if (el.closest("button, a, input, label, summary")) return;
                    setPreviewRole(role.id);
                  }}
                  className="flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-surface p-3.5 transition-colors hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewRole(role.id)}
                      className="group min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
                    >
                      <span className="block text-[0.9rem] font-semibold text-slate-900 transition-colors group-hover:text-brand-violet-deep">
                        {role.title}
                      </span>
                      {role.summary && (
                        <span className="mt-0.5 block text-[0.78rem] leading-snug text-slate-500">
                          {role.summary}
                        </span>
                      )}
                    </button>
                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[0.75rem] text-slate-500 hover:text-slate-700">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(role.id)}
                        onChange={(e) =>
                          setCompareIds((ids) =>
                            e.target.checked
                              ? [...ids, role.id]
                              : ids.filter((id) => id !== role.id),
                          )
                        }
                        className="h-3.5 w-3.5 accent-[#6d5ce7]"
                      />
                      Compare
                    </label>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewRole(role.id)}
                      className="text-[0.78rem] font-semibold text-slate-500 hover:text-slate-900"
                    >
                      See the reality
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void choose(role.id)}
                      className={`ml-auto rounded-xl px-3.5 py-1.5 text-[0.78rem] font-bold transition-colors disabled:opacity-60 ${
                        selected === role.id
                          ? "bg-brand-teal text-white"
                          : "border border-slate-300 text-slate-700 hover:border-brand-violet hover:text-brand-violet-deep"
                      }`}
                    >
                      {selected === role.id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check size={14} /> Selected
                    </span>
                  ) : "Choose this role"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {selected && selected !== "none" && (
        <section className="mt-3 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Role saved to your career record. Next:{" "}
          <Link href="/readiness" className="font-bold underline">
            check your readiness for it
          </Link>{" "}
          — or{" "}
          <Link href="/start" className="font-bold underline">
            revisit your path
          </Link>
          .
        </section>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => void begin(true)}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Retake Discovery
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {compareIds.length >= 2 && (
        <div className="sticky bottom-3 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-surface/95 px-4 py-2.5 shadow-lg backdrop-blur">
          <span className="flex-1 text-[0.8rem] text-slate-600">
            {compareIds.length} roles selected
          </span>
          <button
            type="button"
            onClick={() => setCompareIds([])}
            className="text-[0.8rem] text-slate-400 hover:text-slate-700"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setComparing(true)}
            className="rounded-lg bg-brand-panel px-4 py-1.5 text-[0.8rem] font-bold text-white"
          >
            Compare
          </button>
        </div>
      )}

      {previewRole && roleById(previewRole) && (
        <RolePreview
          role={roleById(previewRole)!}
          matchLine={matchLineFor(previewRole)}
          chosen={selected === previewRole}
          choosing={busy}
          onClose={() => setPreviewRole(null)}
          onChoose={() => void choose(previewRole)}
        />
      )}

      {comparing && compareIds.length >= 2 && (
        <RoleCompare
          roles={compareIds
            .map(roleById)
            .filter((r): r is NonNullable<typeof r> => Boolean(r))}
          // Titles come from the whole catalogue: a role compared from "Other
          // roles" is not in the matches and would otherwise be nameless.
          titles={Object.fromEntries([
            ...(content.catalogue ?? []).map((r) => [r.id, r.title]),
            ...matches.map((m) => [m.roleId, m.title]),
          ])}
          chosenRoleId={selected}
          onClose={() => setComparing(false)}
          onChoose={(roleId) => {
            setComparing(false);
            void choose(roleId);
          }}
        />
      )}
    </main>
  );
}
