"use client";

import Link from "next/link";
import { WelcomeAccountControls } from "@/features/shell";
import { AudienceSelector } from "./audience-selector";
import { HeroBenefits } from "./hero-benefits";
import { HeroCopy } from "./hero-copy";
import { HeroObject } from "./hero-object";
import { audienceConfig, type Audience } from "./config";
import s from "./welcome-hero.module.css";

// The front door's first screen: the header with the three audience tabs,
// and the hero the selected tab writes. One component, three states - the
// selected audience changes the words, button, benefits and glass artwork.

function BrandMark() {
  return (
    <Link href="/welcome" className={s.brand} aria-label="Ascend welcome">
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="welcome-mark" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7b5cf0" />
            <stop offset="55%" stopColor="#5b6ef5" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <path d="M6 41 L24 8 L42 41" stroke="url(#welcome-mark)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 41 L24 26 L32 41" stroke="url(#welcome-mark)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      </svg>
      <span>ASCEND</span>
    </Link>
  );
}

export function WelcomeHero({
  audience,
  initial,
  onChange,
  onWatch,
}: {
  audience: Audience;
  /** The audience whose principal image loads first. */
  initial: Audience;
  onChange: (next: Audience) => void;
  onWatch: () => void;
}) {
  const config = audienceConfig[audience];
  return (
    <div className={s.shell}>
      <header className={s.header}>
        <BrandMark />
        <AudienceSelector value={audience} onChange={onChange} />
        <div className={s.account}>
          <WelcomeAccountControls />
        </div>
      </header>

      <section
        id="welcome-hero-panel"
        role="tabpanel"
        aria-labelledby={`audience-tab-${audience}`}
        className={s.hero}
      >
        <div className={s.left}>
          {/* Keyed so a tab change replays the entrance. */}
          <div key={audience} className={s.enter}>
            <HeroCopy config={config} onWatch={onWatch} />
          </div>
          <div key={`${audience}-benefits`} className={`${s.enter} ${s.enterLate}`}>
            <HeroBenefits config={config} />
          </div>
        </div>
        <HeroObject active={audience} initial={initial} />
      </section>
      <div className={s.networkNote}>
        <span><strong>One network. Three perspectives.</strong> Students build capability. Colleges connect learning to work. Employers see the potential.</span>
        <a href="#what-is-ascend">Meet Ascend <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  );
}
