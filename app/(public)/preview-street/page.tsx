"use client";

// A preview, not a shipped screen: Discovery without a questionnaire.
//
// The premise is that a person tells you more by where they go than by what
// they claim. So instead of ten questions, a street: buildings on both sides,
// a door into each, a short reel of the real work inside, and one decision
// taken in the middle of the scene. What we learn comes from the walk.
//
// Everything here is hand-written CSS - scroll snapping, transforms, a
// pointer-driven parallax - because the stack has no animation library and
// this has to run on a phone on 4G.

import { useEffect, useMemo, useRef, useState } from "react";

// ---- the street ---------------------------------------------------------

type Door = {
  id: string;
  sign: string;
  world: string;
  /** The 20-second reel, described. Stills with motion until reels exist. */
  reel: string[];
  /** The moment that arrives while you are watching. */
  moment: { situation: string; a: string; b: string };
  /** What each answer is evidence of - never shown to the person. */
  reads: { a: string; b: string };
  side: "left" | "right";
  hue: string;
};

const STREET: Door[] = [
  {
    id: "counter",
    sign: "Sharma General Stores",
    world: "Serving people face to face",
    reel: [
      "The shutter goes up. First customer already waiting.",
      "Billing, a question about a return, a phone ringing behind you.",
      "The queue is four deep and the card machine is slow.",
    ],
    moment: {
      situation: "The card machine dies with four people waiting.",
      a: "Tell the queue what has happened and start writing bills by hand",
      b: "Get the machine working - it is faster than doing it manually",
    },
    reads: { a: "communication under pressure", b: "problem solving" },
    side: "left",
    hue: "from-teal-500/25",
  },
  {
    id: "hub",
    sign: "Zippy Logistics Hub",
    world: "Keeping things moving",
    reel: [
      "Sixty parcels, eleven riders, one whiteboard.",
      "Two riders are late and the rain has started.",
      "A customer is calling about an order that has not moved since morning.",
    ],
    moment: {
      situation: "A rider has not moved for an hour and is not answering.",
      a: "Reassign his drops now and find out what happened after",
      b: "Keep trying him - reassigning throws the whole route out",
    },
    reads: { a: "ownership", b: "planning" },
    side: "right",
    hue: "from-violet-500/25",
  },
  {
    id: "desk",
    sign: "Nexa Support Desk",
    world: "Solving problems in writing",
    reel: [
      "Forty tickets open. The oldest is from Friday.",
      "The same complaint appears three times from three different people.",
      "Somebody has replied 'still not fixed' to your last message.",
    ],
    moment: {
      situation: "Three people report the same fault in an hour.",
      a: "Answer all three, then flag the pattern to the team",
      b: "Find out what is causing it before answering anyone",
    },
    reads: { a: "follow through", b: "problem solving" },
    side: "left",
    hue: "from-sky-500/25",
  },
  {
    id: "floor",
    sign: "Metro Retail Floor",
    world: "Selling without pushing",
    reel: [
      "A couple has been looking at the same shelf for ten minutes.",
      "One of them keeps picking up the cheaper model.",
      "Your target for the day is behind by six.",
    ],
    moment: {
      situation: "They want the cheaper model. It is wrong for what they described.",
      a: "Say so plainly, and show them why the other one fits",
      b: "Let them decide - they asked, it is their money",
    },
    reads: { a: "selling", b: "customer care" },
    side: "right",
    hue: "from-amber-500/25",
  },
  {
    id: "office",
    sign: "Anchor Back Office",
    world: "Getting the numbers right",
    reel: [
      "Yesterday's till does not match by four hundred rupees.",
      "Two people say they counted it correctly.",
      "The report goes out at four.",
    ],
    moment: {
      situation: "The numbers do not match and the report is due.",
      a: "Send it on time with the gap flagged clearly",
      b: "Hold it until you have found the four hundred",
    },
    reads: { a: "composure", b: "follow through" },
    side: "left",
    hue: "from-emerald-500/25",
  },
];

// ---- what the walk says -------------------------------------------------

type Step =
  | { kind: "passed"; id: string }
  | { kind: "entered"; id: string }
  | { kind: "watched"; id: string; seconds: number }
  | { kind: "chose"; id: string; option: "a" | "b" }
  | { kind: "left"; id: string; before: boolean };

