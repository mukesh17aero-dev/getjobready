"use client";

import { useState } from "react";
import { Check } from "@/components/icons";

// Three ways to reach what you already made, drawn against the resume
// builder because it has the most of it. Everything here applies unchanged to
// readiness sittings, interviews, job fit checks and practice answers - they
// are all "a tool, and the things it made before".

type Shape = "tabs" | "rail" | "records";

const SHAPES: Array<{
  id: Shape;
  name: string;
  line: string;
  good: string[];
  bad: string[];
  recommended?: boolean;
}> = [
  {
    id: "tabs",
    name: "1 · Two tabs above the tool",
    line: "A segmented control at the top: Build, or Your resumes (4). One is showing at a time.",
    good: [
      "Smallest change - the list already exists, it only moves",
      "Identical on a phone and a laptop, and costs no width",
      "The count is visible from the first frame, so nobody has to discover it",
    ],
    bad: [
      "You cannot see the old ones while working on a new one",
      "Two tabs is a weak signal next to a page-sized form",
      "Says nothing about what is in the list until you press it",
    ],
  },
  {
    id: "rail",
    name: "2 · A rail with two entries",
    line: "The same two choices, but as a side rail that stays on screen while you work.",
    good: [
      "Always visible, so the past never falls off the page",
      "Matches the story rail on the home page - one idea, learned once",
      "Room to say how many and how recent",
    ],
    bad: [
      "A rail with two rows in it is a lot of width for two rows",
      "Still one at a time - the list replaces the tool",
    ],
  },
  {
    id: "records",
    name: "3 · The rail is the list",
    line: "The rail holds the records themselves. Press one to open it beside the tool; press New to start another.",
    recommended: true,
    good: [
      "The work is on screen while you work - the point of a side rail",
      "Reads as a shelf of your own things rather than a menu",
      "One press to reopen, one press to start a new one",
      "The same rail fits sittings, interviews and fit checks unchanged",
    ],
    bad: [
      "Needs a collapse for somebody who only wants the tool",
      "On a phone it has to fold to a strip above the tool",
      "Long lists need a cap and a 'see all'",
    ],
  },
];

type Record = {
  role: string;
  when: string;
  state: "Downloaded" | "Draft";
};

const RECORDS: Record[] = [
  { role: "Customer Success Associate", when: "yesterday", state: "Draft" },
  { role: "Operations Coordinator", when: "3 days ago", state: "Downloaded" },
  { role: "General resume", when: "last week", state: "Downloaded" },
  { role: "Relationship Executive", when: "2 weeks ago", state: "Downloaded" },
];

