import type { FitAxis } from "@/lib/api";

// The two figures on the job fit dashboard, drawn by hand in SVG - there is
// no chart library in this repo and these do not warrant one.
//
// The ring is readiness against one posting. The label under it says so in
// words, every time it is drawn, because a number beside a job advert is read
// as a chance of being hired unless something stops it.
//
// The radar puts what somebody has done beside what this kind of posting
// tends to want. The grey shape is the job, not a target we set for them, and
// every axis has a `basis` line naming the rows it was counted from.

export function ReadinessRing({ value }: { value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-28 w-28 sm:h-32 sm:w-32"
      role="img"
      aria-label={`Readiness for this posting: ${value} out of 100`}
    >
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="rgb(226 232 240)"
        strokeWidth="12"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="rgb(13 148 136)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="57"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-900 text-[26px] font-bold"
      >
        {value}
      </text>
      <text
        x="60"
        y="78"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-400 text-[9px] font-bold uppercase"
      >
        of 100
      </text>
    </svg>
  );
}

function polygon(values: number[], radius: number, cx: number, cy: number) {
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
      const r = (v / 100) * radius;
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    })
    .join(" ");
}

export function FitRadar({ axes }: { axes: FitAxis[] }) {
  // Three axes is the fewest that reads as a shape rather than a triangle by
  // accident; below that the chart is drawn as bars by the caller.
  if (axes.length < 3) return null;
  const R = 70;
  const cx = 110;
  const cy = 96;
  return (
    <svg
      viewBox="0 0 220 192"
      className="mx-auto h-auto w-full max-w-[15rem]"
      role="img"
      aria-label={axes
        .map((a) => `${a.label}: you ${a.you} of 100, this job wants ${a.need}`)
        .join("; ")}
    >
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={polygon(
            axes.map(() => 100 * ring),
            R,
            cx,
            cy,
          )}
          fill="none"
          stroke="rgb(203 213 225)"
          strokeWidth="1"
        />
      ))}
      {axes.map((a, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        return (
          <line
            key={a.label}
            x1={cx}
            y1={cy}
            x2={cx + R * Math.cos(angle)}
            y2={cy + R * Math.sin(angle)}
            stroke="rgb(203 213 225)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={polygon(
          axes.map((a) => a.need),
          R,
          cx,
          cy,
        )}
        fill="rgb(148 163 184 / 0.3)"
        stroke="rgb(100 116 139)"
        strokeWidth="1.5"
      />
      <polygon
        points={polygon(
          axes.map((a) => a.you),
          R,
          cx,
          cy,
        )}
        fill="rgb(13 148 136 / 0.28)"
        stroke="rgb(13 148 136)"
        strokeWidth="2"
      />
      {axes.map((a, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        return (
          <text
            key={a.label}
            x={cx + (R + 19) * Math.cos(angle)}
            y={cy + (R + 19) * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-500 text-[9px] font-bold"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
