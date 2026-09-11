"use client";

import { ArrowRight } from "@/components/icons";

// Temporary comparison page: three art directions for the audience switcher.
//
// The reference is flat vector clipart - people with faces, a school building,
// a node diagram. That kind of drawing is commissioned or bought; it is not
// something code produces, and a worse imitation of it would look exactly like
// a worse imitation of it.
//
// What code does better is art that moves and means something: the student
// card shows a path being travelled, the college card shows a cohort
// resolving, the employer card shows evidence being checked. Each one is the
// product's own idea, animated once. That is a thing clipart cannot do.
//
// All motion is CSS and every direction stops under prefers-reduced-motion.
// Self-contained, not linked, deleted once a direction is chosen.

const CSS = `
@keyframes sw-travel { to { stroke-dashoffset: 0; } }
@keyframes sw-dot { to { offset-distance: 100%; } }
@keyframes sw-pulse { 0%,100% { opacity:.35; r:3.2 } 50% { opacity:1; r:4.6 } }
@keyframes sw-rise { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes sw-scan { 0% { transform: translateY(-6px); opacity:0 } 25% { opacity:1 } 100% { transform: translateY(46px); opacity:0 } }
@keyframes sw-fill { to { width: var(--w); } }
@keyframes sw-pop { 0% { transform: scale(.4); opacity:0 } 70% { transform: scale(1.12) } 100% { transform: scale(1); opacity:1 } }
@keyframes sw-orbit { to { transform: rotate(360deg) } }
@keyframes sw-sheen { 0% { transform: translateX(-120%) } 60%,100% { transform: translateX(220%) } }

.sw-path { stroke-dasharray: 160; stroke-dashoffset: 160; animation: sw-travel 2.4s ease-out .2s forwards; }
.sw-dot { offset-path: path("M14 62 C 34 62, 30 34, 52 34 S 74 18, 88 18"); offset-distance: 0%; animation: sw-dot 2.6s ease-in-out .2s infinite; }
.sw-node { animation: sw-pulse 2.4s ease-in-out infinite; }
.sw-rise { animation: sw-rise 5s ease-in-out infinite; }
.sw-scan { animation: sw-scan 2.8s ease-in-out infinite; }
.sw-bar { width: 0; animation: sw-fill 1.4s cubic-bezier(.22,1,.36,1) .3s forwards; }
.sw-pop { animation: sw-pop .5s cubic-bezier(.2,.9,.3,1.4) 1.1s both; }
.sw-orbit { transform-origin: 50px 40px; animation: sw-orbit 16s linear infinite; }
.sw-sheen { animation: sw-sheen 4.5s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .sw-path { stroke-dashoffset: 0; animation: none; }
  .sw-dot, .sw-node, .sw-rise, .sw-scan, .sw-orbit, .sw-sheen { animation: none; }
  .sw-bar { width: var(--w); animation: none; }
  .sw-pop { animation: none; }
}
`;

// ------------------------------------------------------- A · living scene

const SceneStudent = (
  <svg viewBox="0 0 100 76" aria-hidden className="h-full w-full">
    <defs>
      <linearGradient id="a-sky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0e7490" stopOpacity=".35" />
        <stop offset="1" stopColor="#34d399" stopOpacity=".12" />
      </linearGradient>
    </defs>
    <rect width="100" height="76" rx="8" fill="url(#a-sky)" />
    <path
      className="sw-path"
      d="M14 62 C 34 62, 30 34, 52 34 S 74 18, 88 18"
      fill="none"
      stroke="#5eead4"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <circle className="sw-dot" r="3.6" fill="#a7f3d0" />
    <g className="sw-rise">
      <path d="M74 22l7-4 7 4-7 4z" fill="#34d399" />
      <path d="M81 26v8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
    </g>
    <g transform="translate(8,42)">
      <path d="M0 8l8-4 8 4-8 4z" fill="#5eead4" />
      <path d="M3 10v5c0 2 2.2 3.4 5 3.4S13 17 13 15v-5" stroke="#5eead4" strokeWidth="1.8" fill="none" />
    </g>
  </svg>
);

