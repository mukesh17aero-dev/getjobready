"use client";

// The open step, laid out exactly like the learner's activity page: title,
// the "type · minutes · XP" line, instructions, media, lesson text, cards or
// questions, feedback, and the button they press. Every part is edited where
// it sits. What the learner never sees (settings, AI help) is in the strip
// under the page.

import { useState } from "react";
import type { StudioJourney, StudioJourneyData, LearningStep } from "@/lib/api";
import { AiPanel } from "./ai-panel";
import { MediaPanel } from "./media-panel";
import { kindOf, newCard, newOption, newQuestion, touched } from "./step-kinds";
import s from "./learning-studio.module.css";

export function StepPage({
  journeyId, journey, level, step, onChange, onDuplicate, onRemove, onSaved,
}: {
  journeyId: string;
  journey: StudioJourney;
  level: StudioJourneyData["level"];
  step: LearningStep;
  onChange: (next: LearningStep) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onSaved: (journey: StudioJourney) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const scenario = step.type === "scenario";
  const assessed = step.type === "quiz" || scenario;
  const hasMedia = step.type === "image" || step.type === "video" || step.type === "audio";
  // Any hand edit after accepting AI content records that a person changed it.
  const set = (patch: Partial<LearningStep>) => onChange(touched({ ...step, ...patch }));
  const setQuestion = (id: string, patch: Partial<LearningStep["questions"][number]>) =>
    set({ questions: step.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) });

  return (
    <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
      <section className={s.player} aria-label="Activity">
        {step.pending && <p className={s.notice} role="status">An AI draft is waiting for you. Open <strong>AI help</strong> below to read it and decide.</p>}

        <input className={s.titleInput} aria-label="Step title" maxLength={120} value={step.title} onChange={(e) => set({ title: e.target.value })} placeholder={`Untitled ${kindOf(step.type).label.toLowerCase()}`} />
        <p className={s.muted}>{step.type} · {Math.ceil(step.durationSeconds / 60)} min · {step.xp} XP{!step.required ? " · Optional" : ""}</p>

        <div className={s.slot}>
          <span className={s.slotLabel}>Instructions · optional</span>
          <textarea rows={2} aria-label="Instructions" value={step.instructions} onChange={(e) => set({ instructions: e.target.value })} placeholder="A line above the task, e.g. Read this, then answer the questions." />
        </div>

        {hasMedia && (
          <div className={s.slot}>
            <span className={s.slotLabel}>{step.type === "image" ? "Image" : step.type === "video" ? "Video" : "Audio"}</span>
            <MediaPanel journeyId={journeyId} journey={journey} step={step} onChange={set} onSaved={onSaved} />
            {step.type === "image" && <label>Image description for screen readers<input maxLength={300} value={step.altText} onChange={(e) => set({ altText: e.target.value })} /></label>}
          </div>
        )}

        {(step.type === "video" || step.type === "audio") && (
          <div className={s.slot}>
            <span className={s.slotLabel}>Transcript · learners can read this instead</span>
            <textarea className={s.contentInput} aria-label="Transcript" value={step.transcript} onChange={(e) => set({ transcript: e.target.value })} placeholder="Everything that is said, word for word." />
          </div>
        )}

        {(step.type === "text" || step.type === "callout" || step.type === "image" || scenario) && (
          <div className={s.slot}>
            <span className={s.slotLabel}>{scenario ? "The situation" : step.type === "image" ? "What to notice" : step.type === "callout" ? "Key point" : "Lesson text"}</span>
            <textarea className={s.contentInput} aria-label="Lesson text" value={step.body} onChange={(e) => set({ body: e.target.value })} placeholder={scenario ? "A customer comes to the counter with a product they bought three weeks ago…" : "Write it the way you would say it out loud."} />
          </div>
        )}

        {step.type === "flashcard" && (
          <div className={s.flashcard}>
            {step.cards.map((c, i) => (
              <article key={c.id}>
                <label>Front of card {i + 1}<input value={c.front} onChange={(e) => set({ cards: step.cards.map((x) => (x.id === c.id ? { ...x, front: e.target.value } : x)) })} /></label>
                <label>Back (shown when they reveal it)<textarea rows={2} value={c.back} onChange={(e) => set({ cards: step.cards.map((x) => (x.id === c.id ? { ...x, back: e.target.value } : x)) })} /></label>
                <button type="button" className={s.danger} onClick={() => set({ cards: step.cards.filter((x) => x.id !== c.id) })}>Remove card {i + 1}</button>
              </article>
            ))}
            <button type="button" className={s.secondary} disabled={step.cards.length >= 30} onClick={() => set({ cards: [...step.cards, newCard()] })}>Add a card</button>
          </div>
        )}

        {assessed && (
          <div className={s.questions}>
            {step.questions.map((q, qi) => (
              <fieldset key={q.id} className={s.question}>
                <legend>
                  <label>{qi + 1}. {scenario ? "What do they have to decide?" : "Question"}
                    <textarea rows={2} value={q.prompt} onChange={(e) => setQuestion(q.id, { prompt: e.target.value })} />
                  </label>
                </legend>
                {!scenario
                  ? <label className={s.check}><input type="checkbox" checked={q.multiple} onChange={(e) => setQuestion(q.id, { multiple: e.target.checked })} />More than one answer can be right (“Choose all that apply.”)</label>
                  : <p className={s.muted}>Choose one answer.</p>}
                {q.options.map((o, oi) => (
                  <div key={o.id} className={s.option} data-right={(scenario ? o.weight === 100 : o.correct) || undefined}>
                    <input aria-label={`${scenario ? "Choice" : "Answer"} ${oi + 1}`} value={o.text} onChange={(e) => setQuestion(q.id, { options: q.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })} placeholder={`${scenario ? "Choice" : "Answer"} ${oi + 1}`} />
                    {scenario ? (
                      <label><input type="radio" name={`best-${q.id}`} checked={o.weight === 100} onChange={() => setQuestion(q.id, { options: q.options.map((x) => ({ ...x, weight: x.id === o.id ? 100 : 0 })) })} />Best</label>
                    ) : (
                      <label><input type="checkbox" checked={o.correct} onChange={(e) => setQuestion(q.id, { options: q.options.map((x) => (x.id === o.id ? { ...x, correct: e.target.checked } : q.multiple ? x : { ...x, correct: false })) })} />Correct</label>
                    )}
                    <button type="button" className={s.danger} aria-label={`Remove ${scenario ? "choice" : "answer"} ${oi + 1}`} disabled={q.options.length <= 2} onClick={() => setQuestion(q.id, { options: q.options.filter((x) => x.id !== o.id) })}>×</button>
                  </div>
                ))}
                <div className={s.row}>
                  <button type="button" className={s.secondary} disabled={q.options.length >= (scenario ? 4 : 6)} onClick={() => setQuestion(q.id, { options: [...q.options, newOption()] })}>Add {scenario ? "a choice" : "an answer"}</button>
                  <button type="button" className={s.danger} disabled={step.questions.length <= 1} onClick={() => set({ questions: step.questions.filter((x) => x.id !== q.id) })}>Remove {scenario ? "decision" : "question"} {qi + 1}</button>
                </div>
                <section className={s.feedback} aria-label="Feedback after they answer">
                  <h3>Shown after they check their answer</h3>
                  <textarea rows={2} aria-label="Explanation" value={q.explanation} onChange={(e) => setQuestion(q.id, { explanation: e.target.value })} placeholder={scenario ? "What a good decision looks like, and why." : "Why that answer is right."} />
                </section>
              </fieldset>
            ))}
            <button type="button" className={s.secondary} disabled={step.questions.length >= 20} onClick={() => set({ questions: [...step.questions, newQuestion(scenario)] })}>Add {scenario ? "a decision" : "a question"}</button>
          </div>
        )}

        <div className={s.actions}>
          <span className={s.fakeButton} aria-hidden="true">{assessed ? "Check my answers" : "Complete activity"}</span>
          {assessed && <p className={s.muted}>3 attempts remaining · Pass mark {step.passScore}%. You can continue after using all attempts.</p>}
        </div>
      </section>

      <div className={s.adminStrip}>
        <details>
          <summary><strong>Step settings</strong> · not shown to learners</summary>
          <div className={s.group} style={{ marginTop: 10 }}>
            <label className={s.check}><input type="checkbox" checked={step.required} onChange={(e) => set({ required: e.target.checked })} />Must be finished before the next step unlocks</label>
            <div className={s.fields}>
              <label>About how long · seconds<input type="number" min={30} max={600} value={step.durationSeconds} onChange={(e) => set({ durationSeconds: Number(e.target.value) })} /></label>
              <label>XP for finishing<input type="number" min={0} max={1000} value={step.xp} onChange={(e) => set({ xp: Number(e.target.value) })} /></label>
              {assessed && <label>Pass mark · %<input type="number" min={0} max={100} value={step.passScore} onChange={(e) => set({ passScore: Number(e.target.value) })} /></label>}
            </div>
            <label>Skills this builds · comma separated<input value={step.skills.join(", ")} onChange={(e) => set({ skills: e.target.value.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10) })} placeholder="Customer communication, Following policy" /></label>
            <div className={s.row}>
              <button type="button" className={s.secondary} onClick={onDuplicate}>Duplicate step</button>
              <button type="button" className={s.danger} onClick={() => setConfirming(true)}>Remove step</button>
            </div>
            {confirming && (
              <div className={s.notice} role="alert">
                <p>Remove this step from the draft? Anything already published stays as it is.</p>
                <div className={s.row}>
                  <button type="button" className={s.danger} onClick={() => { setConfirming(false); onRemove(); }}>Yes, remove it</button>
                  <button type="button" className={s.secondary} onClick={() => setConfirming(false)}>Keep it</button>
                </div>
              </div>
            )}
          </div>
        </details>
        <details open={Boolean(step.pending) || undefined}>
          <summary><strong>AI help</strong>{step.pending ? " · draft waiting ●" : ""}</summary>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <AiPanel journeyId={journeyId} journey={journey} level={level} step={step} onChange={onChange} />
          </div>
        </details>
      </div>
    </div>
  );
}
