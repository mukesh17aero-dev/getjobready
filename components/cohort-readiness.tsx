// The college exhibit: a year group, by how ready it is.
//
// Colleges were the one audience with a headline and nothing under it. This
// is the picture their page needed - the same argument the employer chart
// makes, told to the person who has to do something about it in March rather
// than in a hiring cycle.
//
// The bands are shaped like a real cohort and labelled as illustrative,
// because no cohort has been run yet. That label is not a formality: a
// placement officer reading an invented percentage as a measured one is
// exactly the harm the product exists to remove.

const BANDS: Array<{ label: string; pct: number; colour: string }> = [
  {
    label: "Ready for the bar employers set",
    pct: 18,
    colour: "#34d399",
  },
  { label: "Close - one or two gaps left", pct: 34, colour: "#5eead4" },
  { label: "Started, a way to go", pct: 31, colour: "rgba(255,255,255,0.32)" },
  { label: "Not started", pct: 17, colour: "rgba(255,255,255,0.16)" },
];

export function CohortReadiness() {
  return (
    <div className="reveal-view mx-auto max-w-3xl rounded-3xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-6 sm:p-8">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-faint)]">
        A year group, by readiness
      </p>
      <p className="mt-2 text-[0.92rem] leading-relaxed text-[var(--lp-body)]">
        Every band is built from work students were scored on, not from what
        they said about themselves - so the number you act on is the number that
        is true.
      </p>
      <ul className="mt-6 grid gap-4">
        {BANDS.map((band) => (
          <li key={band.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[0.92rem] font-semibold text-[var(--lp-body-strong)]">
                {band.label}
              </span>
              <span className="font-display text-[1rem] font-semibold text-[var(--lp-ink)]">
                {band.pct}%
              </span>
            </div>
            <div
              aria-hidden
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/[0.06]"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${band.pct}%`, background: band.colour }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-[var(--lp-border)] pt-3 text-[0.76rem] leading-relaxed text-[var(--lp-faint)]">
        Illustrative shape, not a measured cohort. Your own numbers replace it
        from the first week students are on the platform.
      </p>
    </div>
  );
}
