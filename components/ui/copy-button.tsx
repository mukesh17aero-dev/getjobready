"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Copy one section to the clipboard.
//
// The profile is written here and lives on LinkedIn, so every section somebody
// will paste across gets its own copy control. Section by section rather than
// one button for the lot, because LinkedIn is edited field by field - a single
// "copy everything" leaves them cutting a blob apart in a textarea.
//
// Two things worth doing properly:
//
//   Say it worked. A copy with no feedback gets pressed three times, and the
//   person still does not know. The label changes to "Copied" for two seconds
//   and the change is announced.
//
//   Fail out loud. The clipboard API needs a secure context and permission,
//   and it does refuse. Silent failure means somebody pastes the last thing
//   they copied into their headline.

export function CopyButton({
  value,
  label,
  className = "",
}: {
  /** The exact text to put on the clipboard. */
  value: string;
  /** What is being copied, for the screen-reader label: "Copy headline". */
  label: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2200);
  }, [value]);

  if (!value.trim()) return null;

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={state === "done" ? `${label} copied` : `Copy ${label}`}
      className={`inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[0.72rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
        state === "done"
          ? "text-teal-700"
          : state === "failed"
            ? "text-amber-800"
            : "text-slate-400 hover:bg-slate-100 hover:text-brand-ink"
      } ${className}`}
    >
      {state === "done" ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      )}
      {/* Announced rather than only shown - the icon alone changing colour
          tells somebody using a screen reader nothing at all. */}
      <span aria-live="polite">
        {state === "done" ? "Copied" : state === "failed" ? "Blocked" : "Copy"}
      </span>
    </button>
  );
}
