"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { checkJobFit, type JobFitCheck, type Opportunity } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SignUpPrompt, type GatedAction } from "@/components/auth/signup-gate";
import { ProfileFitReportView } from "./profile-fit-report";
import s from "./job-fit-studio.module.css";

export function JobFitStudio({ checks: initialChecks, signedOut = false, opportunity = null,
  opportunityId = null, listingError = null, initialCheckId = null }: {
  checks: JobFitCheck[]; signedOut?: boolean; opportunity?: Opportunity | null;
  opportunityId?: string | null; listingError?: string | null; initialCheckId?: string | null;
}) {
  const [checks, setChecks] = useState(initialChecks);
  const [selected, setSelected] = useState<JobFitCheck | null>(() => initialChecks.find(c => c.id === initialCheckId) ?? null);
  const [posting, setPosting] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<GatedAction | null>(null);
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnPath = selected ? `/job-fit?check=${encodeURIComponent(selected.id)}`
    : opportunityId ? `/job-fit?opportunity=${encodeURIComponent(opportunityId)}` : "/job-fit";
  const profileHref = `/profile?returnTo=${encodeURIComponent(returnPath)}`;

  async function compare(existing?: JobFitCheck) {
    if (inFlight.current) return;
    if (signedOut) { setGate({ what: "your profile fit for this job", why: "Sign in so we can compare this job with your own saved profile and resume. No practice or purchase is required." }); return; }
    const input = existing?.posting ? { checkId: existing.id } : opportunityId ? { opportunityId } : posting.trim();
    if (typeof input === "string" && input.length < 120) { setError("Include the responsibilities and requirements: at least 120 characters."); return; }
    inFlight.current = true; setBusy(true); setError(null);
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      if (!data.session) { setGate({ what: "your saved profile", why: "Your session expired. Sign in to return to this job and compare your profile." }); return; }
      const result = await checkJobFit(data.session.access_token, input);
      if (!result.ok) { setError(result.reason); return; }
      setChecks(list => [result.check, ...list.filter(c => c.id !== result.check.id)]);
      setSelected(result.check);
      window.history.replaceState(null, "", `/job-fit?check=${encodeURIComponent(result.check.id)}`);
      heading.current?.focus();
    } catch { setError("The comparison could not be completed. Your profile is safe; please try again."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  function openCheck(check: JobFitCheck) {
    setSelected(check); setError(null);
    window.history.replaceState(null, "", `/job-fit?check=${encodeURIComponent(check.id)}`);
    heading.current?.focus();
  }

  return <div className={s.shell}>
    {gate && <SignUpPrompt action={gate} onClose={() => setGate(null)} />}
    <div className={s.canvas}><main className={s.main}>
      <Link href="/opportunities" className={s.back}>← Job opportunities</Link>
      <header className={s.heading}><div><p className={s.eyebrow}>START WITH WHERE YOU ARE TODAY</p><h1 ref={heading} tabIndex={-1}>How does your profile fit this job?</h1><p>Compare your current skills, education and experience with the role. See your initial fit before deciding whether to prepare further.</p></div></header>
      {error && <p className={s.status} role="alert">{error}</p>}
      {busy && <p className={s.status} role="status" aria-live="polite">Comparing the job requirements with your current profile and resume…</p>}
      {selected ? <>
        <ProfileFitReportView check={selected} profileHref={profileHref} busy={busy} example={signedOut} onCompare={signedOut ? undefined : () => void compare(selected)} />
        <div className="mt-6"><Link className={s.secondary} href="/job-fit">Check another job</Link></div>
      </> : <div className={s.grid}>
        <section className={s.card}>
          {opportunityId ? <>
            <h2>{opportunity?.title ?? "Your selected job"}</h2>
            {listingError ? <p role="alert" className={s.status}>{listingError} <Link href="/job-fit">Paste a job description instead.</Link></p> : <>
              <p>{[opportunity?.company, opportunity?.location].filter(Boolean).join(" · ")}</p>
              <details className={s.details}><summary>View the job requirements</summary><p className="whitespace-pre-wrap">{opportunity?.description}</p><p className="whitespace-pre-wrap">{opportunity?.requirements}</p><p>{opportunity?.skills}</p><p>{opportunity?.experience}</p></details>
            </>}
          </> : <><h2>Start with a job you are considering.</h2><label className={s.field}><span>Job description</span><textarea value={posting} disabled={busy} onChange={e => setPosting(e.target.value)} placeholder="Paste the responsibilities, skills, education and experience requirements…" /></label></>}
          <p className={s.hint}>We use your saved profile and latest saved resume. Uploading a resume only adds suggestions until you confirm and save them.</p>
          <div className="flex flex-wrap gap-3"><button type="button" className={s.primary} disabled={busy || Boolean(listingError)} onClick={() => void compare()}>{busy ? "Comparing…" : "See my profile fit"}</button><Link className={s.secondary} href={profileHref}>Update profile or upload resume</Link></div>
        </section>
        <aside className="space-y-4"><section className={s.card}><h2>A starting point you can act on.</h2><p>See the requirements your profile supports, what is only partly supported, and what needs more information.</p><p>Then choose whether AI interview practice or an available job simulation would help. They are optional next steps.</p></section>
          {checks.length > 0 && <section className={s.card}><h3>{signedOut ? "See an example" : "Your saved comparisons"}</h3><div className={s.checks}>{checks.map(c => <button key={c.id} disabled={busy} onClick={() => openCheck(c)}><span><strong>{c.roleTitle}</strong><small>{signedOut ? "Illustrative example" : c.createdAt.slice(0, 10)}</small></span><b>{c.profileFit?.score ?? "—"}</b></button>)}</div></section>}
        </aside>
      </div>}
    </main></div>
  </div>;
}
