import { Check } from "@/components/icons";

// Five ways to build the Job Fit Analyzer. Dead preview page - nothing here is
// wired to anything, and none of it ships until one is picked.
//
// The brief: paste a job description, and Ascend says whether this person is
// ready for it, using what it already holds - the Passport, the resume, the
// readiness score, simulation evidence, skills, interview readiness.
//
// The line every option has to hold: this is not a job search tool. It never
// says "apply" and it never ranks jobs. It answers one question - am I ready
// for this one - and every answer points back at something the person did.
//
// The distinction that separates a good version from a hollow one is proof
// versus claim. A resume bullet is a claim. A finished simulation, a scored
// interview, a verified Passport entry is proof. An analyser that treats them
// the same is a keyword matcher with a nicer font.

export const metadata = { title: "Preview — Job Fit Analyzer" };

const JD = `Customer Success Associate — Bengaluru
• Handle 40-60 customer queries a day over calls and email
• Own escalations end to end and keep the customer informed
• Maintain CRM records accurately
• Coordinate with operations on delivery issues
• 0-2 years experience. Graduate in any discipline.`;

type Line = {
  need: string;
  state: "proof" | "claim" | "gap";
  from: string;
  note: string;
};

const LINES: Line[] = [
  {
    need: "Handling volume - 40-60 queries a day",
    state: "proof",
    from: "Simulation: Busy shift, completed",
    note: "You cleared 52 tickets in the timed run with 3 escalations handled.",
  },
  {
    need: "Owning escalations end to end",
    state: "proof",
    from: "Interview practice, HR round",
    note: "Your refund-outside-policy answer scored highest of your six.",
  },
  {
    need: "Keeping the customer informed",
    state: "claim",
    from: "Resume, store job bullet",
    note: "On your resume but nothing behind it yet. One simulation would fix that.",
  },
  {
    need: "CRM accuracy",
    state: "gap",
    from: "Nothing on file",
    note: "Never mentioned, never practised. This is the one to close first.",
  },
  {
    need: "Coordinating with operations",
    state: "claim",
    from: "Discovery, role tour note",
    note: "You said you liked being the one who sorted it out - that is adjacent, not the same.",
  },
];

const TONE: Record<
  Line["state"],
  { chip: string; label: string; bar: string }
> = {
  proof: {
    chip: "bg-teal-50 text-teal-800 ring-teal-600/25",
    label: "Proven",
    bar: "bg-brand-teal-deep",
  },
  claim: {
    chip: "bg-amber-50 text-amber-900 ring-amber-600/25",
    label: "Claimed",
    bar: "bg-amber-400",
  },
  gap: {
    chip: "bg-slate-100 text-slate-600 ring-slate-400/25",
    label: "Nothing yet",
    bar: "bg-slate-300",
  },
};

