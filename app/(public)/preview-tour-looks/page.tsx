"use client";

// Four ways to run a stop on the tour.
//
// The tour is not the job description - it is the assistant saying the things
// a description cannot. So the question each of these answers differently is:
// what does that look like on a screen for two minutes?
//
//   Transcript  a chat log, as now. Familiar, and it reads like a chat log:
//               by the fourth message the first has scrolled away.
//   Chapters    the same content as titled blocks down the page. Scannable,
//               skimmable, and you can see how much is left.
//   Cards       one thing at a time, big, with the next one a tap away. Paced
//               like a guide talking rather than a page of text.
//   Split       the role pinned beside the talking, so context never leaves.
//
// The content is the real tourBriefing() output for a fixture role, so the
// lengths and the tone are what would actually ship.

import { useState } from "react";
import { tourBriefing } from "@/components/discovery-assistant";
import { ROLES } from "../preview-role-tour/fixture";
import { ArrowRight, Check, ChevronRight } from "@/components/icons";

const ROLE = ROLES[0]!;
const CHAPTERS = tourBriefing(ROLE, ROLE.knowledge);

const OPTIONS = [
  { id: "transcript", name: "Transcript", line: "A chat log, as it works now." },
  { id: "chapters", name: "Chapters", line: "Titled blocks down the page. Scannable, and you can see how much is left." },
  { id: "cards", name: "Cards", line: "One at a time, big, paced like somebody talking." },
  { id: "split", name: "Split", line: "The role pinned beside the talking, so context never leaves." },
] as const;

export default function PreviewTourLooks() {
  const [option, setOption] = useState<(typeof OPTIONS)[number]["id"]>("chapters");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
        Preview
      </p>
      <h1 className="mt-1 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        Four ways to run a stop on the tour
      </h1>
      <p className="mt-2 max-w-[62ch] text-[0.95rem] leading-relaxed text-slate-500">
        Same role, same words, four ideas about what two minutes of being told
        about a job should look like.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOption(o.id)}
            aria-pressed={option === o.id}
            className={`min-h-11 rounded-full border px-4 text-[0.85rem] font-bold transition-colors ${
              option === o.id
                ? "border-brand-violet bg-brand-violet text-white"
                : "border-slate-300 text-slate-700 hover:border-slate-400"
            }`}
          >
            {o.name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[0.85rem] text-slate-500">
        {OPTIONS.find((o) => o.id === option)!.line}
      </p>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-3 sm:p-5">
        <StopBar />
        {option === "transcript" && <Transcript />}
        {option === "chapters" && <Chapters />}
        {option === "cards" && <Cards />}
        {option === "split" && <Split />}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ parts -- */

function StopBar() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-slate-200 pb-2.5">
      <span className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
        Stop 2 of 5
      </span>
      <span aria-hidden className="flex flex-1 items-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i < 1 ? "bg-brand-teal" : "bg-slate-200"}`}
          >
            {i === 1 && <span className="block h-full w-1/3 rounded-full bg-brand-teal" />}
          </span>
        ))}
      </span>
      <span className="text-[0.78rem] font-semibold text-slate-500">
        Leave the tour
      </span>
    </div>
  );
}

function Identity({ compact }: { compact?: boolean }) {
  return (
    <div>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {ROLE.sector}
      </p>
      <h2
        className={`mt-0.5 font-display font-bold leading-tight tracking-tight text-brand-ink ${
          compact ? "text-[1.3rem]" : "text-[1.7rem]"
        }`}
      >
        Customer Success Associate
      </h2>
      <p className="mt-1.5 max-w-prose text-[0.9rem] leading-snug text-slate-600">
        {ROLE.pitch}
      </p>
      <button
        type="button"
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-[0.82rem] font-bold text-brand-ink"
      >
        Read the role description
      </button>
    </div>
  );
}

