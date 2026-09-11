import { Check } from "@/components/icons";

// The Assessment, as your first thirty days in the job. Dead preview page.
//
// The frame changed and it changes everything: this is not a shift, it is an
// onboarding. Day one you are given something small and somebody checks on
// you. By day thirty you are handed a project, nobody checks, and you are
// expected to say what you need.
//
// That arc is what makes the measurement work. A single sitting can only ask
// "can you do this task". Thirty days asks the questions that actually decide
// whether somebody is productive:
//
//   Do they ask for help, and when? Too early is dependency, never is the
//   more expensive failure - a week spent going the wrong way in silence.
//   The buddy is available on every task and using it is not a penalty; the
//   measurement is timing and quality of the ask, not the count.
//
//   Do they get better at the same kind of work? Day three and day eighteen
//   are deliberately the same shape. Improvement between them is the single
//   most predictive thing here, and no one-shot format can see it.
//
//   Does the support coming away change them? Help thins out on purpose.
//   Somebody who only performs while supervised shows up in exactly one place
//   and it is day twenty-one.
//
// Fifteen minutes of wall clock. The days are scenes, not hours - and the
// screen says so, because pretending otherwise is a lie somebody will notice.

export const metadata = { title: "Preview — Assessment" };

type Day = {
  day: string;
  minutes: string;
  title: string;
  brief: string;
  support: "buddy" | "assistant" | "both" | "none";
  measures: string[];
  answer: "typed" | "spoken" | "artefact";
};

const ARC: Day[] = [
  {
    day: "Day 1",
    minutes: "2 min",
    title: "Read yourself in",
    brief:
      "Here is the team, the products, and last week's handover notes. Your buddy Priya asks: after reading that, what do you think you will be doing most days?",
    support: "both",
    measures: ["Comprehension", "Written communication"],
    answer: "typed",
  },
  {
    day: "Day 3",
    minutes: "3 min",
    title: "Your first real ticket",
    brief:
      "A customer wants a refund eleven days in against a fourteen-day window, and the courier note says the item arrived damaged. Handle it. Priya is at her desk if you need her.",
    support: "both",
    measures: ["Problem solving", "Judgement", "Asking for help"],
    answer: "typed",
  },
  {
    day: "Day 12",
    minutes: "4 min",
    title: "The project",
    brief:
      "Forty-one tickets came in over the weekend and eleven are the same delayed shipment. Decide the order they get worked, write the message that goes to the eleven, and say what you would change so this does not happen again.",
    support: "assistant",
    measures: ["Analytical thinking", "Prioritising", "Working with AI"],
    answer: "artefact",
  },
  {
    day: "Day 18",
    minutes: "3 min",
    title: "The same ticket, harder",
    brief:
      "Same shape as day three - a refund outside policy - except the customer has already been told no by somebody else, and the account is frozen until Monday.",
    support: "buddy",
    measures: ["Improvement since day 3", "Judgement under constraint"],
    answer: "typed",
  },
  {
    day: "Day 21",
    minutes: "2 min",
    title: "Nobody is in today",
    brief:
      "Priya is on leave and the assistant is down. A supplier is asking for a decision you have not been given authority for. What do you do?",
    support: "none",
    measures: ["Raw thinking", "Escalation instinct"],
    answer: "typed",
  },
  {
    day: "Day 30",
    minutes: "1 min",
    title: "Your first month, out loud",
    brief:
      "Your manager asks for sixty seconds: what you took on, what you are still unsure about, and what you need from the team next month.",
    support: "none",
    measures: ["Spoken fluency", "Self-awareness"],
    answer: "spoken",
  },
];

const SUPPORT: Record<
  Day["support"],
  { label: string; chip: string; note: string }
> = {
  both: {
    label: "Buddy + assistant",
    chip: "bg-teal-50 text-teal-800 ring-teal-600/25",
    note: "Everything available, the way week one actually is.",
  },
  assistant: {
    label: "Assistant only",
    chip: "bg-brand-violet/10 text-brand-violet-deep ring-brand-violet/25",
    note: "Priya is in a meeting. You have the tool and yourself.",
  },
  buddy: {
    label: "Buddy only",
    chip: "bg-amber-50 text-amber-900 ring-amber-600/25",
    note: "A person to ask, no tool to lean on.",
  },
  none: {
    label: "On your own",
    chip: "bg-slate-100 text-slate-600 ring-slate-400/25",
    note: "Said before it starts, never sprung.",
  },
};

