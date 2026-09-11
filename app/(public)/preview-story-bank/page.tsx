import { Check } from "@/components/icons";

// Five ways to build the Interview Story Bank. Dead preview page.
//
// The brief: turn Passport evidence into interview-ready examples. Each story
// holds a situation, a task, an action, a result, the competency it shows, the
// simulation behind it, which roles it suits, and a suggested answer.
//
// The thing that makes this Ascend's rather than anyone's: the stories are
// built from evidence that already exists here - finished simulations, scored
// interview answers, verified Passport entries - rather than from a blank
// template asking somebody to remember a time they showed leadership.
//
// The failure mode: a bank of well-formed stories the person cannot actually
// tell out loud. A story they did not say in their own words is a script, and
// scripts collapse on the first follow-up question.

export const metadata = { title: "Preview — Interview Story Bank" };

type Story = {
  id: string;
  title: string;
  competency: string;
  evidence: string;
  verified: boolean;
  star: { s: string; t: string; a: string; r: string };
  roles: string[];
  strength: "strong" | "usable" | "thin";
};

const STORIES: Story[] = [
  {
    id: "escalation",
    title: "The refund I could not give",
    competency: "Handling conflict",
    evidence: "Escalation call simulation · scored 4 of 5",
    verified: true,
    star: {
      s: "A customer wanted a refund eleven days after a fourteen-day window had been misquoted to her by someone else.",
      t: "I had to hold the policy without making her feel she had been lied to — because she had, effectively.",
      a: "I said plainly that the earlier answer had been wrong, apologised for it specifically rather than generally, and offered the one thing I could actually authorise.",
      r: "She took the credit note and stayed. My manager used the call as a training example the following week.",
    },
    roles: ["Customer Success Associate", "Guest Experience Executive"],
    strength: "strong",
  },
  {
    id: "volume",
    title: "The Saturday I ran the counter alone",
    competency: "Working under pressure",
    evidence: "Resume · store job · not yet simulated",
    verified: false,
    star: {
      s: "Both weekend staff were out and roughly sixty customers came through between eleven and four.",
      t: "Keep the queue moving without getting the billing wrong, which is what actually costs money.",
      a: "I batched the simple purchases, asked the two complicated ones to wait five minutes, and told them why rather than leaving them standing.",
      r: "No billing errors that day. Two of the people I asked to wait came back the next week and asked for me.",
    },
    roles: ["Customer Success Associate", "Operations Coordinator"],
    strength: "usable",
  },
  {
    id: "learning",
    title: "Learning the CRM in a week",
    competency: "Learning quickly",
    evidence: "Nothing on file",
    verified: false,
    star: {
      s: "",
      t: "",
      a: "",
      r: "",
    },
    roles: ["Customer Success Associate"],
    strength: "thin",
  },
];

const QUESTIONS = [
  {
    q: "Tell me about a difficult customer.",
    story: "The refund I could not give",
    fit: "strong" as const,
  },
  {
    q: "Describe a time you worked under pressure.",
    story: "The Saturday I ran the counter alone",
    fit: "usable" as const,
  },
  {
    q: "How do you pick up new systems?",
    story: null,
    fit: "thin" as const,
  },
  {
    q: "Give me an example of a mistake you made.",
    story: null,
    fit: "thin" as const,
  },
];

const TONE: Record<Story["strength"], { chip: string; word: string }> = {
  strong: {
    chip: "bg-teal-50 text-teal-800 ring-teal-600/25",
    word: "Proven",
  },
  usable: {
    chip: "bg-amber-50 text-amber-900 ring-amber-600/25",
    word: "Yours, unproven",
  },
  thin: {
    chip: "bg-slate-100 text-slate-600 ring-slate-400/25",
    word: "Nothing yet",
  },
};

