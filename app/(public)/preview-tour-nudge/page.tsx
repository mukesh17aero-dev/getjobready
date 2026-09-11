"use client";

// Four ways to offer the tour on the roles screen.
//
// The problem with the banner is not that it is unclear, it is that it looks
// like every promotional strip anyone has ever scrolled past. Somebody who has
// just chosen their industries is in a hurry to see roles; a rectangle above
// the roles is the thing between them and that.
//
// So each of these puts the offer somewhere different in the person's path:
//
//   Banner     above the grid, as now. Honest, ignorable.
//   Tile       the first card in the grid, in the same shape as a role. It
//              cannot be scrolled past because it is one of the things being
//              scrolled through.
//   Bar        a strip that follows you up from the bottom once you have
//              scrolled a little - offered after they have seen what is here,
//              which is when "walk me through it" starts to sound useful.
//   Assistant  the guide asks, in its own voice, from the corner it already
//              lives in. Not a banner at all: a person offering.
//
// Sample content, real components' styling.

import { useState } from "react";
import { ArrowRight } from "@/components/icons";

const TILES = [
  { id: "a", world: "RETAIL", tint: "244 114 182", glyph: "\u{1F6CD}", title: "Operations Executive", line: "Run the shop floor: stock, staffing, standards.", pay: "₹15K–₹22K/mo to start" },
  { id: "b", world: "BANKING", tint: "56 189 248", glyph: "\u{1F3E6}", title: "Relationship Executive", line: "Grow relationships, match products, hit targets.", pay: "₹16K–₹26K/mo to start" },
  { id: "c", world: "LOGISTICS", tint: "45 212 191", glyph: "\u{1F4E6}", title: "Operations Coordinator", line: "Keep daily operations moving: priorities, exceptions.", pay: "₹18K–₹26K/mo to start" },
  { id: "d", world: "FOOD", tint: "251 191 36", glyph: "\u{1F37D}", title: "Guest Experience Associate", line: "Own the guest's experience through the rush.", pay: "₹15K–₹22K/mo to start" },
  { id: "e", world: "CUSTOMER", tint: "139 92 246", glyph: "\u{1F3A7}", title: "Customer Success Associate", line: "Solve issues, coordinate teams, protect relationships.", pay: "₹20K–₹30K/mo to start" },
];

const OPTIONS = [
  { id: "banner", name: "Banner", line: "Above the grid, as now. Honest, and easy to scroll past." },
  { id: "tile", name: "Tile in the grid", line: "The first card, in the same shape as a role. Cannot be skipped, because it is one of the things being looked at." },
  { id: "bar", name: "Bar on scroll", line: "Comes up from the bottom once they have seen a few - which is when being walked through starts to sound useful." },
  { id: "assistant", name: "The guide asks", line: "Not a banner: the assistant offering, in its own voice, from the corner it already lives in." },
] as const;

