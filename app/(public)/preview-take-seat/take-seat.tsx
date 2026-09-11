"use client";

import { useState } from "react";

type Clue = "parcel" | "scan" | "weather";

const CLUES: { id: Clue; number: string; title: string; detail: string }[] = [
  { id: "parcel", number: "01", title: "The parcel", detail: "BLR-82 · still waiting at Dock 4" },
  { id: "scan", number: "02", title: "Last scan", detail: "Marked ready 18 minutes ago" },
  { id: "weather", number: "03", title: "The road", detail: "Rain has slowed the east route" },
];

export function TakeSeat() {
  const [phase, setPhase] = useState<"welcome" | "trace" | "route" | "done">("welcome");
  const [seen, setSeen] = useState<Clue[]>([]);
  const [routed, setRouted] = useState(false);

  const allSeen = seen.length === CLUES.length;

  function inspect(id: Clue) {
    setSeen((current) => (current.includes(id) ? current : [...current, id]));
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-xl">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-violet-deep">Concept preview</p>
        <h1 className="mt-2 font-display text-[2rem] font-bold leading-[1.05] tracking-tight text-brand-ink sm:text-4xl">Take the seat.</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-700">A first-job moment, not a personality game. Follow one real exception through the floor and leave it in a better state than you found it.</p>
      </div>

      <section className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-[1.6rem] border border-slate-800 bg-[#101d26] shadow-2xl shadow-slate-900/15" aria-label="Dispatch hub shift">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5b44b] text-sm font-black text-slate-950">F</span>
            <div>
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.15em] text-slate-400">Flowline dispatch</p>
              <p className="text-sm font-semibold text-white">Bengaluru hub · afternoon</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.68rem] font-bold text-emerald-200">Live floor</span>
        </header>

        {phase === "welcome" ? (
          <div className="p-4 sm:p-6">
            <div className="relative min-h-80 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#2c4856_0%,#718c87_38%,#d3ad75_39%,#936c4f_100%)] [perspective:900px]">
              <div aria-hidden className="absolute inset-x-[8%] top-11 h-20 rounded-t-xl bg-[#d8d1bd] shadow-[inset_12px_0_#b9ae97]" />
              <div aria-hidden className="absolute left-[17%] top-[4.8rem] h-7 w-10 rounded bg-[#27424c]" />
              <div aria-hidden className="absolute right-[19%] top-[4.8rem] h-7 w-10 rounded bg-[#27424c]" />
              <div aria-hidden className="absolute -inset-x-20 top-32 bottom-[-12rem] origin-top bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.17)_0_1px,transparent_1px_64px),linear-gradient(135deg,#ceb07a,#8e674a)] [transform:rotateX(61deg)_scale(1.28)]" />
              <div aria-hidden className="absolute bottom-12 left-[16%] h-12 w-20 rounded bg-[#614b3e] shadow-[0_8px_0_#4c382d]" />
              <div aria-hidden className="absolute bottom-[4.4rem] right-[12%] h-16 w-24 rounded bg-[#755a46] shadow-[0_9px_0_#4e392d]" />
              <p aria-hidden className="absolute bottom-20 left-[31%] text-3xl drop-shadow">🧑🏽‍💼</p>
              <p aria-hidden className="absolute bottom-16 right-[31%] text-3xl drop-shadow">🧑🏾‍🔧</p>
              <div className="absolute inset-x-4 bottom-4 rounded-xl bg-[#fff9eb] p-4 text-slate-900 shadow-xl">
                <p className="text-[0.67rem] font-bold uppercase tracking-[0.14em] text-[#a86621]">Nila · shift lead</p>
                <p className="mt-1 text-base font-semibold leading-snug">“I’ve stepped away. One parcel is stuck—can you trace it?”</p>
              </div>
            </div>
            <button type="button" onClick={() => setPhase("trace")} className="mt-4 min-h-12 w-full rounded-xl bg-[#f5b44b] px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200 active:translate-y-0 motion-reduce:transition-none">Sit at Nila’s desk</button>
          </div>
        ) : (
          <div className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-amber-200">{phase === "trace" ? "Trace the hold-up" : phase === "route" ? "Move the parcel" : "The floor is moving again"}</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-white">{phase === "trace" ? "Touch the things that help you understand what happened." : phase === "route" ? "The west rider is clear. Send BLR-82 onto her run." : "You found the signal, connected the work, and kept the hand-off clear."}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[0.65rem] text-white/65">No clock</span>
            </div>

            <div className="relative mt-3 h-[27rem] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#294b57_0%,#77928b_29%,#bc956e_30%,#6a4e3e_100%)] [perspective:1000px]">
              {/* A work floor in layers: windows, racking, desk and aisle all use only
                  transforms, keeping the scene fast on a mid-range phone. */}
              <div aria-hidden className="absolute left-[8%] top-10 h-24 w-[29%] rounded-t-xl bg-[#d6d2c1] shadow-[inset_-14px_0_#9ca795]" />
              <div aria-hidden className="absolute right-[9%] top-8 h-28 w-[32%] rounded-t-xl bg-[#c7bfaa] shadow-[inset_16px_0_#968c7b]" />
              <div aria-hidden className="absolute left-[15%] top-[4.1rem] h-8 w-11 rounded bg-[#25424b]" />
              <div aria-hidden className="absolute right-[17%] top-[4.3rem] h-8 w-12 rounded bg-[#25424b]" />
              <div aria-hidden className="absolute left-[38%] top-[5.6rem] h-24 w-3 bg-[#31494b]" />
              <div aria-hidden className="absolute left-[31%] top-[3.1rem] h-16 w-16 rounded-full bg-[#446746] shadow-[23px_4px_0_#375a43]" />
              <div aria-hidden className="absolute -inset-x-20 top-[8.5rem] bottom-[-13rem] origin-top bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.15)_0_1px,transparent_1px_68px),linear-gradient(135deg,#d7b889,#8b5f45)] [transform:rotateX(61deg)_scale(1.32)] shadow-[0_-15px_28px_rgba(18,29,28,.25)]" />
              <div aria-hidden className="absolute bottom-0 left-0 h-36 w-full bg-[linear-gradient(90deg,#3f6c55_0_9%,transparent_9%_91%,#3f6c55_91%_100%)] opacity-85" />

              <div className="absolute inset-x-3 top-3 z-10 flex justify-between gap-2">
                <p className="rounded-lg bg-[#102028]/85 px-2.5 py-1.5 text-[0.65rem] font-bold text-white">Dock 4 · 1 exception</p>
                <p className="rounded-lg bg-[#102028]/85 px-2.5 py-1.5 text-[0.65rem] text-white/70">{seen.length}/3 signals read</p>
              </div>

              {phase === "trace" && (
                <>
                  <button type="button" onClick={() => inspect("parcel")} aria-pressed={seen.includes("parcel")} className={`absolute bottom-[21%] left-[11%] z-20 w-[41%] rounded-xl border-2 p-3 text-left shadow-xl transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200 motion-reduce:transition-none ${seen.includes("parcel") ? "border-emerald-300 bg-emerald-50 text-slate-900" : "border-amber-200 bg-[#f2c477] text-slate-950"}`}>
                    <span className="block text-2xl" aria-hidden>▣</span><span className="mt-2 block text-sm font-bold">BLR-82</span><span className="block text-[0.65rem] opacity-70">parcel waiting at Dock 4</span>
                  </button>
                  <button type="button" onClick={() => inspect("scan")} aria-pressed={seen.includes("scan")} className={`absolute bottom-[13%] right-[9%] z-20 w-[43%] rounded-xl border-2 p-3 text-left shadow-xl transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200 motion-reduce:transition-none ${seen.includes("scan") ? "border-emerald-300 bg-emerald-50 text-slate-900" : "border-slate-300 bg-[#e7e9e6] text-slate-900"}`}>
                    <span className="block text-2xl" aria-hidden>▤</span><span className="mt-2 block text-sm font-bold">Scan trail</span><span className="block text-[0.65rem] opacity-70">ready, but not assigned</span>
                  </button>
                  <button type="button" onClick={() => inspect("weather")} aria-pressed={seen.includes("weather")} className={`absolute left-[35%] top-[29%] z-20 w-[36%] rounded-xl border-2 p-3 text-left shadow-xl transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200 motion-reduce:transition-none ${seen.includes("weather") ? "border-emerald-300 bg-emerald-50 text-slate-900" : "border-sky-200 bg-[#cce7f2] text-slate-900"}`}>
                    <span className="block text-2xl" aria-hidden>☂</span><span className="mt-2 block text-sm font-bold">East route</span><span className="block text-[0.65rem] opacity-70">slowed by rain</span>
                  </button>
                </>
              )}

              {phase === "route" && (
                <>
                  <div className="absolute left-[9%] top-[29%] z-20 w-[38%] rounded-xl border border-white/20 bg-[#102028]/90 p-3 text-white shadow-xl"><p className="text-[0.65rem] font-bold uppercase tracking-wide text-amber-200">BLR-82</p><p className="mt-1 text-sm font-semibold">Ready to leave Dock 4</p><p className="mt-1 text-[0.66rem] text-white/65">Drag it toward the clear west route.</p></div>
                  <button type="button" onClick={() => setRouted(true)} className={`absolute bottom-[12%] right-[8%] z-30 w-[46%] rounded-2xl border-2 p-4 text-left shadow-xl transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200 motion-reduce:transition-none ${routed ? "border-emerald-300 bg-emerald-100 text-slate-900" : "border-emerald-300 bg-[#d8f1d4] text-slate-900"}`}>
                    <span className="block text-[0.65rem] font-bold uppercase tracking-wide text-emerald-800">Clear route</span><span className="mt-1 block text-base font-bold">Meera · West run →</span><span className="mt-1 block text-[0.67rem]">Plenty of room before the next collection</span>
                  </button>
                  <div className={`absolute bottom-[29%] left-[18%] z-20 flex items-center gap-1.5 transition-all duration-700 motion-reduce:transition-none ${routed ? "translate-x-40 opacity-100" : "opacity-70"}`}><span className="rounded-lg bg-[#f2c477] px-3 py-2 text-xl shadow-lg">▣</span><span className="h-0.5 w-16 bg-emerald-200" /></div>
                </>
              )}

              {phase === "done" && <div className="absolute inset-x-5 bottom-6 z-30 rounded-2xl bg-[#fff9eb] p-4 text-slate-900 shadow-2xl"><p className="text-[0.67rem] font-bold uppercase tracking-[0.14em] text-emerald-800">Hand-off complete</p><p className="mt-1 text-base font-bold">BLR-82 is on Meera’s west run.</p><p className="mt-1 text-sm leading-relaxed text-slate-600">The next visit could begin with a different exception, in the same working world.</p></div>}
            </div>

            {phase === "trace" && allSeen && <button type="button" onClick={() => setPhase("route")} className="mt-3 min-h-12 w-full rounded-xl bg-[#f5b44b] px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200 motion-reduce:transition-none">I can see the path</button>}
            {phase === "route" && routed && <button type="button" onClick={() => setPhase("done")} className="mt-3 min-h-12 w-full rounded-xl bg-[#f5b44b] px-4 py-3 text-sm font-bold text-slate-950 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200">Confirm the hand-off</button>}
            {phase === "done" && <button type="button" onClick={() => { setPhase("welcome"); setSeen([]); setRouted(false); }} className="mt-3 min-h-12 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200">Run it again</button>}
          </div>
        )}
      </section>

      <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-brand-ink">What makes this an assessment without asking questions</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">The student is not told what trait is being read. Across several visits, the backend can observe what they inspect first, whether they gather context before acting, how they repair a hand-off, and how that changes as the workplace becomes familiar. A single scene is a job shadow—not a score.</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">It cannot prove that someone is ready to run operations, nor should it. It is a humane way to begin discovering whether this kind of work energises them and whether they learn its rhythm.</p>
      </section>
    </main>
  );
}
