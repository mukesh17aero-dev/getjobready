import type { RoleDetail } from "@/lib/api";

// Where the working hours actually go, as shares rather than a fake clock —
// a student comparing two roles cares about the mix, not the timestamps.
const TONES = [
  "bg-brand-violet",
  "bg-brand-teal",
  "bg-amber-400",
  "bg-indigo-400",
];

export function WorkMix({ mix }: { mix: RoleDetail["workMix"] }) {
  return (
    <div>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={mix.map((m) => `${m.label} ${m.share} percent`).join(", ")}
      >
        {mix.map((part, i) => (
          <span
            key={part.label}
            className={TONES[i % TONES.length]}
            style={{ width: `${part.share}%` }}
          />
        ))}
      </div>

      <ul className="mt-3 grid gap-2">
        {mix.map((part, i) => (
          <li key={part.label} className="flex gap-2.5">
            <span
              aria-hidden
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONES[i % TONES.length]}`}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="text-[0.85rem] font-semibold text-slate-900">
                  {part.label}
                </span>
                <span className="text-[0.78rem] tabular-nums text-slate-500">
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
