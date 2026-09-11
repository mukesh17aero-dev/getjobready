"use client";

import { useState } from "react";

type Prop = {
  id: string;
  icon: string;
  name: string;
  note: string;
};

type Zone = {
  id: string;
  icon: string;
  name: string;
  hint: string;
  tone: string;
};

const FIRST_SET: Prop[] = [
  { id: "sign", icon: "↗", name: "direction board", note: "make the first step obvious" },
  { id: "lights", icon: "✦", name: "string lights", note: "give a corner some energy" },
  { id: "mat", icon: "▤", name: "welcome mat", note: "make a small arrival" },
];

const SECOND_SET: Prop[] = [
  { id: "shade", icon: "◒", name: "shade cloth", note: "make room for a longer stay" },
];

const ZONES: Zone[] = [
  { id: "gate", icon: "⌂", name: "main gate", hint: "first impressions happen here", tone: "bg-sky-100 border-sky-200" },
  { id: "stage", icon: "♫", name: "open stage", hint: "where the buzz builds", tone: "bg-rose-100 border-rose-200" },
  { id: "chai", icon: "☕", name: "chai corner", hint: "where conversations land", tone: "bg-amber-100 border-amber-200" },
];

function placedIn(placements: Record<string, string>, zoneId: string) {
  return Object.entries(placements)
    .filter(([, value]) => value === zoneId)
    .map(([id]) => [...FIRST_SET, ...SECOND_SET].find((prop) => prop.id === id))
    .filter((prop): prop is Prop => Boolean(prop));
}

