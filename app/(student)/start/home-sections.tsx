"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomeFocus } from "@/lib/api";
import { setJourneyFocus } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { FOCUS_OPTIONS, type HomePlan, type HomeTool, type MapStop } from "@/features/journey";
import { ArrowRight, Check, Eye, Mic, Pencil, Ranking, Spark } from "@/components/ui/icons";
import s from "./home.module.css";

export function NextStep({ next }: { next: HomePlan["next"] }) {
  return (
    <section className={s.next} aria-labelledby="next-step">
      <p className={s.nextEyebrow}>{next.eyebrow}</p>
      <h2 id="next-step">{next.title}</h2>
      <p className={s.nextWhy}><b>Why now: </b>{next.why}</p>
      <p className={s.nextMeta}>{next.meta.join(" · ")}</p>
      <Link href={next.href} className={s.nextCta}>{next.cta}<ArrowRight size={18} /></Link>
    </section>
  );
}

function ToolTile({ tool }: { tool: HomeTool }) {
  const chip = tool.status === "done" ? "Done" : tool.status === "in_progress" ? (tool.note ? tool.note[0]!.toUpperCase() + tool.note.slice(1) : "In progress") : tool.isNew ? "New" : null;
  return (
    <Link href={tool.href} className={s.tile} data-status={tool.status} data-new={tool.isNew && !tool.status ? true : undefined}>
      <span className={s.tileHead}>
        <b>{tool.label}</b>
        {chip && <span className={s.chip}>{tool.status === "done" && <Check size={11} />}{chip}</span>}
      </span>
      <span className={s.tileBlurb}>{tool.blurb}</span>
      <span className={s.tileGo} aria-hidden="true">{tool.status === "done" ? "Open again" : tool.status === "in_progress" ? "Continue" : "Open"}<ArrowRight size={13} /></span>
    </Link>
  );
}

const STATION_ICON: Record<MapStop["id"], (p: { size?: number }) => React.ReactElement> = { explore: Eye, readiness: Ranking, presence: Pencil, interview: Mic };

/** Every area of Ascend as one road, from choosing a role to the job, with "You are here" on it. */
export function JourneyMap({ stations, here }: { stations: MapStop[]; here: MapStop["id"] }) {
  return (
    <section className={`${s.section} ${s.journeyMap}`} aria-labelledby="map">
      <div className={s.sectionHead}>
        <h2 id="map">Your preparation path</h2>
        <span>Explore, practise, prepare your application and rehearse. Start where it helps you most.</span>
      </div>
      <ol className={s.map}>
        {stations.map((st, i) => {
          const Icon = STATION_ICON[st.id];
          const isHere = st.id === here;
          const done = st.tools.filter((t) => t.status === "done").length;
          return (
            <li key={st.id} className={s.stop} data-here={isHere || undefined} data-done={done > 0 && !isHere ? true : undefined} data-later={!st.inFocus || undefined} style={{ "--i": i } as React.CSSProperties} aria-current={isHere ? "step" : undefined}>
              <span className={s.node} aria-hidden="true">{done > 0 && !isHere ? <Check size={16} /> : i + 1}</span>
              <article className={s.stopCard}>
                <header className={s.stopHead}>
                  <span className={s.stopIcon} aria-hidden="true"><Icon size={22} /></span>
                  <span className={s.stopTitle}>
                    <small>STOP {i + 1}{!st.inFocus && " · WHEN YOU NEED IT"}</small>
                    <h3>{st.title}</h3>
                  </span>
                  {isHere ? <span className={s.here}>You are here</span> : done > 0 && <span className={s.stopCount}><Check size={12} />{done} done</span>}
                </header>
                <p className={s.payoff}>{st.payoff}</p>
                <div className={s.tiles}>{st.tools.map((t) => <ToolTile key={t.label} tool={t} />)}</div>
              </article>
            </li>
          );
        })}
        <li className={s.stop} data-goal style={{ "--i": stations.length } as React.CSSProperties}>
          <span className={s.node} aria-hidden="true"><Spark size={16} /></span>
          <article className={s.goalCard}>
            <h3>Take your next step</h3>
            <p>Bring evidence of your work, an application you can explain and answers you have practised.</p>
          </article>
        </li>
      </ol>
    </section>
  );
}

/** "What would you like to work on today?" - asked once, changeable any time. */
export function FocusPicker({ current, onDone }: { current: HomeFocus | null; onDone?: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState<HomeFocus | null>(null);
  const [failed, setFailed] = useState(false);
  async function pick(focus: HomeFocus) {
    setSaving(focus);
    setFailed(false);
    const { data } = await supabaseBrowser().auth.getSession();
    const ok = data.session ? await setJourneyFocus(data.session.access_token, focus) : false;
    setSaving(null);
    if (!ok) { setFailed(true); return; }
    onDone?.();
    router.refresh();
  }
  return (
    <section className={s.focus} aria-labelledby="focus-q">
      <h2 id="focus-q">What would you like to work on today?</h2>
      <p>Your home page leads with it. You can change it any time.</p>
      <div className={s.focusOptions}>
        {FOCUS_OPTIONS.map((o) => (
          <button key={o.id} type="button" disabled={saving !== null} aria-pressed={current === o.id} onClick={() => void pick(o.id)}>
            <b>{saving === o.id ? "Saving…" : o.label}</b><small>{o.detail}</small>
          </button>
        ))}
      </div>
      {failed && <p role="alert" className={s.focusError}>That did not save. Check your connection and try again.</p>}
      {current && onDone && <button type="button" className={s.linkButton} onClick={onDone}>Keep my current focus</button>}
    </section>
  );
}
