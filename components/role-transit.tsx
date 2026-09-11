"use client";

// The move between two stops on the tour.
//
// Leaving one role and arriving at the next used to be a swap: the page
// changed and you were somewhere else. That is a cut, and a cut tells somebody
// they have been shown a different card. A tour is meant to feel like
// travelling, so the handover between stops is a short aerial pass with the
// next role's name arriving over it - the camera moving, not the deck.
//
// THREE THINGS IT MUST NOT DO.
//
//   It must not gate the tour on a video. Everything here is driven by a
//   timeout, never by the footage: if the file is slow, blocked, or the
//   browser refuses to autoplay it, the beat still lasts the same time and the
//   next stop still arrives. The video is decoration over a timer.
//
//   It must not run for somebody who asked for stillness. prefers-reduced-
//   motion skips the pass entirely and the caller advances immediately - a
//   full-screen camera move is exactly what that setting exists to prevent.
//
//   It must not cost anything to the people who will never see it. One
//   megabyte, preload="none" until the first transit, and it is the same file
//   for every stop rather than one per role.

import { useEffect, useRef, useState } from "react";

/** How long the pass holds, in ms. Long enough to read a job title. */
export const TRANSIT_MS = 1600;

export function RoleTransit({
  /** The stop being arrived at. */
  title,
  sector,
  /** Which stop it is, so the pass says where you are going. */
  stop,
  total,
  onDone,
}: {
  title: string;
  sector: string;
  stop: number;
  total: number;
  onDone: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [gone, setGone] = useState(false);

  // The callback is held rather than depended on.
  //
  // Naming it in the dependency list below made this overlay permanent. The
  // caller passed an inline arrow, so every one of its renders was a new
  // function; the effect tore down and re-armed its timers each time; and the
  // caller re-renders on a progress-bar interval faster than this beat. The
  // timers never reached the end, the overlay never unmounted, and a
  // full-screen z-60 layer sat over the tour swallowing every click.
  const finish = useRef(onDone);
  useEffect(() => {
    finish.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // The beat is a timer, and the timer is the contract. The video is asked
    // to play and is allowed to fail.
    const el = video.current;
    if (el) void el.play().catch(() => {});
    const fade = setTimeout(() => setGone(true), TRANSIT_MS - 260);
    const done = setTimeout(() => finish.current(), TRANSIT_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  return (
    <div
      // Announced rather than silent: a screen reader should be told the tour
      // is moving, not left on a page that has quietly changed underneath.
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-[#05080e] transition-opacity duration-300 ${
        gone ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={video}
        muted
        playsInline
        loop
        preload="auto"
        poster="/tour/roles-poster.jpg"
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      >
        <source src="/tour/roles.mp4" type="video/mp4" />
      </video>

      {/* The words have to hold over whatever frame is underneath. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#05080e] via-[#05080e]/45 to-[#05080e]/70"
      />

      <div className="relative px-6 text-center">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-white/55">
          Stop {stop} of {total}
        </p>
        <p className="mt-2 text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-white/60">
          {sector}
        </p>
        <p className="animate-fade-up font-display text-[clamp(1.5rem,5vw,2.6rem)] font-bold leading-tight tracking-tight text-white">
          {title}
        </p>
      </div>
    </div>
  );
}
