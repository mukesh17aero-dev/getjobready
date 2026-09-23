"use client";

// Worked outputs: discovering a direction.

// ------------------------------------------------------------- discovery
// Discovery has no single artefact the way a resume does - it is a question,
// a tour and a shortlist. All three are drawn from the flow's own wording.

import { RoleBrief } from "@/features/discovery";
import { SAMPLE_FIT, SAMPLE_GROWTH, SAMPLE_PAY_NOTE, SAMPLE_VOICE } from "@/features/discovery";
import { PayProgression } from "@/features/discovery";
/** Picking industries, then the questions that narrow them. */
export function DiscoveryIndustries() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.8rem] font-bold text-brand-ink">
        Which of these interest you?
      </p>
      <p className="mt-0.5 text-[0.68rem] text-slate-500">
        Tap as many as you like.
      </p>
      <ul className="mt-2 grid gap-1.5">
        {[
          {
            t: "Retail & Commerce",
            c: "Stores, sales, category, operations",
            g: "\u{1F6CD}\u{FE0F}",
            tint: "244 114 182",
            on: true,
          },
          {
            t: "Logistics & E-commerce",
            c: "Fulfilment, planning, partner ops",
            g: "\u{1F4E6}",
            tint: "45 212 191",
            on: false,
          },
          {
            t: "Customer Operations",
            c: "Support, quality, workforce",
            g: "\u{1F3A7}",
            tint: "167 139 250",
            on: true,
          },
        ].map((w) => (
          <li
            key={w.t}
            className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 ${
              w.on ? "border-brand-teal bg-teal-50/60" : "border-slate-200"
            }`}
          >
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base"
              style={{ background: `rgb(${w.tint} / 0.14)` }}
            >
              {w.g}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.75rem] font-bold leading-tight text-brand-ink">
                {w.t}
              </span>
              <span className="block text-[0.65rem] leading-snug text-slate-500">
                {w.c}
              </span>
            </span>
            <span
              aria-hidden
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                w.on
                  ? "border-brand-teal bg-brand-teal text-white"
                  : "border-slate-300 text-transparent"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
            </span>
          </li>
        ))}
      </ul>
      <span className="mt-2.5 flex min-h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 px-4 text-[0.74rem] font-bold text-white">
        Show me all roles <span aria-hidden>{"\u2192"}</span>
      </span>
    </div>
  );
}

export function DiscoveryShortlist() {
  return (
    <div>
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
        Where you have been
      </p>
      <p className="mt-0.5 font-display text-[1rem] font-bold leading-tight text-brand-ink">
        Did you find your dream role?
      </p>
      <ul className="mt-2 grid gap-2">
        {[
          {
            t: "Customer Success Associate",
            note: "Liked that the whole job is being the one who actually sorts it out.",
            chosen: true,
          },
          {
            t: "Operations Coordinator",
            note: "The stock side sounded fine. The supplier calls did not.",
          },
          {
            t: "Guest Experience Executive",
            note: "Shifts would be the hard part for me.",
          },
        ].map((r) => (
          <li
            key={r.t}
            className="rounded-xl border border-slate-200 bg-surface px-3 py-2.5"
          >
            <p className="text-[0.78rem] font-bold text-brand-ink">{r.t}</p>
            <p className="mt-0.5 text-[0.72rem] leading-snug text-slate-600">
              &ldquo;{r.note}&rdquo;
            </p>
            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[0.68rem] font-bold ${
                r.chosen
                  ? "bg-brand-teal text-white"
                  : "border border-slate-300 text-brand-ink"
              }`}
            >
              {r.chosen ? "Your selected role" : "Choose this role"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[0.66rem] text-slate-400">
        Example — the words would be your own.
      </p>

      {/* And the read-out that comes with the role you pick. The product's own
          component again, so the panel cannot promise a shape the app does not
          produce. */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-surface p-3">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-teal-800">
          Why this role fits you
        </p>
        <div className="mt-1.5">
          <RoleBrief brief={SAMPLE_FIT} />
        </div>
      </div>
    </div>
  );
}

/** The tour stop: a role, the assistant beside it, and the note you leave. */
export function DiscoveryTour() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
      <div className="border-b border-slate-200 bg-brand-mist px-3 py-2">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Stop 2 of 3
        </p>
        <p className="text-[0.85rem] font-bold leading-snug text-brand-ink">
          Operations Coordinator
        </p>
      </div>

      <div className="space-y-2 p-3">
        <div className="rounded-lg bg-brand-mist px-2.5 py-2">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Discovery assistant
          </p>
          <p className="mt-1 text-[0.72rem] leading-snug text-slate-500">
            Ask me whenever you want.
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {["What does good look like here?", "Where does this lead?"].map(
              (q) => (
                <span
                  key={q}
                  className="rounded-full bg-surface px-2 py-0.5 text-[0.65rem] font-semibold text-brand-teal-deep ring-1 ring-inset ring-slate-200"
                >
                  {q}
                </span>
              ),
            )}
          </div>
        </div>

        <div>
          <p className="text-[0.72rem] font-semibold text-brand-ink">
            What do you make of this role?
          </p>
          <p className="mt-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[0.72rem] italic text-slate-400">
            Honestly, what stood out was…
          </p>
        </div>

        <div className="flex gap-1.5">
          <span className="rounded-lg bg-brand-teal-deep px-2.5 py-1.5 text-[0.7rem] font-bold text-white">
            On to the next one
          </span>
          <span className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[0.7rem] font-bold text-slate-500">
            Choose this role
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * A role, as the role page shows it: what it pays now, what it pays later, and
 * somebody who has done it. PayProgression is the product's own chart rather
 * than a drawing of one - the same rule the resume sheet follows.
 */
export function DiscoveryRole() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.82rem] font-bold leading-snug text-brand-ink">
        Customer Success Associate
      </p>
      <p className="text-[0.66rem] text-slate-400">Customer Operations</p>

      <p className="mt-2.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-slate-400">
        Pay and career growth{" "}
        <span className="font-medium normal-case tracking-normal text-slate-400">
          · monthly, indicative
        </span>
      </p>
      <div className="mt-1.5">
        <PayProgression growth={SAMPLE_GROWTH} />
      </div>
      <p className="mt-1.5 text-[0.64rem] leading-snug text-slate-400">
        {SAMPLE_PAY_NOTE}
      </p>

      <p className="mt-3 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-slate-400">
        People doing this job
      </p>
      {/* The warning travels with the quote. An invented person shown without
          it is fabricated social proof, whatever the intention was. */}
      <p className="mt-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[0.63rem] leading-snug text-slate-600">
        <strong className="font-semibold">Illustrative:</strong> a composite
        written from the pay and progression data above, not a real individual.
      </p>
      <div className="mt-1.5 rounded-xl bg-slate-50 p-2.5">
        <p className="text-[0.72rem] italic leading-relaxed text-slate-700">
          &ldquo;{SAMPLE_VOICE.quote}&rdquo;
        </p>
        <p className="mt-1 text-[0.66rem] font-semibold text-slate-700">
          {SAMPLE_VOICE.name}{" "}
          <span className="font-normal text-slate-500">
            · {SAMPLE_VOICE.title}
          </span>
        </p>
        <p className="text-[0.62rem] text-slate-400">{SAMPLE_VOICE.journey}</p>
      </div>
    </div>
  );
}

