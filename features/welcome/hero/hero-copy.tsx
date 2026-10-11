"use client";

import Link from "next/link";
import type { AudienceConfig } from "./config";
import s from "./welcome-hero.module.css";

// The words: eyebrow, headline, promise, and the one button. Keyed by
// audience by the caller, so a tab change replays the entrance rather than
// swapping text in place.

export function HeroCopy({
  config,
  onWatch,
}: {
  config: AudienceConfig;
  /** "Watch how it works": bring the film into view and start it. */
  onWatch: () => void;
}) {
  return (
    <div className={s.copy}>
      <p className={s.eyebrow}>{config.eyebrow}</p>
      <h1 className={s.headline}>
        {config.headline} <em>{config.accent}</em>
      </h1>
      <p className={s.body}>{config.body}</p>
      <div className={s.actions}>
        <Link href={config.cta.href} className={s.cta}>
          {config.cta.label}
          <span aria-hidden="true">→</span>
        </Link>
        <button type="button" className={s.watch} onClick={onWatch}>
          <span className={s.playMark} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          Watch how it works
        </button>
      </div>
    </div>
  );
}
