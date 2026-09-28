"use client";

// The College Cohort Portal's one screen: how the cohort is doing, drawn
// only from work students actually did on Ascend, plus the roster that
// data comes from. See modules/institution/README.md on the backend — every
// number here is already scoped to this institution's own consented
// students; nothing here re-checks that boundary, it only renders it.

import { useState } from "react";
import {
  inviteStudents,
  revokeStudentLink,
  type CohortOverview,
  type RequestLinkResult,
  type RosterEntry,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormAlert } from "@/components/ui/form-alert";

const STATUS_LABEL: Record<RosterEntry["status"], string> = {
  pending: "Invited, awaiting response",
  active: "Consented",
  declined: "Declined",
  revoked: "Revoked",
};

const RESULT_LABEL: Record<RequestLinkResult["result"], string> = {
  requested: "Invitation sent",
  already_linked: "Already on your roster",
  no_account: "No Ascend account yet — ask them to sign up first",
};

function parseEmails(input: string): string[] {
  return [...new Set(input.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean))];
}

export function CohortDashboard({
  overview,
  roster: initialRoster,
}: {
  overview: CohortOverview | null;
  roster: RosterEntry[] | null;
}) {
  const [roster, setRoster] = useState(initialRoster);
  const [emailsInput, setEmailsInput] = useState("");
  const [inviteResults, setInviteResults] = useState<RequestLinkResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<RosterEntry | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  async function sessionToken(): Promise<string | null> {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const emails = parseEmails(emailsInput);
    if (emails.length === 0) {
      setError("Add at least one student email.");
      return;
    }
    setBusy(true);
    setError(null);
    setInviteResults(null);
    const token = await sessionToken();
    if (!token) {
      setBusy(false);
      setError("Your session expired. Reload and sign in again.");
      return;
    }
    const result = await inviteStudents(token, emails);
    setBusy(false);
    if (!result) {
      setError("Could not reach the server. Try again.");
      return;
    }
    setInviteResults(result.results);
    setEmailsInput("");
    setRoster((current) => {
      const requested = result.results.filter((r) => r.result === "requested");
      if (requested.length === 0 || !current) return current;
      const now = new Date().toISOString();
      return [
        ...requested.map((r) => ({
          linkId: `pending-${r.email}`,
          userId: "",
          email: r.email,
          status: "pending" as const,
          requestedAt: now,
          respondedAt: null,
        })),
        ...current,
      ];
    });
  }

  async function handleRevoke() {
    if (!revoking) return;
    setRevokeBusy(true);
    const token = await sessionToken();
    if (!token) {
      setRevokeBusy(false);
      setRevoking(null);
      setError("Your session expired. Reload and sign in again.");
      return;
    }
    const result = await revokeStudentLink(token, revoking.linkId);
    setRevokeBusy(false);
    const revokedId = revoking.linkId;
    setRevoking(null);
    if (!result?.revoked) {
      setError("Could not revoke that link. Try again.");
      return;
    }
    setRoster((current) =>
      current?.map((entry) =>
        entry.linkId === revokedId ? { ...entry, status: "revoked" as const } : entry,
      ) ?? current,
    );
  }

  const dataUnavailable = overview === null || roster === null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <header className="mb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
          College cohort portal
        </p>
        <h1 className="mt-2 text-2xl font-bold text-brand-ink sm:text-3xl">
          How ready is your cohort, really?
        </h1>
        <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
          Not attendance, not grades — what your students actually did on Ascend: how many
          have started, assessed themselves, trained and practiced an interview.
        </p>
      </header>

      {dataUnavailable && (
        <div
          role="alert"
          className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[0.9rem] text-amber-800"
        >
          Could not load your cohort data. Reload the page to try again.
        </div>
      )}

      {overview && (
        <section className="mb-10">
          {overview.totalConsented === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-surface p-5 text-[0.9rem] leading-relaxed text-slate-600">
              No students have accepted your invitation yet, so there is nothing to show here.
              Invite your first students below — once they consent, their progress appears here.
            </p>
          ) : (
            <>
              <h2 className="text-lg font-bold text-brand-ink">
                {overview.totalConsented} student{overview.totalConsented === 1 ? "" : "s"} consented
              </h2>
              <div className="mt-4 grid gap-3">
                {overview.funnel.map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-baseline justify-between text-[0.85rem]">
                      <span className="font-semibold text-slate-700">{stat.label}</span>
                      <span className="text-slate-500">
                        {stat.count} / {stat.total}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-teal-deep"
                        style={{
                          width: `${stat.total === 0 ? 0 : Math.round((stat.count / stat.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {overview.skills.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-brand-ink">Cohort skill averages</h3>
                  <p className="mt-1 text-[0.8rem] text-slate-500">
                    Only shown once at least three students have a recorded score, so no single
                    student&apos;s result is ever visible on its own.
                  </p>
                  <div className="mt-3 grid gap-3">
                    {overview.skills.map((skill) => (
                      <div key={skill.id}>
                        <div className="flex items-baseline justify-between text-[0.85rem]">
                          <span className="font-semibold text-slate-700">{skill.name}</span>
                          <span className="text-slate-500">
                            {skill.averageScore} avg · {skill.studentsAssessed} assessed
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-teal-deep"
                            style={{ width: `${Math.min(100, Math.max(0, skill.averageScore))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="mb-10 rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-bold text-brand-ink">Invite students</h2>
        <p className="mt-1 text-[0.85rem] text-slate-600">
          One email per line or separated by commas. Each student decides for themselves whether
          to link their account — nothing of theirs is visible to you until they accept.
        </p>
        <form onSubmit={handleInvite} className="mt-4">
          <label htmlFor="invite-emails" className="sr-only">
            Student emails
          </label>
          <textarea
            id="invite-emails"
            value={emailsInput}
            disabled={busy}
            onChange={(e) => setEmailsInput(e.target.value)}
            placeholder="student.one@example.edu&#10;student.two@example.edu"
            className="min-h-[120px] w-full rounded-xl border border-slate-300 bg-white p-3 text-[0.9rem] outline-none focus-visible:border-brand-violet focus-visible:ring-2 focus-visible:ring-brand-violet/40"
          />
          <FormAlert message={error} className="mt-3" />
          <button
            type="submit"
            disabled={busy}
            className="mt-4 min-h-11 rounded-full bg-brand-violet px-5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-60"
          >
            {busy ? "Sending…" : "Invite students"}
          </button>
        </form>
        {inviteResults && (
          <ul className="mt-4 grid gap-1.5 text-[0.85rem]">
            {inviteResults.map((r) => (
              <li key={r.email} className="flex items-baseline justify-between gap-3">
                <span className="text-slate-700">{r.email}</span>
                <span className="text-slate-500">{RESULT_LABEL[r.result]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {roster && roster.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-brand-ink">Your roster</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[0.85rem]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-semibold">Email</th>
                  <th className="py-2 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Requested</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {roster.map((entry) => (
                  <tr key={entry.linkId} className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-700">{entry.email}</td>
                    <td className="py-2.5 text-slate-600">{STATUS_LABEL[entry.status]}</td>
                    <td className="py-2.5 text-slate-500">{entry.requestedAt.slice(0, 10)}</td>
                    <td className="py-2.5 text-right">
                      {(entry.status === "active" || entry.status === "pending") &&
                        !entry.linkId.startsWith("pending-") && (
                          <button
                            type="button"
                            onClick={() => setRevoking(entry)}
                            className="min-h-8 text-[0.8rem] font-semibold text-rose-700 underline underline-offset-2"
                          >
                            Revoke
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {revoking && (
        <ConfirmDialog
          title="Revoke this student's link?"
          body={`${revoking.email} will no longer be counted in your cohort, and you will lose access to their progress. They can be re-invited later.`}
          confirmLabel="Revoke"
          busy={revokeBusy}
          onConfirm={handleRevoke}
          onClose={() => setRevoking(null)}
        />
      )}
    </main>
  );
}
