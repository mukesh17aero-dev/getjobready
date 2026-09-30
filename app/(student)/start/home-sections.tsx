"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomeEvidence, HomeFocus, JourneyState } from "@/lib/api";
import { setJourneyFocus } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { FOCUS_OPTIONS, type HomePlan, type HomeTool, type RailStep, type ToolGroup } from "@/features/journey";
import { ArrowRight, Check } from "@/components/ui/icons";
import s from "./home.module.css";

export function Rail({ steps }: { steps: RailStep[] }) {
  return (
    <ol className={s.rail} aria-label="Your progress" style={{ "--steps": steps.length } as React.CSSProperties}>
      {steps.map((step) => (
        <li key={step.label} data-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
          <span className={s.railMark} aria-hidden="true">{step.state === "done" ? <Check size={14} /> : step.state === "current" ? <i /> : null}</span>
          <b>{step.label}</b>
          <small>{step.note}{step.state === "done" && <span className="sr-only"> (done)</span>}</small>
        </li>
      ))}
    </ol>
  );
}

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

function Sparkline({ scores }: { scores: number[] }) {
  const w = 240, h = 52, pad = 6;
  const x = (i: number) => (scores.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (scores.length - 1));
  const y = (v: number) => h - pad - (v / 100) * (h - pad * 2);
  const points = scores.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={s.spark} aria-hidden="true">
      {scores.length > 1 && <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      <circle cx={x(scores.length - 1)} cy={y(scores[scores.length - 1]!)} r="5" fill="currentColor" />
    </svg>
  );
}

export function Evidence({ evidence, modules }: { evidence: HomeEvidence | null | undefined; modules: JourneyState["modules"] }) {
  const scores = evidence?.readiness.map((r) => r.score) ?? [];
  const interview = evidence?.interview ?? null;
  const m = modules ?? {};
  const docs = [
    m.jobFit && { label: m.jobFit === "done" ? "Job fit check done" : "Job fit check started", done: m.jobFit === "done" },
    m.resume && { label: m.resume === "done" ? "Resume downloaded" : "Resume · draft saved", done: m.resume === "done" },
    m.linkedin && { label: m.linkedin === "done" ? "LinkedIn profile kept" : "LinkedIn profile · in review", done: m.linkedin === "done" },
  ].filter((d): d is { label: string; done: boolean } => Boolean(d));
  if (scores.length === 0 && !interview && docs.length === 0) return null;
  const latest = scores[scores.length - 1];
  const change = scores.length > 1 ? latest! - scores[0]! : null;
  return (
    <section className={s.section} aria-labelledby="shown">
      <div className={s.sectionHead}><h2 id="shown">What you have shown so far</h2><span>From your own marked work. Nothing here is estimated.</span></div>
      <div className={s.evidence}>
        {latest !== undefined && (
          <article>
            <p className={s.label}>READINESS</p>
            <p className={s.figure}><strong>{latest}</strong><span>/ 100 · latest sitting</span></p>
            <Sparkline scores={scores} />
            <p className={s.small}>{change === null ? "One sitting so far." : `${change >= 0 ? "+" : ""}${change} since your first sitting.`} <Link href="/practice/readiness/results">See your reports</Link></p>
          </article>
        )}
        {interview && (
          <article>
            <p className={s.label}>INTERVIEW</p>
            <p className={s.figure}><strong>{interview.mark}</strong><span>/ 100 · last rehearsal</span></p>
            <div className={s.meter} role="img" aria-label={`Mark ${interview.mark} against a bar of ${interview.bar}`}>
              <span style={{ width: `${Math.min(100, interview.mark)}%` }} data-cleared={interview.mark >= interview.bar} />
              <i style={{ left: `${Math.min(100, interview.bar)}%` }} />
            </div>
            <p className={s.small}>Bar for an answer that holds up: {interview.bar}. {interview.mark >= interview.bar ? "Cleared." : "Not cleared yet."}</p>
          </article>
        )}
        {docs.length > 0 && (
          <article>
            <p className={s.label}>YOUR DOCUMENTS</p>
            <ul className={s.docs}>{docs.map((d) => <li key={d.label} data-done={d.done}><span aria-hidden="true">{d.done && <Check size={12} />}</span>{d.label}</li>)}</ul>
          </article>
        )}
      </div>
    </section>
  );
}

function ToolLink({ tool }: { tool: HomeTool }) {
  return (
    <Link href={tool.href} className={s.tool} data-status={tool.status}>
      {tool.status === "done" && <Check size={13} />}
      {tool.label}
      {tool.note && <span className={s.toolNote}>· {tool.note}</span>}
      {tool.isNew && !tool.status && <span className={s.newTag}>New</span>}
      {tool.status && <span className="sr-only">{tool.status === "done" ? " (done)" : " (in progress)"}</span>}
    </Link>
  );
}

export function Tools({ groups, also }: { groups: ToolGroup[]; also: ToolGroup[] }) {
  return (
    <section className={s.section} aria-labelledby="tools">
      <div className={s.sectionHead}><h2 id="tools">Everything you can use</h2></div>
      <div className={s.tools} data-count={groups.length}>
        {groups.map((g) => (
          <div key={g.id} className={s.toolGroup}><h3>{g.title}</h3>{g.tools.map((t) => <ToolLink key={t.label} tool={t} />)}</div>
        ))}
      </div>
      {also.length > 0 && (
        <div className={s.also}>
          <h3>Also available</h3>
          <div>{also.flatMap((g) => g.tools).map((t) => <ToolLink key={t.label} tool={t} />)}</div>
        </div>
      )}
    </section>
  );
}

/** "What brings you to Ascend?" - asked once, changeable any time. */
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
      <h2 id="focus-q">What brings you to Ascend?</h2>
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
