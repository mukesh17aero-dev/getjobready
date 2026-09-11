// Temporary comparison page: the signed-in home screen (app/(student)/start/
// start-router.tsx) restyled as the bento dashboard from the Stitch mockup
// "Ascend Hyper-Modern Bento Dashboard".
//
// The same layout is rendered three times so the judgement is about the look,
// not about the content:
//
//   1. Night      - the mockup as closely as this stack can get it.
//   2. Daylight   - identical layout and copy, on the app's ivory palette.
//                   The app has a theme toggle, so a dark-only home is not a
//                   home; this is what the other half of users would see.
//   3. Ascend     - the same bento, with the two things the mockup asks for
//                   that this product cannot say. Documented on the card.
//
// Everything here is self-contained under .bn-* class names in the <style>
// block. Nothing touches app/globals.css or any shipped component, nothing is
// linked from the site, and the numbers are invented demo data - this page is
// deleted once a direction is chosen.

// The film grain already used by Ambience and the landing sheets: an inlined
// feTurbulence rather than an image request. It also kills the banding that
// very low contrast gradients show on cheap 6-bit phone panels.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

const CSS = `
/* ---------------------------------------------------------------- stage */

.bn-stage {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1.25rem;
  padding: 1rem;
  color: var(--bn-fg);
  background: var(--bn-ground);
  container-type: inline-size;
}

@media (min-width: 640px) {
  .bn-stage { padding: 1.5rem; }
}

/* The weather behind the panels. Two soft pools of light plus grain - the
   mockup's nebula, built from gradients so it costs nothing to load and
   scales to any viewport. */
.bn-stage::before {
  content: "";
  position: absolute;
  inset: -20%;
  z-index: 0;
  background: var(--bn-sky);
  pointer-events: none;
}

.bn-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: ${GRAIN};
  opacity: var(--bn-grain);
  pointer-events: none;
}

.bn-stage > * { position: relative; z-index: 1; }

/* ------------------------------------------------------------- palettes */

.bn-night {
  --bn-fg: #eef7f4;
  --bn-muted: rgb(224 246 240 / 0.66);
  --bn-faint: rgb(224 246 240 / 0.42);
  --bn-ground: #05100d;
  --bn-card: rgb(255 255 255 / 0.052);
  --bn-line: rgb(255 255 255 / 0.1);
  --bn-line-lit: rgb(94 234 212 / 0.36);
  --bn-track: rgb(255 255 255 / 0.13);
  --bn-sheen: rgb(255 255 255 / 0.075);
  --bn-grain: 0.09;
  --bn-glow: 0 0 42px -8px rgb(45 212 191 / 0.45);
  --bn-shadow: none;
  --bn-sky:
    radial-gradient(46% 40% at 78% 8%, rgb(16 185 129 / 0.3) 0%, transparent 70%),
    radial-gradient(40% 46% at 92% 52%, rgb(20 184 166 / 0.22) 0%, transparent 72%),
    radial-gradient(52% 44% at 10% 88%, rgb(6 95 70 / 0.34) 0%, transparent 74%);
}

.bn-day {
  --bn-fg: #1c2333;
  --bn-muted: #5a6472;
  --bn-faint: #8a939f;
  --bn-ground: #f4f2ec;
  --bn-card: #fdfcfa;
  --bn-line: rgb(28 35 51 / 0.11);
  --bn-line-lit: rgb(13 148 136 / 0.45);
  --bn-track: rgb(28 35 51 / 0.1);
  --bn-sheen: rgb(255 255 255 / 0.75);
  --bn-grain: 0.035;
  --bn-glow: 0 10px 30px -14px rgb(13 148 136 / 0.5);
  --bn-shadow: 0 1px 2px rgb(28 35 51 / 0.05), 0 8px 24px -18px rgb(28 35 51 / 0.35);
  --bn-sky:
    radial-gradient(46% 40% at 78% 8%, rgb(45 212 191 / 0.22) 0%, transparent 70%),
    radial-gradient(40% 46% at 92% 52%, rgb(13 148 136 / 0.13) 0%, transparent 72%),
    radial-gradient(52% 44% at 10% 88%, rgb(167 243 208 / 0.3) 0%, transparent 74%);
}

/* ---------------------------------------------------------------- chrome */

.bn-wordmark {
  font-weight: 700;
  letter-spacing: 0.24em;
  font-size: 0.72rem;
  color: var(--bn-muted);
}

/* ------------------------------------------------------------------ grid */

.bn-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr);
  margin-top: 0.9rem;
}

@container (min-width: 40rem) {
  .bn-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bn-hello { grid-column: span 2; }
}

/* The bento proper. Sixteen columns is what lets a quarter-width orb sit
   beside two half-width cards and a row of four. */
@container (min-width: 62rem) {
  .bn-grid { grid-template-columns: repeat(16, minmax(0, 1fr)); gap: 0.85rem; }
  .bn-hello { grid-column: 1 / 11; }
  .bn-tile { grid-column: 11 / 17; }
  .bn-orbcell { grid-column: 1 / 5; grid-row: span 2; }
  .bn-big { grid-column: span 6; }
  .bn-small { grid-column: span 3; }
}

/* ----------------------------------------------------------------- cards */

.bn-card {
  position: relative;
  overflow: hidden;
  border-radius: 0.9rem;
  border: 1px solid var(--bn-line);
  background: var(--bn-card);
  box-shadow: var(--bn-shadow);
  backdrop-filter: blur(14px);
  padding: 1rem;
}

/* The hard diagonal highlight across each panel in the mockup - one clean
   edge of light, as if a sheet of glass caught the sky. */
.bn-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    118deg,
    var(--bn-sheen) 0 34%,
    transparent 34.3%
  );
}

/* The sheen is a positioned pseudo-element, so it paints above plain flowed
   text unless the text is lifted too. Without this the diagonal edge cuts
   straight through the greeting and the card titles. */
.bn-card > * { position: relative; z-index: 1; }

/* A door that is open and half-walked: the border picks up teal. Teal is
   only ever "you earned this", so a locked or untouched card never gets it. */
.bn-live { border-color: var(--bn-line-lit); box-shadow: var(--bn-glow); }

/* A door that has not opened yet. Dimmed, and it says why on its face. */
.bn-locked { opacity: 0.58; }

.bn-eyebrow {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--bn-faint);
}

.bn-meta { font-size: 0.68rem; color: var(--bn-muted); }

/* Display type. The mockup sets its headings in a high-contrast serif; this
   uses the system serif stack rather than loading a new webfont, so the
   comparison costs nothing and commits to nothing. */
.bn-serif {
  font-family: ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-weight: 600;
  letter-spacing: -0.005em;
}

.bn-glyph {
  display: grid;
  place-items: center;
  width: 2.9rem;
  height: 2.9rem;
  flex: none;
  border-radius: 0.7rem;
  border: 1px solid var(--bn-line);
  background: var(--bn-sheen);
  font-size: 1.4rem;
  line-height: 1;
}

/* A quarter-width card has room for a title or an icon, not both at full
   size - "OPPORTUNITIES" is a single unbreakable word and runs under the
   glyph otherwise. */
.bn-small .bn-glyph { width: 2.3rem; height: 2.3rem; font-size: 1.05rem; }

/* The mockup's icons are monochrome glass renders. The app's card glyphs are
   colour emoji, and a red target and a blue diamond are the two loudest
   things on the screen next to this palette - so they are drained to match.
   Shipping this properly means drawn icons; the filter is what says so. */
.bn-glyph > span { filter: grayscale(1) brightness(1.45) contrast(0.85); }
.bn-day .bn-glyph > span { filter: grayscale(1) brightness(0.85) contrast(1.05); }
/* …but not the arrow, which is drawn in currentColor already. */
.bn-glyph > svg { filter: none; }

/* ------------------------------------------------------------------ bars */

.bn-bar {
  height: 0.3rem;
  border-radius: 999px;
  background: var(--bn-track);
  overflow: hidden;
}

.bn-bar > i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #0f766e, #34d399 60%, #6ee7b7);
  box-shadow: 0 0 12px -2px rgb(52 211 153 / 0.8);
}

/* ------------------------------------------------------------------- orb */

.bn-orbcell { display: flex; flex-direction: column; align-items: center; justify-content: center; }

.bn-orbwrap {
  position: relative;
  width: min(13rem, 60cqw);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}

/* The ring is the honest part: a conic sweep to the exact percentage,
   masked to an annulus. The glow inside it is decoration. */
.bn-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from -90deg,
    #34d399 0 calc(var(--pct) * 1%),
    var(--bn-track) 0
  );
  mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
}

.bn-orb {
  width: 78%;
  aspect-ratio: 1;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 36% 30%, rgb(255 255 255 / 0.92) 0 2%, rgb(209 250 229 / 0.75) 11%, rgb(52 211 153 / 0.5) 34%, rgb(13 148 136 / 0.55) 62%, rgb(4 47 46 / 0.85) 100%);
  box-shadow:
    0 0 70px -6px rgb(45 212 191 / 0.5),
    inset -12px -20px 44px rgb(2 20 18 / 0.62),
    inset 14px 16px 34px rgb(255 255 255 / 0.2);
  animation: bn-float 7s ease-in-out infinite;
}

/* The turbulence inside the sphere: a blurred conic band, turning slowly. */
.bn-orb::before {
  content: "";
  position: absolute;
  inset: -30%;
  background: conic-gradient(
    from 0deg,
    transparent 0 12%,
    rgb(167 243 208 / 0.55) 22%,
    transparent 36%,
    rgb(94 234 212 / 0.45) 55%,
    transparent 68%,
    rgb(209 250 229 / 0.4) 84%,
    transparent 96%
  );
  filter: blur(14px);
  animation: bn-spin 26s linear infinite;
}

/* The specular hotspot, kept above the turbulence so the sphere reads solid. */
.bn-orb::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 27%, rgb(255 255 255 / 0.55) 0 6%, transparent 34%);
}

.bn-day .bn-orb { box-shadow: 0 0 60px -10px rgb(13 148 136 / 0.45), inset -12px -20px 44px rgb(4 47 46 / 0.45), inset 14px 16px 34px rgb(255 255 255 / 0.35); }

@keyframes bn-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}

@keyframes bn-spin {
  to { transform: rotate(1turn); }
}

@media (prefers-reduced-motion: reduce) {
  .bn-orb, .bn-orb::before { animation: none; }
}

/* ------------------------------------------------------------- stage bar */

.bn-stages { display: flex; gap: 0.3rem; }
.bn-stages > span { height: 0.25rem; flex: 1; border-radius: 999px; background: var(--bn-track); }
.bn-stages > span[data-on="done"] { background: linear-gradient(90deg, #0f766e, #34d399); }
.bn-stages > span[data-on="live"] { background: rgb(52 211 153 / 0.55); }
`;