const SceneCollege = (
  <svg viewBox="0 0 100 76" aria-hidden className="h-full w-full">
    <defs>
      <linearGradient id="a-col" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0f766e" stopOpacity=".3" />
        <stop offset="1" stopColor="#22d3ee" stopOpacity=".12" />
      </linearGradient>
    </defs>
    <rect width="100" height="76" rx="8" fill="url(#a-col)" />
    {[
      [16, 20],
      [14, 40],
      [18, 60],
      [34, 30],
      [32, 52],
    ].map(([x, y], i) => (
      <g key={i}>
        <path
          d={`M${x} ${y}H62`}
          stroke="#5eead4"
          strokeOpacity=".3"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />
        <circle
          className="sw-node"
          cx={x}
          cy={y}
          r="3.2"
          fill="#5eead4"
          style={{ animationDelay: `${i * 0.28}s` }}
        />
      </g>
    ))}
    <g className="sw-rise">
      <rect x="62" y="26" width="28" height="28" rx="4" fill="#0b3b36" stroke="#5eead4" strokeWidth="1.6" />
      {[
        [68, 12],
        [74, 18],
        [80, 8],
      ].map(([x, h], i) => (
        <rect key={i} x={x} y={50 - h} width="4" height={h} rx="1.4" fill="#34d399" opacity=".9" />
      ))}
    </g>
  </svg>
);

