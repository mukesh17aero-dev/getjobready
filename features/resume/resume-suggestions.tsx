"use client";

import { useEffect, useId, useState } from "react";
import { requiredDestination } from "./resume-required";
import type { ResumeSection } from "./resume-section-editor";
import { applyResumeFix, validateResumeDraft, type ExportTemplate, type ResumeCorrection, type ResumeData, type ResumeFix, type ResumeValidation } from "./resume-api";
import type { WriterReply } from "./draft-requests";
import s from "./resume-suggestions.module.css";

// The Suggestions tool. It reads the resume - what is missing, spelling and
// grammar, things that do not add up, what a screening system trips on, what
// would make it stronger - and lists each finding with a checkbox. The person
// ticks what they want, types in the small box where a fact only they know
// is needed, ignores the rest, and applies the selection in one go.
//
// Exact corrections and typed-in details are applied here; the rest goes to
// the backend's writer, which never adds a fact nobody gave. Everything that
// is applied passes through the editor's own undo. The panel stays mounted
// while the person moves between tools, so ticks and ignores survive, and
// the resume is read again whenever it has changed since the last read.

type Group = "must" | "wording" | "screening" | "stronger";
const GROUPS: Array<[Group, string]> = [
  ["must", "Must fix before you send it"],
  ["wording", "Spelling, grammar and wording"],
  ["screening", "Screening system checks"],
  ["stronger", "To make it stronger"],
];
const KIND: Record<ResumeCorrection["kind"], string> = { typo: "Spelling", grammar: "Grammar", logic: "Wording" };

type How =
  | { kind: "exact"; fix: ResumeCorrection }
  | { kind: "header"; field: "name" | "email" | "phone"; label: string; hint: string }
  | { kind: "skills"; label: string; hint: string }
  | { kind: "writer"; problem: string; label: string; hint: string; needed: boolean }
  | { kind: "link"; section: ResumeSection };

export type Item = { key: string; group: Group; title: string; detail: string; how: How };

/** Every finding as one item, with how it would be applied. */
/** Where on the resume a fix lands, in the person's terms. */
export function placeName(resume: ResumeData, fix: ResumeFix): string {
  switch (fix.section) {
    case "summary":
      return resume.summaryHeading || "Summary";
    case "experience": {
      const job = resume.experience[fix.entry];
      return `${job ? [job.title, job.organisation].filter(Boolean).join(", ") : "Experience"} · point ${fix.line + 1}`;
    }
    case "jobTitle":
      return `Experience · role ${fix.entry + 1}`;
    case "projects":
      return `Project · ${resume.projects?.[fix.entry]?.title || fix.entry + 1}`;
    case "education":
      return `Education · ${resume.education[fix.entry]?.qualification || fix.entry + 1}`;
    case "qualification":
      return `Education · qualification ${fix.entry + 1}`;
    case "skills":
      return `Skills · ${resume.skills[fix.entry]?.group || "group " + (fix.entry + 1)}`;
    case "achievements":
      return `Achievements · line ${fix.line + 1}`;
    case "activities":
      return `Activities · line ${fix.line + 1}`;
  }
}

