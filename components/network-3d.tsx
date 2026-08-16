"use client";

import { useEffect, useRef } from "react";

// The talent network as an interactive 3D diorama, hand-written with CSS
// perspective transforms - no 3D library. The city map lies as a ground
// plane in space; each station raises a light-stem with a billboarded label
// that always faces the camera; the guide-bot flies the figure-eight above
// the road. Dragging orbits the camera (yaw ±28°, pitch 45–70°); idle, the
// scene sways gently until first touched. Reduced-motion: static pose,
// no sway, no flight - drag still works because the user asked for it.

const INF =
  "M410,200 C410,110 320,70 230,70 C110,70 45,130 45,200 C45,270 110,330 230,330 C320,330 410,290 410,200 C410,110 500,70 590,70 C710,70 775,130 775,200 C775,270 710,330 590,330 C500,330 410,290 410,200";

// 96 samples of the infinity path as percentages of the plane, precomputed
// from the svg (viewBox -150,-14 1070×428) - the bot's flight plan.
const PATH_PCT: Array<[number, number]> = [
  [52.34, 50.0], [52.16, 44.95], [51.66, 40.38], [50.87, 36.3], [49.81, 32.68], [48.51, 29.52],
  [47.01, 26.81], [45.33, 24.55], [43.5, 22.73], [41.56, 21.33], [39.52, 20.36], [37.44, 19.79],
  [35.26, 19.63], [32.6, 19.96], [30.16, 20.82], [27.94, 22.18], [25.93, 23.99], [24.15, 26.21],
  [22.6, 28.81], [21.27, 31.73], [20.19, 34.96], [19.33, 38.44], [18.72, 42.13], [18.35, 46.0],
  [18.22, 50.0], [18.35, 54.0], [18.72, 57.87], [19.33, 61.56], [20.19, 65.04], [21.27, 68.27],
  [22.6, 71.19], [24.15, 73.79], [25.93, 76.01], [27.94, 77.82], [30.16, 79.18], [32.6, 80.04],
  [35.26, 80.37], [37.44, 80.21], [39.52, 79.64], [41.56, 78.67], [43.5, 77.27], [45.33, 75.45],
  [47.01, 73.19], [48.51, 70.48], [49.81, 67.32], [50.87, 63.7], [51.66, 59.62], [52.16, 55.05],
  [52.34, 50.0], [52.51, 44.95], [53.01, 40.38], [53.8, 36.3], [54.86, 32.68], [56.16, 29.52],
  [57.67, 26.81], [59.35, 24.55], [61.17, 22.73], [63.12, 21.33], [65.15, 20.36], [67.24, 19.79],
  [69.41, 19.63], [72.07, 19.96], [74.51, 20.82], [76.74, 22.18], [78.74, 23.99], [80.52, 26.21],
  [82.07, 28.81], [83.4, 31.73], [84.49, 34.96], [85.34, 38.44], [85.95, 42.13], [86.32, 46.0],
  [86.45, 50.0], [86.32, 54.0], [85.95, 57.87], [85.34, 61.56], [84.49, 65.04], [83.4, 68.27],
  [82.07, 71.19], [80.52, 73.79], [78.74, 76.01], [76.74, 77.82], [74.51, 79.18], [72.07, 80.04],
  [69.41, 80.37], [67.24, 80.21], [65.15, 79.64], [63.12, 78.67], [61.17, 77.27], [59.35, 75.45],
  [57.67, 73.19], [56.16, 70.48], [54.86, 67.32], [53.8, 63.7], [53.01, 59.62], [52.51, 55.05],
];

// h = stem height (or, with below, the drop beneath the anchor), dx =
// sideways offset in billboard space. Top-edge stations float above the
// map; bottom-edge stations hang BELOW its rim - the lobe interiors stay
// empty so the Students/Employers titles are never covered.
type Station = {
  x: number;
  y: number;
  h: number;
  dx: number;
  below?: boolean;
  c: string;
  l1: string;
  l2: string;
};

