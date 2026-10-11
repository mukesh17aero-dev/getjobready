"use client";

import Link from "next/link";
import type { ResumeReview, ReviewNext } from "./resume-api";
import s from "./recruiter-review.module.css";

// The AI Recruiter Review: the key takeaways from a recruiter for the role,
// short - what they expect to see and whether it is there, what will stand
// out, what to remove - and then ONE next step, decided from what the person
// has actually done, never guessed:
//
//   no role on the resume  -> roles from our list worth exploring
//   readiness not done     -> find out where they stand in the role
//   no simulation yet      -> do the role's real work
//   both done              -> rehearse it in the AI interview

// Said the way a mentor would: where they are, and that it can move.
const LEVEL: Record<ResumeReview["standing"]["level"], string> = {
  early: "A good start - a few changes will get you noticed",
  competitive: "On track - ready to be considered",
  strong: "Ready to stand out",
};

export function RecruiterReview({ review, next, role }: { review: ResumeReview; next: ReviewNext | null; role: string }) {
  // Reviews saved before the checklist existed carry gaps instead.
  const expectations = review.expectations?.length ? review.expectations : review.gaps.map(gap => ({ what: gap.what, shown: false }));
  return (
    <div className={s.review}>
      <section className={s.verdict} aria-labelledby="verdict-title">
        <span className={s.label}>{role ? `A RECRUITER FOR ${role.toUpperCase()}` : "A RECRUITER"} WOULD SAY</span>
        <h2 id="verdict-title">{LEVEL[review.standing.level]}</h2>
        <p>{review.standing.why}</p>
      </section>

      <div className={s.takeaways}>
        <section className={s.card} aria-labelledby="expects-title">
          <h3 id="expects-title">What they expect to see</h3>
          <ul className={s.checklist}>{expectations.map(item => <li key={item.what} data-shown={item.shown || undefined}>
            <span className={s.mark} aria-hidden="true">{item.shown ? "✓" : "+"}</span>
            <span>{item.what}{item.shown ? <span className="sr-only"> - shown</span> : <span className={s.toAdd}> · to add</span>}</span>
          </li>)}</ul>
        </section>
        <section className={s.card} aria-labelledby="stand-title">
          <h3 id="stand-title">What will stand out</h3>
          <ul className={s.points}>{review.strengths.map(point => <li key={point}>{point}</li>)}</ul>
        </section>
        <section className={s.card} aria-labelledby="avoid-title">
          <h3 id="avoid-title">Small changes that will help</h3>
          {(review.redFlags?.length ?? 0) > 0
            ? <ul className={s.points}>{review.redFlags!.map(point => <li key={point}>{point}</li>)}</ul>
            : <p className={s.quiet}>Nothing to change here - nice work.</p>}
        </section>
      </div>

      <NextStep next={next} ideas={review.roleIdeas ?? []} role={role} />
      {review.fromRules && <p className={s.small}>The AI was unavailable, so this read came from the text alone.</p>}
    </div>
  );
}

function NextStep({ next, ideas, role }: { next: ReviewNext | null; ideas: ResumeReview["roleIdeas"]; role: string }) {
  if (!next || next.kind === "explore") {
    return <section className={s.next} aria-labelledby="next-title">
      <span className={s.label}>YOUR NEXT STEP</span>
      <h3 id="next-title">{ideas?.length ? role ? `Roles closest to ${role}` : "Roles your experience points to" : "Choose a role to aim this resume at"}</h3>
      {role && ideas && ideas.length > 0 && <p>{role} is not one of the roles you can practise here yet. These are the closest, and each has a readiness check and simulations.</p>}
      {ideas && ideas.length > 0 && <ul className={s.roles}>{ideas.map(idea => <li key={idea.role}>
        <div><strong>{idea.role}</strong><p>{idea.why}</p></div>
        <Link href={idea.roleId ? `/discover?role=${encodeURIComponent(idea.roleId)}` : "/discover"}>Explore this role →</Link>
      </li>)}</ul>}
      <p className={s.quiet}>A resume aimed at a role reads stronger to a recruiter.</p>
      {!ideas?.length && <Link className={s.primary} href="/discover">Explore roles →</Link>}
    </section>;
  }
  const step = {
    readiness: { title: `Find out where you stand as a ${next.roleTitle}`, why: "A short readiness check shows which of the role's skills you can already prove - the evidence a resume cannot give.", href: `/practice/readiness?role=${encodeURIComponent(next.roleId)}&begin=1`, cta: "Check my readiness" },
    simulation: { title: `Do the real work of a ${next.roleTitle}`, why: "A simulation gives you real work to point to, and a story to tell when they ask.", href: `/practice/missions?role=${encodeURIComponent(next.roleId)}`, cta: "Try a simulation" },
    interview: { title: `Practise the interview for ${next.roleTitle}`, why: "You have checked your readiness and done the work. Rehearse saying it out loud before the real one.", href: "/interview/practice", cta: "Start an AI interview" },
  }[next.kind];
  return <section className={s.next} aria-labelledby="next-title">
    <span className={s.label}>YOUR NEXT STEP</span>
    <h3 id="next-title">{step.title}</h3>
    <p>{step.why}</p>
    <Link className={s.primary} href={step.href}>{step.cta} →</Link>
  </section>;
}
