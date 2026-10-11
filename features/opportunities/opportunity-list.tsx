"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./opportunities.module.css";
import type { Opportunity } from "@/lib/api";

// Real, live openings from NewEra - not a matched shortlist. There is no
// candidate-specific ranking yet, so the honest framing is "what is open
// right now", not "what fits you" - overclaiming that would fail the second
// design test (relevance drawn from this person's own record) on every card.

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-sm font-bold uppercase tracking-[0.1em] text-slate-600">{label}</dt>
      <dd className="mt-0.5 text-base leading-snug text-slate-700">{value}</dd>
    </div>
  );
}

function Card({ job }: { job: Opportunity }) {
  return (
    <li className={styles.card}>
      <p className="text-sm font-bold uppercase tracking-wide text-brand-violet-deep">
        {job.company || "Employer not named"}
      </p>
      <h2 className="mt-0.5 font-display text-lg font-bold leading-snug text-brand-ink">
        {job.title}
      </h2>
      <p className="mt-1 text-base text-slate-600">
        {[job.location, job.experience, job.type].filter(Boolean).join(" · ") || "Details not given"}
      </p>
      <p className="mt-1 text-sm text-slate-600">{job.salary || "Pay not listed"}{job.openings > 0 ? ` · ${job.openings} ${job.openings === 1 ? "opening" : "openings"}` : ""}</p>

      <Link href={`/opportunities/${encodeURIComponent(job.id)}`} className={styles.detailsLink}>View job details →</Link>
      <details className={styles.more}><summary>Pay, skills and requirements</summary><dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <Field label="Pay" value={job.salary} />
        <Field label="Experience" value={job.experience} />
        <Field label="Skills" value={job.skills} />
        <Field label="Shift" value={job.shift} />
        <Field label="Languages" value={job.languages} />
        <Field label="Openings" value={job.openings > 0 ? String(job.openings) : ""} />
      </dl>

      {job.description && (
        <p className="mt-3 text-base leading-relaxed text-slate-600">{job.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/opportunities/${encodeURIComponent(job.id)}`}
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-base font-bold text-brand-ink transition-colors hover:border-brand-violet/60"
        >
          View job details
        </Link>
        <Link
          href={`/job-fit?opportunity=${encodeURIComponent(job.id)}`}
          className="inline-flex min-h-11 items-center rounded-xl bg-brand-violet px-4 text-base font-bold text-white transition-colors hover:bg-brand-violet-deep"
        >
          See my profile fit
        </Link>
      </div>
      <p className="mt-1.5 text-sm text-slate-600">
        Compare this job with your current profile and resume. No practice is required.
      </p></details>
    </li>
  );
}

export function OpportunityList({
  opportunities,
  status,
  initialExperience = "0-1",
}: {
  opportunities: Opportunity[];
  status: "fetched" | "not_configured" | "unavailable";
  initialExperience?: "0-1" | "1-3";
}) {
  const [experience, setExperience] = useState<string>(initialExperience);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const visible = opportunities.filter(job => (experience === "all" || (experience === "unknown" ? !job.experienceBands?.length : job.experienceBands?.includes(experience as "0-1" | "1-3"))) && `${job.title} ${job.company} ${job.skills}`.toLowerCase().includes(search.trim().toLowerCase()) && job.location.toLowerCase().includes(location.trim().toLowerCase()));
  if (status === "not_configured") {
    return (
      <p className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6 text-base text-slate-600">
        Opportunities are not connected yet.
      </p>
    );
  }
  if (status === "unavailable") {
    return (
      <section aria-label="Jobs unavailable" className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6 text-base text-slate-600">
        <p role="alert">Open roles could not load just now. Your saved work is unchanged.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <button type="button" className="min-h-11 rounded-xl bg-brand-violet px-4 text-white" onClick={() => window.location.reload()}>Retry loading jobs</button>
          <Link href="/" className="inline-flex min-h-11 items-center underline">Return to Home</Link>
        </div>
      </section>
    );
  }
  if (opportunities.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6 text-base text-slate-600">
        No openings are published right now. This list comes straight from NewEra, so it changes as employers post there.
      </p>
    );
  }
  return (
    <section aria-label="Job listings">
      <div className={styles.filters}>
        <label>Search jobs<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Job title, company or skill" /></label>
        <label>Location<input type="search" value={location} onChange={event => setLocation(event.target.value)} placeholder="City or remote" /></label>
        <button type="button" onClick={() => { setSearch(""); setLocation(""); setExperience("all"); }}>Clear filters</button>
      </div>
      <label className="mb-4 flex flex-wrap items-center gap-3">Experience level<select className="min-h-11 rounded-lg border border-slate-300 bg-surface px-3" value={experience} onChange={event => setExperience(event.target.value)}><option value="0-1">Fresher / 0–1 years</option><option value="1-3">1–3 years</option><option value="unknown">Experience not classified</option><option value="all">All experience levels</option></select></label>
      <p role="status" className="mb-4 text-sm text-slate-600">{visible.length} jobs shown. Check the full listing before applying on NewEra.</p>
      {!visible.length && <p className="my-4">No jobs match this filter. Choose all experience levels to see the available listings.</p>}
      <ul className={styles.list}>
      {visible.map((job) => (
        <Card key={job.id} job={job} />
      ))}
    </ul></section>
  );
}
