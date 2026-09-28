"use client";

import { useState } from "react";
import Link from "next/link";
import type { AssessableRole } from "@/lib/api";

// What you see before anything starts: pick the job, then decide what to do
// about it. Nothing about the company, the fiction or the first month appears
// here - being dropped into a scenario before choosing what you are being
// assessed on is the wrong order, and it made the choice look like something
// that had already been made for you.
//
// A list of cards made three jobs look like three offers. One dropdown and two
// buttons is the same information with one decision in it.
//
// The words are the ones somebody would use out loud. "Sittings", "scenes",
// "basis" and "confidence" are ours; a person has done a thing eight times and
// got a score, and that is what it should say.

function history(role: AssessableRole): string {
  if (role.sittings === 0) return "You have not taken this one yet.";
  const times = role.sittings === 1 ? "once" : `${role.sittings} times`;
  return role.lastReadiness === null
    ? `You have taken this ${times}.`
    : `You have taken this ${times}. Your last score was ${role.lastReadiness} out of 100.`;
}

export function ReadinessStart({ roles, initialRoleId }: { roles: AssessableRole[]; initialRoleId?: string }) {
  const [roleId, setRoleId] = useState(initialRoleId ?? roles[0]?.roleId ?? "");
  const picked = roles.find((r) => r.roleId === roleId) ?? roles[0];
  if (!picked) return null;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Which workplace will you step into?
      </h1>
      <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
        Try 10 workplace questions with no time limit. Handle short workplace situations through
        decisions, messages, handovers or spoken updates. Your saved work becomes
        the evidence for feedback on what to strengthen next.
      </p>

      <div className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-surface p-4">
        <label
          htmlFor="readiness-role"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400"
        >
          The job
        </label>
        <select
          id="readiness-role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 text-[0.95rem] font-semibold text-slate-900 outline-none focus:border-brand-violet"
        >
          {roles.map((r) => (
            <option key={r.roleId} value={r.roleId}>
              {r.roleTitle}
              {r.current ? " (chosen in Discover)" : ""}
              {r.hasAssessment ? "" : " (not ready yet)"}
            </option>
          ))}
        </select>
        {/* Which of these is the job the rest of the product is pointed at,
            said plainly. The list is every job with an assessment, so without
            this the one they actually chose is just another line. */}
        {picked.current ? (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[0.86rem] text-slate-600">
            <span className="rounded-full bg-brand-teal/15 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-brand-teal-deep">
              Chosen in Discover
            </span>
            {history(picked)}
          </p>
        ) : (
          <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-600">
            {history(picked)}{" "}
            {picked.chosen
              ? "You looked at this one in Discover too."
              : "You have not chosen this job in Discover, but you can still be assessed on it."}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* A job with nothing written for it stays on the list and says so,
              rather than vanishing. What is not offered is the button - a
              Start that opens an error is worse than a sentence. */}
          {picked.hasAssessment ? (
            <Link
              href={`/practice/readiness?role=${picked.roleId}&begin=1`}
              className="inline-flex min-h-11 items-center rounded-lg bg-brand-violet px-5 text-[0.88rem] font-bold text-white transition-colors hover:bg-brand-violet-deep"
            >
              {picked.sittings > 0 ? "Take it again" : "Open my work shift"}
            </Link>
          ) : (
            <p className="text-[0.86rem] leading-relaxed text-amber-900">
              The assessment for this job is not written yet. It will appear
              here when it is.
            </p>
          )}
          {/* Only when there is something behind it. A button that opens an
              empty page is worse than no button. */}
          {picked.sittings > 0 && (
            <Link
              href={`/practice/readiness/results?role=${picked.roleId}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 text-[0.88rem] font-semibold text-slate-700 transition-colors hover:border-slate-400"
            >
              See past results
            </Link>
          )}
        </div>
      </div>

      <Link
        href="/discover"
        className="mt-5 inline-block text-[0.86rem] text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
      >
        Change the job you are aiming at, in Discover
      </Link>
    </>
  );
}
