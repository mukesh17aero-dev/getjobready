"use client";

// A preview, not a shipped screen: four ways the street could look.
//
// The complaint about the first attempt was fair - flat gradients with a grid
// of windows read as tiles, and nobody believes they are walking into a tile.
// These four all carry the same walk and the same measurement; only the
// surface changes. Reply with a letter.

import { useState } from "react";

const ART = "https://polkexjgphmwtpwhmspk.supabase.co/storage/v1/object/public/street";

type Place = {
  id: string;
  role: string;
  world: string;
  facade: string;
  inside: string;
  hue: string;
};

// Street = industry, building = the place that work happens in. A counter job
// gets a shopfront; a logistics role gets a hub. The signboard carries the
// role, which is what the person is actually choosing between.
const PLACES: Place[] = [
  { id: "store", role: "Customer Success Associate", world: "Retail", facade: `${ART}/facade-store.webp`, inside: `${ART}/inside-store.webp`, hue: "16 185 129" },
  { id: "hub", role: "Operations Coordinator", world: "E-commerce", facade: `${ART}/facade-hub.webp`, inside: `${ART}/inside-hub.webp`, hue: "139 92 246" },
  { id: "office", role: "Support Executive", world: "Services", facade: `${ART}/facade-office.webp`, inside: `${ART}/inside-office.webp`, hue: "56 189 248" },
  { id: "retail", role: "Store Supervisor", world: "Retail", facade: `${ART}/facade-retail.webp`, inside: `${ART}/inside-store.webp`, hue: "251 191 36" },
];

