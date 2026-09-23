"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Audience } from "./audience-hero";

// The audience switch: one wide segmented control at the top of the welcome
// screen, carrying the full name of each audience rather than one word.
//
// It is deliberately the largest control on the sheet. On the front door,
// saying who you are is the only decision there is to make, and a switch this
// size is one nobody has to go looking for. It lived in the header briefly and
// was wrong there - the labels had to shrink to two cramped lines, and the
// filled segment ended up louder than the page's one real action.
//
// Links rather than state: the sheets below the hero are server-rendered and
// each belongs to one audience, so the choice has to live in the URL for them
// to see it. That also makes a tab shareable and the back button work. The
// active audience is resolved on the server and handed down, so this needs no
// useSearchParams and therefore no Suspense boundary.

const TABS: Array<{ id: Audience; label: string }> = [
  { id: "student", label: "Students & early professionals" },
  { id: "college", label: "Colleges & universities" },
  { id: "employer", label: "Employers hiring & talent teams" },
];

export function AudienceTabs({ active }: { active: Audience }) {
  const pathname = usePathname();

  return (
    <div className="relative">
      {/* The light under the switch. Decorative, and behind rather than
          inside, so it never washes out the label on the live segment. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-[34rem] max-w-full -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(ellipse,rgba(94,234,212,0.22),transparent_70%)] blur-2xl"
      />

      {/* No label above the switch. Three named audiences in a segmented
          control already say what the control is for, and a line of caption
          over it was just pushing the whole sheet down. */}
      <div
        role="tablist"
        aria-label="Who are you?"
        className="relative mx-auto flex w-full max-w-3xl flex-col gap-1 rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-1.5 backdrop-blur sm:flex-row sm:rounded-full"
      >
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <Link
              key={t.id}
              href={t.id === "student" ? pathname : `${pathname}?for=${t.id}`}
              scroll={false}
              role="tab"
              aria-selected={on}
              className={`flex-1 rounded-xl px-4 py-3 text-center text-[0.88rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-teal)] sm:rounded-full ${
                on
                  ? "bg-[#5eead4] font-semibold text-[#06231f] shadow-[0_8px_28px_-8px_rgba(94,234,212,0.55)]"
                  : "text-[var(--lp-body)] hover:bg-white/5 hover:text-[var(--lp-ink)]"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