export function itemsOf(report: ResumeValidation, resume: ResumeData): Item[] {
  const items: Item[] = [];
  for (const gap of report.missing) {
    const key = `missing:${gap.section}`;
    const base = { key, group: "must" as const, title: gap.section, detail: gap.fix };
    if (gap.section === "Your name") items.push({ ...base, how: { kind: "header", field: "name", label: "Your full name", hint: "As it should appear on the resume" } });
    else if (gap.section === "A way to reach you") items.push({ ...base, how: { kind: "header", field: "email", label: "Your email", hint: "name@example.com" } });
    else if (gap.section === "Skills") items.push({ ...base, how: { kind: "skills", label: "Skills you can show", hint: "Separated by commas" } });
    else if (gap.section === "Your profile") items.push({ ...base, how: { kind: "writer", problem: "My resume has no summary. Write a two- or three-line summary from what I say here.", label: "About you", hint: "In a line or two: what you do and the work you want", needed: true } });
    else items.push({ ...base, how: { kind: "link", section: requiredDestination(gap).section } });
  }
  for (const issue of report.logic) {
    const base = { key: `logic:${issue.where}:${issue.detail}`, group: "must" as const, title: issue.where, detail: issue.detail };
    if (issue.section === "header") {
      const field = /email/i.test(issue.detail) ? "email" : /phone/i.test(issue.detail) ? "phone" : null;
      items.push({ ...base, how: field ? { kind: "header", field, label: field === "email" ? "The right email" : "The right phone number", hint: field === "email" ? "name@example.com" : "With the country code if you use one" } : { kind: "link", section: "header" } });
    } else {
      // Only they can say whether it happened, or what the dates were; a
      // rewrite without that cannot be written, so it is not offered.
      const needed = issue.needsFact ?? true;
      items.push({ ...base, how: { kind: "writer", problem: `In ${issue.where}: ${issue.detail}`, label: needed ? "What is true?" : "Add what is true, if it helps", hint: needed ? "For example: it happened in March 2026, or take it out" : "Leave it empty to take it out", needed } });
    }
  }
  for (const fix of report.corrections) {
    items.push({ key: `fix:${fix.section}:${fix.before}:${fix.after}`, group: "wording", title: `${KIND[fix.kind]} · ${placeName(resume, fix)}`, detail: fix.why, how: { kind: "exact", fix } });
  }
  for (const check of report.ats) {
    // The check knows when closing it needs a fact: its own question is asked.
    items.push({ key: `ats:${check.label}:${check.detail}`, group: "screening", title: check.label, detail: check.detail, how: check.ask
      ? { kind: "writer", problem: `${check.label}: ${check.detail}`, label: check.ask, hint: "Only what is true", needed: true }
      : { kind: "writer", problem: `${check.label}: ${check.detail}`, label: "Add a fact, if one is needed", hint: "Leave it empty to reword what is there", needed: false } });
  }
  for (const idea of report.stronger) {
    // Making it stronger always takes something only they know.
    items.push({ key: `stronger:${idea.what}`, group: "stronger", title: idea.what, detail: idea.how, how: { kind: "writer", problem: `${idea.what} ${idea.how}`, label: "What is true?", hint: "A number, a tool or an outcome", needed: true } });
  }
  return items;
}

/**
 * Whether an item can be ticked: only when it can be applied as it stands -
 * an exact correction, or a rewrite that needs no fact from the person. One
 * that waits for an answer is applied by answering it, and one that needs
 * several fields is done in Edit sections; a tick means nothing for either.
 */
export const tickable = (how: How) => how.kind === "exact";
/** An item waiting for an answer, which it now has. */
const answered = (how: How, answer: string) => (how.kind === "header" || how.kind === "skills") && Boolean(answer.trim());

/** One line the writer would change: where, what it says now, what it would say. */
export type LineChange = { where: string; before: string; after: string };

