// Two charts the read-out did not have before: a trend across attempts, and
// a breakdown of how much of what was written actually had something in it.
// Both drawn as SVG - no chart library, matching the rest of the stack - and
// both built from fields the API already returns. Nothing here is a new
// measurement; it is an existing one drawn instead of narrated.

import { clamp, TONE, toneOf } from "./assessment-readout-visuals";

/**
 * Readiness across this person's attempts at this role. Absent below two
 * finished sittings - a trend needs two points, and one point is just the
 * score the hero ring already shows.
 */
export function Trend({
  points,
}: {
  points: Array<{ label: string; score: number }>;
}) {
  if (points.length < 2) return null;
  const w = 320;
  const h = 96;
  const pad = 14;
  const stepX = (w - pad * 2) / (points.length - 1);
  const xy = (i: number, score: number): [number, number] => [
    pad + i * stepX,
    pad + (1 - clamp(score) / 100) * (h - pad * 2),
  ];
  const last = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const delta = last.score - prev.score;
  const deltaTone = delta > 0 ? TONE.strong : delta < 0 ? TONE.early : TONE.developing;

  return (
    <div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
        Readiness across your attempts
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-2 w-full max-w-sm"
        role="img"
        aria-label={`Readiness by attempt: ${points
          .map((p) => `${p.label} ${p.score}`)
          .join(", ")}`}
      >
        <polyline
          points={points.map((p, i) => xy(i, p.score).join(",")).join(" ")}
          fill="none"
          stroke="var(--color-brand-teal-deep)"
          strokeWidth={2}
        />
        {points.map((p, i) => {
          const [x, y] = xy(i, p.score);
          const isLast = i === points.length - 1;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isLast ? 5 : 3.5}
              fill={TONE[toneOf(p.score)].ring}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[0.7rem] text-slate-400">
        {points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
      <p className={`mt-1.5 text-[0.85rem] font-semibold ${deltaTone.text}`}>
        {delta > 0 ? `+${delta}` : delta} since your last attempt
      </p>
    </div>
  );
}

export type DonutSegment = { label: string; value: number; color: string };

/**
 * A proportion, drawn as a ring built from stroke-dasharray - two or three
 * segments, never more (a donut earns its place only for a small count of
 * categories; more than that is a bar chart's job). Never colour alone: the
 * legend beside it repeats every label and count in text.
 */
export function Donut({
  segments,
  size = 108,
}: {
  segments: DonutSegment[];
  size?: number;
}) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  const r = size / 2 - 9;
  const circumference = 2 * Math.PI * r;
  let cursor = 0;
  const arcs = segments.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const dash = frac * circumference;
    const arc = { ...s, dash, offset: -cursor };
    cursor += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-slate-200)"
          strokeWidth={9}
        />
        {total > 0 &&
          arcs.map((a) => (
            <circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={9}
              strokeDasharray={`${a.dash} ${circumference - a.dash}`}
              strokeDashoffset={a.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ))}
      </svg>
      <ul className="grid gap-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[0.8rem] text-slate-600">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: s.color }}
            />
            {s.label}: <strong className="font-semibold text-slate-900">{s.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
