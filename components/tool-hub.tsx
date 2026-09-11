"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ToolLaunch } from "@/components/tool-launch";
import { RememberHub } from "@/components/remember-hub";
import { ArrowRight, Check, Spark } from "@/components/icons";
import styles from "./tool-hub.module.css";

// A hub in the shape of Professional Presence: one tool in view at a time,
// its status under the tab, what you have saved for it (or what you would
// create) on the left, and beside it the reason to open it now - why it
// matters, what you leave with, and one primary action.
//
// The three hubs (Professional Presence, Interview practice, Practice the
// role) read the same way so that "where am I with this" is answered the
// same way on every one of them.

export type HubTool = {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  /** One or two words under the tab name: "Saved", "In progress", "Example", "Coming soon". */
  status: string;
  outcome: string;
  intro: string;
  why: string;
  /** What is on the left: their saved work, or an honest picture of what the tool makes. */
  artifact: ReactNode;
  /** The label above the artifact. */
  artifactLabel: string;
  leaveWith: string;
  /** Null when the tool is not open yet. */
  action: { href: string; label: string } | null;
  secondary?: { href: string; label: string };
  points: string[];
  steps: string[];
};

export function ToolHub({ path, eyebrow, title, accent, intro, role, roleHref, roleLabel, tools, initial }: {
  path: string; eyebrow?: string; title: string; accent: string; intro: string;
  role: string | null; roleHref: string; roleLabel: string;
  tools: HubTool[]; initial?: string;
}) {
  const [selected, setSelected] = useState(() => tools.find(t => t.id === initial)?.id ?? tools[0]!.id);
  const [activation, setActivation] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const tool = tools.find(t => t.id === selected) ?? tools[0]!;
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tools.length - 1 : (index + (event.key === "ArrowRight" ? 1 : tools.length - 1)) % tools.length;
    setSelected(tools[next]!.id); tabs.current[next]?.focus();
  }

  return <div className={styles.shell}>
    <div className={styles.canvas}>
      <main className={styles.main}>
        <RememberHub path={path} />
        <Link className={styles.back} href="/">← Home</Link>
        <header className={styles.header}><div>{eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}<h1>{title} <span>{accent}</span></h1><p>{intro}</p></div><div className={styles.role}><span className={styles.roleIcon}><Spark size={20} /></span><div><small>YOUR CHOSEN ROLE</small><strong>{role ?? "Still exploring"}</strong><Link href={roleHref}>{roleLabel} <ArrowRight size={13} /></Link></div></div></header>

        <div className={styles.tabs} data-layout="compact" role="tablist" aria-label="Tools">{tools.map((item, index) => <button key={item.id} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={`hub-tab-${item.id}`} aria-selected={selected === item.id} aria-controls="hub-panel" tabIndex={selected === item.id ? 0 : -1} onClick={() => { setSelected(item.id); setActivation(value => value + 1); }} onKeyDown={event => onTabKey(event, index)} className={styles.tab} data-kind={index === 0 ? "resume" : index === 1 ? "linkedin" : "fit"}>
          <span className={styles.toolIcon}>{item.icon}</span><span className={styles.tabCopy}><strong className={styles.desktopTitle}>{item.title}</strong><strong className={styles.mobileTitle}>{item.title}</strong><small>{item.subtitle}</small><span className={styles.tabStatus}>{item.status}</span></span><ArrowRight className={styles.tabArrow} size={17} />
        </button>)}</div>

        <section id="hub-panel" role="tabpanel" aria-labelledby={`hub-tab-${selected}`} tabIndex={0} className={styles.panel}>
          <div className={styles.artifact}>
            <div className={styles.artifactScroll} tabIndex={0} aria-label={tool.artifactLabel}>{tool.artifact}</div>
          </div>
          <div className={styles.guidance}><span className={styles.guidanceLabel}><Spark size={15} />MAKE YOUR NEXT MOVE</span><h2>{tool.outcome}</h2><p className={styles.intro}>{tool.intro}</p>
            <ToolLaunch activation={activation}>
              {tool.action ? <Link href={tool.action.href} className={styles.primary}>{tool.action.label}<ArrowRight size={17} /></Link> : <span className={styles.comingSoon}>Still under development. It opens here when it is ready.</span>}
            </ToolLaunch>
            <div className={styles.why}><span>WHY THIS MATTERS</span><p>{tool.why}</p></div>
            <div className={styles.reason}><span>What you&apos;ll leave with</span><p>{tool.leaveWith}</p></div>
            {tool.secondary && <Link className={styles.secondary} href={tool.secondary.href}>{tool.secondary.label} <ArrowRight size={13} /></Link>}
            <ul className={styles.benefits}>{tool.points.map(point => <li key={point}><Check size={14} />{point}</li>)}</ul>
            <details className={styles.how} key={selected}><summary>How this tool works <span>+</span></summary><ol>{tool.steps.map(step => <li key={step}>{step}</li>)}</ol></details>
          </div>
        </section>
        <footer className={styles.record}><Link href="/profile">Review your profile <ArrowRight size={14} /></Link></footer>
      </main>
    </div>
  </div>;
}