const STATIONS: Station[] = [
  { x: 49.44, y: 31.54, h: 30, dx: -52, c: "#7dd3fc", l1: "Finds the work", l2: "that fits" },
  { x: 25.33, y: 24.77, h: 42, dx: 0, c: "#7dd3fc", l1: "Sees the real role -", l2: "day, pay, ladder" },
  { x: 21.03, y: 67.76, h: 12, dx: 0, below: true, c: "#7dd3fc", l1: "Practises the actual", l2: "work, scored" },
  { x: 45.79, y: 74.77, h: 10, dx: -30, below: true, c: "#5eead4", l1: "Earns a verified", l2: "record" },
  { x: 52.34, y: 50.0, h: 92, dx: 12, c: "#5eead4", l1: "Sends it to", l2: "an employer" },
  { x: 58.04, y: 26.17, h: 26, dx: 56, c: "#6ee7b7", l1: "Shortlisted", l2: "on evidence" },
  { x: 82.06, y: 28.74, h: 42, dx: -24, c: "#6ee7b7", l1: "Interviewed -", l2: "and hired" },
  { x: 82.43, y: 70.56, h: 12, dx: 0, below: true, c: "#6ee7b7", l1: "Productive", l2: "from day one" },
  { x: 55.23, y: 68.46, h: 36, dx: 30, below: true, c: "#cbd5e1", l1: "The next role opens -", l2: "the loop runs again" },
];

// Each station's position along the 96-sample path - the bot's checkpoints.
const STATION_T = [4.5, 16, 29, 41, 48, 54, 68, 78, 93.5];

const REST = { pitch: 48, yaw: 0 };
// Undo the orbit rotation so labels always face the camera.
const BILLBOARD =
  "rotateZ(var(--nyaw, 0deg)) rotateX(var(--npitch, -48deg))";

