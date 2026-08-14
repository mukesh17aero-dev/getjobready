// Small scene illustrations for picture-choice questions.
//
// Drawn rather than sourced: an external illustration set is a licence, a
// download and a house style that is not ours, and emoji at this size read as
// clip art. These are built from circles and rounded rectangles on a 96×72
// grid, in two tones — a soft brand-tinted fill and a darker line — so four of
// them side by side look like one family rather than four stock images.
//
// They are decorative. Every card that carries one also carries its label in
// text, so nothing here is the only way to understand the choice.

type SceneProps = { className?: string; style?: React.CSSProperties };

function Frame({ children, className }: SceneProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 96 72"
      className={className}
      fill="none"
    >
      {children}
    </svg>
  );
}

// Shared parts, so every figure in the set is the same person.
function Person({
  x,
  y,
  tone,
  scale = 1,
}: {
  x: number;
  y: number;
  tone: string;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="0" cy="0" r="6.5" className={tone} />
      <path d="M-11 22c0-7 5-12 11-12s11 5 11 12Z" className={tone} />
    </g>
  );
}

const VIOLET = "fill-brand-violet";
const VIOLET_SOFT = "fill-brand-violet/30";
const TEAL = "fill-brand-teal";
const TEAL_SOFT = "fill-brand-teal/30";

/** Two people across a counter — the customer-facing choice. */
export function SceneCounter({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <rect x="6" y="46" width="84" height="6" rx="3" className={VIOLET_SOFT} />
      <Person x={28} y={24} tone={VIOLET} />
      <Person x={68} y={26} tone={TEAL} scale={0.92} />
      <rect x="42" y="38" width="14" height="9" rx="2" className={VIOLET_SOFT} />
    </Frame>
  );
}

/** One person in front of two others — the coordinating choice. */
export function SceneTeam({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <rect x="6" y="52" width="84" height="5" rx="2.5" className={TEAL_SOFT} />
      <Person x={24} y={30} tone={VIOLET_SOFT} scale={0.85} />
      <Person x={72} y={30} tone={VIOLET_SOFT} scale={0.85} />
      <Person x={48} y={22} tone={TEAL} />
    </Frame>
  );
}

/** A screen with a rising line — the numbers choice. */
export function SceneScreen({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <rect x="18" y="10" width="60" height="40" rx="4" className={VIOLET_SOFT} />
      <path
        d="M28 40l10-9 8 6 12-15"
        className="stroke-brand-teal"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="42" y="50" width="12" height="8" rx="1.5" className={VIOLET_SOFT} />
      <rect x="30" y="58" width="36" height="4" rx="2" className={VIOLET} />
    </Frame>
  );
}

/** A person at a desk with a book — where most of this starts. */
export function SceneStudent({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <rect x="10" y="50" width="76" height="5" rx="2.5" className={VIOLET_SOFT} />
      <Person x={38} y={22} tone={VIOLET} />
      <rect
        x="52"
        y="38"
        width="26"
        height="14"
        rx="2"
        className={TEAL_SOFT}
        transform="rotate(-8 65 45)"
      />
      <rect
        x="56"
        y="42"
        width="18"
        height="2.5"
        rx="1.25"
        className={TEAL}
        transform="rotate(-8 65 45)"
      />
    </Frame>
  );
}

/** Stacked cartons — the organising choice. */
export function SceneStock({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <rect x="10" y="34" width="26" height="24" rx="3" className={TEAL_SOFT} />
      <rect x="40" y="24" width="26" height="34" rx="3" className={VIOLET_SOFT} />
      <rect x="70" y="40" width="18" height="18" rx="3" className={TEAL_SOFT} />
      <rect x="19" y="34" width="8" height="9" rx="1.5" className={TEAL} />
      <rect x="49" y="24" width="8" height="9" rx="1.5" className={VIOLET} />
      <rect x="6" y="58" width="84" height="5" rx="2.5" className={VIOLET_SOFT} />
    </Frame>
  );
}

/**
 * The issuing stamp on a Readiness Passport.
 *
 * A passport data page without a stamp is a form; with one it is a document
 * somebody signed off. It sits at an angle and overlaps the photo, the way a
 * real one does, because a stamp squarely inside its own box looks printed
 * rather than pressed.
 */
export function AscendStamp({ className, style }: SceneProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
    >
      <defs>
        {/* The arc the top line of text runs along. */}
        <path id="ascend-stamp-arc" d="M 18 52 A 32 32 0 0 1 82 52" />
      </defs>

      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2.5" />
      <circle
        cx="50"
        cy="50"
        r="38"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      <text
        fill="currentColor"
        fontSize="11"
        fontWeight="700"
        letterSpacing="3.4"
      >
        <textPath href="#ascend-stamp-arc" startOffset="50%" textAnchor="middle">
          ASCEND
        </textPath>
      </text>

      {/* The mark: the rising chevron the wordmark uses. */}
      <path
        d="M38 52l12-15 12 15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <text
        x="50"
        y="66"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        fontWeight="700"
        letterSpacing="1.2"
      >
        READINESS
      </text>
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fill="currentColor"
        fontSize="6.5"
        letterSpacing="0.8"
      >
        14 AUG 2026
      </text>
    </svg>
  );
}
