import Link from "next/link";
import type { JobFitCheck, ProfileFitRequirement } from "@/lib/api";
import s from "./job-fit-studio.module.css";

const LABELS: Record<ProfileFitRequirement["status"], string> = {
  supported: "Supported by your profile", partial: "Partly supported", not_evidenced: "Not evidenced yet", unreviewed: "Not compared yet",
};

export function ProfileFitReportView({ check, profileHref, onCompare, busy = false, example = false }: {
  check: JobFitCheck; profileHref: string; onCompare?: () => void; busy?: boolean; example?: boolean;
}) {
  const report = check.profileFit;
  if (!report) return <section className={s.card}>
    <h2>{check.roleTitle}</h2><p>This saved report used the earlier readiness method. Compare your current profile to get the new profile-fit score.</p>
    {onCompare && <button className={s.primary} disabled={busy || !check.posting} onClick={onCompare}>Compare my current profile</button>}
  </section>;
  return <div className="space-y-6">
    {example && <p className={s.exampleBanner}>Illustrative example — this is not your profile or your result.</p>}
    <section className={s.reportTop} aria-labelledby="profile-fit-title">
      <div><p className={s.eyebrow}>YOUR CURRENT PROFILE → THIS JOB</p><h2 id="profile-fit-title">{check.roleTitle}</h2><p>{report.summary}</p></div>
      <div className={s.reportMetric}><strong>{report.score === null ? "—" : report.score}{report.score !== null && <small> / 100</small>}</strong><span>{report.score === null ? "No score yet" : "Profile fit for this job"}</span></div>
    </section>
    <p className={s.notice}>{report.limitation}</p>
    {report.mode === "needs_profile" && <section className={s.card}><h3>Start with what you already bring.</h3><p>Upload your resume, confirm the extracted details, or add your current skills and education. No practice or interview is required for this comparison.</p><Link className={s.primary} href={profileHref}>Add my profile or resume</Link></section>}
    {report.mode === "analysis_unavailable" && <section className={s.card}><p role="status">The comparison is temporarily unavailable. The job checklist below is unreviewed, not a list of skills you lack.</p>{onCompare && <button className={s.primary} disabled={busy} onClick={onCompare}>{busy ? "Comparing…" : "Retry profile comparison"}</button>}</section>}
    <section className={s.card}>
      <h3>Why this score?</h3><p>{report.method}</p>
      <p><strong>{report.confidence === "medium" ? "Medium" : "Low"} confidence in the comparison.</strong> {report.confidenceReason}</p>
      <p className={s.hint}>Based on {report.sources.length} saved profile and resume sections{report.profileUpdatedAt ? `, last updated ${report.profileUpdatedAt.slice(0, 10)}` : ""}. Self-reported matches have not been tested in a simulation.</p>
    </section>
    <section aria-labelledby="requirements-title" className="space-y-3">
      <h2 id="requirements-title" className="text-xl font-bold text-brand-ink">Your strengths and gaps for this job</h2>
      {report.requirements.map((r, i) => <article key={`${i}-${r.need}`} className={s.card}>
        <div className={s.cardHead}><h3>{r.need}</h3><span className={`${s.chip} ${r.status === "supported" ? s.neutral : s.amber}`}>{LABELS[r.status]}</span></div>
        <p className={s.hint}>{r.category === "education" || r.category === "qualification" || r.category === "experience" ? "Check this eligibility requirement carefully. Practice does not replace the qualification or experience the employer asks for." : "A profile match describes your current record, not verified job performance."}</p>
        {r.facets.map((f, index) => <div className={s.perQuestion} key={index}><strong>{f.text}</strong>{f.quote ? <><blockquote>“{f.quote}”</blockquote><small>{f.sourceLabel} · self-reported</small></> : <p>No supporting detail was found. If you already have this experience or skill, add it to your profile.</p>}</div>)}
        {r.status !== "supported" && <Link className={s.secondary} href={profileHref}>Add evidence for: {r.need} →</Link>}
      </article>)}
    </section>
    {report.score !== null && <section className="space-y-3" aria-labelledby="preparation-title">
      <h2 id="preparation-title" className="text-xl font-bold text-brand-ink">Optional next steps</h2>
      <p>Your initial comparison is complete. Choose preparation that addresses your gaps; buying or completing a course does not change this score.</p>
      {report.recommendations.map(r => <article key={r.kind} className={s.card}><h3>{r.title}</h3><p>{r.reason}</p><Link className={s.secondary} href={r.kind === "profile" ? profileHref : r.href}>{r.title} →</Link></article>)}
    </section>}
    {onCompare && report.mode === "profile_comparison" && <div className={s.reportFoot}><p>Updated your profile? Compare it again whenever you want. Practice is optional.</p><button className={s.secondary} disabled={busy} onClick={onCompare}>{busy ? "Comparing…" : "Compare my updated profile"}</button></div>}
  </div>;
}
