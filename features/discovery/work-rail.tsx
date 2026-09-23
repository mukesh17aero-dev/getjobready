"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Getting back to what a feature made before, without taking width from it.
//
// Every feature that produces something keeps the old ones, and every one of
// them put that list at the FOOT of the page under the tool. On a phone that
// is three screens below the fold, so the commonest thing a returning person
// wants - open the resume I built on Tuesday - was the hardest thing on the
// page to reach.
//
// The first attempt was an in-flow column beside the tool, and it was wrong
// for a plain reason: the resume builder's own layout is already two columns
// (the form and the live page), and a third took the width out of the middle
// of it - the preview ran off the edge of the screen. A shelf that damages
// the thing it sits beside has cost more than it gave.
//
// So it is out of flow entirely: a small control in the page header, and a
// dropdown under it. The layout underneath is untouched at every width, the
// count is visible without opening anything, and on a phone it behaves the
// same way rather than needing its own design.
//
// A dropdown rather than a slide-over panel: two choices do not need a whole
// side of the screen, and a full-height drawer with two rows in it darkens
// the page for something the size of a menu.
//
// Never rendered with an empty shelf. On a first visit there is nothing to
// come back to, and a control that opens an empty drawer is worse than no
// control.

export type ShelfEntry = {
  label: string;
  /** One line under it: how many, how recent. Never a count on its own. */
  sub: string;
};

export function WorkShelf({
  make,
  keep,
  at,
  onPick,
  keepHref,
}: {
  make: ShelfEntry;
  keep: ShelfEntry & { count: number };
  at: "make" | "keep";
  onPick?: (at: "make" | "keep") => void;
  /** When the shelf is a page of its own rather than a pane on this one. */
  keepHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Closes on Escape, and on a press anywhere outside it. Same rules as the
  // other dropdown in the product, so there is one behaviour to learn.
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

  const choose = (next: "make" | "keep") => {
    onPick?.(next);
    setOpen(false);
  };

  return (
    // ml-auto so a long heading beside it pushes the control to the next
    // line and it stays on the right, rather than landing under the heading
    // on the left where it reads as part of the sentence.
    <div ref={box} className="relative ml-auto">
      {/* The control. One line in the page header, so nothing below it moves.
          It names where you are now, and the badge says how many are on the
          shelf - "10" on its own beside "Build a resume" reads as ten builds
          in progress, which is not what it means. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border border-slate-300 bg-surface px-4 text-[0.84rem] font-semibold text-brand-ink transition-colors hover:border-brand-teal/60"
      >
        {at === "keep" ? keep.label : make.label}
        <span className="rounded-full bg-brand-mist px-2 py-0.5 text-[0.72rem] font-bold text-slate-500">
          {keep.count} saved
        </span>
        <span
          aria-hidden
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""} motion-reduce:transition-none`}
        >
          &#9662;
        </span>
      </button>

      {open && (
        <ul
          role="menu"
          aria-label="This page"
          className="absolute right-0 top-full z-40 mt-1.5 w-[min(19rem,80vw)] overflow-hidden rounded-2xl border border-slate-200 bg-surface p-1.5 shadow-lg"
        >
          <li role="none">
            <Row
              entry={make}
              on={at === "make"}
              onClick={() => choose("make")}
            />
          </li>
          <li role="none">
            {keepHref ? (
              <Link
                href={keepHref}
                role="menuitem"
                className="block rounded-xl px-3 py-3 transition-colors hover:bg-slate-50"
              >
                <Label entry={keep} count={keep.count} />
              </Link>
            ) : (
              <Row
                entry={keep}
                count={keep.count}
                on={at === "keep"}
                onClick={() => choose("keep")}
              />
            )}
          </li>
        </ul>
      )}
    </div>
  );
}

function Row({
  entry,
  count,
  on,
  onClick,
}: {
  entry: ShelfEntry;
  count?: number;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      aria-current={on ? "true" : undefined}
      className={`w-full cursor-pointer rounded-xl px-3 py-3 text-left transition-colors ${
        on ? "bg-brand-teal/10 ring-1 ring-brand-teal/40" : "hover:bg-slate-50"
      }`}
    >
      <Label entry={entry} count={count} />
    </button>
  );
}

function Label({ entry, count }: { entry: ShelfEntry; count?: number }) {
  return (
    <>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[0.9rem] font-semibold text-brand-ink">
          {entry.label}
        </span>
        {typeof count === "number" && (
          <span className="shrink-0 rounded-full bg-brand-mist px-2 py-0.5 text-[0.72rem] font-bold text-slate-500">
            {count}
          </span>
        )}
      </span>
      <span className="mt-0.5 block text-[0.78rem] leading-snug text-slate-500">
        {entry.sub}
      </span>
    </>
  );
}
