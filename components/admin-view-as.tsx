"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Audience } from "@/components/audience-hero";

// Admin-only: look at the home page as any of the three audiences.
//
// A native <select> rather than a row of buttons. It is one control instead of
// three, it collapses to the width of the longest word, and it comes with
// keyboard handling, a real mobile picker and screen-reader semantics that a
// hand-built menu would have to earn back line by line.
//
// It still says Admin, and it still names whose screen you are on. The failure
// mode of a view-as control is forgetting it is on and mistaking somebody
// else's screen for your own, so the label is not decoration.
//
// Students never see this. The server decides that - ?as= is ignored for
// everybody who is not an admin, so it cannot be reached by guessing the URL.

const VIEWS: Array<{ id: Audience; label: string }> = [
  { id: "student", label: "Student" },
  { id: "college", label: "College" },
  { id: "employer", label: "Employer" },
];

export function AdminViewAs() {
  const router = useRouter();
  const asParam = useSearchParams().get("as");
  const current: Audience =
    asParam === "college" || asParam === "employer" ? asParam : "student";

  return (
    // Light on purpose. This sits in the header of every page an admin opens,
    // and a boxed, filled, high-contrast control there competes with the page
    // it is describing. It only has to be legible enough to be noticed - the
    // failure mode is forgetting it is on, and a small teal word does that
    // without shouting.
    <div className="inline-flex shrink-0 items-center gap-1.5">
      <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-brand-teal-deep">
        Admin
      </span>

      <label className="flex items-center gap-1 text-[0.75rem] text-slate-400">
        {/* The words go first when the bar is tight; the tag and the picker
            are the parts that carry the meaning. */}
        <span className="hidden lg:inline">Viewing as</span>
        <span className="relative">
          <select
            value={current}
            onChange={(e) => {
              const next = e.target.value as Audience;
              router.push(next === "student" ? "/" : `/?as=${next}`);
            }}
            className="cursor-pointer appearance-none rounded-md border border-transparent bg-transparent py-0.5 pl-1 pr-5 text-[0.75rem] font-semibold text-slate-500 outline-none transition-colors hover:text-brand-ink focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal/25"
          >
            {VIEWS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          {/* The chevron the appearance-none reset removed. */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="pointer-events-none absolute right-0.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </label>
    </div>
  );
}
