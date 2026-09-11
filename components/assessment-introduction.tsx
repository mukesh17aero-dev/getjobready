"use client";

import { useRef, useState, type ReactNode } from "react";
import { assessmentIntroduction, assessmentRoleContext } from "@/lib/assessment-introduction";

export function AssessmentIntroduction({ roleId, roleTitle, company, fullAssessment, busy, error, onStart }: {
  roleId: string; roleTitle: string; company: string; fullAssessment: boolean; busy: boolean; error: ReactNode; onStart: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [played, setPlayed] = useState(false);
  const [watched, setWatched] = useState(false);
  const [read, setRead] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const ready = watched || read;
  async function play() {
    try { await video.current?.play(); }
    catch { setVideoError(true); }
  }
  return <div className="assessment-intro assessment-student-intro assessment-video-intro">
    <p className="assessment-eyebrow">BEFORE YOU START · {roleTitle}</p>
    <h1>A quick guide before you begin.</h1>
    <p>{assessmentRoleContext[roleId] ?? "Try everyday decisions you might face in this role."} Your workplace is {company}, a fictional company. No work experience needed.</p>
    <div className="assessment-onboarding-grid">
      <div className="assessment-onboarding-film">
        <div className="assessment-film-label"><strong>Your assessment, explained</strong><span>About a minute · sound & captions</span></div>
        <div className="assessment-film-player">
          <video ref={video} controls playsInline preload="metadata" poster="/assessment/introduction-poster.jpg?v=3" aria-label="Introduction to the role assessment" onPlay={() => { setPlayed(true); setVideoError(false); }} onEnded={() => setWatched(true)} onError={() => setVideoError(true)}>
            <source src="/assessment/introduction.mp4?v=3" type="video/mp4" />
            <track default kind="captions" src="/assessment/introduction.en.vtt?v=3" srcLang="en" label="English" />
            Your browser cannot play this video. Read the introduction below.
          </video>
          {!played && <button type="button" className="assessment-film-play" onClick={() => void play()}><span aria-hidden="true">▶</span>Play introduction</button>}
        </div>
        {videoError && <p className="assessment-video-error" role="status">The video could not play. Try the player controls, or read the same introduction below to continue.</p>}
        <details className="assessment-intro-transcript"><summary>Prefer to read? Open the same introduction</summary>{assessmentIntroduction.map(part => <p key={part.title}><strong>{part.title}.</strong> {part.text}</p>)}<label className="assessment-read-confirm"><input type="checkbox" checked={read} onChange={event => setRead(event.target.checked)} />I’ve read the introduction and am ready.</label></details>
      </div>
      <div className="assessment-onboarding-start">
        <h2>Here’s what you’ll do</h2>
        <ul className="assessment-intro-steps">
          <li><div><strong>Read the cards</strong><p>The facts and rules are beside each question.</p></div></li>
          <li><div><strong>Understand unfamiliar words</strong><p>Open “Words in this question” for simple definitions.</p></div></li>
          <li><div><strong>Explain your choice</strong><p>Use your own words. Clear, everyday language is enough.</p></div></li>
        </ul>
        <div className="assessment-intro-rules"><strong>{fullAssessment ? "12 questions · no time limit" : "Untimed preview · first situation"}</strong><p>{fullAssessment ? "Your responses autosave. AI help is available on questions 1 and 2 only." : "Read the situation and try the AI assistant on it. Sign in to take the full 12-question assessment and keep your work."}</p><p>Stay in this tab. Copy and paste are disabled; tab/window switches and blocked actions are recorded.</p><details><summary>AI requests & microphone</summary><p>You can ask AI up to three times per supported question. Some questions ask for a spoken update; a written alternative is available and recorded as writing. Stop recordings before submitting so the transcript can save.</p></details></div>
        {error}
        <p className="assessment-intro-ready" role="status">{ready ? "You’re ready to begin." : "Watch the guide or read the introduction if you like. You can start whenever you are ready."}</p>
        <button type="button" className="assessment-primary" disabled={busy} onClick={onStart}>{busy ? "Getting ready…" : fullAssessment ? "Start assessment →" : "Explore the first situation →"}</button>
      </div>
    </div>
  </div>;
}
