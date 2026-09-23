import type { RoleDetail } from "@/lib/api";

// Career and pay progression as a column chart: one bar per step, height in
// proportion to monthly pay. The solid part is the floor of the band, the
// lighter cap is the range up to the ceiling — so both the jump between
// steps and the spread within a step are visible at a glance.
const money = (n: number) => `₹${Math.round(n / 1000)}K`;

const TONES = [
  { solid: "bg-brand-violet", cap: "bg-brand-violet/35" },
  { solid: "bg-brand-teal", cap: "bg-brand-teal/35" },
  { solid: "bg-brand-teal-deep", cap: "bg-brand-teal-deep/35" },
];

const CHART_HEIGHT = 132;

export function PayProgression({ growth }: { growth: RoleDetail["growth"] }) {
  const ceiling = Math.max(...growth.map((s) => s.pay.max));
  const px = (value: number) => Math.round((value / ceiling) * CHART_HEIGHT);

  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div
        className="flex items-end gap-3"
        style={{ height: CHART_HEIGHT + 26 }}
        role="img"
        aria-label={growth
          .map(
            (s) =>
              `${s.title}, ${s.when}: ${money(s.pay.min)} to ${money(s.pay.max)} per month`,
          )
          .join("; ")}
      >
        {growth.map((step, i) => {
          const tone = TONES[i % TONES.length]!;
          return (
            <div key={step.title} className="flex flex-1 flex-col items-center">
              <span className="mb-1 text-[0.7rem] font-semibold tabular-nums text-slate-600">
                {money(step.pay.min)}–{money(step.pay.max)}
              </span>
              <div
                className="flex w-full max-w-20 flex-col justify-end overflow-hidden rounded-t-md"
                style={{ height: CHART_HEIGHT }}
              >
                <span
                  className={`w-full rounded-t-md ${tone.cap}`}
                  style={{ height: px(step.pay.max) - px(step.pay.min) }}
                />
                <span
                  className={`w-full ${tone.solid}`}
                  style={{ height: px(step.pay.min) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex gap-3 border-t border-slate-200 pt-2">
        {growth.map((step, i) => (
          <div key={step.title} className="flex-1 text-center">
            <p className="text-[0.72rem] font-semibold leading-tight text-slate-900">
              {step.title}
            </p>
            <p className="text-[0.66rem] text-slate-400">{step.when}</p>
            {i === 0 && (
              <p className="mt-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-brand-violet">
                you start here
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
