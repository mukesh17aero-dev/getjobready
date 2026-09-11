"use client";

// Four stronger ways to recommend the tour.
//
// The first round all had the same weakness: they described a tour. "Rather be
// walked through them?" asks somebody to imagine a thing and then decide about
// the thing they imagined - which is work, and the default answer to work is no.
//
// These four all do the same trick instead: they show the tour rather than
// describe it. Naming the five roles, showing them as a route, or giving a
// reason drawn from what the person just did turns an abstract offer into a
// concrete one, and a concrete offer can be accepted without imagining anything.
//
//   Itinerary  the five stops, named, with the time. You are not agreeing to
//              "a tour", you are agreeing to these five.
//   Deck       the same as a stack of cards you are about to be dealt.
//   Fork       two doors of equal weight at the top - walk me through, or I
//              will browse. A decision, not a banner to ignore.
//   Because    the guide gives its reason first, drawn from what they picked,
//              and the offer follows from it.
//
// Sample content, real components' styling.

import { useState } from "react";
import { ArrowRight, Check } from "@/components/icons";

const STOPS = [
  { title: "Customer Success Associate", world: "Customer operations", tint: "139 92 246", glyph: "\u{1F3A7}" },
  { title: "Relationship Executive", world: "Banking", tint: "56 189 248", glyph: "\u{1F3E6}" },
  { title: "Operations Coordinator", world: "Logistics", tint: "45 212 191", glyph: "\u{1F4E6}" },
  { title: "Operations Executive", world: "Retail", tint: "244 114 182", glyph: "\u{1F6CD}" },
  { title: "Guest Experience Associate", world: "Food", tint: "251 191 36", glyph: "\u{1F37D}" },
];

const OPTIONS = [
  { id: "itinerary", name: "Itinerary", line: "The five stops, named. You are not agreeing to “a tour”, you are agreeing to these five." },
  { id: "deck", name: "Deck", line: "The same five as a stack you are about to be dealt - a sequence you can see the length of." },
  { id: "fork", name: "Fork", line: "Two doors of equal weight. A decision to make, rather than a banner to ignore." },
  { id: "because", name: "Because", line: "The guide gives its reason first, from what they just picked, and the offer follows from it." },
  { id: "taster", name: "Taster", line: "Gives one away first. You cannot argue with a sample, and this one is real." },
  { id: "gap", name: "The gap", line: "Three questions the descriptions cannot answer - then offers to answer them." },
  { id: "one", name: "Just one", line: "Two minutes, one role, decide after. The smallest possible yes." },
  { id: "trade", name: "The trade", line: "The arithmetic, plainly: what reading nine yourself actually costs." },
] as const;

export default function PreviewTourRecommend() {
  const [option, setOption] = useState<(typeof OPTIONS)[number]["id"]>("itinerary");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
        Preview
      </p>
      <h1 className="mt-1 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        Recommending the tour
      </h1>
      <p className="mt-2 max-w-[64ch] text-[0.95rem] leading-relaxed text-slate-500">
        Each of these shows the tour instead of describing it. Naming the five
        roles is the whole difference: nobody has to imagine what they are
        agreeing to.
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
      <p className="mt-2 max-w-[70ch] text-[0.85rem] text-slate-500">
        {OPTIONS.find((o) => o.id === option)!.line}
      </p>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-3 sm:p-5">
        <h2 className="font-display text-[1.6rem] font-bold tracking-tight text-brand-ink">
          Roles
        </h2>
        <div className="mt-4">
          {option === "itinerary" && <Itinerary />}
          {option === "deck" && <Deck />}
          {option === "fork" && <Fork />}
          {option === "because" && <Because />}
          {option === "taster" && <Taster />}
          {option === "gap" && <Gap />}
          {option === "one" && <JustOne />}
          {option === "trade" && <Trade />}
        </div>
        <p className="mt-5 text-[0.78rem] text-slate-400">
          …the nine role tiles would follow here.
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ parts -- */

function Orb({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-white/40"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 32% 28%, var(--color-brand-violet-soft) 0%, var(--color-brand-violet) 45%, var(--color-brand-violet-deep) 100%)",
      }}
    >
      <span className="absolute left-[18%] top-[14%] h-1.5 w-1.5 rounded-full bg-white/80 blur-[1px]" />
    </span>
  );
}

function Start({ label = "Start the tour" }: { label?: string }) {
  return (
    <span className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-brand-violet px-6 text-[0.9rem] font-bold text-white">
      {label}
      <ArrowRight size={15} />
    </span>
  );
}

/* -------------------------------------------------------------- itinerary -- */

