"use client";

import { Check, Circle, Spark } from "@/components/icons";
import { AscendStamp } from "@/components/scenes";
import { DemoRail, Panel, type DemoPanel } from "@/components/demo-rail";

// The other side of the network, shown the way the student side is: panels of
// the actual screens rather than paragraphs about them.
//
// The employer's problem is the mirror of the student's. A student cannot prove
// what they can do; an employer cannot tell from a resume who can do it. Every
// panel here is about the same object solving both — the passport a candidate
// chose to send — and each one says so, because a network that quietly listed
// people would not be worth joining from either side.

const CHIP =
  "rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.1em]";

/**
 * The readiness index, drawn.
 *
 * A bare "84" tells an employer nothing: out of what, made of what, compared to
 * whom. This shows the number, the four parts it is made of, and where the bar
 * for this role sits — so it can be argued with rather than trusted.
 */
function ReadinessIndex({
  score,
  bar,
  size = 96,
  delay = 0,
}: {
  score: number;
  /** The threshold this employer set for the role. */
  bar: number;
  size?: number;
  delay?: number;
}) {
  const r = 38;
  const circumference = 2 * Math.PI * r;
  // Where the employer's bar sits on the same ring, as a tick.
  const barAngle = (bar / 100) * 360 - 90;
  const rad = (barAngle * Math.PI) / 180;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-slate-100" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform="rotate(-90 50 50)"
          className={score >= bar ? "animate-ring stroke-brand-teal" : "animate-ring stroke-amber-400"}
          style={
            {
              "--ring-from": circumference,
              "--ring-to": circumference * (1 - score / 100),
              animationDelay: `${delay}ms`,
            } as React.CSSProperties
          }
        />
        {/* The threshold, marked on the same dial rather than stated beside it. */}
        <line
          x1={50 + (r - 7) * Math.cos(rad)}
          y1={50 + (r - 7) * Math.sin(rad)}
          x2={50 + (r + 7) * Math.cos(rad)}
          y2={50 + (r + 7) * Math.sin(rad)}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-slate-400"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="text-center">
          <span className="block text-[1.3rem] font-bold leading-none tabular-nums text-slate-900">
            {score}
          </span>
          <span className="block text-[0.58rem] font-bold uppercase tracking-[0.1em] text-slate-400">
            index
          </span>
        </span>
      </span>
    </div>
  );
}

// ---- 1. who is ready --------------------------------------------------------

