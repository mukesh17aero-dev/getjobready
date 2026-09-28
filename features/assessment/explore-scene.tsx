"use client";

import { useState } from "react";

// A small hand-drawn scene shown once, before the first question: three
// tappable objects and the buddy who already exists in every sitting's data
// (run.buddy) but, until now, was only ever a name inside scene text. Purely
// flavour - nothing here is scored or required, same discipline as the rest
// of this feature: decoration never becomes a dependency the assessment
// needs to work, and nothing here claims to be evidence of anything.
//
// Hand-drawn SVG, not an illustration library or an image asset - the stack
// forbids the first and there is no art pipeline in this product for the
// second (Simulation's own render pipeline only produces flat slide-to-video,
// confirmed while planning this). A visible dot plus a larger transparent
// hit circle underneath, because 5px of visual dot is not a 44px tap target.

const HOTSPOTS = [
  { id: "board", x: 41, y: 30, label: "The noticeboard", clue: "Reminders for the week. Worth a glance on a real first day, too." },
  { id: "laptop", x: 128, y: 54, label: "The laptop", clue: "Today's messages are waiting - you'll be reading real ones like it soon." },
  { id: "desk", x: 85, y: 96, label: "The desk", clue: "Somebody's been here before you. The situations ahead are just as ordinary." },
] as const;

export function ExploreScene({ buddy }: { buddy: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = HOTSPOTS.find((h) => h.id === openId) ?? null;
  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  return (
    <div className="assessment-explore">
      <svg
        viewBox="0 0 200 120"
        className="assessment-explore-scene"
        role="img"
        aria-label="A small illustrated office with a desk, a noticeboard and a laptop"
      >
        <rect x="4" y="4" width="192" height="112" rx="10" className="assessment-explore-room" />
        {/* Noticeboard */}
        <rect x="24" y="14" width="34" height="26" rx="3" className="assessment-explore-shape" />
        <path d="M30 22h22M30 28h16M30 34h20" className="assessment-explore-line" />
        {/* Desk */}
        <rect x="48" y="78" width="72" height="8" rx="2" className="assessment-explore-shape" />
        <path d="M54 86v14M114 86v14" className="assessment-explore-line" />
        {/* Laptop */}
        <path d="M104 42h28v18h-28z" className="assessment-explore-shape" />
        <path d="M100 60h36l-4 6h-28z" className="assessment-explore-shape" />
        {HOTSPOTS.map((h) => (
          <g key={h.id} transform={`translate(${h.x} ${h.y})`}>
            <circle
              r="18"
              className="assessment-explore-hit"
              tabIndex={0}
              role="button"
              aria-label={h.label}
              aria-pressed={openId === h.id}
              onClick={() => toggle(h.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(h.id);
                }
              }}
            />
            <circle
              r="5"
              aria-hidden="true"
              className={`assessment-explore-dot${openId === h.id ? " is-open" : ""}`}
            />
          </g>
        ))}
      </svg>
      <div className="assessment-explore-buddy">
        <span className="assessment-explore-avatar" aria-hidden="true">
          {buddy.slice(0, 1).toUpperCase()}
        </span>
        <p className="assessment-explore-speech" role="status">
          {open ? (
            <>
              <strong>{open.label}.</strong> {open.clue}
            </>
          ) : (
            <>Hi, I&rsquo;m {buddy}. Tap around the desk, then we&rsquo;ll get started.</>
          )}
        </p>
      </div>
    </div>
  );
}
