"use client";

// A preview, not a shipped screen: Discovery as a career fair.
//
// Every student in India already knows this room - the hall with the stalls,
// the banners, the queue at the popular one. That familiarity is the whole
// argument: nobody needs to be taught how to walk around a fair, and nobody
// experiences walking up to a stall as taking a test.
//
// What makes it work better than a street: a stall has a person behind it.
// A person can ask you one thing, which is exactly the measurement we need,
// and asking is what people at stalls do anyway.

import { useState } from "react";

const ART = "https://polkexjgphmwtpwhmspk.supabase.co/storage/v1/object/public/street";

type Stall = {
  id: string;
  role: string;
  world: string;
  /** Who is behind the table. A first name and a job, nothing invented. */
  host: string;
  greeting: string;
  /** The day, in three beats. */
  day: string[];
  /** The one thing they ask you - the measurement, as conversation. */
  ask: { question: string; a: string; b: string };
  art: string;
  hue: string;
  busy: number;
};

const HALL: Stall[] = [
  {
    id: "store",
    role: "Customer Success Associate",
    world: "Retail",
    host: "Meera",
    greeting: "I run the counter at a store like this one. Want to know what a day is actually like?",
    day: [
      "Shutter up at ten. Somebody is already waiting.",
      "Billing, a return, a phone ringing behind you.",
      "Queue of four and the card machine gives up.",
    ],
    ask: {
      question: "So - card machine dead, four people waiting. What do you do first?",
      a: "Tell the queue what has happened and start billing by hand",
      b: "Get the machine working, it is faster than doing it by hand",
    },
    art: `${ART}/inside-store.webp`,
    hue: "16 185 129",
    busy: 3,
  },
  {
    id: "hub",
    role: "Operations Coordinator",
    world: "E-commerce",
    host: "Arun",
    greeting: "Sixty parcels, eleven riders, one whiteboard. That is my morning.",
    day: [
      "Sorting starts before the riders arrive.",
      "Two are late and it has started raining.",
      "A customer rings about an order that has not moved since morning.",
    ],
    ask: {
      question: "A rider has not moved for an hour and is not answering. Your call?",
      a: "Reassign his drops now, find out what happened after",
      b: "Keep trying him - reassigning throws the whole route out",
    },
    art: `${ART}/inside-hub.webp`,
    hue: "139 92 246",
    busy: 7,
  },
  {
    id: "desk",
    role: "Support Executive",
    world: "Services",
    host: "Priya",
    greeting: "I answer forty tickets a day. Most of it is writing, not talking.",
    day: [
      "Forty open. The oldest is from Friday.",
      "The same complaint turns up three times from three people.",
      "Somebody replies 'still not fixed' to your last message.",
    ],
    ask: {
      question: "Three people report the same fault in an hour. What comes first?",
      a: "Answer all three, then flag the pattern to the team",
      b: "Find what is causing it before answering anyone",
    },
    art: `${ART}/inside-office.webp`,
    hue: "56 189 248",
    busy: 2,
  },
  {
    id: "floor",
    role: "Store Supervisor",
    world: "Retail",
    host: "Kavya",
    greeting: "I run the floor. Six people, one target, and a lot of judgement calls.",
    day: [
      "Two staff out. The rota has to change before opening.",
      "A customer wants the cheaper model that will not do the job.",
      "You are six behind on the day's target at four o'clock.",
    ],
    ask: {
      question: "They want the cheaper model. It is wrong for what they described.",
      a: "Say so plainly, and show them why the other one fits",
      b: "Let them decide - they asked, it is their money",
    },
    art: `${ART}/facade-retail.webp`,
    hue: "251 191 36",
    busy: 5,
  },
];

type Collected = {
  id: string;
  role: string;
  interest: "yes" | "maybe" | "no";
  question: string;
};

