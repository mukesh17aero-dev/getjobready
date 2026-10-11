"use client";

// The activity exactly as a learner meets it, in the same page frame. Nothing
// here is recorded: no progress, no XP, no events (spec ADM-024).

import { useState } from "react";
import type { StudioJourney, LearningStep } from "@/lib/api";
import { kindOf } from "./step-kinds";
import s from "./learning-studio.module.css";

/** Score for a quiz or scenario step, 0-100, the way the learner page reports it. */
export function previewScore(step: LearningStep, answers: Record<string, string[]>): number {
  if (!step.questions.length) return 0;
  const each = step.questions.map((q) => {
    const picked = answers[q.id] ?? [];
    if (step.type === "scenario") return q.options.find((o) => o.id === picked[0])?.weight ?? 0;
    const right = q.options.filter((o) => o.correct).map((o) => o.id);
    return right.length === picked.length && right.every((id) => picked.includes(id)) ? 100 : 0;
  });
  return Math.round(each.reduce((n, v) => n + v, 0) / each.length);
}

export function StepPreview({ journey, step }: { journey: StudioJourney; step: LearningStep }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const asset = journey.assets.find((a) => a.id === step.assetId);
  const render = journey.renders[step.id];
  const mediaUrl = asset?.url ?? (step.mediaUrl || (step.type === "video" ? render?.video : undefined));
  const assessed = step.type === "quiz" || step.type === "scenario";
  const score = previewScore(step, answers);

  const pick = (qid: string, oid: string, multiple: boolean) => {
    setChecked(false);
    const now = answers[qid] ?? [];
    setAnswers({ ...answers, [qid]: multiple ? (now.includes(oid) ? now.filter((x) => x !== oid) : [...now, oid]) : [oid] });
  };

  if (step.type === "heading") return <h2 className={s.previewHeading}>{step.title || "Untitled heading"}</h2>;
  if (step.type === "callout") return <aside className={s.previewCallout}><strong>{step.title || "Key point"}</strong><p>{step.body}</p></aside>;

  return (
    <section className={s.player} aria-label="Activity preview">
      <p className={s.note}>Preview only · nothing is saved and no progress or XP is recorded.</p>
      <h2>{step.title || `Untitled ${kindOf(step.type).label.toLowerCase()}`}</h2>
      <p className={s.muted}>{step.type} · {Math.ceil(step.durationSeconds / 60)} min · {step.xp} XP{!step.required ? " · Optional" : ""}</p>
      {step.instructions && <p>{step.instructions}</p>}

      {step.type === "image" && (mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a private, short-lived signed link; next/image cannot optimise it
        <img className={s.media} src={mediaUrl} alt={step.altText} />
      ) : <p className={s.muted}>No image yet.</p>)}
      {step.type === "video" && (mediaUrl
        ? <video className={s.media} src={mediaUrl} poster={render?.poster} controls playsInline crossOrigin="anonymous">{render?.captions && <track kind="captions" src={render.captions} srcLang="en" label="Captions" default />}</video>
        : <p className={s.muted}>No video yet.</p>)}
      {step.type === "audio" && (mediaUrl ? <audio className={s.media} src={mediaUrl} controls /> : <p className={s.muted}>No audio yet.</p>)}

      {(step.type === "video" || step.type === "audio") && step.transcript && (
        <details><summary>Read the transcript</summary><p style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{step.transcript}</p></details>
      )}
      {(step.type === "text" || step.type === "image" || step.type === "scenario") && step.body && <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{step.body}</p>}

      {step.type === "flashcard" && (
        <div className={s.flashcard}>
          {step.cards.map((c) => (
            <article key={c.id}>
              <h3>{c.front || "(front)"}</h3>
              {revealed.includes(c.id) && <p>{c.back || "(back)"}</p>}
              <button type="button" className={s.secondary} aria-expanded={revealed.includes(c.id)} onClick={() => setRevealed(revealed.includes(c.id) ? revealed.filter((x) => x !== c.id) : [...revealed, c.id])}>
                {revealed.includes(c.id) ? "Show front" : "Reveal answer"}
              </button>
            </article>
          ))}
        </div>
      )}

      {assessed && (
        <div className={s.questions}>
          {step.questions.map((q, i) => (
            <fieldset key={q.id} className={s.question}>
              <legend>{i + 1}. {q.prompt || "(no question yet)"}</legend>
              <p className={s.muted}>{q.multiple ? "Choose all that apply." : "Choose one answer."}</p>
              {q.options.map((o) => (
                <button key={o.id} type="button" className={s.choice} aria-pressed={(answers[q.id] ?? []).includes(o.id)} onClick={() => pick(q.id, o.id, q.multiple)}>
                  <span>{o.text || "(empty answer)"}</span>
                </button>
              ))}
            </fieldset>
          ))}
        </div>
      )}

      {checked && assessed && (
        <section className={s.feedback} aria-label="Your feedback">
          <h3>{score === 100 ? "Correct" : "Review your answers"} · {score}/100</h3>
          {step.questions.map((q) => q.explanation && <p key={q.id}>{q.explanation}</p>)}
        </section>
      )}

      <div className={s.actions}>
        {done && !assessed ? (
          <button type="button" className={s.primary} style={{ width: "100%" }}>Continue →</button>
        ) : (
          <button type="button" className={s.primary} style={{ width: "100%" }} onClick={() => (assessed ? setChecked(true) : setDone(true))}>
            {assessed ? "Check my answers" : "Complete activity"}
          </button>
        )}
      </div>
      {assessed && <p className={s.muted}>3 attempts remaining · Pass mark {step.passScore}%. You can continue after using all attempts.</p>}
    </section>
  );
}