function Orb({ small }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-white/40 ${
        small ? "mt-0.5 h-7 w-7" : "h-10 w-10"
      }`}
      style={{
        background:
          "radial-gradient(circle at 32% 28%, var(--color-brand-violet-soft) 0%, var(--color-brand-violet) 45%, var(--color-brand-violet-deep) 100%)",
      }}
    >
      <span className="absolute left-[18%] top-[14%] h-1.5 w-1.5 rounded-full bg-white/80 blur-[1px]" />
    </span>
  );
}

function AskRow() {
  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <div className="flex flex-wrap gap-2">
        {["What is the interview like?", "Where can this take me?", "What would put me off?"].map(
          (c) => (
            <span
              key={c}
              className="rounded-full border border-slate-300 bg-surface px-3.5 py-2 text-[0.76rem] font-semibold text-slate-700"
            >
              {c}
            </span>
          ),
        )}
      </div>
      <div className="mt-2.5 flex gap-2">
        <span className="grid min-h-11 flex-1 items-center rounded-full border border-slate-300 px-4 text-[0.84rem] text-slate-400">
          Ask anything…
        </span>
        <span className="grid min-h-11 shrink-0 place-items-center rounded-full border border-brand-violet/45 px-4 text-[0.8rem] font-bold text-brand-violet-deep">
          Ask
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- transcript -- */

function Transcript() {
  return (
    <div>
      <Identity />
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-surface">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-2.5">
          <Orb />
          <span className="text-[0.84rem] font-bold text-brand-ink">
            About this role
          </span>
        </div>
        <div className="max-h-[22rem] overflow-y-auto px-4 py-3">
          <ol className="grid gap-2.5">
            {CHAPTERS.slice(0, 4).map((c) => (
              <li key={c.title} className="flex gap-2.5">
                <Orb small />
                <p className="rounded-2xl rounded-tl-sm border border-slate-200 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-slate-800">
                  {c.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-4 pb-3">
          <AskRow />
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- chapters -- */

function Chapters() {
  return (
    <div>
      <Identity />
      <ol className="mt-6 grid gap-5">
        {CHAPTERS.map((c, i) => (
          <li key={c.title} className="flex gap-3.5">
            <span className="flex flex-col items-center">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.72rem] font-bold ${
                  i < 3
                    ? "bg-brand-teal text-white"
                    : "border border-slate-300 text-slate-400"
                }`}
              >
                {i < 3 ? <Check size={13} /> : i + 1}
              </span>
              {i < CHAPTERS.length - 1 && (
                <span aria-hidden className="mt-1 w-px flex-1 bg-slate-200" />
              )}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <h3 className="text-[0.92rem] font-bold text-brand-ink">
                {c.title}
              </h3>
              <p className="mt-1 max-w-prose text-[0.88rem] leading-relaxed text-slate-600">
                {c.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <AskRow />
    </div>
  );
}

/* ------------------------------------------------------------------ cards -- */

function Cards() {
  const [at, setAt] = useState(1);
  const last = at >= CHAPTERS.length - 1;
  return (
    <div>
      <Identity compact />
      <div className="mt-5 rounded-2xl border border-brand-violet/30 bg-brand-violet/[0.05] p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <Orb />
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
            {CHAPTERS[at]?.title}
          </span>
        </div>
        <p className="mt-3 max-w-prose text-[1.02rem] leading-relaxed text-brand-ink">
          {CHAPTERS[at]?.text}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={at === 0}
            onClick={() => setAt((n) => Math.max(0, n - 1))}
            className="min-h-11 text-[0.84rem] font-semibold text-slate-500 disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setAt((n) => Math.min(CHAPTERS.length - 1, n + 1))}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-5 text-[0.86rem] font-bold text-white"
          >
            {last ? "That is all of it" : "Go on"}
            <ArrowRight size={15} />
          </button>
          <span aria-hidden className="flex items-center gap-1.5">
            {CHAPTERS.map((c, i) => (
              <span
                key={c.title}
                className={`h-1.5 rounded-full transition-all ${
                  i === at ? "w-5 bg-brand-violet" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </span>
        </div>
      </div>
      <AskRow />
    </div>
  );
}

/* ------------------------------------------------------------------ split -- */

function Split() {
  return (
    <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-slate-200 bg-surface p-4">
          <Identity compact />
          <dl className="mt-4 grid gap-2 border-t border-slate-200 pt-3 text-[0.8rem]">
            {ROLE.workMix.map((m) => (
              <div key={m.label} className="flex items-baseline justify-between gap-2">
                <dt className="text-slate-500">{m.label}</dt>
                <dd className="font-semibold text-brand-ink">{m.share}%</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 border-t border-slate-200 pt-3 text-[0.82rem] font-bold text-brand-ink">
            ₹14K–₹20K
            <span className="font-normal text-slate-400">/mo to start</span>
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <ol className="grid gap-4">
          {CHAPTERS.slice(0, 5).map((c) => (
            <li key={c.title}>
              <h3 className="flex items-center gap-2 text-[0.9rem] font-bold text-brand-ink">
                <span aria-hidden className="text-brand-violet-deep">
                  <ChevronRight size={14} />
                </span>
                {c.title}
              </h3>
              <p className="mt-1 text-[0.88rem] leading-relaxed text-slate-600">
                {c.text}
              </p>
            </li>
          ))}
        </ol>
        <AskRow />
      </div>
    </div>
  );
}