// ---------------------------------------------------------------- content

// Invented demo data. Nothing here is read from the API - this page is a
// look, not a screen. The shapes match JourneyState.routes and lib/stages so
// the translation to the real component is a copy, not a rewrite.

type Door = {
  key: string;
  /** How the mockup labels a tile: a product noun. */
  label: string;
  /** How the real home page labels it: the person's own sentence. */
  need: string;
  glyph: string;
  meta: string;
  percent: number | null;
  locked?: boolean;
};

const BIG: Door[] = [
  {
    key: "discovery",
    label: "Career Discovery",
    need: "“I don’t know what suits me”",
    glyph: "\u{1F9ED}",
    meta: "3 of 8 answered",
    percent: 38,
  },
  {
    key: "readiness",
    label: "Role Readiness",
    need: "“Am I ready for this role?”",
    glyph: "\u{1F3AF}",
    meta: "Module 2 of 4",
    percent: 50,
  },
];

const SMALL: Door[] = [
  {
    key: "resume",
    label: "Resume Builder",
    need: "“My CV isn’t landing”",
    glyph: "\u{1F4C4}",
    meta: "Last saved today",
    percent: null,
  },
  {
    key: "practice",
    label: "Practice",
    need: "“I need to get better”",
    glyph: "\u{1F4C8}",
    meta: "2 missions waiting",
    percent: null,
  },
  {
    key: "interview",
    label: "Mock Interview",
    need: "“I freeze in interviews”",
    glyph: "\u{1F399}",
    meta: "Opens once you pick a role",
    percent: null,
    locked: true,
  },
  {
    key: "opportunities",
    label: "Opportunities",
    need: "“Who would take me?”",
    glyph: "\u{1F48E}",
    meta: "6 roles match your record",
    percent: null,
  },
];

