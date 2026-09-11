"use client";

// Four ways to show the roles, and four ways to offer the tour.
//
// The current screen is a list of cards one per row: on a laptop half the page
// is empty, every role looks identical, and nothing about it says "there is a
// world of work in here". These are alternatives, built with the real stack -
// CSS only, no libraries - so whichever you pick can ship as it stands.
//
// They differ in what they think the screen is FOR:
//
//   Rails      browsing. Rows you push through, like a shelf. Tour per row.
//   Ledger     comparing. Dense, scannable, the facts side by side. Tour by
//              ticking rows.
//   Mosaic     wandering. A field of tiles at different weights, nothing
//              looking like a form. Tour is a numbered route you draw.
//   Itinerary  going. The tour is the object; the roles are what you swap
//              into it.
//
// Sample content, shaped like the real payload.

import { useState } from "react";
import { ArrowRight, Check, ChevronRight } from "@/components/icons";

type Role = {
  id: string;
  title: string;
  world: string;
  summary: string;
  pay: [number, number];
  /** The day, in three parts, biggest first. */
  mix: Array<{ label: string; share: number }>;
  hard: string;
};

const WORLDS = [
  { id: "retail", title: "Retail & Commerce", caption: "Stores, sales, category, operations", tint: "244 114 182", glyph: "\u{1F6CD}" },
  { id: "banking", title: "Banking & Financial Services", caption: "Relationships, service, operations", tint: "56 189 248", glyph: "\u{1F3E6}" },
  { id: "logistics", title: "Logistics & E-commerce", caption: "Fulfilment, planning, partner ops", tint: "45 212 191", glyph: "\u{1F4E6}" },
  { id: "food", title: "Food & Hospitality", caption: "Guests, restaurants, shift operations", tint: "251 191 36", glyph: "\u{1F37D}" },
  { id: "support", title: "Customer Operations", caption: "Support, quality, workforce", tint: "139 92 246", glyph: "\u{1F3A7}" },
];

const ROLES: Role[] = [
  { id: "csa", title: "Customer Success Associate", world: "support", summary: "Solve customer issues, coordinate teams, protect relationships.", pay: [20000, 30000], mix: [{ label: "With customers", share: 55 }, { label: "Coordinating", share: 25 }, { label: "Systems", share: 20 }], hard: "You are the face of mistakes you did not make." },
  { id: "qa", title: "Quality Analyst", world: "support", summary: "Listen back, score conversations, tell people what to fix.", pay: [18000, 26000], mix: [{ label: "Reviewing", share: 60 }, { label: "Coaching", share: 25 }, { label: "Reporting", share: 15 }], hard: "Telling colleagues they got it wrong, every week." },
  { id: "rel", title: "Relationship Executive", world: "banking", summary: "Grow customer relationships, match products to needs, hit targets.", pay: [16000, 26000], mix: [{ label: "With customers", share: 50 }, { label: "Paperwork", share: 30 }, { label: "Targets", share: 20 }], hard: "The target does not care why the month was slow." },
  { id: "ops", title: "Branch Operations Officer", world: "banking", summary: "Keep the branch compliant, balanced and open on time.", pay: [17000, 24000], mix: [{ label: "Checks", share: 45 }, { label: "Counter", share: 35 }, { label: "Filing", share: 20 }], hard: "One missed check can undo a good week." },
  { id: "hub", title: "Hub Supervisor", world: "logistics", summary: "Run a delivery hub: shifts, throughput, escalations, safety.", pay: [22000, 34000], mix: [{ label: "On the floor", share: 55 }, { label: "Planning", share: 25 }, { label: "Escalations", share: 20 }], hard: "Early starts, and the day gets worse before it gets better." },
  { id: "coord", title: "Operations Coordinator", world: "logistics", summary: "Keep daily operations moving: priorities, exceptions, stakeholders.", pay: [19000, 28000], mix: [{ label: "Chasing", share: 45 }, { label: "Systems", share: 35 }, { label: "Reporting", share: 20 }], hard: "Everybody's exception becomes your afternoon." },
  { id: "store", title: "Operations Executive", world: "retail", summary: "Run the shop floor: stock, staffing, standards, daily numbers.", pay: [18000, 27000], mix: [{ label: "Shop floor", share: 50 }, { label: "Stock", share: 30 }, { label: "Numbers", share: 20 }], hard: "Weekends and festivals are the busiest days you will work." },
  { id: "cat", title: "Category Assistant", world: "retail", summary: "Watch what sells, keep the range right, work with suppliers.", pay: [17000, 25000], mix: [{ label: "Numbers", share: 50 }, { label: "Suppliers", share: 30 }, { label: "Floor visits", share: 20 }], hard: "Months of spreadsheets before anyone trusts your judgement." },
  { id: "guest", title: "Guest Experience Associate", world: "food", summary: "Own the guest's experience through the rush and the recovery.", pay: [15000, 23000], mix: [{ label: "With guests", share: 60 }, { label: "The pass", share: 25 }, { label: "Setup", share: 15 }], hard: "Split shifts, and the rush does not pause for you." },
  { id: "shift", title: "Shift Supervisor", world: "food", summary: "Run a shift: people, prep, service, close.", pay: [18000, 26000], mix: [{ label: "Service", share: 50 }, { label: "People", share: 30 }, { label: "Close", share: 20 }], hard: "You are last out, most nights." },
];

