"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CareerProfile, JourneyState } from "@/lib/api";
import { homePlan, nextStep, progressOf, RememberHub, ServiceEntry } from "@/features/journey";
import { toFields } from "@/features/profile";
import { JourneyMap } from "./home-sections";
import s from "./reference-home.module.css";

export function StartRouter({ initialState: state, profile = null, fallbackName = "" }: {
  initialState: JourneyState | null; profile?: CareerProfile | null; fallbackName?: string;
}) {
  const [now] = useState(() => Date.now());
  const [pathOpen, setPathOpen] = useState(false);
  useEffect(() => {
    if (pathOpen) document.getElementById("full-path")?.scrollIntoView();
  }, [pathOpen]);
  if (!state) return <main className={s.home}><h1>Your home is here.</h1><p>We couldn’t load your saved activity.</p><button className={s.primary} onClick={() => window.location.reload()}>Try again</button></main>;
  const name = (progressOf(state).name || toFields(profile).fullName || fallbackName).split(" ")[0];
  const role = state.progress?.role;
  const step = nextStep(state);
  const plan = homePlan(state, now);
  const assessments = state.evidence?.readiness.filter(item => item.roleId === role?.id).length ?? 0;
  const availability = role && state.practiceRoles ? state.practiceRoles.includes(role.id) : null;
  return <main className={s.home}>
    <RememberHub path="/start" />
    <header className={s.heading}><p>{name ? `WELCOME BACK, ${name.toUpperCase()}` : "WELCOME TO ASCEND"}</p><h1>A small step toward your next role.</h1><span>Choose what works for you today. Your progress will be here when you return.</span></header>
    <div className={s.overview}>
      <section className={s.next} data-focal-panel aria-labelledby="next-step"><span className={s.badge}>RECOMMENDED NEXT STEP</span><h2 id="next-step">{step.title}</h2><p>{step.stake}<br />{step.because}</p><small>About {step.minutes} min</small><div className={s.actions}><Link className={s.primary} href={step.href}>{step.action} →</Link></div></section>
      <aside className={s.direction}><h2>Your direction</h2><h3>{role?.title ?? "Still exploring"}</h3><p>{role ? "Role chosen" : "Choose a role when you’re ready."}<br />{assessments ? `${assessments === 1 ? "One skills check" : `${assessments} skills checks`} completed` : "No skills check completed yet."}</p><div className={s.availability}><p>{availability === false ? "Role missions are not available yet. You can preview another role without changing your direction." : availability ? "Your role has practice available. Try a task and learn from the feedback." : "See available practice before choosing what to try next."}</p><Link href={role ? `/practice?role=${encodeURIComponent(role.id)}` : "/practice"}>See available practice →</Link></div></aside>
    </div>
    <div className={s.routes}><ServiceEntry initialTrack={state.progress?.track} role={role} heading="Keep moving, your way" onFollowPath={() => setPathOpen(open => !open)} pathOpen={pathOpen} /></div>
    <section id="full-path" className={s.preparation} hidden={!pathOpen}>{pathOpen && <JourneyMap stations={plan.stations} here={plan.here} />}</section>
  </main>;
}
