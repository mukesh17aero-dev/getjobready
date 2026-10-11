"use client";

import Link from "next/link";
import { useState } from "react";
import { whenLabel } from "@/lib/when";
import type { ResumeCareerProfile } from "./resume-api";
import type { LedgerEntry } from "./resume-vocab";
import { resumePage } from "./resume-pagination";
import { MiniPreview } from "./resume-sheet";
import { asTemplate, TEMPLATES } from "./templates";
import s from "./saved-resumes.module.css";
import { M3_ROOT } from "./m3";

export function savedResumeEntries(profile: ResumeCareerProfile | null): LedgerEntry[] {
  const raw = profile?.preferences.resumeLedger;
  return Array.isArray(raw) ? raw.filter((entry): entry is LedgerEntry => Boolean(entry && typeof entry === "object" && typeof entry.role === "string" && typeof entry.at === "string")).slice().reverse() : [];
}

// "No particular role" is how a general resume is filed; it is not a title.
const titleOf = (entry: LedgerEntry) => !entry.role.trim() || /^no particular role$/i.test(entry.role.trim()) ? "General resume" : entry.role.trim();

/** One saved resume as a card: what it looks like, what it is for, and when it was made. */
function SavedCard({ entry, latest }: { entry: LedgerEntry; latest: boolean }) {
  const title = titleOf(entry);
  const look = asTemplate(entry.displayTemplate ?? entry.template);
  const when = entry.downloadedAt ? `Downloaded ${whenLabel(entry.downloadedAt)}` : `Saved ${whenLabel(entry.at)}`;
  const body = <>
    <span className={s.thumb}>{entry.resume
      ? <MiniPreview id={look} resume={entry.resume} roleLine={title === "General resume" ? "" : title} />
      : <span className={s.noDraft}>Draft not available</span>}</span>
    <span className={s.meta}>
      {(latest || entry.downloadedAt || entry.review) && <span className={s.badges}>
        {latest && <b className={s.badge} data-tone="latest">Latest</b>}
        {entry.downloadedAt && <b className={s.badge}>Downloaded</b>}
        {entry.review && <b className={s.badge}>Reviewed</b>}
      </span>}
      <strong className={s.title}>{title}</strong>
      <span className={s.detail}>{TEMPLATES.find(item => item.id === look)?.name ?? "Basic"} layout</span>
      <span className={s.when}>{when}</span>
    </span>
  </>;
  return entry.resume
    ? <Link className={s.card} href={`/resume/build?record=${encodeURIComponent(entry.at)}`} aria-label={`Open ${title}, ${when}`}>{body}<span className={s.open} aria-hidden="true">Open →</span></Link>
    : <div className={s.card} data-unavailable>{body}<span className={s.open}>History only</span></div>;
}

export function SavedResumes({ profile, signedIn, unavailable = false }: { profile: ResumeCareerProfile | null; signedIn: boolean; unavailable?: boolean }) {
  const [page, setPage] = useState(0);
  const entries = savedResumeEntries(profile);
  const shown = resumePage(entries, page);
  return <main className={`${s.page} ${M3_ROOT}`}>
    <Link href="/resume" className={s.back}>← Apply</Link>
    <header className={s.header}><div><div className={s.titleRow}><h1>My resumes</h1></div><p>Open a saved resume or create a new one.</p></div><Link className={s.primary} href="/resume/build">Create new resume</Link></header>
    {!signedIn ? <section className={s.empty}><h2>Keep your resumes together</h2><p>Sign in to see resumes saved to your account.</p><Link href="/login?next=%2Fresume%2Fsaved">Sign in →</Link><Link href="/resume/build">Continue browser draft →</Link></section>
      : unavailable ? <section className={s.empty}><h2>We couldn’t load your resumes</h2><p>Your saved resumes haven’t been changed.</p><button onClick={() => window.location.reload()} type="button">Retry</button></section>
      : entries.length === 0 ? <section className={s.empty}><h2>No saved resumes yet</h2><p>Your saved drafts will appear here.</p></section>
      : <><ul className={s.grid}>{shown.entries.map((entry, index) => <li key={`${entry.at}-${index}`}><SavedCard entry={entry} latest={shown.page === 0 && index === 0} /></li>)}</ul>
        {shown.pages > 1 && <nav className={s.pagination} aria-label="Saved resume pages"><button disabled={shown.page === 0} onClick={() => setPage(shown.page - 1)}>Previous</button><span role="status">Page {shown.page + 1} of {shown.pages}<small>{shown.start + 1}–{shown.start + shown.entries.length} of {entries.length} resumes</small></span><button disabled={shown.page === shown.pages - 1} onClick={() => setPage(shown.page + 1)}>Next</button></nav>}</>}
  </main>;
}

export function ResumeLoadError() {
  return <main className={s.page}><h1>We couldn’t load your resume details</h1><p>Your saved work hasn’t changed. Try again to continue.</p><button type="button" className={s.primary} onClick={() => window.location.reload()}>Retry</button><Link className={s.back} href="/resume/saved">My resumes</Link></main>;
}
