"use client";

import { useState } from "react";
import { Check } from "@/components/icons";

// Three rails, at true size, against a stand-in of today's home page.
//
// Everything in them is drawn from data the app already holds: the seven
// journey stages and their state, the profile's answered count, the chosen
// role, the interested industries. Anything that would need new backend work
// is called out under each option rather than quietly drawn as though it
// existed.

type Shape = "stages" | "story" | "split";

const SHAPES: Array<{
  id: Shape;
  name: string;
  line: string;
  good: string[];
  bad: string[];
  needs: string;
  recommended?: boolean;
}> = [
  {
    id: "stages",
    name: "1 · The seven stages",
    line: "The journey as a checklist: every stage with done, in progress, or what unlocks it.",
    good: [
      "Complete - nothing about the journey is hidden",
      "Says what is locked and why, which the banner strip cannot",
      "Built entirely from stages() - no new data at all",
    ],
    bad: [
      "Four of seven stages are locked for most people, so most of the rail is grey",
      "It is a to-do list, and a to-do list is not a story",
      "Repeats the stage strip already in the banner above it",
    ],
    needs: "Nothing. stages() returns all of this today.",
  },
  {
    id: "story",
    name: "2 · What you have made",
    line: "Only the things that exist: answers on file, the role chosen, the resume built, questions practised.",
    good: [
      "Reads as a record of a person rather than a progress bar",
      "Grows as they do - an empty rail on day one is honest",
      "Every line points at a thing they can open again",
    ],
    bad: [
      "Silent about what is next, so the rail cannot carry the ask",
      "Empty for a new person, which is the moment they need the most help",
      "Needs a date per item to be ordered honestly",
    ],
    needs:
      "Timestamps. The record holds the claims but the home page is not told when each arrived.",
  },
  {
    id: "split",
    name: "3 · The story, then the record",
    line: "Three blocks: your story so far in a sentence, then what is in progress, then what is finished.",
    recommended: true,
    good: [
      "The story is said outright, in words, rather than left to be inferred from a list",
      "In progress and finished are named as such instead of sharing one column",
      "Answers 'who am I here' and 'what have I done' and 'what now' in that order",
      "The top of the rail is never empty, even on day one",
    ],
    bad: [
      "Three headings in a narrow column, so each block has to stay short",
      "The story line needs a rule per fact, or it says nothing on day one",
      "The locked stages are not listed, so the full map lives only on /journey",
    ],
    needs:
      "Timestamps for the ordering. The story sentence is assembled from the record by rule - no AI call, so it can never claim something that did not happen.",
  },
];

/* -------------------------------------------------------------- the data */

type Item = {
  title: string;
  detail: string;
  state: "done" | "live" | "locked";
  when?: string;
  bar?: [number, number];
  unlock?: string;
};

// The seven stages, for somebody three of the way in.
const STAGES: Item[] = [
  {
    title: "Tell us about you",
    detail: "9 of 11 questions answered",
    state: "done",
    when: "last week",
    bar: [9, 11],
  },
  {
    title: "Find the work that fits",
    detail: "Role chosen",
    state: "done",
    when: "last week",
  },
  {
    title: "Choose a direction",
    detail: "Customer Success Associate, saved to your record",
    state: "done",
    when: "4 days ago",
  },
  {
    title: "Check where you stand",
    detail: "One sitting done, 68 out of 100",
    state: "live",
    when: "yesterday",
  },
  {
    title: "Try the actual work",
    detail: "Real tasks from the job, marked",
    state: "locked",
    unlock: "Opens after you have checked where you stand",
  },
  {
    title: "Practise the interview",
    detail: "Feedback on what you actually said",
    state: "locked",
    unlock: "Opens at the same time as the real tasks",
  },
  {
    title: "Prove it",
    detail: "Proof of what you can do, sent only when you say so",
    state: "locked",
    unlock: "Opens once two tasks have been marked",
  },
];

// The same person, told as what they have rather than what is left.
const MADE: Item[] = [
  {
    title: "Readiness sitting",
    detail: "68 out of 100 · two gaps named",
    state: "done",
    when: "yesterday",
  },
  {
    title: "Resume built",
    detail: "Aimed at Customer Success Associate",
    state: "done",
    when: "3 days ago",
  },
  {
    title: "Direction chosen",
    detail: "Customer Success Associate",
    state: "done",
    when: "4 days ago",
  },
  {
    title: "Roles toured",
    detail: "6 roles read, 2 read twice",
    state: "done",
    when: "last week",
  },
  {
    title: "About you",
    detail: "9 of 11 questions answered",
    state: "done",
    when: "last week",
    bar: [9, 11],
  },
];

