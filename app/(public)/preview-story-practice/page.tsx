import { Check } from "@/components/icons";

// Five ways to join the Story Bank to the question library. Dead preview page.
//
// The brief: browse practice questions from inside the Story Bank, and turn a
// question into a STAR story. Both directions of the same road.
//
//   question ──▶ story   "I have nothing for this. Make me something."
//   story ──▶ question   "I have this. What does it answer?"
//
// The trap is the first direction. Generating a STAR story from a question and
// a pile of evidence is easy and produces something that reads well - and a
// story assembled for somebody, that they have never said out loud, falls over
// on the first follow-up. Every option here has to end with the person having
// spoken it, and has to be able to say "you have nothing to build this from"
// rather than writing a plausible one anyway.
//
// The picks these are built to fit: story bank = the grid (option 6), practice
// questions = the library (option 6).

export const metadata = { title: "Preview — Stories ↔ Practice questions" };

type Cell = "strong" | "usable" | "none";

const COMPETENCIES = [
  "Handling conflict",
  "Working under pressure",
  "Learning quickly",
  "Taking ownership",
  "Working with others",
];

const STORIES = [
  { title: "The refund I could not give", cov: [2, 0, 0, 1, 0] },
  { title: "The Saturday I ran the counter alone", cov: [0, 2, 0, 1, 0] },
];

const QUESTIONS = [
  {
    q: "Tell me about a difficult customer.",
    comp: "Handling conflict",
    have: "strong" as Cell,
    story: "The refund I could not give",
  },
  {
    q: "Describe a time you worked under pressure.",
    comp: "Working under pressure",
    have: "usable" as Cell,
    story: "The Saturday I ran the counter alone",
  },
  {
    q: "How do you pick up new systems?",
    comp: "Learning quickly",
    have: "none" as Cell,
    story: null,
  },
  {
    q: "Give me an example of a mistake you made.",
    comp: "Taking ownership",
    have: "none" as Cell,
    story: null,
  },
];

const TONE: Record<Cell, { chip: string; word: string }> = {
  strong: { chip: "bg-teal-50 text-teal-800 ring-teal-600/25", word: "Covered" },
  usable: {
    chip: "bg-amber-50 text-amber-900 ring-amber-600/25",
    word: "Thin",
  },
  none: {
    chip: "bg-slate-100 text-slate-600 ring-slate-400/25",
    word: "Nothing yet",
  },
};

function Chip({ s }: { s: Cell }) {
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

function Mic() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </svg>
  );
}