// `active` lights one station (by index) so a companion element - like
// the feature wall - can walk the loop in sync with its own progress.
export function Network3D({ active }: { active?: number }) {
  const orbitRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<SVGPathElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const pose = useRef({ ...REST, dragging: false, lastTouch: -Infinity });
  // The bot's progress along the path, and the wall-clock of the last frame.
  const flight = useRef({ prog: 0, lastT: 0 });
  const activeRef = useRef<number | undefined>(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const orbit = orbitRef.current;
    if (!orbit) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const apply = () => {
      const { pitch, yaw } = pose.current;
      orbit.style.transform = `scale(0.98) rotateX(${pitch}deg) rotateZ(${yaw}deg)`;
      orbit.style.setProperty("--nyaw", `${-yaw}deg`);
      orbit.style.setProperty("--npitch", `${-pitch}deg`);
    };
    apply();
    if (still) return;
    const tick = (now: number) => {
      // The table holds its tilted pose. After a drag it eases back to
      // rest instead of jumping - but it never moves on its own.
      const cam = pose.current;
      if (!cam.dragging && now - cam.lastTouch > 2500) {
        cam.yaw += (REST.yaw - cam.yaw) * 0.03;
        cam.pitch += (REST.pitch - cam.pitch) * 0.03;
      }
      apply();
      // With a companion driving `active`, the bot flies to that station and
      // holds there - a checkpoint runner. Without one, it laps freely.
      const dt = flight.current.lastT ? now - flight.current.lastT : 16;
      flight.current.lastT = now;
      const tgt =
        activeRef.current === undefined
          ? null
          : STATION_T[activeRef.current % STATION_T.length];
      if (tgt === null) {
        flight.current.prog = (flight.current.prog + dt * (96 / 19000)) % 96;
      } else {
        const delta = (tgt - flight.current.prog + 96) % 96;
        flight.current.prog =
          (flight.current.prog + delta * (1 - Math.exp(-dt / 650))) % 96;
      }
      const p = flight.current.prog;
      // the lit road: a 320-unit comet tail ending exactly at the bot
      traceRef.current?.style.setProperty(
        "stroke-dashoffset",
        `${-((p / 96) * 2002 - 320)}`,
      );
      const i = Math.floor(p) % PATH_PCT.length;
      const [ax, ay] = PATH_PCT[i];
      const [bx, by] = PATH_PCT[(i + 1) % PATH_PCT.length];
      const f = p - Math.floor(p);
      const x = ax + (bx - ax) * f;
      const y = ay + (by - ay) * f;
      for (const el of [botRef.current, shadowRef.current]) {
        if (el) {
          el.style.left = `${x}%`;
          el.style.top = `${y}%`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="relative h-56 cursor-grab select-none active:cursor-grabbing lg:h-64"
      style={{ perspective: "1100px", touchAction: "pan-y" }}
      onPointerDown={(e) => {
        pose.current.dragging = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!pose.current.dragging) return;
        const p = pose.current;
        p.yaw = Math.max(-28, Math.min(28, p.yaw + e.movementX * 0.15));
        p.pitch = Math.max(45, Math.min(70, p.pitch - e.movementY * 0.12));
        const orbit = orbitRef.current;
        if (orbit) {
          orbit.style.transform = `scale(0.98) rotateX(${p.pitch}deg) rotateZ(${p.yaw}deg)`;
          orbit.style.setProperty("--nyaw", `${-p.yaw}deg`);
          orbit.style.setProperty("--npitch", `${-p.pitch}deg`);
        }
      }}
      onPointerUp={() => {
        pose.current.dragging = false;
        pose.current.lastTouch = performance.now();
      }}
      onPointerCancel={() => {
        pose.current.dragging = false;
        pose.current.lastTouch = performance.now();
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={orbitRef}
          className="relative w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `scale(0.98) rotateX(${REST.pitch}deg)`,
          }}
        >
          {/* Beneath the surface: the pipelines. The ground is translucent
              glass; under it, the same loop runs as glowing conduit with
              flow pulsing through, junction nodes under every station, and
              light-risers carrying each station's signal up to the surface. */}
          <div
            className="absolute inset-x-0 top-0 bottom-14 overflow-hidden rounded-2xl ring-1 ring-cyan-400/15"
            style={{ transform: "translateZ(-64px)" }}
          >
            <svg
              viewBox="-150 -14 1070 428"
              preserveAspectRatio="xMidYMin slice"
              className="block h-full w-full"
              aria-hidden
            >
              <rect x="-150" y="-14" width="1070" height="428" fill="#081119" />
              <rect x="-150" y="-14" width="1070" height="428" fill="url(#hologrid)" opacity="0.75" />
              <path d={INF} fill="none" stroke="rgba(14,165,233,0.4)" strokeWidth="8" />
              <path d="M230,200 H590" fill="none" stroke="rgba(45,212,191,0.3)" strokeWidth="5" />
              <g className="motion-reduce:hidden">
                <path d={INF} fill="none" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" strokeDasharray="10 26" opacity="0.8">
                  <animate attributeName="stroke-dashoffset" from="0" to="-2002" dur="30s" repeatCount="indefinite" />
                </path>
                <path d="M230,200 H590" fill="none" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="8 22" opacity="0.7">
                  <animate attributeName="stroke-dashoffset" from="0" to="-360" dur="9s" repeatCount="indefinite" />
                </path>
              </g>
              {[
                [379, 121], [121, 92], [75, 276], [340, 306], [410, 200],
                [471, 98], [728, 109], [732, 288], [441, 279],
              ].map(([jx, jy]) => (
                <g key={`${jx}-${jy}`}>
                  <circle cx={jx} cy={jy} r="7" fill="rgba(14,165,233,0.25)" />
                  <circle cx={jx} cy={jy} r="3.4" fill="#38bdf8" />
                </g>
              ))}
            </svg>
          </div>

          {/* Ground: the real city, the road, the endless trace. */}
          <div className="overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
            <svg viewBox="-150 -14 1070 428" className="block w-full" aria-hidden>
              <defs>
                <linearGradient id="loopgrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <pattern id="hologrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0 H0 V40" fill="none" stroke="rgba(94,234,212,0.13)" strokeWidth="1" />
                </pattern>
                <radialGradient id="hologlow" cx="0.5" cy="0.5" r="0.95">
                  <stop offset="0%" stopColor="rgba(45,212,191,0.14)" />
                  <stop offset="100%" stopColor="rgba(45,212,191,0)" />
                </radialGradient>
              </defs>
              <rect x="-150" y="-14" width="1070" height="428" fill="#0a1420" fillOpacity="0.48" />
              <rect x="-150" y="-14" width="1070" height="428" fill="url(#hologrid)" />
              <rect x="-150" y="-14" width="1070" height="428" fill="url(#hologlow)" />
              <path d={INF} fill="none" stroke="rgba(56,189,248,0.18)" strokeWidth="10" />
              <path
                d={INF}
                fill="none"
                stroke="rgba(148,222,255,0.35)"
                strokeWidth="1.2"
                strokeDasharray="8 14"
              />
              <path
                ref={traceRef}
                className="motion-reduce:hidden"
                d={INF}
                fill="none"
                stroke="url(#loopgrad)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray="320 1682"
                opacity="0.9"
              />
              {/* The productivity gap: the stretch between hired and
                  productive. The network seals it - an emerald seam that
                  draws itself closed along this arc, again and again. */}
              <path
                d="M728,109 C772,135 778,165 776,200 C778,235 772,262 732,288"
                fill="none"
                stroke="rgba(52,211,153,0.22)"
                strokeWidth="9"
              />
              <path
                className="motion-reduce:hidden"
                d="M728,109 C772,135 778,165 776,200 C778,235 772,262 732,288"
                fill="none"
                stroke="#34d399"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray="215"
                opacity="0.95"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="215;0;0;215"
                  keyTimes="0;0.45;0.92;1"
                  dur="5s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>

          {/* The two worlds: billboarded titles floating over each lobe, so
              they stay upright and legible at every camera angle. */}
          {[
            { x: 35.51, c: "#67e8f9", t: "Students", s: "climb to ready" },
            { x: 69.16, c: "#6ee7b7", t: "Employers", s: "hire on evidence" },
          ].map((w) => (
            <div
              key={w.t}
              className="absolute h-0 w-0"
              style={{ left: `${w.x}%`, top: "50%", transformStyle: "preserve-3d" }}
            >
              <div
                className="text-center"
                style={{
                  transformOrigin: "0 0",
                  transform: `${BILLBOARD} translate(-50%, -50%)`,
                }}
              >
                <span
                  className="block font-display text-xl font-bold tracking-tight"
                  style={{ color: w.c, textShadow: `0 0 18px ${w.c}55, 0 2px 10px rgba(0,0,0,0.9)` }}
                >
                  {w.t}
                </span>
                <span className="mt-0.5 block whitespace-nowrap text-[0.64rem] tracking-[0.14em] text-white/55">
                  {w.s}
                </span>
              </div>
            </div>
          ))}

          {/* The claim, pinned to the seam it describes. */}
          <div
            className="absolute h-0 w-0"
            style={{ left: "86.5%", top: "50%", transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute w-px"
              style={{
                height: "28px",
                background: "linear-gradient(to top, #34d399cc, transparent)",
                transformOrigin: "50% 100%",
                transform: "translate(-50%, -100%) rotateX(-90deg)",
              }}
            />
            <div
              className="absolute whitespace-nowrap rounded-lg border border-emerald-300/50 bg-emerald-950/85 px-3 py-1.5 text-center shadow-[0_0_26px_-4px_rgba(52,211,153,0.55)] backdrop-blur-sm"
              style={{
                transformOrigin: "0 0",
                transform: `${BILLBOARD} translate(-50%, calc(-100% - 26px))`,
              }}
            >
              <span className="block text-[0.62rem] font-bold tracking-[0.16em] text-emerald-200">
                THE PRODUCTIVITY GAP
              </span>
              <span className="block text-[0.7rem] font-semibold text-white">
                closed before day one
              </span>
            </div>
          </div>

          {/* Stations: dot on the ground, light-stem rising, label facing you. */}
          {STATIONS.map((s, idx) => {
            const hot = active === idx;
            return (
            <div
              key={s.l1}
              className="absolute h-0 w-0"
              style={{ left: `${s.x}%`, top: `${s.y}%`, transformStyle: "preserve-3d" }}
            >
              <div
                className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[box-shadow,scale] duration-300 ${hot ? "scale-150" : ""}`}
                style={{
                  background: s.c,
                  boxShadow: hot ? `0 0 18px 5px ${s.c}` : `0 0 10px 2px ${s.c}66`,
                }}
              />
              <div
                className="absolute w-px"
                style={{
                  height: "64px",
                  background: `linear-gradient(to bottom, ${s.c}88, rgba(56,189,248,0.5))`,
                  transformOrigin: "50% 0%",
                  transform: "translate(-50%, 0) rotateX(-90deg)",
                }}
              />
              {!s.below && (
                <div
                  className="absolute w-px"
                  style={{
                    height: `${s.h}px`,
                    background: `linear-gradient(to top, ${s.c}cc, transparent)`,
                    transformOrigin: "50% 100%",
                    transform: "translate(-50%, -100%) rotateX(-90deg)",
                  }}
                />
              )}
              <div
                className="absolute whitespace-nowrap rounded-lg bg-slate-950/80 px-2 py-1 text-center ring-1 ring-white/15 backdrop-blur-sm transition-shadow duration-300"
                style={{
                  boxShadow: hot ? `0 0 0 1.5px ${s.c}cc, 0 10px 28px -8px ${s.c}88` : undefined,
                  transformOrigin: "0 0",
                  transform: s.below
                    ? `${BILLBOARD} translate(calc(-50% + ${s.dx}px), ${s.h}px) translateZ(70px)`
                    : `${BILLBOARD} translate(calc(-50% + ${s.dx}px), calc(-100% - ${s.h - 2}px))`,
                }}
              >
                <span className="block text-[0.68rem] font-semibold leading-tight" style={{ color: s.c }}>
                  {s.l1}
                </span>
                <span className="block text-[0.68rem] font-semibold leading-tight" style={{ color: s.c }}>
                  {s.l2}
                </span>
              </div>
            </div>
            );
          })}

          {/* The guide-bot, flying the loop above the road. */}
          <div
            ref={shadowRef}
            className="absolute h-2 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 blur-[2px] motion-reduce:hidden"
            style={{ left: "52.34%", top: "50%" }}
          />
          <div
            ref={botRef}
            className="absolute h-0 w-0 motion-reduce:hidden"
            style={{ left: "52.34%", top: "50%", transformStyle: "preserve-3d" }}
          >
            <div
              style={{
                transformOrigin: "0 0",
                transform: `${BILLBOARD} translate(-50%, calc(-100% - 16px))`,
              }}
            >
              <svg width="26" height="34" viewBox="0 0 26 34" aria-hidden className="animate-float">
                <line x1="13" y1="9" x2="13" y2="4" stroke="#9fb6c9" strokeWidth="1.5" />
                <circle cx="13" cy="3" r="2.2" fill="#34d399">
                  <animate attributeName="opacity" values="1;0.35;1" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="3" cy="22" r="2.4" fill="#cfe4f2" />
                <circle cx="23" cy="22" r="2.4" fill="#cfe4f2" />
                <rect x="4" y="9" width="18" height="19" rx="8" fill="#eaf6ff" stroke="#8fa8bb" strokeWidth="1" />
                <rect x="6.5" y="12.5" width="13" height="8" rx="4" fill="#0d1826" />
                <g fill="#5eead4">
                  <circle cx="10" cy="16.5" r="1.6" />
                  <circle cx="16" cy="16.5" r="1.6" />
                  <animate
                    attributeName="opacity"
                    values="1;1;0.1;1;1"
                    keyTimes="0;0.9;0.93;0.96;1"
                    dur="3.4s"
                    repeatCount="indefinite"
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
