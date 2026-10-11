"use client";

// The skill web: your scores on one shape, and how everybody else who did this
// work sits behind them.
//
// I argued against a radar and was wrong about the reason, not the risk. The
// risk is real: a radar needs a value on every axis, so a skill nobody
// measured has to be plotted as zero - which says "bad at this" when the truth
// is "not seen" - or dropped, which silently changes the polygon's shape into
// something that looks like a finding. The fix is not to refuse the chart. It
// is to plot ONLY skills that were measured, name the ones that were not
// underneath it, and never let an unmeasured skill contribute a point.
//
// Below three measured skills there is no polygon to draw - two axes make a
// line - so the caller falls back to bars.
//
// Hand-drawn SVG. The stack has no chart library and this is trigonometry.

export type WebAxis = {
  skill: string;
  /** This person's score, 0-100. */
  score: number;
};

/**
 * A line drawn behind theirs. `source` decides how it looks: a measured band
 * gets a solid edge, an illustrative one gets a dashed one and a caption that
 * says so, because the difference between "this is what people score" and
 * "this is roughly the level" has to survive being glanced at.
 */
export type WebBand = {
  id: string;
  label: string;
  source: "measured" | "illustrative";
  /** Per-skill values, keyed by skill. Empty means flat at `flat`. */
  scores: Record<string, number>;
  flat: number;
  cohort?: number;
};

const BAND_STYLE: Record<string, { stroke: string; fill: string; swatch: string }> = {
  // The fallback, for a band whose id has no style of its own.
  plain: {
    stroke: "stroke-slate-500",
    fill: "fill-transparent",
    swatch: "border-slate-500 bg-slate-500/20",
  },
  ascendPractised: {
    stroke: "stroke-brand-teal-deep",
    fill: "fill-brand-teal/[0.07]",
    swatch: "border-brand-teal-deep bg-brand-teal/20",
  },
  sixMonths: {
    stroke: "stroke-indigo-500",
    fill: "fill-transparent",
    swatch: "border-indigo-500 bg-indigo-400/15",
  },
  employerBar: {
    stroke: "stroke-amber-600",
    fill: "fill-transparent",
    swatch: "border-amber-600 bg-amber-500/15",
  },
};

const SIZE = 300;
const MID = SIZE / 2;
const R = 96;
// Room either side for the labels at three and nine o'clock, which are
// anchored outside the ring and were cut off on a phone-width drawing.
const PAD = 48;

/** Where a value on one axis lands. Twelve o'clock, then clockwise. */
function point(i: number, of: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * i) / of - Math.PI / 2;
  const r = (Math.max(0, Math.min(100, value)) / 100) * R;
  return [MID + r * Math.cos(angle), MID + r * Math.sin(angle)];
}

const polygon = (values: number[]) =>
  values.map((v, i) => point(i, values.length, v).join(",")).join(" ");

export function SkillWeb({
  axes,
  bands = [],
}: {
  axes: WebAxis[];
  /** Reference lines, drawn behind theirs in the order given. */
  bands?: WebBand[];
}) {
  if (axes.length < 3) return null;
  const valuesOf = (band: WebBand) =>
    axes.map((a) => band.scores[a.skill] ?? band.flat);

  return (
    <figure className="m-0">
      <svg
        viewBox={`${-PAD} 0 ${SIZE + PAD * 2} ${SIZE}`}
        className="mx-auto h-auto w-full max-w-sm"
        role="img"
        aria-label={`Your scores: ${axes
          .map((a) => `${a.skill} ${a.score}`)
          .join(", ")}.${bands
          .map(
            (b) =>
              ` ${b.label}${b.source === "illustrative" ? " (illustrative)" : ""}: ${valuesOf(
                b,
              )
                .map((v, i) => `${axes[i]!.skill} ${v}`)
                .join(", ")}.`,
          )
          .join("")}`}
      >
        {/* The rings, at 25 point intervals, so a shape can be read off the
            grid rather than guessed at. */}
        {[25, 50, 75, 100].map((ring) => (
          <polygon
            key={ring}
            points={polygon(axes.map(() => ring))}
            className="fill-none stroke-slate-200"
            strokeWidth={1}
          />
        ))}
        {axes.map((a, i) => {
          const [x, y] = point(i, axes.length, 100);
          return (
            <line
              key={a.skill}
              x1={MID}
              y1={MID}
              x2={x}
              y2={y}
              className="stroke-slate-200"
              strokeWidth={1}
            />
          );
        })}

        {/* Reference lines first, so they sit behind theirs. An illustrative
            band is dashed - the same shape drawn two ways, so the difference
            between measured and stand-in survives a glance. */}
        {bands.map((band) => {
          const style = BAND_STYLE[band.id] ?? BAND_STYLE.plain!;
          return (
            <polygon
              key={band.id}
              points={polygon(valuesOf(band))}
              className={`${style.fill} ${style.stroke}`}
              strokeWidth={1.5}
              strokeDasharray={band.source === "illustrative" ? "5 4" : undefined}
            />
          );
        })}

        <polygon
          points={polygon(axes.map((a) => a.score))}
          className="fill-brand-violet/20 stroke-brand-violet"
          strokeWidth={2}
        />
        {axes.map((a, i) => {
          const [x, y] = point(i, axes.length, a.score);
          return (
            <circle
              key={a.skill}
              cx={x}
              cy={y}
              r={3}
              className="fill-brand-violet"
            />
          );
        })}

        {/* Labels ride just outside the outer ring, and lean left or right so
            they never sit on top of the shape. */}
        {axes.map((a, i) => {
          const [x, y] = point(i, axes.length, 128);
          const anchor =
            Math.abs(x - MID) < 12 ? "middle" : x > MID ? "start" : "end";
          return (
            <text
              key={a.skill}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-slate-500 text-[12px]"
            >
              {a.skill.length > 22 ? `${a.skill.slice(0, 21)}…` : a.skill}
            </text>
          );
        })}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.78rem] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-violet" />
          You
        </span>
        {bands.map((band) => {
          const style = BAND_STYLE[band.id] ?? BAND_STYLE.plain!;
          return (
            <span key={band.id} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm border ${style.swatch}`} />
              {band.label}
              {band.cohort !== undefined ? ` (${band.cohort})` : ""}
              {band.source === "illustrative" && (
                <span className="rounded-full bg-amber-50 px-1.5 text-[0.75rem] font-bold uppercase tracking-wide text-amber-700">
                  illustrative
                </span>
              )}
            </span>
          );
        })}
      </figcaption>
    </figure>
  );
}