const SceneEmployer = (
  <svg viewBox="0 0 100 76" aria-hidden className="h-full w-full">
    <defs>
      <linearGradient id="a-emp" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#134e4a" stopOpacity=".4" />
        <stop offset="1" stopColor="#5eead4" stopOpacity=".12" />
      </linearGradient>
    </defs>
    <rect width="100" height="76" rx="8" fill="url(#a-emp)" />
    <rect x="18" y="12" width="64" height="52" rx="6" fill="#07211e" stroke="#5eead4" strokeWidth="1.6" />
    <circle cx="34" cy="28" r="7" fill="none" stroke="#5eead4" strokeWidth="1.8" />
    <path d="M27 42c0-4 3.2-7 7-7s7 3 7 7" stroke="#5eead4" strokeWidth="1.8" fill="none" />
    {[0, 1, 2].map((i) => (
      <rect
        key={i}
        className="sw-bar"
        x="48"
        y={24 + i * 8}
        height="3.4"
        rx="1.7"
        fill="#34d399"
        style={{ ["--w" as string]: `${24 - i * 5}px`, animationDelay: `${0.3 + i * 0.18}s` }}
      />
    ))}
    <rect className="sw-scan" x="20" y="14" width="60" height="2.5" rx="1.2" fill="#a7f3d0" opacity=".5" />
    <g className="sw-pop" style={{ transformOrigin: "68px 52px" }}>
      <circle cx="68" cy="52" r="9" fill="#34d399" />
      <path d="M64 52l3 3 5.5-6" stroke="#06231f" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// ------------------------------------------------- B · abstract gradient

function Abstract({ hue }: { hue: "student" | "college" | "employer" }) {
  const stops = {
    student: ["#22d3ee", "#34d399"],
    college: ["#5eead4", "#0e7490"],
    employer: ["#34d399", "#a7f3d0"],
  }[hue];
  return (
    <svg viewBox="0 0 100 76" aria-hidden className="h-full w-full">
      <defs>
        <radialGradient id={`b-${hue}`} cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor={stops[0]} stopOpacity=".9" />
          <stop offset="1" stopColor={stops[1]} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="76" rx="8" fill="#06201d" />
      <circle cx="50" cy="34" r="30" fill={`url(#b-${hue})`} />
      <g className="sw-orbit" opacity=".8">
        <circle cx="50" cy="12" r="3" fill={stops[0]} />
        <circle cx="78" cy="52" r="2.2" fill={stops[1]} />
      </g>
      <circle cx="50" cy="40" r="15" fill="none" stroke={stops[0]} strokeWidth="1.4" opacity=".55" />
      <circle cx="50" cy="40" r="23" fill="none" stroke={stops[1]} strokeWidth="1" opacity=".3" />
      <g className="sw-rise">
        {hue === "student" && <path d="M42 44l6 6 12-14" stroke="#eafff8" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {hue === "college" && [0, 1, 2].map((i) => <rect key={i} x={42 + i * 7} y={46 - i * 6} width="4.5" height={6 + i * 6} rx="2" fill="#eafff8" />)}
        {hue === "employer" && <path d="M50 30l4 8 9 1-6.5 6 1.6 8.8L50 49.6 41.9 53.8 43.5 45 37 39l9-1z" fill="#eafff8" />}
      </g>
    </svg>
  );
}

// ----------------------------------------------------- C · product-native

const NativeStudent = (
  <div className="relative flex h-full items-center justify-center overflow-hidden rounded-lg bg-[#07211e]">
    <div className="relative grid h-20 w-20 place-items-center rounded-full" style={{ background: "conic-gradient(from -90deg, #34d399 0% 62%, rgba(255,255,255,.08) 62%)" }}>
      <div className="grid h-[3.6rem] w-[3.6rem] place-items-center rounded-full bg-[#07211e]">
        <span className="font-display text-[1.05rem] font-bold text-[#5eead4]">62%</span>
      </div>
    </div>
    <span className="sw-sheen absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const NativeCollege = (
  <div className="relative flex h-full items-end gap-1.5 overflow-hidden rounded-lg bg-[#07211e] px-4 pb-4 pt-3">
    {[38, 62, 30, 78, 54, 88, 46].map((h, i) => (
      <span
        key={i}
        className="sw-bar block flex-1 rounded-t-sm bg-gradient-to-t from-[#0f766e] to-[#34d399]"
        style={{ height: `${h}%`, ["--w" as string]: "100%", animationDelay: `${i * 0.07}s`, width: "100%" }}
      />
    ))}
    <span className="sw-sheen absolute inset-y-0 w-14 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const NativeEmployer = (
  <div className="relative flex h-full flex-col justify-center gap-1.5 overflow-hidden rounded-lg bg-[#07211e] px-4">
    {[
      ["Objection handling", "92"],
      ["Composure", "84"],
      ["Accuracy", "78"],
    ].map(([label, v], i) => (
      <div key={label} className="flex items-center gap-2">
        <span className="w-[5.4rem] shrink-0 truncate text-[0.56rem] text-white/55">{label}</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <span
            className="sw-bar block h-full rounded-full bg-gradient-to-r from-[#0f766e] to-[#34d399]"
            style={{ ["--w" as string]: `${v}%`, animationDelay: `${0.2 + i * 0.15}s` }}
          />
        </span>
        <span className="w-5 shrink-0 text-right text-[0.56rem] font-bold text-[#5eead4]">{v}</span>
      </div>
    ))}
    <span className="sw-sheen absolute inset-y-0 w-14 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

// --------------------------------------------------------------- the card

const COPY = [
  {
    id: "student",
    label: "Students",
    head: "Get ready",
    body: "Find work that suits how you think, get ready for it, and leave with proof an employer can check.",
    cta: "Explore the student path",
  },
  {
    id: "college",
    label: "Colleges",
    head: "See the cohort",
    body: "Readiness across a year group, measured from work students were scored on.",
    cta: "See college insights",
  },
  {
    id: "employer",
    label: "Employers",
    head: "Hire on evidence",
    body: "Candidates arrive with a record of work that was observed and marked.",
    cta: "See employer tools",
  },
] as const;

function Cards({ art }: { art: React.ReactNode[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {COPY.map((c, i) => (
        <div
          key={c.id}
          className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-surface transition-[border-color,transform] hover:-translate-y-1 hover:border-brand-teal motion-reduce:hover:translate-y-0"
        >
          <div className="h-32 p-3">{art[i]}</div>
          <div className="flex flex-1 flex-col p-5 pt-1">
            <p className="text-[0.76rem] font-semibold text-slate-500">{c.label}</p>
            <h3 className="mt-0.5 font-display text-[1.3rem] font-bold leading-tight text-brand-ink">
              {c.head}
            </h3>
            <p className="mt-2 flex-1 text-[0.82rem] leading-relaxed text-slate-500">
              {c.body}
            </p>
            <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl bg-brand-teal-deep px-4 py-2.5 text-[0.79rem] font-bold text-white">
              {c.cta}
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Block({
  n,
  title,
  what,
  cost,
  children,
}: {
  n: string;
  title: string;
  what: string;
  cost: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-[1.1rem] font-bold text-brand-ink">
        {n} · {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[0.87rem] leading-relaxed text-slate-600">{what}</p>
      <p className="mt-2 max-w-2xl border-l-2 border-slate-300 pl-3 text-[0.81rem] leading-relaxed text-slate-500">
        <strong className="font-semibold text-brand-ink">Trade-off:</strong> {cost}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function PreviewSwitcherArt() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-400">
        Preview · not linked · everything below animates
      </p>
      <h1 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        Three art directions for the switcher
      </h1>
      <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
        Your reference is flat vector clipart. Code cannot draw people with
        faces and hands convincingly — that is commissioned or bought artwork.
        What it can do is make the art <em>move</em>, and make it mean
        something: each card below animates the idea it is selling. Watch them
        for a few seconds before judging.
      </p>

      <div className="mt-9 space-y-10">
        <Block
          n="A"
          title="Living scene"
          what="Closest to your reference in spirit — a small illustrated scene per audience, but built to move. A dot travels the student's path, the cohort nodes pulse in sequence, the candidate card is scanned and stamped verified."
          cost="Illustrative without being illustration. It reads as considered, but it will never have the warmth of drawn characters."
        >
          <Cards art={[SceneStudent, SceneCollege, SceneEmployer]} />
        </Block>

        <Block
          n="B"
          title="Abstract gradient"
          what="No literal objects at all: orbiting points, concentric rings and one bold mark per audience over a deep radial glow. The premium, modern end of the range."
          cost="Says nothing concrete about what each audience gets. Looks expensive, explains least — it leans entirely on the words beneath it."
        >
          <Cards
            art={[
              <Abstract key="s" hue="student" />,
              <Abstract key="c" hue="college" />,
              <Abstract key="e" hue="employer" />,
            ]}
          />
        </Block>

        <Block
          n="C"
          title="Product-native"
          what="The art is the product: a readiness ring filling to 62%, a cohort's scores as bars, a candidate's competency rows counting up. Each one is a real screen the audience would actually see."
          cost="Strongest and most honest of the three — but it shows numbers, and numbers on a marketing card must never be mistaken for real data. Treat them as illustration and keep them obviously generic."
        >
          <Cards art={[NativeStudent, NativeCollege, NativeEmployer]} />
        </Block>
      </div>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-brand-mist p-5">
        <h2 className="font-display text-[1.05rem] font-bold text-brand-ink">
          If you want drawn characters like the reference
        </h2>
        <ul className="mt-3 space-y-2.5 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-brand-ink">Buy a set.</strong>{" "}
            Illustration packs sell for tens of dollars and ship as SVG. They
            drop straight into these cards as static assets — no dependency, no
            build change. The risk is that other products use the same pack, so
            the look is rented rather than owned.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Commission three.
            </strong>{" "}
            One illustrator, one brief, three drawings in your palette. This is
            the only route to art nobody else has, and at three images it is a
            small job rather than a programme.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Either way, the motion above still applies.
            </strong>{" "}
            A bought or commissioned SVG can carry the same travelling dot or
            filling bar. The animation is the part I can give you; the drawing
            is the part you buy.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              My pick is C, then A.
            </strong>{" "}
            Product-native art is the only option here that shows a placement
            officer something they cannot get anywhere else. Clipart of a
            school building tells them nothing they did not already know.
          </li>
        </ul>
      </section>
    </main>
  );
}
