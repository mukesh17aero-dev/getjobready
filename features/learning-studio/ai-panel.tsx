"use client";

// AI help for one step. Three things it can do, and in every case what comes
// back is a draft shown beside what is there now: nothing changes until the
// admin presses Use this (spec AI-004, AI-005).

import { useEffect, useState } from "react";
import {
  assistLearningStep, getLearningJourney, renderLearningVideo,
  type LearningAssistAction, type LearningRender, type StudioJourney, type StudioJourneyData, type LearningStep,
} from "@/lib/api";
import { acceptDraft, rejectDraft } from "./step-kinds";
import { useAdminToken } from "./use-admin-token";
import s from "./learning-studio.module.css";

const STAGES = ["Reading what is there…", "Working out what this role needs…", "Writing the step…", "Checking it against your material…"];

export function AiPanel({
  journeyId, journey, level, step, onChange,
}: {
  journeyId: string;
  journey: StudioJourney;
  level: StudioJourneyData["level"];
  step: LearningStep;
  onChange: (next: LearningStep) => void;
}) {
  const token = useAdminToken();
  const [request, setRequest] = useState("");
  const [assetId, setAssetId] = useState("");
  const [running, setRunning] = useState<LearningAssistAction | null>(null);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  // The journey's own render, unless a newer one has come back from a poll
  // or a fresh request; keeping only the override avoids mirroring a prop.
  const [fresher, setFresher] = useState<LearningRender | null>(null);
  const render = fresher ?? journey.renders[step.id] ?? null;
  const [rendering, setRendering] = useState(false);
  const [videoProvider, setVideoProvider] = useState<"illustrated" | "openai_stills" | "higgsfield">("openai_stills");
  const documents = journey.assets.filter((a) => a.kind === "document" && a.readable);
  const draft = step.pending;

  // While a film is being made, check back until it is done; rendering takes
  // a few minutes and the page should say where it has got to.
  useEffect(() => {
    if (render?.state !== "queued" && render?.state !== "running") return;
    const timer = setInterval(async () => {
      const t = await token();
      if (!t) return;
      const res = await getLearningJourney(t, journeyId);
      if (res.ok) setFresher(res.data.renders[step.id] ?? null);
    }, 6000);
    return () => clearInterval(timer);
  }, [render?.state, token, journeyId, step.id]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setStage((n) => Math.min(n + 1, STAGES.length - 1)), 3500);
    return () => clearInterval(timer);
  }, [running]);

  async function ask(action: LearningAssistAction) {
    setRunning(action);
    setStage(0);
    setError("");
    const t = await token();
    const res = t ? await assistLearningStep(t, journeyId, { action, step, assetId: assetId || undefined, request }) : null;
    setRunning(null);
    if (!res) return setError("Sign in again to use AI help.");
    if (!res.ok) return setError(res.reason);
    onChange({ ...step, pending: res.data.draft });
  }

  async function makeVideo() {
    setRendering(true);
    setError("");
    const t = await token();
    const res = t ? await renderLearningVideo(t, journeyId, step.id, videoProvider) : null;
    setRendering(false);
    if (!res) return setError("Sign in again to make the video.");
    if (!res.ok) return setError(res.reason);
    setFresher(res.data);
  }

  const c = draft?.content;
  return (
    <>
      {draft ? (
        <div className={s.draft}>
          <h3>AI draft · from {draft.source}</h3>
          <p className={s.note}>Nothing has changed yet. Read it, then keep it or throw it away.</p>
          <div className={s.draftBody}>
            {c?.title && <p><strong>Title:</strong> {c.title}</p>}
            {c?.body && <p>{c.body}</p>}
            {c?.transcript && !c.storyboard && <p>{c.transcript}</p>}
            {c?.cards?.map((card, i) => <p key={card.id}><strong>Card {i + 1}:</strong> {card.front} → {card.back}</p>)}
            {c?.questions?.map((q, i) => (
              <p key={q.id}>
                <strong>{i + 1}. {q.prompt}</strong><br />
                {q.options.map((o) => `${o.correct || o.weight === 100 ? "✓" : "·"} ${o.text}`).join("\n")}
                {q.explanation ? `\n→ ${q.explanation}` : ""}
              </p>
            ))}
            {c?.storyboard && (
              <>
                <p><strong>{c.storyboard.scenes.length} scenes · about {c.storyboard.scenes.reduce((n, x) => n + x.seconds, 0)} seconds</strong></p>
                <ul className={s.scenes}>
                  {c.storyboard.scenes.map((scene, i) => (
                    <li key={i}><strong>Scene {i + 1} · {scene.seconds}s</strong><span>{scene.visual}</span><span>“{scene.narration}”</span></li>
                  ))}
                </ul>
              </>
            )}
            {draft.sourceQuotes.length > 0 && (
              <>
                <p><strong>Taken from your document:</strong></p>
                {draft.sourceQuotes.map((q) => <p key={q} className={s.quote}>“{q}”</p>)}
              </>
            )}
          </div>
          <div className={s.row}>
            <button type="button" className={s.primary} onClick={() => onChange(acceptDraft(step))}>Use this</button>
            <button type="button" className={s.secondary} onClick={() => onChange(rejectDraft(step))}>Throw it away</button>
          </div>
        </div>
      ) : (
        <div className={s.ai}>
          <h3>Ask AI to help with this step</h3>
          <label>What should it do? · optional
            <textarea rows={2} value={request} onChange={(e) => setRequest(e.target.value)} placeholder="e.g. Keep it to three short paragraphs and use a counter example" />
          </label>
          {documents.length > 0 && (
            <label>Draft from a document you uploaded
              <select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                <option value="">No document</option>
                {documents.map((d) => <option key={d.id} value={d.id}>{d.filename}</option>)}
              </select>
            </label>
          )}
          {documents.length === 0 && <p className={s.note}>Upload a PDF, Word file or text file on a step&apos;s Media tab to let AI draft from it.</p>}
          <div className={s.row}>
            <button type="button" className={s.secondary} disabled={Boolean(running)} onClick={() => void ask("tailor")}>Tailor for {journey.roleTitle || "this role"}</button>
            <button type="button" className={s.secondary} disabled={Boolean(running) || !assetId} onClick={() => void ask("from_file")}>Draft from the document</button>
            {step.type === "video" && <button type="button" className={s.secondary} disabled={Boolean(running)} onClick={() => void ask("storyboard")}>Plan a video</button>}
          </div>
          <p className={s.note}>Written for {level === "student" ? "students and first-job learners" : level === "early_career" ? "people up to three years into work" : "experienced workers"}. The AI only uses what is in this step and the material you give it.</p>
          {running && <p className={s.progress} role="status"><span className={s.pulse} aria-hidden="true" />{STAGES[stage]}</p>}
        </div>
      )}

      {error && <p className={s.error} role="alert">{error}</p>}

      {step.type === "video" && step.storyboard && !draft && (
        <fieldset className={s.group}>
          <legend>Video from this storyboard</legend>
          <p className={s.note}>{step.storyboard.scenes.length} planned scenes · about {step.storyboard.scenes.reduce((n, x) => n + x.seconds, 0)} seconds in the storyboard. Making a video takes time and costs money; it runs only when you ask.</p>
          <label>Video style
            <select value={videoProvider} onChange={(e) => setVideoProvider(e.target.value as "illustrated" | "openai_stills" | "higgsfield")}>
              <option value="openai_stills">Realistic photo film · lower cost</option>
              <option value="illustrated">Illustrated lesson · full narration</option>
              <option value="higgsfield">Cinematic live-action look · short MP4</option>
            </select>
          </label>
          <p className={s.note}>{videoProvider === "higgsfield" ? "Higgsfield turns the storyboard into a 20-second, live-action-looking clip. Review its actions and details before publishing. The text of this step gives the learner the guidance." : videoProvider === "openai_stills" ? "OpenAI makes a realistic image for each scene. FFmpeg adds gentle camera movement, narration and captions. People and objects will not move within a scene." : "Ascend makes a 60–120 second illustrated video with narration and captions."}</p>
          {render?.state === "completed" && render.video ? (
            <>
              <video className={s.media} src={render.video} poster={render.poster} controls crossOrigin="anonymous">
                {render.captions && <track kind="captions" src={render.captions} srcLang="en" label="English" default />}
              </video>
              <p className={s.note}>Current video: {render.provider === "higgsfield" ? "cinematic" : render.provider === "openai_stills" ? "realistic photo film" : "illustrated"}.</p>
              {render.provider !== videoProvider && <button type="button" className={s.secondary} disabled={rendering} onClick={() => void makeVideo()}>Make selected video style</button>}
            </>
          ) : render?.state === "queued" || render?.state === "running" ? (
            <p className={s.progress} role="status"><span className={s.pulse} aria-hidden="true" />{render.phase}</p>
          ) : (
            <>
              {render?.state === "failed" && <p className={s.error}>{render.error ?? "The video could not be made."}</p>}
              {render?.state === "outdated" && <p className={s.note}>The storyboard changed since the last video. Make it again to match.</p>}
              <button type="button" className={s.primary} disabled={rendering} onClick={() => void makeVideo()}>{rendering ? "Starting…" : render ? "Make the video again" : "Make the video"}</button>
            </>
          )}
        </fieldset>
      )}
    </>
  );
}