function ShortlistDemo() {
  const candidates = [
    {
      id: "AS-0000-0412",
      where: "Bengaluru",
      score: 84,
      strong: ["Customer care 88", "Following through 82"],
    },
    {
      id: "AS-0000-0388",
      where: "Bengaluru",
      score: 76,
      strong: ["Following through 84", "Working with numbers 74"],
    },
    {
      id: "AS-0000-0451",
      where: "Hyderabad",
      score: 61,
      strong: ["Customer care 71"],
    },
  ];
  const bar = 70;

  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        <div className="flex animate-fade-up items-baseline justify-between gap-3">
          <p className="text-[0.9rem] font-semibold text-slate-900">
            Ready for Operations Coordinator
          </p>
          <span className="text-[0.74rem] text-slate-400">
            Your bar: {bar}
          </span>
        </div>

        <ul className="mt-3 grid flex-1 content-center gap-2.5">
          {candidates.map((candidate, i) => (
            <li
              key={candidate.id}
              className={`flex animate-fade-up items-center gap-3.5 rounded-2xl border p-3 ${
                candidate.score >= bar
                  ? "border-brand-teal/40 bg-teal-50/60"
                  : "border-slate-200 bg-slate-50"
              }`}
              style={{ animationDelay: `${90 + i * 140}ms` }}
            >
              <ReadinessIndex
                score={candidate.score}
                bar={bar}
                size={62}
                delay={150 + i * 140}
              />
              <div className="min-w-0 flex-1">
                {/* An id rather than a name: what someone can do is read before
                    who they are, which is the point of screening on evidence. */}
                <p className="truncate font-mono text-[0.8rem] text-slate-500">
                  {candidate.id} · {candidate.where}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {candidate.strong.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-white px-2 py-0.5 text-[0.72rem] font-medium text-slate-700 ring-1 ring-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <span
                className={`${CHIP} shrink-0 ${
                  candidate.score >= bar
                    ? "bg-brand-teal text-white"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {candidate.score >= bar ? "Exceeds bar" : "Close"}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 flex gap-2 border-t border-slate-100 pt-2.5 text-[0.76rem] leading-snug text-slate-500">
          <span className="mt-0.5 shrink-0 text-brand-teal-deep">
            <Spark size={13} />
          </span>
          <span>
            They appear here because they sent you their record. Nobody is
            listed without doing that.
          </span>
        </p>
      </div>
    </Panel>
  );
}

// ---- 2. the skills, and how good at them ----------------------------------

function SkillsDemo() {
  // What a hiring manager actually reads. Not which parts of Ascend someone
  // used — which skills the role needs, how far along they are on each, and
  // whether that rests on anything.
  const skills = [
    {
      name: "Customer care",
      need: "Core",
      score: 88,
      level: "Strong",
      evidence: "2 tasks marked · assessed",
    },
    {
      name: "Following through",
      need: "Core",
      score: 82,
      level: "Strong",
      evidence: "1 task marked · assessed",
    },
    {
      name: "Working with numbers",
      need: "Important",
      score: 61,
      level: "Working",
      evidence: "assessed only",
    },
    {
      name: "Coordinating people",
      need: "Helpful",
      score: 58,
      level: "Developing",
      evidence: "practice in progress",
    },
  ];

  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        <div className="flex animate-fade-up items-center gap-4">
          <ReadinessIndex score={84} bar={70} size={78} delay={70} />
          <div className="min-w-0">
            <p className="font-mono text-[0.76rem] text-slate-500">
              AS-0000-0412
            </p>
            <p className="text-[1rem] font-semibold text-slate-900">
              Operations Coordinator
            </p>
            <p className="mt-0.5 text-[0.79rem] leading-snug text-slate-600">
              Both core skills strong. One important skill still developing.
            </p>
          </div>
        </div>

        <ul className="mt-4 grid flex-1 content-start gap-2.5">
          {skills.map((skill, i) => (
            <li
              key={skill.name}
              className="animate-fade-up"
              style={{ animationDelay: `${180 + i * 90}ms` }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[0.84rem] text-slate-800">
                  {skill.name}
                  {/* What the role asks of it, so a low score on a helpful
                      skill is not read as a problem. */}
                  <span
                    className={`ml-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] ${
                      skill.need === "Core" ? "text-brand-violet-deep" : "text-slate-400"
                    }`}
                  >
                    {skill.need}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-[0.76rem] font-semibold ${
                    skill.score >= 75 ? "text-brand-teal-deep" : "text-amber-700"
                  }`}
                >
                  {skill.level} · {skill.score}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                <div
                  className={`h-1.5 origin-left animate-grow rounded-full ${
                    skill.score >= 75 ? "bg-brand-teal" : "bg-amber-400"
                  }`}
                  style={{
                    width: `${skill.score}%`,
                    animationDelay: `${220 + i * 90}ms`,
                  }}
                />
              </div>
              <p className="mt-0.5 text-[0.72rem] text-slate-400">
                {skill.evidence}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-2.5 border-t border-slate-100 pt-2.5 text-[0.76rem] leading-snug text-slate-500">
          You set which skills the role needs and how much each one counts.
        </p>
      </div>
    </Panel>
  );
}

// ---- 3. what they were assessed on, and how they showed it ----------------

function EvidenceDemo() {
  // An assessor's summary, not a transcript.
  //
  // A hiring manager reading twenty candidates has no time for the answer
  // somebody typed. What they need in one glance is the situation the skill was
  // tested in, and the observable things the candidate did in it — including
  // what they missed, because a report with no misses is a brochure.
  const shown = [
    { line: "Contacted the customer before they chased", got: true },
    { line: "Committed to a time and held to it", got: true },
    { line: "Logged the case before starting the next task", got: true },
    { line: "Did not flag the cause for the following shift", got: false },
  ];

  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        <div className="flex animate-fade-up items-baseline justify-between gap-3">
          <p className="text-[0.95rem] font-semibold text-slate-900">
            Customer care
          </p>
          <span className={`${CHIP} bg-brand-teal text-white`}>Strong · 88</span>
        </div>

        {/* The situation the skill was measured in. Without it, a score is a
            number attached to a word. */}
        <p
          className="mt-4 animate-fade-up text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400"
          style={{ animationDelay: "90ms" }}
        >
          Assessed on
        </p>
        <div
          className="mt-1.5 animate-fade-up rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
          style={{ animationDelay: "140ms" }}
        >
          <p className="text-[0.85rem] leading-relaxed text-slate-700">
            Handling a customer whose order is late, while two other things
            compete for the same twenty minutes.
          </p>
          <p className="mt-1.5 text-[0.72rem] text-slate-400">
            Task 2 · timed · marked against the role’s bar
          </p>
        </div>

        <p
          className="mt-4 animate-fade-up text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400"
          style={{ animationDelay: "280ms" }}
        >
          How they showed it
        </p>
        <ul className="mt-1.5 grid flex-1 content-start gap-1.5">
          {shown.map((row, i) => (
            <li
              key={row.line}
              className="flex animate-fade-up items-start gap-2 text-[0.83rem] leading-snug"
              style={{ animationDelay: `${340 + i * 90}ms` }}
            >
              <span
                className={`mt-0.5 shrink-0 ${
                  row.got ? "text-brand-teal-deep" : "text-slate-300"
                }`}
              >
                {row.got ? <Check size={14} /> : <Circle size={14} />}
              </span>
              <span className={row.got ? "text-slate-700" : "text-slate-400"}>
                {row.line}
              </span>
            </li>
          ))}
        </ul>

        {/* One good day is luck. The same behaviour twice is a skill. */}
        <p className="mt-3 flex gap-2 rounded-xl bg-teal-50 px-3 py-2.5 text-[0.8rem] leading-snug text-teal-700">
          <span className="mt-0.5 shrink-0 text-brand-teal-deep">
            <Spark size={13} />
          </span>
          <span>
            Same three behaviours in task 4, under a longer queue. Scored
            twice, not once.
          </span>
        </p>

        <p className="mt-2.5 border-t border-slate-100 pt-2.5 text-[0.76rem] leading-snug text-slate-500">
          Marked against the role&apos;s rubric, never self-reported.
        </p>
      </div>
    </Panel>
  );
}

// ---- 4. the artefact itself ------------------------------------------------

function VerifiedPassportDemo() {
  // What actually arrives in an employer's hands. Same skills and levels as the
  // panels before it, but as the issued document — because the argument here is
  // provenance: Ascend marked this, against a published rubric, and stamped it.
  const skills = [
    { name: "Customer care", level: "Strong", score: 88 },
    { name: "Following through", level: "Strong", score: 82 },
    { name: "Working with numbers", level: "Working", score: 61 },
    { name: "Coordinating people", level: "Developing", score: 58 },
  ];

  return (
    <Panel>
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl bg-brand-panel px-5 py-4 text-white">
        <div className="flex animate-fade-up items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-brand-teal-soft">
              Readiness Passport
            </p>
            <p className="mt-1 text-[1.35rem] font-semibold leading-tight tracking-[-0.02em]">
              Operations Coordinator
            </p>
            <p className="font-mono text-[0.7rem] text-white/45">
              AS-0000-0412 · issued 14 Aug 2026
            </p>
          </div>
          <span className={`${CHIP} shrink-0 bg-brand-teal text-white`}>
            Index 84
          </span>
        </div>

        <ul className="mt-4 grid flex-1 content-center gap-2">
          {skills.map((skill, i) => (
            <li
              key={skill.name}
              className="flex animate-fade-up items-center gap-3 border-t border-white/10 pt-2"
              style={{ animationDelay: `${160 + i * 100}ms` }}
            >
              <span className="min-w-0 flex-1 truncate text-[0.84rem] text-white/85">
                {skill.name}
              </span>
              <span
                className={`text-[0.76rem] font-semibold ${
                  skill.score >= 75 ? "text-brand-teal-soft" : "text-amber-300"
                }`}
              >
                {skill.level}
              </span>
              <span className="w-7 shrink-0 text-right font-mono text-[0.78rem] tabular-nums text-white">
                {skill.score}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 border-t border-white/10 pt-2.5 text-[0.74rem] leading-snug text-white/50">
          Issued by Ascend against the published role rubric. Every line opens
          to the work behind it.
        </p>

        <AscendStamp
          className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 animate-stamp text-brand-teal-soft/30"
          style={{ animationDelay: "640ms" }}
        />
      </div>
    </Panel>
  );
}

export const EMPLOYER_PANELS: DemoPanel[] = [
  {
    name: "Who is ready",
    caption: "Illustrative. Candidates appear only when they send you their record.",
    line: "Shortlisted on skills, against a bar you set.",
    Demo: ShortlistDemo,
  },
  {
    name: "Skills and proficiency",
    caption: "Illustrative. You choose which skills the role needs.",
    line: "What the role needs, and how far along they are.",
    Demo: SkillsDemo,
  },
  {
    name: "The verified record",
    caption: "Illustrative. Issued by Ascend, not written by the candidate.",
    line: "What arrives in your hands, and who stands behind it.",
    Demo: VerifiedPassportDemo,
  },
  {
    name: "The evidence",
    caption: "Illustrative. Every score on the record opens like this.",
    line: "What each skill was tested in, and what they did.",
    Demo: EvidenceDemo,
  },
];

export function EmployerDemos() {
  return (
    <DemoRail
      panels={EMPLOYER_PANELS}
      tone="dark"
      label="What Ascend does for employers"
    />
  );
}
