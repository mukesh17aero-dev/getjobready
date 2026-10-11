import Link from "next/link";
import type { Opportunity } from "@/lib/api";

export function OpportunityDetail({ job }: { job: Opportunity }) {
  const checked = job.lastCheckedAt ? new Date(job.lastCheckedAt) : null;
  return (
    <article className="mt-5 min-w-0 rounded-2xl border border-slate-200 bg-surface p-5 sm:p-8 [overflow-wrap:anywhere]">
      <p className="text-sm font-bold text-brand-violet-deep">{job.company || "Employer not named"}</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-brand-ink">{job.title}</h1>
      <p className="mt-2 text-slate-600">{[job.location, job.type].filter(Boolean).join(" · ")}</p>
      <p className="mt-4 text-sm text-slate-600">Check the work, requirements and pay before deciding whether to apply.</p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          ["Pay", job.salary || "Not listed"], ["Experience", job.experience],
          ["Skills", job.skills], ["Shift", job.shift], ["Languages", job.languages],
        ].filter(([, value]) => value).map(([label, value]) => (
          <div key={label}><dt className="text-sm font-bold text-slate-700">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-slate-600">{value}</dd></div>
        ))}
      </dl>
      {job.description && <section className="mt-6" aria-labelledby="job-description">
        <h2 id="job-description" className="font-bold text-brand-ink">The work</h2>
        <p className="mt-2 whitespace-pre-wrap text-slate-700">{job.description}</p>
      </section>}
      {job.requirements && <section className="mt-6" aria-labelledby="job-requirements">
        <h2 id="job-requirements" className="font-bold text-brand-ink">Requirements</h2>
        <p className="mt-2 whitespace-pre-wrap text-slate-700">{job.requirements}</p>
      </section>}
      {checked && Number.isFinite(checked.getTime()) && <p className="mt-6 text-sm text-slate-600">
        Feed last checked: <time dateTime={job.lastCheckedAt}>{checked.toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC</time>. Confirm availability with the employer.
      </p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-brand-violet px-4 text-sm font-bold text-white hover:bg-brand-violet-deep">Apply on NewEra ↗</a>
        <Link href={`/job-fit?opportunity=${encodeURIComponent(job.id)}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-brand-ink">See my profile fit</Link>
      </div>
      <p className="mt-2 text-sm text-slate-600">Applying opens NewEra in a new tab. Your Ascend record is not sent by this link.</p>
    </article>
  );
}