/** The assistant, mid-tour: a real conversation, not a menu of prompts. */
export function DiscoveryChat() {
  const said = [
    {
      who: "assistant",
      text: "This tells you what the job is. It does not tell you where it goes afterwards, or what the pay does past the first step. Ask me either.",
    },
    { who: "you", text: "What does good look like here?" },
    {
      who: "assistant",
      text: "Closing your own tickets without escalating, and being the one people hand the angry customer to. Both are noticed within a year.",
    },
    { who: "you", text: "Where does this lead?" },
    {
      who: "assistant",
      text: "Team lead is the usual next step, and quality or workforce planning after that. It does not lead into engineering - if that is where you are aiming, this is a detour.",
    },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
      <div className="border-b border-slate-200 bg-brand-mist px-3 py-1.5">
        <span className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-slate-400">
          Stop 2 of 3
        </span>
        <p className="text-[0.78rem] font-bold leading-snug text-brand-ink">
          Operations Coordinator
        </p>
      </div>

      <ol className="grid gap-2 p-3">
        {said.map((line, i) => (
          <li
            key={i}
            className={line.who === "you" ? "flex justify-end" : "flex gap-1.5"}
          >
            {line.who === "assistant" && (
              <span
                aria-hidden
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-violet text-[0.55rem] font-bold text-white"
              >
                A
              </span>
            )}
            <p
              className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[0.71rem] leading-relaxed ${
                line.who === "you"
                  ? "rounded-tr-sm bg-teal-50 text-slate-700"
                  : "rounded-tl-sm border border-slate-200 text-slate-800"
              }`}
            >
              {line.text}
            </p>
          </li>
        ))}
      </ol>

      <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {["What would put me off it?", "What does it pay past year two?"].map(
            (q) => (
              <span
                key={q}
                className="rounded-full border border-slate-300 bg-surface px-2.5 py-1 text-[0.65rem] font-semibold text-slate-700"
              >
                {q}
              </span>
            ),
          )}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <span className="min-h-7 flex-1 rounded-full border border-slate-300 bg-surface px-3 py-1 text-[0.7rem] text-slate-400">
            Ask anything…
          </span>
          <span className="rounded-full border border-slate-300 bg-surface px-3 py-1 text-[0.7rem] font-bold text-slate-700">
            Ask
          </span>
        </div>
      </div>
    </div>
  );
}