export default function PreviewFair() {
  const [open, setOpen] = useState<Stall | null>(null);
  const [beat, setBeat] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [interest, setInterest] = useState<Collected["interest"] | null>(null);
  const [question, setQuestion] = useState("");
  const [tote, setTote] = useState<Collected[]>([]);
  const [closed, setClosed] = useState(false);

  function visit(stall: Stall) {
    setOpen(stall);
    setBeat(0);
    setAnswered(false);
    setInterest(null);
    setQuestion("");
  }

  function collect(stall: Stall) {
    if (!interest || question.trim().length < 4) return;
    setTote((t) => [...t, { id: stall.id, role: stall.role, interest, question: question.trim() }]);
    setOpen(null);
  }

  const sure = Math.min(100, tote.length * 25);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-32 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.8rem] font-bold leading-tight text-brand-ink">
        The career fair
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        A hall with stalls in it. Walk up to whichever interests you, hear what
        the day is actually like, answer the one thing they ask you, and take
        the brief away with you. No form, no rating scale, no ten questions.
      </p>

      {/* ---- the hall ---- */}
      <div className="mt-6 overflow-hidden rounded-3xl bg-[#0b1f24]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-teal-300">
              Open now
            </p>
            <p className="text-[0.95rem] font-bold text-white">Hall 2 - roles you could start in</p>
          </div>
          <p className="text-[0.75rem] text-white/50">{HALL.length} stalls</p>
        </div>

        {/* The aisle. Stalls stand in a row with their banners up, the way
            they do in a college hall. */}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto p-4">
          {HALL.map((stall) => {
            const been = tote.some((t) => t.id === stall.id);
            return (
              <button
                key={stall.id}
                type="button"
                onClick={() => visit(stall)}
                className="group relative w-[17rem] shrink-0 snap-center overflow-hidden rounded-2xl text-left transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {/* the banner above the table */}
                <span
                  className="block px-3.5 py-2.5"
                  style={{ background: `rgb(${stall.hue} / 0.92)` }}
                >
                  <span className="block text-[0.6rem] font-bold uppercase tracking-wide text-black/55">
                    {stall.world}
                  </span>
                  <span className="block text-[0.95rem] font-bold leading-tight text-black/85">
                    {stall.role}
                  </span>
                </span>
                {/* what is going on behind the table */}
                <span className="relative block h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stall.art}
                    alt={`${stall.role} at work`}
                    className="h-full w-full object-cover transition-transform duration-[5000ms] group-hover:scale-110 motion-reduce:transition-none"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#0b1f24] via-transparent to-transparent" />
                </span>
                <span className="block bg-[#0e2b31] px-3.5 py-2.5">
                  <span className="block text-[0.8rem] font-semibold text-white">
                    {stall.host} is on the stall
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[0.72rem] text-white/50">
                    <span aria-hidden className="flex gap-0.5">
                      {Array.from({ length: Math.min(5, stall.busy) }, (_, i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-teal-300/70" />
                      ))}
                    </span>
                    {stall.busy} people ahead of you
                    {been ? " · you have been here" : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- what you are carrying ---- */}
      <div className="sticky bottom-3 z-40 mt-4 rounded-2xl border border-slate-200 bg-surface/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-[10rem] flex-1">
            <p className="text-[0.8rem] font-semibold text-brand-ink">
              {tote.length === 0
                ? "Your bag is empty - go and talk to somebody"
                : `${tote.length} ${tote.length === 1 ? "brief" : "briefs"} in your bag`}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-teal-deep transition-[width] duration-700 motion-reduce:transition-none"
                style={{ width: `${sure}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={tote.length === 0}
            onClick={() => setClosed(true)}
            className="min-h-11 shrink-0 rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white disabled:opacity-40"
          >
            Leave the fair →
          </button>
        </div>
      </div>

      {/* ---- at a stall ---- */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface">
            <div className="relative h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={open.art} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <p className="absolute inset-x-4 bottom-3 text-[1.05rem] font-bold text-white">
                {open.role}
              </p>
            </div>

            <div className="p-5">
              {/* The host speaks first. A stall with a person on it is the
                  reason this shape beats a street of doors. */}
              <div className="flex gap-3">
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-black/70"
                  style={{ background: `rgb(${open.hue} / 0.9)` }}
                >
                  {open.host[0]}
                </span>
                <p className="text-[0.92rem] leading-relaxed text-brand-ink">
                  <span className="font-semibold">{open.host}:</span> &ldquo;{open.greeting}&rdquo;
                </p>
              </div>

              <ol className="mt-4 grid gap-2">
                {open.day.slice(0, beat + 1).map((line, i) => (
                  <li
                    key={line}
                    className="animate-fade-up rounded-xl bg-slate-100 px-3.5 py-2.5 text-[0.86rem] leading-relaxed text-slate-700"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {line}
                  </li>
                ))}
              </ol>

              {beat < open.day.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setBeat((b) => b + 1)}
                  className="mt-3 min-h-11 w-full rounded-full border border-slate-300 text-sm font-semibold text-slate-700"
                >
                  Then what?
                </button>
              ) : !answered ? (
                <div className="mt-4">
                  <p className="text-[0.92rem] font-semibold leading-snug text-brand-ink">
                    {open.host} asks: &ldquo;{open.ask.question}&rdquo;
                  </p>
                  <div className="mt-2 grid gap-2">
                    {(["a", "b"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => setAnswered(true)}
                        className="rounded-xl border-2 border-slate-200 px-4 py-3 text-left text-[0.88rem] leading-snug text-brand-ink transition-colors hover:border-brand-teal motion-reduce:transition-none"
                      >
                        {open.ask[side]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-[0.92rem] font-semibold text-brand-ink">
                    Before you go - could you see yourself doing this?
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {([
                      ["yes", "Yes, this is me"],
                      ["maybe", "Maybe - tell me more"],
                      ["no", "Not for me"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setInterest(value)}
                        className={`min-h-11 rounded-lg border-2 px-4 text-[0.8rem] font-bold transition-colors motion-reduce:transition-none ${
                          interest === value
                            ? "border-brand-teal-deep bg-brand-teal-deep text-white"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <label className="mt-4 block">
                    <span className="text-[0.92rem] font-semibold text-brand-ink">
                      Ask {open.host} one thing
                    </span>
                    <span className="mt-0.5 block text-[0.78rem] leading-relaxed text-slate-500">
                      The pay, the hours, where it leads, what the hard part is.
                      Every question you ask is answered when you leave the fair.
                    </span>
                    <textarea
                      rows={2}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Does this job ever get you off the shop floor?"
                      className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 bg-surface px-3 py-2 text-[0.9rem] outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={!interest || question.trim().length < 4}
                    onClick={() => collect(open)}
                    className="mt-4 min-h-12 w-full rounded-full bg-brand-teal-deep text-sm font-bold text-white disabled:opacity-40"
                  >
                    Take the brief and move on →
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setOpen(null)}
                className="mt-3 min-h-11 w-full text-[0.8rem] font-semibold text-slate-500 underline underline-offset-2"
              >
                Walk away
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- leaving ---- */}
      {closed && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface p-5">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-brand-violet-deep">
              On your way out
            </p>
            <h2 className="mt-1 text-[1.3rem] font-bold text-brand-ink">
              What you took from the fair
            </h2>
            <ul className="mt-3 grid gap-2.5">
              {tote.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-[0.9rem] font-semibold text-brand-ink">{item.role}</p>
                  <p className="text-[0.75rem] text-slate-500">
                    {item.interest === "yes"
                      ? "You could see yourself doing it"
                      : item.interest === "maybe"
                        ? "You wanted to know more"
                        : "Not for you"}
                  </p>
                  <p className="mt-1 text-[0.85rem] italic leading-relaxed text-slate-600">
                    &ldquo;{item.question}&rdquo;
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.86rem] leading-relaxed text-slate-600">
              Your questions get answered here, one by one - and what you walked
              up to, what you skipped and how you answered at the tables is what
              we read you from. Nobody filled in a form.
            </p>
            <button
              type="button"
              onClick={() => setClosed(false)}
              className="mt-4 min-h-12 w-full rounded-full bg-brand-teal-deep text-sm font-bold text-white"
            >
              Back to the hall
            </button>
          </div>
        </div>
      )}

      <section className="mt-10 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">
          Why a fair beats a street
        </h2>
        <ul className="mt-2.5 grid gap-2 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="text-brand-ink">Everyone already knows this room.</strong>{" "}
            A placement fair needs no instructions, and walking up to a stall
            has never felt like taking a test.
          </li>
          <li>
            <strong className="text-brand-ink">A stall has a person behind it.</strong>{" "}
            That is the unlock. A person can ask you one thing - which is
            exactly the measurement we need - and asking is what people at
            stalls do anyway. On a street, a door cannot ask you anything.
          </li>
          <li>
            <strong className="text-brand-ink">It is dense.</strong> Twenty roles
            in a hall is normal; twenty buildings is a long walk. And a fair
            can be browsed in any order without anyone feeling they missed a
            turning.
          </li>
          <li>
            <strong className="text-brand-ink">It has a natural ending.</strong>{" "}
            You leave with a bag of briefs and your questions answered. A
            street just runs out.
          </li>
          <li>
            <strong className="text-brand-ink">It is where employers go later.</strong>{" "}
            When a real employer wants a presence, a stall is the obvious
            place - and it is the only version of this that grows into the
            business you described.
          </li>
        </ul>
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-[0.84rem] leading-relaxed text-amber-900">
          <strong>The one rule to keep:</strong> the stalls are roles, not
          companies. The moment a stall carries an employer&rsquo;s name that
          is not really there, the fair becomes a lie - and this product is
          built on not doing that.
        </p>
      </section>
    </main>
  );
}