export default function PreviewTourNudge() {
  const [option, setOption] = useState<(typeof OPTIONS)[number]["id"]>("tile");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-40 pt-8 sm:px-6">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
        Preview
      </p>
      <h1 className="mt-1 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        Four ways to offer the tour
      </h1>
      <p className="mt-2 max-w-[62ch] text-[0.95rem] leading-relaxed text-slate-500">
        Same offer, four places in the path. Scroll on the third one - it only
        appears once you have looked at something.
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
      <p className="mt-2 max-w-[68ch] text-[0.85rem] text-slate-500">
        {OPTIONS.find((o) => o.id === option)!.line}
      </p>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-3 sm:p-5">
        <h2 className="font-display text-[1.6rem] font-bold tracking-tight text-brand-ink">
          Roles
        </h2>

        {option === "banner" && <Banner />}

        <ul className="mt-3 grid auto-rows-[13rem] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {option === "tile" && <TourTile />}
          {TILES.map((t) => (
            <li key={t.id}>
              <RoleTile tile={t} />
            </li>
          ))}
        </ul>

        {option === "bar" && <ScrollBar />}
        {option === "assistant" && <GuideAsks />}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ parts -- */

function RoleTile({ tile }: { tile: (typeof TILES)[number] }) {
  return (
    <div
      className="relative flex h-full flex-col justify-end overflow-hidden rounded-2xl border border-slate-200 p-4"
      style={{
        background: `linear-gradient(160deg, rgb(${tile.tint} / 0.18), rgb(${tile.tint} / 0.04))`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-3 select-none text-[4.5rem] opacity-20"
      >
        {tile.glyph}
      </span>
      <span className="relative text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">
        {tile.world}
      </span>
      <span className="relative mt-0.5 text-[0.95rem] font-bold leading-tight text-brand-ink">
        {tile.title}
      </span>
      <span className="relative mt-1 text-[0.78rem] leading-snug text-slate-500">
        {tile.line}
      </span>
      <span className="relative mt-2 text-[0.82rem] font-semibold text-slate-500">
        {tile.pay}
      </span>
    </div>
  );
}

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

/* ----------------------------------------------------------------- banner -- */

function Banner() {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand-violet/30 bg-brand-violet/5 px-4 py-3 sm:flex-row sm:items-center sm:gap-x-4">
      <span className="min-w-0 max-w-[68ch] flex-1 text-[0.86rem] text-slate-600">
        <strong className="font-bold text-brand-ink">
          Rather be walked through them?
        </strong>{" "}
        Not the job description - the half of it nobody can look up. Five
        minutes or ten, whichever you have.
      </span>
      <button
        type="button"
        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-violet px-5 text-[0.86rem] font-bold text-white sm:w-auto"
      >
        Plan the tour
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------- tile -- */

function TourTile() {
  return (
    <li className="sm:col-span-2">
      <button
        type="button"
        className="group relative flex h-full w-full flex-col justify-end overflow-hidden rounded-2xl border border-brand-violet/50 p-5 text-left transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
        style={{
          background:
            "linear-gradient(140deg, var(--color-brand-violet-soft) -30%, rgb(13 148 136 / 0.18) 40%, transparent 100%)",
        }}
      >
        <span className="absolute right-4 top-4">
          <Orb size={52} />
        </span>
        <span className="relative text-[0.68rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
          Discovery assistant
        </span>
        <span className="relative mt-1 max-w-[30ch] text-[1.1rem] font-bold leading-tight text-brand-ink">
          Let me walk you through five of these
        </span>
        <span className="relative mt-1.5 max-w-[46ch] text-[0.82rem] leading-snug text-slate-600">
          Two minutes each: why the job matters, what it opens up, how they
          actually hire for it. The half a description never tells you.
        </span>
        <span className="relative mt-3 inline-flex w-fit items-center gap-2 rounded-xl bg-brand-violet px-4 py-2.5 text-[0.84rem] font-bold text-white">
          Plan the tour
          <ArrowRight size={14} />
        </span>
      </button>
    </li>
  );
}

/* -------------------------------------------------------------------- bar -- */

function ScrollBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <Orb size={38} />
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9rem] font-bold text-brand-ink">
            Not sure which of these to open?
          </span>
          <span className="block text-[0.8rem] text-slate-500">
            I will take you through five of them, about two minutes each.
          </span>
        </span>
        <button
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-violet px-5 text-[0.86rem] font-bold text-white"
        >
          Plan the tour
          <ArrowRight size={15} />
        </button>
        <button
          type="button"
          className="min-h-11 shrink-0 text-[0.82rem] font-semibold text-slate-500"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- assistant -- */

function GuideAsks() {
  const [gone, setGone] = useState(false);
  if (gone) {
    return (
      <button
        type="button"
        onClick={() => setGone(false)}
        className="fixed bottom-5 right-5 z-40 inline-flex min-h-14 items-center gap-2.5 rounded-full bg-brand-violet pl-3 pr-5 text-[0.88rem] font-bold text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)]"
      >
        <Orb size={36} />
        Ask about these roles
      </button>
    );
  }
  return (
    <div className="fixed bottom-5 right-5 z-40 w-[min(23rem,calc(100vw-2.5rem))] rounded-2xl border border-brand-violet/40 bg-surface p-4 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.5)]">
      <div className="flex gap-3">
        <Orb />
        <div className="min-w-0 flex-1">
          <p className="text-[0.86rem] leading-relaxed text-slate-700">
            Six roles is a lot to read cold. Want me to take you through five of
            them instead - two minutes each, and you can ask me anything as we
            go?
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-violet px-4 text-[0.84rem] font-bold text-white"
            >
              Go on then
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => setGone(true)}
              className="min-h-11 px-2 text-[0.82rem] font-semibold text-slate-500"
            >
              I will look myself
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