// What is open right now. More than one is possible - a resume half built
// and an assessment half sat are both live at once - so this is a list.
const LIVE: Item[] = [
  {
    title: "Try the actual work",
    detail: "Two tasks from the job, marked. About 20 minutes.",
    state: "live",
  },
  {
    title: "About you",
    detail: "9 of 11 questions answered. Two left.",
    state: "live",
    bar: [9, 11],
  },
];

// Finished, newest first. Nothing here is a stage that has not opened.
const DONE: Item[] = [
  {
    title: "Readiness sitting",
    detail: "68 out of 100 · two gaps named",
    state: "done",
    when: "yesterday",
  },
  {
    title: "Resume built",
    detail: "Aimed at Customer Success Associate",
    state: "done",
    when: "3 days ago",
  },
  {
    title: "Direction chosen",
    detail: "Customer Success Associate",
    state: "done",
    when: "4 days ago",
  },
  {
    title: "Roles toured",
    detail: "6 roles read, 2 read twice",
    state: "done",
    when: "last week",
  },
];

export function Rail() {
  const [shape, setShape] = useState<Shape>("split");
  const chosen = SHAPES.find((s) => s.id === shape)!;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Preview · not a shipped screen
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        Your story so far, as a rail
      </h1>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        The home page says what to do next and what the doors are. It never says
        what you have already done - so somebody who spent forty minutes here
        last week arrives at the screen a stranger sees, minus a bar that moved.
        Three ways to fix that, at true size.
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
        Laptop · 1280 × 720, scroll inside it
      </h2>
      <Box w={1280} h={720} fit={1024}>
        <Home shape={shape} wide />
      </Box>

      <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <Notes title="Gains" items={chosen.good} tone="good" />
        <Notes title="Costs" items={chosen.bad} tone="bad" />
      </div>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.86rem] leading-relaxed text-amber-900">
        <strong className="font-semibold">What it needs: </strong>
        {chosen.needs}
      </p>

      <h2 className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Phone · 360 × 640. The rail folds above the doors rather than beside
        them.
      </h2>
      <Box w={360} h={640} fit={360}>
        <Home shape={shape} />
      </Box>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
          If you want a recommendation
        </h2>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">Three.</strong> The story is said
          outright, in a sentence, and then the record is under it in two named
          groups - in progress, and completed. A list on its own is not a story:
          it makes somebody read six rows and do the joining themselves. A story
          on its own cannot be acted on. Both, in that order, is what the column
          is for.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          The locked stages stay off the rail deliberately. Four greyed rows
          telling somebody what they cannot do yet is most of a column spent on
          refusals; the full map already exists on{" "}
          <code className="rounded bg-slate-100 px-1 text-[0.82rem]">
            /journey
          </code>
          , and the rail links to it.
        </p>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          <strong className="font-semibold">The one real dependency</strong> is
          time. Every line here says when it happened, and ordering a story by
          anything else is not a story. The record holds the claims, but the
          home page is not currently told when each arrived - so this needs a
          date on each item from the journey endpoint before it can ship
          honestly. Everything else on the rail is data the page already has.
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

