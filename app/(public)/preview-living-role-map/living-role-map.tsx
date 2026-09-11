"use client";

import { useState } from "react";

type Stage = "intro" | "notice" | "connect" | "flowing";

export function LivingRoleMap() {
  const [stage, setStage] = useState<Stage>("intro");
  const [holding, setHolding] = useState(false);
  const [linked, setLinked] = useState(false);

  function handOff() {
    setLinked(true);
    setStage("flowing");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-xl">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-violet-deep">Concept preview</p>
        <h1 className="mt-2 font-display text-[2rem] font-bold leading-[1.05] tracking-tight text-brand-ink sm:text-4xl">Watch the work move.</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-700">A role assessment can be a living map of the job: people, systems, and customer impact in one place. You intervene directly; animation makes the consequence legible.</p>
      </div>

      <section className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-[1.7rem] border border-slate-800 bg-[#0d1923] shadow-2xl shadow-slate-900/15" aria-label="Customer-success living role map">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-teal-200">Customer success · a live order</p>
            <p className="mt-0.5 text-sm font-semibold text-white">Riya’s delivery journey</p>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.66rem] text-white/70">No clock</span>
        </header>

        {stage === "intro" ? (
          <div className="p-4 sm:p-6">
            <div className="relative min-h-80 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_70%_15%,#4c837e_0%,transparent_25%),linear-gradient(145deg,#193346_0%,#0f222b_100%)]">
              <div aria-hidden className="absolute left-[18%] top-[24%] h-20 w-20 rounded-full border border-teal-200/20 bg-teal-300/10" />
              <div aria-hidden className="absolute right-[14%] top-[38%] h-16 w-16 rounded-full border border-amber-200/20 bg-amber-300/10" />
              <div aria-hidden className="absolute left-[38%] bottom-[18%] h-24 w-24 rounded-full border border-violet-200/20 bg-violet-300/10" />
              <div aria-hidden className="absolute left-[28%] top-[45%] h-px w-[44%] -rotate-[18deg] bg-teal-200/60" />
              <div aria-hidden className="absolute left-[41%] top-[57%] h-px w-[35%] rotate-[32deg] bg-amber-200/50" />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-[#fff9ec] p-4 text-slate-900 shadow-xl">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-teal-800">A moment from the job</p>
                <p className="mt-1 text-base font-semibold leading-snug">One customer is waiting. The work around them is already in motion.</p>
              </div>
            </div>
            <button type="button" onClick={() => setStage("notice")} className="mt-4 min-h-12 w-full rounded-xl bg-brand-teal px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200 active:translate-y-0 motion-reduce:transition-none">Step into the map</button>
          </div>
        ) : (
          <div className="p-3 sm:p-5">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-teal-200">{stage === "notice" ? "Something is stuck" : stage === "connect" ? "Make the hand-off visible" : "The journey is moving again"}</p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-white">{stage === "notice" ? "Press and hold the pause in Riya’s journey." : stage === "connect" ? "Pull the signal to the teammate who can use it." : "Riya can see what is happening; the delivery team has the context."}</p>
            </div>

            <div className="relative mt-3 h-[29rem] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_60%_4%,#31595c_0%,transparent_27%),linear-gradient(160deg,#162c3d_0%,#0a161f_100%)]" aria-label="Animated customer journey map">
              <div aria-hidden className="absolute left-1/2 top-[14%] h-[58%] w-px -translate-x-1/2 bg-gradient-to-b from-teal-300/10 via-teal-200/80 to-amber-200/20" />
              <div aria-hidden className={`absolute left-[25%] top-[40%] h-px w-[50%] bg-gradient-to-r from-violet-200/20 via-violet-200/80 to-teal-200/20 transition-opacity duration-500 motion-reduce:transition-none ${linked ? "opacity-100" : "opacity-30"}`} />
              <div aria-hidden className={`absolute left-[41%] top-[30%] h-[43%] w-[18%] rounded-full border border-teal-200/20 transition-all duration-700 motion-reduce:transition-none ${stage === "flowing" ? "scale-125 opacity-0" : "scale-100 opacity-100"}`} />

              {/* customer */}
              <div className="absolute left-[7%] top-[17%] z-20 w-[35%] rounded-2xl border border-violet-200/20 bg-[#1f2441]/90 p-3 text-white shadow-xl">
                <div className="flex items-center gap-2"><span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-300 text-sm">R</span><div><p className="text-sm font-bold">Riya</p><p className="text-[0.62rem] text-white/60">waiting for clarity</p></div></div>
                <p className="mt-3 text-[0.73rem] leading-relaxed text-white/80">“Has my order left the warehouse yet?”</p>
              </div>

              {/* system status */}
              <div className="absolute left-[14%] top-[49%] z-20 w-[34%] rounded-2xl border border-slate-400/30 bg-[#dbe6e7] p-3 text-slate-900 shadow-xl">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-slate-500">Order system</p><p className="mt-1 text-sm font-bold">BLR-82</p><p className="mt-1 text-[0.67rem] leading-snug text-slate-600">Marked “out for delivery”</p>
              </div>

              {/* highlighted interruption, touched rather than answered */}
              {stage !== "flowing" && <button type="button" onPointerDown={() => { setHolding(true); setStage("connect"); }} onPointerUp={() => setHolding(false)} onPointerCancel={() => setHolding(false)} className={`absolute left-1/2 top-[40%] z-30 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center justify-center rounded-full border-2 text-center shadow-2xl transition-transform duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200 motion-reduce:transition-none ${holding ? "scale-110 border-amber-200 bg-amber-100 text-slate-950" : stage === "connect" ? "border-teal-200 bg-teal-100 text-slate-950" : "border-amber-300 bg-[#efbc62] text-slate-950 animate-pulse motion-reduce:animate-none"}`}>
                <span aria-hidden className="text-xl">Ⅱ</span><span className="mt-1 text-[0.65rem] font-bold leading-tight">status paused</span>
              </button>}

              {/* human response */}
              <button type="button" onPointerEnter={() => { if (holding && stage === "connect") handOff(); }} onPointerUp={handOff} onClick={handOff} className={`absolute right-[7%] top-[48%] z-30 w-[36%] rounded-2xl border-2 p-3 text-left shadow-xl transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200 motion-reduce:transition-none ${linked ? "border-emerald-300 bg-emerald-50 text-slate-900" : "border-teal-200 bg-[#d5efeb] text-slate-900"}`}>
                <div className="flex items-center gap-2"><span aria-hidden className="text-xl">🧑🏽‍💼</span><div><p className="text-sm font-bold">Meera</p><p className="text-[0.62rem] text-slate-600">delivery operations</p></div></div>
                <p className="mt-2 text-[0.65rem] leading-snug text-slate-600">{stage === "connect" ? "Bring the signal here" : linked ? "Context is with Meera" : "The person who can unblock it"}</p>
              </button>

              {/* animated outcome only appears after a hand-off */}
              {stage === "flowing" && <>
                <div aria-hidden className="absolute left-[41%] top-[26%] z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2bd63] text-lg shadow-lg animate-[float_2.8s_ease-in-out_infinite] motion-reduce:animate-none">▣</div>
                <div aria-hidden className="absolute left-[47%] top-[60%] h-12 w-12 rounded-full border-2 border-emerald-300 opacity-70 animate-ping motion-reduce:animate-none" />
                <div className="absolute inset-x-4 bottom-4 z-40 rounded-2xl border border-emerald-200/60 bg-[#effce8] p-4 text-slate-900 shadow-xl"><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-emerald-800">Shared context</p><p className="mt-1 text-sm font-bold">Meera has the stale status; Riya’s update is now clear.</p><p className="mt-1 text-[0.7rem] leading-relaxed text-slate-600">No points awarded. The effect of the work is the feedback.</p></div>
              </>}
            </div>

            {stage === "connect" && <p className="mt-3 rounded-xl bg-teal-50 px-3 py-2.5 text-sm font-semibold text-teal-950">You found the break in the journey. Now make the connection.</p>}
            {stage === "flowing" && <button type="button" onClick={() => { setStage("notice"); setHolding(false); setLinked(false); }} className="mt-3 min-h-12 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-200">Watch a fresh journey</button>}
          </div>
        )}
      </section>

      <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-brand-ink">Animation is the feedback layer</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">The animation does not grade the student. It shows how a customer, a system, and a teammate become connected. In a real product, the backend returns the new work state; the frontend visualises it with transforms and opacity, including a fully understandable reduced-motion state.</p>
      </section>
    </main>
  );
}
