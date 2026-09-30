"use client";

// The guided start for somebody with no resume: four short steps that fill the
// record the resume is written from. Each step saves to the profile, so the
// profile page shows the same entries and nothing is asked twice. The server
// runs the same check before it will write a draft.

import { useState } from "react";
import { WORK_KINDS } from "@/features/profile";
import { FormAlert } from "@/components/ui/form-alert";
import { RequiredMark } from "@/components/ui/required-mark";
import { saveResumeProfile, type ReadinessGap, type ResumeCareerProfile } from "./resume-api";
import { splitList } from "./resume-text";

export type SetupStep = "about" | "education" | "experience" | "skills";
const STEPS: Array<{ id: SetupStep; title: string; why: string }> = [
  { id: "about", title: "About you", why: "So an employer knows who you are and how to reach you." },
  { id: "education", title: "Your education", why: "For a student, this is the first thing a recruiter reads." },
  { id: "experience", title: "What you have done", why: "Anything counts - a project, a fest, a part-time job, helping at home." },
  { id: "skills", title: "Your skills", why: "Three or more you could show someone in an interview." },
];
const MIN_SKILLS = 3;
const STEP_OF: Record<ReadinessGap["item"], SetupStep> = { name: "about", phone: "about", city: "about", education: "education", experience: "experience", skills: "skills" };

type Row = Record<string, unknown>;
const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const filled = (row: Row, keys: string[]) => keys.some((key) => str(row[key]).length > 1);
const input = "mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 text-[0.9rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20";
const label = "block text-[0.82rem] font-semibold text-slate-800";

/** What the record still needs before a resume can be written. Mirrors the server's check. */
export function setupGaps(profile: ResumeCareerProfile | null): ReadinessGap[] {
  const prefs = profile?.preferences ?? {};
  const gaps: ReadinessGap[] = [];
  if (str(prefs["fullName"]).length < 2) gaps.push({ item: "name", label: "Your full name" });
  if (str(prefs["phone"]).replace(/\D/g, "").length < 7) gaps.push({ item: "phone", label: "A phone number" });
  if (str(prefs["city"]).length < 2) gaps.push({ item: "city", label: "Your city" });
  if (!(profile?.education ?? []).some((row) => filled(row, ["qualification", "course", "institution"]))) gaps.push({ item: "education", label: "At least one place you studied" });
  const didSomething = (profile?.experience ?? []).some((row) => filled(row, ["title", "organisation", "detail"])) || (profile?.projects ?? []).some((row) => filled(row, ["title", "detail"]));
  if (!didSomething) gaps.push({ item: "experience", label: "At least one thing you have done" });
  if (new Set(splitList(prefs["skills"]).map((s) => s.toLowerCase())).size < MIN_SKILLS) gaps.push({ item: "skills", label: `At least ${MIN_SKILLS} skills` });
  return gaps;
}

export const firstStepFor = (gaps: ReadinessGap[]): SetupStep | null => (gaps[0] ? STEP_OF[gaps[0].item] : null);

