"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import styles from "./preview.module.css";

export function PreviewFrame({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  return <div className={styles.preview}>
    <div className={styles.previewBar}>
      <span><i /> Home preview <small>· Your saved activity</small></span>
      <div className={styles.switcher} role="group" aria-label="Preview width">
        <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Desktop</button>
        <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Mobile</button>
      </div>
      <Link href="/">Current home ↗</Link>
    </div>
    <div className={styles.canvas} data-mobile={mobile}>{children}</div>
  </div>;
}