function Chip({ state }: { state: Line["state"] }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ring-1 ring-inset ${TONE[state].chip}`}
    >
      {TONE[state].label}
    </span>
  );
}

/* ------------------------------------------------------------------ radar */

const AXES = [
  { label: "Evidence", you: 88, need: 70 },
  { label: "Interview", you: 74, need: 65 },
  { label: "Resume", you: 66, need: 60 },
  { label: "Passport", you: 58, need: 75 },
  { label: "Skills", you: 40, need: 70 },
];

/** Points on a regular pentagon, by hand - no chart library in this repo. */
function polygon(values: number[], radius: number, cx: number, cy: number) {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
      const r = (v / 100) * radius;
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    })
    .join(" ");
}

function Radar() {
  const R = 74;
  const cx = 110;
  const cy = 96;
  const full = AXES.map(() => 100);
  return (
    <svg
      viewBox="0 0 220 200"
      className="mx-auto h-auto w-full max-w-[15rem]"
      role="img"
      aria-label={AXES.map(
        (a) => `${a.label}: you ${a.you} of 100, this job wants ${a.need}`,
      ).join("; ")}
    >
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={polygon(
            full.map((v) => v * ring),
            R,
            cx,
            cy,
          )}
          fill="none"
          stroke="rgb(203 213 225)"
          strokeWidth="1"
        />
      ))}
      {AXES.map((a, i) => {
        const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
        return (
          <line
            key={a.label}
            x1={cx}
            y1={cy}
            x2={cx + R * Math.cos(angle)}
            y2={cy + R * Math.sin(angle)}
            stroke="rgb(203 213 225)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={polygon(
          AXES.map((a) => a.need),
          R,
          cx,
          cy,
        )}
        fill="rgb(148 163 184 / 0.35)"
        stroke="rgb(100 116 139)"
        strokeWidth="1.5"
      />
      <polygon
        points={polygon(
          AXES.map((a) => a.you),
          R,
          cx,
          cy,
        )}
        fill="rgb(13 148 136 / 0.28)"
        stroke="rgb(13 148 136)"
        strokeWidth="2"
      />
      {AXES.map((a, i) => {
        const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
        const lx = cx + (R + 20) * Math.cos(angle);
        const ly = cy + (R + 20) * Math.sin(angle);
        return (
          <text
            key={a.label}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-500 text-[9px] font-bold"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

/** The ring, drawn once. 72 is the readiness figure the other options use. */
function Donut({ value }: { value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-32 w-32"
      role="img"
      aria-label={`Readiness ${value} of 100`}
    >
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="rgb(226 232 240)"
        strokeWidth="12"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="rgb(13 148 136)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="58"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-900 text-[26px] font-bold"
      >
        {value}
      </text>
      <text
        x="60"
        y="78"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-400 text-[9px] font-bold uppercase"
      >
        of 100
      </text>
    </svg>
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

/** The paste box, shared by every option that starts with one. */
function Paste({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-surface p-3">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        The job you are looking at
      </p>
      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap font-sans text-[0.78rem] leading-relaxed text-slate-600">
        {compact ? JD.split("\n").slice(0, 3).join("\n") + "\n…" : JD}
      </pre>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-9 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
          Check my fit
        </span>
        <span className="text-[0.75rem] text-slate-400">
          Paste it, or drop the PDF.
        </span>
      </div>
    </div>
  );
}

/** The AI affordance, drawn the same way in every option that uses it. */
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

export default function PreviewJobFit() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
        Preview — not built
      </p>
      <h1 className="mt-1 font-display text-[2.1rem] font-bold leading-tight tracking-tight text-brand-ink">
        Am I ready for this job?
      </h1>
      <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-slate-600">
        Paste a job description and Ascend shows your match, your gaps, and what
        to improve before applying. Five ways to build it, below. They differ in
        what they put first — a verdict, the evidence, the gap, or a
        conversation — and that choice decides what somebody does next.
      </p>
      <p className="mt-3 max-w-3xl rounded-xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.85rem] leading-relaxed text-slate-600">
        <strong className="font-semibold text-brand-ink">
          The rule underneath all five:
        </strong>{" "}
        a resume bullet is a <em>claim</em>; a finished simulation, a scored
        interview or a verified Passport entry is <em>proof</em>. An analyser
        that treats them the same is a keyword matcher. Every option below
        separates them.
      </p>

      {/* ------------------------------------------------------------ 1 */}
      <Option
        n={1}
        title="Verdict first"
        idea="One sentence of judgement at the top - ready, nearly, or not yet - then the evidence that produced it. The person gets the answer they came for before they get the detail."
        cost="A verdict is a strong claim. Get it wrong once, visibly, and the rest of the page stops being believed."
      >
        <Paste compact />
        <div className="mt-3 rounded-xl border border-brand-teal/40 bg-teal-50/50 p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-teal-800">
            The verdict
          </p>
          <p className="mt-1 font-display text-[1.4rem] font-bold leading-tight text-brand-ink">
            Nearly. Apply after one more thing.
          </p>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate-700">
            You have proof for the two parts of this job that carry it — volume
            and escalations. The CRM requirement is the only one with nothing
            behind it at all, and it is a half-hour simulation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex min-h-9 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white">
              Close the CRM gap
            </span>
            <span className="inline-flex min-h-9 items-center rounded-xl border border-slate-300 px-4 text-[0.8rem] font-bold text-brand-ink">
              See the evidence
            </span>
          </div>
        </div>
        <ul className="mt-3 grid gap-1.5">
          {LINES.slice(0, 3).map((l) => (
            <li
              key={l.need}
              className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2"
            >
              <Chip state={l.state} />
              <span className="min-w-0 flex-1 text-[0.82rem] text-brand-ink">
                {l.need}
              </span>
            </li>
          ))}
        </ul>
      </Option>

      {/* ------------------------------------------------------------ 2 */}
      <Option
        n={2}
        title="Line by line against the posting"
        idea="The job description stays on screen, and each requirement is answered beside the line it came from. Nothing is summarised away - the person can see we read the whole thing."
        cost="Long postings make a long page, and the vague lines every posting contains ('good communication skills') are answered weakly, which shows."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-300 bg-surface p-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              The posting
            </p>
            <ul className="mt-2 grid gap-2">
              {LINES.map((l, i) => (
                <li
                  key={l.need}
                  className={`rounded-lg px-2.5 py-2 text-[0.8rem] leading-snug ${
                    i === 0
                      ? "bg-brand-mist text-brand-ink ring-1 ring-brand-teal"
                      : "text-slate-600"
                  }`}
                >
                  {l.need}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-surface p-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              What you have against it
            </p>
            <div className="mt-2 grid gap-2.5">
              {LINES.map((l) => (
                <div key={l.need} className="border-l-2 border-slate-200 pl-3">
                  <div className="flex items-center gap-2">
                    <Chip state={l.state} />
                    <span className="text-[0.72rem] font-semibold text-slate-500">
                      {l.from}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.8rem] leading-snug text-slate-600">
                    {l.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <AiNote>
          Reading the posting is the AI&apos;s job here — it turns loose prose
          into the five things actually being asked for, and says when a line is
          too vague to answer.
        </AiNote>
      </Option>

      {/* ------------------------------------------------------------ 3 */}
      <Option
        n={3}
        title="Three lanes: proven, claimed, nothing yet"
        idea="No score and no verdict. Every requirement is sorted into one of three columns, and the middle column is the interesting one - things you say about yourself that nothing backs up."
        cost="No single answer to 'am I ready', which is the question that was asked. Somebody has to read three columns and decide for themselves."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {(["proof", "claim", "gap"] as const).map((state) => (
            <div
              key={state}
              className="rounded-xl border border-slate-200 bg-surface p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Chip state={state} />
                <span className="text-[0.7rem] font-bold text-slate-400">
                  {LINES.filter((l) => l.state === state).length}
                </span>
              </div>
              <ul className="mt-2 grid gap-2">
                {LINES.filter((l) => l.state === state).map((l) => (
                  <li key={l.need}>
                    <p className="text-[0.8rem] font-semibold leading-snug text-brand-ink">
                      {l.need}
                    </p>
                    <p className="mt-0.5 text-[0.72rem] leading-snug text-slate-500">
                      {l.from}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-amber-900">
          <strong className="font-semibold">
            The middle column is the point.
          </strong>{" "}
          Two things on your resume have nothing behind them. In an interview
          those are the questions you will be asked and cannot answer.
        </p>
      </Option>

      {/* ------------------------------------------------------------ 4 */}
      <Option
        n={4}
        title="A readiness meter built from the journey"
        idea="One number, but it is not a match percentage - it is the readiness score you already have, re-weighted against this specific posting, with each contributing module named and clickable."
        cost="People read any number as a probability of getting the job. It is not, and no caption ever fully fixes that."
      >
        <div className="rounded-xl border border-slate-200 bg-surface p-4">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-[2.6rem] font-bold leading-none text-brand-teal-deep">
                72
              </span>
              <span className="text-[1rem] font-bold text-slate-400">/100</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.88rem] font-semibold leading-snug text-brand-ink">
                Ready for the parts that matter, thin on the paperwork.
              </p>
              <p className="mt-0.5 text-[0.78rem] leading-snug text-slate-500">
                This is your readiness for <em>this</em> posting, not your
                chance of an offer. Nobody here can tell you that.
              </p>
            </div>
          </div>

          <dl className="mt-4 grid gap-2 border-t border-slate-200 pt-3">
            {[
              ["Simulation evidence", 88, "Busy shift, Escalation call"],
              ["Interview readiness", 74, "Six answers scored, HR round"],
              ["Resume coverage", 66, "4 of 5 requirements mentioned"],
              ["Passport entries", 58, "2 verified, 1 pending"],
              ["Skills declared", 40, "Self-reported, unproven"],
            ].map(([label, value, note]) => (
              <div key={label as string} className="flex items-center gap-3">
                <dt className="w-40 shrink-0 text-[0.78rem] font-semibold text-brand-ink">
                  {label}
                </dt>
                <dd className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className="block h-full rounded-full bg-brand-teal"
                      style={{ width: `${value as number}%` }}
                    />
                  </span>
                  <span className="w-32 shrink-0 text-[0.72rem] text-slate-400">
                    {note}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[0.78rem] leading-relaxed text-slate-500">
            Skills sits lowest because you told us those rather than showed us.
            Self-reported is never proficiency here.
          </p>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 5 */}
      <Option
        n={5}
        title="A conversation about the job"
        idea="Paste the posting and talk about it. The assistant opens with the single most useful observation, and everything else is asked for - including the parts somebody would rather not hear."
        cost="Slowest to the answer, and the least skimmable. Somebody in a hurry with eleven tabs open will not read a conversation."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
          <ol className="grid gap-2.5 p-3.5">
            {[
              {
                who: "a",
                text: "I have read it. The short version: two of the five things this job is actually about, you have already proved in a simulation. One - CRM accuracy - you have never touched. Where do you want to start?",
              },
              { who: "you", text: "Am I wasting my time applying?" },
              {
                who: "a",
                text: "No, and I would not say so if I thought otherwise. Escalation handling is the part these teams struggle to hire for and you have a scored run behind it. The CRM line is real but it is taught in a week, and every posting says it.",
              },
              { who: "you", text: "What would make the application stronger?" },
              {
                who: "a",
                text: "One thing: your resume says you kept customers informed, and nothing backs it up. Do the Escalation simulation and that sentence becomes something you can describe for two minutes under questioning.",
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
          <div className="border-t border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <div className="flex flex-wrap gap-1.5">
              {[
                "What will they ask me about?",
                "What am I weakest on?",
                "Is the pay right for my level?",
              ].map((q) => (
                <span
                  key={q}
                  className="rounded-full border border-slate-300 bg-surface px-3 py-1 text-[0.72rem] font-semibold text-slate-700"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Option>

      {/* ------------------------------------------------------------ 6 */}
      <Option
        n={6}
        title="The dashboard — closest to the mockup you sent"
        idea="The shape you showed: a ring for the headline number and a radar comparing you against what the job asks, axis by axis, with matched and missing listed underneath. It reads as a report, and a report feels authoritative."
        cost="Two of the three claims in that mockup are ones Ascend cannot make. 'Analyses your profile against millions of jobs' and 'proprietary algorithm' are not true here, and a percentage beside a job is read as odds of getting it. The chart itself is fine - the framing around it is what needs rewriting."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h3 className="font-display text-[1.5rem] font-bold leading-tight text-brand-ink">
              Am I ready for this job?
            </h3>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-600">
              Paste the posting. Ascend compares it against what you have
              actually done here — your simulations, your scored interviews,
              your Passport and your resume — and shows where you stand.
            </p>
            <ul className="mt-3 grid gap-2.5">
              {[
                [
                  "Measured against your record",
                  "Not against other candidates, and not against a database of jobs we do not have.",
                ],
                [
                  "Proof separated from claims",
                  "What you have shown counts differently from what you have written.",
                ],
                [
                  "One thing to do next",
                  "The gap that closes fastest, named — usually a single simulation.",
                ],
              ].map(([head, body]) => (
                <li key={head} className="flex gap-2.5">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700">
                    <Check size={9} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.83rem] font-bold text-brand-ink">
                      {head}
                    </span>
                    <span className="block text-[0.78rem] leading-snug text-slate-500">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <span className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-teal-deep px-6 text-[0.85rem] font-bold text-white sm:w-auto">
              Check my fit
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-surface p-4">
            <p className="text-[0.85rem] font-bold text-brand-ink">
              Customer Success Associate — Bengaluru
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
              <div className="text-center">
                <Donut value={72} />
                <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Readiness
                </p>
              </div>
              <div className="min-w-[13rem] flex-1">
                <p className="text-center text-[0.7rem] font-bold text-slate-500">
                  You against what this job asks
                </p>
                <Radar />
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
            </div>

            <dl className="mt-3 grid gap-1.5 border-t border-slate-200 pt-3 text-[0.8rem]">
              <div className="flex gap-2">
                <dt className="shrink-0 font-bold text-teal-800">Strongest:</dt>
                <dd className="text-slate-600">
                  Escalation handling, working at volume
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-bold text-amber-800">
                  To improve:
                </dt>
                <dd className="text-slate-600">
                  CRM accuracy, verified Passport entries
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[0.72rem] leading-snug text-slate-400">
              Readiness for this posting, from your own record. It is not a
              chance of being hired — nobody can tell you that.
            </p>
          </div>
        </div>
      </Option>

      {/* ---------------------------------------------------------- rec */}
      <section className="mt-10 rounded-2xl border border-brand-teal/40 bg-brand-teal-deep/[0.05] p-5">
        <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-teal-800">
          If you want a recommendation
        </h2>
        <p className="mt-1.5 text-[0.9rem] leading-relaxed text-slate-700">
          <strong className="font-semibold text-brand-ink">
            Option 1 wrapped around Option 3.
          </strong>{" "}
          The verdict answers the question that was asked, and the three lanes
          underneath are what make it defensible — anybody who doubts the
          verdict can see exactly what it was built from. Option 4&apos;s meter
          is the one to avoid first: a number out of a hundred next to a job
          posting will be read as a chance of getting hired, whatever the
          caption says.
        </p>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-700">
          Option 5 is worth keeping as the thing behind{" "}
          <em>&ldquo;why did you say that?&rdquo;</em> rather than as the whole
          feature.
        </p>
      </section>

      <p className="mt-8 flex items-center gap-2 text-[0.8rem] text-slate-400">
        <Check size={13} />
        None of this is wired up. Pick one and it gets built properly.
      </p>
    </main>
  );
}
