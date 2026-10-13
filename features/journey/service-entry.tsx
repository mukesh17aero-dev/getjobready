"use client";

import { track } from "@/lib/footprints";
import Link from "next/link";
import { useState } from "react";
import { saveExplorationPreference } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { JourneyState } from "@/lib/api";
import styles from "./service-entry.module.css";

type Context = "student" | "early_career";
export function ServiceEntry({ initialTrack, role, onContextChange, onFollowPath, pathOpen = false, heading }: { heading?: string; initialTrack?: string | null; role?: NonNullable<JourneyState["progress"]>["role"]; onContextChange?: (track: Context) => void; onFollowPath?: () => void; pathOpen?: boolean }) {
  const [context, setContext] = useState<Context>(initialTrack === "early_career" ? "early_career" : "student");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  async function chooseContext(next: Context) {
    if (saving) return;
    setSaving(true); setSaveFailed(false); setContext(next); onContextChange?.(next);
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      if (!data.session) { setMessage("Guidance changed for this visit. Your saved work is unchanged."); return; }
      setMessage("Saving guidance…");
      const saved = await saveExplorationPreference(data.session.access_token, {track:next});
      setSaveFailed(!saved);
      setMessage(saved ? "" : "Guidance changed for this visit, but could not save. Retry to save this guidance.");
    } catch { setSaveFailed(true); setMessage("Guidance changed for this visit. Could not save to your profile."); } finally { setSaving(false); }
  }
  const experienced = context === "early_career";
  const href = (path: string) => `${path}?${new URLSearchParams({ profileType: experienced ? "experienced" : "student", ...(role ? { role: role.id, roleId: role.id } : {}) })}`;
  const cards = experienced ? [
    ["Improve my resume", "/resume/build", "Your resume or work history", "An editable resume for PDF or Word", "15–25 min"],
    ["Check my fit", "/job-fit", "A job description and your experience", "Evidence matches and gaps", "5–10 min"],
    ["Strengthen LinkedIn", "/profile/professional", "Your saved record or profile", "Sections to review and copy", "10–15 min"],
  ] : [
    ["Explore roles", "/discover", "Your interests, if you want to share them", "Roles to explore and save", "5–10 min"],
    ["Try a role task", "/practice", "A role you want to try", "Work practice and feedback", "15–20 min"],
    ["Build my first resume", "/resume/build", "Education, projects or volunteering", "An editable first resume", "15–25 min"],
  ];
  return <section className={styles.root} aria-labelledby="service-heading">
    <h2 id="service-heading">{heading ?? (onContextChange ? "What would you like to work on today?" : experienced ? "Turn your experience into your next opportunity." : "Find a direction and build proof.")}</h2>
    <fieldset className={styles.switch}><legend>Choose the guidance that fits you</legend>{([ ["student", "Student / first job"], ["early_career", "1–3 years of experience"] ] as const).map(([id, title]) => <label key={id} data-selected={context === id}><input type="radio" name="home-context" disabled={saving} checked={context === id} onChange={() => void chooseContext(id)} />{title}</label>)}</fieldset>
    {message && <p role="status">{message}</p>}
    {saveFailed && <button type="button" disabled={saving} className="min-h-11 underline" onClick={() => void chooseContext(context)}>Retry saving guidance</button>}
    <div className={styles.cards}>{cards.map(([title, path, input, output, time]) => <Link key={path} onClick={() => track({family:"decision",event:"task_started",module:"journey",target:path})} href={href(path)} className={styles.card}><h3>{title} <span aria-hidden>→</span></h3><small>Estimated {time}</small><p><b>Start with:</b> {input}</p><p><b>Leave with:</b> {output}</p></Link>)}</div>
    <nav className={styles.more} aria-label="More tools">
      <span className={styles.moreLabel}>More tools</span>
      {([
        ["Check job fit", "/job-fit"],
        ["Browse jobs", "/opportunities"],
        ["Skills Passport", "/passport"],
        ["Interview stories", "/stories"],
        ["Roleplay", "/roleplay"],
      ] as const).map(([title, path]) => <Link key={path} href={href(path)}>{title} <span aria-hidden="true">↗</span></Link>)}
    </nav>
    <div className={styles.pathToggle}><button type="button" aria-controls="full-path" aria-expanded={pathOpen} onClick={onFollowPath}><span aria-hidden="true">{pathOpen ? "−" : "+"}</span>{pathOpen ? "Hide your preparation path" : "Show your preparation path"}</button></div>
  </section>;
}
