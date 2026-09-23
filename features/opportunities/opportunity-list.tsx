import Link from "next/link";
import type { Opportunity } from "@/lib/api";

// Real, live openings from NewEra - not a matched shortlist. There is no
// candidate-specific ranking yet, so the honest framing is "what is open
// right now", not "what fits you" - overclaiming that would fail the second
// design test (relevance drawn from this person's own record) on every card.

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-[0.8rem] leading-snug text-slate-700">{value}</dd>
    </div>
  );
}

function Card({ job }: { job: Opportunity }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-surface p-4">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-brand-violet-deep">
        {job.company || "Employer not named"}
      </p>
      <h2 className="mt-0.5 font-display text-[1.05rem] font-bold leading-snug text-brand-ink">
        {job.title}
      </h2>
      <p className="mt-1 text-[0.8rem] text-slate-600">
        {[job.location, job.type].filter(Boolean).join(" · ") || "Details not given"}
      </p>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <Field label="Pay" value={job.salary} />
        <Field label="Experience" value={job.experience} />
        <Field label="Skills" value={job.skills} />
        <Field label="Shift" value={job.shift} />
        <Field label="Languages" value={job.languages} />
        <Field label="Openings" value={job.openings > 0 ? String(job.openings) : ""} />
      </dl>

      {job.description && (
        <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-600">{job.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center rounded-xl bg-brand-teal-deep px-4 text-[0.8rem] font-bold text-white transition-colors hover:bg-brand-teal"
        >
          Apply on NewEra
        </a>
        <Link
          href="/practice"
          className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 px-4 text-[0.8rem] font-bold text-brand-ink transition-colors hover:border-brand-violet/60"
        >
          Practice before you apply
        </Link>
      </div>
      <p className="mt-1.5 text-[0.68rem] text-slate-400">
        Not matched to this exact opening — real practice and an assessment you can show, before the interview.
      </p>
    </li>
  );
}

export function OpportunityList({
  opportunities,
  status,
}: {
  opportunities: Opportunity[];
  status: "fetched" | "not_configured" | "unavailable";
}) {
  if (status === "not_configured") {
    return (
      <p className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6 text-[0.9rem] text-slate-600">
        Opportunities are not connected yet.
      </p>
    );
  }
  if (status === "unavailable") {
    return (
      <p className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6 text-center text-[0.9rem] text-slate-600">
        Open roles could not load just now. Give it a moment and reload.
      </p>
    );
  }
  if (opportunities.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-brand-mist px-5 py-6 text-[0.9rem] text-slate-600">
        No openings are published right now. This list comes straight from NewEra, so it changes as employers post there.
      </p>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {opportunities.map((job) => (
        <Card key={job.id} job={job} />
      ))}
    </ul>
  );
}