function Frame({
  letter,
  title,
  idea,
  notes,
  children,
}: {
  letter: string;
  title: string;
  idea: string;
  notes: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-violet-deep text-sm font-bold text-white">
          {letter}
        </span>
        <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
      </div>
      <p className="mt-1.5 max-w-prose text-[0.88rem] leading-relaxed text-slate-600">{idea}</p>
      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">{children}</div>
      <ul className="mt-3 space-y-1.5">
        {notes.map((note) => (
          <li key={note} className="flex gap-2 text-[0.83rem] leading-relaxed text-slate-600">
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            {note}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- A: painted street, walked in perspective ---------------------------

function LookA() {
  const [at, setAt] = useState(0);
  return (
    <div
      className="relative h-[24rem] overflow-hidden bg-gradient-to-b from-[#f7d9b0] via-[#e8b98f] to-[#7b6a72]"
      style={{ perspective: "900px", perspectiveOrigin: "50% 62%" }}
    >
      <div
        className="absolute inset-x-0 bottom-0 top-0"
        style={{ transformStyle: "preserve-3d", transform: `translateZ(${at}px)` }}
      >
        {PLACES.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setAt((v) => (v > 900 ? 0 : v + 600))}
            className="absolute bottom-0 w-[420px] cursor-pointer"
            style={{
              left: "50%",
              transform: `translate3d(${i % 2 ? 300 : -300}px, 0, ${-700 - i * 620}px) rotateY(${i % 2 ? -70 : 70}deg)`,
              transformOrigin: i % 2 ? "0% 100%" : "100% 100%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.facade}
              alt={`${p.world} - ${p.role}`}
              className="h-[520px] w-full rounded-t-md object-cover"
            />
            <span
              className="absolute inset-x-6 top-[38%] rounded-md px-3 py-2 text-center shadow-lg"
              style={{ background: `rgb(${p.hue} / 0.95)` }}
            >
              <span className="block text-[0.6rem] font-bold uppercase tracking-wide text-black/55">
                {p.world}
              </span>
              <span className="block text-[0.95rem] font-bold leading-tight text-black/85">
                {p.role}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8 text-center text-[0.78rem] font-semibold text-white">
        Click anywhere to walk on. The sign carries the role; the building is
        the place the work happens.
      </p>
    </div>
  );
}

// ---- B: the lit doorway -------------------------------------------------

function LookB() {
  const [open, setOpen] = useState<Place | null>(null);
  return (
    <div className="relative h-[24rem] bg-[#0b1f24]">
      <div className="flex h-full items-end gap-3 overflow-x-auto p-4">
        {PLACES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(open?.id === p.id ? null : p)}
            className="group relative h-[19rem] w-52 shrink-0 overflow-hidden rounded-t-xl bg-[#0e2b31] text-left"
          >
            {/* The building is a silhouette; the life is what you can see
                through the doorway. One small image does all the work. */}
            <span className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            <span className="absolute inset-x-6 bottom-0 h-40 overflow-hidden rounded-t-lg ring-2 ring-amber-200/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.inside}
                alt={`Inside a ${p.world.toLowerCase()} workplace`}
                className="h-full w-full scale-125 object-cover brightness-110 transition-transform duration-700 group-hover:scale-100 motion-reduce:transition-none"
              />
            </span>
            <span className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-amber-200/25 to-transparent" />
            <span
              className="absolute inset-x-4 top-6 rounded px-2.5 py-1.5 text-center"
              style={{ background: `rgb(${p.hue} / 0.9)` }}
            >
              <span className="block text-[0.58rem] font-bold uppercase tracking-wide text-black/55">
                {p.world}
              </span>
              <span className="block text-[0.82rem] font-bold leading-tight text-black/85">
                {p.role}
              </span>
            </span>
          </button>
        ))}
      </div>
      {open && (
        <p className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-3 text-center text-[0.8rem] font-semibold text-white">
          Looking into {open.role} - the door opens into the day.
        </p>
      )}
    </div>
  );
}

// ---- C: the window, filled ---------------------------------------------

function LookC() {
  return (
    <div className="grid gap-3 bg-slate-100 p-4 sm:grid-cols-2">
      {PLACES.map((p) => (
        <button
          key={p.id}
          type="button"
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.inside}
            alt={`${p.role} at work`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] group-hover:scale-110 motion-reduce:transition-none"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <span className="absolute inset-x-4 bottom-4">
            <span className="block text-[0.62rem] font-bold uppercase tracking-wide text-white/70">
              {p.world}
            </span>
            <span className="block text-[1.05rem] font-bold leading-tight text-white">
              {p.role}
            </span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-teal-300">
              Spend a minute here
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

// ---- D: the industry map ------------------------------------------------

const WORLDS = [
  { id: "retail", name: "Retail", roles: 6, hue: "16 185 129", art: `${ART}/facade-store.webp` },
  { id: "ecom", name: "E-commerce", roles: 5, hue: "139 92 246", art: `${ART}/facade-hub.webp` },
  { id: "services", name: "Services", roles: 4, hue: "56 189 248", art: `${ART}/facade-office.webp` },
  { id: "showroom", name: "Showroom", roles: 3, hue: "251 191 36", art: `${ART}/facade-retail.webp` },
];

function LookD() {
  const [world, setWorld] = useState<string | null>(null);
  return (
    <div className="bg-[#0b1f24] p-4">
      <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-white/50">
        Pick a part of town
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-4">
        {WORLDS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setWorld(world === w.id ? null : w.id)}
            className={`relative h-32 overflow-hidden rounded-2xl text-left ring-2 transition-[ring,transform] duration-300 motion-reduce:transition-none ${
              world === w.id ? "ring-teal-300" : "ring-transparent hover:-translate-y-0.5"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={w.art} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/20" />
            <span className="absolute inset-x-3 bottom-3">
              <span className="block text-[0.95rem] font-bold text-white">{w.name}</span>
              <span className="block text-[0.72rem] text-white/60">{w.roles} roles down here</span>
            </span>
          </button>
        ))}
      </div>
      {world && (
        <p className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-[0.82rem] text-white/70">
          The street for {WORLDS.find((w) => w.id === world)?.name} opens here - the
          walk from the other preview, with only that industry&rsquo;s places on it.
        </p>
      )}
    </div>
  );
}

export default function PreviewStreetLooks() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.8rem] font-bold leading-tight text-brand-ink">
        Four looks for the street
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        Same walk, same measurement underneath - only the surface changes. The
        art is generated and stored with us: about a cent and 70KB a building,
        which is what makes any of this affordable on a phone.
      </p>

      <Frame
        letter="A"
        title="Painted street, walked in perspective"
        idea="Real drawn facades standing on both sides, in the same 3D walk as before. The signboard carries the role; the building is the place the work happens in."
        notes={[
          "The most like the thing you described - you are on a street, not choosing from a grid.",
          "Two images per role: a facade and an interior. About two cents and 150KB each.",
          "Perspective on a photograph is unforgiving: a facade drawn straight-on stretches when it swings to the side, so the art has to be made for the angle.",
        ]}
      >
        <LookA />
      </Frame>

      <Frame
        letter="B"
        title="Dark street, lit doorways"
        idea="The buildings are silhouettes and the only light is what you can see through the door. Cheap, atmospheric, and the eye goes exactly where the work is."
        notes={[
          "One image per role instead of two, and the silhouette is CSS - about a cent a role.",
          "Reads beautifully at 360px because the doorway is the only thing competing for attention.",
          "Less of a place than A: it is a row of doorways rather than a street you are standing in.",
        ]}
      >
        <LookB />
      </Frame>

      <Frame
        letter="C"
        title="Windows into the work"
        idea="No street at all - a wall of moments, each one a person doing the job, drifting slowly. The metaphor goes, the liveliness stays."
        notes={[
          "The cheapest and by far the safest on a slow phone: four images and no 3D at all.",
          "Scales to twenty roles without windowing or frame drops.",
          "Loses the walk - and the walk is what made the measurement feel like something other than a quiz.",
        ]}
      >
        <LookC />
      </Frame>

      <Frame
        letter="D"
        title="Parts of town, then the street"
        idea="Industries first - retail, e-commerce, services - each as a part of town. Choosing one opens the street with only that industry's places on it."
        notes={[
          "This is the answer to your question about industries: the industry is the street, not another building.",
          "Keeps the catalogue navigable when there are forty roles rather than six.",
          "Costs one extra tap before anybody sees a job, which for somebody who does not know what they want is a tap in the wrong direction.",
        ]}
      >
        <LookD />
      </Frame>

      <section className="mt-12 rounded-2xl border border-brand-violet/30 bg-violet-50 p-5">
        <h2 className="text-base font-bold text-brand-ink">What I would do</h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
          <strong>A for the walk, D above it once the catalogue grows.</strong> A
          is the only one that feels like the thing you described, and the
          generated facades are what make it work - an awning, a half-open
          shutter and light on the pavement do more for liveliness than any
          amount of CSS lighting. D is the right shape for industries: a part
          of town, not another door.
        </p>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
          Keep C in your pocket. If the walk turns out to be slow on the phones
          people actually have, a wall of windows into the work is still far
          better than ten questions - and it will never drop a frame.
        </p>
      </section>
    </main>
  );
}
