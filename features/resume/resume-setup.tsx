"use client";

// The guided start for somebody with no resume: four short steps that fill the
// record the resume is written from. Each step saves to the profile, so the
// profile page shows the same entries and nothing is asked twice. The server
// runs the same check before it will write a draft.

import { cloneElement, useId, useState, type ReactElement } from "react";
import { track as trackEvent } from "@/lib/footprints";
import { WORK_KINDS } from "@/features/profile";
import { CopyButton } from "@/components/ui/copy-button";
import { FormAlert } from "@/components/ui/form-alert";
import { RequiredMark } from "@/components/ui/required-mark";
import { saveResumeProfile, type ReadinessGap, type ResumeCareerProfile } from "./resume-api";
import { splitList } from "./resume-text";
import { Close } from "@/components/ui/icons";
import { BLANK_STUDY, BLANK_WORK, hasDoneSomething, hasStudied, studyDraft, studyFromRow, workDraft, workFromRow } from "./profile-fields";
import { FieldHelp, GuideProvider } from "./field-help";
import type { GuideKey } from "./field-guidance";

export type SetupStep = "about" | "education" | "experience" | "skills";
const STEPS: Array<{ id: SetupStep; title: string; why: string }> = [
  { id: "about", title: "About you", why: "So an employer knows who you are and how to reach you." },
  { id: "education", title: "Your education", why: "Add your course, institution and dates." },
  { id: "experience", title: "What you have done", why: "Projects, volunteering and part-time work belong here." },
  { id: "skills", title: "Your skills", why: "Add skills you can demonstrate in an interview." },
];
const MIN_SKILLS = 3;
const STEP_OF: Record<ReadinessGap["item"], SetupStep> = { name: "about", phone: "about", city: "about", education: "education", experience: "experience", skills: "skills" };

type Row = Record<string, unknown>;
const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const input = "mt-1 block min-h-14 w-full rounded border border-slate-400 bg-transparent px-4 text-base outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet";
const label = "block text-[0.82rem] font-semibold text-slate-800";

/** What the record still needs before a resume can be written. Mirrors the server's check. */
export function setupGaps(profile: ResumeCareerProfile | null): ReadinessGap[] {
  const prefs = profile?.preferences ?? {};
  const gaps: ReadinessGap[] = [];
  if (str(prefs["fullName"]).length < 2) gaps.push({ item: "name", label: "Your full name" });
  if (str(prefs["phone"]).replace(/\D/g, "").length < 7) gaps.push({ item: "phone", label: "A phone number" });
  if (str(prefs["city"]).length < 2) gaps.push({ item: "city", label: "Your city" });
  // Rows, or the profile page's own fields - see profile-fields.ts.
  // Ticked only when the step's own required fields are filled (see profile-fields.ts).
  if (!hasStudied(profile)) gaps.push({ item: "education", label: "At least one place you studied" });
  if (!hasDoneSomething(profile)) gaps.push({ item: "experience", label: "At least one thing you have done, with what you did" });
  if (new Set(splitList(prefs["skills"]).map((s) => s.toLowerCase())).size < MIN_SKILLS) gaps.push({ item: "skills", label: `At least ${MIN_SKILLS} skills` });
  return gaps;
}

/** True when the profile holds none of what setup asks for: a person starting from nothing. */
export const hasNothingSaved = (profile: ResumeCareerProfile | null): boolean =>
  setupGaps(profile).length === Object.keys(STEP_OF).length;

export const firstStepFor = (gaps: ReadinessGap[]): SetupStep | null => (gaps[0] ? STEP_OF[gaps[0].item] : null);

// A field's label with its ⓘ beside it. The input is named by the label text
// alone (aria-labelledby), so a screen reader does not read the ⓘ's own name
// as part of the field's.
function Labelled({ text, required = false, guide, className = label, children }: {
  text: string; required?: boolean; guide?: GuideKey; className?: string; children: ReactElement<{ "aria-labelledby"?: string }>;
}) {
  const id = useId();
  return (
    <label className={className}>
      <span className="flex items-center justify-start gap-0.5"><span id={id}>{text}{required && <RequiredMark />}</span>{guide && <FieldHelp field={guide} label={text} />}</span>
      {cloneElement(children, { "aria-labelledby": id })}
    </label>
  );
}

