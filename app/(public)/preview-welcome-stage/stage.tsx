"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "@/components/icons";

// Four ways to hold two exhibits in one window. Every one of them keeps the
// same left column - eyebrow, headline, sentence, button - because that is
// the part somebody is reading, and reading is what a transition breaks.

type Mechanism = "steps" | "scroller" | "both" | "linked";

const MECHANISMS: Array<{
  id: Mechanism;
  name: string;
  line: string;
  good: string[];
  bad: string[];
  recommended?: boolean;
}> = [
  {
    id: "steps",
    name: "1 · Stage with steps",
    line: "The stage cycles between the two exhibits on a slow clock. Two labels under it pin either one.",
    recommended: true,
    good: [
      "Nothing being read ever moves - only the picture changes",
      "Both exhibits get seen without anybody scrolling",
      "The clock means a passive visitor still sees both",
      "Same control the phone deck already uses, so the page is consistent",
    ],
    bad: [
      "Movement on the page while somebody reads the left column",
      "Somebody who leaves in four seconds sees one exhibit, not two",
    ],
  },
  {
    id: "scroller",
    name: "2 · A scroller inside the window",
    line: "The stage is its own scroll box with two panes that snap. The page itself never scrolls.",
    good: [
      "The reader sets the pace entirely - nothing moves on its own",
      "The gesture is the one they would use anyway",
      "Room for a third exhibit later without redesigning anything",
    ],
    bad: [
      "A scroll box inside a page that does not scroll confuses a mouse wheel",
      "Easy to miss that the second pane exists at all",
      "Awkward on a trackpad next to a page that has its own scroll",
    ],
  },
  {
    id: "both",
    name: "3 · Both at once, halved",
    line: "No transition. The network above, the employer chart below, each at half height.",
    good: [
      "Nothing to discover, nothing to wait for",
      "No motion at all, which is the kindest option to read beside",
    ],
    bad: [
      "The loop has nine steps and is unreadable at half size",
      "Two halves shout at each other - no single thing to look at",
      "The screen stops feeling like one idea",
    ],
  },
  {
    id: "linked",
    name: "4 · The beats are the switch",
    line: "The three lines in the left column double as the control. Press one and the stage shows what it means.",
    good: [
      "The word and the picture are the same act, so nothing is decorative",
      "No extra chrome on the screen at all",
      "Strongest for somebody who is actually reading",
    ],
    bad: [
      "A control that does not look like a control gets missed",
      "Somebody who reads and never presses sees one exhibit",
      "Needs a beat per exhibit, which constrains the copy",
    ],
  },
];

const EXHIBITS = [
  { id: "network", label: "The network" },
  { id: "employer", label: "What an employer gets" },
] as const;

