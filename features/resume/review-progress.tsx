"use client";

// The progress strip shown while a review is running.

import { useEffect, useState } from "react";
const REVIEW_STEPS = [
  "Reading your resume the way a recruiter would…",
  "Checking it against what this role asks for…",
  "Looking for what a screening system would miss…",
  "Weighing it against the usual bar for the role…",
  "Writing your feedback…",
];

export function ReviewProgress() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, REVIEW_STEPS.length - 1)),
      2600,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <ul aria-hidden className="grid gap-2.5">
        {REVIEW_STEPS.map((label, i) => {
          const done = i < step;
          const now = i === step;
          return (
            <li key={label} className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center">
                {done ? (
                  <span className="text-[0.9rem] font-bold text-teal-700">
                    ✓
                  </span>
                ) : now ? (
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-violet-deep motion-reduce:animate-none" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </span>
              <span
                className={`text-[0.85rem] leading-relaxed ${
                  done
                    ? "text-slate-500"
                    : now
                      ? "font-semibold text-brand-ink"
                      : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {REVIEW_STEPS[step]}
      </p>
      <p className="mt-4 rounded-xl bg-slate-100 px-3.5 py-2.5 text-[0.8rem] leading-relaxed text-slate-600">
        This takes a few seconds. Stay on this page - your feedback opens here
        as soon as it is ready.
      </p>
    </div>
  );
}
