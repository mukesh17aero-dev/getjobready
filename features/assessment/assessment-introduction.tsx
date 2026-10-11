"use client";

import { useState, type ReactNode } from "react";
import { assessmentIntroduction, assessmentRoleContext } from "./introduction-copy";
import { countOf } from "./sitting-count";

export function AssessmentIntroduction({ roleId, roleTitle, company, fullAssessment, questions, resume = false, busy, error, onStart }: {
  roleId: string; roleTitle: string; company: string; buddy: string; fullAssessment: boolean; busy: boolean; error: ReactNode; onStart: () => void;
  questions: number; resume?: boolean;
}) {
  const [videoError, setVideoError] = useState(false);
  return <div className="assessment-focused-intro">
    <header className="assessment-intro-heading"><h1>Role readiness: {roleTitle}</h1><p>Try workplace decisions and explain what you would do. No work experience needed.</p></header>
    <div className="assessment-intro-grid">
      <section className="assessment-focal-panel">
        <p className="assessment-eyebrow">Your workplace</p><h2>Step into a shift at {company}.</h2>
        <p className="assessment-role-description">{assessmentRoleContext[roleId] ?? "Try everyday decisions you might face in this role."}</p>
        <div className="assessment-intro-facts"><div><strong>{fullAssessment ? countOf(questions, "question") : "First situation"}</strong><span>{fullAssessment ? "Work through one at a time" : "Explore before signing in"}</span></div><div><strong>No time limit</strong><span>Take time to think</span></div><div><strong>{fullAssessment ? "Responses autosave" : "Try a preview"}</strong><span>{fullAssessment ? "Keep your work as you go" : "Sign in to keep your work"}</span></div></div>
        <p className="assessment-small">{company} is a fictional company.</p>{error}
        <div className="assessment-start-actions"><button type="button" className="assessment-primary" disabled={busy} onClick={onStart}>{busy ? "Getting ready…" : resume ? "Continue assessment →" : fullAssessment ? "Start assessment →" : "Explore the first situation →"}</button><span>You don’t need to watch a video to start.</span></div>
      </section>
      <aside className="assessment-before"><h2>Before you begin</h2><ol><li><strong>Read the situation</strong><p>The facts and rules appear beside your response.</p></li><li><strong>Explain your decision</strong><p>Use your own words. Clear, everyday language is enough.</p></li><li><strong>Continue at your pace</strong><p>AI help is available on the first two questions, up to three requests per question.</p></li></ol><div className="assessment-policy"><strong>Stay in the assessment tab.</strong><p>Copy and paste are disabled. Tab/window switches and blocked actions are recorded.</p></div></aside>
    </div>
    <details className="assessment-optional-guide"><summary>Want a walkthrough? Watch or read the guide · Optional</summary><div className="assessment-guide-grid"><div><video controls playsInline preload="none" poster="/assessment/introduction-poster.jpg?v=3" aria-label="Introduction to the role assessment" onError={() => setVideoError(true)}><source src="/assessment/introduction.mp4?v=3" type="video/mp4" /><track default kind="captions" src="/assessment/introduction.en.vtt?v=3" srcLang="en" label="English" />Your browser cannot play this video. Read the introduction beside it.</video>{videoError && <p role="status">The video could not play. You can read the same introduction here.</p>}</div><div>{assessmentIntroduction.map(part => <p key={part.title}><strong>{part.title}.</strong> {part.text}</p>)}<p>Some questions ask for a spoken update; a written alternative is available and recorded as writing. Stop recordings before submitting so the transcript can save.</p></div></div></details>
  </div>;
}