/** Every line that differs between two versions of a resume, named the way the person knows it. */
export function resumeChanges(a: ResumeData, b: ResumeData): LineChange[] {
  const out: LineChange[] = [];
  const cmp = (where: string, x?: string, y?: string) => {
    const before = (x ?? "").trim(), after = (y ?? "").trim();
    if (before !== after) out.push({ where, before, after });
  };
  const lines = (where: string, x: string[] = [], y: string[] = []) => {
    for (let i = 0; i < Math.max(x.length, y.length); i++) cmp(`${where} · line ${i + 1}`, x[i], y[i]);
  };
  cmp(a.summaryHeading || "Summary", a.summary, b.summary);
  for (let i = 0; i < Math.max(a.experience.length, b.experience.length); i++) {
    const x = a.experience[i], y = b.experience[i];
    const name = (x?.title || y?.title || `Experience ${i + 1}`).trim();
    cmp(`${name} · role`, x?.title, y?.title);
    cmp(`${name} · organisation`, x?.organisation, y?.organisation);
    cmp(`${name} · dates`, x?.period, y?.period);
    for (let j = 0; j < Math.max(x?.bullets.length ?? 0, y?.bullets.length ?? 0); j++) cmp(`${name} · point ${j + 1}`, x?.bullets[j], y?.bullets[j]);
  }
  for (let i = 0; i < Math.max(a.education.length, b.education.length); i++) {
    const x = a.education[i], y = b.education[i];
    const name = (x?.qualification || y?.qualification || `Education ${i + 1}`).trim();
    cmp(`${name} · qualification`, x?.qualification, y?.qualification);
    cmp(`${name} · institution`, x?.institution, y?.institution);
    cmp(`${name} · dates`, x?.period, y?.period);
    cmp(`${name} · details`, x?.detail, y?.detail);
  }
  for (let i = 0; i < Math.max(a.projects?.length ?? 0, b.projects?.length ?? 0); i++) {
    const x = a.projects?.[i], y = b.projects?.[i];
    const name = (x?.title || y?.title || `Project ${i + 1}`).trim();
    cmp(`${name} · title`, x?.title, y?.title);
    cmp(`${name} · your contribution`, x?.detail, y?.detail);
    cmp(`${name} · tools`, x?.tools.join(", "), y?.tools.join(", "));
  }
  for (let i = 0; i < Math.max(a.skills.length, b.skills.length); i++) cmp(`Skills · ${(a.skills[i]?.group || b.skills[i]?.group || `group ${i + 1}`).trim()}`, a.skills[i]?.items.join(", "), b.skills[i]?.items.join(", "));
  for (let i = 0; i < Math.max(a.certifications?.length ?? 0, b.certifications?.length ?? 0); i++) {
    const show = (c?: { title: string; issuer: string; year: string }) => (c ? [c.title, c.issuer, c.year].filter(Boolean).join(", ") : "");
    cmp(`Certification ${i + 1}`, show(a.certifications?.[i]), show(b.certifications?.[i]));
  }
  lines("Achievements", a.achievements, b.achievements);
  lines("Activities", a.activities, b.activities);
  lines("Languages", a.languages, b.languages);
  lines("Interests", a.interests, b.interests);
  return out;
}

/** A rewrite shown before it goes in: the version it was made from, and the one it would put in place. */
type Proposal =
  | { status: "loading" }
  | { status: "ready"; base: ResumeData; revised: ResumeData; changes: LineChange[]; message: string; added: string[] }
  | { status: "none"; message: string };

const splitSkills = (text: string) => text.split(/[,\n;]+/).map(item => item.trim()).filter(Boolean);

/**
 * One read of the resume. `for` is the version it read; `known` are the
 * versions made from it by fixes applied here, which are not read again -
 * the check runs once, and each fix just ticks its item off.
 */
type Read = { for: ResumeData; report: ResumeValidation | null; known: ResumeData[]; done: string[] };

