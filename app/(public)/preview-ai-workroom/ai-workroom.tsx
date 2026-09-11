"use client";

import { FormEvent, useRef, useState } from "react";

type Message = {
  id: number;
  speaker: "aya" | "customer" | "student";
  text: string;
};

const OPENING: Message[] = [
  { id: 1, speaker: "customer", text: "Hi—my order was meant to arrive today, but tracking hasn’t changed since morning." },
  { id: 2, speaker: "aya", text: "I’m Aya, your shift partner. I’ve opened the order trail beside us. Take a look, then jump in however you would." },
];

const LABELS = {
  aya: "Aya · shift partner",
  customer: "Riya · customer",
  student: "You",
};

export function AiWorkroom() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>(OPENING);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const nextId = useRef(3);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setMessages((current) => [...current, { id: nextId.current++, speaker: "student", text }]);
    setDraft("");
    setThinking(true);
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          speaker: "aya",
          text: "Good catch. I’ve brought delivery operations into the room and added a clear update to Riya’s order. Stay with the thread—what matters is making the next hand-off understandable.",
        },
      ]);
      setHandoff(true);
      setThinking(false);
    }, 700);
  }

  async function toggleVoice() {
    if (recording) {
      recorder.current?.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setDraft("Voice note ready to send");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return;
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const next = new MediaRecorder(stream.current);
      recorder.current = next;
      next.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-xl">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-violet-deep">Concept preview</p>
        <h1 className="mt-2 font-display text-[2rem] font-bold leading-[1.05] tracking-tight text-brand-ink sm:text-4xl">An AI coworker, not an AI examiner.</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-700">The student enters a live job conversation and can contribute in their own words. Aya makes the work visible and keeps it moving; she never asks a test question.</p>
      </div>

      <section className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-[1.65rem] border border-slate-800 bg-[#0e1823] shadow-2xl shadow-slate-900/15" aria-label="AI customer-success workroom">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f5b44b] to-[#fa7b55] text-base font-black text-slate-950">A</span>
            <div>
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-slate-400">Atlas customer team</p>
              <p className="text-sm font-semibold text-white">Aya is working with you</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.66rem] font-semibold text-white/75">Simulation</span>
        </header>

        {!started ? (
          <div className="p-4 sm:p-6">
            <div className="relative min-h-80 overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#233f51_0%,#557483_42%,#ba8a69_43%,#554033_100%)] [perspective:900px]">
              <div aria-hidden className="absolute left-[9%] top-10 h-28 w-[31%] rounded-t-xl bg-[#dce0d5] shadow-[inset_-15px_0_#a7b0a5]" />
              <div aria-hidden className="absolute right-[8%] top-8 h-29 w-[33%] rounded-t-xl bg-[#cfb07d] shadow-[inset_15px_0_#9e794c]" />
              <div aria-hidden className="absolute -inset-x-20 top-32 bottom-[-12rem] origin-top bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.14)_0_1px,transparent_1px_60px),linear-gradient(135deg,#d6b58e,#805a46)] [transform:rotateX(61deg)_scale(1.3)]" />
              <p aria-hidden className="absolute bottom-[4.2rem] left-[24%] text-4xl drop-shadow-lg">🧑🏽‍💻</p>
              <p aria-hidden className="absolute bottom-[4rem] right-[24%] text-4xl drop-shadow-lg">🧑🏾‍💼</p>
              <div className="absolute inset-x-4 bottom-4 rounded-xl bg-[#fffaf0] p-4 text-slate-900 shadow-xl">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-orange-800">Aya · your AI shift partner</p>
                <p className="mt-1 text-base font-semibold leading-snug">“We’ve got one customer moment to work through together.”</p>
              </div>
            </div>
            <button type="button" onClick={() => setStarted(true)} className="mt-4 min-h-12 w-full rounded-xl bg-[#f5b44b] px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200 active:translate-y-0 motion-reduce:transition-none">Join Aya’s shift</button>
          </div>
        ) : (
          <div className="p-3 sm:p-5">
            <div className="rounded-2xl border border-white/10 bg-[linear-gradient(120deg,#18364b,#1e5156)] p-3 shadow-inner">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-amber-200">Riya’s order · 7 minutes ago</p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-white">Status frozen after hand-off from the warehouse.</p>
                </div>
                <span aria-hidden className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${handoff ? "bg-emerald-300" : "bg-amber-300 animate-pulse motion-reduce:animate-none"}`} />
              </div>
              {handoff && <p className="mt-2 border-t border-white/10 pt-2 text-[0.72rem] font-semibold text-emerald-100">Delivery operations now has the context.</p>}
            </div>

            <div className="mt-3 min-h-[22rem] space-y-3 rounded-2xl border border-white/10 bg-[#14232e] p-3" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.speaker === "student" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[86%] rounded-2xl px-3 py-2.5 shadow-sm ${message.speaker === "student" ? "rounded-br-sm bg-[#f5b44b] text-slate-950" : message.speaker === "aya" ? "rounded-bl-sm bg-[#dceeff] text-slate-900" : "rounded-bl-sm bg-white/10 text-white"}`}>
                    <p className={`text-[0.62rem] font-bold uppercase tracking-[0.12em] ${message.speaker === "student" ? "text-slate-700" : message.speaker === "aya" ? "text-[#27546e]" : "text-white/55"}`}>{LABELS[message.speaker]}</p>
                    <p className="mt-1 text-[0.85rem] leading-relaxed">{message.text}</p>
                  </div>
                </div>
              ))}
              {thinking && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-sm bg-[#dceeff] px-3 py-2 text-sm font-semibold text-[#27546e]"><span className="inline-flex gap-1" aria-label="Aya is thinking"><span className="h-1.5 w-1.5 rounded-full bg-[#27546e] animate-bounce motion-reduce:animate-none" /><span className="h-1.5 w-1.5 rounded-full bg-[#27546e] animate-bounce [animation-delay:150ms] motion-reduce:animate-none" /><span className="h-1.5 w-1.5 rounded-full bg-[#27546e] animate-bounce [animation-delay:300ms] motion-reduce:animate-none" /></span></div></div>}
            </div>

            <form onSubmit={sendMessage} className="mt-3 flex items-end gap-2 rounded-2xl border border-white/15 bg-white/5 p-2">
              <button type="button" onClick={toggleVoice} aria-pressed={recording} className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${recording ? "bg-rose-400 text-slate-950 animate-pulse motion-reduce:animate-none" : "bg-white/10 text-white"}`} aria-label={recording ? "Stop recording a voice note" : "Record a voice note"}>●</button>
              <label className="sr-only" htmlFor="ai-workroom-message">Message Aya</label>
              <input id="ai-workroom-message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={recording ? "Recording… tap the circle to finish" : "Say what you would do…"} disabled={recording || thinking} className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-sm text-white placeholder:text-slate-400 focus:outline-none" />
              <button type="submit" disabled={!draft.trim() || thinking} className="min-h-11 rounded-xl bg-[#f5b44b] px-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-200">Send</button>
            </form>
            <p className="mt-2 px-1 text-[0.66rem] leading-relaxed text-slate-400">Speak, type, or simply observe. In production, Aya would respond through a backend model; this preview uses a fixed reply and does not retain your words or audio.</p>
          </div>
        )}
      </section>

      <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-brand-ink">Why this is different from AI role-play</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">Aya is a coworker with shared context, not a hostile interviewer or a chatbot waiting to judge a response. She makes the job’s people, tools, and consequences legible. Over repeated shifts, a backend can reflect on how the student works—not award marks for a single answer.</p>
      </section>
    </main>
  );
}
