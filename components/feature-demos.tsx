"use client";

import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Spark,
} from "@/components/icons";
import { DemoRail, Panel, type DemoPanel } from "@/components/demo-rail";
import { PayProgression } from "@/components/pay-progression";
import type { RoleDetail } from "@/lib/api";
import {
  AscendStamp,
  SceneCounter,
  SceneScreen,
  SceneStock,
  SceneStudent,
  SceneTeam,
} from "@/components/scenes";

// The product, shown rather than described.
//
// The hero proves one thing works by letting someone use it. This is the same
// argument extended across everything else: pick a part, watch what it
// produces. A person who has seen the shape of a readiness report or a
// passport understands the product in a way no paragraph achieves.
//
// Every panel is drawn with the same tokens as the real screens, so what you
// see here is what the thing looks like. The content in them is illustrative —
// the panel says so — and deliberately carries no pay figures or invented
// counts, which are the two places a preview slides into a false claim.

const CHIP = "rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.1em]";
const BAR = "h-1.5 rounded-full";

// ---- 1. the path ----------------------------------------------------------

function PathDemo() {
  // Opens on the arc rather than on a feature. Someone landing here is not
  // asking "what tools do you have" — they are asking whether this ends with
  // them employed. The stops below are the product in order; every panel after
  // this one is a close-up of one of them.
  const stops = [
    { label: "Tell us about you", note: "5 min, once", here: true },
    { label: "Find the work that fits", note: "4 min" },
    { label: "Get ready for that role", note: "gaps, then practice" },
    { label: "Prove you can do it", note: "real tasks, scored" },
    { label: "Hired — and ready for it", note: "" },
  ];

  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        {/* Both ends of the journey, side by side, before the steps between. */}
        <div className="flex animate-fade-up items-center gap-3">
          <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
            <SceneStudent className="mx-auto h-11 w-full" />
            <p className="mt-1 text-[0.76rem] font-semibold text-slate-800">
              Final year, no job yet
            </p>
          </div>
          <span className="shrink-0 text-slate-300">
            <ArrowRight size={20} />
          </span>
          <div className="min-w-0 flex-1 rounded-2xl bg-teal-50 px-3 py-2.5 text-center">
            <SceneTeam className="mx-auto h-11 w-full" />
            <p className="mt-1 text-[0.76rem] font-semibold text-teal-700">
              In the job, ready for it
            </p>
          </div>
        </div>

        <ol className="mt-4 grid flex-1 content-center gap-0">
          {stops.map((stop, i) => (
            <li
              key={stop.label}
              className="flex animate-fade-up gap-3"
              style={{ animationDelay: `${180 + i * 90}ms` }}
            >
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                    stop.here
                      ? "border-brand-teal bg-brand-teal"
                      : "border-slate-300 bg-surface"
                  }`}
                />
                {i < stops.length - 1 && (
                  <span className="w-0.5 flex-1 bg-slate-200" />
                )}
              </div>
              <div className={i < stops.length - 1 ? "pb-3" : ""}>
                <p
                  className={`text-[0.88rem] ${
                    stop.here
                      ? "font-semibold text-slate-900"
                      : "font-medium text-slate-600"
                  }`}
                >
                  {stop.label}
                  {stop.here && (
                    <span className="ml-2 rounded-full bg-brand-teal px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white">
                      You are here
                    </span>
                  )}
                </p>
                {stop.note && (
                  <p className="text-[0.76rem] text-slate-400">{stop.note}</p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <p className="border-t border-slate-100 pt-2.5 text-[0.76rem] leading-snug text-slate-400">
          One record the whole way. Nothing here asks you to start again.
        </p>
      </div>
    </Panel>
  );
}

// ---- 2. resume --------------------------------------------------------------

function ResumeDemo() {
  return (
    <Panel>
      {/* A sheet, with the proportions and margins of a real page — the thing
          it produces, not an abstraction of it. */}
      <div className="flex-1 overflow-hidden text-slate-900">
        <header className="animate-fade-up border-b-2 border-slate-900 pb-2.5">
          <h4 className="text-[1.15rem] font-bold tracking-tight">CANDIDATE</h4>
          <p className="mt-0.5 text-[0.66rem] text-slate-600">
            Bengaluru · Sample record · Available in 30 days
          </p>
        </header>

        <section
          className="mt-3 animate-fade-up"
          style={{ animationDelay: "70ms" }}
        >
          <h5 className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-slate-500">
            Summary
          </h5>
          <p className="mt-1 text-[0.68rem] leading-relaxed text-slate-700">
            B.Com final year with eight months on a billing desk. Handles cash
            and customer queries end to end; comfortable owning a shift.
          </p>
        </section>

        <section
          className="mt-3 animate-fade-up"
          style={{ animationDelay: "190ms" }}
        >
          <h5 className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-slate-500">
            Experience
          </h5>
          <div className="mt-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[0.72rem] font-bold">Billing Assistant</p>
              <p className="shrink-0 text-[0.62rem] tabular-nums text-slate-500">
                2025 — 2026
              </p>
            </div>
            <p className="text-[0.65rem] italic text-slate-600">
              Sharma Traders, Bengaluru
            </p>
            <ul className="mt-1 grid gap-0.5 text-[0.67rem] leading-relaxed text-slate-700">
              <li className="flex gap-1.5">
                <span className="text-slate-400">—</span>
                Closed the till daily against a float of ₹20,000 with no
                shortfall in eight months.
              </li>
              <li className="flex gap-1.5">
                <span className="text-slate-400">—</span>
                Handled 40+ counter queries a day, escalating only what needed a
                manager.
              </li>
            </ul>
          </div>
        </section>

        <section
          className="mt-3 animate-fade-up"
          style={{ animationDelay: "290ms" }}
        >
          <h5 className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-slate-500">
            Education
          </h5>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p className="text-[0.7rem] font-semibold">B.Com — Final year</p>
            <p className="shrink-0 text-[0.62rem] tabular-nums text-slate-500">
              2026
            </p>
          </div>
        </section>

        <section
          className="mt-3 animate-fade-up"
          style={{ animationDelay: "390ms" }}
        >
          <h5 className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-slate-500">
            Skills
          </h5>
          <p className="mt-1 text-[0.68rem] text-slate-700">
            Cash handling · Customer care · Billing systems · Tally · Kannada,
            Hindi, English
          </p>
        </section>
      </div>

      <div
        className="mt-3 flex animate-fade-up flex-wrap gap-2"
        style={{ animationDelay: "500ms" }}
      >
        <span className={`${CHIP} bg-teal-50 text-teal-700`}>ATS-safe</span>
        <span className={`${CHIP} bg-violet-50 text-violet-700`}>Word</span>
        <span className={`${CHIP} bg-violet-50 text-violet-700`}>PDF</span>
      </div>
    </Panel>
  );
}

// ---- 3. discovery -----------------------------------------------------------

function DiscoveryDemo() {
  const matches = [
    { title: "Operations Coordinator", score: 94, band: "strong", Scene: SceneTeam },
    {
      title: "Customer Support Executive",
      score: 81,
      band: "adjacent",
      Scene: SceneCounter,
    },
    { title: "Inventory Associate", score: 74, band: "stretch", Scene: SceneStock },
  ];
  return (
    <Panel>
      <div className="flex flex-1 flex-col justify-center gap-2.5">
        {matches.map((match, i) => (
          <div
            key={match.title}
            className="animate-fade-up rounded-2xl border border-slate-200 bg-slate-50 p-4"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <match.Scene className="h-9 w-12 shrink-0" />
              <h4 className="text-[0.98rem] font-semibold text-slate-900">
                {match.title}
              </h4>
              <span
                className={`${CHIP} ml-auto ${
                  match.band === "strong"
                    ? "bg-teal-50 text-teal-700"
                    : match.band === "adjacent"
                      ? "bg-violet-50 text-violet-700"
                      : "bg-amber-50 text-amber-700"
                }`}
              >
                {match.band} · {match.score}%
              </span>
            </div>
            {i === 0 && (
              <div
                className="mt-2.5 animate-fade-up rounded-xl bg-teal-50 px-3 py-2.5"
                style={{ animationDelay: "390ms" }}
              >
                <p className="flex items-center gap-1.5 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-brand-teal-deep">
                  <Spark size={12} />
                  What you bring to this role
                </p>
                {/* Named strengths, each tied to the part of this job that
                    needs it. A reason that only describes the work tells
                    someone nothing about themselves. */}
                <ul className="mt-1.5 grid gap-1">
                  {[
                    {
                      skill: "Customer care",
                      why: "you told people bad news before they had to ask — this desk is judged on exactly that",
                    },
                    {
                      skill: "Following through",
                      why: "you closed what you opened, which is how cases here stop coming back",
                    },
                  ].map((row) => (
                    <li
                      key={row.skill}
                      className="text-[0.8rem] leading-relaxed text-teal-700"
                    >
                      <span className="font-semibold">{row.skill}</span> — {row.why}.
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 border-t border-teal-600/15 pt-1.5 text-[0.76rem] leading-relaxed text-teal-700/70">
                  Not seen yet: coordinating people. It matters here, and one
                  practice task covers it.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---- 4. readiness -----------------------------------------------------------

function ReadinessDemo() {
  const skills = [
    { name: "Customer care", have: 82 },
    { name: "Following through", have: 74 },
    { name: "Working with numbers", have: 48 },
    { name: "Coordinating people", have: 26 },
  ];
  const overall = 68;
  // A ring is drawn as a stroked circle with a dash gap: circumference minus
  // the share to fill. Cheaper and sharper than any chart library.
  const r = 34;
  const circumference = 2 * Math.PI * r;

  return (
    <Panel>
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden>
              <circle
                cx="44"
                cy="44"
                r={r}
                fill="none"
                strokeWidth="9"
                className="stroke-slate-100"
              />
              <circle
                cx="44"
                cy="44"
                r={r}
                fill="none"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                transform="rotate(-90 44 44)"
                className="animate-ring stroke-brand-teal"
                style={
                  {
                    "--ring-from": circumference,
                    "--ring-to": circumference * (1 - overall / 100),
                    animationDelay: "70ms",
                  } as React.CSSProperties
                }
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center">
              <span className="text-[1.35rem] font-bold tabular-nums text-slate-900">
                {overall}
                <span className="text-[0.8rem] text-slate-400">%</span>
              </span>
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              Ready for
            </p>
            <p className="text-[1.05rem] font-semibold text-slate-900">
              Operations Coordinator
            </p>
            <p className="mt-1 text-[0.83rem] leading-snug text-slate-600">
              Two gaps worth closing before you apply.
            </p>
          </div>
        </div>

        <ul className="mt-5 grid gap-3.5 border-t border-slate-100 pt-4">
          {skills.map((skill, i) => (
            <li
              key={skill.name}
              className="animate-fade-up"
              style={{ animationDelay: `${260 + i * 60}ms` }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[0.85rem] text-slate-800">{skill.name}</span>
                <span
                  className={`text-[0.72rem] font-bold ${
                    skill.have >= 60 ? "text-brand-teal-deep" : "text-amber-700"
                  }`}
                >
                  {skill.have >= 60 ? "Strong" : "Worth building"}
                </span>
              </div>
              <div className={`mt-1.5 ${BAR} bg-slate-100`}>
                <div
                  className={`${BAR} origin-left animate-grow ${
                    skill.have >= 60 ? "bg-brand-teal" : "bg-amber-400"
                  }`}
                  style={{
                    width: `${skill.have}%`,
                    animationDelay: `${300 + i * 60}ms`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

// ---- 5. missions ------------------------------------------------------------

function MissionsDemo() {
  // Not a question with four answers — the desk itself.
  //
  // A mission is twenty minutes inside the job: three things land at once, you
  // decide what happens first, you write the thing a real person will read, and
  // the shift responds. So the panel shows a console rather than a quiz. What
  // sells "productive on day one" is recognising the screen, not answering
  // correctly.
  const queue = [
    {
      what: "Truck 3 delayed — 40 min",
      when: "just now",
      state: "handling" as const,
    },
    { what: "Priya called again about #4471", when: "2 min", state: "waiting" as const },
    { what: "Stock count mismatch, aisle 4", when: "12 min", state: "queued" as const },
  ];
  const impact = [
    { label: "Customer kept informed", value: 88, good: true },
    { label: "Truck rerouted in time", value: 61, good: true },
    { label: "Stock check still open", value: 24, good: false },
  ];

  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        {/* The shift is running. A mission has a clock because the job does. */}
        <div className="flex animate-fade-up items-center justify-between gap-3">
          <span className={`${CHIP} bg-violet-50 text-violet-700`}>
            Live shift · task 2 of 5
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[0.78rem] tabular-nums text-slate-500">
            <Clock size={14} />
            04:12
          </span>
        </div>

        <p
          className="mt-3 animate-fade-up text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400"
          style={{ animationDelay: "80ms" }}
        >
          Landing on your desk
        </p>
        <ul className="mt-1.5 grid gap-1.5">
          {queue.map((item, i) => (
            <li
              key={item.what}
              className={`flex animate-fade-up items-center gap-2.5 rounded-xl border px-3 py-1.5 ${
                item.state === "handling"
                  ? "border-brand-violet bg-violet-50"
                  : "border-slate-200 bg-slate-50"
              }`}
              style={{ animationDelay: `${130 + i * 80}ms` }}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  i === 0 ? "bg-rose-600" : i === 1 ? "bg-amber-400" : "bg-slate-300"
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-[0.82rem] text-slate-800">
                {item.what}
              </span>
              <span className="shrink-0 font-mono text-[0.68rem] tabular-nums text-slate-400">
                {item.when}
              </span>
            </li>
          ))}
        </ul>

        {/* The part that is actually the work: what you send, in your words. */}
        <p
          className="mt-3 animate-fade-up text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400"
          style={{ animationDelay: "400ms" }}
        >
          What you sent Priya
        </p>
        <div
          className="mt-1.5 animate-fade-up rounded-xl border border-slate-200 bg-surface px-3 py-2.5"
          style={{ animationDelay: "300ms" }}
        >
          <p className="text-[0.82rem] leading-relaxed text-slate-700">
            Hi Priya — your order is on truck 3, held up about 40 minutes.
            You&apos;ll have it by 5:20. I&apos;ll call if that moves.
            <span
              aria-hidden
              className="ml-0.5 inline-block h-[0.95em] w-[2px] translate-y-[0.15em] animate-blink bg-brand-violet"
            />
          </p>
        </div>

        {/* What the shift did about it. Scored on outcomes, not on choices. */}
        <p
          className="mt-3 animate-fade-up text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400"
          style={{ animationDelay: "620ms" }}
        >
          How the shift ended
        </p>
        <ul className="mt-1.5 grid flex-1 content-start gap-1.5">
          {impact.map((row, i) => (
            <li
              key={row.label}
              className="animate-fade-up"
              style={{ animationDelay: `${660 + i * 70}ms` }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[0.78rem] text-slate-700">{row.label}</span>
                <span
                  className={`font-mono text-[0.7rem] tabular-nums ${
                    row.good ? "text-brand-teal-deep" : "text-amber-700"
                  }`}
                >
                  {row.value}
                </span>
              </div>
              <div className={`mt-0.5 ${BAR} bg-slate-100`}>
                <div
                  className={`${BAR} origin-left animate-grow ${
                    row.good ? "bg-brand-teal" : "bg-amber-400"
                  }`}
                  style={{
                    width: `${row.value}%`,
                    animationDelay: `${700 + i * 70}ms`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

// ---- 6. interview -----------------------------------------------------------

function InterviewDemo() {
  // The exchange plays itself on arrival: question, answer, then the read on
  // it. Pure animation-delay rather than timers, so anyone who has asked for
  // reduced motion simply sees the finished conversation.
  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-violet text-white">
            <Spark size={16} />
          </span>
          <span>
            <span className="block text-[0.85rem] font-semibold text-slate-900">
              Ascend Interview Coach
            </span>
            <span className="flex items-center gap-1.5 text-[0.72rem] text-brand-teal-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
              Practising · Operations Coordinator
            </span>
          </span>
        </div>

        <div className="mt-4 flex flex-1 flex-col justify-center gap-3">
          <div className="animate-fade-up max-w-[85%] rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3">
            <p className="text-[0.88rem] leading-relaxed text-slate-800">
              Tell me about a time you had to give someone news they did not
              want to hear.
            </p>
          </div>

          <div
            className="animate-fade-up ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-brand-violet px-4 py-3 text-white"
            style={{ animationDelay: "290ms" }}
          >
            <p className="text-[0.88rem] leading-relaxed">
              A delivery was two days late. I called the customer before she
              called us, told her exactly where it was, and gave her a date I
              knew we could hold.
            </p>
            {/* Voice practice is a real mode, so the answer carries the shape
                of speech rather than of a text box. */}
            <span aria-hidden className="mt-2 flex items-end gap-[3px]">
              {[7, 12, 5, 16, 9, 14, 6, 11, 4, 13, 8, 5].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-white/45"
                  style={{ height: `${h}px` }}
                />
              ))}
              <span className="ml-2 text-[0.68rem] text-white/60">0:21</span>
            </span>
          </div>

          <div
            className="animate-fade-up rounded-2xl bg-teal-50 px-4 py-3"
            style={{ animationDelay: "560ms" }}
          >
            <p className="flex items-center gap-1.5 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-brand-teal-deep">
              <Spark size={12} />
              Coach
            </p>
            <p className="mt-1.5 text-[0.83rem] leading-relaxed text-teal-700">
              You did the hard part most people skip — you called before she
              did, and you gave a date instead of an apology.
            </p>
            {/* The single most useful thing a coach can hand back: the words
                to say next time, not an adjective about the answer. */}
            <p className="mt-2 border-l-2 border-brand-teal/50 pl-2.5 text-[0.81rem] leading-relaxed text-teal-700/80">
              Add the ending: &ldquo;She had it by five, and I moved the next
              two deliveries so it didn&apos;t happen again.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ---- 7. passport ------------------------------------------------------------

function PassportDemo() {
  // Laid out as a passport data page, down to the machine-readable strip.
  // The holder is "Candidate" rather than a name. Any name picks a gender, a
  // region and often a community, and a demo should not quietly decide who this
  // product is for. "Candidate" also covers both people Ascend serves, where
  // "Student" would leave out the half who are already working.
  const fields: Array<[string, string]> = [
    ["Type", "ASC"],
    ["Country code", "IND"],
    ["Passport no.", "AS-0000-0001"],
    ["Surname", "CANDIDATE"],
    ["Given name", "—"],
    ["Ready for", "OPERATIONS COORDINATOR"],
    ["Date of issue", "14 AUG 2026"],
    ["Authority", "ASCEND READINESS"],
  ];
  return (
    <Panel>
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-brand-panel text-white ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.22em] text-brand-teal-soft">
            Readiness Passport
          </p>
          <span className={`${CHIP} bg-white/10 text-white/75`}>You control this</span>
        </div>

        <div className="flex animate-fade-up gap-5 px-5 py-5">
          {/* Photo box, with the ghost portrait a real data page repeats. */}
          <div className="relative shrink-0">
            <div className="relative h-[5.5rem] w-[4.25rem] overflow-hidden rounded-sm bg-white/8 ring-1 ring-white/15">
              <svg
                aria-hidden
                viewBox="0 0 68 88"
                className="absolute inset-0 h-full w-full text-white/25"
                fill="currentColor"
              >
                <circle cx="34" cy="32" r="15" />
                <path d="M4 88c0-17 13-28 30-28s30 11 30 28Z" />
              </svg>
            </div>
            {/* Pressed over the corner of the photo, the way an issuing stamp
                lands on a real page — squarely inside its own box it would
                look printed rather than stamped. */}
            <AscendStamp
              className="absolute -bottom-3 -right-7 h-[4.4rem] w-[4.4rem] animate-stamp text-brand-teal-soft/85"
              style={{ animationDelay: "660ms" }}
            />
          </div>

          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2">
            {fields.map(([label, value], i) => (
              <div
                key={label}
                className="animate-fade-up min-w-0"
                style={{ animationDelay: `${90 + i * 30}ms` }}
              >
                <dt className="font-mono text-[0.52rem] uppercase tracking-[0.14em] text-white/40">
                  {label}
                </dt>
                <dd className="truncate font-mono text-[0.72rem] tracking-wide text-white">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* What the passport actually attests to. */}
        <ul className="grid flex-1 content-center gap-1.5 border-t border-white/10 px-5 py-4">
          {[
            "Discovery completed · role chosen",
            "Readiness check · Operations Coordinator",
            "2 practice tasks submitted and scored",
          ].map((line, i) => (
            <li
              key={line}
              className="flex animate-fade-up items-center gap-2.5 text-[0.82rem] text-white/75"
              style={{ animationDelay: `${350 + i * 60}ms` }}
            >
              <span className="shrink-0 text-brand-teal-soft">
                <Check size={15} />
              </span>
              {line}
            </li>
          ))}
        </ul>

        {/* The machine-readable strip. Nothing reads it — it is what makes the
            thing recognisable as a passport at a glance. */}
        <div
          className="animate-fade-in overflow-hidden border-t border-white/10 bg-white/5 px-5 py-2.5"
          style={{ animationDelay: "560ms" }}
        >
          <p className="whitespace-nowrap font-mono text-[0.6rem] leading-relaxed tracking-[0.18em] text-white/45">
            P&lt;INDCANDIDATE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
            <br />
            AS00000012IND2608148M3008142&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06
          </p>
        </div>
      </div>
    </Panel>
  );
}

// ---- 8. opportunities -------------------------------------------------------

function OpportunitiesDemo() {
  // An opening is only interesting once you know why it reached you and what
  // stands between you and it. Two title rows said neither, and left most of
  // the frame empty. Each one now carries the match reason, the honest gap and
  // the action — which is the whole argument for matching on readiness rather
  // than on keywords.
  const openings = [
    {
      role: "Operations Coordinator",
      where: "Bengaluru · On-site · Immediate",
      matched: "customer care, following through",
      state: "ready" as const,
      note: "Your passport already covers what they screen for.",
      action: "Send my passport",
      Scene: SceneTeam,
    },
    {
      role: "Dispatch Executive",
      where: "Hyderabad · On-site · From 1 Sept",
      matched: "following through, working with numbers",
      state: "gap" as const,
      note: "Leans on coordinating people. One practice task closes it.",
      action: "See what closes it",
      Scene: SceneScreen,
    },
  ];

  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        <div className="flex animate-fade-up items-baseline justify-between gap-3">
          <p className="text-[0.86rem] font-semibold text-slate-900">
            2 openings match your passport
          </p>
          <span className="text-[0.72rem] text-slate-400">Ready first</span>
        </div>

        <ul className="mt-3 grid flex-1 content-start gap-2.5">
          {openings.map((opening, i) => (
            <li
              key={opening.role}
              className={`animate-fade-up rounded-2xl border p-3.5 ${
                opening.state === "ready"
                  ? "border-brand-teal/40 bg-teal-50/60"
                  : "border-slate-200 bg-slate-50"
              }`}
              style={{ animationDelay: `${90 + i * 140}ms` }}
            >
              <div className="flex items-center gap-3">
                <opening.Scene className="h-9 w-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.95rem] font-semibold text-slate-900">
                    {opening.role}
                  </p>
                  <p className="truncate text-[0.78rem] text-slate-500">
                    {opening.where}
                  </p>
                </div>
                <span
                  className={`${CHIP} shrink-0 ${
                    opening.state === "ready"
                      ? "bg-brand-teal text-white"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {opening.state === "ready" ? "Ready" : "One gap"}
                </span>
              </div>

              {/* Why this reached you at all — the thing a job board cannot
                  tell you, because it matched your words and not your work. */}
              <p className="mt-2.5 flex gap-2 text-[0.78rem] leading-relaxed text-slate-600">
                <span className="mt-0.5 shrink-0 text-brand-teal-deep">
                  <Spark size={13} />
                </span>
                <span>
                  Matched on{" "}
                  <span className="font-medium text-slate-800">
                    {opening.matched}
                  </span>
                  . {opening.note}
                </span>
              </p>

              <p
                className={`mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.78rem] font-bold ${
                  opening.state === "ready"
                    ? "bg-brand-violet text-white"
                    : "border border-slate-300 text-slate-700"
                }`}
              >
                {opening.action}
                <ChevronRight size={14} />
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-3 border-t border-slate-100 pt-2.5 text-[0.74rem] leading-snug text-slate-400">
          Employers see the passport you send them — never your answers, and
          never before you send it.
        </p>
      </div>
    </Panel>
  );
}

// ---- the showcase -----------------------------------------------------------


// ---- career progression, sneak peek and voices ---------------------------
//
// These three are deliberately NOT stylised for the landing: they are the
// discover page's own sections, with the real Customer Operations data, so
// what the slide shows is what the product shows.

const CS_GROWTH: RoleDetail["growth"] = [
  {
    title: "Customer Success Associate",
    when: "now",
    pay: { min: 20000, max: 30000 },
  },
  {
    title: "Escalation Specialist",
    when: "in 1–3 years",
    pay: { min: 30000, max: 45000 },
  },
  { title: "Team lead level", when: "in 3–6 years", pay: { min: 45000, max: 80000 } },
];

function LadderDemo() {
  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        <div className="flex animate-fade-up items-baseline justify-between gap-3">
          <p className="text-[0.9rem] font-semibold text-slate-900">
            Career and pay progression
          </p>
          <span className="text-[0.74rem] text-slate-400">
            Customer Success Associate
          </span>
        </div>
        <div
          className="mt-3 flex flex-1 animate-fade-up flex-col justify-center"
          style={{ animationDelay: "140ms" }}
        >
          <PayProgression growth={CS_GROWTH} />
        </div>
      </div>
    </Panel>
  );
}

function DayPeekDemo() {
  const conditions: Array<[string, string]> = [
    ["Environment", "Office or hybrid, desk-based, headset and ticket system"],
    ["Hours", "Usually 9–6; rotational shifts on international accounts"],
    ["Pace", "Steady with sharp spikes when something breaks"],
    ["Team", "Pod of 5–10 associates under a team lead"],
  ];
  const truths = [
    "You absorb other people’s frustration daily and stay polite anyway",
    "You are measured on numbers you only partly control, like satisfaction scores",
  ];
  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        <div className="flex animate-fade-up items-baseline justify-between gap-3">
          <p className="text-[0.9rem] font-semibold text-slate-900">
            Working conditions
          </p>
          <span className="text-[0.74rem] text-slate-400">
            Customer Success Associate
          </span>
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-[0.82rem] sm:grid-cols-2">
          {conditions.map(([label, value], i) => (
            <div
              key={label}
              className="animate-fade-up"
              style={{ animationDelay: `${100 + i * 90}ms` }}
            >
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                {label}
              </dt>
              <dd className="mt-0.5 text-slate-600">{value}</dd>
            </div>
          ))}
        </dl>
        <div
          className="mt-auto animate-fade-up pt-3"
          style={{ animationDelay: "500ms" }}
        >
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
            The hard parts, honestly
          </p>
          <ul className="mt-1.5 grid gap-1.5 rounded-xl bg-amber-50/70 p-3.5 text-[0.82rem] text-amber-900">
            {truths.map((truth) => (
              <li key={truth} className="flex gap-2">
                <span aria-hidden>·</span>
                {truth}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function VoicesDemo() {
  const voices = [
    {
      name: "Arjun",
      quote:
        "Nobody asked about my college. They watched how I handled an angry client on a Friday evening. That call is still the reason I got promoted.",
      title: "Escalation Specialist, e-commerce support, Chennai",
      journey: "Two years in, now handles the escalated accounts",
    },
    {
      name: "Priya",
      quote:
        "My first month I apologised for everything. Now I tell customers exactly what I can and cannot do, and give them a date I will actually hit.",
      title: "Customer Success Associate, SaaS company, Bengaluru",
      journey: "Joined at 22 from a B.Com; handles escalations in her second year",
    },
  ];
  return (
    <Panel>
      <div className="flex flex-1 flex-col">
        <p className="animate-fade-up text-[0.9rem] font-semibold text-slate-900">
          People doing this job
        </p>
        <p
          className="mt-2 animate-fade-up rounded-lg bg-slate-100 px-3 py-2 text-[0.7rem] leading-snug text-slate-600"
          style={{ animationDelay: "80ms" }}
        >
          <strong className="font-semibold">Illustrative:</strong> composite
          stories written from the pay and progression data — real, named
          quotes replace them as pilot employers supply them.
        </p>
        <ul className="mt-2.5 grid flex-1 content-center gap-2.5">
          {voices.map((voice, i) => (
            <li
              key={voice.name}
              className="animate-fade-up rounded-xl bg-slate-50 p-3"
              style={{ animationDelay: `${180 + i * 160}ms` }}
            >
              <p className="text-[0.8rem] italic leading-relaxed text-slate-700">
                &ldquo;{voice.quote}&rdquo;
              </p>
              <p className="mt-1 text-[0.72rem] font-semibold text-slate-700">
                {voice.name} &middot;{" "}
                <span className="font-normal text-slate-500">
                  {voice.title}
                </span>
              </p>
              <p className="text-[0.68rem] text-slate-400">{voice.journey}</p>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export const STUDENT_PANELS: DemoPanel[] = [
  {
    name: "From student to hired",
    caption: "Illustrative. Your own path starts from what you tell us.",
    line: "Where you are now, and how you get from here.",
    Demo: PathDemo,
  },
  {
    name: "Resume Studio",
    caption: "Illustrative. Yours is generated from your own record.",
    line: "A marketable, ATS-safe resume from that same record.",
    Demo: ResumeDemo,
  },
  {
    name: "Find what fits",
    caption: "Illustrative result. Yours comes from your own answers.",
    line: "Three roles that fit how you work — and why.",
    Demo: DiscoveryDemo,
  },
  {
    name: "Where it leads",
    caption: "The discover page's own chart, with the catalogue's real bands.",
    line: "One choice opens a ladder, with pay at every step.",
    Demo: LadderDemo,
  },
  {
    name: "Inside a role",
    caption: "Every role opens like this before you choose it.",
    line: "The working conditions and the hard parts, honestly.",
    Demo: DayPeekDemo,
  },
  {
    name: "People doing this job",
    caption: "Illustrative composites — replaced by real quotes as pilots supply them.",
    line: "What the job sounds like from the inside.",
    Demo: VoicesDemo,
  },
  {
    name: "Readiness check",
    caption: "Illustrative. Measured against the role you choose.",
    line: "Where you stand for the role you picked.",
    Demo: ReadinessDemo,
  },
  {
    name: "Practice the job",
    caption: "Illustrative brief. Practice is written from real work.",
    line: "Do the actual work. Get scored on it.",
    Demo: MissionsDemo,
  },
  {
    name: "Interview practice",
    caption: "Illustrative exchange. Your feedback is about what you actually said.",
    line: "Practise out loud, with feedback that is specific.",
    Demo: InterviewDemo,
  },
  {
    name: "Your proof",
    caption: "Illustrative. Nothing reaches an employer until you send it.",
    line: "Proof of what you can do, shared on your say-so.",
    Demo: PassportDemo,
  },
  {
    name: "Opportunities",
    caption: "Illustrative. Matched on what you are ready for, not keywords.",
    line: "Openings matched to what you are ready for.",
    Demo: OpportunitiesDemo,
  },
];


export function FeatureDemos() {
  return (
    <DemoRail panels={STUDENT_PANELS} tone="dark" label="What Ascend does for you" />
  );
}