const STAGES: Array<"done" | "live" | "ahead"> = [
  "done",
  "done",
  "live",
  "ahead",
  "ahead",
];

const JOURNEY_PERCENT = 42;

type Look = {
  id: string;
  cls: string;
  title: string;
  testing: string;
  /** The honest caveat, said on the page rather than in a chat message. */
  note: string;
  serif: boolean;
  /** The mockup's countdown, or the continuation the real router computes. */
  tile: "countdown" | "nextstep";
  /** Product nouns, as the mockup has them, or the person's own sentence. */
  titles: "label" | "need";
  greeting: string;
  sub: string | null;
};

const LOOKS: Look[] = [
  {
    id: "night",
    cls: "bn-night",
    title: "1 · Night",
    testing:
      "The mockup, as close as hand-written Tailwind and CSS gradients get. Glass panels on a teal nebula, serif headings, monospace metadata, the orb.",
    note:
      "The orb, the nebula and the sheen are all CSS — no images, no animation library, nothing new in package.json.",
    serif: true,
    tile: "countdown",
    titles: "label",
    greeting: "Good morning, Alex.",
    sub: null,
  },
  {
    id: "day",
    cls: "bn-day",
    title: "2 · Daylight",
    testing:
      "The identical layout and copy on the app’s ivory ground. Same grid, same orb, same sheen — only the palette changes.",
    note:
      "Ascend has a theme toggle and follows the phone’s setting, so roughly half of arrivals see this one. If it doesn’t hold up, the direction is dark-only and the toggle has to go.",
    serif: true,
    tile: "countdown",
    titles: "label",
    greeting: "Good morning, Alex.",
    sub: null,
  },
  {
    id: "ascend",
    cls: "bn-night",
    title: "3 · Night, in Ascend’s voice",
    testing:
      "The same bento with two changes: the countdown becomes the continuation the home page already computes, and each tile is labelled with the sentence the person came in with rather than a product noun.",
    note:
      "The countdown in the mockup is invented urgency — we have no internship deadline to count down to, and a fake one is the kind of trust metric the MVP doc rules out. “Where you left off” is real, and it is the one primary action the screen is allowed.",
    serif: false,
    tile: "nextstep",
    titles: "need",
    greeting: "Morning, Alex.",
    sub: "You’re three answers into Discovery.",
  },
];

