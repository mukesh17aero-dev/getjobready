"use client";

import { useId, type ReactNode } from "react";
import type { PolishField, ResumeData } from "./resume-api";
import s from "./resume-workbench.module.css";
import { RequiredMark } from "@/components/ui/required-mark";
import { PolishButton } from "./polish-button";
import { standardFor } from "./track-standard";
import { FieldHelp, GuideProvider } from "./field-help";
import type { GuideKey } from "./field-guidance";

export const RESUME_SECTIONS = [
  ["header", "Contact details", "Your name and how to reach you"],
  ["summary", "Summary", "A short introduction in your own words"],
  ["experience", "Experience", "Work, internships and volunteering"],
  ["education", "Education", "What you studied and where"],
  ["skills", "Skills", "Tools and abilities you can demonstrate"],
  ["projects", "Projects", "Things you have built or contributed to"],
  ["certifications", "Certifications", "Qualifications beyond your education"],
  ["achievements", "Achievements", "Awards and accomplishments"],
  ["languages", "Languages", "Languages you can use"],
  ["activities", "Activities", "Clubs, communities and responsibilities"],
  ["interests", "Interests", "A little more about you"],
] as const;
/** The sections in the order the standard for their level puts them. */
export function resumeSections(track?: "student" | "early_career") {
  const order: readonly string[] = standardFor(track).order;
  return [...RESUME_SECTIONS].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
}
export type ResumeSection = typeof RESUME_SECTIONS[number][0];

// What to write in a field lives behind its ⓘ (field-help.tsx), not in a line
// of small print under every input. The input is named by its label text
// alone, so a screen reader does not read the ⓘ's own name as part of it.
// A field the person explains in their own words also gets the ✦ after it,
// which turns rough notes into resume wording (polish-button.tsx).
function Field({ label, value, onChange, multiline = false, maxLength = 500, type = "text", required = false, guide, polish, polishContext }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; maxLength?: number; type?: string; required?: boolean; guide?: GuideKey;
  polish?: PolishField; polishContext?: { title?: string; organisation?: string; period?: string };
}) {
  const id = useId();
  return <label className={s.field} htmlFor={id}><span className={s.fieldHead}><span id={`${id}-label`}>{label}{required && <RequiredMark />}</span>{guide && <FieldHelp field={guide} label={label} />}</span>{multiline
    ? <textarea id={id} data-field={guide} aria-labelledby={`${id}-label`} aria-required={required || undefined} rows={4} maxLength={maxLength} value={value} onChange={e => onChange(e.target.value)} />
    : <input id={id} data-field={guide} aria-labelledby={`${id}-label`} aria-required={required || undefined} type={type} maxLength={maxLength} value={value} onChange={e => onChange(e.target.value)} />}
    {polish && <PolishButton field={polish} label={label} value={value} context={polishContext} onUse={text => onChange(text.slice(0, maxLength))} />}</label>;
}

// Preserve empty lines while typing: otherwise a trailing newline disappears
// before the writer can enter the next bullet.
const lines = (value: string) => value.split("\n");
export function reorderEntry<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction;
  if (index < 0 || index >= items.length || next < 0 || next >= items.length) return items;
  const copy = [...items]; [copy[index], copy[next]] = [copy[next], copy[index]]; return copy;
}

function Entries<T>({ items: savedItems, label, empty, onChange, render, startWithOne = false }: {
  items: T[]; startWithOne?: boolean; label: string; empty: () => T; onChange: (items: T[]) => void;
  render: (item: T, update: (item: T) => void) => ReactNode;
}) {
  const items = savedItems.length || !startWithOne ? savedItems : [empty()];
  return <div className={s.entries}>{items.length === 0 && <p className={s.empty}>No entries yet. Add one when you have something to share.</p>}{items.map((item, i) => <fieldset className={s.entry} key={i} data-entry={i}>
    <legend>{label} {i + 1}</legend>
    <div className={s.entryTools}>
      <button type="button" aria-label={`Move ${label.toLowerCase()} ${i + 1} up`} disabled={i === 0} onClick={() => onChange(reorderEntry(items, i, -1))}>↑</button>
      <button type="button" aria-label={`Move ${label.toLowerCase()} ${i + 1} down`} disabled={i === items.length - 1} onClick={() => onChange(reorderEntry(items, i, 1))}>↓</button>
      <button type="button" disabled={savedItems.length === 0} onClick={() => onChange(items.filter((_, n) => n !== i))} aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}>Remove</button>
    </div>
    {render(item, value => onChange(items.map((row, n) => n === i ? value : row)))}
  </fieldset>)}<button className={s.add} type="button" onClick={() => onChange([...items, empty()])}>+ Add {label.toLowerCase()}</button></div>;
}

