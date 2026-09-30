"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CareerProfile, JourneyState, HomeWorkItem } from "@/lib/api";
import { homePlan, pickupReason, progressOf, RememberHub } from "@/features/journey";
import { toFields } from "@/features/profile";
import { ArrowRight, Check, Spark } from "@/components/ui/icons";
import { Evidence, FocusPicker, JourneyMap, NextStep, Rail } from "./home-sections";
import s from "./home.module.css";

// The signed-in home, led by the student's goal rather than by our tools: what
// they came for, where they are on the way to it, the one next step and why,
// what their own marked work shows, what is left open, then the whole road
// with "You are here" on it.

function workStatus(item: HomeWorkItem) {
  return item.status === "follow_up" ? "Completed · follow-up" : item.status === "in_review" ? "In review" : "In progress";
}

export function StartRouter({
  initialState,
  profile = null,
  fallbackName = "",
}: {
  initialState: JourneyState | null;
  profile?: CareerProfile | null;
  fallbackName?: string;
}) {
  const router = useRouter();
  // Read once: the "New" tags expire by date.
  const [now] = useState(() => Date.now());
  const [changingFocus, setChangingFocus] = useState(false);
  const state = initialState;

  if (!state) {
    return <main className={s.home}><section className={s.next}>
      <h2>Your home is here.</h2><p className={s.nextWhy}>We couldn&rsquo;t load your saved activity.</p>
      <button type="button" className={s.nextCta} onClick={() => window.location.reload()}>Try again <ArrowRight size={16} /></button>
    </section></main>;
  }

  const plan = homePlan(state, now);
  const name = progressOf(state).name || toFields(profile).fullName || fallbackName;
  const firstName = name.split(" ")[0];
  const focusChosen = state.progress?.focus ?? null;
  const role = state.progress?.role?.title ?? null;
  const work = state.work?.slice(0, 4);

  return <main className={s.home}>
    <RememberHub path="/start" />

    {(!focusChosen || changingFocus) && <FocusPicker current={focusChosen} onDone={focusChosen ? () => setChangingFocus(false) : undefined} />}

    <section className={s.goal} aria-labelledby="goal">
      <div className={s.goalHead}>
        <div>
          <p className={s.eyebrow}>{firstName ? `WELCOME BACK, ${firstName.toUpperCase()}` : "WELCOME"}</p>
          <h1 id="goal">{plan.heading}</h1>
          <p className={s.subline}>{plan.subline}</p>
        </div>
        <div className={s.goalLinks}>
          {focusChosen && !changingFocus && <button type="button" className={s.linkButton} onClick={() => setChangingFocus(true)}>Change focus</button>}
          {role && <Link href="/discover" className={s.linkButton}>Change role</Link>}
        </div>
      </div>
      <Rail steps={plan.rail} />
    </section>

    <NextStep next={plan.next} />

    <Evidence evidence={state.evidence} modules={state.modules} />


    <section className={s.section} aria-labelledby="pickup">
      <div className={s.sectionHead}><h2 id="pickup">Pick up where you left off</h2></div>
      {work == null ? <div className={s.empty}><p>We couldn&rsquo;t check your latest records.</p><button type="button" className={s.linkButton} onClick={() => router.refresh()}>Try again</button></div>
        : work.length === 0 ? <div className={s.empty}><Spark size={20} /><p>Nothing open right now. Your drafts and follow-ups appear here.</p></div>
          : <div className={s.pickup}>{work.map(item => <Link key={item.id} href={item.action.href} className={s.pickupItem}>
            <span><b>{item.title}</b><small>{item.status === "follow_up" && <Check size={12} />}{workStatus(item)} · {pickupReason(item.reason)}</small></span>
            <span className={s.pickupAction}>{item.action.label}<ArrowRight size={14} /></span>
          </Link>)}</div>}
    </section>

    <JourneyMap stations={plan.stations} here={plan.here} />
  </main>;
}
