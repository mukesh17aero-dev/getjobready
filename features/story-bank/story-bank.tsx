"use client";

import { useCallback, useState } from "react";
import {
  draftStory,
  expandStory,
  patchStory,
  saveStory,
  storyStrength,
  type PracticeQuestion,
  type StarPart,
  type Story,
  type StoryBank as Bank,
  type StoryDraft,
  type StoryStrength,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Check } from "@/components/ui/icons";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";

// The Story Bank: a grid of what this person can say, and a second view of
// what they will be asked.
//
// Two things this screen must never do, both of which are easy and both of
// which cost somebody an interview:
//
//   Treat a draft as a story. A drafted STAR reads well and has never been
//   said. It is marked, it sits apart, and the only way out of that state is
//   the person telling it - which is a button they press, not something we
//   infer from them having read it.
//
//   Treat a claim as proof. What the interview simulation recorded and what
//   somebody wrote on their resume are both useful and they are not the same.
//   The chip says which, everywhere, with no exceptions for tidiness.
//
// The Questions tab is the bridge: every question shows whether they have
// anything for it, and the ones they do not carry a Build button that opens
// the drafter - which is allowed to come back and say there is nothing here
// to build from.

const TONE: Record<StoryStrength, { chip: string; word: string }> = {
  proven: {
    chip: "bg-teal-50 text-teal-800 ring-teal-600/25",
    word: "Proven",
  },
  usable: {
    chip: "bg-amber-50 text-amber-900 ring-amber-600/25",
    word: "Yours, unproven",
  },
  draft: {
    chip: "bg-slate-100 text-slate-600 ring-slate-400/25",
    word: "Not said yet",
  },
};

const PARTS: Array<[StarPart, string]> = [
  ["situation", "Situation"],
  ["task", "Task"],
  ["action", "Action"],
  ["result", "Result"],
];

