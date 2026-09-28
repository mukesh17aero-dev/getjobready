// The product's icons, as inline SVG.
//
// Text glyphs — the arrows, ticks and bullets that were here before — inherit
// the font, so they land at a different weight and baseline on every device and
// they are read aloud by screen readers as punctuation. These are drawn on a
// 24-unit grid at a consistent 2-unit stroke, scale with `size`, and take their
// colour from `currentColor`, so one icon is correct on a white card and on the
// dark panel without a second copy.
//
// Every icon here is decorative: it sits beside a label that already says what
// the control does, so all of them are aria-hidden and never the only cue.

type IconProps = { size?: number; className?: string };

function Svg({
  size = 20,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

export function Check(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

// The empty state of a choice: a ring that fills when picked.
export function Circle(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
    </Svg>
  );
}

// Marks something Ascend noticed. Used wherever the product speaks back.
export function Spark(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="m5.6 5.6 2.8 2.8" />
      <path d="m15.6 15.6 2.8 2.8" />
      <path d="m18.4 5.6-2.8 2.8" />
      <path d="m8.4 15.6-2.8 2.8" />
    </Svg>
  );
}

/** Marks a caption that says what a panel is showing. */
export function Eye(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

// ---- the carousel's own controls ----

export function Pause(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </Svg>
  );
}

export function Play(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 4.5v15l13-7.5Z" />
    </Svg>
  );
}

/** A shift running down. */
export function Clock(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

/** A microphone. Recording a spoken answer, and stopping one. */
export function Mic(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </Svg>
  );
}

/** Bars in ascending order. Putting work in priority order. */
export function Ranking(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20v-4" />
      <path d="M12 20v-9" />
      <path d="M20 20V5" />
    </Svg>
  );
}

/** A 2x2 grid of buckets. Sorting items into groups. */
export function Grid(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </Svg>
  );
}

/** An arrow into a tray. Leaving a handover for someone else. */
export function Handover(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v11" />
      <path d="m8 10 4 4 4-4" />
      <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </Svg>
  );
}

/** A pencil. Writing a typed response. */
export function Pencil(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Svg>
  );
}
