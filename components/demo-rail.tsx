"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Eye } from "@/components/icons";

// One rail, used by both halves of the landing page.
//
// The student side and the employer side are the same argument told to two
// audiences — here is the thing, watch it work — so they get the same object
// rather than two carousels that drift apart. Only the tone changes: the
// student rail sits on the dark hero, the employer rail on the light page
// below it, and the labels and controls follow.

export type DemoPanel = {
  /** Shown above the frame. */
  name: string;
  /** One line under the name. */
  line: string;
  /** Shown under the frame, saying the contents are illustrative. */
  caption: string;
  Demo: () => React.JSX.Element;
};

// A panel finishes building about a second after it lands, so this leaves a few
// seconds of it complete before the rail moves on.
const DWELL_MS = 5000;

// How long the rail must be still before a panel counts as arrived. Smooth
// scrolling crosses the halfway point long before it stops, so replaying the
// build on the raw scroll position restarts panels that are still sliding.
const SETTLE_MS = 140;

/**
 * The widget. One surface, one size, and every demo lives inside it.
 *
 * The frame is the thing you see and the contents fill it, so the object on
 * screen is identical from panel to panel and only what is inside changes.
 */
export function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[30rem] animate-fade-up flex-col overflow-hidden rounded-3xl bg-surface p-5 ring-1 ring-slate-200">
      {children}
    </div>
  );
}

export function DemoRail({
  panels,
  tone,
  label,
}: {
  panels: DemoPanel[];
  /** Which ground the rail is sitting on. */
  tone: "dark" | "light";
  /** Names the carousel for assistive technology. */
  label: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Which slide has actually arrived. This counts the loop copy as its own
  // slide, because that is the element whose animations must run when it is
  // the thing on screen.
  const [settled, setSettled] = useState(0);
  const settledRef = useRef(0);
  const settleTimer = useRef<number | null>(null);
  // Bumped for a slide once it has left the view, which remounts it out of
  // sight so its sequence is ready to play again next time.
  const [generation, setGeneration] = useState<Record<number, number>>({});
  // Bumped by any press, which restarts the clock rather than stopping it.
  const [nudge, setNudge] = useState(0);

  // The rail carries one extra slide: a second copy of the first panel, pinned
  // to the end. A strip has a seam — cross it by scrolling and the whole rail
  // rewinds past the eye, cross it by jumping and there is a visible snap. With
  // the copy there, the last step is an ordinary forward slide onto something
  // identical to panel one, and the reset afterwards moves between two matching
  // frames, so there is nothing to see.
  const loopIndex = panels.length;

  useEffect(
    () => () => {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
    },
    [],
  );

  useEffect(() => {
    // Content that moves by itself is a problem for anyone who reads slowly or
    // is distracted by motion, so it never starts at all for someone whose
    // system asks for reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      const el = track.current;
      // Position is read from the DOM rather than from state, so the timer can
      // never fight a swipe that is already in progress.
      if (!el || document.hidden) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      // Always forwards, including onto the loop copy.
      el.scrollTo({ left: (current + 1) * el.clientWidth, behavior: "smooth" });
    }, DWELL_MS);
    return () => window.clearInterval(id);
  }, [nudge]);

  function onScroll() {
    const el = track.current;
    if (!el) return;
    const raw = Math.max(
      0,
      Math.min(loopIndex, Math.round(el.scrollLeft / el.clientWidth)),
    );
    // The copy at the end is panel one as far as the label and dots know.
    setActive(raw % panels.length);
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (raw === loopIndex) {
        // "instant", not "auto". In the CSSOM spec "auto" means "use the
        // element's own scroll-behavior", and this rail is scroll-smooth — so
        // "auto" would animate the reset back across every panel.
        el.scrollTo({ left: 0, behavior: "instant" });
        return;
      }
      const previous = settledRef.current;
      if (previous === raw) return;
      settledRef.current = raw;
      setSettled(raw);
      setGeneration((g) => ({ ...g, [previous]: (g[previous] ?? 0) + 1 }));
    }, SETTLE_MS);
  }

  function go(delta: number) {
    const el = track.current;
    if (!el) return;
    setNudge((n) => n + 1);
    const next = active + delta;
    if (next < 0) {
      el.scrollTo({
        left: (panels.length - 1) * el.clientWidth,
        behavior: "instant",
      });
      setActive(panels.length - 1);
      return;
    }
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setActive(next % panels.length);
  }

  const dark = tone === "dark";
  const panel = panels[active]!;
  const button = `absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border backdrop-blur transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 sm:grid ${
    dark
      ? "border-white/15 bg-brand-panel/80 text-white/70 hover:border-white/40 hover:text-white focus-visible:outline-white"
      : "border-slate-200 bg-surface/85 text-slate-400 hover:border-brand-violet hover:text-brand-violet-deep focus-visible:outline-brand-violet"
  }`;

  return (
    <div className="relative min-w-0">
      {/* Everything except the arrows shares the rail's inset, so the heading,
          the frame and the caption below it all sit on the same edge. */}
      <div className="mb-3 min-w-0 sm:mx-[3.25rem]">
        <p
          className={`text-[1.02rem] font-semibold ${
            dark ? "text-white" : "text-slate-900"
          }`}
        >
          {panel.name}
        </p>
        <p
          className={`mt-0.5 truncate text-[0.82rem] ${
            dark ? "text-white/50" : "text-slate-500"
          }`}
        >
          {panel.line}
        </p>
      </div>

      <div className="relative sm:mx-[3.25rem]">
        {/* Hidden on a phone, where the rail is swiped and a button on either
            edge would sit on top of the panel it is meant to reveal. */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous"
          className={`${button} -left-[3.25rem]`}
        >
          <span className="rotate-180">
            <ChevronRight size={18} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next"
          className={`${button} -right-[3.25rem]`}
        >
          <ChevronRight size={18} />
        </button>

        <div
          ref={track}
          onScroll={onScroll}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={label}
          className={`flex w-auto min-w-0 snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            dark ? "focus-visible:outline-white/60" : "focus-visible:outline-brand-violet"
          }`}
        >
          {[...panels, panels[0]!].map(({ name, Demo }, i) => (
            <div
              key={i}
              aria-label={name}
              aria-hidden={i === loopIndex}
              className="flex w-full min-w-0 shrink-0 basis-full snap-center items-center px-0.5"
            >
              {/* The stage holds its animations at the first frame until the
                  panel is the one in view; see .demo-stage in globals.css. The
                  key changes only after a panel has left, so the rewind happens
                  off-screen and nothing is ever seen resetting. */}
              <div className="demo-stage w-full" data-live={i === settled}>
                <Demo key={generation[i] ?? 0} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p
        className={`mt-3.5 flex items-center justify-center gap-1.5 text-center text-[0.74rem] sm:mx-[3.25rem] ${
          dark ? "text-white/40" : "text-slate-400"
        }`}
      >
        <Eye size={13} />
        {panel.caption}
      </p>

      <div className="mt-3 flex items-center justify-center gap-2 sm:mx-[3.25rem]">
        {panels.map(({ name }, i) => (
          <button
            key={name}
            type="button"
            onClick={() => go(i - active)}
            aria-label={`Show ${name}`}
            aria-current={i === active}
            className="group cursor-pointer p-1.5"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === active
                  ? `w-6 ${dark ? "bg-white" : "bg-brand-violet"}`
                  : dark
                    ? "w-1.5 bg-white/30 group-hover:bg-white/60"
                    : "w-1.5 bg-slate-300 group-hover:bg-slate-400"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