const SKILLS = [
  {
    name: "Problem solving",
    level: 3,
    from: "Day 3 and Day 18 — improved between them",
  },
  {
    name: "Written communication",
    level: 3,
    from: "The message to the eleven",
  },
  { name: "Analytical thinking", level: 2, from: "Day 12, the ordering" },
  { name: "Asking for help", level: 3, from: "Asked twice, both times late" },
  { name: "Working with AI", level: 2, from: "9 turns, 2 refinements" },
  { name: "Spoken fluency", level: 3, from: "The day 30 minute" },
];

const LEVELS = ["Not shown", "Emerging", "Working", "Strong", "Leading"];

function Bar({ level }: { level: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 4 }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-6 rounded-full ${
            i < level ? "bg-brand-teal-deep" : "bg-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-slate-200 pt-7">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-violet-deep">
        {label}
      </p>
      <h2 className="mt-0.5 font-display text-[1.35rem] font-bold leading-tight text-brand-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PreviewAssessment() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
        Preview — not built
      </p>
      <h1 className="mt-1 font-display text-[2.1rem] font-bold leading-tight tracking-tight text-brand-ink">
        Your first thirty days
      </h1>
      <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-slate-600">
        Not a test and not a shift — an onboarding. Day one somebody checks on
        you. By day thirty you are handed a project, nobody checks, and you are
        expected to say what you need. Fifteen minutes of real time; the days
        are scenes, and the screen says so.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {[
          [
            "Why thirty days and not one",
            "A single sitting can only ask whether you can do a task. An arc asks whether you get better, whether you ask for help, and what happens when it is taken away.",
          ],
          [
            "The questions are not ours",
            "An admin writes the arc per role — each day's brief, what it measures, what support it allows, and the harder and easier versions the next day is chosen from.",
          ],
          [
            "Proficiency is measured here",
            "This is the only place in Ascend allowed to say you are good at something. Every level names the day and the artefact behind it.",
          ],
        ].map(([head, body]) => (
          <p
            key={head}
            className="rounded-xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.83rem] leading-relaxed text-slate-600"
          >
            <strong className="block font-semibold text-brand-ink">
              {head}
            </strong>
            <span className="mt-0.5 block">{body}</span>
          </p>
        ))}
      </div>

      {/* --------------------------------------------------------- arc */}
      <Section label="The shape" title="Six scenes across a month">
        <p className="mt-1.5 max-w-3xl text-[0.9rem] leading-relaxed text-slate-600">
          Support thins as the month goes on, which is the point: somebody who
          only performs while supervised shows up on day twenty-one and nowhere
          else. Day 3 and Day 18 are deliberately the same shape — the change
          between them is the most predictive thing this produces.
        </p>

        <ol className="mt-4 grid gap-2">
          {ARC.map((d) => (
            <li
              key={d.day}
              className="rounded-2xl border border-slate-200 bg-surface p-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-panel px-2.5 py-0.5 text-[0.65rem] font-bold text-white">
                  {d.day}
                </span>
                <span className="text-[0.88rem] font-bold text-brand-ink">
                  {d.title}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ring-1 ring-inset ${SUPPORT[d.support].chip}`}
                >
                  {SUPPORT[d.support].label}
                </span>
                <span className="ml-auto text-[0.7rem] font-semibold text-slate-400">
                  {d.minutes} ·{" "}
                  {d.answer === "spoken"
                    ? "spoken"
                    : d.answer === "artefact"
                      ? "deliverable"
                      : "typed"}
                </span>
              </div>
              <p className="mt-1.5 text-[0.83rem] leading-relaxed text-slate-600">
                {d.brief}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {d.measures.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600"
                  >
                    {m}
                  </span>
                ))}
                <span className="text-[0.7rem] text-slate-400">
                  {SUPPORT[d.support].note}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* -------------------------------------------------------- screen */}
      <Section label="The screen" title="What a day looks like">
        <p className="mt-1.5 max-w-3xl text-[0.9rem] leading-relaxed text-slate-600">
          The work in the middle, the two kinds of help on the right, and the
          month running along the top so nobody is lost in it.
        </p>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-brand-mist p-4 sm:p-5">
          {/* the month, along the top */}
          <ol className="flex flex-wrap items-center gap-1.5">
            {ARC.map((d, i) => (
              <li key={d.day} className="flex items-center gap-1.5">
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
                    i < 2
                      ? "bg-brand-teal-deep text-white"
                      : i === 2
                        ? "bg-brand-violet text-white"
                        : "bg-surface text-slate-400 ring-1 ring-inset ring-slate-200"
                  }`}
                >
                  {d.day}
                </span>
                {i < ARC.length - 1 && (
                  <span aria-hidden className="h-px w-3 bg-slate-300" />
                )}
              </li>
            ))}
            <li className="ml-auto text-[0.72rem] font-bold text-slate-500">
              9:41 left
            </li>
          </ol>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
            {/* the work */}
            <div className="rounded-xl border border-slate-200 bg-surface p-3.5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                Day 12 · Meridian Retail · Customer Operations
              </p>
              <p className="mt-0.5 text-[0.95rem] font-bold text-brand-ink">
                The weekend backlog
              </p>
              <p className="mt-1 text-[0.83rem] leading-relaxed text-slate-600">
                Forty-one tickets came in over the weekend and nobody worked
                them. Eleven are about the same delayed shipment.
              </p>
              <div className="mt-2.5 grid gap-2">
                {[
                  "The order you would work them in, and why",
                  "The message that goes to the eleven",
                  "One change that stops this happening again",
                ].map((field) => (
                  <div
                    key={field}
                    className="min-h-[3rem] rounded-lg border border-slate-300 px-2.5 py-2 text-[0.74rem] text-slate-500"
                  >
                    {field}…
                  </div>
                ))}
              </div>
            </div>

            {/* the two kinds of help */}
            <div className="grid content-start gap-2.5">
              <div className="rounded-xl border border-dashed border-slate-300 bg-surface/60 p-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Priya · your buddy
                </p>
                <p className="mt-1 text-[0.76rem] leading-relaxed text-slate-500">
                  In a meeting until 3. Today is the tool and you.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Company assistant
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-slate-500">
                    Basic
                  </span>
                </div>
                <ol className="mt-2 grid gap-1.5">
                  <li className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-teal-50 px-2.5 py-1.5 text-[0.71rem] leading-relaxed text-teal-900">
                    write the message to the 11 customers
                  </li>
                  <li className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-2.5 py-1.5 text-[0.71rem] leading-relaxed text-slate-700">
                    Dear Customer, Thank you for your patience. We apologise for
                    any inconvenience caused by the delay…
                  </li>
                  <li className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-teal-50 px-2.5 py-1.5 text-[0.71rem] leading-relaxed text-teal-900">
                    no. say when it ships and what they get if it slips again
                  </li>
                </ol>
                <p className="mt-2 rounded-lg bg-brand-mist px-2.5 py-1.5 text-[0.68rem] leading-snug text-slate-600">
                  Told up front: this is the basic tool your employer would give
                  you. Its first answer is never the good one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------ read-out */}
      <Section label="The result" title="What thirty days produces">
        <div className="mt-4 rounded-2xl border border-slate-200 bg-brand-mist p-4 sm:p-5">
          <div className="rounded-xl border border-slate-200 bg-surface p-4">
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 pb-3">
              <span className="font-display text-[2rem] font-bold leading-none text-brand-teal-deep">
                Working
              </span>
              <p className="min-w-0 flex-1 text-[0.85rem] leading-snug text-slate-600">
                Role readiness for Customer Success Associate — a level, not a
                percentage. A number here reads as a mark; this is something you
                move.
              </p>
            </div>

            <ul className="mt-3 grid gap-2.5">
              {SKILLS.map((s) => (
                <li key={s.name} className="flex flex-wrap items-center gap-3">
                  <span className="w-44 shrink-0 text-[0.83rem] font-semibold text-brand-ink">
                    {s.name}
                  </span>
                  <Bar level={s.level} />
                  <span className="w-20 shrink-0 text-[0.76rem] font-bold text-brand-teal-deep">
                    {LEVELS[s.level]}
                  </span>
                  <span className="min-w-0 flex-1 text-[0.74rem] text-slate-400">
                    {s.from}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-violet/[0.07] px-3.5 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-brand-violet-deep">
                  How the month went
                </p>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-700">
                  Day 18 was noticeably better than day 3 on the same kind of
                  problem — you named the constraint before proposing anything,
                  which you did not do the first time. That improvement is the
                  strongest signal in here.
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3.5 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-amber-900">
                  The honest part
                </p>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-amber-900">
                  You asked Priya for help twice, both times after you were
                  already committed to an approach. Asking earlier is cheaper
                  than asking better. On day 12 you took the assistant&apos;s
                  first answer and sent it nearly unchanged.
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-brand-teal/40 bg-teal-50/50 p-3.5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-teal-800">
                To be ready for this role
              </p>
              <ul className="mt-1.5 grid gap-1.5">
                {[
                  "Analytical thinking is the level holding this down, and day 12 is the only place it was tested. A second run makes it defensible rather than provisional.",
                  "Take the day 3 and day 18 tickets into a practice interview — that pair is the best story you have and you have not told it out loud.",
                  "Two skills rest on one day each. They are marked provisional in your Passport until a second sitting.",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex gap-2 text-[0.83rem] leading-relaxed text-slate-700"
                  >
                    <span className="mt-1 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                      <Check size={8} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------- admin */}
      <Section label="Where it comes from" title="The admin writes the month">
        <p className="mt-1.5 max-w-3xl text-[0.9rem] leading-relaxed text-slate-600">
          Nothing about a role lives in code. For each role an admin writes the
          arc — and for each day, an easier and a harder version, so the next
          scene can be chosen from how the last one went.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-surface p-4">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200">
                {[
                  "Day",
                  "Brief",
                  "Support",
                  "Measures",
                  "If they struggle",
                ].map((h) => (
                  <th
                    key={h}
                    className="pb-2 pr-3 text-[0.65rem] font-bold uppercase tracking-wide text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["1", "Read yourself in", "Buddy + AI", "Comprehension", "—"],
                [
                  "3",
                  "First real ticket",
                  "Buddy + AI",
                  "Judgement",
                  "Simpler ticket, policy stated",
                ],
                [
                  "12",
                  "The project",
                  "AI only",
                  "Analysis, AI use",
                  "Fewer tickets, order given",
                ],
                [
                  "18",
                  "Same, harder",
                  "Buddy only",
                  "Improvement",
                  "Repeat day 3 shape",
                ],
                ["21", "Nobody is in", "None", "Raw thinking", "—"],
                ["30", "Out loud", "None", "Fluency", "Typed instead"],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-slate-100">
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className={`py-2 pr-3 text-[0.8rem] ${
                        i === 0 ? "font-bold text-brand-ink" : "text-slate-600"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ------------------------------------------------------ flagged */}
      <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-amber-900">
          Four things to decide before this is built
        </h2>
        <ul className="mt-2 grid gap-2.5 text-[0.87rem] leading-relaxed text-amber-900">
          <li>
            <strong className="font-semibold">
              Fifteen minutes buys six scenes of roughly two minutes.
            </strong>{" "}
            That is enough for the arc above and not enough for two full
            projects. Either day 12 is the project and the rest are tickets
            around it — which is what is drawn here — or the sitting is
            twenty-five minutes. Rushed, this measures typing speed.
          </li>
          <li>
            <strong className="font-semibold">
              The buddy is the expensive part.
            </strong>{" "}
            A person you can ask has to answer in character, usefully but not
            completely, and remember what it already told you. That is a second
            AI with its own rules, and it is what makes the arc worth having —
            without it, &ldquo;asking for help&rdquo; cannot be measured at all.
          </li>
          <li>
            <strong className="font-semibold">
              The mediocre assistant must be disclosed.
            </strong>{" "}
            Stated as a fact of the workplace — &ldquo;this is the basic tool
            your employer would give you&rdquo; — not sprung. Measuring how
            somebody uses it is fair; letting them believe it is our best while
            scoring them on noticing is not.
          </li>
          <li>
            <strong className="font-semibold">
              One sitting is one reading.
            </strong>{" "}
            A level from a single month-in-fifteen-minutes is provisional, and
            the Passport must show it as provisional until a second sitting
            agrees with it. Otherwise the Passport inherits a claim no employer
            should accept and neither should we.
          </li>
        </ul>
      </section>

      <p className="mt-8 flex items-center gap-2 text-[0.8rem] text-slate-400">
        <Check size={13} />
        None of this is wired up. Say yes to the shape and it gets built.
      </p>
    </main>
  );
}
