"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";

// The slim ask, which arrives when the hero leaves.
//
// This is what lets the hero lose its button. The button used to sit in the
// first screen, which meant the people it was for pressed it there and the
// rest of the page was written for almost nobody. Moved to the end it would
// have cost the opposite mistake - somebody who arrived ready would have to
// scroll to act.
//
// So the ask is in two places and they are not the same ask: this strip, one
// line and a button, for anybody already convinced; and the full ask at the
// bottom for anybody who read. It appears the moment the hero scrolls out and
// stays for the rest of the page.
//
// A sentinel rather than a scroll listener: the browser tells us when the
// hero's foot crosses the header, which costs nothing and cannot drift.
export function StickyAsk({
  line,
  cta,
  href,
  /** The element to watch. Defaults to the hero's foot. */
  watch = "landing-hero-foot",
}: {
  line: string;
  cta: string;
  href: string;
  watch?: string;
}) {
  const [shown, setShown] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = document.getElementById(watch);
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setShown(!entry!.isIntersecting && entry!.boundingClientRect.top < 0),
      { rootMargin: "-56px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [watch]);

  return (
    <div
      ref={bar}
      className={`sticky top-14 z-30 border-b border-[var(--lp-border)] bg-[var(--lp-bg-a)]/95 backdrop-blur transition-[height,opacity] duration-300 motion-reduce:transition-none ${
        shown
          ? "h-14 opacity-100"
          : "pointer-events-none h-0 overflow-hidden opacity-0"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <p className="min-w-0 truncate text-[0.85rem] font-semibold text-[var(--lp-body-strong)]">
          {line}
        </p>
        <Link
          href={href}
          tabIndex={shown ? 0 : -1}
          aria-hidden={!shown}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-[var(--lp-cta-bg)] px-5 text-[0.82rem] font-bold text-[var(--lp-cta-ink)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hover:translate-y-0"
        >
          {cta}
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
