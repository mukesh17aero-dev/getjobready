"use client";

import { useEffect, useState } from "react";

const PRI_MIN = 300;
const PRI_MAX = 800;
const RADIUS = 80;
const CIRCUMFERENCE = Math.PI * RADIUS;
const ARC_PATH = "M 20 100 A 80 80 0 0 1 180 100";

interface PriDialProps {
  score: number | null;
}

// Semicircular gauge, 300-800. Renders empty and animates to the real
// value on mount so the fill is visibly a transition, not a jump cut.
// Custom SVG rather than a charting dependency — the project has no
// chart/gauge library installed, and a single arc doesn't warrant adding
// one (see Session 9 plan, "avoid unnecessary dependencies").
export function PriDial({ score }: PriDialProps) {
  const clamped =
    score === null ? null : Math.min(PRI_MAX, Math.max(PRI_MIN, score));
  const percent = clamped === null ? 0 : (clamped - PRI_MIN) / (PRI_MAX - PRI_MIN);
  const targetOffset = CIRCUMFERENCE * (1 - percent);

  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    // Defer to the next frame so the browser paints the 0% state first —
    // otherwise the CSS transition has nothing to animate from. The
    // transition itself is disabled for prefers-reduced-motion via the
    // motion-reduce: Tailwind variant below, not JS, so this still just
    // jumps straight to the target for those users.
    const frame = requestAnimationFrame(() => {
      setOffset(targetOffset);
    });
    return () => cancelAnimationFrame(frame);
  }, [targetOffset]);

  const label =
    clamped === null
      ? "Personal Readiness Index: not yet scored"
      : `Personal Readiness Index: ${clamped} out of ${PRI_MAX}`;

  return (
    <div
      className="flex flex-col items-center gap-1"
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 200 110" className="w-full max-w-xs" aria-hidden="true">
        <path
          d={ARC_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          className="text-gray-200"
        />
        <path
          d={ARC_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="text-purple-700 transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
        <text
          x="100"
          y="88"
          textAnchor="middle"
          className="fill-purple-900 text-2xl font-semibold"
        >
          {clamped ?? "—"}
        </text>
      </svg>
      <div className="flex w-full max-w-xs justify-between px-2 text-xs text-gray-500">
        <span>{PRI_MIN}</span>
        <span>{PRI_MAX}</span>
      </div>
      {clamped === null && (
        <p className="text-sm text-gray-500">
          Not yet scored — complete an assessment to get your first score.
        </p>
      )}
    </div>
  );
}
