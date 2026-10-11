"use client";

import { useRef, type KeyboardEvent } from "react";
import { AUDIENCES, audienceConfig, type Audience } from "./config";
import s from "./welcome-hero.module.css";

// The three doors, as a tab list: arrow keys move between them, Home and
// End jump, and the selected one is the only tab stop so the header is one
// press to get past.

export function AudienceSelector({
  value,
  onChange,
}: {
  value: Audience;
  onChange: (next: Audience) => void;
}) {
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? AUDIENCES.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : AUDIENCES.length - 1)) % AUDIENCES.length;
    onChange(AUDIENCES[next]!);
    tabs.current[next]?.focus();
  };
  return (
    <div className={s.selector} role="tablist" aria-label="Who Ascend is for">
      {AUDIENCES.map((id, index) => (
        <button
          key={id}
          ref={(node) => {
            tabs.current[index] = node;
          }}
          type="button"
          role="tab"
          id={`audience-tab-${id}`}
          aria-selected={value === id}
          aria-controls="welcome-hero-panel"
          tabIndex={value === id ? 0 : -1}
          onClick={() => onChange(id)}
          onKeyDown={(event) => onKey(event, index)}
        >
          {audienceConfig[id].label}
        </button>
      ))}
    </div>
  );
}
