import { Check } from "@/components/icons";

// Five ways to build Targeted Practice Questions. Dead preview page.
//
// The brief: interview practice questions, targeted - not a list of two hundred
// common questions, which is a search result rather than a product.
//
// What makes them targeted here: the role chosen in Discovery decides what is
// asked, the scored interview decides what is asked *again*, and the Story Bank
// decides whether the person has anything to answer with. A question nobody can
// trace back to one of those three is filler.
//
// The failure mode: reading. Reading questions feels like preparing and is not.
// Every option has to end in the person having answered something.

export const metadata = { title: "Preview — Practice Questions" };

type Q = {
  q: string;
  round: "HR" | "Managerial";
  tests: string;
  why: string;
  state: "weak" | "ok" | "unattempted";
};

const QUESTIONS: Q[] = [
  {
    q: "A customer asks for a refund outside policy. What do you do?",
    round: "HR",
    tests: "Handling conflict",
    why: "You scored 2 of 5 on this in your last interview.",
    state: "weak",
  },
  {
    q: "Tell me about a time you had to learn something quickly.",
    round: "HR",
    tests: "Learning quickly",
    why: "Your Story Bank has nothing for this.",
    state: "unattempted",
  },
  {
    q: "How would you handle sixty queries and a system outage on the same day?",
    round: "Managerial",
    tests: "Working under pressure",
    why: "Asked in this role's interviews. You have a story for it.",
    state: "ok",
  },
  {
    q: "Why customer success and not sales?",
    round: "HR",
    tests: "Motivation",
    why: "You chose this role in Discovery and have never said why out loud.",
    state: "unattempted",
  },
];

const TONE: Record<Q["state"], { chip: string; word: string }> = {
  weak: {
    chip: "bg-rose-50 text-rose-800 ring-rose-500/25",
    word: "Went badly",
  },
  ok: { chip: "bg-teal-50 text-teal-800 ring-teal-600/25", word: "Solid" },
  unattempted: {
    chip: "bg-slate-100 text-slate-600 ring-slate-400/25",
    word: "Never answered",
  },
};