export function Stage() {
  const [mech, setMech] = useState<Mechanism>("steps");
  const chosen = MECHANISMS.find((m) => m.id === mech)!;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Preview · not a shipped screen
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        Two sheets in one window
      </h1>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        The talent fulfillment network and the employer chart both survive the
        cut to one screen. They stop being sheets and become exhibits on a
        stage, and these are four ways to run that stage.
      </p>

      <section className="mt-5 rounded-xl border border-brand-teal/30 bg-brand-teal/[0.06] p-4">
        <h2 className="text-[0.9rem] font-semibold text-brand-ink">
          The rule that protects reading
        </h2>
        <p className="mt-1.5 text-[0.86rem] leading-relaxed text-slate-700">
          Swap a paragraph under somebody&rsquo;s eyes and you have taken away
          the sentence they were half way through. Swap a diagram and they
          simply look at the new diagram - a picture is understood in a glance,
          so it can be replaced without costing anybody their place. So the
          headline, the sentence under it and the button never move in any of
          these. Only the stage changes.
        </p>
      </section>

      {/* ---- pick a mechanism ---- */}
      <div className="mt-7 flex flex-wrap gap-2">
        {MECHANISMS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMech(m.id)}
            className={`min-h-11 cursor-pointer rounded-full border px-4 text-[0.84rem] font-semibold transition-colors ${
              mech === m.id
                ? "border-brand-teal bg-brand-teal/10 text-brand-ink"
                : "border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {m.name}
            {m.recommended && (
              <span className="ml-1.5 text-[0.68rem] font-bold uppercase tracking-wide text-brand-teal-deep dark:text-brand-teal-soft">
                rec
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[0.88rem] leading-relaxed text-slate-600">
        {chosen.line}
      </p>

      <h2 className="mt-5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Laptop · 1280 × 720, the viewport under the header
      </h2>
      <Box w={1280} h={720} fit={1024}>
        {/* Keyed, so switching mechanism starts the mock fresh rather than
            carrying the last one's pinned state into it. */}
        <Screen key={mech} mech={mech} />
      </Box>

      <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <Notes title="Gains" items={chosen.good} tone="good" />
        <Notes title="Costs" items={chosen.bad} tone="bad" />
      </div>

      <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-[0.9rem] font-semibold text-amber-900">
          What has to be cut from the two exhibits either way
        </h2>
        <ul className="mt-2 grid gap-1.5 text-[0.86rem] leading-relaxed text-amber-900">
          <li>
            <strong className="font-semibold">The network loop</strong> is nine
            steps today across a full sheet. In a stage it is five: fit,
            practise, proof, hired, the next one. The other four are the same
            idea said again.
          </li>
          <li>
            <strong className="font-semibold">The employer exhibit</strong> is a
            funnel and a chart, stacked. In a stage the funnel becomes a single
            line of text above the chart, and the chart keeps its full width -
            the curve is the argument, the dots were the illustration of it.
          </li>
          <li>
            Both keep their plain-text version underneath for a screen reader,
            exactly as they have now.
          </li>
        </ul>
      </section>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
          If you want a recommendation
        </h2>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">One.</strong> It is the only option
          where a passive visitor - which is most of them - sees both exhibits
          without doing anything, and it is the control the phone deck now uses,
          so the page teaches the gesture once and reuses it. The cost is real
          movement beside real reading, which is why the clock is slow and why
          pressing a label stops it.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Four</strong> is the better screen
          for somebody genuinely reading, and I would take it if the beats were
          already written to match the exhibits. It can be added to one later
          without undoing anything - the labels simply move into the beats.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Three</strong> is the one to avoid.
          Halving both is how you get two things nobody looks at instead of one
          thing everybody does.
        </p>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- pieces */

function Notes({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad";
}) {
  return (
    <div>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-400">
        {title}
      </p>
      <ul className="mt-1 grid gap-1 text-[0.84rem] leading-snug text-slate-600">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span
              aria-hidden
              className={tone === "good" ? "text-brand-teal" : "text-slate-300"}
            >
              {tone === "good" ? "+" : "−"}
            </span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A true-size viewport, scaled down to fit the page. */
function Box({
  w,
  h,
  fit,
  children,
}: {
  w: number;
  h: number;
  fit: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-slate-300">
      <div
        style={{ width: w, height: h, zoom: Math.min(1, fit / w) }}
        className="lp-dark relative overflow-hidden bg-[var(--lp-bg-a)] text-[var(--lp-ink)]"
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- screen */

const BEATS = [
  {
    head: "Roles that fit you",
    body: "The real day behind each one, and a reason behind every match.",
    exhibit: 0,
  },
  {
    head: "One network, end to end",
    body: "Students build proof. Employers hire on it. The loop closes.",
    exhibit: 0,
  },
  {
    head: "What an employer sees",
    body: "A record that was watched and marked, and someone productive sooner.",
    exhibit: 1,
  },
];

function Screen({ mech }: { mech: Mechanism }) {
  const [shown, setShown] = useState(0);
  const [pinned, setPinned] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // The slow clock, for the stage that runs itself. Pinning stops it, which
  // is the whole point of the labels.
  useEffect(() => {
    if (mech !== "steps" || pinned) return;
    const t = setInterval(() => setShown((i) => (i + 1) % 2), 7000);
    return () => clearInterval(t);
  }, [mech, pinned]);

  return (
    <div className="flex h-full flex-col px-14 py-8">
      {/* the audience switch, unchanged */}
      <div className="flex gap-1.5">
        {["Student", "Employer", "College"].map((t, i) => (
          <span
            key={t}
            className={`rounded-full border px-3 py-1 text-[0.72rem] font-semibold ${
              i === 0
                ? "border-[var(--lp-teal)] bg-[var(--lp-panel)] text-[var(--lp-ink)]"
                : "border-[var(--lp-border)] text-[var(--lp-faint)]"
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-6 grid flex-1 items-center gap-12 grid-cols-[0.92fr_1.08fr]">
        {/* ---- the words. Identical in all four, and they never move. ---- */}
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)]">
            Your career companion
          </p>
          <h2 className="mt-3 font-display text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--lp-body-strong)]">
            Every career start asks
            <span className="mt-1 block bg-gradient-to-r from-[var(--lp-cyan)] via-[var(--lp-teal)] to-[var(--lp-emerald)] bg-clip-text text-transparent">
              What fits me?
            </span>
          </h2>
          <p className="mt-4 max-w-[46ch] text-[0.98rem] leading-relaxed text-[var(--lp-body)]">
            Thousands chase the same opportunity. Ascend clears your path: work
            that fits how you think, a plan to get ready, and proof employers
            trust.
          </p>

          <ul className="mt-6 grid gap-2.5">
            {BEATS.map((b) => {
              const linked = mech === "linked";
              const on = linked && b.exhibit === shown;
              return (
                <li key={b.head}>
                  <button
                    type="button"
                    tabIndex={linked ? 0 : -1}
                    onClick={() => {
                      if (!linked) return;
                      setShown(b.exhibit);
                      setPinned(true);
                    }}
                    className={`flex w-full gap-2.5 rounded-lg text-left transition-colors ${
                      linked ? "cursor-pointer px-2 py-1.5" : ""
                    } ${on ? "bg-[var(--lp-panel)]" : ""}`}
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#34d399]/20 text-[var(--lp-emerald)]">
                      <Check size={11} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.9rem] font-semibold text-[var(--lp-ink)]">
                        {b.head}
                        {linked && (
                          <span className="ml-2 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--lp-teal)]">
                            show me
                          </span>
                        )}
                      </span>
                      <span className="block text-[0.82rem] leading-snug text-[var(--lp-body)]">
                        {b.body}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-7">
            <span className="inline-flex h-12 items-center rounded-full bg-[var(--lp-cta-bg)] px-7 text-[0.92rem] font-bold text-[var(--lp-cta-ink)]">
              Start free
            </span>
            <p className="mt-2 text-[0.78rem] text-[var(--lp-faint)]">
              No card. Two minutes to your first role.
            </p>
          </div>
        </div>

        {/* ---- the stage ---- */}
        <div className="min-w-0">
          {mech === "both" ? (
            <div className="grid gap-3">
              <div className="h-[13rem] overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-4">
                <NetworkExhibit squashed />
              </div>
              <div className="h-[13rem] overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-4">
                <EmployerExhibit squashed />
              </div>
            </div>
          ) : mech === "scroller" ? (
            <div>
              <div
                ref={scroller}
                className="h-[27rem] snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)]"
              >
                <div className="h-[27rem] snap-start p-5">
                  <NetworkExhibit />
                </div>
                <div className="h-[27rem] snap-start p-5">
                  <EmployerExhibit />
                </div>
              </div>
              <p className="mt-2 text-center text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-faint)]">
                scroll inside this panel for the second one
              </p>
            </div>
          ) : (
            <div>
              <div className="relative h-[27rem] overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-5">
                <div
                  key={shown}
                  className="animate-fade-up h-full motion-reduce:animate-none"
                >
                  {shown === 0 ? <NetworkExhibit /> : <EmployerExhibit />}
                </div>
              </div>
              {mech === "steps" && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {EXHIBITS.map((e, i) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        setShown(i);
                        setPinned(true);
                      }}
                      className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[0.72rem] font-semibold transition-colors ${
                        shown === i
                          ? "border-[var(--lp-teal)] bg-[var(--lp-panel)] text-[var(--lp-ink)]"
                          : "border-[var(--lp-border)] text-[var(--lp-faint)] hover:text-[var(--lp-body)]"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                  {pinned && (
                    <button
                      type="button"
                      onClick={() => setPinned(false)}
                      className="cursor-pointer text-[0.7rem] font-semibold text-[var(--lp-faint)] underline underline-offset-2"
                    >
                      let it run
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- exhibits */

const LOOP = [
  "Finds work that fits",
  "Practises it, scored",
  "Earns a verified record",
  "Hired on the evidence",
  "Starts already knowing the job",
];

export function NetworkExhibit({ squashed }: { squashed?: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-faint)]">
        An AI-native talent fulfillment network
      </p>
      {!squashed && (
        <p className="mt-2 text-[0.86rem] leading-relaxed text-[var(--lp-body)]">
          Students build verified, job-ready skills. Employers hire on evidence,
          not resumes. One network closes the gap between hired and productive.
        </p>
      )}
      <ul
        className={`grid ${squashed ? "mt-2 gap-1" : "my-auto gap-2.5"} text-left`}
      >
        {LOOP.map((step) => (
          <li key={step} className="flex items-center gap-3">
            {/* A mark, not a number. Numbering a loop says "five things to
                get through"; the point is that it comes back round. */}
            <span
              aria-hidden
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--lp-teal)]/50 bg-[var(--lp-teal)]/10 text-[0.8rem] font-bold text-[var(--lp-teal)]"
            >
              &rarr;
            </span>
            <span
              className={`flex-1 rounded-lg border border-[var(--lp-border)] bg-white/[0.03] px-3 ${
                squashed ? "py-1 text-[0.74rem]" : "py-2 text-[0.86rem]"
              } text-[var(--lp-body-strong)]`}
            >
              {step}
            </span>
          </li>
        ))}
      </ul>
      {!squashed && (
        <p className="mt-3 text-center text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--lp-teal)]">
          then the next role opens and the loop runs again
        </p>
      )}
    </div>
  );
}

export function EmployerExhibit({ squashed }: { squashed?: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-faint)]">
        The productivity gap - and the saving
      </p>
      {!squashed && (
        <p className="mt-2 text-[0.86rem] leading-relaxed text-[var(--lp-body)]">
          A thousand identical resumes, then months before a new hire earns
          their seat. An Ascend hire starts near-productive.
        </p>
      )}
      <svg
        viewBox="0 0 420 190"
        role="img"
        aria-label="Illustrative chart of productivity against time since offer. A hire today climbs slowly through training; an Ascend hire starts near-productive on day one. The shaded area between the curves is the gap Ascend fills."
        className={`w-full ${squashed ? "mt-1 max-h-[7.5rem]" : "my-auto max-h-[15rem]"}`}
      >
        <line
          x1="24"
          y1="18"
          x2="24"
          y2="164"
          stroke="var(--lp-border)"
          strokeWidth="1"
        />
        <line
          x1="24"
          y1="164"
          x2="404"
          y2="164"
          stroke="var(--lp-border)"
          strokeWidth="1"
        />
        <line
          x1="24"
          y1="70"
          x2="404"
          y2="70"
          stroke="var(--lp-border)"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="24"
          y1="117"
          x2="404"
          y2="117"
          stroke="var(--lp-border)"
          strokeWidth="1"
          opacity="0.5"
        />
        <path
          d="M24,96 C64,54 94,42 134,38 L400,34 L400,40 C370,50 330,76 285,106 C220,150 120,160 24,163 Z"
          fill="#34d399"
          opacity="0.12"
        />
        <path
          d="M24,96 C64,54 94,42 134,38 L400,34"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.5"
        />
        <path
          d="M24,163 C120,160 220,150 285,106 C330,76 370,50 400,40"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <text x="150" y="26" fill="#6ee7b7" fontSize="11" fontWeight="600">
          hired from Ascend
        </text>
        <text
          x="120"
          y="152"
          fill="rgba(255,255,255,0.45)"
          fontSize="11"
          fontWeight="600"
        >
          hired today
        </text>
        <text
          x="30"
          y="180"
          fill="rgba(255,255,255,0.42)"
          fontSize="10"
          fontWeight="600"
        >
          day one
        </text>
        <text
          x="330"
          y="180"
          fill="rgba(255,255,255,0.42)"
          fontSize="10"
          fontWeight="600"
        >
          months in
        </text>
      </svg>
      {!squashed && (
        <div className="flex flex-wrap justify-center gap-2">
          {[
            ["Student A", 84],
            ["Student B", 76],
            ["Student C", 71],
          ].map(([name, score]) => (
            <span
              key={name}
              className="rounded-xl border border-[#34d399]/40 bg-[#34d399]/10 px-3.5 py-1.5 text-center"
            >
              <span className="block text-[0.7rem] font-semibold text-[var(--lp-body)]">
                {name}
              </span>
              <span className="block font-display text-[1.05rem] font-semibold leading-tight text-[var(--lp-emerald)]">
                {score}
              </span>
            </span>
          ))}
        </div>
      )}
      {!squashed && (
        <p className="mt-2 text-center text-[0.72rem] text-[var(--lp-emerald)]/80">
          ranked at the bar you set · illustrative, not measured
        </p>
      )}
    </div>
  );
}
