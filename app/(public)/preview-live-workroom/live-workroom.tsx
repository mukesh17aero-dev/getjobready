"use client";

import { useRef, useState } from "react";

type RecorderState = "ready" | "recording" | "saved" | "unavailable";

export function LiveWorkroom() {
  const [entered, setEntered] = useState(false);
  const [marked, setMarked] = useState(false);
  const [connected, setConnected] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [recorderState, setRecorderState] = useState<RecorderState>("ready");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);

  async function toggleVoice() {
    if (recorderState === "recording") {
      recorder.current?.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecorderState("unavailable");
      return;
    }

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const nextRecorder = new MediaRecorder(stream.current);
      recorder.current = nextRecorder;
      nextRecorder.onstop = () => setRecorderState("saved");
      nextRecorder.start();
      setRecorderState("recording");
    } catch {
      setRecorderState("unavailable");
    }
  }

  function dropIssue() {
    if (!dragging) return;
    setDragging(false);
    setConnected(true);
  }

  function cancelDrag() {
    setDragging(false);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-xl">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-violet-deep">Concept preview</p>
        <h1 className="mt-2 font-display text-[2rem] font-bold leading-[1.05] tracking-tight text-brand-ink sm:text-4xl">A workplace that listens.</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-700">There are no answers to choose. Use the workroom the way you naturally would: notice, mark, connect, and—if it suits you—speak.</p>
      </div>

      <section className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-[1.65rem] border border-slate-800 bg-[#101c25] shadow-2xl shadow-slate-900/15" aria-label="Live customer success workroom">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9d7cff] text-sm font-black text-slate-950">a</span>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-400">Aster customer team</p>
              <p className="text-sm font-semibold text-white">Live workroom</p>
            </div>
          </div>
          <span className="rounded-full bg-violet-300/10 px-2.5 py-1 text-[0.66rem] font-bold text-violet-100">A real work moment</span>
        </header>

        {!entered ? (
          <div className="p-4 sm:p-6">
            <div className="relative min-h-80 overflow-hidden rounded-2xl bg-[linear-gradient(140deg,#1e3c52_0%,#4e6875_46%,#9c7862_47%,#4e382f_100%)] [perspective:900px]">
              <div aria-hidden className="absolute left-[9%] top-12 h-24 w-[29%] rounded-t-xl bg-[#d5dfdd] shadow-[inset_-14px_0_#a0b2b3]" />
              <div aria-hidden className="absolute right-[9%] top-9 h-28 w-[32%] rounded-t-xl bg-[#d6c8b4] shadow-[inset_15px_0_#a69583]" />
              <div aria-hidden className="absolute -inset-x-20 top-32 bottom-[-12rem] origin-top bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.14)_0_1px,transparent_1px_62px),linear-gradient(135deg,#d2b28e,#825a44)] [transform:rotateX(61deg)_scale(1.3)]" />
              <p aria-hidden className="absolute bottom-[4.6rem] left-[25%] text-4xl drop-shadow-lg">🧑🏽‍💻</p>
              <p aria-hidden className="absolute bottom-[4rem] right-[25%] text-4xl drop-shadow-lg">🧑🏾‍💼</p>
              <div className="absolute inset-x-4 bottom-4 rounded-xl bg-[#fffaf0] p-4 text-slate-900 shadow-xl">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-violet-800">Meera · customer lead</p>
                <p className="mt-1 text-base font-semibold leading-snug">“Something’s repeating in the delivery feedback. Come look with me.”</p>
              </div>
            </div>
            <button type="button" onClick={() => setEntered(true)} className="mt-4 min-h-12 w-full rounded-xl bg-[#9d7cff] px-4 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-violet-200 active:translate-y-0 motion-reduce:transition-none">Enter the workroom</button>
          </div>
        ) : (
          <div className="p-3 sm:p-5">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">A pattern is forming</p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-white">Three customers mention the same moment in their delivery. Work with it however feels natural.</p>
            </div>

            <div className="relative mt-3 min-h-[29rem] overflow-hidden rounded-2xl border border-white/10 bg-[#e8e3da] text-slate-900 shadow-inner">
              <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(120deg,#d9e5e5_0%,#afc8d1_100%)]" />
              <div aria-hidden className="absolute left-[8%] top-9 h-16 w-[29%] rounded-t-lg bg-[#537d87] shadow-[inset_-12px_0_#355c68]" />
              <div aria-hidden className="absolute right-[11%] top-7 h-18 w-[27%] rounded-t-lg bg-[#d4a76a] shadow-[inset_11px_0_#a87540]" />
              <div aria-hidden className="absolute -inset-x-16 top-[7.3rem] bottom-[-10rem] origin-top bg-[repeating-linear-gradient(90deg,rgba(72,56,47,.12)_0_1px,transparent_1px_58px),linear-gradient(135deg,#d7b68f,#a77b5a)] [transform:rotateX(58deg)_scale(1.25)]" />
              <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
                <span className="rounded-lg bg-[#17212b]/90 px-2.5 py-1.5 text-[0.65rem] font-bold text-white">Delivery feedback · today</span>
                <span className="rounded-lg bg-[#17212b]/90 px-2.5 py-1.5 text-[0.65rem] text-white/70">No clock</span>
              </div>

              <div className="absolute left-[8%] top-[29%] z-20 w-[60%] rounded-2xl border border-slate-300 bg-[#fffdf9] p-4 shadow-xl">
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-slate-500">The customer trail</p>
                <div className="mt-3 space-y-2">
                  {["‘Tracking stayed frozen after 5 pm.’", "‘I waited at home, but the update never changed.’", "‘The delivery arrived—but the app still said tomorrow.’"].map((message, index) => (
                    <button key={message} type="button" onPointerDown={() => setMarked(true)} className={`block min-h-11 w-full rounded-lg border px-3 py-2 text-left text-[0.76rem] leading-snug transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${marked && index === 1 ? "border-violet-400 bg-violet-50 ring-4 ring-violet-300/35" : "border-slate-200 bg-slate-50"}`}>
                      {message}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[0.65rem] text-slate-500">Touch a trail to mark what catches your eye.</p>
              </div>

              <button type="button" onPointerDown={() => setDragging(true)} onPointerUp={cancelDrag} onPointerCancel={cancelDrag} className={`absolute bottom-[16%] left-[8%] z-30 w-[38%] touch-none rounded-2xl border-2 p-3 text-left shadow-xl transition-transform focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${dragging ? "scale-105 border-violet-400 bg-violet-100" : connected ? "border-emerald-400 bg-emerald-50" : "border-[#f3bd5f] bg-[#ffe0a3]"}`}>
                <span className="block text-[0.64rem] font-bold uppercase tracking-[0.13em] text-slate-600">The signal</span>
                <span className="mt-1 block text-sm font-bold">App status is stale</span>
                <span className="mt-1 block text-[0.65rem] leading-snug text-slate-600">Hold and pull this to Meera.</span>
              </button>

              <div className={`absolute bottom-[25%] left-[41%] z-20 h-1 rounded-full bg-violet-500 transition-[width,opacity] duration-500 motion-reduce:transition-none ${connected ? "w-[29%] opacity-100" : "w-0 opacity-0"}`} />
              <button type="button" onPointerUp={dropIssue} onClick={() => setConnected(true)} className={`absolute bottom-[15%] right-[7%] z-30 w-[35%] rounded-2xl border-2 p-3 text-left shadow-xl transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-violet-500 motion-reduce:transition-none ${connected ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white"}`}>
                <span aria-hidden className="text-xl">🧑🏽‍💼</span>
                <span className="mt-1 block text-sm font-bold">Meera</span>
                <span className="block text-[0.65rem] leading-snug text-slate-600">customer lead · has the delivery team</span>
                {connected && <span className="mt-2 block text-[0.64rem] font-bold text-emerald-800">Context received</span>}
              </button>

              <p aria-hidden className="absolute bottom-5 left-[45%] text-3xl opacity-70">🧑🏾‍💻</p>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-[#1a2a35] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">Optional voice note</p>
                  <p className="mt-0.5 text-[0.75rem] leading-snug text-white/80">Tell Meera what you noticed, in your own words. Voice is one tool—not a requirement.</p>
                </div>
                <button type="button" onClick={toggleVoice} aria-pressed={recorderState === "recording"} className={`flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full border-2 text-xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-violet-200 ${recorderState === "recording" ? "border-rose-300 bg-rose-400 text-slate-950 animate-pulse motion-reduce:animate-none" : "border-violet-300 bg-violet-200 text-slate-950"}`} aria-label={recorderState === "recording" ? "Stop recording voice note" : "Record a voice note"}>●</button>
              </div>
              {recorderState === "recording" && <p className="mt-2 text-[0.7rem] font-semibold text-rose-200">Recording. Tap the circle when you’re done.</p>}
              {recorderState === "saved" && <p className="mt-2 text-[0.7rem] font-semibold text-emerald-200">Voice note captured for this demo. It stays on this device.</p>}
              {recorderState === "unavailable" && <p className="mt-2 text-[0.7rem] text-amber-100">Microphone is unavailable here. The workroom remains fully usable without it.</p>}
            </div>

            {(marked || connected || recorderState === "saved") && <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-3 text-sm leading-relaxed text-emerald-50">The room has your contribution. In production, Ascend would wait for patterns across multiple workrooms before reflecting back what kind of work seems to fit—not turn this moment into a score.</div>}
          </div>
        )}
      </section>

      <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-display text-lg font-bold text-brand-ink">The assessment is in the work, not the controls</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">A production backend can treat a spoken update, a marked pattern, and a clear hand-off as different—but equally valid—forms of evidence. It should never reward English fluency, microphone access, or a particular interaction style.</p>
      </section>
    </main>
  );
}
