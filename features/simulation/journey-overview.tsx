"use client";

import { useState } from "react";
import type { LearningJourneySummary } from "@/lib/api/simulation-journey";
import s from "./journey.module.css";

export function JourneyOverview({ journeys, initialRole, busy, onOpen }: {
  journeys: LearningJourneySummary[]; initialRole: string; busy: boolean; onOpen: (roleId: string) => void;
}) {
  const [roleId, setRoleId] = useState(initialRole);
  const current = journeys.find(item => item.roleId === roleId) ?? journeys[0];
  if (!current) return null;
  return <>
    <div className={s.overviewSelector}><label htmlFor="simulation-journey">Choose your practice<select id="simulation-journey" value={current.roleId} disabled={busy} onChange={event => setRoleId(event.target.value)}>{journeys.map(item => <option key={item.roleId} value={item.roleId}>{item.title}</option>)}</select></label><span>{current.status}</span></div>
    <div className={s.overviewGrid}>
      <section className={s.overviewFocus}><p className={s.eyebrow}>Your workplace practice</p><h2>{current.title}</h2><p className={s.overviewDescription}>{current.description}</p>
        <div className={s.overviewFacts}><div><strong>{current.steps} activities</strong><span>Learn and practise step by step</span></div><div><strong>{Math.ceil(current.durationSeconds / 60)} minutes</strong><span>Estimated total time</span></div><div><strong>{current.completed} completed</strong><span>Your progress is saved</span></div></div>
        <progress className={s.progress} value={current.completed} max={Math.max(1, current.steps)} aria-label={`${current.title} progress`} />
        <div className={s.actions}><button className={s.primary} disabled={busy} onClick={() => onOpen(current.roleId)}>{busy ? "Opening…" : current.status === "Not started" ? "View my practice plan →" : current.status === "Completed" ? "Review my practice →" : "Continue practice →"}</button></div>
      </section>
      <aside className={s.overviewBefore}><h2>Here’s what you’ll do</h2><ol><li><strong>Learn the approach</strong><p>Read or watch the lesson before trying the work.</p></li><li><strong>Try a workplace task</strong><p>Use the situation and details provided to decide what to do.</p></li><li><strong>Use your feedback</strong><p>Review your work and continue with the next available activity.</p></li></ol><p className={s.overviewNote}>Your answers and progress stay with your account. You can return to your saved work.</p></aside>
    </div>
  </>;
}