const money = (n: number) => `₹${Math.round(n / 1000)}K`;
const pay = (r: Role) => `${money(r.pay[0])}–${money(r.pay[1])}`;
const worldOf = (id: string) => WORLDS.find((w) => w.id === id)!;
const rolesIn = (id: string) => ROLES.filter((r) => r.world === id);

const OPTIONS = [
  { id: "rails", name: "Rails", line: "Browsing. Shelves you push through; a tour per shelf." },
  { id: "ledger", name: "Ledger", line: "Comparing. Dense and scannable; tick rows to build a tour." },
  { id: "mosaic", name: "Mosaic", line: "Wandering. A field of tiles; the tour is a route you draw." },
  { id: "itinerary", name: "Itinerary", line: "Going. The tour is the object; roles are what you swap in." },
] as const;

export default function PreviewRolesLooks() {
  const [option, setOption] = useState<(typeof OPTIONS)[number]["id"]>("rails");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
        Preview
      </p>
      <h1 className="mt-1 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        Four ways to show the roles
      </h1>
      <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-slate-500">
        Same roles, same tour, four different ideas about what this screen is
        for. Each one is built, not drawn - pick one and it ships.
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

      <div className="mt-6">
        {option === "rails" && <Rails />}
        {option === "ledger" && <Ledger />}
        {option === "mosaic" && <Mosaic />}
        {option === "itinerary" && <Itinerary />}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ rails -- */

function Rails() {
  return (
    <div className="grid gap-8">
      {WORLDS.map((w) => (
        <section key={w.id}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
                style={{ background: `rgb(${w.tint} / 0.14)` }}
              >
                {w.glyph}
              </span>
              <div>
                <h2 className="text-[1.05rem] font-bold leading-tight text-brand-ink">
                  {w.title}
                </h2>
                <p className="text-[0.8rem] text-slate-500">{w.caption}</p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-violet/45 px-4 text-[0.82rem] font-bold text-brand-violet-deep transition-colors hover:bg-brand-violet/10"
            >
              Walk me through these {rolesIn(w.id).length}
              <ArrowRight size={14} />
            </button>
          </div>

          {/* A rail, not a grid: the row scrolls, so a wide screen shows more
              of the world rather than more empty space. */}
          <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {rolesIn(w.id).map((r) => (
              <li key={r.id} className="w-[17rem] shrink-0 snap-start">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-surface transition-shadow hover:shadow-lg">
                  <div
                    className="h-1.5 w-full"
                    style={{ background: `rgb(${w.tint} / 0.8)` }}
                  />
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-[0.95rem] font-bold leading-tight text-brand-ink">
                      {r.title}
                    </h3>
                    <p className="mt-1 text-[0.8rem] leading-snug text-slate-500">
                      {r.summary}
                    </p>

                    <div className="mt-3">
                      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                        {r.mix.map((m, i) => (
                          <span
                            key={m.label}
                            style={{
                              width: `${m.share}%`,
                              background: `rgb(${w.tint} / ${1 - i * 0.3})`,
                            }}
                          />
                        ))}
                      </div>
                      <p className="mt-1.5 text-[0.72rem] text-slate-400">
                        {r.mix[0]!.share}% {r.mix[0]!.label.toLowerCase()}
                      </p>
                    </div>

                    <p className="mt-auto pt-3 text-[0.85rem] font-bold text-brand-ink">
                      {pay(r)}
                      <span className="font-normal text-slate-400">/mo</span>
                    </p>
                    <button
                      type="button"
                      className="mt-2 inline-flex min-h-10 items-center gap-1 text-[0.82rem] font-bold text-brand-violet-deep"
                    >
                      Explore <ChevronRight size={13} />
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- ledger -- */

function Ledger() {
  const [picked, setPicked] = useState<string[]>(["csa", "hub"]);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div>
      <div className="hidden grid-cols-[2.2fr_1.4fr_0.9fr_1.6fr] gap-4 border-b border-slate-200 pb-2 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-slate-400 lg:grid">
        <span>Role</span>
        <span>Where the day goes</span>
        <span>To start</span>
        <span>The hard part</span>
      </div>

      <ul>
        {WORLDS.flatMap((w) =>
          rolesIn(w.id).map((r) => ({ r, w })),
        ).map(({ r, w }) => {
          const on = picked.includes(r.id);
          return (
            <li
              key={r.id}
              className={`grid grid-cols-1 gap-3 border-b border-slate-100 py-3 lg:grid-cols-[2.2fr_1.4fr_0.9fr_1.6fr] lg:items-center lg:gap-4 ${
                on ? "bg-brand-violet/[0.04]" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  aria-label={`Add ${r.title} to the tour`}
                  onClick={() => toggle(r.id)}
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors ${
                    on
                      ? "border-brand-violet bg-brand-violet text-white"
                      : "border-slate-300 text-transparent hover:border-slate-400"
                  }`}
                >
                  <Check size={13} />
                </button>
                <div className="min-w-0">
                  <p className="text-[0.92rem] font-bold leading-tight text-brand-ink">
                    {r.title}
                  </p>
                  <p className="text-[0.76rem] text-slate-400">{w.title}</p>
                </div>
              </div>

              <div>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                  {r.mix.map((m, i) => (
                    <span
                      key={m.label}
                      style={{
                        width: `${m.share}%`,
                        background: `rgb(${w.tint} / ${1 - i * 0.3})`,
                      }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[0.74rem] text-slate-500">
                  {r.mix.map((m) => `${m.share}% ${m.label.toLowerCase()}`).join(" · ")}
                </p>
              </div>

              <p className="text-[0.88rem] font-bold text-brand-ink">
                {pay(r)}
              </p>

              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 flex-1 text-[0.78rem] leading-snug text-slate-500">
                  {r.hard}
                </p>
                <button
                  type="button"
                  className="min-h-10 shrink-0 text-[0.8rem] font-bold text-brand-violet-deep"
                >
                  Open →
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-3 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-surface/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <span className="flex-1 text-[0.82rem] text-slate-600">
          <strong className="font-bold text-brand-ink">
            {picked.length} in your tour
          </strong>{" "}
          · about {picked.length} minute{picked.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          disabled={picked.length === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-5 text-[0.85rem] font-bold text-white disabled:opacity-40"
        >
          Start the tour
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- mosaic -- */

function Mosaic() {
  const [route, setRoute] = useState<string[]>([]);
  const toggle = (id: string) =>
    setRoute((r) =>
      r.includes(id) ? r.filter((x) => x !== id) : r.length >= 5 ? r : [...r, id],
    );

  return (
    <div>
      <p className="text-[0.85rem] text-slate-500">
        Tap the ones you want to see. They become the route, in the order you
        tapped them.
      </p>

      <ul className="mt-4 grid auto-rows-[10.5rem] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ROLES.map((r, i) => {
          const w = worldOf(r.world);
          const at = route.indexOf(r.id);
          const on = at >= 0;
          // Every third tile is wide: a field with a rhythm, not a form.
          const wide = i % 5 === 0;
          return (
            <li key={r.id} className={wide ? "col-span-2" : ""}>
              <button
                type="button"
                onClick={() => toggle(r.id)}
                className={`group relative flex h-full w-full flex-col justify-end overflow-hidden rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
                  on ? "border-brand-violet" : "border-slate-200"
                }`}
                style={{
                  background: `linear-gradient(160deg, rgb(${w.tint} / 0.18), rgb(${w.tint} / 0.04))`,
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-3 select-none text-[4.5rem] opacity-20 transition-transform group-hover:scale-110 motion-reduce:transition-none"
                >
                  {w.glyph}
                </span>

                {on && (
                  <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-brand-violet text-[0.78rem] font-bold text-white">
                    {at + 1}
                  </span>
                )}

                <span className="relative text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  {w.title.split(" ")[0]}
                </span>
                <span className="relative mt-0.5 text-[0.95rem] font-bold leading-tight text-brand-ink">
                  {r.title}
                </span>
                <span className="relative mt-1 text-[0.8rem] font-semibold text-slate-500">
                  {pay(r)}/mo
                </span>
                {wide && (
                  <span className="relative mt-1 text-[0.78rem] leading-snug text-slate-500">
                    {r.summary}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-3 mt-4 rounded-xl border border-slate-200 bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
        {route.length === 0 ? (
          <p className="text-[0.85rem] text-slate-500">
            Nothing picked yet — or let me choose five for you.
          </p>
        ) : (
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.82rem] text-slate-600">
            {route.map((id, i) => (
              <li key={id} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">→</span>}
                <span className="font-semibold text-brand-ink">
                  {ROLES.find((r) => r.id === id)!.title}
                </span>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-5 text-[0.85rem] font-bold text-white"
          >
            {route.length === 0
              ? "Choose five and go"
              : `Walk this route · about ${route.length} min`}
            <ArrowRight size={15} />
          </button>
          {route.length > 0 && (
            <button
              type="button"
              onClick={() => setRoute([])}
              className="min-h-11 text-[0.82rem] font-semibold text-slate-500"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- itinerary -- */

function Itinerary() {
  const [stops, setStops] = useState<string[]>(["csa", "hub", "rel", "guest", "store"]);
  const spare = ROLES.filter((r) => !stops.includes(r.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section>
        <div className="overflow-hidden rounded-2xl border border-brand-violet/30 bg-brand-violet/[0.05]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-violet/20 px-4 py-3">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
                Your tour
              </p>
              <p className="text-[1.05rem] font-bold text-brand-ink">
                {stops.length} stops · about {stops.length} minutes
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-5 text-[0.85rem] font-bold text-white"
            >
              Start
              <ArrowRight size={15} />
            </button>
          </div>

          <ol className="divide-y divide-brand-violet/15">
            {stops.map((id, i) => {
              const r = ROLES.find((x) => x.id === id)!;
              const w = worldOf(r.world);
              return (
                <li key={id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    aria-hidden
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.8rem] font-bold text-white"
                    style={{ background: `rgb(${w.tint})` }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9rem] font-bold leading-tight text-brand-ink">
                      {r.title}
                    </span>
                    <span className="block text-[0.76rem] text-slate-500">
                      {w.title} · {pay(r)}/mo
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStops((s) => s.filter((x) => x !== id))}
                    className="min-h-10 shrink-0 px-2 text-[0.78rem] font-semibold text-slate-400 hover:text-slate-700"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-2 text-[0.78rem] text-slate-400">
          Built from the industries you picked. Swap anything you like.
        </p>
      </section>

      <section>
        <h2 className="text-[0.95rem] font-bold text-brand-ink">
          Swap in another role
        </h2>
        <ul className="mt-3 grid gap-2">
          {spare.map((r) => {
            const w = worldOf(r.world);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setStops((s) => [...s, r.id])}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-brand-violet/50"
                >
                  <span
                    aria-hidden
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base"
                    style={{ background: `rgb(${w.tint} / 0.14)` }}
                  >
                    {w.glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.85rem] font-bold leading-tight text-brand-ink">
                      {r.title}
                    </span>
                    <span className="block text-[0.74rem] text-slate-500">
                      {pay(r)}/mo
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 text-brand-violet-deep">
                    +
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