// ------------------------------------------------------------- components

function Arrow() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Card({ door, look, size }: { door: Door; look: Look; size: "big" | "small" }) {
  const title = look.titles === "label" ? door.label : door.need;
  const lit = door.percent !== null && !door.locked;

  return (
    <div
      className={`bn-card ${size === "big" ? "bn-big" : "bn-small"} flex flex-col ${
        door.locked ? "bn-locked" : lit ? "bn-live" : ""
      }`}
    >
      <div className={`flex items-start justify-between ${size === "big" ? "gap-3" : "gap-2"}`}>
        <p
          className={`${look.serif ? "bn-serif" : "font-display font-bold"} min-w-0 ${
            size === "big" ? "text-[1.3rem] leading-[1.15]" : "text-[0.86rem] leading-tight"
          } ${look.titles === "label" ? "uppercase tracking-tight" : ""}`}
        >
          {title}
        </p>
        <span aria-hidden className="bn-glyph">
          <span>{door.glyph}</span>
        </span>
      </div>

      <div className="mt-auto pt-4">
        <p className="bn-meta font-mono">{door.meta}</p>
        {door.percent !== null && (
          <div className="bn-bar mt-2">
            <i style={{ width: `${door.percent}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function BentoHome({ look }: { look: Look }) {
  const display = look.serif ? "bn-serif" : "font-display font-bold";

  return (
    <div className={`bn-stage ${look.cls}`}>
      <p className="bn-wordmark font-mono">ASCEND</p>

      <div className="bn-grid">
        {/* the greeting: the widest thing on the screen, because who this is
            for is the first fact the screen states */}
        <div className="bn-card bn-hello flex min-h-[7rem] flex-col justify-center">
          <p className={`${display} text-[clamp(1.7rem,5cqw,3.1rem)] leading-[1.05]`}>
            {look.greeting}
          </p>
          {look.sub && (
            <p className="bn-meta mt-1.5 text-[0.85rem]">{look.sub}</p>
          )}
        </div>

        {/* the one action, in the mockup's countdown slot */}
        <div className="bn-card bn-tile bn-live flex min-h-[7rem] items-center gap-3">
          <div className="min-w-0 flex-1">
            {look.tile === "countdown" ? (
              <>
                <p className="bn-eyebrow font-mono">Next milestone</p>
                <p className="bn-meta mt-1 font-mono text-[0.72rem]">
                  Internship application opens in
                </p>
                <p className={`${display} mt-1 font-mono text-[1.5rem] leading-none`}>
                  02D 14H 35M
                </p>
              </>
            ) : (
              <>
                <p className="bn-eyebrow font-mono">Where you left off</p>
                <p className={`${display} mt-1.5 text-[1.15rem] leading-tight`}>
                  Discovery, question 4 of 8
                </p>
                <p className="bn-meta mt-1">About 4 minutes left</p>
              </>
            )}
          </div>
          <span aria-hidden className="bn-glyph">
            <Arrow />
          </span>
        </div>

        {/* the orb: a ring at the real percentage, wrapped in decoration */}
        <div className="bn-orbcell bn-card">
          <div className="bn-orbwrap">
            <div
              className="bn-ring"
              style={{ "--pct": JOURNEY_PERCENT } as React.CSSProperties}
            />
            <div className="bn-orb" />
          </div>
          <p className={`${display} mt-4 text-center text-[1.05rem]`}>
            {look.titles === "label" ? "GROWTH ORB" : "Your journey"}
          </p>
          <p className="bn-meta mt-1 font-mono">{JOURNEY_PERCENT}% travelled</p>
          <div className="bn-stages mt-3 w-full">
            {STAGES.map((state, i) => (
              <span key={i} data-on={state} />
            ))}
          </div>
        </div>

        {BIG.map((door) => (
          <Card key={door.key} door={door} look={look} size="big" />
        ))}
        {SMALL.map((door) => (
          <Card key={door.key} door={door} look={look} size="small" />
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- page

export default function PreviewHomeBento() {
  return (
    <main className="min-h-screen bg-surface">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-slate-400">
          Preview · not linked · demo data
        </p>
        <h1 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
          The home screen, as a bento
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
          Today&rsquo;s signed-in home is a greeting banner with a grid of six
          doors under it. The Stitch mockup is the same two things in a
          different arrangement, so this is a re-skin rather than a rebuild:
          the greeting, the journey percentage, the stage strip and the six
          doors all keep their meaning and change their shape.
        </p>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
          Every number below is invented so the layout has something to hold.
          Read the three as a set &mdash; the first is the mockup, the second is
          the same thing in daylight, the third is what I would ship.
        </p>

        <div className="mt-10 space-y-12">
          {LOOKS.map((look) => (
            <section key={look.id}>
              <h2 className="font-display text-[1.15rem] font-bold text-brand-ink">
                {look.title}
              </h2>
              <p className="mt-1.5 max-w-2xl text-[0.87rem] leading-relaxed text-slate-600">
                {look.testing}
              </p>
              <p className="mt-2 max-w-2xl border-l-2 border-brand-teal/40 pl-3 text-[0.82rem] leading-relaxed text-slate-500">
                {look.note}
              </p>
              <div className="mt-4">
                <BentoHome look={look} />
              </div>
            </section>
          ))}
        </div>

        <section className="mt-14 rounded-2xl border border-slate-200 bg-brand-mist p-5">
          <h2 className="font-display text-[1.05rem] font-bold text-brand-ink">
            What carries over, and what doesn&rsquo;t
          </h2>
          <ul className="mt-3 space-y-2.5 text-[0.87rem] leading-relaxed text-slate-600">
            <li>
              <strong className="font-semibold text-brand-ink">
                The bento grid carries over cleanly.
              </strong>{" "}
              Two big doors for what is in progress, four small ones for
              everything else, is a better hierarchy than today&rsquo;s six
              equal cards &mdash; it says which door to walk through without
              having to add a badge that says so.
            </li>
            <li>
              <strong className="font-semibold text-brand-ink">
                The orb has to earn its place.
              </strong>{" "}
              Here the ring around it is a real percentage and the sphere is
              decoration. A glowing ball with no number attached is jewellery,
              and it would be the largest object on the screen.
            </li>
            <li>
              <strong className="font-semibold text-brand-ink">
                The countdown can&rsquo;t ship.
              </strong>{" "}
              There is no real deadline behind it. Look 3 puts the
              continuation the router already computes in that slot, which is
              both true and the more useful thing to press.
            </li>
            <li>
              <strong className="font-semibold text-brand-ink">
                The serif is a real decision.
              </strong>{" "}
              The mockup&rsquo;s headings are a high-contrast serif; the app is
              on Space Grotesk. These three use the system serif so nothing was
              added to the build &mdash; adopting one properly means a webfont
              and a look at the loading cost on 3G.
            </li>
            <li>
              <strong className="font-semibold text-brand-ink">
                The left rail in the mockup is not in the plan.
              </strong>{" "}
              The MVP is a browser app with a top header; a persistent side
              rail is a second navigation pattern to build and maintain, so
              these keep the wordmark where the header already is.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
