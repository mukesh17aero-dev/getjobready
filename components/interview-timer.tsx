// The interview clock: honest, visible, and calm. A quiet ring that empties
// as the timebox spends itself — it states the time rather than dramatising
// it. Colour shifts only in the last minute, and assistive tech hears one
// label, not a tick every second.

const RADIUS = 23;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function InterviewTimer({
  secondsLeft,
  totalSeconds,
  compact = false,
}: {
  secondsLeft: number;
  totalSeconds: number;
  /** Smaller ring for slim bars; the reading and behaviour are identical. */
  compact?: boolean;
}) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const closing = secondsLeft <= 60;
  const share =
    totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0;
  const box = compact ? "h-11 w-11" : "h-16 w-16";

  return (
    <div
      className={`relative grid ${box} shrink-0 place-items-center`}
      role="timer"
      aria-live="off"
      aria-label={`${minutes} minutes ${seconds} seconds left`}
    >
      <svg viewBox="0 0 56 56" className={`${box} -rotate-90`} aria-hidden>
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          fill="none"
          strokeWidth="4"
          className="stroke-slate-200"
        />
        <circle
          cx="28"
          cy="28"
          r={RADIUS}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - share)}
          className={`transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none ${
            closing ? "stroke-amber-700" : "stroke-brand-teal-deep"
          }`}
        />
      </svg>
      <span
        className={`absolute font-mono font-bold tabular-nums ${
          compact ? "text-[0.6rem]" : "text-[0.7rem]"
        } ${closing ? "text-amber-700" : "text-brand-ink"}`}
      >
        {minutes}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
