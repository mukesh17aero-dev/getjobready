"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Audience } from "./config";
import { HeroVisual } from "./hero-visual";
import s from "./welcome-hero.module.css";

const CAPTIONS: Record<Audience, { title: string; description: string; steps: string[] }> = {
  student: { title: "Potential, built into capability.", description: "Every layer brings you closer to the work you want to do.", steps: ["Learn", "Practise", "Prove", "Match"] },
  college: { title: "A continuous connection to industry.", description: "Industry needs inform preparation. Outcomes guide what comes next.", steps: ["Industry needs", "Preparation", "Feedback"] },
  employer: { title: "The right capability. The right work.", description: "A vision for connecting demonstrated skills with opportunity.", steps: ["Role needs", "Proven skills", "A better match"] },
};

const LABELS: Record<Audience, { heading: string; motion: string; items: [string, string, string][] }> = {
  student: { heading: "Build your capability", motion: "One step builds on the next", items: [["Learn", "Find a role that fits", "#f7c47c"], ["Practise", "Try the work for yourself", "#a99ff6"], ["Prove", "See your strengths & gaps", "#5eead4"], ["Match", "Prepare for opportunity", "#93d6ff"]] },
  college: { heading: "Continuous alignment", motion: "An ongoing feedback loop", items: [["Industry needs", "Know what work asks for", "#93d6ff"], ["Student readiness", "Focus your preparation", "#5eead4"], ["Employer feedback", "Improve the next cycle", "#f7c47c"]] },
  employer: { heading: "Capability meets opportunity", motion: "A vision for better matching", items: [["Role requirements", "Start with the actual work", "#93d6ff"], ["Capability profiles", "Look beyond a resume", "#f7c47c"], ["A better match", "Connect skills to the role", "#5eead4"]] },
};

export function HeroObject({ active, initial }: { active: Audience; initial: Audience }) {
  const stage = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const caption = CAPTIONS[active];
  const labels = LABELS[active];

  useEffect(() => {
    const node=stage.current;
    if (!node) return;
    const observer=new IntersectionObserver(entries => setInView(entries.some(entry => entry.isIntersecting)));
    const visibility=() => setPageVisible(!document.hidden);
    observer.observe(node);
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  const running=!paused && inView && pageVisible;

  return (
    <figure className={s.object} data-paused={!running}>
      <div ref={stage} className={s.objectStage}>
        <div className={s.visualHeading}><span>{labels.heading}</span><span>{labels.motion}</span></div>
        <HeroVisual active={active} initial={initial} running={running} />
        {active !== "student" && <ul className={s.sceneLabels} data-audience={active} aria-label={labels.heading} key={active}>
          {labels.items.map(([title, detail, signal], i) => <li key={title} style={{ "--i": i, "--signal": signal } as CSSProperties}><strong>{title}</strong><small>{detail}</small></li>)}
        </ul>}
      </div>
      <figcaption className={s.objectCaption}>
        <div className={s.objectSteps} aria-label="The Ascend vision">
          {caption.steps.map((step, i) => <span key={step}>{i > 0 && <i aria-hidden="true">/</i>}{step}</span>)}
        </div>
        <strong>{caption.title}</strong>
        <p>{caption.description}</p>
      </figcaption>
      <button type="button" className={s.motionControl} aria-label={paused ? "Play object animation" : "Pause object animation"} aria-pressed={paused} onClick={() => setPaused(!paused)}>
        <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span><span>{paused ? "Play motion" : "Pause motion"}</span>
      </button>
    </figure>
  );
}
