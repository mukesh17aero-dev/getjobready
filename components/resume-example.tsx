"use client";

import { useState } from "react";
import { ResumeOutcome } from "@/components/feature-outcome";

// What a finished build looks like, for somebody who has not made one.
//
// The builder already previews the layout with placeholder text, which shows
// the shape of the document and nothing about the part that is actually hard
// to picture: the read the AI gives back afterwards. That is the thing worth
// deciding on before spending fifteen minutes, so it is shown here in full -
// keywords found, problems named with the reason a filter cares, strengths,
// gaps with fixes, and where the resume stands.
//
// Rendered by the same ResumeSheet and A4Frame the builder uses, from the
// same AtsCheck and ResumeReview shapes the API returns. Nothing here is an
// approximation of the product.
//
// It sits at the bottom, where the shelf of resumes you have already built
// will sit once you have built any - the same place, in the same shape, so the
// page does not rearrange itself the day somebody's first real one lands
// there. Closed until opened, for the same reason: somebody who came to build
// does not want a worked example in their way.

export function ResumeExample() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mx-auto mb-16 mt-10 max-w-5xl px-4 sm:px-6">
      <h2 className="flex flex-wrap items-center gap-2 text-[0.8rem] font-bold uppercase tracking-wide text-brand-ink">
        What you get afterwards
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-800">
          Example
        </span>
      </h2>
      <p className="mt-1 text-[0.8rem] leading-snug text-slate-500">
        Once you have built one, your own resumes sit here. This is a finished
        example — it belongs to nobody.
      </p>

      <div className="mt-2.5 overflow-hidden rounded-2xl border border-slate-200 bg-surface">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[0.88rem] font-bold text-brand-ink">
              Customer Success Associate
            </span>
            <span className="block text-[0.78rem] text-slate-500">
              Classic layout · 7 keywords matched · 3 things to fix
            </span>
          </span>
          <span
            aria-hidden
            className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>

        {open && (
          <div className="border-t border-slate-200 bg-brand-mist p-4">
            <ResumeOutcome />
          </div>
        )}
      </div>
    </section>
  );
}