function Chip({ s }: { s: StoryStrength }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ring-1 ring-inset ${TONE[s].chip}`}
    >
      {TONE[s].word}
    </span>
  );
}

async function token(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export function StoryBank({
  initial,
  /**
   * Nobody is signed in. The page still opens: the questions are the same for
   * everyone and the stories shown are a labelled example, so somebody can see
   * exactly what this produces before deciding it is worth an account. The
   * account is asked for at the two points that cost something - drafting,
   * which spends an AI's time, and keeping, which needs somewhere to keep it.
   */
  signedOut = false,
}: {
  initial: Bank;
  signedOut?: boolean;
}) {
  const [bank, setBank] = useState<Bank>(initial);
  const [gate, setGate] = useState<GatedAction | null>(null);
  const [tab, setTab] = useState<"stories" | "questions">("stories");
  const [openId, setOpenId] = useState<string | null>(
    initial.stories[0]?.id ?? null,
  );
  const [building, setBuilding] = useState<PracticeQuestion | null>(null);
  const [draft, setDraft] = useState<StoryDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A saved story with a blank part, and what its record can fill in for it.
  const [expanding, setExpanding] = useState<Story | null>(null);
  const [expansion, setExpansion] = useState<Awaited<
    ReturnType<typeof expandStory>
  > | null>(null);
  const [expandBusy, setExpandBusy] = useState(false);

  const build = useCallback(async (q: PracticeQuestion) => {
    if (signedOut) {
      setGate({
        what: "a story written from your own record",
        why: "Drafting reads everything you have done here and writes from it - so there has to be a record, and it has to belong to somebody. The example below is what it produces.",
      });
      return;
    }
    setBuilding(q);
    setDraft(null);
    setError(null);
    setBusy(true);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Your session expired. Reload the page and sign in again.");
      return;
    }
    const result = await draftStory(t, q.id);
    setBusy(false);
    if (!result) {
      setError("Could not reach the drafter — try again in a moment.");
      return;
    }
    setDraft(result);
  }, [signedOut]);

  // Saving happens at the moment they say they have told it, and only then.
  const keep = useCallback(async () => {
    if (!draft || !draft.ok || !building) return;
    setBusy(true);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Your session expired. Reload the page and sign in again.");
      return;
    }
    const saved = await saveStory(t, {
      title: draft.draft.title,
      competency: building.competency,
      star: draft.draft.star,
      evidence: draft.draft.evidence,
      answers: [building.id],
      spoken: true,
    });
    setBusy(false);
    if (!saved) {
      setError("Could not save that — try again.");
      return;
    }
    setBank((b) => ({
      ...b,
      stories: [saved, ...b.stories],
      questions: b.questions.map((q) =>
        q.id === building.id ? { ...q, storyIds: [...q.storyIds, saved.id] } : q,
      ),
    }));
    setBuilding(null);
    setDraft(null);
    setOpenId(saved.id);
    setTab("stories");
  }, [draft, building]);

  const markSpoken = useCallback(async (story: Story) => {
    if (signedOut) {
      setGate({
        what: "your story bank",
        why: "A story is only worth having if it is still there next week. Keeping one needs an account for it to live in.",
      });
      return;
    }
    setBusy(true);
    const t = await token();
    if (!t) {
      setBusy(false);
      return;
    }
    const updated = await patchStory(t, story.id, { spoken: true });
    setBusy(false);
    if (!updated) return;
    setBank((b) => ({
      ...b,
      stories: b.stories.map((s) => (s.id === updated.id ? updated : s)),
    }));
  }, [signedOut]);

  // Filling in the blank parts of a story already saved. Never touches a
  // part the person has already written - only the still-blank ones.
  const expand = useCallback(async (story: Story) => {
    if (signedOut) {
      setGate({
        what: "the rest of this story, filled in from your record",
        why: "Filling in a blank part reads your record the same way drafting one does, so it needs an account to read from.",
      });
      return;
    }
    setExpanding(story);
    setExpansion(null);
    setError(null);
    setExpandBusy(true);
    const t = await token();
    if (!t) {
      setExpandBusy(false);
      setError("Your session expired. Reload the page and sign in again.");
      return;
    }
    const result = await expandStory(t, story.id);
    setExpandBusy(false);
    setExpansion(result);
  }, [signedOut]);

  // Saving happens only when they press Keep — a proposed fill is never
  // written to the story on its own.
  const keepExpansion = useCallback(async () => {
    if (!expanding || !expansion || !expansion.ok) return;
    setExpandBusy(true);
    const t = await token();
    if (!t) {
      setExpandBusy(false);
      setError("Your session expired. Reload the page and sign in again.");
      return;
    }
    const updated = await patchStory(t, expanding.id, {
      star: { ...expanding.star, ...expansion.expansion.patch },
    });
    setExpandBusy(false);
    if (!updated) {
      setError("Could not save that — try again.");
      return;
    }
    setBank((b) => ({
      ...b,
      stories: b.stories.map((s) => (s.id === updated.id ? updated : s)),
    }));
    setExpanding(null);
    setExpansion(null);
  }, [expanding, expansion]);

  const closeExpand = useCallback(() => {
    setExpanding(null);
    setExpansion(null);
  }, []);

  const covered = bank.coverage.filter((c) => c.best !== null).length;

  return (
    <>
      {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
      <header>
        <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-tight text-brand-ink">
          Your story bank
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
          Answers built from what you have already done, in the shape an
          interviewer expects. {covered} of {bank.coverage.length} competencies
          covered.
        </p>
        {signedOut && (
          <p className="mt-3 max-w-2xl rounded-xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.85rem] leading-relaxed text-slate-600">
            <strong className="font-semibold text-brand-ink">
              These three stories are an example, not yours.
            </strong>{" "}
            The questions below are real and the same for everyone. Yours would
            be written from your own simulations and practice answers — which
            is the point at which this needs an account.
          </p>
        )}
      </header>

      {/* The bridge: one page, two views of the same competencies. */}
      <div
        role="tablist"
        aria-label="Stories or questions"
        className="mt-4 flex gap-1 border-b border-slate-200"
      >
        {(
          [
            ["stories", `My stories (${bank.stories.length})`],
            ["questions", `What they will ask (${bank.questions.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px cursor-pointer rounded-t-lg border-b-2 px-3.5 py-2.5 text-[0.85rem] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
              tab === id
                ? "border-brand-teal-deep text-brand-ink"
                : "border-transparent text-slate-500 hover:text-brand-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[0.85rem] text-rose-800">
          {error}
        </p>
      )}

      {/* ---------------------------------------------------- my stories */}
      {tab === "stories" &&
        (bank.stories.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6">
            <p className="text-[0.95rem] font-bold text-brand-ink">
              Nothing here yet, and that is the normal starting point.
            </p>
            <p className="mt-1.5 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
              Stories are built from things you have actually done — a
              simulation, an interview you have practised, a job you have held.
              The quickest way in is to look at what you will be asked and
              build one for a question you cannot answer yet.
            </p>
            <button
              type="button"
              onClick={() => setTab("questions")}
              className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal"
            >
              See what they will ask
            </button>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {bank.stories.map((story) => {
              const open = story.id === openId;
              const s = storyStrength(story);
              const hasBlank = PARTS.some(
                ([key]) => !(story.star[key] ?? "").trim(),
              );
              return (
                <li
                  key={story.id}
                  className={`rounded-2xl border bg-surface p-4 ${
                    open ? "border-brand-violet/50 sm:col-span-2" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-brand-violet-deep">
                        {story.competency}
                      </p>
                      <h2 className="mt-0.5 font-display text-[1rem] font-bold leading-snug text-brand-ink">
                        {story.title}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : story.id)}
                      className="shrink-0 cursor-pointer text-[0.75rem] font-semibold text-slate-500 hover:text-brand-ink"
                    >
                      {open ? "Collapse" : "Expand"}
                    </button>
                  </div>

                  {open ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {PARTS.map(([key, label]) => {
                        const text = story.star[key];
                        return (
                          <div
                            key={key}
                            className="rounded-lg bg-brand-mist p-2.5"
                          >
                            <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                              {label}
                            </p>
                            {text ? (
                              <p className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-700">
                                {text}
                              </p>
                            ) : (
                              // Named, not filled. The drafter left this blank
                              // on purpose and pretending otherwise is the
                              // whole failure this feature avoids.
                              <p className="mt-0.5 text-[0.8rem] italic leading-relaxed text-amber-800">
                                Left blank — nothing in your record said what
                                this was. Add it in your own words.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-snug text-slate-500">
                      {story.star.action ?? story.star.situation ?? ""}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Chip s={s} />
                    <span className="text-[0.72rem] text-slate-500">
                      {story.evidence.label}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {hasBlank && (
                        <button
                          type="button"
                          disabled={expandBusy}
                          onClick={() => void expand(story)}
                          className="inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-brand-violet/45 px-3.5 text-[0.76rem] font-bold text-brand-violet-deep transition-colors hover:bg-brand-violet/10 disabled:opacity-50"
                        >
                          Fill in from your record
                        </button>
                      )}
                      {s === "draft" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void markSpoken(story)}
                          className="inline-flex min-h-9 cursor-pointer items-center rounded-lg bg-brand-teal-deep px-3.5 text-[0.76rem] font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50"
                        >
                          I have said this out loud
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ))}

      {/* ----------------------------------------------- what they ask */}
      {tab === "questions" && (
        <ul className="mt-5 grid gap-2">
          {bank.questions.map((q) => {
            const mine = q.storyIds
              .map((id) => bank.stories.find((s) => s.id === id))
              .filter((s): s is Story => Boolean(s));
            const best = mine.length > 0 ? storyStrength(mine[0]!) : null;
            return (
              <li
                key={q.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-surface px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                    {q.round === "hr" ? "HR round" : "Managerial round"} ·{" "}
                    {q.competency}
                  </p>
                  <p className="mt-0.5 text-[0.9rem] font-semibold leading-snug text-brand-ink">
                    {q.q}
                  </p>
                  <p className="mt-0.5 text-[0.78rem] leading-snug text-slate-500">
                    {mine.length > 0
                      ? `You would tell: ${mine[0]!.title}`
                      : q.testing}
                  </p>
                </div>
                {best ? (
                  <Chip s={best} />
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-inset ring-slate-400/25">
                    Nothing yet
                  </span>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void build(q)}
                  className={`inline-flex min-h-9 shrink-0 cursor-pointer items-center rounded-lg px-3.5 text-[0.76rem] font-bold transition-colors disabled:opacity-50 ${
                    mine.length > 0
                      ? "border border-slate-300 text-brand-ink hover:border-brand-violet/60"
                      : "bg-brand-teal-deep text-white hover:bg-brand-teal"
                  }`}
                >
                  {mine.length > 0 ? "Build another" : "Build a story"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* --------------------------------------------------- the drafter */}
      {building && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Building a story"
          className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 p-0 sm:place-items-center sm:p-4"
        >
          <div className="max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-xl sm:rounded-2xl">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              Building a story for
            </p>
            <p className="mt-0.5 font-display text-[1.1rem] font-bold leading-snug text-brand-ink">
              {building.q}
            </p>

            {busy && !draft && (
              <p className="mt-4 text-[0.88rem] text-slate-500">
                Reading your record…
              </p>
            )}

            {draft && !draft.ok && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[0.88rem] leading-relaxed text-amber-900">
                  {draft.reason}
                </p>
                <p className="mt-2 text-[0.85rem] leading-relaxed text-amber-900">
                  <strong className="font-semibold">
                    What would answer it:
                  </strong>{" "}
                  {draft.suggest}
                </p>
              </div>
            )}

            {draft && draft.ok && (
              <>
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <p className="font-display text-[1rem] font-bold text-brand-ink">
                    {draft.draft.title}
                  </p>
                  <dl className="mt-2.5 grid gap-2">
                    {PARTS.map(([key, label]) => (
                      <div
                        key={key}
                        className="border-l-2 border-brand-violet/35 pl-3"
                      >
                        <dt className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                          {label}
                        </dt>
                        <dd
                          className={`mt-0.5 text-[0.85rem] leading-relaxed ${
                            draft.draft.star[key]
                              ? "text-slate-700"
                              : "italic text-amber-800"
                          }`}
                        >
                          {draft.draft.star[key] ||
                            "Left blank on purpose — your record does not say, and I am not going to make it up."}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2.5 text-[0.75rem] text-slate-500">
                    Drawn from: {draft.draft.evidence.label}
                  </p>
                </div>

                <p className="mt-3 rounded-xl bg-brand-mist px-4 py-3 text-[0.85rem] leading-relaxed text-slate-600">
                  Read it, then say it out loud once in your own words. A story
                  you have only read is a script, and it will not survive the
                  follow-up question.
                </p>
              </>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {draft && draft.ok && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void keep()}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50"
                >
                  <Check size={14} />I have said it — keep it
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setBuilding(null);
                  setDraft(null);
                }}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-300 px-4 text-[0.85rem] font-bold text-brand-ink"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------- the expander */}
      {expanding && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filling in a story"
          className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 p-0 sm:place-items-center sm:p-4"
        >
          <div className="max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-xl sm:rounded-2xl">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              Filling in
            </p>
            <p className="mt-0.5 font-display text-[1.1rem] font-bold leading-snug text-brand-ink">
              {expanding.title}
            </p>

            {expandBusy && !expansion && (
              <p className="mt-4 text-[0.88rem] text-slate-500">
                Reading your record…
              </p>
            )}

            {expansion && !expansion.ok && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[0.88rem] leading-relaxed text-amber-900">
                  {expansion.reason}
                </p>
              </div>
            )}

            {expansion && expansion.ok && (
              <>
                <dl className="mt-4 grid gap-2 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                  {PARTS.map(([key, label]) => {
                    const written = expanding.star[key];
                    const filled = expansion.expansion.patch[key];
                    return (
                      <div
                        key={key}
                        className={
                          written || !filled
                            ? "pl-3"
                            : "border-l-2 border-brand-violet/35 pl-3"
                        }
                      >
                        <dt className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                          {label}
                        </dt>
                        <dd
                          className={`mt-0.5 text-[0.85rem] leading-relaxed ${
                            written || filled
                              ? "text-slate-700"
                              : "italic text-amber-800"
                          }`}
                        >
                          {written ||
                            filled ||
                            "Left blank on purpose — your record does not say, and I am not going to make it up."}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                <p className="mt-2.5 text-[0.75rem] text-slate-500">
                  Drawn from: {expansion.expansion.evidence.label}
                </p>
              </>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {expansion && expansion.ok && (
                <button
                  type="button"
                  disabled={expandBusy}
                  onClick={() => void keepExpansion()}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50"
                >
                  <Check size={14} />Keep this
                </button>
              )}
              <button
                type="button"
                onClick={closeExpand}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-300 px-4 text-[0.85rem] font-bold text-brand-ink"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