function Itinerary() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-violet/40 bg-brand-violet/[0.06]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-brand-violet/20 px-5 py-4">
        <Orb size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
            Discovery assistant
          </p>
          <p className="text-[1.15rem] font-bold leading-tight text-brand-ink">
            I can take you through these five
          </p>
        </div>
        <p className="text-[0.82rem] font-semibold text-slate-500">
          10 minutes · 2 min each
        </p>
      </div>

      <ol className="grid gap-px bg-brand-violet/15 sm:grid-cols-5">
        {STOPS.map((s, i) => (
          <li key={s.title} className="bg-surface px-4 py-3.5">
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-full text-[0.78rem] font-bold text-white"
              style={{ background: `rgb(${s.tint})` }}
            >
              {i + 1}
            </span>
            <p className="mt-2 text-[0.86rem] font-bold leading-tight text-brand-ink">
              {s.title}
            </p>
            <p className="mt-0.5 text-[0.74rem] text-slate-500">{s.world}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <Start />
        <span className="text-[0.82rem] text-slate-500">
          Swap any of them, or pick a five-minute version.
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- deck -- */

function Deck() {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-brand-violet/40 bg-brand-violet/[0.06] p-5 sm:flex-row sm:items-center">
      {/* The stack: five cards, fanned, so the length of the thing is visible
          before anybody agrees to it. */}
      {/* Fanned so all five are countable at a glance: the back cards show
          only their industry mark, the front one is readable. */}
      <div aria-hidden className="relative h-[10.5rem] w-full shrink-0 sm:w-[19rem]">
        {STOPS.slice().reverse().map((s, i) => {
          const from = STOPS.length - 1 - i;
          return (
            <div
              key={s.title}
              className="absolute bottom-0 left-0 top-2 w-[8.5rem] overflow-hidden rounded-xl border border-white/15 p-3 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.8)]"
              style={{
                transform: `translateX(${from * 48}px) translateY(${from * -4}px) rotate(${(from - 2) * 2.5}deg)`,
                background: `linear-gradient(160deg, rgb(${s.tint} / 0.95), rgb(${s.tint} / 0.55))`,
              }}
            >
              <span className="text-[1.7rem]">{s.glyph}</span>
              {from === 0 && (
                <p className="absolute bottom-3 left-3 right-3 text-[0.76rem] font-bold leading-tight text-white">
                  {s.title}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
          Discovery assistant
        </p>
        <p className="mt-1 text-[1.15rem] font-bold leading-tight text-brand-ink">
          Five roles, ten minutes, in order
        </p>
        <p className="mt-1.5 max-w-[52ch] text-[0.85rem] leading-relaxed text-slate-600">
          Why each job matters, what it opens up, how they actually hire for it,
          and what it is turning into. Ask me anything as we go.
        </p>
        <div className="mt-4">
          <Start label="Deal me in" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- fork -- */

function Fork() {
  const [picked, setPicked] = useState<"tour" | "browse" | null>(null);
  return (
    <div>
      <p className="text-[1.05rem] font-bold text-brand-ink">
        Nine roles in the industries you picked. How do you want to do this?
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPicked("tour")}
          className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
            picked === "tour"
              ? "border-brand-violet bg-brand-violet/10"
              : "border-brand-violet/40 bg-brand-violet/[0.05]"
          }`}
        >
          <span className="flex items-center gap-3">
            <Orb size={40} />
            <span className="text-[1.05rem] font-bold text-brand-ink">
              Walk me through them
            </span>
          </span>
          <span className="mt-2 text-[0.85rem] leading-relaxed text-slate-600">
            Five of the nine, two minutes each. I tell you why each one matters,
            what it opens up and how they hire for it - then ask what you made
            of it.
          </span>
          <span className="mt-3 inline-flex items-center gap-1.5 text-[0.82rem] font-bold text-brand-violet-deep">
            Recommended if you have not worked before <Check size={13} />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPicked("browse")}
          className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
            picked === "browse"
              ? "border-slate-400 bg-slate-500/10"
              : "border-slate-300"
          }`}
        >
          <span className="text-[1.05rem] font-bold text-brand-ink">
            I will look myself
          </span>
          <span className="mt-2 text-[0.85rem] leading-relaxed text-slate-600">
            Open whichever you like, in any order. I am on every role if you
            want to ask something.
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- because -- */

function Because() {
  return (
    <div className="rounded-2xl border border-brand-violet/40 bg-brand-violet/[0.06] p-5">
      <div className="flex gap-4">
        <Orb size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
            Discovery assistant
          </p>
          <p className="mt-1.5 max-w-[62ch] text-[0.95rem] leading-relaxed text-brand-ink">
            You picked <strong className="font-bold">Retail</strong>,{" "}
            <strong className="font-bold">Banking</strong> and{" "}
            <strong className="font-bold">Logistics</strong>, which is nine
            roles. Reading nine job descriptions cold tells you what the tasks
            are and almost nothing about whether you would want the job.
          </p>
          <p className="mt-2 max-w-[62ch] text-[0.95rem] leading-relaxed text-slate-600">
            Let me take you through five of them instead - starting with{" "}
            <strong className="font-semibold text-brand-ink">
              {STOPS[0]!.title}
            </strong>{" "}
            and{" "}
            <strong className="font-semibold text-brand-ink">
              {STOPS[1]!.title}
            </strong>{" "}
            - and I will tell you the half a description leaves out.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Start label="Go on then" />
            <span className="text-[0.82rem] font-semibold text-slate-500">
              Ten minutes · stop whenever you like
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- taster -- */

// The strongest of the eight, and the least like advertising: it hands over
// one real thing before asking for anything. Nobody has to believe a claim
// about what a tour contains when a piece of it is already in front of them.
function Taster() {
  return (
    <div className="rounded-2xl border border-brand-violet/40 bg-brand-violet/[0.06] p-5">
      <div className="flex gap-4">
        <Orb size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
            One thing about Relationship Executive
          </p>
          <p className="mt-1.5 max-w-[64ch] text-[0.95rem] leading-relaxed text-brand-ink">
            The description says &ldquo;hit monthly targets&rdquo;. What it does
            not say is that the interview is usually a roleplay - they hand you
            a product and a reluctant customer and watch what you do. People who
            prepare answers fail it; people who practise the conversation pass.
          </p>
          <p className="mt-3 max-w-[64ch] text-[0.9rem] leading-relaxed text-slate-600">
            There are four more like that for this role, and for each of the
            other eight. Shall I take you through five of them?
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Start label="Yes, go on" />
            <span className="text-[0.82rem] font-semibold text-slate-500">
              Two minutes a role · stop whenever
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- gap -- */

// Proves the gap rather than asserting it. Every question here is one the
// tour genuinely answers, so the curiosity is not a trick - it is a promise
// with the receipt attached.
const UNANSWERABLE = [
  "Which of these nine is being eaten by software, and which is not?",
  "Which one interviews you with a roleplay rather than questions?",
  "Which one stops paying more after three years?",
];

function Gap() {
  return (
    <div className="rounded-2xl border border-brand-violet/40 bg-brand-violet/[0.06] p-5">
      <div className="flex gap-4">
        <Orb size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-bold text-brand-ink">
            Three things you cannot tell from the tiles below
          </p>
          <ul className="mt-3 grid gap-2">
            {UNANSWERABLE.map((q) => (
              <li
                key={q}
                className="flex items-start gap-2.5 text-[0.9rem] leading-relaxed text-slate-700"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-violet"
                />
                {q}
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-[62ch] text-[0.9rem] leading-relaxed text-slate-600">
            A job description will never tell you any of them. I will, for five
            of these, in about ten minutes.
          </p>
          <div className="mt-4">
            <Start label="Tell me" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- just one -- */

// The smallest yes. Ten minutes is a decision; two minutes is barely one, and
// after the first stop the tour has to earn the second on its own merits -
// which is the honest version of a free trial.
function JustOne() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-violet/40 bg-brand-violet/[0.06]">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <Orb size={40} />
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
              Discovery assistant
            </p>
          </div>
          <p className="mt-2.5 text-[1.15rem] font-bold leading-tight text-brand-ink">
            Give me two minutes on one of them
          </p>
          <p className="mt-1.5 max-w-[56ch] text-[0.88rem] leading-relaxed text-slate-600">
            Start with{" "}
            <strong className="font-semibold text-brand-ink">
              {STOPS[0]!.title}
            </strong>
            . If it is not worth your time, stop there - nothing is saved and
            nothing is asked. If it is, there are four more.
          </p>
        </div>

        <div
          className="relative w-full shrink-0 overflow-hidden rounded-xl p-4 sm:w-[15rem]"
          style={{
            background: `linear-gradient(160deg, rgb(${STOPS[0]!.tint} / 0.9), rgb(${STOPS[0]!.tint} / 0.5))`,
          }}
        >
          <span className="text-[2rem]">{STOPS[0]!.glyph}</span>
          <p className="mt-1 text-[0.9rem] font-bold leading-tight text-white">
            {STOPS[0]!.title}
          </p>
          <p className="text-[0.76rem] text-white/80">{STOPS[0]!.world}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-brand-violet/20 px-5 py-4">
        <Start label="Two minutes, then" />
        <span className="text-[0.82rem] text-slate-500">
          Or take all five at once - ten minutes.
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ trade -- */

// The arithmetic, without a thumb on the scale: reading them yourself is a
// real option and the panel says so. What it makes visible is that the slow
// way still leaves the important questions unanswered.
function Trade() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-300 p-5">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-slate-400">
          Reading all nine yourself
        </p>
        <p className="mt-1.5 text-[1.6rem] font-bold leading-none text-brand-ink">
          ~40 minutes
        </p>
        <ul className="mt-3 grid gap-1.5 text-[0.85rem] leading-relaxed text-slate-600">
          <li>You learn the tasks, the pay and the hours.</li>
          <li className="text-slate-500">
            You still will not know why any of them matters, what it opens up,
            or how they hire for it.
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-brand-violet/50 bg-brand-violet/[0.07] p-5">
        <div className="flex items-center gap-2.5">
          <Orb size={32} />
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
            Five of them, walked through
          </p>
        </div>
        <p className="mt-1.5 text-[1.6rem] font-bold leading-none text-brand-ink">
          10 minutes
        </p>
        <ul className="mt-3 grid gap-1.5 text-[0.85rem] leading-relaxed text-slate-700">
          {[
            "Why the job exists and what breaks without it",
            "What it opens up inside the industry",
            "How they actually interview, and what they judge",
            "What the work is turning into",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-brand-teal-deep">
                <Check size={14} />
              </span>
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Start label="Take the ten minutes" />
        </div>
      </div>
    </div>
  );
}
