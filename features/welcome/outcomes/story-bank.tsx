"use client";

// Worked outputs: the interview story bank.

// ---------------------------------------------------------- story bank
// The three screens the Story Bank walkthrough describes. The sample stories
// are the same ones a signed-out visitor sees on the page itself, so the
// panel and the product cannot drift apart.

import { Check } from "@/components/ui/icons";
/** The question list: what they ask, and whether you have anything for it. */
export function StoryQuestions() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex gap-1 border-b border-slate-200 pb-1.5">
        <span className="rounded-t px-2 py-1 text-[0.75rem] font-bold text-slate-500">
          My stories (2)
        </span>
        <span className="border-b-2 border-brand-teal-deep px-2 py-1 text-[0.75rem] font-bold text-brand-ink">
          What they will ask (14)
        </span>
      </div>
      <ul className="mt-2 grid gap-1.5">
        {[
          {
            q: "A customer asks for something the policy does not allow.",
            meta: "HR round · Handling conflict",
            have: "You would tell: The refund I could not give",
            chip: "Proven",
            tone: "bg-teal-50 text-teal-800",
            cta: "Build another",
            solid: false,
          },
          {
            q: "Give me an example of a mistake you made.",
            meta: "HR round · Taking ownership",
            have: "Whether you can name a real one.",
            chip: "Nothing yet",
            tone: "bg-slate-100 text-slate-600",
            cta: "Build a story",
            solid: true,
          },
          {
            q: "How do you go about picking up a system you have never used?",
            meta: "HR round · Learning quickly",
            have: "Whether you have a method, or you just hope.",
            chip: "Nothing yet",
            tone: "bg-slate-100 text-slate-600",
            cta: "Build a story",
            solid: true,
          },
        ].map((r) => (
          <li
            key={r.q}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[0.75rem] font-bold uppercase tracking-wide text-slate-500">
                {r.meta}
              </span>
              <span className="block text-[0.76rem] font-semibold leading-snug text-brand-ink">
                {r.q}
              </span>
              <span className="block text-[0.75rem] leading-snug text-slate-500">
                {r.have}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.75rem] font-bold uppercase tracking-wide ${r.tone}`}
            >
              {r.chip}
            </span>
            <span
              className={`shrink-0 rounded-md px-2 py-1 text-[0.75rem] font-bold ${
                r.solid
                  ? "bg-brand-teal-deep text-white"
                  : "border border-slate-300 text-brand-ink"
              }`}
            >
              {r.cta}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The drafter, mid-refusal: it fills what it can and names what it will not. */
export function StoryDrafter() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        Building a story for
      </p>
      <p className="text-[0.8rem] font-bold leading-snug text-brand-ink">
        Give me an example of a mistake you made.
      </p>

      <div className="mt-2 rounded-lg border border-slate-200 p-2.5">
        <p className="text-[0.78rem] font-bold text-brand-ink">
          The two tickets I filed wrong
        </p>
        <dl className="mt-1.5 grid gap-1.5">
          {[
            [
              "Situation",
              "Mid-shift, two tickets went onto the wrong customer account.",
              true,
            ],
            [
              "Task",
              "Left blank on purpose — your record does not say, and I am not going to make it up.",
              false,
            ],
            [
              "Action",
              "I spotted it at the next handover, flagged it myself rather than waiting to be asked, and corrected both.",
              true,
            ],
            [
              "Result",
              "Left blank on purpose — I know what you did, not what happened afterwards.",
              false,
            ],
          ].map(([label, text, filled]) => (
            <div
              key={label as string}
              className="border-l-2 border-brand-violet/35 pl-2"
            >
              <dt className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                {label}
              </dt>
              <dd
                className={`mt-0.5 text-[0.75rem] leading-snug ${
                  filled ? "text-slate-700" : "italic text-amber-800"
                }`}
              >
                {text}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-1.5 text-[0.75rem] text-slate-500">
          Drawn from: Busy shift simulation
        </p>
      </div>

      <p className="mt-2 rounded-lg bg-brand-mist px-2.5 py-2 text-[0.75rem] leading-snug text-slate-600">
        Read it, then say it out loud once in your own words. A story you have
        only read is a script.
      </p>
      <span className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-brand-teal-deep px-3 text-[0.75rem] font-bold text-white">
        <Check size={11} />I have said it — keep it
      </span>
    </div>
  );
}

/** The bank itself: one open, the rest collapsed, each marked for what it is. */
export function StoryGrid() {
  return (
    <div className="grid gap-2">
      <div className="rounded-xl border-2 border-brand-violet/50 bg-surface p-3">
        <p className="text-[0.75rem] font-bold uppercase tracking-wide text-brand-violet-deep">
          Handling conflict
        </p>
        <p className="mt-0.5 text-[0.82rem] font-bold leading-snug text-brand-ink">
          The refund I could not give
        </p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {[
            [
              "Situation",
              "She wanted a refund eleven days in, after someone else quoted her fourteen.",
            ],
            [
              "Task",
              "Hold the policy without making her feel she had been lied to.",
            ],
            [
              "Action",
              "I said the earlier answer had been wrong and apologised for that specifically.",
            ],
            ["Result", "She took the credit note and stayed."],
          ].map(([label, text]) => (
            <div key={label} className="rounded-lg bg-brand-mist p-2">
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                {label}
              </p>
              <p className="mt-0.5 text-[0.75rem] leading-snug text-slate-700">
                {text}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[0.75rem] font-bold uppercase tracking-wide text-teal-800 ring-1 ring-inset ring-teal-600/25">
            Proven
          </span>
          <span className="text-[0.75rem] text-slate-500">
            Customer Success interview · HR round
          </span>
        </div>
      </div>

      {[
        {
          comp: "Working under pressure",
          title: "The Saturday I ran the counter alone",
          line: "Sixty customers between eleven and four, and no billing errors.",
          chip: "Yours, unproven",
          tone: "bg-amber-50 text-amber-900 ring-amber-600/25",
          from: "Your experience, as you told us",
        },
        {
          comp: "Taking ownership",
          title: "The two tickets I filed wrong",
          line: "Spotted it at handover and flagged it myself.",
          chip: "Not said yet",
          tone: "bg-slate-100 text-slate-600 ring-slate-400/25",
          from: "Busy shift simulation",
        },
      ].map((c) => (
        <div
          key={c.title}
          className="rounded-xl border border-slate-200 bg-surface p-2.5"
        >
          <p className="text-[0.75rem] font-bold uppercase tracking-wide text-brand-violet-deep">
            {c.comp}
          </p>
          <p className="mt-0.5 text-[0.78rem] font-bold leading-snug text-brand-ink">
            {c.title}
          </p>
          <p className="mt-0.5 text-[0.75rem] leading-snug text-slate-500">
            {c.line}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.75rem] font-bold uppercase tracking-wide ring-1 ring-inset ${c.tone}`}
            >
              {c.chip}
            </span>
            <span className="text-[0.75rem] text-slate-500">{c.from}</span>
          </div>
        </div>
      ))}
      <p className="text-[0.75rem] text-slate-500">
        Example — yours would be written from your own record.
      </p>
    </div>
  );
}