function Home({ shape, wide }: { shape: Shape; wide?: boolean }) {
  return (
    <div className={wide ? "px-8 py-6" : "px-4 py-4"}>
      {/* the banner, as it is today */}
      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <div className="bg-gradient-to-r from-[#0d3b3f] via-[#0f766e] to-[#059669] px-5 py-5 text-white">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-white/30 text-center">
              <span className="font-display text-lg font-bold leading-none">
                3<span className="text-white/70">/7</span>
                <span className="mt-0.5 block text-[0.5rem] font-semibold uppercase tracking-wide text-white/80">
                  stages
                </span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-bold">
                Hi Priya - welcome back.
              </p>
              <p className="mt-0.5 text-[0.9rem] font-medium text-white/95">
                Customer Success Associate
              </p>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[0.74rem] font-medium ring-1 ring-white/20">
              <span className="text-[0.56rem] font-bold uppercase tracking-wider text-white/60">
                interested
              </span>
              Banking &amp; Financial Services, Healthcare Service
            </span>
          </div>
        </div>
      </div>

      {/* the rail beside the doors */}
      <div
        className={`mt-5 gap-5 ${wide ? "grid grid-cols-[19rem_minmax(0,1fr)] items-start" : "grid"}`}
      >
        <RailColumn shape={shape} />
        <div className={wide ? "" : "mt-5"}>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
            Where to go
          </p>
          <div
            className={`mt-2 grid gap-3 ${wide ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {[
              ["Discover", "Find the work that fits you"],
              ["Practice", "Try the job before you have it"],
              ["Resume", "Built from what you have done"],
              ["Passport", "Proof, shared when you say so"],
            ].map(([head, body]) => (
              <div
                key={head}
                className="rounded-2xl border border-slate-200 bg-surface p-4"
              >
                <p className="text-[0.92rem] font-semibold text-brand-ink">
                  {head}
                </p>
                <p className="mt-1 text-[0.8rem] leading-snug text-slate-500">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RailColumn({ shape }: { shape: Shape }) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-surface p-4">
      {shape === "split" ? (
        <>
          {/* 1. The story, said in words.
              
              A list is not a story - somebody has to read six rows and do the
              joining themselves. This is the same facts as one sentence, and
              it is the thing they asked for by name. Assembled by rule from
              the record, never written by an AI, so it cannot claim anything
              that did not happen. */}
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-teal-deep dark:text-brand-teal-soft">
            Your story so far
          </p>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-700">
            You joined three weeks ago, answered nine questions about yourself
            and read six roles. You chose{" "}
            <strong className="font-semibold text-brand-ink">
              Customer Success Associate
            </strong>{" "}
            four days ago, built a resume for it, and your first readiness
            sitting came back at 68 with two gaps named.
          </p>

          {/* 2. What is open. Named as such, and actionable. */}
          <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
            In progress
          </p>
          <ul className="mt-2 grid gap-2.5">
            {LIVE.map((item) => (
              <Row key={item.title} item={item} />
            ))}
          </ul>
          <span className="mt-2.5 inline-flex h-9 items-center rounded-lg bg-brand-violet px-4 text-[0.78rem] font-bold text-white">
            Pick up the tasks
          </span>

          {/* 3. What is finished. Newest first. */}
          <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
            Completed
          </p>
          <ul className="mt-2 grid gap-2.5">
            {DONE.map((item) => (
              <Row key={item.title} item={item} />
            ))}
          </ul>

          <p className="mt-3 border-t border-slate-200 pt-2.5 text-[0.76rem] font-semibold text-slate-500 underline underline-offset-2">
            See the whole journey
          </p>
        </>
      ) : (
        <>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
            {shape === "stages" ? "Your journey" : "Your story so far"}
          </p>
          <ul className="mt-2.5 grid gap-2.5">
            {(shape === "stages" ? STAGES : MADE).map((item) => (
              <Row key={item.title} item={item} />
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}

function Row({ item }: { item: Item }) {
  return (
    <li className="flex gap-2.5">
      <span
        aria-hidden
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold ${
          item.state === "done"
            ? "bg-brand-teal/20 text-brand-teal-deep"
            : item.state === "live"
              ? "bg-brand-violet/15 text-brand-violet-deep"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {item.state === "done" ? (
          <Check size={11} />
        ) : item.state === "live" ? (
          "→"
        ) : (
          "·"
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={`text-[0.86rem] font-semibold ${
              item.state === "locked" ? "text-slate-400" : "text-brand-ink"
            }`}
          >
            {item.title}
          </span>
          {item.when && (
            <span className="shrink-0 text-[0.68rem] text-slate-400">
              {item.when}
            </span>
          )}
        </span>
        <span
          className={`block text-[0.78rem] leading-snug ${
            item.state === "locked" ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {item.unlock ?? item.detail}
        </span>
        {item.bar && (
          <span
            aria-hidden
            className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100"
          >
            <span
              className="block h-full rounded-full bg-brand-teal"
              style={{ width: `${(item.bar[0] / item.bar[1]) * 100}%` }}
            />
          </span>
        )}
      </span>
    </li>
  );
}