export function CourtyardFest() {
  const [step, setStep] = useState<"welcome" | "set" | "shift" | "close">("welcome");
  const [selected, setSelected] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [lastPlaced, setLastPlaced] = useState<string | null>(null);

  const available = step === "shift" ? SECOND_SET : FIRST_SET;
  const completeFirst = FIRST_SET.every((prop) => placements[prop.id]);
  const completeSecond = SECOND_SET.every((prop) => placements[prop.id]);

  function place(zoneId: string) {
    if (!selected) return;
    setLastPlaced(selected);
    setPlacements((current) => ({ ...current, [selected]: zoneId }));
    setSelected(null);
  }

  function reset() {
    setPlacements({});
    setSelected(null);
    setLastPlaced(null);
    setStep("set");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-3 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-xl">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-violet-deep">
          A small playtest
        </p>
        <h1 className="mt-2 font-display text-[2rem] font-bold leading-[1.05] tracking-tight text-brand-ink sm:text-4xl">
          Courtyard before the fest
        </h1>
        <p className="mt-3 text-[0.94rem] leading-relaxed text-slate-700">
          Help the courtyard feel like the place everyone wants to be.
        </p>
      </div>

      <section aria-label="Courtyard play area" className="mx-auto mt-6 max-w-xl overflow-hidden rounded-[1.7rem] border border-[#20363c] bg-[#102a2e] shadow-xl shadow-teal-950/10">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-teal-200">
              Srijan college fest
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">Courtyard · 3:20 pm</p>
          </div>
          <span className="rounded-full border border-teal-200/20 bg-teal-300/10 px-2.5 py-1 text-[0.7rem] font-semibold text-teal-100">
            No clock. Take your time.
          </span>
        </header>

        {step === "welcome" ? (
          <div className="p-5 sm:p-7">
            <div className="relative min-h-64 overflow-hidden rounded-2xl border border-white/10 bg-[#1b4542] p-5">
              <div aria-hidden className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-amber-200/20" />
              <div aria-hidden className="absolute bottom-0 left-0 h-20 w-full bg-[#265d4a]" />
              <p className="relative text-4xl">🏫</p>
              <div className="relative mt-14 max-w-[15rem] rounded-2xl bg-[#fff7e8] p-4 text-[#243036] shadow-lg">
                <p className="text-[0.7rem] font-bold uppercase tracking-wide text-teal-800">Asha · fest crew</p>
                <p className="mt-1 text-base font-semibold leading-snug">“Make it feel alive?”</p>
              </div>
              <p className="absolute bottom-4 right-4 text-2xl" aria-hidden>🧑🏽‍🤝‍🧑🏾</p>
            </div>
            <button type="button" onClick={() => setStep("set")} className="mt-4 min-h-11 w-full rounded-xl bg-brand-teal px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200 active:translate-y-0 motion-reduce:transition-none">
              I’m in
            </button>
          </div>
        ) : (
          <div className="p-3 sm:p-5">
            <div className="rounded-2xl bg-[#fff9ed] p-4 text-[#243036]">
              {step === "set" && (
                <>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-teal-800">Before the gates open</p>
                  <p className="mt-1 text-base font-semibold leading-snug">Pick a thing. Drop it where it feels right.</p>
                </>
              )}
              {step === "shift" && (
                <>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-teal-800">The light has changed</p>
                  <p className="mt-1 text-base font-semibold leading-snug">The sun is hitting hard. Give people one good spot to stay.</p>
                </>
              )}
              {step === "close" && (
                <>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-teal-800">You made a place</p>
                  <p className="mt-1 text-sm leading-relaxed">That is enough for today. In the real companion, patterns emerge across a few places and visits—not from one “correct” move.</p>
                </>
              )}
            </div>

            {step !== "close" && (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2" aria-label="Things you can add">
                  {available.map((prop) => {
                    const isPlaced = Boolean(placements[prop.id]);
                    const isSelected = selected === prop.id;
                    return (
                      <button key={prop.id} type="button" onClick={() => setSelected(isSelected ? null : prop.id)} aria-pressed={isSelected} disabled={isPlaced} className={`min-h-28 rounded-2xl border p-3 text-left transition-transform duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200 motion-reduce:transition-none ${isSelected ? "-translate-y-1.5 border-teal-300 bg-teal-100 text-slate-900 shadow-lg shadow-teal-950/30" : "border-white/15 bg-white/10 text-white hover:-translate-y-1"} ${isPlaced ? "cursor-default opacity-35" : ""}`}>
                        <span aria-hidden className="block text-3xl">{prop.icon}</span>
                        <span className="mt-2 block text-[0.76rem] font-bold leading-tight">{prop.name}</span>
                        <span className="mt-1 block text-[0.62rem] leading-tight opacity-70">{isPlaced ? "done" : prop.note}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative mt-3 h-[25rem] overflow-hidden rounded-2xl border border-white/10 bg-[#9bc4d1] [perspective:900px]" aria-label="A three-dimensional view into the courtyard">
                  {/* Far layer: buildings and sky. The scene is deliberately built from
                      inexpensive CSS layers, so it reads as a place without shipping a
                      heavy WebGL scene to a 3G phone. */}
                  <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,#7fb6d0_0%,#d9e5d6_74%,#f7d895_75%,#f7d895_100%)]" />
                  <div aria-hidden className="absolute left-[7%] top-12 h-24 w-[31%] rounded-t-[1.1rem] bg-[#d77950] shadow-[inset_-16px_0_0_#aa4e3e]" />
                  <div aria-hidden className="absolute left-[13%] top-[4.6rem] h-9 w-[7%] rounded-t-md bg-[#263d46]" />
                  <div aria-hidden className="absolute left-[24%] top-[4.6rem] h-9 w-[7%] rounded-t-md bg-[#263d46]" />
                  <div aria-hidden className="absolute right-[6%] top-9 h-28 w-[36%] rounded-t-[1.4rem] bg-[#e2b85d] shadow-[inset_18px_0_0_#c38e42]" />
                  <div aria-hidden className="absolute right-[15%] top-[4rem] h-10 w-[9%] rounded-t-md bg-[#30404b]" />
                  <div aria-hidden className="absolute right-[29%] top-[4rem] h-10 w-[9%] rounded-t-md bg-[#30404b]" />
                  <div aria-hidden className="absolute left-[47%] top-14 h-14 w-1.5 bg-[#435b45]" />
                  <div aria-hidden className="absolute left-[41%] top-8 h-16 w-16 rounded-full bg-[#315d43] shadow-[20px_8px_0_#42774f]" />
                  {/* Ground plane: rotated away from the viewer to create depth. */}
                  <div aria-hidden className="absolute -inset-x-14 top-[7.6rem] bottom-[-10rem] origin-top bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.16)_0_1px,transparent_1px_58px),linear-gradient(135deg,#d7bc93,#a77955)] [transform:rotateX(59deg)_scale(1.24)] shadow-[0_-14px_22px_rgba(39,46,37,.2)]" />
                  <div aria-hidden className="absolute bottom-0 left-0 h-28 w-full bg-[linear-gradient(90deg,#315f4b_0_11%,transparent_11%_89%,#315f4b_89%_100%)] opacity-80" />
                  <div className="absolute inset-x-0 top-3 z-10 flex items-center justify-between px-3">
                    <p className="rounded-full bg-[#172c32]/80 px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-white">Look around</p>
                    <p className="rounded-full bg-[#172c32]/80 px-2.5 py-1 text-[0.64rem] text-white/80">{selected ? "Drop it into the scene" : "Pick your move"}</p>
                  </div>
                  <p aria-hidden className="absolute bottom-8 left-[8%] z-10 text-2xl drop-shadow">🧑🏽</p>
                  <p aria-hidden className="absolute bottom-12 right-[11%] z-10 text-2xl drop-shadow">🧑🏾‍🦱</p>
                  {ZONES.map((zone, index) => {
                    const here = placedIn(placements, zone.id);
                    const positions = ["left-[8%] top-[31%] w-[45%]", "bottom-[14%] left-[7%] w-[42%]", "bottom-[9%] right-[7%] w-[42%]"];
                    return (
                      <button key={zone.id} type="button" onClick={() => place(zone.id)} className={`absolute z-20 rounded-2xl border-2 p-3 text-left shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-100 active:translate-y-0 motion-reduce:transition-none ${positions[index]} ${zone.tone}`}>
                        <span aria-hidden className="text-2xl">{zone.icon}</span>
                        <span className="mt-5 block text-sm font-bold leading-tight text-slate-900">{zone.name}</span>
                        <span className="mt-1 block text-[0.65rem] leading-tight text-slate-700">{zone.hint}</span>
                        <span className="mt-3 flex min-h-6 flex-wrap gap-1" aria-label={here.length ? `Placed here: ${here.map((prop) => prop.name).join(", ")}` : "Nothing placed here yet"}>
                          {here.map((prop) => <span key={prop.id} title={prop.name} className={`rounded-lg bg-white/90 px-2 py-1 text-sm text-slate-800 shadow-sm ${lastPlaced === prop.id ? "animate-pop" : ""}`}>{prop.icon}</span>)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="mt-4 flex gap-2">
              {step === "set" && completeFirst && <button type="button" onClick={() => setStep("shift")} className="min-h-11 flex-1 rounded-xl bg-brand-teal px-4 py-3 text-sm font-bold text-slate-950 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200">See the afternoon change</button>}
              {step === "shift" && completeSecond && <button type="button" onClick={() => setStep("close")} className="min-h-11 flex-1 rounded-xl bg-brand-teal px-4 py-3 text-sm font-bold text-slate-950 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200">Step back</button>}
              {step === "close" && <button type="button" onClick={reset} className="min-h-11 flex-1 rounded-xl bg-brand-teal px-4 py-3 text-sm font-bold text-slate-950 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200">Try another setup</button>}
              {step !== "close" && <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200">Reset</button>}
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-brand-ink">What this deliberately reads</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">Over a handful of familiar places, Ascend can observe where someone starts, whether they create clarity, energy or comfort, and whether new information makes them revisit a setup. The backend—not this prototype—would turn those repeated interaction traces into a private, explainable fit and growth conversation.</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">It cannot establish job competence, integrity, writing ability, numerical reasoning, or “the best” decision from this one scene. It should never pretend to.</p>
      </section>
    </main>
  );
}