const ABOUT_GUIDE = { fullName: "header.name", phone: "header.phone", city: "header.city" } as const satisfies Record<string, GuideKey>;
const EXTRA_GUIDE = { scope: "experience.scope", tools: "experience.tools", outcome: "experience.outcome", evidenceSource: "experience.evidence" } as const satisfies Record<string, GuideKey>;

export function ResumeSetup({
  profile,
  track = "student",
  suggestions,
  suggestionsForRole = true,
  role,
  token,
  onSaved,
  step,
  onStep,
}: {
  profile: ResumeCareerProfile | null;
  track?: "student" | "early_career";
  /** Skills offered as one-tap additions. */
  suggestions: string[];
  /** True when they come from the target role; false when they are the catalogue's common skills. */
  suggestionsForRole?: boolean;
  /** The role this resume is for, so the examples behind each ⓘ fit the work. */
  role?: string;
  token: () => Promise<string | null>;
  onSaved: (next: ResumeCareerProfile) => void;
  step: SetupStep | null;
  onStep: (next: SetupStep | null) => void;
}) {
  const experienced = track === "early_career";
  const steps = experienced ? [STEPS[0], { ...STEPS[2], title: "Work experience", why: "Show the work you owned, its scope and outcomes." }, { ...STEPS[3], title: "Skills and tools" }, { ...STEPS[1], why: "Qualifications that support your next role." }] : STEPS;
  const nextStep = (id: SetupStep) => steps[steps.findIndex(item => item.id === id) + 1]?.id ?? null;
  const prefs = profile?.preferences ?? {};
  const gaps = setupGaps(profile);
  const doneStep = (id: SetupStep) => !gaps.some((gap) => STEP_OF[gap.item] === id);
  const [about, setAbout] = useState({ fullName: str(prefs["fullName"]), phone: str(prefs["phone"]), city: str(prefs["city"]) });
  // A step with a tick must not open on empty required fields. With saved
  // entries, the form opens on the first one, filled in, to change in place
  // ("Save changes"); "+ Add another" gives a blank form. With none yet, it
  // starts from what the profile page saved.
  const eduRows = profile?.education ?? [];
  const workRows = profile?.experience ?? [];
  const [studyStart] = useState(() => studyDraft(profile));
  const [workStart] = useState(() => workDraft(profile));
  // Which saved entry each form is editing; null means adding a new one.
  const [eduAt, setEduAt] = useState<number | null>(() => ((profile?.education ?? []).length > 0 ? 0 : null));
  const [workAt, setWorkAt] = useState<number | null>(() => ((profile?.experience ?? []).length > 0 ? 0 : null));
  const [study, setStudy] = useState(() => ((profile?.education ?? []).length > 0 ? studyFromRow(profile!.education[0] as Row) : studyStart.draft));
  const [work, setWork] = useState(() => ((profile?.experience ?? []).length > 0 ? workFromRow(profile!.experience[0] as Row) : workStart.draft));
  function editRow(list: "education" | "experience", index: number, rowsNow: Row[] = (list === "education" ? eduRows : workRows) as Row[]) {
    if (list === "education") { setEduAt(index); setStudy(studyFromRow(rowsNow[index])); }
    else { setWorkAt(index); setWork(workFromRow(rowsNow[index])); }
  }
  function startAdding(list: "education" | "experience") {
    if (list === "education") { setEduAt(null); setStudy(BLANK_STUDY); }
    else { setWorkAt(null); setWork(BLANK_WORK); }
  }
  const [skillText, setSkillText] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skills = splitList(prefs["skills"]);

  async function save(patch: { preferences?: Row; education?: Row[]; experience?: Row[] }, next: SetupStep | null, keepOpen = false) {
    setBusy(true);
    setError(null);
    try {
      const t = await token();
      if (!t) { setError("Your session expired. Sign in again to keep going."); return false; }
      const saved = await saveResumeProfile(t, {
        education: patch.education ?? profile?.education ?? [],
        experience: patch.experience ?? profile?.experience ?? [],
        projects: profile?.projects ?? [],
        achievements: profile?.achievements ?? [],
        preferences: { ...prefs, ...(patch.preferences ?? {}) },
      });
      if (!saved) { setError("That didn't save. Check your connection and try again. Your entries are still here."); return false; }
      onSaved(saved);
      trackEvent({family:"engagement",event:"resume_section_saved",module:"resume",target:step ?? "setup"});
      // Open the step they were sent to while it still needs something, else the
      // first one that does; with nothing left, close them all.
      const remaining = setupGaps(saved);
      onStep(keepOpen ? "skills" : next && remaining.some((gap) => STEP_OF[gap.item] === next) ? next : steps.find(item => remaining.some(gap => STEP_OF[gap.item] === item.id))?.id ?? null);
      return true;
    } catch {
      setError("That didn’t save. Your entries are still here. Try saving again, or copy your unsaved details.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function saveAbout() {
    if (about.fullName.length < 2 || about.phone.replace(/\D/g, "").length < 7 || about.city.length < 2) {
      setError("Add your full name, a phone number and your city.");
      return;
    }
    void save({ preferences: about }, nextStep("about"));
  }
  async function addStudy() {
    if (!study.qualification.trim() || !study.institution.trim()) { setError("Add what you studied and where."); return; }
    const row = { ...study, qualification: study.qualification.trim(), institution: study.institution.trim(), current: study.current ? "yes" : "", stream: "" };
    // Editing keeps anything on the saved entry this form does not show.
    const next = eduAt === null ? [...eduRows, row] : eduRows.map((saved, i) => (i === eduAt ? { ...(saved as Row), ...row } : saved));
    // A new entry stays in the form, filled in, as the one now being edited.
    if (await save({ education: next as Row[] }, nextStep("education"))) setEduAt(eduAt ?? next.length - 1);
  }
  async function addWork() {
    if (!work.title.trim() || !work.detail.trim()) { setError("Say what it was and what you did."); return; }
    const row = { ...work, kind: work.kind || (experienced ? "job" : "project"), title: work.title.trim(), organisation: work.organisation.trim(), detail: work.detail.trim() };
    const next = workAt === null ? [...workRows, { ...row, current: "" }] : workRows.map((saved, i) => (i === workAt ? { ...(saved as Row), ...row } : saved));
    if (await save({ experience: next as Row[] }, nextStep("experience"))) setWorkAt(workAt ?? next.length - 1);
  }
  // A saved skill can be taken off again; the step stays open to add others.
  async function removeSkill(skill: string) {
    const remaining = skills.filter((item) => item.toLowerCase() !== skill.toLowerCase());
    await save({ preferences: { skills: remaining.join(", ") } }, "skills", true);
  }
  async function addSkills(extra: string[]) {
    const merged = [...skills, ...extra].filter((item, i, all) => item && all.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === i);
    if (await save({ preferences: { skills: merged.join(", ") } }, nextStep("skills"), true)) { setSkillText(""); setSelectedSkills([]); }
  }
  async function removeRow(list: "education" | "experience", index: number) {
    const remaining = ((profile?.[list] ?? []) as Row[]).filter((_, i) => i !== index);
    if (!(await save({ [list]: remaining }, list))) return;
    const at = list === "education" ? eduAt : workAt;
    // Keep the form on a real entry: the first one left, or a blank form if none.
    if (remaining.length === 0) startAdding(list);
    else if (at === index) editRow(list, 0, remaining);
    else if (at !== null && at > index) (list === "education" ? setEduAt : setWorkAt)(at - 1);
  }

  const rows = (list: "education" | "experience") => {
    const at = list === "education" ? eduAt : workAt;
    return (profile?.[list] ?? []).map((row, i) => {
      const title = list === "education" ? str(row.qualification) || str(row.course) : str(row.title);
      const place = list === "education" ? str(row.institution) : str(row.organisation) || WORK_KINDS.find((k) => k.id === row.kind)?.label || "";
      const editing = at === i;
      return (
        <li key={i} aria-current={editing ? "true" : undefined} className={`flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 text-[0.88rem] ${editing ? "bg-slate-100 ring-1 ring-slate-400" : "bg-slate-100"}`}>
          <span><b className="font-semibold text-slate-900">{title || "Untitled"}</b>{place && <span className="text-slate-600"> · {place}</span>}{editing && <span className="ml-2 text-[0.8rem] font-medium text-slate-600">Editing below</span>}</span>
          <span className="flex shrink-0 gap-1">
            {!editing && <button type="button" disabled={busy} onClick={() => editRow(list, i)} className="min-h-11 px-2 text-[0.8rem] font-medium text-brand-violet">Edit</button>}
            <button type="button" disabled={busy} onClick={() => void removeRow(list, i)} className="min-h-11 px-2 text-[0.8rem] text-slate-600 hover:text-slate-900">Remove</button>
          </span>
        </li>
      );
    });
  };

  return (
    <GuideProvider track={track} role={role}>
    <section aria-label="Your details for the resume" className="rounded-xl bg-surface p-5">
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Your details</h2>
      <p className="mt-1 text-[0.85rem] text-slate-600">
        {gaps.length === 0 ? "Your details are ready." : `${4 - new Set(gaps.map((g) => STEP_OF[g.item])).size} of 4 done. Saved to your profile.`}
      </p>
      <FormAlert className="mt-3" message={error} />
      {error && <CopyButton label="unsaved details" value={JSON.stringify({about,study,work,skills:skillText,selectedSkills}, null, 2)} />}
      <fieldset disabled={busy}><ol className="mt-4 space-y-3">
        {steps.map((item, index) => {
          const open = step === item.id;
          const done = doneStep(item.id);
          return (
            <li key={item.id} className={`rounded-xl border ${open ? "border-slate-400" : "border-slate-200"}`}>
              <button type="button" aria-expanded={open} onClick={() => onStep(open ? null : item.id)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
                <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.8rem] font-bold ${done ? "bg-teal-700 text-[var(--m3-on-primary)]" : "bg-slate-200 text-slate-700"}`}>{done ? "✓" : index + 1}</span>
                <span className="flex-1"><b className="block text-[0.95rem] font-semibold text-slate-900">{item.title}</b><small className="block text-[0.78rem] text-slate-500">{done ? "Done - tap to change" : item.why}</small></span>
              </button>
              {open && (
                <div className="border-t border-slate-200 px-4 py-4">
                  {item.id === "about" && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {([["fullName", "Full name", "Aarav Sharma"], ["phone", "Phone", "98765 43210"], ["city", "City", "Hyderabad"]] as const).map(([key, name, hint]) => (
                        <Labelled key={key} text={name} required guide={ABOUT_GUIDE[key]}>
                          <input className={input} value={about[key]} placeholder={hint} inputMode={key === "phone" ? "tel" : undefined} autoComplete={key === "fullName" ? "name" : key === "phone" ? "tel" : "address-level2"} onChange={(e) => setAbout((a) => ({ ...a, [key]: e.target.value }))} />
                        </Labelled>
                      ))}
                      <p className="text-[0.78rem] text-slate-500 sm:col-span-3">Your email comes from your account.</p>
                      <button type="button" disabled={busy} onClick={saveAbout} className="min-h-11 rounded-full bg-brand-violet px-5 text-[0.9rem] font-medium text-[var(--m3-on-primary)] sm:col-span-3 sm:justify-self-start">{busy ? "Saving…" : "Save and continue"}</button>
                    </div>
                  )}
                  {item.id === "education" && (
                    <>
                      {(profile?.education.length ?? 0) > 0 && <ul className="mb-4 space-y-2">{rows("education")}</ul>}
                      {studyStart.fromProfile && (profile?.education.length ?? 0) === 0 && <p className="mb-3 text-[0.82rem] text-slate-600">Filled in from your profile. Check it, then add it to your resume.</p>}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Labelled text="What you studied" required guide="education.qualification"><input className={input} value={study.qualification} placeholder="B.Com, Class XII, Diploma" onChange={(e) => setStudy((s) => ({ ...s, qualification: e.target.value }))} /></Labelled>
                        <Labelled text="Where" required guide="education.institution"><input className={input} value={study.institution} placeholder="Osmania University" onChange={(e) => setStudy((s) => ({ ...s, institution: e.target.value }))} /></Labelled>
                        <Labelled text="From (year)" guide="education.period"><input className={input} value={study.from} inputMode="numeric" placeholder="2023" onChange={(e) => setStudy((s) => ({ ...s, from: e.target.value }))} /></Labelled>
                        <Labelled text="To (year)" guide="education.period"><input className={input} value={study.to} inputMode="numeric" placeholder="2026" disabled={study.current} onChange={(e) => setStudy((s) => ({ ...s, to: e.target.value }))} /></Labelled>
                        <label className="flex min-h-11 items-center gap-2 text-[0.85rem] text-slate-700"><input type="checkbox" className="h-5 w-5" checked={study.current} onChange={(e) => setStudy((s) => ({ ...s, current: e.target.checked }))} />Still studying here</label>
                        <Labelled text="Marks or CGPA (optional)" guide="education.marks"><input className={input} value={study.marks} placeholder="78% or 8.1" onChange={(e) => setStudy((s) => ({ ...s, marks: e.target.value }))} /></Labelled>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" disabled={busy} onClick={addStudy} className="min-h-11 rounded-full bg-brand-violet px-5 text-[0.9rem] font-medium text-[var(--m3-on-primary)]">{busy ? "Saving…" : eduAt !== null ? "Save changes" : "Add and continue"}</button>
                        {eduAt !== null && <button type="button" disabled={busy} onClick={() => startAdding("education")} className="min-h-11 rounded-full px-4 text-[0.9rem] font-medium text-brand-violet">+ Add another</button>}
                        {done && <button type="button" onClick={() => onStep(nextStep("education"))} className="min-h-11 rounded-full border border-slate-400 px-5 text-[0.9rem] font-medium text-brand-violet">Next step</button>}
                      </div>
                    </>
                  )}
                  {item.id === "experience" && (
                    <>
                      {(profile?.experience.length ?? 0) > 0 && <ul className="mb-4 space-y-2">{rows("experience")}</ul>}
                      {workStart.fromProfile && (profile?.experience.length ?? 0) === 0 && <p className="mb-3 text-[0.82rem] text-slate-600">Filled in from your profile. Add a line on what you did, then add it to your resume.</p>}
                      <p className="mb-3 text-[0.82rem] text-slate-600">{experienced ? "Show the work you owned, the scale, the outcome and what evidence you can discuss in an interview." : "A project, club, volunteer role or family-business contribution counts when you can explain what you did."}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Labelled text="What kind" guide="experience.kind"><select className={input} value={work.kind || (experienced ? "job" : "project")} onChange={(e) => setWork((w) => ({ ...w, kind: e.target.value }))}>{WORK_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select></Labelled>
                        <Labelled text={experienced ? "Role" : "What it was"} required guide="experience.title"><input className={input} value={work.title} placeholder={experienced ? "Your job title" : "Registration desk lead, college fest"} onChange={(e) => setWork((w) => ({ ...w, title: e.target.value }))} /></Labelled>
                        <Labelled text={experienced ? "Employer (optional)" : "Where (optional)"} guide="experience.organisation"><input className={input} value={work.organisation} placeholder={experienced ? "Employer name" : "Osmania University"} onChange={(e) => setWork((w) => ({ ...w, organisation: e.target.value }))} /></Labelled>
                        <div className="grid grid-cols-2 gap-3">
                          <Labelled text="From" guide="experience.period"><input className={input} value={work.from} placeholder="2025" onChange={(e) => setWork((w) => ({ ...w, from: e.target.value }))} /></Labelled>
                          <Labelled text="To" guide="experience.period"><input className={input} value={work.to} placeholder="2025" onChange={(e) => setWork((w) => ({ ...w, to: e.target.value }))} /></Labelled>
                        </div>
                        <Labelled className={`${label} sm:col-span-2`} text="What you did" required guide="experience.bullets"><textarea rows={3} className={`${input} py-2`} value={work.detail} placeholder={experienced ? "Describe a responsibility and the actions you took" : "Ran the check-in desk for 400 visitors over two days with a team of 5"} onChange={(e) => setWork((w) => ({ ...w, detail: e.target.value }))} />
                        </Labelled>
                        {experienced && ([["scope", "Scope and responsibilities"], ["tools", "Tools used"], ["outcome", "Achievements and outcomes"], ["evidenceSource", "Evidence source (for example, a report or project)"]] as const).map(([key, title]) => <Labelled key={key} text={`${title} (optional)`} guide={EXTRA_GUIDE[key]}><textarea rows={2} className={`${input} py-2`} value={work[key]} onChange={event => setWork(previous => ({ ...previous, [key]: event.target.value }))} /></Labelled>)}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" disabled={busy} onClick={addWork} className="min-h-11 rounded-full bg-brand-violet px-5 text-[0.9rem] font-medium text-[var(--m3-on-primary)]">{busy ? "Saving…" : workAt !== null ? "Save changes" : "Add and continue"}</button>
                        {workAt !== null && <button type="button" disabled={busy} onClick={() => startAdding("experience")} className="min-h-11 rounded-full px-4 text-[0.9rem] font-medium text-brand-violet">+ Add another</button>}
                        {done && <button type="button" onClick={() => onStep(nextStep("experience"))} className="min-h-11 rounded-full border border-slate-400 px-5 text-[0.9rem] font-medium text-brand-violet">Next step</button>}
                      </div>
                    </>
                  )}
                  {item.id === "skills" && (
                    <>
                      {skills.length > 0 && <><p className="mb-2 text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">On your resume · tap × to remove</p><ul className="mb-3 flex flex-wrap gap-2">{skills.map((skill) => <li key={skill} className="inline-flex items-center rounded-full bg-slate-100 py-1.5 pl-3 pr-1 text-[0.85rem] text-slate-800">{skill}<button type="button" disabled={busy} aria-label={`Remove ${skill}`} onClick={() => void removeSkill(skill)} className="-my-2.5 ml-0.5 grid h-11 w-11 place-items-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40"><Close size={14} /></button></li>)}</ul></>}
                      <Labelled text="Add skills" guide="skills.items"><input className={input} value={skillText} placeholder="Customer service, Google Sheets, Hindi typing" onChange={(e) => setSkillText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (skillText.trim() || selectedSkills.length)) { e.preventDefault(); void addSkills([...selectedSkills, ...splitList(skillText)]); } }} />
                      </Labelled>
                      {suggestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">{suggestionsForRole ? "This role looks for" : "Common skills employers look for"} · tap to add if true</p>
                          <div className="mt-2 flex flex-wrap gap-2">{suggestions.filter((s) => !skills.some((k) => k.toLowerCase() === s.toLowerCase())).slice(0, 10).map((s) => <button key={s} type="button" disabled={busy} aria-pressed={selectedSkills.includes(s)} onClick={() => setSelectedSkills(current => current.includes(s) ? current.filter(skill => skill !== s) : [...current, s])} className="min-h-11 rounded-full border border-violet-300 px-3 text-[0.85rem] text-violet-700">{selectedSkills.includes(s) ? "✓" : "+"} {s}</button>)}</div>
                        </div>
                      )}
                      <button type="button" disabled={busy || (!skillText.trim() && !selectedSkills.length)} onClick={() => void addSkills([...selectedSkills, ...splitList(skillText)])} className="mt-4 min-h-11 rounded-full bg-brand-violet px-5 text-[0.9rem] font-medium text-[var(--m3-on-primary)] disabled:opacity-40">{busy ? "Saving…" : "Save selected skills"}</button>
                      <p role="status" className="mt-2 text-sm text-slate-600">{selectedSkills.length ? `${selectedSkills.length} selected — save when you are ready.` : "Select as many suggestions as you need, then save them together."}</p>
                      <p className="mt-2 text-[0.78rem] text-slate-500">{skills.length >= MIN_SKILLS ? `${skills.length} skills on your record.` : `${skills.length} of ${MIN_SKILLS} added.`}</p>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol></fieldset>
    </section>
    </GuideProvider>
  );
}
