"use client";

import { useEffect, useRef, useState } from "react";

export function RoleVideoPreview() {
  const [intro, setIntro] = useState("");
  const [continuation, setContinuation] = useState("");
  const [phase, setPhase] = useState<"watch" | "respond" | "continue" | "done">("watch");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState<"order" | "customer" | "buddy" | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const narration = useRef<HTMLAudioElement>(null);
  const source = phase === "continue" || phase === "done" ? continuation : intro;
  const urls = useRef<string[]>([]);

  useEffect(() => () => { urls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  function choose(file: File | undefined, kind: "intro" | "continuation") {
    if (!file) return;
    if (!file.type.startsWith("video/")) { setError("Choose an MP4, WebM, or another browser-playable video."); return; }
    setError("");
    video.current?.pause();
    narration.current?.pause();
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    if (kind === "intro") setIntro(url); else setContinuation(url);
    setPhase("watch");
  }

  const button = "min-h-11 rounded-xl border border-[#b9c3bc] px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6845bb]";
  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-6">
      <div className="overflow-hidden rounded-3xl bg-[#f8f7f1] text-[#25302b] shadow-xl">
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><span className="text-xl font-bold">ascend.</span><span className="text-sm">Customer success · media trial</span></header>
        <details className="mx-5 mb-5 rounded-xl border border-[#d5d9cf] p-4">
          <summary className="min-h-11 cursor-pointer font-semibold">Optional · try your own workplace videos</summary>
          <p className="mb-4 text-sm">Clips play directly from your device; nothing is uploaded. This preview has fixed transitions and does not evaluate your response.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">1 · Handover clip<input type="file" accept="video/*" onChange={(event) => choose(event.target.files?.[0], "intro")} className="mt-2 block min-h-11 w-full min-w-0 text-sm file:mr-2 file:min-h-11 file:rounded-lg file:border-0 file:bg-[#e9e3f6] file:px-3" /></label>
            <label className="text-sm font-semibold">2 · Continuation clip<input type="file" accept="video/*" onChange={(event) => choose(event.target.files?.[0], "continuation")} className="mt-2 block min-h-11 w-full min-w-0 text-sm file:mr-2 file:min-h-11 file:rounded-lg file:border-0 file:bg-[#e9e3f6] file:px-3" /></label>
          </div>
        </details>
        <div className="relative bg-[#15231d]">
          {source ? <video ref={video} key={source} src={source} controls playsInline preload="metadata" className="aspect-video w-full" onError={() => setError("This clip could not play. Try an H.264 MP4 export.")} onEnded={() => setPhase((current) => current === "watch" ? "respond" : current === "continue" ? "done" : current)} aria-label={phase === "continue" || phase === "done" ? "Workplace continuation clip" : "Workplace handover clip"} /> : <section className="px-5 py-7 text-[#e5e9df]" aria-label="Coworker audio handover">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#d7c8ff]">A moment at the support desk</p>
            <h2 className="mt-3 text-2xl font-semibold">“Could you take over this enquiry?”</h2>
            <p className="mt-3 text-sm leading-6">A customer needs materials for an event tonight. Hear the handover, check the details, then write the reply you would send. No timer. Your buddy is available.</p>
            <audio ref={narration} controls preload="none" src="/previews/role-handover-voice-trial.mp3" className="mt-5 min-h-11 w-full" aria-label="Play the 18-second coworker handover" onError={() => setError("The audio could not load. Read the transcript below and continue without sound.")} onEnded={() => setPhase((current) => current === "watch" ? "respond" : current)} />
            <p className="mt-3 text-xs leading-5">AI-generated voice · 18 seconds · about 295 KB. Audio prototype, not video. The American-accented trial voice is not final casting.</p>
            <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Read the full transcript</summary><p className="text-sm leading-6">Hey, could you take over this delivery enquiry? The customer needs their event materials by six. Our last scan only shows the parcel at the warehouse, so we cannot confirm arrival yet. The order details are here, and you can ask me for help. Take a moment, then reply to the customer in your own words.</p></details>
          </section>}
        </div>
        <div className="p-5">
          <h1 className="text-2xl font-semibold" aria-live="polite">{phase === "watch" ? "Take over the conversation." : phase === "respond" ? "What would you send?" : phase === "continue" ? "Watch what happens next." : "Your contribution, kept in context."}</h1>
          {error && <p role="alert" className="mt-3 text-sm text-[#a42b2b]">{error}</p>}
          {phase === "watch" && <><p className="mt-3 text-sm">You don’t need previous work experience. The handover contains the context you need; finishing playback opens your response. You can also continue without sound.</p><button className={`${button} mt-4`} onClick={() => { video.current?.pause(); narration.current?.pause(); setPhase("respond"); }}>Use written context →</button></>}
          {phase === "respond" && <>
            <p className="mt-3">“These are for our event at six. Can you promise they’ll arrive?”</p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Work materials">
              {([['order','Order record'],['customer','Customer message'],['buddy','Ask your buddy']] as const).map(([id,label]) => <button key={id} type="button" aria-pressed={evidence === id} onClick={() => setEvidence(evidence === id ? null : id)} className={`${button} ${evidence === id ? "bg-[#e9e3f6]" : "bg-white"}`}>{label}</button>)}
            </div>
            {evidence && <p className="mt-3 rounded-xl bg-[#eeeee5] p-4 text-sm" aria-live="polite">{evidence === "order" ? "Order A104 · latest scan: warehouse, 11:10 am. Promised today before 6 pm. No confirmed delivery estimate. Dispatch contact: Farah." : evidence === "customer" ? "The customer needs the materials for tonight’s event. They have asked for a delivery promise, not just a tracking link." : "Buddy’s fixed example: If arrival isn’t confirmed, distinguish what you know from what you will check. You can commit to a time for your next update."}</p>}
            <label className="mt-5 block font-medium">Your message to the customer<textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write the actual message you would send…" className="mt-2 min-h-32 w-full rounded-xl border border-[#b9c3bc] bg-white p-3 text-base focus-visible:outline-2 focus-visible:outline-[#6845bb]" /></label>
            <button type="button" disabled={!draft.trim()} onClick={() => { video.current?.pause(); narration.current?.pause(); setPhase(continuation ? "continue" : "done"); }} className={`${button} mt-4 w-full border-transparent bg-[#6845bb] text-white disabled:opacity-50`}>{continuation ? "Review response · open next clip →" : "Review my response →"}</button>
            <p className="mt-2 text-sm">Your draft stays in this tab only. No upload, AI evaluation, or score. Speaking your response is not enabled yet.</p>
          </>}
          {phase === "continue" && <p className="mt-3 text-sm">Press play for the continuation. This supplied clip is fixed; it was not selected by an AI interpretation of your response.</p>}
          {phase === "done" && <><blockquote className="mt-4 whitespace-pre-wrap break-words border-l-4 border-[#6845bb] pl-4">{draft}</blockquote><p className="mt-4 text-sm">No score or skill conclusion has been generated. Reloading clears this local attempt.</p></>}
          <details className="mt-6 border-t border-[#d5d9cf] pt-3"><summary className="min-h-11 cursor-pointer py-2 text-sm">Recording brief for this scene</summary><p className="text-sm">Handover, 15–20 seconds: an Indian colleague at an ordinary ecommerce support desk turns toward the new employee and explains order A104. Cut to a customer asking about tonight’s event. Continuation, 10–15 seconds: the colleague asks dispatch for a confirmed update, with the order screen visible. Record a neutral continuation first; adaptive reactions require additional clips and the backend. Include captions in the supplied preview clips. Voice response capture is not implemented on this page.</p></details>
        </div>
      </div>
    </main>
  );
}