export function WorkRail() {
  const [shape, setShape] = useState<Shape>("records");
  const chosen = SHAPES.find((s) => s.id === shape)!;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Preview · not a shipped screen
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        Getting back to what you already made
      </h1>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        Every feature that produces something keeps the old ones, and every one
        of them puts that list at the foot of the page under the tool. On a
        phone that is three screens below the fold - so the commonest thing a
        returning person wants is the hardest thing on the page to reach.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SHAPES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setShape(s.id)}
            className={`min-h-11 cursor-pointer rounded-full border px-4 text-[0.84rem] font-semibold transition-colors ${
              shape === s.id
                ? "border-brand-teal bg-brand-teal/10 text-brand-ink"
                : "border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {s.name}
            {s.recommended && (
              <span className="ml-1.5 text-[0.68rem] font-bold uppercase tracking-wide text-brand-teal-deep dark:text-brand-teal-soft">
                rec
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[0.88rem] leading-relaxed text-slate-600">
        {chosen.line}
      </p>

      <h2 className="mt-5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Laptop · 1280 × 720
      </h2>
      <Box w={1280} h={720} fit={1024}>
        <Page shape={shape} wide />
      </Box>

      <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <Notes title="Gains" items={chosen.good} tone="good" />
        <Notes title="Costs" items={chosen.bad} tone="bad" />
      </div>

      <h2 className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Phone · 360 × 640
      </h2>
      <Box w={360} h={640} fit={360}>
        <Page shape={shape} />
      </Box>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
          If you want a recommendation
        </h2>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Three.</strong> A rail whose only
          job is to hold two links is a lot of screen for two links. Put the
          records in it and the width earns itself: you can see the four resumes
          you have built while you build the fifth, which is the actual reason
          to want a side rail rather than a tab.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          It also collapses the same way the story rail on the home page does -
          to a spine with the count on it - so somebody who came only to build
          gets the full width back, and the two rails in the product behave
          identically.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Where it goes.</strong> The resume
          builder first, because it has the most records. Then the readiness
          sittings, the interviews, the job fit checks and the practice answers
          - all four are the same shape, and all four currently bury their
          history at the bottom of the page.
        </p>
        <p className="mt-3 max-w-2xl text-[0.86rem] leading-relaxed text-slate-500">
          One thing to decide: whether the rail shows on a first visit. With no
          records it would be an empty column beside a form. I would hide it
          entirely until there is at least one, so it appears as a consequence
          of having made something.
        </p>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- pieces */

function Notes({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad";
}) {
  return (
    <div>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-400">
        {title}
      </p>
      <ul className="mt-1 grid gap-1 text-[0.84rem] leading-snug text-slate-600">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span
              aria-hidden
              className={tone === "good" ? "text-brand-teal" : "text-slate-300"}
            >
              {tone === "good" ? "+" : "−"}
            </span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Box({
  w,
  h,
  fit,
  children,
}: {
  w: number;
  h: number;
  fit: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-slate-300">
      <div
        style={{ width: w, height: h, zoom: Math.min(1, fit / w) }}
        className="relative overflow-y-auto bg-brand-mist"
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- the page */

function Page({ shape, wide }: { shape: Shape; wide?: boolean }) {
  const [at, setAt] = useState<"new" | number>("new");
  const [tab, setTab] = useState<"build" | "past">("build");

  return (
    <div className={wide ? "px-8 py-6" : "px-4 py-4"}>
      <p className="text-[0.7rem] font-semibold text-slate-400">
        &larr; Back to Professional Presence
      </p>
      <h1 className="mt-1 font-display text-[1.35rem] font-bold text-brand-ink">
        Resume Builder
      </h1>

      {shape === "tabs" && (
        <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-surface p-1">
          {(
            [
              ["build", "Build"],
              ["past", `Your resumes (${RECORDS.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`min-h-9 cursor-pointer rounded-full px-4 text-[0.8rem] font-semibold transition-colors ${
                tab === id
                  ? "bg-brand-teal-deep text-white"
                  : "text-slate-500 hover:text-brand-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div
        className={`mt-4 gap-4 ${
          wide && shape !== "tabs"
            ? "grid grid-cols-[17rem_minmax(0,1fr)] items-start"
            : "grid"
        }`}
      >
        {shape === "rail" && <TwoEntryRail at={tab} onPick={setTab} />}
        {shape === "records" && <RecordRail at={at} onPick={setAt} />}

        <div className="min-w-0">
          {shape === "tabs" && tab === "past" ? (
            <Ledger />
          ) : shape === "rail" && tab === "past" ? (
            <Ledger />
          ) : shape === "records" && at !== "new" ? (
            <Sheet record={RECORDS[at]!} />
          ) : (
            <Form />
          )}
        </div>
      </div>

      {shape === "tabs" && tab === "build" && (
        <div className="mt-6 opacity-60">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
            &darr; and the list still lives down here today
          </p>
        </div>
      )}
    </div>
  );
}

function TwoEntryRail({
  at,
  onPick,
}: {
  at: "build" | "past";
  onPick: (v: "build" | "past") => void;
}) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-surface p-3">
      <ul className="grid gap-1.5">
        {(
          [
            ["build", "Build a resume", "A new one, for any role"],
            [
              "past",
              `Your resumes (${RECORDS.length})`,
              "Newest built yesterday",
            ],
          ] as const
        ).map(([id, head, sub]) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onPick(id)}
              className={`w-full cursor-pointer rounded-xl px-3 py-2.5 text-left transition-colors ${
                at === id ? "bg-brand-teal/10" : "hover:bg-slate-50"
              }`}
            >
              <span className="block text-[0.84rem] font-semibold text-brand-ink">
                {head}
              </span>
              <span className="block text-[0.74rem] text-slate-500">{sub}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function RecordRail({
  at,
  onPick,
}: {
  at: "new" | number;
  onPick: (v: "new" | number) => void;
}) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-surface p-3">
      <button
        type="button"
        onClick={() => onPick("new")}
        className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-[0.84rem] font-bold transition-colors ${
          at === "new"
            ? "bg-brand-violet text-white"
            : "text-brand-violet-deep hover:bg-slate-50"
        }`}
      >
        <span aria-hidden className="text-[1rem] leading-none">
          +
        </span>
        Build a new resume
      </button>

      <div className="mt-3 flex items-baseline justify-between px-1">
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400">
          Yours so far
        </p>
        <span className="text-[0.7rem] font-semibold text-slate-400">
          {RECORDS.length}
        </span>
      </div>
      <ul className="mt-1.5 grid gap-1">
        {RECORDS.map((r, i) => (
          <li key={r.role}>
            <button
              type="button"
              onClick={() => onPick(i)}
              className={`w-full cursor-pointer rounded-xl px-3 py-2 text-left transition-colors ${
                at === i
                  ? "bg-brand-teal/10 ring-1 ring-brand-teal/40"
                  : "hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    r.state === "Downloaded" ? "bg-brand-teal" : "bg-slate-300"
                  }`}
                />
                <span className="min-w-0 flex-1 truncate text-[0.8rem] font-semibold text-brand-ink">
                  {r.role}
                </span>
              </span>
              <span className="mt-0.5 block pl-3 text-[0.7rem] text-slate-400">
                {r.state} · {r.when}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 border-t border-slate-200 pt-2 px-1 text-[0.72rem] font-semibold text-slate-400 underline underline-offset-2">
        Hide this
      </p>
    </aside>
  );
}

function Form() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4">
      <p className="text-[0.9rem] font-semibold text-brand-ink">
        What are we building?
      </p>
      <div className="mt-2 h-11 rounded-xl border border-slate-300" />
      <p className="mt-4 text-[0.9rem] font-semibold text-brand-ink">
        Where are you right now?
      </p>
      <div className="mt-2 flex gap-2">
        <span className="rounded-full border border-slate-300 px-3 py-1.5 text-[0.78rem] text-slate-500">
          Still studying
        </span>
        <span className="rounded-full border border-slate-300 px-3 py-1.5 text-[0.78rem] text-slate-500">
          Working
        </span>
      </div>
      <div className="mt-5 h-12 w-48 rounded-full bg-brand-teal-deep" />
    </div>
  );
}

function Sheet({ record }: { record: Record }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.9rem] font-semibold text-brand-ink">
          {record.role}
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[0.68rem] font-bold text-teal-800">
          <Check size={10} />
          {record.state} · {record.when}
        </span>
      </div>
      <div className="mt-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="h-3 w-1/3 rounded bg-slate-300" />
        <div className="mt-3 grid gap-1.5">
          {[95, 80, 88, 70, 84, 60].map((w, i) => (
            <div
              key={i}
              style={{ width: `${w}%` }}
              className="h-1.5 rounded-full bg-slate-200"
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-lg bg-brand-teal-deep px-3.5 py-2 text-[0.78rem] font-bold text-white">
          Download
        </span>
        <span className="rounded-lg border border-slate-300 px-3.5 py-2 text-[0.78rem] font-bold text-slate-600">
          Work on it
        </span>
      </div>
    </div>
  );
}

function Ledger() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4">
      <p className="text-[0.9rem] font-semibold text-brand-ink">
        Your previous resumes
      </p>
      <div className="mt-2.5 grid gap-2">
        {RECORDS.map((r) => (
          <div
            key={r.role}
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-slate-200 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[0.88rem] font-semibold text-brand-ink">
                {r.role}
              </p>
              <p className="text-[0.72rem] text-slate-400">
                {r.state} {r.when}
              </p>
            </div>
            <span className="rounded-lg bg-brand-teal-deep px-3 py-1.5 text-[0.74rem] font-bold text-white">
              Open
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