export function ResumeSectionEditor({ section, resume, onChange, disabled, track, role }: {
  section: ResumeSection; track?: "student" | "early_career"; resume: ResumeData; onChange: (next: ResumeData) => void; disabled: boolean;
  /** The role this resume is for, so examples behind each ⓘ fit the work. */
  role?: string;
}) {
  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => onChange({ ...resume, [key]: value });
  // Required for their level: experience is a working professional's, not a student's.
  const requiredSection = standardFor(track).need[section] === "required";
  const meta = RESUME_SECTIONS.find(item => item[0] === section)!;
  return <GuideProvider track={track} role={role}><fieldset disabled={disabled} className={s.fields} data-section={section}><legend className="sr-only">{meta[1]}{requiredSection && " (required)"}</legend>
    {section === "experience" && <p className={s.description}>{track === "early_career" ? "Show the work you owned, the scale, the tools, the outcome and what evidence you can discuss in an interview. Put your most recent relevant role first." : "A project, club, volunteer role or family-business contribution counts when you can explain what you did. Paid work is not required."}</p>}
    {section === "education" && <p className={s.description}>Add at least one qualification, including an unfinished course.</p>}
    {section === "skills" && <p className={s.description}>Add at least three skills across your groups.</p>}
    {section === "header" && <>
      <Field guide="header.name" required label="Full name" maxLength={80} value={resume.header.name} onChange={name => update("header", { ...resume.header, name })} />
      <Field guide="header.email" required label="Email" type="email" maxLength={120} value={resume.header.email} onChange={email => update("header", { ...resume.header, email })} />
      <Field guide="header.phone" label="Phone" type="tel" maxLength={40} value={resume.header.phone ?? ""} onChange={phone => update("header", { ...resume.header, phone })} />
      <Field guide="header.city" label="City" maxLength={80} value={resume.header.city} onChange={city => update("header", { ...resume.header, city })} />
      <Field guide="header.link" label="LinkedIn or portfolio" maxLength={160} value={resume.header.link ?? ""} onChange={link => update("header", { ...resume.header, link })} />
    </>}
    {section === "summary" && <><Field guide="summary.heading" label="Section heading" maxLength={40} value={resume.summaryHeading ?? "Summary"} onChange={value => update("summaryHeading", value)} /><Field guide="summary.text" polish="summary" required label="Your introduction" multiline maxLength={700} value={resume.summary} onChange={value => update("summary", value)} /></>}
    {section === "experience" && <><Field guide="experience.heading" label="Section heading" maxLength={40} value={resume.experienceHeading} onChange={value => update("experienceHeading", value)} /><Entries startWithOne items={resume.experience} label="Experience" empty={() => ({ title: "", organisation: "", period: "", bullets: [] })} onChange={value => update("experience", value)} render={(row, change) => <>
      <Field guide="experience.title" maxLength={80} required={resume.experience.length <= 1} label="Role or position" value={row.title} onChange={title => change({ ...row, title })} />
      <Field guide="experience.organisation" maxLength={90} label={track === "early_career" ? "Employer" : "Organisation"} value={row.organisation} onChange={organisation => change({ ...row, organisation })} />
      <Field guide="experience.period" maxLength={40} label="Dates" value={row.period} onChange={period => change({ ...row, period })} />
      <Field guide="experience.bullets" polish="experience.bullets" polishContext={{ title: row.title, organisation: row.organisation, period: row.period }} required={resume.experience.length <= 1} label="What you did" multiline maxLength={5000} value={row.bullets.join("\n")} onChange={value => change({ ...row, bullets: lines(value) })} />
    </>} /></>}
    {section === "education" && <Entries startWithOne items={resume.education} label="Education" empty={() => ({ qualification: "", institution: "", period: "", detail: "" })} onChange={value => update("education", value)} render={(row, change) => <>
      <Field guide="education.qualification" maxLength={90} required={resume.education.length <= 1} label="Qualification" value={row.qualification} onChange={qualification => change({ ...row, qualification })} />
      <Field guide="education.institution" maxLength={90} label="Institution" value={row.institution} onChange={institution => change({ ...row, institution })} />
      <Field guide="education.period" maxLength={40} label="Dates" value={row.period} onChange={period => change({ ...row, period })} />
      <Field guide="education.detail" polish="education.detail" polishContext={{ title: row.qualification, organisation: row.institution }} maxLength={120} label="Additional details" multiline value={row.detail} onChange={detail => change({ ...row, detail })} />
    </>} />}
    {section === "skills" && <Entries startWithOne items={resume.skills} label="Skill group" empty={() => ({ group: "", items: [] })} onChange={value => update("skills", value)} render={(row, change) => <>
      <Field guide="skills.group" maxLength={40} label="Group name" value={row.group} onChange={group => change({ ...row, group })} />
      <Field guide="skills.items" required={resume.skills.length <= 1} label="Skills" multiline value={row.items.join("\n")} onChange={value => change({ ...row, items: lines(value) })} />
    </>} />}
    {section === "projects" && <Entries items={resume.projects ?? []} label="Project" empty={() => ({ title: "", detail: "", tools: [] })} onChange={value => update("projects", value)} render={(row, change) => <>
      <Field guide="projects.title" maxLength={90} label="Project title" value={row.title} onChange={title => change({ ...row, title })} />
      <Field guide="projects.detail" polish="projects.detail" polishContext={{ title: row.title }} maxLength={240} label="Your contribution" multiline value={row.detail} onChange={detail => change({ ...row, detail })} />
      <Field guide="projects.tools" label="Tools used" multiline value={row.tools.join("\n")} onChange={value => change({ ...row, tools: lines(value) })} />
    </>} />}
    {section === "certifications" && <Entries items={resume.certifications ?? []} label="Certification" empty={() => ({ title: "", issuer: "", year: "" })} onChange={value => update("certifications", value)} render={(row, change) => <>
      <Field guide="certifications.title" maxLength={120} label="Certification title" value={row.title} onChange={title => change({ ...row, title })} />
      <Field guide="certifications.issuer" maxLength={90} label="Issued by" value={row.issuer} onChange={issuer => change({ ...row, issuer })} />
      <Field guide="certifications.year" maxLength={20} label="Year" value={row.year} onChange={year => change({ ...row, year })} />
    </>} />}
    {(section === "achievements" || section === "languages" || section === "activities" || section === "interests") && <Field guide={section as GuideKey} polish={section === "achievements" || section === "activities" ? section : undefined} label={meta[1]} multiline maxLength={3000} value={(resume[section] ?? []).join("\n")} onChange={value => update(section, lines(value))} />}
  </fieldset></GuideProvider>;
}