export function ResumeSetup({
  profile,
  suggestions,
  token,
  onSaved,
  step,
  onStep,
}: {
  profile: ResumeCareerProfile | null;
  /** Skills the target role looks for, offered as one-tap additions. */
  suggestions: string[];
  token: () => Promise<string | null>;
  onSaved: (next: ResumeCareerProfile) => void;
  step: SetupStep | null;
  onStep: (next: SetupStep | null) => void;
}) {
  const prefs = profile?.preferences ?? {};
  const gaps = setupGaps(profile);
  const doneStep = (id: SetupStep) => !gaps.some((gap) => STEP_OF[gap.item] === id);
  const [about, setAbout] = useState({ fullName: str(prefs["fullName"]), phone: str(prefs["phone"]), city: str(prefs["city"]) });
  const [study, setStudy] = useState({ qualification: "", institution: "", from: "", to: "", current: false, marks: "" });
  const [work, setWork] = useState({ kind: "project", title: "", organisation: "", from: "", to: "", detail: "" });
  const [skillText, setSkillText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skills = splitList(prefs["skills"]);

  async function save(patch: { preferences?: Row; education?: Row[]; experience?: Row[] }, next: SetupStep | null) {
    setBusy(true);
    setError(null);
    const t = await token();
    if (!t) { setBusy(false); setError("Your session expired. Sign in again to keep going."); return; }
    const saved = await saveResumeProfile(t, {
      education: patch.education ?? profile?.education ?? [],
      experience: patch.experience ?? profile?.experience ?? [],
      projects: profile?.projects ?? [],
      achievements: profile?.achievements ?? [],
      preferences: { ...prefs, ...(patch.preferences ?? {}) },
    });
    setBusy(false);
    if (!saved) { setError("That didn't save. Check your connection and try again."); return; }
    onSaved(saved);
    // Open the step they were sent to while it still needs something, else the
    // first one that does; with nothing left, close them all.
    const remaining = setupGaps(saved);
    onStep(next && remaining.some((gap) => STEP_OF[gap.item] === next) ? next : firstStepFor(remaining));
  }

  function saveAbout() {
    if (about.fullName.length < 2 || about.phone.replace(/\D/g, "").length < 7 || about.city.length < 2) {
      setError("Add your full name, a phone number and your city.");
      return;
    }
    void save({ preferences: about }, "education");
  }
  function addStudy() {
    if (!study.qualification.trim() || !study.institution.trim()) { setError("Add what you studied and where."); return; }
    const row = { ...study, qualification: study.qualification.trim(), institution: study.institution.trim(), current: study.current ? "yes" : "", stream: "" };
    setStudy({ qualification: "", institution: "", from: "", to: "", current: false, marks: "" });
    void save({ education: [...(profile?.education ?? []), row] }, "experience");
  }
  function addWork() {
    if (!work.title.trim() || !work.detail.trim()) { setError("Say what it was and what you did."); return; }
    const row = { ...work, title: work.title.trim(), organisation: work.organisation.trim(), detail: work.detail.trim(), current: "" };
    setWork({ kind: "project", title: "", organisation: "", from: "", to: "", detail: "" });
    void save({ experience: [...(profile?.experience ?? []), row] }, "skills");
  }
  function addSkills(extra: string[]) {
    const merged = [...skills, ...extra].filter((item, i, all) => item && all.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === i);
    setSkillText("");
    void save({ preferences: { skills: merged.join(", ") } }, null);
  }
  function removeRow(list: "education" | "experience", index: number) {
    const rows = (profile?.[list] ?? []).filter((_, i) => i !== index);
    void save({ [list]: rows }, list);
  }

  const rows = (list: "education" | "experience") => (profile?.[list] ?? []).map((row, i) => {
    const title = list === "education" ? str(row.qualification) || str(row.course) : str(row.title);
    const place = list === "education" ? str(row.institution) : str(row.organisation) || WORK_KINDS.find((k) => k.id === row.kind)?.label || "";
    return (
      <li key={i} className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-slate-100 px-3 py-2 text-[0.88rem]">
        <span><b className="font-semibold text-slate-900">{title || "Untitled"}</b>{place && <span className="text-slate-600"> · {place}</span>}</span>
        <button type="button" disabled={busy} onClick={() => removeRow(list, i)} className="min-h-11 px-2 text-[0.8rem] text-slate-500 hover:text-slate-900">Remove</button>
      </li>
    );
  });

  return (
    <section aria-label="Your details for the resume" className="rounded-2xl border border-slate-200 bg-surface p-5">
      <p className="text-[0.72rem] font-bold uppercase tracking-wide text-violet-700">Step by step</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Your resume is written from what you tell us</h2>
      <p className="mt-1 text-[0.85rem] text-slate-600">
        {gaps.length === 0 ? "Everything is in. Choose a direction and a look, then build." : `${4 - new Set(gaps.map((g) => STEP_OF[g.item])).size} of 4 done. Each step saves to your profile as you go.`}
      </p>
      <FormAlert className="mt-3" message={error} />
      <ol className="mt-4 space-y-3">
        {STEPS.map((item, index) => {
          const open = step === item.id;
          const done = doneStep(item.id);
          return (
            <li key={item.id} className={`rounded-xl border ${open ? "border-slate-400" : "border-slate-200"}`}>
              <button type="button" aria-expanded={open} onClick={() => onStep(open ? null : item.id)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
                <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.8rem] font-bold ${done ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-700"}`}>{done ? "✓" : index + 1}</span>
                <span className="flex-1"><b className="block text-[0.95rem] font-semibold text-slate-900">{item.title}</b><small className="block text-[0.78rem] text-slate-500">{done ? "Done - tap to change" : item.why}</small></span>
              </button>
              {open && (
                <div className="border-t border-slate-200 px-4 py-4">
                  {item.id === "about" && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {([["fullName", "Full name", "Aarav Sharma"], ["phone", "Phone", "98765 43210"], ["city", "City", "Hyderabad"]] as const).map(([key, name, hint]) => (
                        <label key={key} className={label}>{name}<RequiredMark />
                          <input className={input} value={about[key]} placeholder={hint} inputMode={key === "phone" ? "tel" : undefined} autoComplete={key === "fullName" ? "name" : key === "phone" ? "tel" : "address-level2"} onChange={(e) => setAbout((a) => ({ ...a, [key]: e.target.value }))} />
                        </label>
                      ))}
                      <p className="text-[0.78rem] text-slate-500 sm:col-span-3">Your email comes from your account.</p>
                      <button type="button" disabled={busy} onClick={saveAbout} className="min-h-11 rounded-lg bg-brand-violet px-5 text-[0.9rem] font-bold text-white sm:col-span-3 sm:justify-self-start">{busy ? "Saving…" : "Save and continue"}</button>
                    </div>
                  )}
                  {item.id === "education" && (
                    <>
                      {(profile?.education.length ?? 0) > 0 && <ul className="mb-4 space-y-2">{rows("education")}</ul>}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className={label}>What you studied<RequiredMark /><input className={input} value={study.qualification} placeholder="B.Com, Class XII, Diploma" onChange={(e) => setStudy((s) => ({ ...s, qualification: e.target.value }))} /></label>
                        <label className={label}>Where<RequiredMark /><input className={input} value={study.institution} placeholder="Osmania University" onChange={(e) => setStudy((s) => ({ ...s, institution: e.target.value }))} /></label>
                        <label className={label}>From (year)<input className={input} value={study.from} inputMode="numeric" placeholder="2023" onChange={(e) => setStudy((s) => ({ ...s, from: e.target.value }))} /></label>
                        <label className={label}>To (year)<input className={input} value={study.to} inputMode="numeric" placeholder="2026" disabled={study.current} onChange={(e) => setStudy((s) => ({ ...s, to: e.target.value }))} /></label>
                        <label className="flex min-h-11 items-center gap-2 text-[0.85rem] text-slate-700"><input type="checkbox" className="h-5 w-5" checked={study.current} onChange={(e) => setStudy((s) => ({ ...s, current: e.target.checked }))} />Still studying here</label>
                        <label className={label}>Marks or CGPA (optional)<input className={input} value={study.marks} placeholder="78% or 8.1" onChange={(e) => setStudy((s) => ({ ...s, marks: e.target.value }))} /></label>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" disabled={busy} onClick={addStudy} className="min-h-11 rounded-lg bg-brand-violet px-5 text-[0.9rem] font-bold text-white">{busy ? "Saving…" : "Add and continue"}</button>
                        {done && <button type="button" onClick={() => onStep("experience")} className="min-h-11 rounded-lg border border-slate-300 px-4 text-[0.9rem] font-semibold text-slate-700">Next step</button>}
                      </div>
                    </>
                  )}
                  {item.id === "experience" && (
                    <>
                      {(profile?.experience.length ?? 0) > 0 && <ul className="mb-4 space-y-2">{rows("experience")}</ul>}
                      <p className="mb-3 text-[0.82rem] text-slate-600">No job yet? That is normal. A college project, organising a fest, NSS, tutoring, or helping in a family shop all count.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className={label}>What kind<select className={input} value={work.kind} onChange={(e) => setWork((w) => ({ ...w, kind: e.target.value }))}>{WORK_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select></label>
                        <label className={label}>What it was<RequiredMark /><input className={input} value={work.title} placeholder="Registration desk lead, college fest" onChange={(e) => setWork((w) => ({ ...w, title: e.target.value }))} /></label>
                        <label className={label}>Where (optional)<input className={input} value={work.organisation} placeholder="Osmania University" onChange={(e) => setWork((w) => ({ ...w, organisation: e.target.value }))} /></label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className={label}>From<input className={input} value={work.from} placeholder="2025" onChange={(e) => setWork((w) => ({ ...w, from: e.target.value }))} /></label>
                          <label className={label}>To<input className={input} value={work.to} placeholder="2025" onChange={(e) => setWork((w) => ({ ...w, to: e.target.value }))} /></label>
                        </div>
                        <label className={`${label} sm:col-span-2`}>What you did<RequiredMark /><span className="block text-[0.74rem] font-normal text-slate-500">One to three lines. Numbers help if they are true - how many people, how many days.</span>
                          <textarea rows={3} className={`${input} py-2`} value={work.detail} placeholder="Ran the check-in desk for 400 visitors over two days with a team of 5" onChange={(e) => setWork((w) => ({ ...w, detail: e.target.value }))} />
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" disabled={busy} onClick={addWork} className="min-h-11 rounded-lg bg-brand-violet px-5 text-[0.9rem] font-bold text-white">{busy ? "Saving…" : "Add and continue"}</button>
                        {done && <button type="button" onClick={() => onStep("skills")} className="min-h-11 rounded-lg border border-slate-300 px-4 text-[0.9rem] font-semibold text-slate-700">Next step</button>}
                      </div>
                    </>
                  )}
                  {item.id === "skills" && (
                    <>
                      {skills.length > 0 && <ul className="mb-3 flex flex-wrap gap-2">{skills.map((skill) => <li key={skill} className="rounded-full bg-slate-100 px-3 py-1.5 text-[0.85rem] text-slate-800">{skill}</li>)}</ul>}
                      <label className={label}>Add skills<span className="block text-[0.74rem] font-normal text-slate-500">Comma separated. Only what you could back up in an interview.</span>
                        <input className={input} value={skillText} placeholder="Customer service, Google Sheets, Hindi typing" onChange={(e) => setSkillText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && skillText.trim()) { e.preventDefault(); addSkills(splitList(skillText)); } }} />
                      </label>
                      {suggestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-slate-500">This role looks for · tap to add if true</p>
                          <div className="mt-2 flex flex-wrap gap-2">{suggestions.filter((s) => !skills.some((k) => k.toLowerCase() === s.toLowerCase())).slice(0, 10).map((s) => <button key={s} type="button" disabled={busy} onClick={() => addSkills([s])} className="min-h-11 rounded-full border border-violet-300 px-3 text-[0.85rem] text-violet-700">+ {s}</button>)}</div>
                        </div>
                      )}
                      <button type="button" disabled={busy || !skillText.trim()} onClick={() => addSkills(splitList(skillText))} className="mt-4 min-h-11 rounded-lg bg-brand-violet px-5 text-[0.9rem] font-bold text-white disabled:opacity-40">{busy ? "Saving…" : "Add skills"}</button>
                      <p className="mt-2 text-[0.78rem] text-slate-500">{skills.length >= MIN_SKILLS ? `${skills.length} skills on your record.` : `${skills.length} of ${MIN_SKILLS} added.`}</p>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
