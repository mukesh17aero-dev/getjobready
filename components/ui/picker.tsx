"use client";

import { useEffect, useRef, useState } from "react";

// A dropdown that opens below the control.
//
// A native <select> would be less code and is still the right answer almost
// everywhere in this product - it is smaller, and on a phone the operating
// system gives it a proper sheet. The exception is the two places where the
// choice is the first thing on the screen and somebody is looking straight at
// it: on macOS a native select draws its menu OVER the control, aligned so
// the current option covers the thing you just clicked, and no amount of CSS
// reaches that because the popup belongs to the operating system.
//
// So these two get a real listbox, and it lives here rather than being written
// twice - the resume builder asks "what are we building?" and the profile
// builder asks "how should we start?", which is the same control with
// different words.

export type PickerOption<T extends string> = { id: T; label: string };

export function Picker<T extends string>({
  value,
  options,
  onChange,
  label,
  placeholder,
}: {
  value: T;
  options: ReadonlyArray<PickerOption<T>>;
  onChange: (next: T) => void;
  /** Names the control for a screen reader; never shown. */
  label: string;
  /**
   * Shown instead of the current option until somebody has actually chosen.
   *
   * A dropdown that opens on a valid answer has answered for them, and the
   * preview beside it then claims to be showing something they never asked
   * for. With this set the control reads as a question until it is answered.
   */
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!current) return null;

  const move = (by: number) => {
    const at = options.findIndex((o) => o.id === value);
    const next = options[Math.max(0, Math.min(options.length - 1, at + by))];
    if (next) onChange(next.id);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (open) move(1);
            else setOpen(true);
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            if (open) move(-1);
          }
        }}
        className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-300 bg-surface px-3 text-left text-[0.88rem] font-semibold text-brand-ink outline-none focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal/30"
      >
        <span
          className={`min-w-0 truncate ${placeholder ? "font-normal text-slate-500" : ""}`}
        >
          {placeholder ?? current.label}
        </span>
        <span
          aria-hidden
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          &#9662;
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-300 bg-surface shadow-lg"
        >
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2.5 text-left text-[0.88rem] transition-colors ${
                  option.id === value
                    ? "bg-brand-teal/10 font-semibold text-brand-ink"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
