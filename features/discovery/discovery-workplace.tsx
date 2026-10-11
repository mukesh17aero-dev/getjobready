"use client";

import { useEffect, useRef, useState } from "react";
import { WorkplaceFallback } from "./workplace-fallback";
import type { RoleDetail } from "@/lib/api";
import "./discovery-modern.css";

/** The message the scene posts when it cannot draw, on any of its three failure paths. */
const TOUR_UNAVAILABLE = "ascend-tour-unavailable";

/**
 * A visual stage for published role content, with the same text available
 * outside WebGL. When the scene cannot draw, the stage is removed and the
 * text takes the full width: a review found half the panel blank on desktop
 * Chrome with "unavailable on this device" while the tour advanced beside it.
 */
export function DiscoveryWorkplace({ role, title }: { role: RoleDetail; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [stop, setStop] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  useEffect(() => {
    const listen = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if ((event.data as { type?: unknown } | null)?.type === TOUR_UNAVAILABLE) setSceneFailed(true);
    };
    window.addEventListener("message", listen);
    return () => window.removeEventListener("message", listen);
  }, []);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setPaused(preference.matches);
    change();
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);
  const send = () => {
    frame.current?.contentWindow?.postMessage({ type: "ascend-tour-stop", stop }, window.location.origin);
    frame.current?.contentWindow?.postMessage({ type: "ascend-tour-motion", paused }, window.location.origin);
  };
  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: "ascend-tour-stop", stop }, window.location.origin);
    frame.current?.contentWindow?.postMessage({ type: "ascend-tour-motion", paused }, window.location.origin);
  }, [stop, paused]);
  const content = encodeURIComponent(JSON.stringify({
    title, environment: role.workContext.environment, team: role.workContext.team,
    pace: role.workContext.pace, tasks: role.responsibilities.slice(0, 3), reality: role.hardTruths.slice(0, 3),
  }));
  const moments = [
    { label: "The workplace", title: "Step into the work.", text: role.workContext.environment, facts: [role.workContext.team, role.workContext.hours, role.workContext.pace] },
    { label: "A working day", title: "What lands on your desk?", text: role.pitch, facts: role.responsibilities },
    { label: "The role reality", title: "See the whole picture.", text: "What to expect on the job.", facts: role.hardTruths },
  ];
  const moment = moments[stop]!;
  return <section className="discovery-workplace" data-scene={sceneFailed ? "unavailable" : "ready"} aria-label={`${title} workplace tour`}>
    {!sceneFailed && <div className="discovery-workplace-stage">
      <iframe ref={frame} src={`/workplace-tour/scene.html#content=${content}`} title={`${title}: conceptual 3D workplace`} onLoad={send} tabIndex={-1} />
      <span className="discovery-workplace-caption">Illustrative workplace</span>
    </div>}
    {sceneFailed && <WorkplaceFallback stop={stop} title={title} />}
    <div className="discovery-workplace-copy">
      <button type="button" className="discovery-step" onClick={() => setSceneFailed(value => !value)}>{sceneFailed ? "Try 3D view" : "Use illustrated view"}</button>
      <nav aria-label="Workplace tour moments">{moments.map((item, index) => <button key={item.label} type="button" aria-pressed={index === stop} onClick={() => setStop(index)}>{item.label}</button>)}</nav>
      <div aria-live="polite"><p className="discovery-eyebrow">{title}</p><h2>{moment.title}</h2><p>{moment.text}</p><ul>{moment.facts.filter(Boolean).map((fact, i) => <li key={i}>{fact}</li>)}</ul></div>
      {stop < 2 && <button type="button" className="discovery-step" onClick={() => setStop(stop + 1)}>Step into {stop === 0 ? "the day" : "the role reality"} →</button>}
    </div>
  </section>;
}