export function ResumeSuggestions({ active, resume, template, targetRole, jobDescription, track, getToken, onAsk, onApply, onUndo, onOpenSection, onNext, disabled, sample }: {
  /** A finished read to show instead of asking for one - the signed-out example. */
  sample?: ResumeValidation;
  /** Student or working: the standard it is checked against. */
  track?: "student" | "early_career" | undefined;
  /** The job posting it is tailored to: it is checked against that job. */
  jobDescription?: string | undefined;
  /** Where to go once the suggestions are done: Download. */
  onNext?: () => void;
  /** Whether the tool is showing: the resume is read only while it is. */
  active: boolean;
  resume: ResumeData;
  template: ExportTemplate;
  targetRole?: string;
  getToken: () => Promise<string | null>;
  /** The writer: an instruction and the resume to apply it to. */
  onAsk: (instruction: string, base: ResumeData) => Promise<WriterReply | null>;
  /** Puts a new resume in place, through the editor's undo. */
  onApply: (next: ResumeData) => void;
  onUndo: () => void;
  /** Opens a section in Edit sections, for what needs several fields. */
  onOpenSection: (section: ResumeSection) => void;
  disabled: boolean;
}) {
  const [read, setRead] = useState<Read | null>(() => sample ? { for: resume, report: sample, known: [], done: [] } : null);
  const [attempt, setAttempt] = useState(0);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const [showIgnored, setShowIgnored] = useState(false);
  const [applying, setApplying] = useState(false);
  const [said, setSaid] = useState<{ text: string; undo: boolean; keys?: string[] } | null>(null);
  /** A fix applied here: the new version is not read again, and its items are done. */
  function own(next: ResumeData, keys: string[]) {
    onApply(next);
    setRead(r => r ? { ...r, known: [...r.known, next], done: [...r.done, ...keys] } : r);
  }
  const [proposals, setProposals] = useState<Record<string, Proposal>>({});
  const setProposal = (key: string, value: Proposal | null) => setProposals(all => { const next = { ...all }; if (value) next[key] = value; else delete next[key]; return next; });

  // A rewrite is asked for and shown - never put in - until the person accepts it.
  async function preview(item: Item) {
    if (item.how.kind !== "writer") return;
    const answer = (answers[item.key] ?? "").trim();
    setProposal(item.key, { status: "loading" });
    const base = resume;
    const reply = await onAsk(`Make this one change to my resume, and nothing else, adding no fact I have not given you: ${item.how.problem}${answer ? ` What is true: ${answer}.` : " Reword what is there only."}`, base);
    if (!reply) { setProposal(item.key, { status: "none", message: "The change could not be written just now. Try again in a moment." }); return; }
    const changes = reply.changed ? resumeChanges(base, reply.resume) : [];
    setProposal(item.key, changes.length
      ? { status: "ready", base, revised: reply.resume, changes, message: reply.message, added: reply.added }
      : { status: "none", message: reply.message || "Nothing would change without a fact from you. Add what is true and preview again." });
  }
  function accept(item: Item) {
    const proposal = proposals[item.key];
    if (proposal?.status !== "ready") return;
    // Built on the resume as it was; if it has changed since, it is out of date.
    if (proposal.base !== resume) { setProposal(item.key, { status: "none", message: "Your resume changed after this was written. Preview it again to see it on the current version." }); return; }
    own(proposal.revised, [item.key]);
    setProposal(item.key, null);
    setAnswers(a => Object.fromEntries(Object.entries(a).filter(([key]) => key !== item.key)));
    setSaid({ text: `Accepted: ${proposal.changes.length} ${proposal.changes.length === 1 ? "line" : "lines"} changed.${proposal.added.length ? ` Added from what you said: ${proposal.added.join("; ")}. Be ready to talk about it in an interview.` : ""}`, undo: true, keys: [item.key] });
  }

  // Read whenever the tool is open on a resume it has not read yet.
  // Changed elsewhere - in Edit sections or Request changes - it is a
  // different resume and is read again; changed here, it is not.
  const stale = !read || (read.for !== resume && !read.known.includes(resume));
  useEffect(() => {
    if (!active || !stale) return;
    let cancelled = false;
    const reading = resume;
    void (async () => {
      const t = await getToken();
      const report = t ? await validateResumeDraft(t, { resume: reading, template, ...(targetRole ? { targetRole } : {}), ...(track ? { track } : {}), ...(jobDescription ? { jobDescription } : {}), ...(!targetRole && !jobDescription ? { general: true } : {}) }) : null;
      if (cancelled) return;
      setRead({ for: reading, report, known: [], done: [] });
      // Exact corrections start ticked; anything that asks for a fact or a
      // rewrite is the person's call.
      if (report) setTicked(current => new Set([...current, ...report.corrections.map(fix => `fix:${fix.section}:${fix.before}:${fix.after}`)]));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, resume, attempt]);

  const loading = stale && active;
  const report = !stale ? read?.report ?? null : null;
  const all = report ? itemsOf(report, resume) : [];
  const shown = all.filter(item => !ignored.has(item.key) && !(read?.done.includes(item.key)));
  // Ticked ones, and any waiting for an answer that now has one.
  const chosen = shown.filter(item => tickable(item.how) ? ticked.has(item.key) : answered(item.how, answers[item.key] ?? ""));

  const tick = (key: string, on: boolean) => setTicked(set => { const next = new Set(set); if (on) next.add(key); else next.delete(key); return next; });

  async function apply(selection: Item[]) {
    setApplying(true); setSaid(null);
    let next = resume;
    const skipped: string[] = [];
    const applied: string[] = [];
    for (const item of selection) {
      const answer = (answers[item.key] ?? "").trim();
      const how = item.how;
      if (how.kind === "exact") {
        const changed = applyResumeFix(next, how.fix);
        if (changed) { next = changed; applied.push(item.key); } else skipped.push(item.title);
      } else if (how.kind === "header") {
        if (!answer) { skipped.push(item.title); continue; }
        next = { ...next, header: { ...next.header, [how.field]: answer } }; applied.push(item.key);
      } else if (how.kind === "skills") {
        const extra = splitSkills(answer);
        if (!extra.length) { skipped.push(item.title); continue; }
        const [first, ...rest] = next.skills;
        next = { ...next, skills: first ? [{ ...first, items: [...first.items, ...extra] }, ...rest] : [{ group: "", items: extra }] }; applied.push(item.key);
      }
    }
    const handled = new Set(selection.map(item => item.key));
    if (next !== resume) own(next, applied);
    setTicked(set => new Set([...set].filter(key => !handled.has(key))));
    setAnswers(a => Object.fromEntries(Object.entries(a).filter(([key]) => !handled.has(key))));
    setApplying(false);
    const head = applied.length ? `Applied ${applied.length} ${applied.length === 1 ? "suggestion" : "suggestions"}.` : "Nothing was changed.";
    const tail = skipped.length ? ` Skipped, as they need your answer or the line had changed: ${skipped.join(", ")}.` : "";
    setSaid({ text: `${head}${tail}`, undo: next !== resume, keys: applied });
  }

  return (
    <section className={s.block} aria-labelledby="suggestions-title" aria-busy={loading || applying}>
      <span className={s.label}>SUGGESTIONS</span>
      <h2 id="suggestions-title">{report && shown.length === 0 ? "Nothing to fix." : "What would improve your resume"}</h2>
      <p className={s.quiet}>Your finished resume is read once. Apply the fixes you want - each one is ticked off as you go - then continue to download. Nothing changes until you have seen the exact change and accepted it.</p>

      <div aria-live="polite">
        {said && <div className={s.said}><p>{said.text}</p>{said.undo && <button type="button" className={s.quietButton} onClick={() => { onUndo(); const back = said.keys ?? []; setRead(r => r ? { ...r, done: r.done.filter(key => !back.includes(key)) } : r); setSaid(null); }}>Undo</button>}</div>}
        {loading && <Checking />}
        {!loading && active && read && !read.report && <>
          <p className={s.quiet}>Suggestions could not be read just now. Your resume is unchanged.</p>
          <div className={s.actions}><button type="button" className={s.quietButton} onClick={() => { setRead(null); setAttempt(n => n + 1); }}>Try again</button></div>
        </>}
        {report && shown.length === 0 && <p className={s.done}>Your resume passes every check. You can download it.</p>}
      </div>

      {report && GROUPS.map(([group, title]) => {
        const items = shown.filter(item => item.group === group);
        if (!items.length) return null;
        // Collapsed until opened, so the list reads as four headings first.
        return <details key={group} className={s.group} open={Boolean(sample) || undefined}>
          <summary><h3>{title}</h3><span className={s.chevron} aria-hidden="true" /></summary>
          <ul className={s.items}>{items.map(item => <SuggestionItem key={item.key} item={item} on={ticked.has(item.key)} answer={answers[item.key] ?? ""} disabled={disabled || applying}
            onTick={on => tick(item.key, on)}
            onAnswer={text => { setAnswers(a => ({ ...a, [item.key]: text })); if (text.trim() && tickable(item.how)) tick(item.key, true); }}
            onIgnore={() => { setIgnored(set => new Set(set).add(item.key)); tick(item.key, false); }}
            onApplyOne={() => void apply([item])}
            proposal={proposals[item.key]}
            onPreview={() => void preview(item)}
            onAccept={() => accept(item)}
            onDiscard={() => setProposal(item.key, null)}
            onOpen={onOpenSection} />)}</ul>
        </details>;
      })}

      {report && <>
        {report.fromRules && <p className={s.quiet}>Spelling and grammar could not be read just now, so only the counted checks ran.</p>}
        {ignored.size > 0 && <button type="button" className={s.link} onClick={() => setShowIgnored(v => !v)}>{showIgnored ? "Hide" : "Show"} {ignored.size} ignored</button>}
        {showIgnored && <ul className={s.items}>{all.filter(item => ignored.has(item.key)).map(item => <li key={item.key} className={s.ignored}><strong>{item.title}</strong><button type="button" className={s.link} onClick={() => setIgnored(set => { const next = new Set(set); next.delete(item.key); return next; })}>Bring back</button></li>)}</ul>}
      </>}

      {report && shown.some(item => item.how.kind !== "link") && <div className={s.applyBar}>
        <button type="button" className={s.primary} disabled={disabled || applying || chosen.length === 0} onClick={() => void apply(chosen)}>
          {applying ? "Applying…" : chosen.length === 0 ? "Tick a suggestion to apply it" : `Apply ${chosen.length} selected`}
        </button>
      </div>}

      {onNext && report && <div className={s.next}>
        <h3>Done with suggestions?</h3>
        <p className={s.quiet}>Download your resume as Word or PDF. An AI Recruiter Review is waiting after it, if you want one.</p>
        <div className={s.actions}>
          <button type="button" className={report && shown.length === 0 ? s.primary : s.secondaryButton} disabled={applying} onClick={onNext}>Continue to download →</button>
        </div>
      </div>}
    </section>
  );
}

function SuggestionItem({ item, on, answer, disabled, onTick, onAnswer, onIgnore, onApplyOne, onOpen, proposal, onPreview, onAccept, onDiscard }: {
  item: Item; on: boolean; answer: string; disabled: boolean;
  onTick: (on: boolean) => void; onAnswer: (text: string) => void; onIgnore: () => void; onApplyOne: () => void; onOpen: (section: ResumeSection) => void;
  proposal?: Proposal | undefined; onPreview: () => void; onAccept: () => void; onDiscard: () => void;
}) {
  const id = useId();
  const how = item.how;
  // An answer is needed before this one can be applied on its own.
  const waiting = (how.kind === "header" || how.kind === "skills" || (how.kind === "writer" && how.needed)) && !answer.trim();
  const canTick = tickable(how);
  return <li className={s.item} data-on={(canTick && on) || undefined} data-plain={!canTick || undefined}>
    {canTick && <input type="checkbox" id={id} checked={on} disabled={disabled} onChange={event => onTick(event.target.checked)} />}
    <div className={s.itemBody}>
      {canTick ? <label htmlFor={id}><strong>{item.title}</strong></label> : <strong>{item.title}</strong>}
      {how.kind === "exact"
        ? <><span className={s.before}><span className="sr-only">Now: </span>{how.fix.before}</span><span className={s.after}><span className="sr-only">Suggested: </span>{how.fix.after}</span><p>{item.detail}</p></>
        : <p>{item.detail}</p>}
      {(how.kind === "header" || how.kind === "skills" || how.kind === "writer") && <label className={s.answer}>
        <span>{how.label}{how.kind === "writer" && !how.needed ? <em className={s.optional}> (optional)</em> : " *"}</span>
        <input value={answer} disabled={disabled || proposal?.status === "loading"} placeholder={how.hint} onKeyDown={event => { if (event.key === "Enter" && !waiting) { event.preventDefault(); if (how.kind === "writer") onPreview(); else onApplyOne(); } }} type={how.kind === "header" && how.field === "email" ? "email" : how.kind === "header" && how.field === "phone" ? "tel" : "text"} onChange={event => onAnswer(event.target.value)} />
      </label>}
      {/* A rewrite, shown line by line before anything goes into the resume. */}
      {how.kind === "writer" && proposal && <div className={s.proposal} aria-live="polite">
        {proposal.status === "loading" && <p className={s.working}><span className={s.spinnerSmall} aria-hidden="true" />Writing the change…</p>}
        {proposal.status === "none" && <p>{proposal.message}</p>}
        {proposal.status === "ready" && <>
          <p className={s.proposalHead}>The change, if you accept it</p>
          <ul>{proposal.changes.slice(0, 6).map(change => <li key={change.where + change.before}>
            <span className={s.where}>{change.where}</span>
            {change.before ? <span className={s.before}><span className="sr-only">Now: </span>{change.before}</span> : <span className={s.added}>New line</span>}
            {change.after ? <span className={s.after}><span className="sr-only">Would read: </span>{change.after}</span> : <span className={s.removed}>Taken out</span>}
          </li>)}</ul>
          {proposal.changes.length > 6 && <p className={s.quiet}>And {proposal.changes.length - 6} more {proposal.changes.length - 6 === 1 ? "line" : "lines"}.</p>}
          {proposal.added.length > 0 && <p className={s.quiet}>This adds what you said: {proposal.added.join("; ")}.</p>}
        </>}
      </div>}
      <div className={s.itemActions}>
        {how.kind === "link"
          ? <button type="button" className={s.link} onClick={() => onOpen(how.section)}>Add it in Edit sections →</button>
          : how.kind === "writer"
            ? proposal?.status === "ready"
              ? <><button type="button" className={s.applyOne} disabled={disabled} onClick={onAccept}>Accept</button><button type="button" className={s.ignore} onClick={onDiscard}>Discard</button></>
              : <button type="button" className={s.applyOne} disabled={disabled || waiting || proposal?.status === "loading"} onClick={onPreview}>{proposal?.status === "none" ? "Preview again" : "Preview the change"}</button>
            : <button type="button" className={s.applyOne} disabled={disabled || waiting} onClick={onApplyOne}>{how.kind === "exact" ? "Apply this fix" : "Add to resume"}</button>}
        {proposal?.status !== "ready" && <button type="button" className={s.ignore} disabled={disabled} onClick={onIgnore}>Ignore</button>}
      </div>
    </div>
  </li>;
}

// What is being read, said while it is read. A check takes several seconds
// because a model is reading every line; a single still sentence reads as
// hung, so the steps move - but none is ever shown as finished until the
// whole read is back.
const STEPS = ["Missing details", "Spelling and grammar", "Dates and facts that do not add up", "What a screening system looks for", "What would make it stronger"];

function Checking() {
  const [at, setAt] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setAt(n => (n + 1) % STEPS.length), 1600);
    return () => clearInterval(timer);
  }, []);
  return <div className={s.checking} role="status">
    <div className={s.checkingHead}><span className={s.spinner} aria-hidden="true" /><strong>Checking your resume for suggestions…</strong></div>
    <ul className={s.steps} aria-hidden="true">{STEPS.map((step, i) => <li key={step} data-now={i === at || undefined}>{step}</li>)}</ul>
    <p className={s.quiet}>This takes a few seconds. Your resume is not changed while it is read.</p>
  </div>;
}