function readWalk(steps: Step[]) {
  const entered = steps.filter((s) => s.kind === "entered").length;
  const chose = steps.filter((s) => s.kind === "chose").length;
  const skipped = steps.filter((s) => s.kind === "left" && s.before).length;
  // Confidence is what the walk has earned: a decision inside a scene is
  // worth far more than a door opened and closed.
  const confidence = Math.min(100, chose * 22 + entered * 6 + skipped * 2);
  return { entered, chose, skipped, confidence };
}

// ---- the preview --------------------------------------------------------

export default function PreviewStreet() {
  const [inside, setInside] = useState<Door | null>(null);
  const [beat, setBeat] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const enteredAt = useRef<number>(0);
  const walk = useMemo(() => readWalk(steps), [steps]);

  // The reel advances on its own, the way a reel does.
  useEffect(() => {
    if (!inside) return;
    const id = setInterval(() => setBeat((b) => Math.min(b + 1, inside.reel.length)), 2600);
    return () => clearInterval(id);
  }, [inside]);

  function enter(door: Door) {
    enteredAt.current = Number(new Date());
    setBeat(0);
    setInside(door);
    setSteps((s) => [...s, { kind: "entered", id: door.id }]);
  }

  function leave(chose: boolean) {
    if (!inside) return;
    const seconds = Math.round((Number(new Date()) - enteredAt.current) / 1000);
    setSteps((s) => [
      ...s,
      { kind: "watched", id: inside.id, seconds },
      { kind: "left", id: inside.id, before: !chose },
    ]);
    setInside(null);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.8rem] font-bold leading-tight text-brand-ink">
        Discovery as a street, not a questionnaire
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        Walk the street. Go into whatever interests you, watch what the job
        actually looks like, and handle the moment that arrives while you are
        in there. Nobody asks you to rate yourself out of five.
      </p>

      {/* The street. Scroll snapping and transforms only - no library, and it
          degrades to a plain list when motion is turned down. */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-900 to-slate-800 p-4 sm:p-6">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {STREET.map((door) => (
            <button
              key={door.id}
              type="button"
              onClick={() => enter(door)}
              className={`group relative w-64 shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${door.hue} to-slate-900/60 p-4 text-left transition-transform duration-300 hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                door.side === "right" ? "mt-8" : ""
              }`}
              style={{ height: door.side === "left" ? "17rem" : "15rem" }}
            >
              {/* windows */}
              <span aria-hidden className="absolute inset-x-4 top-4 grid grid-cols-3 gap-1.5">
                {Array.from({ length: 9 }, (_, i) => (
                  <span
                    key={i}
                    className="h-4 rounded-sm bg-white/15 transition-colors duration-500 group-hover:bg-amber-200/40 motion-reduce:transition-none"
                    style={{ transitionDelay: `${i * 40}ms` }}
                  />
                ))}
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10">
                <span className="block text-[0.7rem] font-semibold uppercase tracking-wide text-white/60">
                  {door.world}
                </span>
                <span className="mt-0.5 block text-[0.95rem] font-bold text-white">
                  {door.sign}
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-teal-300">
                  Go in
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-center text-[0.72rem] text-white/40">
          Scroll the street sideways. Five doors here; the real one has twenty.
        </p>
      </div>

      {/* What the walk has told us, honestly, as it happens. */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.8rem] font-semibold text-brand-ink">
            What your walk has told us so far
          </p>
          <p className="text-[0.75rem] tabular-nums text-slate-500">
            {walk.confidence}% sure
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-teal-deep transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${walk.confidence}%` }}
          />
        </div>
        <p className="mt-2 text-[0.78rem] leading-relaxed text-slate-600">
          {steps.length === 0
            ? "Nothing yet - go into a building."
            : `${walk.entered} ${walk.entered === 1 ? "door" : "doors"} opened, ${walk.chose} ${walk.chose === 1 ? "moment" : "moments"} handled${walk.skipped > 0 ? `, ${walk.skipped} left before the moment` : ""}.`}
        </p>
      </div>

      {/* Inside a building: the reel, then the moment. */}
      {inside && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-slate-900 text-white">
            <div className={`relative aspect-video bg-gradient-to-br ${inside.hue} to-slate-900`}>
              {/* The reel: a beat every couple of seconds. Stills with a slow
                  drift stand in for video, which is what shipping this would
                  do until the films exist. */}
              <p
                key={beat}
                className="absolute inset-x-0 bottom-0 animate-fade-up bg-gradient-to-t from-black/80 to-transparent px-5 pb-5 pt-12 text-[1.05rem] font-semibold leading-snug"
              >
                {inside.reel[Math.min(beat, inside.reel.length - 1)]}
              </p>
              <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-white/70">
                {inside.sign}
              </span>
            </div>

            {beat >= inside.reel.length - 1 ? (
              <div className="p-5">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-teal-300">
                  And then this happens
                </p>
                <p className="mt-1.5 text-[1.05rem] font-semibold leading-snug">
                  {inside.moment.situation}
                </p>
                <div className="mt-3 grid gap-2">
                  {(["a", "b"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => {
                        setSteps((s) => [...s, { kind: "chose", id: inside.id, option: side }]);
                        leave(true);
                      }}
                      className="rounded-xl border border-white/15 px-4 py-3 text-left text-[0.9rem] leading-snug transition-colors hover:border-teal-300 hover:bg-white/5 motion-reduce:transition-none"
                    >
                      {inside.moment[side]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => leave(false)}
                  className="mt-3 min-h-11 text-[0.8rem] font-semibold text-white/50 underline underline-offset-2"
                >
                  Not for me - back to the street
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-5">
                <p className="text-[0.8rem] text-white/50">Watching…</p>
                <button
                  type="button"
                  onClick={() => setBeat(inside.reel.length - 1)}
                  className="min-h-11 text-[0.8rem] font-semibold text-teal-300 underline underline-offset-2"
                >
                  Skip to the moment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* The argument, written down. */}
      <section className="mt-10 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">
          How this reads somebody without asking them anything
        </h2>
        <ol className="mt-3 grid gap-3 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="text-brand-ink">Where they go first.</strong> The
            first door is the strongest signal in the walk and it costs nobody a
            question. A person who opens the logistics hub before the retail
            floor has told you something they would struggle to write down.
          </li>
          <li>
            <strong className="text-brand-ink">What they stay for.</strong> Time
            in a scene, whether they watched to the end, whether they came back
            to a door they had already opened.
          </li>
          <li>
            <strong className="text-brand-ink">What they walk past.</strong>{" "}
            Skipping is information. Three doors opened and left before the
            moment says as much as one handled well.
          </li>
          <li>
            <strong className="text-brand-ink">The moment inside.</strong> This
            is the part that actually discriminates. Attention alone tells you
            what somebody is drawn to, never what they would do - and two
            people can love the same job and handle it completely differently.
            One decision per scene, in the middle of the story, is the same
            measurement Discovery makes today with none of the survey feeling.
          </li>
        </ol>
        <p className="mt-3 text-[0.86rem] leading-relaxed text-slate-600">
          Four or five doors gives roughly what ten questions gives now, and it
          ends the way Discovery should: not with a score, but with what the
          walk showed - &ldquo;you went to the hub first, stayed longest at the
          counter, and walked past selling twice.&rdquo;
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/50 p-5">
        <h2 className="text-base font-bold text-brand-ink">
          What this costs, honestly
        </h2>
        <ul className="mt-2 grid gap-2 text-[0.86rem] leading-relaxed text-slate-700">
          <li>
            <strong>Twenty reels is ten minutes of film.</strong> Generated
            video is dollars a minute and megabytes to download on 4G. The
            shippable version is what you are looking at: three or four stills
            per role with a slow drift and one line of narration each - about a
            cent a role, and it loads instantly.
          </li>
          <li>
            <strong>A street is popularity-biased.</strong> Everyone opens the
            interesting door. Without the moment inside, you would learn what
            looks appealing rather than what somebody is good at - which is how
            career quizzes have always gone wrong.
          </li>
          <li>
            <strong>It has to work at 360px and on a keyboard.</strong> The
            street scrolls sideways, which is fine on a phone and hostile to a
            screen reader unless every door is a real button in reading order -
            which they are here.
          </li>
          <li>
            <strong>Behaviour must never be a hidden thumb on the scale.</strong>{" "}
            If where they walked moves their result, the result has to say so in
            their own terms. That rule already exists in Discovery and it
            matters more here, not less.
          </li>
        </ul>
      </section>
    </main>
  );
}