export default function PreviewStoryPractice() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
        Preview — not built
      </p>
      <h1 className="mt-1 font-display text-[2.1rem] font-bold leading-tight tracking-tight text-brand-ink">
        Stories and questions, joined up
      </h1>
      <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-slate-600">
        Browse practice questions from inside the Story Bank, and turn a
        question you cannot answer into a STAR story. Five ways to build that
        join, on top of the grid and the library you picked.
      </p>
      <p className="mt-3 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.85rem] leading-relaxed text-amber-900">
        <strong className="font-semibold">
          The risk in &ldquo;generate a story for this question&rdquo;:
        </strong>{" "}
        it is easy to produce something that reads beautifully and that the
        person has never said. That is a script, and scripts collapse on the
        first follow-up. Every option below ends with them speaking it — and
        every one has to be able to say{" "}
        <em>you have nothing to build this from yet</em> instead of writing a
        plausible story anyway.
      </p>

      {/* ------------------------------------------------------------ 1 */}
      <Option
        n={1}
        title="A Questions tab inside the Story Bank"
        idea="The grid you picked gains a second tab. Same page, same competencies, two views: what I can say, and what they will ask. Every question shows which of your stories answers it, and the ones with nothing carry a Build button."
        cost="Two tabs means one is always hidden. Somebody who lands on Stories may never learn the questions view exists."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <div className="flex gap-1 border-b border-slate-200 px-3 pt-2.5">
            {[
              ["My stories", false],
              ["What they will ask", true],
            ].map(([label, on]) => (
              <span
                key={label as string}
                className={`rounded-t-lg px-3.5 py-2 text-[0.8rem] font-bold ${
                  on
                    ? "bg-brand-mist text-brand-ink"
                    : "text-slate-500"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <ul className="grid gap-2 p-3.5">
            {QUESTIONS.map((q) => (
              <li
                key={q.q}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.85rem] font-semibold leading-snug text-brand-ink">
                    {q.q}
                  </span>
                  <span
                    className={`mt-0.5 block text-[0.78rem] leading-snug ${
                      q.story ? "text-slate-600" : "text-amber-800"
                    }`}
                  >
                    {q.story
                      ? `Answered by: ${q.story}`
                      : `No story for ${q.comp.toLowerCase()}.`}
                  </span>
                </span>
                <Chip s={q.have} />
                <span
                  className={`inline-flex min-h-9 shrink-0 items-center rounded-lg px-3.5 text-[0.76rem] font-bold ${
                    q.story
                      ? "border border-slate-300 text-brand-ink"
                      : "bg-brand-teal-deep text-white"
                  }`}
                >
                  {q.story ? "Practise it" : "Build a story"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 2 */}
      <Option
        n={2}
        title="A coverage grid"
        idea="Your stories down one axis, the competencies interviews test across the other. Filled cells are covered; empty columns are the questions you cannot answer. One screen tells you where the hole is and which single story would fill two."
        cost="Reads as a spreadsheet, and it is only legible with two or three stories. At ten stories and eight competencies it becomes a wall."
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-surface p-3.5">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr>
                <th className="pb-2 pr-3 text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                  Your stories
                </th>
                {COMPETENCIES.map((c) => (
                  <th
                    key={c}
                    className="pb-2 text-center text-[0.66rem] font-bold leading-tight text-slate-500"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STORIES.map((s) => (
                <tr key={s.title} className="border-t border-slate-200">
                  <td className="py-2 pr-3 text-[0.8rem] font-semibold text-brand-ink">
                    {s.title}
                  </td>
                  {s.cov.map((v, i) => (
                    <td key={i} className="py-2 text-center">
                      <span
                        aria-hidden
                        className={`inline-block h-3.5 w-3.5 rounded-sm ${
                          v === 2
                            ? "bg-brand-teal-deep"
                            : v === 1
                              ? "bg-brand-teal/35"
                              : "bg-slate-200"
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300">
                <td className="py-2 pr-3 text-[0.74rem] font-bold text-slate-500">
                  Questions you cannot answer
                </td>
                {[0, 0, 3, 1, 4].map((n, i) => (
                  <td key={i} className="py-2 text-center">
                    <span
                      className={`text-[0.8rem] font-bold ${
                        n > 0 ? "text-amber-700" : "text-slate-300"
                      }`}
                    >
                      {n || "—"}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="mt-2.5 text-[0.82rem] leading-relaxed text-slate-600">
            Four questions hang on <em>working with others</em> and you have
            nothing there. One story would close the widest column on this
            page.
          </p>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 3 */}
      <Option
        n={3}
        title="Question opens a story draft"
        idea="Press a question with no story behind it and Ascend goes looking through your evidence, proposes which piece fits, and drafts the STAR from it - then makes you say it before it is saved."
        cost="The moment where an invented story could get in. It has to refuse when the evidence is not there, and refusing is the harder half to build."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <div className="border-b border-slate-200 bg-brand-mist px-3.5 py-2.5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              Building a story for
            </p>
            <p className="text-[0.9rem] font-bold text-brand-ink">
              Give me an example of a mistake you made.
            </p>
          </div>
          <div className="p-3.5">
            <p className="text-[0.78rem] font-semibold text-slate-500">
              What I found in your record
            </p>
            <ul className="mt-1.5 grid gap-1.5">
              {[
                [
                  "Busy shift simulation",
                  "You logged two tickets to the wrong account and caught it yourself.",
                  true,
                ],
                [
                  "Store job",
                  "Nothing about a mistake — you have only told me the good days.",
                  false,
                ],
              ].map(([name, note, ok]) => (
                <li
                  key={name as string}
                  className={`rounded-lg border px-3 py-2 ${
                    ok ? "border-brand-teal/50 bg-teal-50/40" : "border-slate-200"
                  }`}
                >
                  <p className="text-[0.8rem] font-semibold text-brand-ink">
                    {name}
                  </p>
                  <p className="text-[0.75rem] leading-snug text-slate-500">
                    {note}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-3 rounded-lg border border-slate-200 p-3">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                Draft — from the simulation, not invented
              </p>
              <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-600">
                <strong className="font-semibold text-brand-ink">
                  Situation.
                </strong>{" "}
                Mid-shift, two tickets went onto the wrong customer account.{" "}
                <strong className="font-semibold text-brand-ink">
                  Action.
                </strong>{" "}
                I spotted it on the next handover, flagged it myself rather than
                waiting to be asked, and corrected both.
              </p>
              <p className="mt-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[0.75rem] leading-snug text-amber-900">
                I have left <strong className="font-semibold">Result</strong>{" "}
                blank. I know what you did; I do not know what happened
                afterwards, and I am not going to make that up.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
                <Mic />
                Say it in your own words
              </span>
              <span className="text-[0.78rem] text-slate-500">
                Saved once you have told it, not before.
              </span>
            </div>
          </div>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 4 */}
      <Option
        n={4}
        title="Practice makes the story"
        idea="No build step at all. You practise a question out loud, and any answer good enough to keep is offered as a story - already in your voice, because it is a transcript of you. The bank fills as a side effect of practising."
        cost="Stories only appear for people who practise. Somebody who wants a bank before their first run gets an empty page and no way to fill it."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <div className="border-b border-slate-200 px-3.5 py-2.5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              You just answered
            </p>
            <p className="text-[0.88rem] font-bold text-brand-ink">
              Tell me about a difficult customer.
            </p>
          </div>
          <div className="p-3.5">
            <p className="rounded-lg border border-slate-200 px-3 py-2 text-[0.8rem] italic leading-relaxed text-slate-500">
              &ldquo;…she was right to be annoyed, someone had told her
              fourteen days and it wasn&apos;t, so I said that first instead of
              reading the policy at her, and then offered the credit note…&rdquo;
            </p>
            <div className="mt-3 rounded-xl border border-brand-teal/40 bg-teal-50/50 p-3">
              <p className="text-[0.85rem] font-semibold leading-snug text-brand-ink">
                That was your best answer of the six. Keep it as a story?
              </p>
              <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-600">
                It already has a Situation, an Action and a Result in it. I will
                keep your sentences and tag it{" "}
                <em>handling conflict</em> — it answers three other questions
                you have coming.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className="inline-flex min-h-9 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.78rem] font-bold text-white">
                  Keep it
                </span>
                <span className="inline-flex min-h-9 items-center rounded-xl border border-slate-300 px-4 text-[0.78rem] font-bold text-brand-ink">
                  Not this one
                </span>
              </div>
            </div>
          </div>
        </div>
        <AiNote>
          The AI does not write anything here — it decides which of your answers
          was worth keeping, cuts it to length, and names the competency. The
          words stay yours because they were spoken.
        </AiNote>
      </Option>

      {/* ------------------------------------------------------------ 5 */}
      <Option
        n={5}
        title="One surface, two lenses"
        idea="No tabs and no second page. The library and the bank are the same list of competencies, and a switch changes what each row shows - the questions asked of it, or the story you have for it."
        cost="The most elegant and the hardest to name. 'Story bank' and 'practice questions' are two things the founder can point at; one toggling surface is harder to sell and harder to link to."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-3.5 py-2.5">
            <p className="text-[0.85rem] font-bold text-brand-ink">
              Customer Success Associate · what interviews test
            </p>
            <span className="inline-flex rounded-full bg-brand-mist p-0.5">
              {[
                ["What I can say", true],
                ["What they ask", false],
              ].map(([label, on]) => (
                <span
                  key={label as string}
                  className={`rounded-full px-3 py-1 text-[0.72rem] font-bold ${
                    on ? "bg-brand-teal-deep text-white" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              ))}
            </span>
          </div>
          <ul className="grid gap-2 p-3.5">
            {[
              [
                "Handling conflict",
                "The refund I could not give",
                "strong",
                "3 questions",
              ],
              [
                "Working under pressure",
                "The Saturday I ran the counter alone",
                "usable",
                "2 questions",
              ],
              ["Learning quickly", null, "none", "3 questions"],
              ["Working with others", null, "none", "4 questions"],
            ].map(([comp, story, state, count]) => (
              <li
                key={comp as string}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
              >
                <span className="w-44 shrink-0 text-[0.82rem] font-bold text-brand-ink">
                  {comp}
                </span>
                <span className="min-w-0 flex-1 text-[0.8rem] text-slate-600">
                  {story ?? (
                    <span className="text-amber-800">
                      Nothing to say for this yet
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[0.72rem] text-slate-400">
                  {count}
                </span>
                <Chip s={state as Cell} />
              </li>
            ))}
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
            Option 1 for browsing, Option 3 for building, Option 4 running
            quietly underneath.
          </strong>{" "}
          The tab is the cheapest way to reach questions from the grid you
          picked. Pressing an uncovered one opens the draft — with the refusal
          behaviour, which is the part that keeps this honest. And every good
          practice answer offering itself as a story means the bank fills
          without anybody being asked to sit down and write.
        </p>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-700">
          Option 2&apos;s grid is worth adding once somebody has five or more
          stories — as a summary at the top of the tab, not as the main screen.
          Option 5 is the better product and the harder thing to explain; it is
          the version to move to later, not the one to launch.
        </p>
      </section>

      <p className="mt-8 flex items-center gap-2 text-[0.8rem] text-slate-400">
        <Check size={13} />
        None of this is wired up. Pick one and it gets built properly.
      </p>
    </main>
  );
}
