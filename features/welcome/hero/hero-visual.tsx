import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import type { Audience } from "./config";
import s from "./glass-artwork.module.css";

function PlateMark() {
  return <svg viewBox="0 0 48 48" className={s.plateMark} fill="none" aria-hidden="true"><path d="M6 41 24 8 42 41M16 41 24 26 32 41" stroke="currentColor" strokeWidth="3.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

const LAYERS = [
  { title: "Match", detail: "Prepare for opportunity" },
  { title: "Prove", detail: "See your strengths & gaps" },
  { title: "Practise", detail: "Try the work for yourself" },
  { title: "Learn", detail: "Find a role that fits" },
];

/** Rendered glass, native text and a shared geometric transition.
 * The transition connects compositions; the raster assets are not 3D meshes. */
export function HeroVisual({ active, initial, running }: { active: Audience; initial: Audience; running: boolean }) {
  const [transition, setTransition] = useState<{ to: Audience; from: Audience | null; serial: number }>({ to: active, from: null, serial: 0 });
  // Retain the outgoing composition for one complete transition, including
  // rapid tab changes. A fresh serial restarts the bridge in either direction.
  if (transition.to !== active) {
    setTransition({ to: active, from: transition.to, serial: transition.serial + 1 });
  }
  useEffect(() => {
    if (!transition.from) return;
    const timer = window.setTimeout(() => setTransition(current => ({ ...current, from: null })), 900);
    return () => window.clearTimeout(timer);
  }, [transition.serial, transition.from]);
  const phase = (audience: Audience) => audience === active ? (transition.from ? "entering" : "active") : audience === transition.from ? "exiting" : "hidden";

  return (
    <div className={s.artwork} data-running={running} data-transitioning={!!transition.from}>
      {transition.from && <div key={transition.serial} className={s.bridge} aria-hidden="true">
        <svg viewBox="0 0 400 400" fill="none">
          {[0, 1, 2, 3].map(i => <rect key={i} x="86" y="86" width="228" height="228" rx="18" className={s.bridgeStrand} style={{ "--strand": i, "--strand-color": ["#93d6ff", "#5eead4", "#a99ff6", "#f7c47c"][i] } as CSSProperties} />)}
        </svg>
      </div>}
      <div className={s.floor} aria-hidden="true" />
      <div key={`student-${transition.serial}`} className={s.scene} data-scene="student" data-phase={phase("student")} data-active={active === "student"} aria-hidden={active !== "student"}>
        <div className={s.student}>
          {[3,2,1,0].map(layer => <div className={s.layerEntry} key={layer} style={{ "--layer": layer, "--arrive-x": `${layer % 2 ? -13 : 13}%`, zIndex: 5-layer } as CSSProperties}>
            <div className={s.layerBody} data-layer={layer}>
              <Image src="/welcome/glass/plate-v1.png" alt="" fill sizes="(max-width: 760px) 440px, 720px" preload={initial === "student" && layer === 0} className={s.plateImage} />
              {layer === 0 && <PlateMark />}
              <div className={s.plateLabel}><strong>{LAYERS[layer].title}</strong><span>{LAYERS[layer].detail}</span></div>
              <div className={s.layerSignal} />
            </div>
          </div>)}
        </div>
      </div>
      <div key={`college-${transition.serial}`} className={s.scene} data-scene="college" data-phase={phase("college")} data-active={active === "college"} aria-hidden={active !== "college"}>
        <div className={s.ribbonFloat}>
          <Image src="/welcome/glass/ribbon-v1.png" alt="" fill sizes="(max-width: 760px) 440px, 760px" preload={initial === "college"} className={s.ribbonImage} />
          <svg aria-hidden="true" viewBox="0 0 500 500" className={s.ribbonSignals} fill="none">
            <path d="M140 115C360 15 475 230 340 375S60 305 140 115Z" pathLength="100" />
            <path d="M140 115C360 15 475 230 340 375S60 305 140 115Z" pathLength="100" />
          </svg>
        </div>
      </div>
      <div key={`employer-${transition.serial}`} className={s.scene} data-scene="employer" data-phase={phase("employer")} data-active={active === "employer"} aria-hidden={active !== "employer"}>
        <div className={s.employer}>
          <svg aria-hidden="true" viewBox="0 0 500 500" className={s.orbitLines} fill="none">
            <ellipse cx="250" cy="250" rx="220" ry="144" transform="rotate(-18 250 250)" />
            <ellipse cx="250" cy="250" rx="200" ry="188" transform="rotate(28 250 250)" />
            <path d="M70 292 250 250 406 154" className={s.matchSignal} />
          </svg>
          <div className={s.core}>
            <Image src="/welcome/glass/core-v1.png" alt="" fill sizes="(max-width: 760px) 280px, 420px" preload={initial === "employer"} />
          </div>
          {[0,1,2,3,4].map(i => <div className={s.satellite} key={i} style={{ "--node": i, "--delay": `${-i*6.4}s`, "--hue": `${[0,125,-25,55,180][i]}deg` } as CSSProperties}>
            <div className={s.nodeBody}><Image src="/welcome/glass/node-v1.png" alt="" fill sizes="180px" /></div>
          </div>)}
        </div>
      </div>
    </div>
  );
}
