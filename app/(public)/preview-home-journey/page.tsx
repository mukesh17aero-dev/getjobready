// Temporary comparison page: the signed-in home (app/(student)/start/
// start-router.tsx) rebuilt to match the Stitch mockup "Ascend Home UX
// Redesign - Dynamic Layout".
//
// Two things change from today's home:
//
//   1. The journey stops being five anonymous bars inside the banner and
//      becomes seven named, numbered steps with the current one marked. The
//      data for this already exists in lib/stages.ts.
//   2. The cards lose the coloured tile and the quoted need, and take the
//      mockup's shape instead: a line icon, the time promoted to a chip, a
//      verb title, one line of what you actually walk away with, one button.
//
// Built out of the app's own tokens rather than a private palette, so it
// works in both themes with no extra CSS - dark reads as the mockup, light
// is the same screen on the ivory ground. Nothing here fetches; the numbers
// are demo data. Not linked from the site; delete once a direction is set.

import type { ReactNode } from "react";

// ------------------------------------------------------------------ icons

// Drawn here rather than added to components/icons.tsx: this page is a look,
// and nothing else in the app needs a mortarboard yet.

type IconProps = { size?: number };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ size = 24, children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...stroke}>
      {children}
    </svg>
  );
}

const Person = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
  </Svg>
);
const Search = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m15.5 15.5 3.5 3.5" />
  </Svg>
);
const Compass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="m15 9-2.2 5.2L7.6 16l2.2-5.2z" />
  </Svg>
);
const Target = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 3.8v3M12 17.2v3M3.8 12h3M17.2 12h3" />
  </Svg>
);
const Monitor = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="12" rx="1.8" />
    <path d="M9 20h6M12 16.5V20" />
  </Svg>
);
const Mic = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="10.5" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </Svg>
);
const Seal = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="m8.6 12.2 2.4 2.4 4.4-4.8" />
  </Svg>
);
const Doc = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5h7.5L18 8v12.5H6z" />
    <path d="M13.5 3.5V8H18M9 12.5h6M9 16h4" />
  </Svg>
);
const Chart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 19.5h16" />
    <path d="m5.5 15 4-4.5 3.5 3 5.5-6.5" />
    <path d="M18.5 7h-3.2M18.5 7v3.2" />
  </Svg>
);
const Gem = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 4.5h12l3 4.5-9 10.5L3 9z" />
    <path d="M3 9h18M9.5 9 12 19.5 14.5 9M9.5 9 6 4.5M14.5 9 18 4.5" />
  </Svg>
);
const Arrow = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />
  </Svg>
);

// ------------------------------------------------------------------- data

// Demo values. The shapes match JourneyState.routes and lib/stages.ts, so
// wiring the real thing in is a swap, not a rewrite.

type StepState = "done" | "live" | "ahead";

const STEPS: Array<{ label: string; icon: (p: IconProps) => ReactNode; state: StepState }> = [
  { label: "Tell Us About You", icon: Person, state: "done" },
  { label: "Find Work", icon: Search, state: "done" },
  { label: "Choose Direction", icon: Compass, state: "done" },
  { label: "Check Standing", icon: Target, state: "live" },
  { label: "Try Work", icon: Monitor, state: "ahead" },
  { label: "Practice Interview", icon: Mic, state: "ahead" },
  { label: "Prove It", icon: Seal, state: "ahead" },
];

type Door = {
  key: string;
  icon: (p: IconProps) => ReactNode;
  time: string;
  title: string;
  /** What you walk away with, in one line. Never a feature description. */
  gives: string;
  cta: string;
};

const LEAD: Door[] = [
  {
    key: "discover",
    icon: Compass,
    time: "15-22 min",
    title: "Discover career options",
    gives: "Three jobs that suit how you work, and what the day is really like.",
    cta: "Discover options",
  },
  {
    key: "readiness",
    icon: Target,
    time: "10-15 min",
    title: "Check role readiness",
    gives: "An honest picture of what you can already do for that job.",
    cta: "Check readiness",
  },
];

const REST: Door[] = [
  {
    key: "resume",
    icon: Doc,
    time: "15-22 min",
    title: "Build my resume",
    gives: "A resume that gets past the filters and reads well.",
    cta: "Build resume",
  },
  {
    key: "interview",
    icon: Mic,
    time: "12-15 min",
    title: "Prepare for interviews",
    gives: "Practice with feedback on what you said.",
    cta: "Prepare now",
  },
  {
    key: "practice",
    icon: Chart,
    time: "≈3 hours, spread",
    title: "Practise the role",
    gives: "Real tasks marked to show an employer.",
    cta: "Practise role",
  },
  {
    key: "package",
    icon: Gem,
    time: "Spread over weeks",
    title: "Whole package",
    gives: "Everything above, in order, to get hired.",
    cta: "Whole package",
  },
];

// ------------------------------------------------------------- components

