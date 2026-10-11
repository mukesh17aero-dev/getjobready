// The small presentational pieces the read-out is built from: the tone a
// score gets coloured by, the ring/gauge that draws it, the quote highlight,
// and the plain titled panel. Split out of assessment-readout.tsx so that
// file stays under the size ceiling - these are drawing primitives with no
// data fetching of their own, reused wherever a score needs a picture.

export const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * A score is a magnitude, not just a number - the same flat colour on a 12
 * and a 92 tells the eye nothing before it reads a single word. Three bands,
 * used everywhere a score gets drawn on this page, so colour carries the
 * verdict and the words carry the reason.
 */
export type Tone = "strong" | "developing" | "early";
export function toneOf(score: number): Tone {
  return score >= 70 ? "strong" : score >= 40 ? "developing" : "early";
}
export const TONE: Record<
  Tone,
  { ring: string; text: string; bg: string; border: string; label: string }
> = {
  strong: {
    ring: "var(--color-brand-teal-deep)",
    text: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    label: "Strong readiness",
  },
  developing: {
    ring: "var(--color-amber-600)",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Developing readiness",
  },
  early: {
    ring: "var(--color-rose-600)",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    label: "Early-stage readiness",
  },
};

/**
 * Wraps a "quoted phrase" inside a sentence as a small chip, so the exact
 * words this was read from stand out from the analysis around them instead of
 * hiding inside a paragraph. Nothing is removed or shortened - the quote is
 * why this page can be trusted, so it gets more visual weight, not less.
 */
export function Evidence({ text }: { text: string }) {
  const parts = text.split(/("[^"]{2,}")/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('"') && part.endsWith('"') ? (
          <mark
            key={i}
            className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.86em] not-italic text-slate-700"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * One skill as a small ring, for when there are too few measured skills to
 * draw the web (SkillWeb needs three axes - two make a line, not a shape).
 * Same conic-gradient technique as the big readiness Ring, scaled down, so a
 * thin sitting still reads as "a chart" rather than "a flat bar and a
 * paragraph".
 */
export function SkillGauge({ skill, score }: { skill: string; score: number }) {
  const pct = clamp(score);
  const tone = TONE[toneOf(score)];
  return (
    <div className="flex w-28 flex-col items-center gap-2 text-center">
      <div
        role="img"
        aria-label={`${skill}: ${score} out of 100`}
        className="relative h-24 w-24 shrink-0"
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${tone.ring} ${pct}%, var(--color-slate-200) 0)`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-[7px] flex items-center justify-center rounded-full bg-surface"
        >
          <span className={`font-display text-[1.3rem] font-bold leading-none ${tone.text}`}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-[0.8rem] font-medium leading-tight text-slate-700">
        {skill}
      </span>
    </div>
  );
}

/**
 * The readiness score as a ring.
 *
 * A conic gradient and two divs - the stack has no chart library, and this
 * needs none. The number is the accessible content; the ring is a picture of
 * the number, which is why it is one `role="img"` with a label rather than
 * something a screen reader has to walk.
 *
 * Deliberately NOT a radar. A radar plots every skill on its own axis and
 * joins them, which requires a value on every axis - and a skill this sitting
 * never reached has no value. Plotting it as zero says "bad at this" when the
 * truth is "not seen", and dropping the axis silently changes the shape of the
 * polygon into something that looks like a finding. Bars can simply leave a
 * skill out.
 */
export function Ring({ score }: { score: number }) {
  const pct = clamp(score);
  const tone = TONE[toneOf(score)];
  return (
    <div
      role="img"
      aria-label={`Readiness ${score} out of 100`}
      className="relative h-44 w-44 shrink-0"
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${tone.ring} ${pct}%, var(--color-slate-200) 0)`,
        }}
      />
      {/* The disc has to be the card's own colour, not the page's: a surface
          that is nearly right reads as a smudge behind the number. */}
      <div
        aria-hidden
        className="absolute inset-[12px] flex flex-col items-center justify-center rounded-full bg-surface"
      >
        <span className={`font-display text-[2.8rem] font-bold leading-none tracking-tight ${tone.text}`}>
          {score}
        </span>
        <span className="mt-1 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
          of 100
        </span>
      </div>
    </div>
  );
}

/** A titled box. The read-out is panels now, not one long column. */
export function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h2 className="text-[0.9rem] font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      {note && (
        <p className="mt-0.5 text-[0.78rem] leading-relaxed text-slate-500">
          {note}
        </p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}
