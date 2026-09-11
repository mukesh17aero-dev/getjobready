"use client";

// A preview, not a shipped screen: Discovery as a street you walk down.
//
// The reference is Google's 3D street view - you do not answer a form, you
// move, and the world answers. Buildings stand on both sides in real
// perspective, near ones slide past the edges as you go, far ones grow out of
// the haze, and any door you like will open.
//
// Built with CSS perspective and transforms only. No three.js, no animation
// library: the stack forbids both, and this has to hold up on a mid-range
// Android at 360px. Everything that moves is a transform or an opacity, which
// is what a phone GPU is willing to do sixty times a second.

import { useCallback, useEffect, useRef, useState } from "react";

type Building = {
  id: string;
  sign: string;
  world: string;
  side: "left" | "right";
  /** How far down the street, in metres of pretend. */
  z: number;
  /** Storeys - the street should not be a row of identical boxes. */
  floors: number;
  hue: string;
  /** The moment that arrives if you go in. */
  moment: { situation: string; a: string; b: string };
};

const STREET: Building[] = [
  {
    id: "counter", sign: "Sharma General Stores", world: "Serving people face to face",
    side: "left", z: 900, floors: 3, hue: "16 185 129",
    moment: {
      situation: "The card machine dies with four people waiting.",
      a: "Tell the queue what has happened and start writing bills by hand",
      b: "Get the machine working - it is faster than doing it by hand",
    },
  },
  {
    id: "hub", sign: "Zippy Logistics", world: "Keeping things moving",
    side: "right", z: 1500, floors: 4, hue: "139 92 246",
    moment: {
      situation: "A rider has not moved for an hour and is not answering.",
      a: "Reassign his drops now and find out what happened after",
      b: "Keep trying him - reassigning throws the whole route out",
    },
  },
  {
    id: "desk", sign: "Nexa Support", world: "Solving problems in writing",
    side: "left", z: 2200, floors: 5, hue: "56 189 248",
    moment: {
      situation: "Three people report the same fault within an hour.",
      a: "Answer all three, then flag the pattern to the team",
      b: "Find what is causing it before answering anyone",
    },
  },
  {
    id: "floor", sign: "Metro Retail", world: "Selling without pushing",
    side: "right", z: 2900, floors: 3, hue: "251 191 36",
    moment: {
      situation: "They want the cheaper model. It is wrong for what they described.",
      a: "Say so plainly, and show them why the other one fits",
      b: "Let them decide - they asked, it is their money",
    },
  },
  {
    id: "office", sign: "Anchor Back Office", world: "Getting the numbers right",
    side: "left", z: 3600, floors: 6, hue: "45 212 191",
    moment: {
      situation: "The till is short by four hundred and the report is due at four.",
      a: "Send it on time with the gap flagged clearly",
      b: "Hold it until you have found the four hundred",
    },
  },
  {
    id: "clinic", sign: "Sunrise Clinic Desk", world: "Care, under pressure",
    side: "right", z: 4300, floors: 4, hue: "244 114 182",
    moment: {
      situation: "Two people arrive at once and one of them is frightened.",
      a: "Settle the frightened one first, tell the other you have seen them",
      b: "Take them in the order they arrived - that is the fair way",
    },
  },
];

const STREET_END = 4900;
/** How near a door has to be before it will open. */
const REACH = 700;
/**
 * Where the tour stops: short of the door, not on top of it. Parking at the
 * building's own position puts the camera inside the wall - the facade fills
 * the frame and the street disappears.
 */
const STANDING_BACK = 620;

