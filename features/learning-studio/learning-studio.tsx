"use client";

// The Learning Studio tab: the admin's journeys, a way to start a new one for
// any role, and the builder for the one that is open.

import { useCallback, useEffect, useState } from "react";
import { createLearningJourney, listLearningJourneys, type StudioJourneySummary, type LearningLevel } from "@/lib/api";
import { JourneyBuilder } from "./journey-builder";
import { useAdminToken } from "./use-admin-token";
import s from "./learning-studio.module.css";

const LEVELS: { id: LearningLevel; label: string }[] = [
  { id: "student", label: "Students and first-job learners" },
  { id: "early_career", label: "Up to three years at work" },
  { id: "experienced", label: "Experienced workers" },
];

export function LearningStudio() {
  const token = useAdminToken();
  const [journeys, setJourneys] = useState<StudioJourneySummary[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [level, setLevel] = useState<LearningLevel>("student");

  const load = useCallback(async () => {
    const t = await token();
    if (!t) return setError("Sign in again to use the Learning Studio.");
    const res = await listLearningJourneys(t);
    if (res.ok) {
      setJourneys(res.data.journeys);
      setError("");
    } else setError(res.reason);
  }, [token]);

  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [open, load]);

  async function create() {
    setBusy(true);
    setError("");
    const t = await token();
    const res = t ? await createLearningJourney(t, { title, roleTitle, level }) : null;
    setBusy(false);
    if (!res) return setError("Sign in again to use the Learning Studio.");
    if (!res.ok) return setError(res.reason);
    setTitle("");
    setRoleTitle("");
    setOpen(res.data.id);
  }

  if (open) return <JourneyBuilder id={open} onClose={() => setOpen(null)} />;

  return (
    <section className={s.root} aria-labelledby="learning-studio-title">
      <div className={s.intro}>
        <h2 id="learning-studio-title">Learning Studio</h2>
        <p className={s.note}>
          Build lessons and subsections for any role. Add text, quizzes, flashcards, scenarios and media as blocks. AI can propose a lesson or subsection content for you to review before adding it.
        </p>
      </div>

      <form className={s.create} onSubmit={(e) => { e.preventDefault(); void create(); }}>
        <label>Journey title<input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Handling customer complaints" /></label>
        <label>For which role<input maxLength={160} value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Retail Sales Associate" /></label>
        <label>Who is learning<select value={level} onChange={(e) => setLevel(e.target.value as LearningLevel)}>{LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select></label>
        <button type="submit" className={s.primary} disabled={busy || !title.trim()}>{busy ? "Creating…" : "Create journey"}</button>
      </form>

      {error && <p className={s.error} role="alert">{error} <button type="button" className={s.quiet} onClick={() => void load()}>Try again</button></p>}

      {journeys === null && !error && <p className={s.note}>Loading journeys…</p>}
      {journeys?.length === 0 && <p className={s.note}>No journeys yet. Create your first one above.</p>}
      {journeys && journeys.length > 0 && (
        <ul className={s.journeys}>
          {journeys.map((j) => (
            <li key={j.id}>
              <button type="button" className={s.journeyCard} onClick={() => setOpen(j.id)}>
                <span className={s.status} data-status={j.status}>{j.status === "published" ? `Published v${j.version}` : "Draft"}</span>
                <strong>{j.title}</strong>
                <span className={s.note}>{j.roleTitle || "No role set"} · {j.steps} {j.steps === 1 ? "step" : "steps"}</span>
                <span className={s.note}>Edited {new Date(j.updatedAt).toLocaleDateString()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
