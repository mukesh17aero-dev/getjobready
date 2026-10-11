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

/** Three lines: opens a menu. */
export function Menu(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Svg>
  );
}

export function Plus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  );
}

export function Close(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </Svg>
  );
}

/** A stack of pages: a list of saved documents. */
export function Files(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 3h7l4 4v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M15 3v4h4" />
      <path d="M4 7v13a1 1 0 0 0 1 1h10" />
    </Svg>
  );
}

export function Briefcase(props: IconProps) {
  return <Svg {...props}><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3" /></Svg>;
}

/** Information: a circle with a dot over a stem. Marks "more about this". */
export function Info(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6h.01" />
    </Svg>
  );
}

/** A circle with an exclamation mark. Something still needed. */
export function Alert(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.4h.01" />
    </Svg>
  );
}

/** Three tiles and a plus. Choosing or adding a layout. */
export function LayoutAdd(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <path d="M17 13.5v7M13.5 17h7" />
    </Svg>
  );
}

/** A hooked arrow back. Undo. */
export function Undo(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </Svg>
  );
}

/** A hooked arrow forward. Redo. */
export function Redo(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </Svg>
  );
}

/** Two four-point stars. Writing help from Ascend. */
export function Sparkle(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 3.5 11.7 8.3 16.5 10 11.7 11.7 10 16.5 8.3 11.7 3.5 10 8.3 8.3Z" />
      <path d="M18 14.5 18.8 16.7 21 17.5 18.8 18.3 18 20.5 17.2 18.3 15 17.5 17.2 16.7Z" />
    </Svg>
  );
}
