import Link from "next/link";
import { Check, Spark, ArrowRight } from "@/components/icons";
import type { AssessableRole } from "@/lib/api";
import type { ResumeReview } from "@/lib/resume-api";
import s from "./studio.module.css";
import f from "./feedback.module.css";

function sentence(text: string) {
  const first = text.match(/^.*?[.!?](?=\s|$)/)?.[0] || text;
  return first.length > 155 ? `${first.slice(0, 152).replace(/\s+\S*$/, "")}…` : first;
}
function matchingRole(roles: AssessableRole[], title: string) { return roles.find(role => role.roleTitle.trim().toLowerCase() === title.trim().toLowerCase()); }

export function ResumeFeedback({ review, role, roles, example, edited, onEdit, onExample }: {
  review?: ResumeReview; role: string; roles: AssessableRole[]; example: boolean; edited: boolean;
  onEdit: (request: string) => void; onExample: (kind: "targeted" | "general") => void;
}) {
  const currentReview = edited ? undefined : review;
  const covered = currentReview?.coverage.covered.length ?? 0;
  const missing = currentReview?.coverage.missing.length ?? 0;
  const total = covered + missing;
  const suggestions = !role ? currentReview?.roleIdeas?.slice(0, 3) ?? [] : [];
  const focusTitle = role || suggestions[0]?.role || "";
  const assessed = matchingRole(roles, focusTitle);
  const score = !example && typeof assessed?.lastReadiness === "number" && Number.isFinite(assessed.lastReadiness) && assessed.lastReadiness >= 0 && assessed.lastReadiness <= 100 ? assessed.lastReadiness : null;
  const focusHref = assessed?.hasAssessment ? `/practice/readiness?role=${encodeURIComponent(assessed.roleId)}` : "/discover";
  const nextLabel = assessed?.hasAssessment ? score !== null ? "Practise a role simulation" : "Check role readiness" : "Explore this role";

  return <div className={f.feedback}>
    <div className={f.demo}><span>{example ? "Illustrative feedback · example resume" : edited ? "Draft changed · saved feedback is out of date" : "Feedback from the selected saved version"}</span><div><button onClick={() => onExample("targeted")}>Targeted example</button><button onClick={() => onExample("general")}>General example</button></div></div>
    {!currentReview ? <section className={s.card}><span className={s.smallLabel}>YOUR NEXT STEP</span><h2 className={f.emptyTitle}>{edited ? "Refresh the feedback for this version." : "Let’s take a closer look at your draft."}</h2><p className={s.quiet}>No current AI review is available for this version. Explore an example above to see the proposed visual feedback.</p><div className={f.pendingSteps}><span>01 · Check the evidence</span><span>02 · Find the main gap</span><span>03 · Choose a useful next step</span></div><button className={s.secondary} onClick={() => onEdit("")}>Review my draft <ArrowRight size={15} /></button></section> : <>
      <div className={f.summaryGrid}>
        <section className={f.overview}><span className={s.smallLabel}>HOW YOUR RESUME READS</span><h2>{currentReview.standing.level === "strong" ? "A strong starting point." : currentReview.standing.level === "competitive" ? "A solid story to build on." : "Your story needs more evidence."}</h2><p>{sentence(currentReview.standing.why)}</p><div className={f.standing} role="img" aria-label={`Resume review standing: ${currentReview.standing.level}. This is not a readiness score.`}>{["early", "competitive", "strong"].map((level, i) => <span key={level} data-active={level === currentReview.standing.level}><i /><b>{["Developing", "Competitive", "Strong"][i]}</b></span>)}</div><small>Resume review · not a hiring probability</small></section>
        <section className={f.coverage}><div className={f.ring} role="img" aria-label={total ? `${covered} of ${total} reviewed role keywords appear in this resume; ${missing} are not shown.` : "No keyword coverage available"} style={{ background: total ? `conic-gradient(#629988 0deg ${covered / total * 360}deg, #e8dcf2 ${covered / total * 360}deg 360deg)` : "#e8e4ed" }}><span><b>{total ? `${covered}/${total}` : "—"}</b><small>shown</small></span></div><div><span className={s.smallLabel}>DOCUMENT COVERAGE</span><h2>{role ? "Words this role looks for" : "Signals in your resume"}</h2><p><i />{covered} shown <em />{missing} not shown</p><small>Presence of words, not demonstrated ability.</small></div></section>
        <section className={f.readiness}><span className={s.smallLabel}>ROLE READINESS</span><strong>{score !== null ? <>{score}<small>/100</small></> : "Not assessed"}</strong><p>{score !== null ? "From your latest saved role assessment." : "A short role assessment shows what you can do."}</p>{focusTitle && <b>{focusTitle}</b>}<small>{example ? "Example state · no personal score shown" : score !== null ? "Measured separately from this resume review" : "A resume match does not give a readiness score"}</small></section>
      </div>

      <div className={f.insights}><section className={`${s.card} ${f.working}`}><div className={s.sectionHeading}><h2><Check size={18} /> Keep these strengths</h2><span>{currentReview.strengths.length} found</span></div>{currentReview.strengths.slice(0, 3).map((point, i) => <p key={i}><span>0{i + 1}</span>{sentence(point)}</p>)}</section><section className={s.card}><div className={s.sectionHeading}><h2><Spark size={18} /> Improve this next</h2><span>{currentReview.gaps.length} suggestions</span></div>{currentReview.gaps.length ? currentReview.gaps.slice(0, 2).map((gap, i) => <div className={f.improvement} key={i}><span>{i === 0 ? "START HERE" : "THEN CONSIDER"}</span><h3>{gap.what}</h3><p>{sentence(gap.how)}</p><button onClick={() => onEdit(gap.how)}>Improve with Scribe <ArrowRight size={14} /></button></div>) : <p className={s.quiet}>No specific gaps were returned in this review.</p>}</section></div>

      {!role && <section className={f.roleIdeas}><div className={s.sectionHeading}><div><p className={s.eyebrow}>WHERE YOUR EXPERIENCE COULD FIT</p><h2>You have a story. Give it a direction.</h2></div><span>Suggested from this resume</span></div>{suggestions.length ? <div className={f.roleCards}>{suggestions.map((idea, i) => { const match = matchingRole(roles, idea.role); const readiness = match?.lastReadiness; const valid = !example && typeof readiness === "number" && Number.isFinite(readiness) && readiness >= 0 && readiness <= 100; return <article key={idea.role}><span className={f.roleNumber}>0{i + 1}</span><h3>{idea.role}</h3><p>{sentence(idea.why)}</p><div className={f.roleReadiness}><span>Role readiness</span><b>{valid ? `${readiness}/100 · saved assessment` : "Not assessed"}</b></div><Link href={match?.hasAssessment ? `/practice/readiness?role=${encodeURIComponent(match.roleId)}` : "/discover"}>{match?.hasAssessment ? "Check role readiness" : "Explore role & readiness"}<ArrowRight size={14} /></Link></article>; })}</div> : <p className={s.quiet}>This review did not suggest a matching role. Explore roles to find a direction before taking a role-specific readiness check.</p>}<small>Role suggestions reflect your resume; they do not confirm your skills or job readiness.</small></section>}

      <section className={f.nextAction}><span className={f.nextIcon}><Spark size={22} /></span><div><span className={s.smallLabel}>TURN YOUR STORY INTO SOMETHING YOU CAN SHOW</span><h2>{focusTitle ? `Try the work of a ${focusTitle}.` : "Find a role you want to prepare for."}</h2><p>{!role && suggestions[0] ? sentence(suggestions[0].why) : "Try a real work situation to see which skills you can demonstrate."}</p></div><Link className={s.primary} href={focusHref}>{focusTitle ? nextLabel : "Explore career roles"}<ArrowRight size={16} /></Link></section>

      <details className={f.fullReview}><summary>See the evidence and full feedback <span>+</span></summary><p>{currentReview.standing.why}</p><h3>Strengths</h3><ul>{currentReview.strengths.map((point, i) => <li key={i}>{point}</li>)}</ul><h3>Improvements</h3>{currentReview.gaps.map((gap, i) => <p key={i}><b>{gap.what}</b> — {gap.how}</p>)}<h3>Words present</h3><p>{currentReview.coverage.covered.join(" · ") || "None reported"}</p><h3>Not yet shown</h3><p>{currentReview.coverage.missing.join(" · ") || "None reported"}</p></details>
    </>}
  </div>;
}