function Chip({ s }: { s: Q["state"] }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ring-1 ring-inset ${TONE[s].chip}`}
    >
      {TONE[s].word}
    </span>
  );
}

function Option({
  n,
  title,
  idea,
  cost,
  children,
}: {
  n: number;
  title: string;
  idea: string;
  cost: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-slate-200 pt-7">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-violet-deep">
        Option {n}
      </p>
      <h2 className="mt-0.5 font-display text-[1.35rem] font-bold leading-tight text-brand-ink">
        {title}
      </h2>
      <p className="mt-1.5 max-w-3xl text-[0.9rem] leading-relaxed text-slate-600">
        {idea}
      </p>
      <p className="mt-1 max-w-3xl text-[0.82rem] leading-relaxed text-slate-500">
        <strong className="font-semibold text-slate-600">The cost:</strong>{" "}
        {cost}
      </p>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-brand-mist p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function AiNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex gap-2 rounded-xl border border-brand-violet/30 bg-brand-violet/[0.06] px-3 py-2.5 text-[0.8rem] leading-relaxed text-slate-700">
      <span
        aria-hidden
        className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-violet text-[0.55rem] font-bold text-white"
      >
        A
      </span>
      <span>{children}</span>
    </p>
  );
}

export default function PreviewPracticeQuestions() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
        Preview — not built
      </p>
      <h1 className="mt-1 font-display text-[2.1rem] font-bold leading-tight tracking-tight text-brand-ink">
        Practise the questions you will actually be asked
      </h1>
      <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-slate-600">
        Not two hundred common questions — the ones your role asks, the ones you
        answered badly last time, and the ones you have no story for. Five ways
        to build it, differing in how hard they push somebody to answer rather
        than read.
      </p>
      <p className="mt-3 max-w-3xl rounded-xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.85rem] leading-relaxed text-slate-600">
        <strong className="font-semibold text-brand-ink">
          What makes a question targeted:
        </strong>{" "}
        it comes from the role chosen in Discovery, from an answer that scored
        badly in a real interview run, or from a competency the Story Bank has
        nothing for. A question that cannot be traced to one of those three is
        filler, and filler is what every other site already has.
      </p>

      {/* ------------------------------------------------------------ 1 */}
      <Option
        n={1}
        title="A worklist, worst first"
        idea="Every question carries the reason it is on your list. Sorted so the ones you answered badly sit above the ones you have never tried, and both sit above the ones you are fine at."
        cost="A list is still a list. It is easy to scroll, nod, and leave having answered nothing."
      >
        <ul className="grid gap-2">
          {QUESTIONS.map((q) => (
            <li
              key={q.q}
              className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 bg-surface px-3.5 py-3"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <Chip s={q.state} />
                  <span className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                    {q.round} · {q.tests}
                  </span>
                </span>
                <span className="mt-1 block text-[0.88rem] font-semibold leading-snug text-brand-ink">
                  {q.q}
                </span>
                <span className="mt-0.5 block text-[0.78rem] leading-snug text-slate-500">
                  {q.why}
                </span>
              </span>
              <span className="inline-flex min-h-9 shrink-0 items-center rounded-lg bg-brand-teal-deep px-3.5 text-[0.76rem] font-bold text-white">
                Answer it
              </span>
            </li>
          ))}
        </ul>
      </Option>

      {/* ------------------------------------------------------------ 2 */}
      <Option
        n={2}
        title="One at a time, out loud"
        idea="No list at all. One question on screen, the microphone open, and nothing else to do. Answer, hear it back, get one note, next question."
        cost="No sense of how much is left or what is being covered. Somebody who wants to prepare for tomorrow's HR round cannot steer it."
      >
        <div className="rounded-xl border border-slate-200 bg-surface p-5 text-center">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Question 2 of 6 · HR round
          </p>
          <p className="mx-auto mt-2 max-w-xl font-display text-[1.3rem] font-bold leading-snug text-brand-ink">
            A customer asks for a refund outside policy. What do you do?
          </p>
          <div className="mx-auto mt-4 flex max-w-md items-center gap-3 rounded-xl bg-brand-mist px-4 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-teal-deep text-white">
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
              </svg>
            </span>
            <span aria-hidden className="flex flex-1 items-end gap-[3px]">
              {[8, 15, 22, 12, 26, 17, 10, 20, 13, 24, 9, 17, 11, 21, 14].map(
                (h, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-brand-teal"
                    style={{
                      height: `${h}px`,
                      opacity: 0.35 + (h / 26) * 0.65,
                    }}
                  />
                ),
              )}
            </span>
            <span className="shrink-0 text-[0.76rem] font-bold text-brand-teal-deep">
              0:28
            </span>
          </div>
          <p className="mt-2.5 text-[0.78rem] text-slate-500">
            No mic? Type it instead. There is no clock on the answer.
          </p>
        </div>
        <AiNote>
          One note back, not a report: the single thing that would have made
          that answer land better. A paragraph of feedback after every question
          is how people stop reading feedback.
        </AiNote>
      </Option>

      {/* ------------------------------------------------------------ 3 */}
      <Option
        n={3}
        title="Question beside your story"
        idea="Each question shows the story from your bank that answers it, so practice is joining two things you already have rather than inventing on the spot. Where no story exists, it says so and links to building one."
        cost="Leans on the Story Bank existing and being full. Ship this before that and most rows are empty."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-surface p-3.5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              They will ask
            </p>
            <p className="mt-1 text-[0.95rem] font-bold leading-snug text-brand-ink">
              {QUESTIONS[0].q}
            </p>
            <p className="mt-1.5 text-[0.78rem] text-slate-500">
              Tests: {QUESTIONS[0].tests} · {QUESTIONS[0].why}
            </p>
          </div>
          <div className="rounded-xl border border-brand-teal/40 bg-teal-50/40 p-3.5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-teal-800">
              You already have this
            </p>
            <p className="mt-1 text-[0.9rem] font-bold leading-snug text-brand-ink">
              The refund I could not give
            </p>
            <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-600">
              You said the earlier answer had been wrong, apologised for that
              specifically, and offered the one thing you could authorise.
            </p>
            <p className="mt-1.5 text-[0.7rem] font-semibold text-brand-violet-deep">
              From: Escalation call simulation · scored 4 of 5
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex min-h-10 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
            Say it against this question
          </span>
          <span className="text-[0.8rem] text-slate-500">
            Two minutes. You are joining two things you already have.
          </span>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 4 */}
      <Option
        n={4}
        title="Tomorrow's round"
        idea="Starts from a date and a company. Pick the round you have coming, and it builds a set for that - the questions that round asks, weighted to your weak ones, in the order they usually come."
        cost="Only works for somebody with an interview booked. Everybody else sees a form asking for a date they do not have."
      >
        <div className="rounded-xl border border-slate-200 bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-lg bg-brand-mist px-3 py-1.5 text-[0.8rem] font-semibold text-brand-ink">
              HR round
            </span>
            <span className="text-[0.8rem] text-slate-400">·</span>
            <span className="rounded-lg bg-brand-mist px-3 py-1.5 text-[0.8rem] font-semibold text-brand-ink">
              Thursday
            </span>
            <span className="text-[0.8rem] text-slate-400">·</span>
            <span className="rounded-lg bg-brand-mist px-3 py-1.5 text-[0.8rem] font-semibold text-brand-ink">
              Customer Success Associate
            </span>
          </div>
          <ol className="mt-3 grid gap-2">
            {[
              ["Warm-up", "Tell me about yourself.", "You have this."],
              [
                "The one they decide on",
                "A customer asks for a refund outside policy…",
                "You scored 2 of 5 here last time.",
              ],
              [
                "The follow-up",
                "And if your manager disagreed with you?",
                "Never asked of you before.",
              ],
              [
                "Their turn",
                "What do you want to ask us?",
                "Nothing prepared. This one loses offers.",
              ],
            ].map(([slot, q, note], i) => (
              <li key={q} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-violet/15 text-[0.7rem] font-bold text-brand-violet-deep"
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                    {slot}
                  </span>
                  <span className="block text-[0.85rem] font-semibold leading-snug text-brand-ink">
                    {q}
                  </span>
                  <span className="block text-[0.76rem] text-slate-500">
                    {note}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <span className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
            Run this set — 12 minutes
          </span>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 5 */}
      <Option
        n={5}
        title="It gets harder if you are good"
        idea="Answer well and the follow-up sharpens - the interviewer pushes on the weakest part of what you just said. Answer badly and it stays on the same ground until you can hold it."
        cost="The hardest to get right, and the easiest to make demoralising. A follow-up that is too sharp reads as a machine catching you out."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <ol className="grid gap-2.5 p-3.5">
            {[
              {
                who: "a",
                text: "A customer asks for a refund outside policy. What do you do?",
              },
              {
                who: "you",
                text: "I'd explain the policy and see if there's anything else I could offer.",
              },
              {
                who: "a",
                text: "She says the person before you told her fourteen days. Now what?",
              },
              {
                who: "you",
                text: "I'd say we got that wrong, and I'd apologise for that specifically rather than in general.",
              },
              {
                who: "a",
                text: "Good — that is the answer. Harder version: your manager has told you not to admit fault on calls. Same customer.",
              },
            ].map((line, i) => (
              <li
                key={i}
                className={
                  line.who === "you" ? "flex justify-end" : "flex gap-2"
                }
              >
                {line.who === "a" && (
                  <span
                    aria-hidden
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-violet text-[0.6rem] font-bold text-white"
                  >
                    A
                  </span>
                )}
                <p
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[0.82rem] leading-relaxed ${
                    line.who === "you"
                      ? "rounded-tr-sm bg-teal-50 text-slate-700"
                      : "rounded-tl-sm border border-slate-200 text-slate-800"
                  }`}
                >
                  {line.text}
                </p>
              </li>
            ))}
          </ol>
          <div className="border-t border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[0.74rem] text-slate-500">
            Level 3 of 3 on this question · it stops when you can hold the hard
            version
          </div>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 6 */}
      <Option
        n={6}
        title="The question library — closest to the mockup you sent"
        idea="Browse rather than be given: a search box, filter chips by kind and difficulty, a grid of question cards, and a rail of what you looked at recently. Somebody who wants to poke around before committing can."
        cost="A library is a browsing surface, and browsing is not practice - the mockup has no state on a card saying whether you have ever answered it. Two of its panels also promise things Ascend cannot honestly fill: see the notes under the mock."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="font-display text-[1.25rem] font-bold leading-tight text-brand-ink">
              Question library
            </h3>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2">
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-4 w-4 shrink-0 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span className="text-[0.82rem] text-slate-400">
                Search questions…
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {[
                ["HR round", true],
                ["Managerial round", false],
                ["Situational", false],
                ["Harder ones", false],
              ].map(([label, on]) => (
                <span
                  key={label as string}
                  className={`rounded-full px-3 py-1 text-[0.74rem] font-semibold ${
                    on
                      ? "bg-brand-teal-deep text-white"
                      : "bg-surface text-slate-600 ring-1 ring-inset ring-slate-300"
                  }`}
                >
                  {label}
                </span>
              ))}
              <span className="px-1 text-[0.74rem] font-semibold text-brand-teal-deep">
                Clear all
              </span>
            </div>
          </div>

          <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {[
                ...QUESTIONS,
                {
                  q: "Your manager gives you feedback you disagree with. What do you do?",
                  round: "Managerial" as const,
                  tests: "Taking feedback",
                  why: "Common in this role's second round.",
                  state: "unattempted" as const,
                },
                {
                  q: "Walk me through a day at your last job.",
                  round: "HR" as const,
                  tests: "Communication",
                  why: "You answered this well in your first run.",
                  state: "ok" as const,
                },
              ].map((q) => (
                <div
                  key={q.q}
                  className="flex flex-col rounded-xl border border-slate-200 p-3"
                >
                  <p className="text-[0.85rem] font-bold leading-snug text-brand-ink">
                    {q.q}
                  </p>
                  <p className="mt-1 text-[0.74rem] leading-snug text-slate-500">
                    {q.why}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600">
                      {q.round}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600">
                      {q.tests}
                    </span>
                    <Chip s={q.state} />
                  </div>
                </div>
              ))}
            </div>

            <aside className="grid gap-2.5 content-start">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[0.72rem] font-bold text-brand-ink">
                  Where you left off
                </p>
                <ul className="mt-1.5 grid gap-1.5">
                  {[
                    "A customer asks for a refund outside policy…",
                    "Tell me about a time you had to learn…",
                  ].map((q) => (
                    <li
                      key={q}
                      className="line-clamp-2 text-[0.74rem] leading-snug text-slate-500"
                    >
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[0.72rem] font-bold text-brand-ink">
                  Asked most in Customer Operations
                </p>
                <ul className="mt-1.5 grid gap-1.5">
                  {[
                    "Why customer success and not sales?",
                    "How do you handle someone shouting at you?",
                  ].map((q) => (
                    <li
                      key={q}
                      className="line-clamp-2 text-[0.74rem] leading-snug text-slate-500"
                    >
                      {q}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[0.66rem] leading-snug text-slate-400">
                  From the role catalogue, not from other users.
                </p>
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.83rem] leading-relaxed text-amber-900">
          <strong className="font-semibold">
            Three things I changed from the mockup, and why:
          </strong>
          <ul className="mt-1.5 grid gap-1">
            <li>
              <strong className="font-semibold">Top Trending</strong> became
              &ldquo;asked most in Customer Operations&rdquo;. Trending implies
              a population of users we do not have, and inventing one is
              fabricated social proof.
            </li>
            <li>
              <strong className="font-semibold">Technical / Case Study</strong>{" "}
              became HR, Managerial and Situational. Ascend is for non-technical
              early-career roles; a Technical filter that returns nothing
              teaches people the filters are decoration.
            </li>
            <li>
              <strong className="font-semibold">
                Every card carries state
              </strong>{" "}
              — never answered, went badly, solid. Without it the library cannot
              tell you where to start, which is the only thing that makes it
              better than a search engine.
            </li>
          </ul>
        </div>
      </Option>

      {/* ---------------------------------------------------------- rec */}
      <section className="mt-10 rounded-2xl border border-brand-teal/40 bg-brand-teal-deep/[0.05] p-5">
        <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-teal-800">
          If you want a recommendation
        </h2>
        <p className="mt-1.5 text-[0.9rem] leading-relaxed text-slate-700">
          <strong className="font-semibold text-brand-ink">
            Option 1 as the way in, Option 2 as what happens when you press a
            row.
          </strong>{" "}
          The worklist is the only option that shows why each question is on the
          list, which is the whole claim of &ldquo;targeted&rdquo;. Pressing a
          row should drop straight into one question with the microphone open —
          because reading questions feels like preparing and is not.
        </p>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-700">
          Option 5 is the one worth building later and getting right. It is the
          closest to a real interview and the easiest to make cruel; it needs
          the follow-up to feel like coaching, not like being caught out.
        </p>
      </section>

      <p className="mt-8 flex items-center gap-2 text-[0.8rem] text-slate-400">
        <Check size={13} />
        None of this is wired up. Pick one and it gets built properly.
      </p>
    </main>
  );
}
