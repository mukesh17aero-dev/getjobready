"use client";

import Image from "next/image";
import { useState } from "react";

const SCENES = [
  { title: "Your first customer moment.", speaker: "Meera · your colleague", caption: "A customer needs their order for an event tonight. Come sit with me.", action: "Watch the customer moment →" },
  { title: "The conversation is yours.", speaker: "Customer · captioned scene", caption: "These are for our event at six. Can you promise they’ll arrive?", action: "Keep my response →" },
  { title: "One useful distinction.", speaker: "Meera · demonstration", caption: "When we can’t promise the outcome, we can still make the next step clear.", action: "Try a different situation →" },
  { title: "Different problem. Same responsibility.", speaker: "Customer · next scene", caption: "You said my refund would arrive yesterday. I need that money. When will it come?", action: "Compare my two responses →" },
  { title: "Two attempts. Evidence to discuss.", speaker: "Meera · end of preview", caption: "Let’s look at what changed in your words.", action: "Try again" },
];

export function RoleFilmPreview() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const scene = SCENES[step];
  const responding = step === 1 || step === 3;

  function next() {
    if (responding && !draft.trim()) return;
    if (step === 4) { setStep(0); setAnswers([]); setDraft(""); return; }
    if (responding) { setAnswers((previous) => [...previous, draft.trim()]); setDraft(""); }
    setStep((previous) => previous + 1);
  }

  return (
    <main className="mx-auto w-full max-w-[700px] px-3 py-6 sm:px-6">
      <section className="overflow-hidden rounded-[22px] bg-[#faf8f3] text-[#202a29] shadow-lg" aria-label="Interactive role film preview">
        <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"><span className="text-xl font-bold">ascend<span className="text-[#6345b5]">.</span></span><span className="text-xs text-[#535b57]">Role trial · customer success</span></header>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#26352e] sm:aspect-[3/2]">
          <Image src="/previews/role-film-office.webp" alt="Fictional coworker in an Indian customer-success office" fill priority sizes="(max-width: 700px) 100vw, 650px" className={`object-cover transition-transform duration-[1200ms] motion-reduce:transition-none ${step % 2 ? "scale-105" : "scale-100"}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 rounded-md bg-[#182522] px-3 py-1.5 text-xs text-white">Visual storyboard · fictional coworker</span>
          <div className="absolute inset-x-5 bottom-5 text-white"><p className="mb-2 text-xs uppercase tracking-wider text-[#e1d9f6]">{scene.speaker}</p><p className="text-xl leading-snug sm:text-2xl">“{scene.caption}”</p></div>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6345b5]">{step === 4 ? "Your private reflection" : `${step + 1} / 4 · ${["Watch the handover", "Take over", "Watch a colleague", "Transfer it"][step]}`}</p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight" aria-live="polite">{scene.title}</h1>
          {step === 0 && <div className="mt-3 space-y-2"><p>You can check the order. No countdown. Respond in the language you’re comfortable with.</p><p className="text-sm text-[#56615b]">Interactive storyboard with fixed scenes and a generated still. No AI evaluation or video playback is running. Responses stay in this page’s memory until you leave or reload.</p></div>}
          {(step === 0 || responding) && <details key={step} className="my-3 border-b border-[#d7dcd4] pb-3"><summary className="min-h-11 cursor-pointer py-3">{step === 3 ? "Open the refund record" : "Open the order Meera handed you"}</summary><p className="rounded-lg bg-[#eeeae0] p-3 text-sm leading-relaxed">{step === 3 ? <>Refund R208 · ₹1,200<br />Store approved: Monday<br />Bank settlement: not confirmed<br />Colleague available: payments support</> : <>Order A104 · event materials<br />Promised: today, before 6 pm<br />Latest scan: warehouse, 11:10 am<br />Delivery time: not confirmed<br />Dispatch colleague: Farah</>}</p></details>}
          {responding && <label className="mt-4 block">Your message to the customer<textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write what you would actually say…" className="mt-2 min-h-32 w-full resize-y rounded-xl border border-[#bfc8bf] bg-white p-3 text-base text-[#202a29] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6345b5]" /><span className="mt-1 block text-sm text-[#56615b]">Typing works in this preview. Planned voice flow: record → listen back → confirm transcript → send.</span></label>}
          {step === 2 && <div className="mt-4"><p>Meera’s demonstration:</p><blockquote className="my-3 border-l-4 border-[#878b7a] pl-3">“I understand this is for tonight. I can’t confirm arrival yet. I’ll check with dispatch and update you by 3 pm—even if I’m still waiting for confirmation.”</blockquote><p className="text-sm text-[#56615b]">Notice the distinction between promising an update and promising a delivery. This is a fixed demonstration, not feedback inferred from your answer.</p></div>}
          {step === 4 && <div className="mt-4">{answers.map((answer, index) => <div key={index} className="mb-4"><p className="text-sm font-semibold">{index ? "After the demonstration · refund" : "Before the demonstration · delivery"}</p><blockquote className="mt-2 whitespace-pre-wrap break-words border-l-4 border-[#878b7a] pl-3">{answer}</blockquote></div>)}<p className="text-sm text-[#56615b]">No score has been calculated. A real assessment would examine these responses and use later sessions to test whether any change persists.</p></div>}
          <button type="button" onClick={next} disabled={responding && !draft.trim()} className="mt-5 min-h-12 w-full rounded-xl bg-[#6345b5] px-4 py-3 font-semibold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6345b5]">{scene.action}</button>
        </div>
      </section>
    </main>
  );
}
