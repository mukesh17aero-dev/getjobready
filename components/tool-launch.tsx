"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./tool-hub.module.css";

/** Reveal only after an explicit tab activation, never on initial page load. */
export function ToolLaunch({ activation, children }: { activation: number; children: ReactNode }) {
  const target = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activation || !target.current) return;
    const region = target.current;
    const action = region.querySelector<HTMLAnchorElement>("a") ?? region;
    action.focus({ preventScroll: true });
    region.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [activation]);

  return <div ref={target} tabIndex={-1} className={styles.toolLaunch}>{children}</div>;
}