function Chip({ s }: { s: Story["strength"] }) {
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

function StarBlock({ star }: { star: Story["star"] }) {
  return (
    <dl className="mt-2 grid gap-2">
      {[
        ["Situation", star.s],
        ["Task", star.t],
        ["Action", star.a],
        ["Result", star.r],
      ].map(([label, text]) => (
        <div key={label} className="border-l-2 border-brand-violet/35 pl-3">
          <dt className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </dt>
          <dd className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-700">
            {text}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function PreviewStoryBank() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
        Preview — not built
      </p>
      <h1 className="mt-1 font-display text-[2.1rem] font-bold leading-tight tracking-tight text-brand-ink">
        Build answers from what you have already proven
      </h1>
      <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-slate-600">
        Turn your projects, simulations and strengths into interview stories you
        can actually use. Five ways to build it — they differ in where a story
        starts: from your evidence, from the question, from your own voice, or
        from the gap.
      </p>
      <p className="mt-3 max-w-3xl rounded-xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.85rem] leading-relaxed text-slate-600">
        <strong className="font-semibold text-brand-ink">
          The failure mode to design against:
        </strong>{" "}
        a bank of well-formed stories the person cannot say out loud. A story
        they never told in their own words is a script, and scripts collapse on
        the first follow-up question. Every option below has to end with the
        person having <em>said</em> it, not read it.
      </p>

      {/* ------------------------------------------------------------ 1 */}
      <Option
        n={1}
        title="Evidence in, stories out"
        idea="Your Passport and simulation record on the left; each item becomes a draft story on the right, already in STAR shape, with the evidence stapled to it. The pipeline is visible - nothing appears from nowhere."
        cost="Only as good as the evidence. Somebody two days into Ascend sees two items and three empty slots, which reads as a broken feature rather than an early one."
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="rounded-xl border border-slate-200 bg-surface p-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              What you have on file
            </p>
            <ul className="mt-2 grid gap-2">
              {[
                ["Escalation call", "Simulation · 4/5", true],
                ["Busy shift", "Simulation · completed", true],
                ["Store job", "Resume · your words", false],
                ["College fest stall", "Passport · pending", false],
              ].map(([name, from, ok]) => (
                <li
                  key={name as string}
                  className={`rounded-lg border px-2.5 py-2 ${
                    ok
                      ? "border-brand-teal/50 bg-teal-50/40"
                      : "border-slate-200"
                  }`}
                >
                  <p className="text-[0.8rem] font-semibold text-brand-ink">
                    {name}
                  </p>
                  <p className="text-[0.7rem] text-slate-500">{from}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[0.85rem] font-bold text-brand-ink">
                {STORIES[0].title}
              </p>
              <Chip s={STORIES[0].strength} />
            </div>
            <p className="mt-0.5 text-[0.7rem] font-semibold text-brand-violet-deep">
              {STORIES[0].competency} · from {STORIES[0].evidence}
            </p>
            <StarBlock star={STORIES[0].star} />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex min-h-9 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.78rem] font-bold text-white">
                Say it out loud
              </span>
              <span className="inline-flex min-h-9 items-center rounded-xl border border-slate-300 px-4 text-[0.78rem] font-bold text-brand-ink">
                Edit the wording
              </span>
            </div>
          </div>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 2 */}
      <Option
        n={2}
        title="Question first"
        idea="The questions they will actually be asked, each with the best story they have for it - and, crucially, the ones where they have nothing. The empty rows are the feature."
        cost="Encourages one story per question and memorisation. Real interviews reuse one good story across three questions, and this shape hides that."
      >
        <ul className="grid gap-2">
          {QUESTIONS.map((q) => (
            <li
              key={q.q}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-surface px-3.5 py-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[0.85rem] font-semibold text-brand-ink">
                  {q.q}
                </span>
                <span
                  className={`mt-0.5 block text-[0.78rem] leading-snug ${
                    q.story ? "text-slate-600" : "text-amber-800"
                  }`}
                >
                  {q.story
                    ? `You would tell: ${q.story}`
                    : "You have nothing for this one."}
                </span>
              </span>
              <Chip s={q.fit} />
              <span className="inline-flex min-h-8 shrink-0 items-center rounded-lg border border-slate-300 px-3 text-[0.74rem] font-bold text-brand-ink">
                {q.story ? "Practise it" : "Build one"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-amber-900">
          <strong className="font-semibold">Two blanks.</strong> Both are
          questions almost every HR round asks. That is the most useful thing on
          this screen.
        </p>
      </Option>

      {/* ------------------------------------------------------------ 3 */}
      <Option
        n={3}
        title="A deck you sort by competency"
        idea="Every story a card, tagged with the competency it proves and the roles it suits. Filter by what an interview is testing and see your coverage - and where you are relying on the same story twice."
        cost="Beautiful and passive. Sorting cards feels productive without anybody ever saying a sentence out loud."
      >
        <div className="flex flex-wrap gap-1.5">
          {[
            "Handling conflict",
            "Working under pressure",
            "Learning quickly",
            "Taking ownership",
            "Working with others",
          ].map((c, i) => (
            <span
              key={c}
              className={`rounded-full px-3 py-1 text-[0.74rem] font-semibold ${
                i === 0
                  ? "bg-brand-teal-deep text-white"
                  : "bg-surface text-slate-600 ring-1 ring-inset ring-slate-300"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {STORIES.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border p-3 ${
                s.strength === "thin"
                  ? "border-dashed border-slate-300 bg-surface/60"
                  : "border-slate-200 bg-surface"
              }`}
            >
              <Chip s={s.strength} />
              <p className="mt-1.5 text-[0.85rem] font-bold leading-snug text-brand-ink">
                {s.title}
              </p>
              <p className="mt-0.5 text-[0.72rem] text-slate-500">
                {s.evidence}
              </p>
              {s.strength !== "thin" && (
                <p className="mt-1.5 line-clamp-3 text-[0.76rem] leading-snug text-slate-600">
                  {s.star.a}
                </p>
              )}
              <p className="mt-2 text-[0.68rem] font-semibold text-brand-violet-deep">
                {s.roles.join(" · ")}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-600">
          Coverage: three of five competencies. Both your strong stories are
          about customers — an interviewer who asks about working in a team gets
          the same answer twice.
        </p>
      </Option>

      {/* ------------------------------------------------------------ 4 */}
      <Option
        n={4}
        title="Told, not typed"
        idea="The assistant asks about one piece of evidence and the person answers out loud. It shapes what they said into STAR and hands it back in their own words - so the story in the bank is a story they have already told once."
        cost="Needs a microphone and a quiet room, and produces messier prose than a generator would. That messiness is the point, which takes explaining."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <div className="border-b border-slate-200 bg-brand-mist px-3.5 py-2">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              Story 1 of 4 · Escalation call
            </p>
            <p className="text-[0.85rem] font-bold text-brand-ink">
              Tell me what happened, like you would tell a friend.
            </p>
          </div>
          <div className="p-3.5">
            <div className="flex items-center gap-2.5 rounded-lg bg-brand-mist px-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-teal-deep text-white">
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
              </span>
              <span aria-hidden className="flex flex-1 items-end gap-[3px]">
                {[7, 14, 21, 11, 25, 16, 9, 19, 12, 23, 8, 16, 10, 20].map(
                  (h, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-brand-teal"
                      style={{
                        height: `${h}px`,
                        opacity: 0.35 + (h / 25) * 0.65,
                      }}
                    />
                  ),
                )}
              </span>
              <span className="shrink-0 text-[0.7rem] font-bold text-brand-teal-deep">
                0:41
              </span>
            </div>
            <p className="mt-2.5 rounded-lg border border-slate-200 px-3 py-2 text-[0.8rem] italic leading-relaxed text-slate-500">
              &ldquo;…so she was right to be annoyed, someone had told her
              fourteen days and it wasn&apos;t fourteen days, so I said that
              first instead of reading the policy at her…&rdquo;
            </p>
            <AiNote>
              It shapes what you said into Situation, Task, Action, Result — and
              keeps your sentences. If it cannot find a Result in what you told
              it, it asks rather than inventing one.
            </AiNote>
          </div>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 5 */}
      <Option
        n={5}
        title="The gap ledger"
        idea="Starts from the role, not the person. Here are the six things this job interviews for; here is what you can prove for each; here is the shortest route to filling the blanks - usually one simulation."
        cost="Opens on what is missing, which is the harshest possible first screen for somebody early on. Needs the two proven rows on top, not the four empty ones."
      >
        <div className="rounded-xl border border-slate-200 bg-surface p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            What a Customer Success interview tests
          </p>
          <ul className="mt-2.5 grid gap-2.5">
            {[
              ["Handling conflict", "strong", "Escalation call · scored 4/5"],
              ["Working under pressure", "usable", "Store job · your account"],
              ["Learning quickly", "thin", "One simulation would fix this"],
              ["Taking ownership", "thin", "Nothing on file"],
              ["Working with others", "thin", "Nothing on file"],
            ].map(([name, state, note]) => (
              <li key={name as string} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-[0.82rem] font-semibold text-brand-ink">
                  {name}
                </span>
                <Chip s={state as Story["strength"]} />
                <span className="min-w-0 flex-1 text-[0.78rem] text-slate-500">
                  {note}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-3">
            <span className="inline-flex min-h-10 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
              Do the one that closes two
            </span>
            <span className="text-[0.8rem] text-slate-500">
              The team simulation covers ownership and working with others.
            </span>
          </div>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 6 */}
      <Option
        n={6}
        title="The story grid — closest to the mockup you sent"
        idea="The shape you showed: explanation on the left, a grid of story cards on the right. One card is open with its four STAR boxes laid out; the rest are collapsed to a title, a first line and their skill tags. Expanding one is the whole interaction."
        cost="It presents every story as finished and equal. The mockup has no way to say 'this one is yours but unproven' or 'this one is empty' - and those two states are most of what an early user actually has."
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-xl border border-slate-200 bg-surface p-4">
            <h3 className="font-display text-[1.15rem] font-bold leading-snug text-brand-ink">
              Build your narrative
            </h3>
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-600">
              Your behavioural answers in STAR shape, drawn from what you have
              already done here rather than from a blank template.
            </p>
            <ul className="mt-3 grid gap-2">
              {[
                "Built from simulations and Passport entries, not memory",
                "Tagged with the competency each one proves",
                "Marked when a story is yours but nothing backs it up",
                "Said out loud once, so you can say it again",
              ].map((l) => (
                <li
                  key={l}
                  className="flex gap-2 text-[0.82rem] text-slate-600"
                >
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                    <Check size={9} />
                  </span>
                  {l}
                </li>
              ))}
            </ul>
            <span className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-teal-deep px-5 text-[0.83rem] font-bold text-white">
              Build my stories
            </span>
          </div>

          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              Your stories
            </p>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              {/* the open one */}
              <div className="rounded-xl border-2 border-brand-violet/50 bg-surface p-3 sm:row-span-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-brand-violet-deep">
                    {STORIES[0].competency}
                  </p>
                  <span className="shrink-0 text-[0.65rem] font-semibold text-slate-400">
                    Collapse
                  </span>
                </div>
                <p className="mt-0.5 text-[0.88rem] font-bold leading-snug text-brand-ink">
                  {STORIES[0].title}
                </p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {[
                    ["Situation", STORIES[0].star.s],
                    ["Task", STORIES[0].star.t],
                    ["Action", STORIES[0].star.a],
                    ["Result", STORIES[0].star.r],
                  ].map(([label, text]) => (
                    <div key={label} className="rounded-lg bg-brand-mist p-2">
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-0.5 text-[0.74rem] leading-snug text-slate-600">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Chip s={STORIES[0].strength} />
                  {["Communication", "Ownership"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[0.68rem] font-semibold text-brand-violet-deep">
                  From {STORIES[0].evidence}
                </p>
              </div>

              {/* the collapsed ones, including the two states the mockup has no room for */}
              {[
                {
                  comp: STORIES[1].competency,
                  title: STORIES[1].title,
                  line: STORIES[1].star.s,
                  tags: ["Composure", "Prioritising"],
                  s: STORIES[1].strength,
                  from: STORIES[1].evidence,
                },
                {
                  comp: "Taking ownership",
                  title: "The delivery I chased myself",
                  line: "A customer's order had been sitting with the courier for four days…",
                  tags: ["Follow-through"],
                  s: "usable" as const,
                  from: "Resume · not yet simulated",
                },
                {
                  comp: STORIES[2].competency,
                  title: "Nothing here yet",
                  line: "Almost every HR round asks this. One simulation would give you an answer.",
                  tags: [],
                  s: STORIES[2].strength,
                  from: "Nothing on file",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className={`rounded-xl border p-3 ${
                    c.s === "thin"
                      ? "border-dashed border-slate-300 bg-surface/60"
                      : "border-slate-200 bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wide text-brand-violet-deep">
                      {c.comp}
                    </p>
                    {c.s !== "thin" && (
                      <span className="shrink-0 text-[0.65rem] font-semibold text-slate-400">
                        Expand
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[0.85rem] font-bold leading-snug text-brand-ink">
                    {c.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[0.75rem] leading-snug text-slate-500">
                    {c.line}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Chip s={c.s} />
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <AiNote>
          The grid is where stories live; it is not where they are made. Every
          card here still has to have been said out loud once — otherwise this
          is a well-organised set of scripts.
        </AiNote>
      </Option>

      {/* ---------------------------------------------------------- rec */}
      <section className="mt-10 rounded-2xl border border-brand-teal/40 bg-brand-teal-deep/[0.05] p-5">
        <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-teal-800">
          If you want a recommendation
        </h2>
        <p className="mt-1.5 text-[0.9rem] leading-relaxed text-slate-700">
          <strong className="font-semibold text-brand-ink">
            Option 4 as how a story is made, Option 5 as the screen it lives on.
          </strong>{" "}
          Telling it out loud is the only one of the five that produces
          something the person can repeat under pressure — everything else
          produces text they will read once and forget. The gap ledger is the
          right home for it because it answers &ldquo;which one should I do
          next&rdquo; without being asked.
        </p>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-700">
          Option 3 is the most attractive screen here and the least useful. Card
          sorting feels like preparation and is not.
        </p>
      </section>

      <p className="mt-8 flex items-center gap-2 text-[0.8rem] text-slate-400">
        <Check size={13} />
        None of this is wired up. Pick one and it gets built properly.
      </p>
    </main>
  );
}