function Stepper() {
  return (
    // The strip is wider than a phone, so it scrolls inside its own box
    // rather than pushing the page sideways. The negative margin lets it
    // bleed to the screen edge, which is the cue that there is more.
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max items-start sm:min-w-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = step.state === "done";
          const live = step.state === "live";
          return (
            <li
              key={step.label}
              className="contents"
              aria-current={live ? "step" : undefined}
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className={`mt-[1.35rem] h-0.5 w-8 shrink-0 rounded-full sm:w-auto sm:flex-1 ${
                    done || live ? "bg-brand-teal" : "bg-slate-200"
                  }`}
                />
              )}
              <span className="flex w-[6.4rem] shrink-0 flex-col items-center gap-1.5 sm:w-auto sm:min-w-0 sm:flex-1">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-full border transition-colors ${
                    // A finished step is teal but quiet; only the step you are
                    // standing on is filled. Four bright circles in a row and
                    // nothing says which one is now.
                    done
                      ? "border-brand-teal/50 bg-brand-teal/15 text-brand-teal"
                      : live
                        ? "border-brand-teal bg-brand-teal text-white ring-4 ring-brand-teal/20"
                        : "border-slate-300 text-slate-400"
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span
                  className={`text-center text-[0.72rem] leading-tight ${
                    live
                      ? "font-bold text-brand-ink"
                      : done
                        ? "font-medium text-slate-600"
                        : "text-slate-400"
                  }`}
                >
                  {i + 1}. {step.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Card({ door, lead }: { door: Door; lead: boolean }) {
  const Icon = door.icon;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-surface p-5 transition-[border-color,box-shadow] hover:border-brand-teal/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        {/* Neutral, as in the mockup. Teal on this screen means a step you
            have finished; spending it on decoration costs it that meaning. */}
        <span className="text-slate-400">
          <Icon size={lead ? 38 : 30} />
        </span>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[0.7rem] font-medium text-slate-500">
          {door.time}
        </span>
      </div>

      <h3
        className={`mt-4 font-display font-bold leading-tight text-brand-ink ${
          lead ? "text-[1.4rem]" : "text-[1.05rem]"
        }`}
      >
        {door.title}
      </h3>
      <p className="mt-1.5 flex-1 text-[0.85rem] leading-snug text-slate-500">
        {door.gives}
      </p>

      <button
        type="button"
        className="mt-4 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-brand-teal-deep px-3.5 py-2 text-[0.8rem] font-bold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-brand-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal motion-reduce:hover:translate-y-0"
      >
        {door.cta}
        <Arrow size={14} />
      </button>
    </div>
  );
}

// -------------------------------------------------------------------- page

export default function PreviewHomeJourney() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-400">
        Preview &middot; not linked &middot; demo data
      </p>

      {/* ---- who this is, and where they are ---- */}
      <header className="mt-5">
        <h1 className="font-display text-[clamp(1.9rem,5vw,2.6rem)] font-bold leading-[1.1] tracking-tight text-brand-ink">
          Hi Nithin &mdash; welcome back.
        </h1>
        <p className="mt-1 text-[0.95rem] text-slate-500">
          System Development Engineer II
        </p>
      </header>

      <div className="mt-7">
        <Stepper />
      </div>

      {/* ---- the two doors that matter now ---- */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {LEAD.map((door) => (
          <Card key={door.key} door={door} lead />
        ))}
      </div>

      {/* ---- and everything else, smaller ---- */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REST.map((door) => (
          <Card key={door.key} door={door} lead={false} />
        ))}
      </div>

      {/* ---- notes for the founder, not part of the design ---- */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-brand-mist p-5">
        <h2 className="font-display text-[1.05rem] font-bold text-brand-ink">
          What this changes
        </h2>
        <ul className="mt-3 space-y-2.5 text-[0.87rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-brand-ink">
              The journey is named.
            </strong>{" "}
            Today it is five bars inside the banner with labels that only
            appear on a wide screen. Here it is seven numbered steps with the
            current one marked, so &ldquo;where am I&rdquo; is answered without
            reading anything.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Time moved to the top of the card.
            </strong>{" "}
            It is already on every card, sitting in grey at the bottom. It is
            the thing people decide on, so it belongs where the eye lands.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              The cards say what you get, not what it is.
            </strong>{" "}
            &ldquo;Three jobs that suit how you work&rdquo; instead of the
            quoted need and a route name on the button.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Both themes, one build.
            </strong>{" "}
            This uses the app&rsquo;s own tokens rather than a private palette,
            so dark reads as the mockup and light is the same screen on the
            ivory ground. Use the theme toggle in the header to check.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Still to decide: the greeting.
            </strong>{" "}
            The mockup shows the name and a job title. &ldquo;System
            Development Engineer II&rdquo; is what someone <em>is</em>; the
            home page is more use if it says what they are aiming at.
          </li>
        </ul>
      </section>
    </main>
  );
}
