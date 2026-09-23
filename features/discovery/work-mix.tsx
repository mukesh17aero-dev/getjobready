import type { RoleDetail } from "@/lib/api";

// Where the working hours actually go, as shares rather than a fake clock —
// a student comparing two roles cares about the mix, not the timestamps.
const TONES = [
  "bg-brand-violet",
  "bg-brand-teal",
  "bg-amber-400",
  "bg-indigo-400",
];

// The same tones as CSS values, for the ring: a conic gradient cannot take a
// class name, and the ring and its legend must never disagree.
const TONE_VALUES = [
  "var(--color-brand-violet)",
  "var(--color-brand-teal)",
  "var(--color-amber-400)",
  "var(--color-indigo-400)",
];

export function WorkMix({ mix }: { mix: RoleDetail["workMix"] }) {
  // A ring, drawn in CSS: the stack has no chart library and a share of a
  // day needs none. The number is the accessible content; the ring is a
  // picture of it, which is why it is one image with a label rather than
  // something a screen reader has to walk.
  const stops = mix.reduce<{ at: number; segments: string[] }>(
    (acc, part, i) => {
      const to = Math.min(100, acc.at + part.share);
      return { at: to, segments: [...acc.segments, `${TONE_VALUES[i % TONE_VALUES.length]} ${acc.at}% ${to}%`] };
    },
    { at: 0, segments: [] },
  );
  const segments = stops.at < 100 ? [...stops.segments, `var(--color-slate-200) ${stops.at}% 100%`] : stops.segments;

  return (
    <div className="grid items-center gap-5 sm:grid-cols-[10.5rem_minmax(0,1fr)]">
      <div
        role="img"
        aria-label={`Share of working hours: ${mix.map((m) => `${m.label} ${m.share} percent`).join(", ")}`}
        className="mx-auto grid h-40 w-40 place-items-center rounded-full"
        style={{ background: `conic-gradient(${segments.join(", ")})` }}
      >
        <div className="grid h-[7.4rem] w-[7.4rem] place-content-center rounded-full bg-surface text-center">
          <span className="text-[1.3rem] font-semibold leading-none text-slate-900">A day</span>
          <span className="mt-1 text-[0.72rem] text-slate-500">in this role</span>
        </div>
      </div>

      <ul className="grid gap-2.5">
        {mix.map((part, i) => (
          <li key={part.label} className="flex gap-2.5">
            <span
              aria-hidden
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONES[i % TONES.length]}`}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[0.85rem] font-semibold text-slate-900">
                  {part.label}
                </span>
                <span className="text-[0.85rem] font-semibold tabular-nums text-slate-700">
                  {part.share}%
                </span>
              </span>
              <span className="block text-[0.78rem] leading-snug text-slate-500">
                {part.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
