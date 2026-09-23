"use client";

// Worked outputs: checking a posting against the record.

// -------------------------------------------------------------- job fit
// The product's own ring and radar on the worked example, so the panel and
// the page cannot show different shapes.

import { SAMPLE_JOB_FIT } from "@/features/job-fit";
import { FitRadar, ReadinessRing } from "@/features/job-fit";
const FIT_TONE: Record<string, string> = {
  proof: "bg-teal-50 text-teal-800 ring-teal-600/25",
  claim: "bg-amber-50 text-amber-900 ring-amber-600/25",
  gap: "bg-slate-100 text-slate-600 ring-slate-400/25",
};
const FIT_WORD: Record<string, string> = {
  proof: "Proven",
  claim: "Claimed",
  gap: "Nothing yet",
};

/** Paste the posting. It refuses a job title rather than guessing at one. */
export function FitPaste() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.8rem] font-bold text-brand-ink">
        Am I ready for this job?
      </p>
      <div className="mt-2 min-h-[5rem] rounded-lg border border-slate-300 px-2.5 py-2 text-[0.7rem] leading-relaxed text-slate-500">
        Customer Success Associate — Bengaluru
        <br />• Handle 40-60 customer queries a day over calls and email
        <br />• Own escalations end to end and keep the customer informed
        <br />• Maintain CRM records accurately
      </div>
      <p className="mt-1 text-[0.64rem] text-slate-500">
        A job title on its own is not enough to check you against.
      </p>
      <span className="mt-2 inline-flex min-h-8 items-center rounded-lg bg-brand-teal-deep px-3 text-[0.7rem] font-bold text-white">
        Check my fit
      </span>
    </div>
  );
}

/** The lines, and why the middle one is the point. */
export function FitLines() {
  return (
    <div>
      <ul className="grid gap-1.5">
        {SAMPLE_JOB_FIT.requirements.map((r) => (
          <li
            key={r.need}
            className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-surface px-2.5 py-2"
          >
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide ring-1 ring-inset ${FIT_TONE[r.state]}`}
            >
              {FIT_WORD[r.state]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.74rem] font-semibold leading-snug text-brand-ink">
                {r.need}
              </span>
              <span className="block text-[0.66rem] leading-snug text-slate-500">
                {r.note}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[0.7rem] leading-snug text-amber-900">
        <strong className="font-semibold">
          Two things here are claimed and not proven.
        </strong>{" "}
        In an interview those are the questions you will be asked and cannot
        answer.
      </p>
    </div>
  );
}

/** The ring and the radar, drawn by the components the page itself uses. */
export function FitDashboard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <p className="text-[0.78rem] font-bold text-brand-ink">
        {SAMPLE_JOB_FIT.roleTitle}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-3">
        <div className="text-center">
          <ReadinessRing value={SAMPLE_JOB_FIT.readiness} />
          <p className="mt-0.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Readiness
          </p>
        </div>
        <div className="min-w-[11rem] flex-1">
          <p className="text-center text-[0.62rem] font-bold text-slate-500">
            You against what this job asks
          </p>
          <FitRadar axes={SAMPLE_JOB_FIT.axes} />
          <div className="mt-0.5 flex justify-center gap-2.5 text-[0.58rem] font-semibold">
            <span className="flex items-center gap-1 text-teal-800">
              <span
                aria-hidden
                className="h-2 w-2 rounded-sm bg-brand-teal-deep"
              />
              You
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span aria-hidden className="h-2 w-2 rounded-sm bg-slate-400" />
              This job
            </span>
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-[0.74rem] font-semibold leading-snug text-brand-ink">
        {SAMPLE_JOB_FIT.verdict}
      </p>
      <p className="mt-1 text-[0.64rem] leading-snug text-slate-400">
        Readiness for this posting, from your own record. It is not a chance of
        being hired — nobody can tell you that.
      </p>
      <p className="mt-1.5 text-[0.64rem] text-slate-400">
        Example — yours would be measured against your own record.
      </p>
    </div>
  );
}