export default function PreviewStreet3D() {
  // Where you are standing, in the same pretend metres.
  const [walked, setWalked] = useState(0);
  const [inside, setInside] = useState<Building | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [handled, setHandled] = useState<string[]>([]);
  // Nobody leaves a building without saying what they made of it. The
  // question they leave behind is the useful half: what somebody asks about
  // a job says more than how they rate it.
  const [leaving, setLeaving] = useState<Building | null>(null);
  const [interest, setInterest] = useState<"yes" | "maybe" | "no" | null>(null);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<Array<{ id: string; sign: string; interest: string; question: string }>>([]);
  // The tour drives itself. Making somebody scroll to see anything is the
  // same mistake as making them answer ten questions first: the street should
  // carry them, stop in front of each place, and wait long enough for it to
  // be looked at. Walking by hand still works - it just takes the wheel.
  const [stop, setStop] = useState(0);
  const [touring, setTouring] = useState(true);
  const arrivedAt = useRef<number | null>(null);
  const drag = useRef<{ y: number; from: number } | null>(null);
  const DWELL_MS = 4200;

  const step = useCallback((by: number) => {
    setTouring(false);
    setWalked((w) => Math.min(STREET_END, Math.max(0, w + by)));
  }, []);

  const goTo = useCallback((index: number) => {
    arrivedAt.current = null;
    setStop(Math.min(STREET.length - 1, Math.max(0, index)));
    setTouring(true);
  }, []);

  useEffect(() => {
    if (!touring || inside) return;
    const target = STREET[stop]!.z - STANDING_BACK;
    // Anyone who has asked for less motion is moved straight to the door
    // rather than glided there - same tour, no travelling.
    const ease = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.045;

    let raf = 0;
    const tick = (now: number) => {
      let arrived = false;
      setWalked((w) => {
        const gap = target - w;
        if (Math.abs(gap) < 2) {
          arrived = true;
          return target;
        }
        // Ease toward the door: a walk, not a lurch.
        return w + gap * ease;
      });
      if (arrived && arrivedAt.current === null) arrivedAt.current = now;
      if (arrivedAt.current !== null && now - arrivedAt.current > DWELL_MS) {
        if (stop < STREET.length - 1) goTo(stop + 1);
        else setTouring(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [touring, inside, stop, goTo]);

  // Keyboard, because a street nobody can walk with a keyboard is a street
  // half the people cannot use.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (inside) return;
      if (e.key === "ArrowUp" || e.key === "ArrowRight") step(220);
      if (e.key === "ArrowDown" || e.key === "ArrowLeft") step(-220);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inside, step]);

  const nearest = STREET.reduce<Building | null>((best, b) => {
    const near = Math.abs(b.z - walked) < REACH;
    if (!near) return best;
    if (!best) return b;
    return Math.abs(b.z - walked) < Math.abs(best.z - walked) ? b : best;
  }, null);

  function enter(b: Building) {
    setTouring(false);
    setInside(b);
    setVisited((v) => (v.includes(b.id) ? v : [...v, b.id]));
  }

  // Leaving a building resumes the walk at the next place along, so nobody
  // has to find their way back to the street.
  function onwards(b: Building) {
    setLeaving(null);
    setInterest(null);
    setQuestion("");
    const here = STREET.findIndex((x) => x.id === b.id);
    if (here >= 0 && here < STREET.length - 1) goTo(here + 1);
    else setTouring(false);
  }

  const sure = Math.min(100, handled.length * 24 + visited.length * 8 + Math.round(walked / 400) * 2);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.8rem] font-bold leading-tight text-brand-ink">
        Walk the street
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        Drag, scroll or use the arrow keys to walk. Go into whatever interests
        you. Nobody asks you to rate yourself out of five - what we learn comes
        from where you go and what you do when you get there.
      </p>

      {/* ---- the street ---- */}
      <div
        role="application"
        aria-label="A street of workplaces you can walk down"
        onWheel={(e) => step(e.deltaY * 1.6)}
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, from: walked };
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setTouring(false);
          setWalked(
            Math.min(STREET_END, Math.max(0, drag.current.from + (drag.current.y - e.clientY) * 6)),
          );
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="relative mt-6 h-[26rem] cursor-grab touch-none select-none overflow-hidden rounded-3xl border border-slate-200 active:cursor-grabbing sm:h-[32rem]"
        style={{ perspective: "760px", perspectiveOrigin: "50% 58%" }}
      >
        {/* sky, and the light at the end of the street */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08222b] via-[#0f3a43] to-[#0b2b30]" />
        <div
          aria-hidden
          className="absolute left-1/2 top-[58%] h-72 w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/20 blur-3xl"
        />

        {/* The world stands on the pavement line: the road runs away from it
            and every building sits on it, which is the difference between a
            street and a row of floating panels. */}
        <div
          className="absolute inset-x-0"
          style={{
            top: "58%",
            transformStyle: "preserve-3d",
            transform: `translateZ(${walked}px)`,
          }}
        >
          {/* the road */}
          <div
            aria-hidden
            className="absolute left-1/2 w-[680px] -translate-x-1/2 bg-gradient-to-b from-[#17494f] to-[#0a2429]"
            style={{
              height: "6000px",
              transform: "translateX(-50%) rotateX(90deg)",
              transformOrigin: "50% 0%",
            }}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <span
                key={i}
                className="absolute left-1/2 h-24 w-2.5 -translate-x-1/2 rounded bg-amber-100/20"
                style={{ top: `${i * 200}px` }}
              />
            ))}
          </div>

          {STREET.map((b) => {
            const near = Math.abs(b.z - walked) < REACH;
            const been = visited.includes(b.id);
            const height = b.floors * 74;
            return (
              <div
                key={b.id}
                className="absolute"
                style={{
                  left: "50%",
                  bottom: 0,
                  transformStyle: "preserve-3d",
                  transform: `translate3d(${b.side === "left" ? -340 : 340}px, 0, ${-b.z}px) rotateY(${b.side === "left" ? 68 : -68}deg)`,
                  transformOrigin: b.side === "left" ? "100% 100%" : "0% 100%",
                }}
              >
                <button
                  type="button"
                  onClick={() => enter(b)}
                  aria-label={`Go into ${b.sign} - ${b.world}`}
                  className="block w-[420px] cursor-pointer rounded-t-lg border border-b-0 border-white/15 text-left transition-[filter,box-shadow] duration-500 hover:brightness-125 motion-reduce:transition-none"
                  style={{
                    height: `${height}px`,
                    background: `linear-gradient(180deg, rgb(${b.hue} / ${near ? 0.5 : 0.22}), rgb(6 22 27 / 0.96))`,
                    boxShadow: near ? `0 0 90px rgb(${b.hue} / 0.4)` : "none",
                  }}
                >
                  <span aria-hidden className="grid grid-cols-5 gap-2.5 p-3.5">
                    {Array.from({ length: b.floors * 5 }, (_, i) => (
                      <span
                        key={i}
                        className="h-7 rounded-sm transition-colors duration-700 motion-reduce:transition-none"
                        style={{
                          background:
                            near && (i * 7) % 3 !== 0
                              ? "rgb(253 230 138 / 0.6)"
                              : "rgb(255 255 255 / 0.07)",
                          transitionDelay: `${(i % 7) * 60}ms`,
                        }}
                      />
                    ))}
                  </span>
                  {/* the shopfront and its sign, down at street level */}
                  <span
                    className="absolute inset-x-0 bottom-0 border-t border-white/20 px-4 py-3"
                    style={{ background: `rgb(${b.hue} / ${near ? 0.92 : 0.55})` }}
                  >
                    <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-black/60">
                      {b.world}
                    </span>
                    <span className="block text-[1.05rem] font-bold leading-tight text-black/85">
                      {b.sign}
                      {been ? " ✓" : ""}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* haze at the far end, so the street has distance rather than an edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[58%]"
          style={{ background: "linear-gradient(to bottom, #08222b 0%, rgba(15,58,67,0.65) 55%, transparent 100%)" }}
        />

        {/* what is within reach, and the way in */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-white/50">
              {nearest ? "Right in front of you" : touring ? "Walking you down the street" : "Between places"}
            </p>
            <p className="truncate text-[1rem] font-bold text-white">
              {nearest ? nearest.sign : touring ? `Next: ${STREET[stop]!.sign}` : "Pick a place, or take the tour"}
            </p>
          </div>
          {nearest && (
            <button
              type="button"
              onClick={() => enter(nearest)}
              className="pointer-events-auto shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900"
            >
              Go in →
            </button>
          )}
        </div>
      </div>

      {/* Where the tour is, and where it has been. A person can jump to any
          stop rather than wait to be driven there. */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {STREET.map((b, i) => {
          const here = i === stop;
          const been = visited.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to ${b.sign}`}
              aria-current={here ? "true" : undefined}
              className={`min-h-9 rounded-full px-3 text-[0.72rem] font-semibold transition-colors motion-reduce:transition-none ${
                here
                  ? "bg-brand-teal-deep text-white"
                  : been
                    ? "border border-teal-600/40 bg-teal-50 text-teal-700"
                    : "border border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {b.sign.split(" ")[0]}
              {been ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      {/* how far along the street, and how sure we are */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-[12rem] flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-teal-deep"
              style={{ width: `${sure}%` }}
            />
          </div>
          <p className="mt-1 text-[0.75rem] text-slate-500">
            {handled.length === 0
              ? "Nothing learned yet - go into a building."
              : `${sure}% sure. ${visited.length} ${visited.length === 1 ? "door" : "doors"} opened, ${handled.length} ${handled.length === 1 ? "moment" : "moments"} handled.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => (touring ? setTouring(false) : goTo(stop))}
            className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700"
          >
            {touring ? "Pause the tour" : "Take me along"}
          </button>
          <button
            type="button"
            onClick={() => goTo(stop - 1)}
            className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => goTo(stop + 1)}
            className="min-h-11 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700"
          >
            Next place →
          </button>
        </div>
      </div>

      {/* ---- inside ---- */}
      {inside && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 sm:items-center">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 text-white">
            <div
              className="relative aspect-video"
              style={{ background: `linear-gradient(135deg, rgb(${inside.hue} / 0.5), #0b1f24)` }}
            >
              <p className="absolute left-5 top-5 text-[0.7rem] font-semibold uppercase tracking-wide text-white/60">
                Inside {inside.sign}
              </p>
              <p className="absolute inset-x-5 bottom-5 text-[1.05rem] font-semibold leading-snug">
                {inside.moment.situation}
              </p>
            </div>
            <div className="grid gap-2 p-5">
              {(["a", "b"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => {
                    setHandled((h) => (h.includes(inside.id) ? h : [...h, inside.id]));
                    setLeaving(inside);
                    setInside(null);
                  }}
                  className="rounded-xl border border-white/15 px-4 py-3 text-left text-[0.9rem] leading-snug transition-colors hover:border-teal-300 hover:bg-white/5 motion-reduce:transition-none"
                >
                  {inside.moment[side]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setLeaving(inside);
                  setInside(null);
                }}
                className="mt-1 min-h-11 text-[0.8rem] font-semibold text-white/50 underline underline-offset-2"
              >
                Not for me - back to the street
              </button>
            </div>
          </div>
        </div>
      )}

      {/* On the way out of each building. */}
      {leaving && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-surface p-5">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-brand-violet-deep">
              On your way out of {leaving.sign}
            </p>

            <p className="mt-3 text-[0.95rem] font-semibold text-brand-ink">
              Could you see yourself doing this?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                ["yes", "Yes, this is me"],
                ["maybe", "Maybe - tell me more"],
                ["no", "Not for me"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInterest(value)}
                  className={`min-h-11 cursor-pointer rounded-lg border-2 px-4 text-[0.82rem] font-bold transition-colors motion-reduce:transition-none ${
                    interest === value
                      ? "border-brand-teal-deep bg-brand-teal-deep text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-[0.95rem] font-semibold text-brand-ink">
                What do you want to know about this job?
              </span>
              <span className="mt-0.5 block text-[0.78rem] leading-relaxed text-slate-500">
                One real question - the pay, the hours, whether it leads
                anywhere, what the hard part is. We will answer it, and the
                answer waits for you at the end of the street.
              </span>
              <textarea
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Does this job ever get you off the shop floor?"
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 bg-surface px-3 py-2 text-[0.9rem] outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
              />
            </label>

            <button
              type="button"
              disabled={!interest || question.trim().length < 4}
              onClick={() => {
                setAsked((a) => [
                  ...a,
                  {
                    id: leaving.id,
                    sign: leaving.sign,
                    interest: interest ?? "",
                    question: question.trim(),
                  },
                ]);
                onwards(leaving);
              }}
              className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white disabled:opacity-40"
            >
              {interest && question.trim().length >= 4
                ? "Take me to the next place →"
                : "Answer both to walk on"}
            </button>
            <p className="mt-2 text-center text-[0.72rem] text-slate-400">
              Both are asked of everyone. It is the only thing we ask you to
              type on this street.
            </p>
          </div>
        </div>
      )}

      {/* What they left behind at each door. */}
      {asked.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
          <h2 className="text-base font-bold text-brand-ink">
            Your questions, waiting to be answered
          </h2>
          <ul className="mt-2.5 grid gap-2.5">
            {asked.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-200 px-4 py-2.5">
                <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-slate-400">
                  {a.sign} ·{" "}
                  {a.interest === "yes"
                    ? "could see yourself doing it"
                    : a.interest === "maybe"
                      ? "wanted to know more"
                      : "not for you"}
                </p>
                <p className="mt-0.5 text-[0.88rem] leading-relaxed text-brand-ink">
                  &ldquo;{a.question}&rdquo;
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-600">
            Answered at the end of the walk, in one go - a person who asks
            about pay at three doors and about growth at none has told us
            something no rating scale would have caught.
          </p>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">What it costs to be this lively</h2>
        <ul className="mt-2 grid gap-2 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="text-brand-ink">No 3D library.</strong> This is
            CSS perspective and transforms - the same primitives the landing
            page already uses. Adding three.js would be about 150KB before a
            single building appeared, on phones that are the reason we keep the
            bundle small.
          </li>
          <li>
            <strong className="text-brand-ink">Six buildings, not sixty.</strong>{" "}
            Every building is a composited layer. A street of twenty roles wants
            windowing - draw the six nearest and let the rest exist as data -
            or a mid-range Android will drop frames as you walk.
          </li>
          <li>
            <strong className="text-brand-ink">It walks without a mouse.</strong>{" "}
            Arrow keys move you, every door is a real button in reading order,
            and the drift stops for anyone who has asked for less motion.
          </li>
          <li>
            <strong className="text-brand-ink">The measurement has not changed.</strong>{" "}
            Where you went and what you stayed for is the colour; the decision
            inside each building is what actually reads you. Take the moments
            out and this is a beautiful way to learn nothing.
          </li>
        </ul>
      </section>
    </main>
  );
}
