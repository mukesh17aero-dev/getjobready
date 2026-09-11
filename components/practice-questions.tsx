"use client";

import { useCallback, useMemo, useState } from "react";
import {
  answerPracticeQuestion,
  type LibraryQuestion,
  type QuestionLibrary,
  type QuestionState,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/signup-gate";
import { Check } from "@/components/icons";

// The question library, and answering one.
//
// Browsing is the way in and answering is the point. A library somebody can
// scroll, nod at and leave is the failure mode here - reading questions feels
// like preparing and is not - so every card carries where this person stands
// on it, and pressing one drops straight into answering rather than into a
// detail page.
//
// One note comes back per answer, never a report. A paragraph of feedback
// after every question is how people stop reading feedback, and "that would
// hold up" is a real and useful thing for the coach to say.
//
// Signed out the whole library reads. The questions are the same for
// everybody and there is nothing personal in them. The account is asked for
// at the one point that costs something: sending an answer to be coached.

const TONE: Record<QuestionState, { chip: string; word: string }> = {
  weak: {
    chip: "bg-rose-50 text-rose-800 ring-rose-500/25",
    word: "Went badly",
  },
  solid: { chip: "bg-teal-50 text-teal-800 ring-teal-600/25", word: "Solid" },
  unattempted: {
    chip: "bg-slate-100 text-slate-600 ring-slate-400/25",
    word: "Never answered",
  },
};

/** Worst first: what went badly, then what was never tried, then the rest. */
const ORDER: Record<QuestionState, number> = {
  weak: 0,
  unattempted: 1,
  solid: 2,
};

const MIN_ANSWER = 80;

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

function Chip({ s }: { s: QuestionState }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ring-1 ring-inset ${TONE[s].chip}`}
    >
      {TONE[s].word}
    </span>
  );
}

export function PracticeQuestions({
  initial,
  signedOut = false,
}: {
  initial: QuestionLibrary;
  signedOut?: boolean;
}) {
  const [library, setLibrary] = useState(initial);
  const [round, setRound] = useState<"all" | "hr" | "managerial">("all");
  const [competency, setCompetency] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<LibraryQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    note: string | null;
    heldUp: boolean | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<GatedAction | null>(null);

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return library.questions
      .filter((q) => (round === "all" ? true : q.round === round))
      .filter((q) => (competency ? q.competency === competency : true))
      .filter((q) =>
        needle
          ? q.q.toLowerCase().includes(needle) ||
            q.competency.toLowerCase().includes(needle)
          : true,
      )
      .sort((a, b) => ORDER[a.state] - ORDER[b.state]);
  }, [library.questions, round, competency, search]);

  const start = useCallback((q: LibraryQuestion) => {
    setOpen(q);
    setAnswer("");
    setResult(null);
    setError(null);
  }, []);

  const send = useCallback(async () => {
    if (!open) return;
    if (signedOut) {
      setGate({
        what: "a read on your answer",
        why: "Someone has to listen to what you said and tell you the one thing that would make it land better - which needs an account, and means the answer is still here next time.",
      });
      return;
    }
    if (answer.trim().length < MIN_ANSWER) return;
    setBusy(true);
    setError(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Your session expired. Reload the page and sign in again.");
      return;
    }
    const attempt = await answerPracticeQuestion(t, open.id, answer.trim());
    setBusy(false);
    if (!attempt) {
      setError("Could not send that — try again in a moment.");
      return;
    }
    setResult({ note: attempt.note, heldUp: attempt.heldUp });
    // The card updates behind the sheet, so closing it shows the new state.
    setLibrary((lib) => ({
      ...lib,
      questions: lib.questions.map((q) =>
        q.id === open.id
          ? {
              ...q,
              state: attempt.heldUp === true ? "solid" : "weak",
              attempts: q.attempts + 1,
              note: attempt.note,
            }
          : q,
      ),
    }));
  }, [open, answer, signedOut]);

  const left = MIN_ANSWER - answer.trim().length;
  const counts = {
    weak: library.questions.filter((q) => q.state === "weak").length,
    unattempted: library.questions.filter((q) => q.state === "unattempted")
      .length,
  };

  return (
    <>
      {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}

      <header>
        <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-tight text-brand-ink">
          Question library
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
          {signedOut
            ? "What interviews for early-career roles actually ask, and what each question is really testing. Answering one and getting a read on it needs an account."
            : counts.weak > 0
              ? `${counts.weak} you answered badly and ${counts.unattempted} you have never tried. Those are at the top.`
              : `${counts.unattempted} you have never answered. Those are at the top.`}
        </p>
      </header>

      {/* ---- search and filters ---- */}
      <div className="mt-4">
        <label htmlFor="q-search" className="sr-only">
          Search questions
        </label>
        <input
          id="q-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions…"
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-surface px-4 text-[0.88rem] outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
        />
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", "Everything"],
              ["hr", "HR round"],
              ["managerial", "Managerial round"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRound(id)}
              className={`min-h-9 cursor-pointer rounded-full px-3.5 text-[0.78rem] font-semibold transition-colors ${
                round === id
                  ? "bg-brand-teal-deep text-white"
                  : "bg-surface text-slate-600 ring-1 ring-inset ring-slate-300 hover:ring-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
          {library.competencies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCompetency(competency === c ? null : c)}
              className={`min-h-9 cursor-pointer rounded-full px-3.5 text-[0.78rem] font-semibold transition-colors ${
                competency === c
                  ? "bg-brand-violet text-white"
                  : "bg-surface text-slate-600 ring-1 ring-inset ring-slate-300 hover:ring-slate-400"
              }`}
            >
              {c}
            </button>
          ))}
          {(round !== "all" || competency || search) && (
            <button
              type="button"
              onClick={() => {
                setRound("all");
                setCompetency(null);
                setSearch("");
              }}
              className="min-h-9 cursor-pointer px-2 text-[0.78rem] font-semibold text-brand-teal-deep"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ---- the grid ---- */}
      {shown.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-brand-mist px-4 py-6 text-center text-[0.88rem] text-slate-600">
          Nothing matches that. Clear the filters to see all {library.total}.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((q) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => start(q)}
                className="flex h-full w-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-surface p-4 text-left transition-[border-color,box-shadow] hover:border-brand-teal/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              >
                <span className="text-[0.62rem] font-bold uppercase tracking-wide text-slate-400">
                  {q.round === "hr" ? "HR round" : "Managerial round"}
                </span>
                <span className="mt-0.5 text-[0.9rem] font-bold leading-snug text-brand-ink">
                  {q.q}
                </span>
                <span className="mt-1.5 text-[0.78rem] leading-snug text-slate-500">
                  {q.note ?? q.testing}
                </span>
                <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                  <Chip s={q.state} />
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600">
                    {q.competency}
                  </span>
                  {q.hasStory && (
                    <span className="rounded-full bg-brand-violet/10 px-2 py-0.5 text-[0.65rem] font-semibold text-brand-violet-deep">
                      You have a story
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ---- answering one ---- */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.q}
          className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 sm:place-items-center sm:p-4"
        >
          <div className="max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-xl sm:rounded-2xl">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              {open.round === "hr" ? "HR round" : "Managerial round"} ·{" "}
              {open.competency}
            </p>
            <p className="mt-1 font-display text-[1.25rem] font-bold leading-snug text-brand-ink">
              {open.q}
            </p>
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-600">
              <strong className="font-semibold text-brand-ink">
                What it is testing:
              </strong>{" "}
              {open.testing}
            </p>

            {result ? (
              <div className="mt-4">
                {result.heldUp && !result.note ? (
                  <div className="rounded-xl border border-brand-teal/40 bg-teal-50/60 p-4">
                    <p className="text-[0.92rem] font-bold text-brand-ink">
                      That would hold up.
                    </p>
                    <p className="mt-1 text-[0.85rem] leading-relaxed text-slate-700">
                      An interviewer would move on rather than press. Nothing to
                      change.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-brand-violet/30 bg-brand-violet/[0.06] p-4">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-brand-violet-deep">
                      One thing
                    </p>
                    <p className="mt-1 text-[0.9rem] leading-relaxed text-slate-700">
                      {result.note ??
                        "Nothing specific came back on that one — try it again and say more about what you actually did."}
                    </p>
                  </div>
                )}
                <p className="mt-2.5 text-[0.8rem] leading-relaxed text-slate-500">
                  Your answer is kept, so the next attempt has something to be
                  better than.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setAnswer("");
                    }}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal"
                  >
                    Answer it again
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-300 px-4 text-[0.85rem] font-bold text-brand-ink"
                  >
                    Next question
                  </button>
                </div>
              </div>
            ) : (
              <>
                <label htmlFor="answer" className="sr-only">
                  Your answer
                </label>
                <textarea
                  id="answer"
                  rows={7}
                  value={answer}
                  disabled={busy}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Say it the way you would say it out loud…"
                  className="mt-3 min-h-[9rem] w-full resize-y rounded-xl border border-slate-300 bg-surface px-3.5 py-2.5 text-[0.88rem] leading-relaxed outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25 disabled:opacity-60"
                />
                <p className="mt-1.5 text-[0.78rem] text-slate-500">
                  {left > 0
                    ? `${left} more characters — a few sentences is plenty.`
                    : "Long enough. One note comes back, not a report."}
                </p>

                {error && (
                  <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[0.82rem] text-rose-800">
                    {error}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busy || (!signedOut && left > 0)}
                    onClick={() => void send()}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-40"
                  >
                    {busy ? (
                      "Reading it…"
                    ) : (
                      <>
                        <Check size={14} />
                        See how it landed
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-300 px-4 text-[0.85rem] font-bold text-brand-ink"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
