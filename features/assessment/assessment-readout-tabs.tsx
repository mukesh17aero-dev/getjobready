"use client";

// A small accessible tab shell for the read-out. Not a library primitive -
// four sections of one report, so the default view can be small and visual
// and the dense analysis only appears once somebody asks for it, instead of
// every section sitting open in one long scroll regardless of whether
// anyone wanted to read it yet.
//
// Only the active panel's content is mounted. A skill list left expanded
// inside an unmounted tab is not state worth preserving across a switch -
// simpler to remount fresh than to carry hidden DOM for four panels at once.

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TabDef = { id: string; label: string; content: ReactNode };

export function Tabs({
  tabs,
  label,
}: {
  tabs: TabDef[];
  /** What this whole tab group is a set of views onto, for screen readers. */
  label: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (delta: number) => {
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    if (next) {
      setActive(next.id);
      buttons.current[next.id]?.focus();
    }
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(-1);
    }
  };

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                buttons.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`readout-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`readout-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={onKeyDown}
              className={`-mb-px shrink-0 cursor-pointer whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-2.5 text-[0.85rem] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                selected
                  ? "border-brand-teal-deep text-brand-ink"
                  : "border-transparent text-slate-500 hover:text-brand-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {current && (
        <div
          role="tabpanel"
          id={`readout-panel-${current.id}`}
          aria-labelledby={`readout-tab-${current.id}`}
          className="pt-5"
        >
          {current.content}
        </div>
      )}
    </div>
  );
}
