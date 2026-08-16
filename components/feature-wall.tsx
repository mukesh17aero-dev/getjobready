"use client";

import { useEffect, useState } from "react";
import { Network3D } from "@/components/network-3d";

// The offers sheet's centrepiece: the 3D network loop above, and beneath it
// the living wall - eight full-height panels, one always open. Left alone
// the wall breathes through all eight on a timer, and the open panel's
// station lights up on the map above, so the highlight walks the loop in
// sync. The pointer takes command instantly; reduced-motion stops the
// autoplay but never the interaction. Feature i pairs with map station i -
// a sequential walk around the loop.

const FEATURES = [
  {
    name: "Career-fit assessment",
    chips: ["interests + skills", "reasons shown"],
    line: "Finds the roles where your interests, potential and skills meet - matched with reasons, not guesswork.",
    peek: "Where what you enjoy meets what you’re good at - that’s where your matches come from.",
    c: "#7dd3fc",
  },
  {
    name: "Role explorer",
    chips: ["compare roles", "real pay bands"],
    line: "Explore and compare real roles - the day, the pay, the ladder - with a clear narrative of why each is recommended for you.",
    peek: "Two roles side by side, every fact and evidence on the table - you decide the path.",
    c: "#7dd3fc",
  },
  {
    name: "Personalized career plan",
    chips: ["your gap, measured", "next steps only"],
    line: "AI sizes your gap and plans next steps from your choices, not a generic course list.",
    peek: "Two gaps stand between you and interview-ready - start with this one.",
    c: "#7dd3fc",
  },
  {
    name: "Hands-on practice",
    chips: ["real work, not courses", "AI-scored"],
    line: "Not courses and slides - you do the role’s actual tasks, and AI coaches you through what real shifts demand.",
    peek: "A delayed order, an unhappy customer: you make the call, AI scores it.",
    c: "#5eead4",
  },
  {
    name: "Interview rehearsal",
    chips: ["AI interviewer", "line-by-line feedback"],
    line: "Practice with an AI interviewer, and get feedback on what you actually said.",
    peek: "“Walk me through a time you fixed a mess” - answered, then improved.",
    c: "#5eead4",
  },
  {
    name: "Evidence-based resume",
    chips: ["employer-ready", "stands out with proof"],
    line: "Built to the standard employers expect - and every line is backed by your record of real work.",
    peek: "“Handles live orders under pressure” - a line about what you can do, backed by work you actually did.",
    c: "#6ee7b7",
  },
  {
    name: "Verified skills record",
    chips: ["verified", "opens to the work"],
    line: "Yours to keep and share; every score opens to the work behind it.",
    peek: "An employer clicks any score and sees the actual work behind it.",
    c: "#6ee7b7",
  },
  {
    name: "Evidence-ranked shortlists",
    chips: ["a bar you set", "ranked by evidence"],
    line: "For employers: AI ranks candidates against a bar they set, ready from day one.",
    peek: "Bar set at 75: three candidates clear it, ranked by the evidence.",
    c: "#6ee7b7",
  },
];

export function FeatureWall() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((i) => (i + 1) % FEATURES.length), 4200);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div className="reveal-view">
      <style>{`@keyframes wall-burn { from { width: 0; } to { width: 100%; } }`}</style>

      {/* the loop above - its stations light in step with the wall */}
      <div className="lp-dark mx-auto hidden w-full max-w-4xl rounded-3xl bg-[#0a121a] px-3 md:block">
        <Network3D active={active} />
      </div>

      {/* the living wall */}
      <div
        className="mx-auto mt-9 hidden h-[17rem] max-w-6xl gap-1.5 md:flex"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {FEATURES.map((f, i) => {
          const open = i === active;
          return (
            <div
              key={f.name}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`relative min-w-0 cursor-default overflow-hidden rounded-2xl border transition-[flex-grow,border-color,filter] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-[#5eead4] motion-reduce:transition-none ${
                open ? "border-[var(--lp-border)]" : "border-[var(--lp-border)] brightness-[0.92]"
              }`}
              style={{
                flexGrow: open ? 4.4 : 1,
                flexBasis: 0,
                background: `linear-gradient(165deg, ${f.c}${open ? "1f" : "12"} 0%, var(--lp-wall-fade) 55%), var(--lp-wall-bg)`,
                boxShadow: open ? `inset 3px 0 0 0 ${f.c}` : "none",
              }}
            >
              {/* spine: what shows while closed */}
              <div
                className={`absolute inset-0 flex flex-col items-center gap-3 py-4 transition-opacity duration-300 ${
                  open ? "opacity-0" : "opacity-90"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: f.c, boxShadow: `0 0 10px ${f.c}` }}
                />
                <span className="whitespace-nowrap font-display text-[0.8rem] font-semibold tracking-wide text-[var(--lp-body-strong)] [writing-mode:vertical-rl]">
                  {f.name}
                </span>
              </div>
              {/* open state */}
              <div
                className={`absolute inset-0 flex flex-col justify-end p-4 transition-opacity duration-300 ${
                  open ? "opacity-100 delay-150" : "pointer-events-none opacity-0"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: f.c, boxShadow: `0 0 10px ${f.c}` }}
                />
                <p className="mt-2 font-display text-[1.1rem] font-bold leading-tight text-[var(--lp-ink)]">
                  {f.name}
                </p>
                <p className="mt-1.5 max-w-[36ch] text-[0.82rem] leading-snug text-[var(--lp-body)]">
                  {f.line}
                </p>
                <p
                  className="mt-1.5 max-w-[36ch] border-l-2 pl-2.5 text-[0.76rem] italic leading-snug text-[var(--lp-teal)]"
                  style={{ borderColor: `${f.c}80` }}
                >
                  {f.peek}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[0.64rem] font-bold tracking-wide"
                    style={{ background: `${f.c}26`, color: "var(--lp-teal)" }}
                  >
                    start here
                  </span>
                  {f.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border px-2.5 py-0.5 text-[0.64rem] font-semibold tracking-wide text-[var(--lp-body)]"
                      style={{ borderColor: `${f.c}4d`, background: `${f.c}14` }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                {/* the burn: autoplay progress along the base */}
                {open && !paused && (
                  <span
                    aria-hidden
                    key={active}
                    className="absolute bottom-0 left-0 h-0.5 motion-reduce:hidden"
                    style={{
                      background: f.c,
                      boxShadow: `0 0 8px ${f.c}`,
                      animation: "wall-burn 4.2s linear",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* phones: the same features, stacked and always open */}
      <ul className="mx-auto mt-5 grid max-w-md gap-2.5 md:hidden">
        {FEATURES.map((f) => (
          <li
            key={f.name}
            className="rounded-xl border border-white/10 p-3.5"
            style={{ background: `linear-gradient(165deg, ${f.c}14 0%, var(--lp-wall-fade) 55%), var(--lp-wall-bg)` }}
          >
            <p className="flex items-center gap-2 font-display text-[0.9rem] font-semibold text-[var(--lp-ink)]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: f.c }} />
              {f.name}
            </p>
            <p className="mt-1 text-[0.78rem] leading-snug text-[var(--lp-body)]">{f.line}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[0.62rem] font-bold tracking-wide"
                style={{ background: `${f.c}26`, color: "var(--lp-teal)" }}
              >
                start here
              </span>
              {f.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold tracking-wide text-[var(--lp-body)]"
                  style={{ borderColor: `${f.c}4d`, background: `${f.c}14` }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
