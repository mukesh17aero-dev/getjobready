"use client";

import { ChevronRight } from "./icons";

// A collapsible section built on <details>, so open/closed state lives in the
// DOM rather than React: it survives re-renders while typing, and keyboard and
// screen-reader behaviour comes for free.
//
// Anything interactive in the header (a delete button) must stop the click
// reaching the summary, or pressing it would also toggle the panel.

export function Collapsible({
  summary,
  aside,
  defaultOpen = false,
  children,
}: {
  summary: React.ReactNode;
  // Sits at the right of the header, outside the toggling area.
  aside?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-surface"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none">
          <ChevronRight size={16} />
        </span>
        <span className="min-w-0 flex-1">{summary}</span>
        {aside && (
          <span
            className="shrink-0"
            onClick={(e) => {
              // The header toggles; controls inside it do their own job.
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {aside}
          </span>
        )}
      </summary>
      <div className="border-t border-slate-100 px-4 py-3">{children}</div>
    </details>
  );
}
