"use client";

import { isOpen, type Feature } from "./marketing-features";

// The journey as a line, the way a language app draws a course: the stages in
// the order they are meant to be walked, with the ones you can actually start
// filled in and the rest visibly waiting.
//
// It selects rather than navigates. Clicking a stage shows you what it is in
// the panel below - which is the point of a landing page, and stops the line
// from being seven links to five places that are not built.
//
// Wider than a phone, so it scrolls inside its own box rather than pushing the
// page sideways.

export function JourneyLine({
  features,
  selectedId,
  onSelect,
}: {
  features: Feature[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const openCount = features.filter(isOpen).length;

  return (
    <section aria-label="The journey, stage by stage" className="mt-6">
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <ol className="flex min-w-max items-start sm:min-w-0">
          {features.map((feature, i) => {
            const open = isOpen(feature);
            const on = feature.id === selectedId;
            return (
              <li key={feature.id} className="contents">
                {i > 0 && (
                  // Always neutral. A teal connector would read as a path you
                  // had walked, and this line shows what is open, not what you
                  // have finished - colouring it would claim progress nobody
                  // has made.
                  <span
                    aria-hidden
                    className="mt-[1.15rem] h-0.5 w-6 shrink-0 rounded-full bg-slate-200 sm:w-auto sm:flex-1"
                  />
                )}
                <button
                  type="button"
                  onClick={() => onSelect(feature.id)}
                  aria-current={on ? "step" : undefined}
                  className="flex w-[5.6rem] shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal sm:w-auto sm:min-w-0 sm:flex-1"
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full border text-[0.75rem] font-bold transition-colors ${
                      open
                        ? "border-brand-teal bg-brand-teal text-white"
                        : "border-slate-300 bg-surface text-slate-500"
                    } ${on ? "ring-4 ring-brand-teal/25" : ""}`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-center text-[0.75rem] leading-tight ${
                      on
                        ? "font-bold text-brand-ink"
                        : open
                          ? "font-medium text-slate-600"
                          : "text-slate-500"
                    }`}
                  >
                    {feature.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Said plainly, because a line of seven circles reads as seven things
          you can do, and right now it is not. */}
      <p className="mt-1 text-[0.78rem] text-slate-500">
        {openCount} of {features.length} stages are open today. The rest are
        listed so you can see where this goes — tap any stage to read what it
        will do.
      </p>
    </section>
  );
}
