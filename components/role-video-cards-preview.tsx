"use client";

import { useRef, useState } from "react";

const cards = [
  { id: "tracking", tag: "ORDER A104", title: "Open the tracking", hint: "See what we actually know.", detail: "Latest scan: warehouse, 11:10 am. Delivery was promised today, but there is no confirmed arrival time. Dispatch contact: Farah.", icon: "↗" },
  { id: "customer", tag: "CUSTOMER CHAT", title: "Read their message", hint: "Understand what’s at stake.", detail: "“These materials are for our college event at six. If they won’t arrive, I need time to arrange something else. Can you please check?”", icon: "≋" },
  { id: "buddy", tag: "YOUR TEAMMATE", title: "Ask where to check", hint: "You don’t have to know everything.", detail: "Prepared teammate guidance: Farah in dispatch can confirm the parcel’s location. A delivery promise and a live arrival estimate are different things.", icon: "↔" },
] as const;
type CardId = (typeof cards)[number]["id"];
type Phase = "ready" | "watching" | "cards" | "continuing" | "done";

export function RoleVideoCardsPreview() {
  const video = useRef<HTMLVideoElement>(null);
  const checkpoint = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [selected, setSelected] = useState<CardId | null>(null);
  const [opened, setOpened] = useState<CardId[]>([]);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState(false);
  const current = cards.find((card) => card.id === selected);
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c7b2ff]";

  function openCards() {
    checkpoint.current = true;
    video.current?.pause();
    setPhase("cards");
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function play(next: Phase) {
    setError(""); setPhase(next);
    try { await video.current?.play(); }
    catch { setError("Playback couldn’t start. Try Play again, or use the written scene below."); }
  }
  function replay() {
    video.current?.pause();
    if (video.current) video.current.currentTime = 0;
    checkpoint.current = false;
    setSelected(null); setOpened([]); setPhase("ready"); setError("");
  }

  return <main className="min-h-screen bg-[#101715] px-3 py-5 text-[#f3f2eb] sm:px-6 sm:py-8">
    <div className="mx-auto max-w-5xl">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-3"><span className="text-2xl font-semibold tracking-tight">ascend<span className="text-[#c7b2ff]">.</span></span><span className="rounded-full border border-white/20 px-3 py-2 text-xs text-[#d0d7d1]">Interactive film · prototype</span></header>
      <div className="mb-6 max-w-xl"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c7b2ff]">Customer success / Your first handover</p><h1 className="text-3xl font-medium leading-tight sm:text-4xl">Their event starts at six.</h1><p className="mt-3 text-sm leading-6 text-[#c5cec7]">Step into the team. Watch what’s happening, then open a work card to decide where you’d look first.</p></div>
      <section className="overflow-hidden rounded-2xl border border-white/15 bg-[#1c2722] shadow-2xl" aria-label="Interactive workplace scene">
        <div className="relative bg-black">
          <video ref={video} src="/previews/workplace-handover.mp4" poster="/previews/workplace-handover-poster.jpg" playsInline preload="metadata" muted={muted} className="aspect-video w-full object-contain" aria-label="AI-generated coworker gives you a delivery enquiry handover" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={() => { if (!checkpoint.current && (video.current?.currentTime ?? 0) >= 6.4) openCards(); }} onEnded={() => { if (!checkpoint.current) openCards(); else if (phase !== "cards") setPhase("done"); }} onError={() => setError("The video couldn’t load. Retry playback or use the written scene below.")}>
            <track kind="captions" src="/previews/workplace-handover.vtt" srcLang="en" label="English" default />
          </video>
          {phase === "ready" && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><button onClick={() => void play("watching")} className={`flex min-h-14 items-center gap-3 rounded-full bg-[#f3f2eb] px-6 py-3 font-semibold text-[#17221c] shadow-lg ${focus}`}><span aria-hidden="true">▶</span> Step into the scene</button></div>}
          {phase === "cards" && <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#171d19]/95 px-3 py-2 text-xs font-medium">Scene paused · your turn</div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-5"><div className="flex items-center gap-1"><button className={`min-h-11 min-w-11 rounded-lg px-3 text-sm disabled:opacity-40 ${focus}`} disabled={phase === "cards" || phase === "done"} onClick={() => playing ? video.current?.pause() : void play(phase === "ready" ? "watching" : phase)}>{playing ? "Pause" : "Play"}</button><button className={`min-h-11 min-w-11 rounded-lg px-3 text-sm ${focus}`} onClick={() => setMuted(!muted)} aria-pressed={muted}>{muted ? "Unmute" : "Mute"}</button><button className={`min-h-11 rounded-lg px-3 text-sm ${focus}`} onClick={() => setTranscript(!transcript)} aria-expanded={transcript}>Transcript</button></div><span className="text-xs text-[#c5cec7]">8-second scene · AI-generated footage</span></div>
        {transcript && <div className="border-b border-white/10 px-5 py-4 text-sm leading-6 text-[#d8dfd8]"><p>A colleague at the support desk turns to you and gestures toward her laptop.</p><p className="mt-2">“They need it by six. Delivery isn’t confirmed. What should we check first?”</p></div>}
        {error && <p role="alert" className="mx-5 my-4 rounded-lg border border-[#e6a997] bg-[#49251e] p-3 text-sm text-[#ffe0d6]">{error}</p>}
        {(phase === "ready" || phase === "watching") && <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"><p className="text-sm text-[#c5cec7]">The film pauses when it’s your turn. No countdown.</p><button onClick={openCards} className={`min-h-11 text-sm underline underline-offset-4 ${focus}`}>Use written scene</button></div>}
        {phase === "cards" && <div className="bg-[#f3f1e9] p-4 text-[#243027] sm:p-6">
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-widest text-[#674ca0]">You’re at the desk</p><h2 ref={heading} tabIndex={-1} className="mt-2 text-2xl font-semibold outline-none">Where would you look first?</h2><p className="mt-2 text-sm leading-6 text-[#586259]">Delivery isn’t confirmed, and the customer needs it by six. Open any card. You can check more than one.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{cards.map((card) => <button key={card.id} type="button" aria-pressed={selected === card.id} onClick={() => { setSelected(card.id); setOpened((old) => old.includes(card.id) ? old : [...old, card.id]); }} className={`min-h-32 rounded-xl border p-4 text-left transition-transform duration-150 motion-safe:hover:-translate-y-1 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6845bb] ${selected === card.id ? "border-[#7656ad] bg-[#e9e1f6]" : "border-[#c8cbbf] bg-[#fffef9]"}`}><span className="flex items-center justify-between text-[10px] font-semibold tracking-widest text-[#586259]">{card.tag}<span className="text-xl" aria-hidden="true">{card.icon}</span></span><span className="mt-4 block text-base font-semibold">{card.title}</span><span className="mt-1 block text-sm leading-5 text-[#586259]">{card.hint}</span><span className="mt-3 block text-xs font-medium text-[#674ca0]">{opened.includes(card.id) ? "Opened · view again" : "Open card →"}</span></button>)}</div>
          {current && <div aria-live="polite" className="mt-4 rounded-xl border border-[#c8cbbf] bg-white p-4"><h3 className="text-sm font-semibold">{current.title}</h3><p className="mt-2 text-sm leading-6">{current.detail}</p></div>}
          <button disabled={!selected} onClick={() => void play("continuing")} className="mt-5 min-h-12 w-full rounded-xl bg-[#6845a0] px-5 py-3 font-semibold text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6845a0]">Continue the film →</button><p className="mt-3 text-xs leading-5 text-[#586259]">Cards reveal prepared work information. This trial resumes the same footage; it does not generate a reaction or score your choice.</p>
        </div>}
        {phase === "continuing" && <p className="px-5 py-5 text-sm text-[#c5cec7]">Back at the desk. The remaining footage is a fixed continuation.</p>}
        {phase === "done" && <div className="bg-[#f3f1e9] p-5 text-[#243027] sm:p-6"><p className="text-xs font-semibold uppercase tracking-widest text-[#674ca0]">End of media trial</p><h2 className="mt-2 text-2xl font-semibold">You looked behind the handover.</h2><p className="mt-3 text-sm leading-6">Cards opened: {opened.map((id) => cards.find((card) => card.id === id)?.title).join(" → ") || "None"}.</p><p className="mt-3 text-sm leading-6 text-[#586259]">That is an interaction record, not proof of skill or potential. A full assessment needs further work and backend evaluation. Nothing from this trial is uploaded or saved after reload.</p><button onClick={replay} className="mt-5 min-h-11 rounded-xl border border-[#a6afa5] px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6845a0]">Replay the experience</button></div>}
      </section>
      <p className="mt-5 text-xs leading-5 text-[#aab7ad]">Fictional people and workplace. No microphone, no written answer, no score. This preview demonstrates the video-and-card interaction only.</p>
    </div>
  </main>;
}
