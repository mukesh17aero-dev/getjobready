// The three matches, forming in front of you.
//
// Discovery's payoff is three named roles, but mid-run they are silhouettes:
// blurred skeleton cards that sharpen as the run progresses. Every answer
// visibly does something to the thing you came for — the screen stops being
// a form and becomes a picture developing.
//
// Two signals drive the developing, and the further-along one wins: the
// engine's confidence (which can sit still while it thinks) and the answer
// count against the ten-question ceiling (which moves on every single
// answer). The tiles must never make a liar of the screen by standing still
// while a person is doing the work.
//
// Violet, not teal: nothing here is earned yet — Ascend is guiding.
//
// Purely decorative: progress is spoken in words by the bar above, so the
// tiles are hidden from assistive tech and the caption carries the only text.

const TILES = [0, 1, 2] as const;

// The survey's ceiling, mirrored from the backend's stop rule. Only pacing
// depends on it — if the cap drifts, the tiles pace slightly wrong, nothing
// more.
const MAX_QUESTIONS = 10;

export function MatchForming({
  confidence,
  answered,
}: {
  confidence: number;
  answered: number;
}) {
  const pace = Math.min(100, (answered / MAX_QUESTIONS) * 100);
  const drive = Math.max(confidence, pace);
  return (
    <div className="mt-6">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-slate-400">
        Your three matches, forming
      </p>
      <div aria-hidden className="mt-2 grid grid-cols-3 gap-2.5">
        {TILES.map((i) => {
          // The strongest match develops first: each tile trails the one
          // before it, so the row reads as a ranking even while faceless.
          const formed =
            Math.max(0, Math.min(100, drive * 1.15 - i * 12)) / 100;
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-surface p-3"
            >
              {/* A band of light passes over each tile when an answer lands —
                  the developing picture reacting to it. Keyed on the count so
                  it replays once per answer, staggered across the row. */}
              {answered > 0 && (
                <span
                  key={answered}
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 animate-sweep bg-gradient-to-r from-transparent via-brand-violet/20 to-transparent"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              )}
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                Match {i + 1}
              </p>
              <div
                className="mt-2 transition-[filter,opacity] duration-700 motion-reduce:transition-none"
                style={{
                  filter: `blur(${(1 - formed) * 5}px) grayscale(${1 - formed})`,
                  opacity: 0.35 + formed * 0.65,
                }}
              >
                <span className="block h-8 w-8 rounded-full bg-brand-violet/30" />
                <span className="mt-2 block h-2 w-3/4 rounded-full bg-slate-300" />
                <span className="mt-1.5 block h-2 w-1/2 rounded-full bg-slate-200" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
