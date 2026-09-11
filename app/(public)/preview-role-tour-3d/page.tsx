"use client";

// A preview, not a shipped screen: touring roles as a camera move rather than
// a list.
//
// The footage is the movement. A five-second aerial pass, looping, so the
// camera never lands - and the roles change over it while it keeps going. The
// five stills below are the stops and double as the picker.
//
// An earlier cut of this seeked the video to a timestamp per role, which is
// the better idea when there is footage to seek through. There is not: five
// seconds across five roles is one second each, and seeking inside a loop that
// short reads as a stutter rather than a move. So the pass runs continuously
// and the roles advance on their own cadence over it.
//
// WHAT THE MEDIA IS. Generated, and the page says so. The stills had invented
// company names on the walls - Horizon Bank, Wellspring Health - and those are
// blurred out at source, because a preview that shows a student a company name
// is showing them an employer that does not exist. The role titles are the
// live catalogue's; the industries are where those roles are actually done.
//
// WHAT IT COST TO SHIP. The source was 6MB at 10.7 Mbps, which is a bitrate no
// phone on 4G gets through. Transcoded to H.264 at 1280x720, no audio, 1MB for
// five seconds. The stills are 10-16kB each. A tour nobody can load is a tour
// nobody takes.

import { useCallback, useEffect, useRef, useState } from "react";
import { RoleTransit } from "@/components/role-transit";

type Stop = {
  id: string;
  industry: string;
  /** A real role from the catalogue that lives in it. */
  role: string;
  /** What the day is actually like - the thing a card cannot say. */
  line: string;
  still: string;
};

const STOPS: Stop[] = [
  {
    id: "tech",
    industry: "Software & product",
    role: "Customer Success Associate",
    line: "The product breaks at 9am and you are the one the customer reaches. Half the job is knowing what engineering can and cannot promise.",
    still: "/tour/tech.jpg",
  },
  {
    id: "bank",
    industry: "Banking & financial services",
    role: "Relationship Executive",
    line: "Mandates, compliance and somebody's savings. Getting it wrong is not a bad review, it is a regulator.",
    still: "/tour/bank.jpg",
  },
  {
    id: "healthcare",
    industry: "Healthcare",
    role: "Guest Experience Associate",
    line: "Everybody at the desk is having a worse day than you. Composure is the skill, and it is trainable.",
    still: "/tour/healthcare.jpg",
  },
  {
    id: "consulting",
    industry: "Consulting & professional services",
    role: "Operations Coordinator",
    line: "Five people need the same hour of your day. What you say no to decides whether the week works.",
    still: "/tour/consulting.jpg",
  },
  {
    id: "law",
    industry: "Legal & compliance",
    role: "Operations Executive",
    line: "The record is the work. If it is not written down correctly it did not happen, and somebody finds out in six months.",
    still: "/tour/law.jpg",
  },
];

export default function Page() {
  const video = useRef<HTMLVideoElement>(null);
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [transit, setTransit] = useState(false);
  // Respected rather than assumed: a moving camera is exactly the thing
  // somebody turns this off for, and the tour still works as a stepper.
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setStill(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  const go = useCallback((n: number) => {
    setAt(Math.max(0, Math.min(STOPS.length - 1, n)));
  }, []);

  // The roles advance while the pass loops underneath. Long enough to read the
  // three lines, which is what decides the number rather than the footage.
  useEffect(() => {
    if (!playing || still) return;
    const id = setInterval(() => setAt((was) => (was + 1) % STOPS.length), 4500);
    return () => clearInterval(id);
  }, [playing, still]);

  const toggle = useCallback(() => {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, go]);

  const here = STOPS[at]!;
  const nextUp = STOPS[(at + 1) % STOPS.length]!;

  return (
    <main className="min-h-[100dvh] bg-surface text-slate-900">
      {transit && (
        <RoleTransit
          title={nextUp.role}
          sector={nextUp.industry}
          stop={((at + 1) % STOPS.length) + 1}
          total={STOPS.length}
          onDone={() => {
            setTransit(false);
            setAt((was) => (was + 1) % STOPS.length);
          }}
        />
      )}
      {/* ---------------------------------------------------------- the stage */}
      <div className="relative h-[68vh] min-h-[24rem] w-full overflow-hidden bg-[#05080e]">
        <video
          ref={video}
          // Muted and inline, or a phone refuses to autoplay it at all - and
          // sound on a page somebody did not ask to make noise is its own
          // problem.
          muted
          playsInline
          loop
          preload="metadata"
          poster="/tour/roles-poster.jpg"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="absolute inset-0 h-full w-full object-cover"
        >
          {/* H.264, which every browser plays. Worth checking on any future
              swap: the cut before this one was HEVC, which Safari plays and
              Chrome and Firefox render as a black rectangle. */}
          <source src="/tour/roles.mp4" type="video/mp4" />
        </video>

        {/* The footage is scenery; the words sit on it and have to stay
            readable over whatever frame is underneath. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#05080e] via-[#05080e]/55 to-[#05080e]/25"
        />

        <div className="absolute inset-x-0 top-0 mx-auto max-w-6xl px-4 pt-7 sm:px-6">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/50">
            Preview · not a shipped screen
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Touring roles as a place you move through
          </h1>
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <div key={here.id} className="animate-fade-up">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/60">
              {here.industry}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              {here.role}
            </h2>
            <p className="mt-1.5 max-w-2xl text-[0.95rem] leading-relaxed text-white/80">
              {here.line}
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- the stops */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {STOPS.map((stop, i) => (
            <button
              key={stop.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`${stop.role}, ${stop.industry}`}
              aria-current={i === at}
              className={`overflow-hidden rounded-lg border transition-all ${
                i === at
                  ? "border-brand-violet opacity-100"
                  : "border-slate-300 opacity-55 hover:opacity-90"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stop.still}
                alt=""
                width={720}
                height={240}
                loading="lazy"
                className="block h-14 w-full object-cover sm:h-20"
              />
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => go(at - 1)}
            disabled={at === 0}
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-[0.85rem] font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-35"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => go(at + 1)}
            disabled={at === STOPS.length - 1}
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-[0.85rem] font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-35"
          >
            Next
          </button>
          <button
            type="button"
            onClick={toggle}
            className="min-h-11 rounded-lg bg-brand-violet px-4 text-[0.85rem] font-semibold text-white transition-colors hover:bg-brand-violet-deep"
          >
            {playing ? "Pause the tour" : "Play the tour"}
          </button>
          <button
            type="button"
            onClick={() => setTransit(true)}
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-[0.85rem] font-semibold text-slate-700 transition-colors hover:border-slate-400"
          >
            Show the stop-to-stop move
          </button>
          <span className="ml-1 text-[0.78rem] text-slate-500">
            {still
              ? "Motion is off in your system settings — Back and Next still move you through."
              : "Arrow keys work too"}
          </span>
        </div>

        <p className="mt-6 max-w-2xl text-[0.78rem] leading-relaxed text-slate-500">
          The footage and the stills are generated and illustrative — the
          companies that appeared in them are not real and nobody is hiring from
          them. The role titles are from the live catalogue; the industries are
          where those roles are actually done.
        </p>
      </div>
    </main>
  );
}
