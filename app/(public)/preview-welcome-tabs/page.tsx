"use client";

import { useState } from "react";
import { ArrowRight } from "@/components/icons";

// Temporary preview: the chosen direction for the welcome screen — the whole
// hero belongs to the selected audience, with the tab row centred in the
// middle of the screen rather than sitting in the eyebrow slot.
//
// One design, shown at full height so it reads the way it will on a laptop.
// Switch audience and the headline, the promise and the button all change
// together; only the eyebrow and the tabs stay put.
//
// The headline and body sit in fixed-height boxes on purpose. With the control
// in the middle, anything that changes above it would otherwise jump under the
// reader's eye every time they press a tab.
//
// Self-contained, not linked from the site, deleted once this is wired into
// components/landing.tsx.

type Audience = "student" | "college" | "employer";

type Voice = {
  id: Audience;
  tab: string;
  under: string;
  head: string;
  body: string;
  cta: string;
  href: string;
  built: boolean;
};

const VOICES: Voice[] = [
  {
    id: "student",
    tab: "Students",
    under: "& early professionals",
    head: "Every career start asks the same questions.",
    body: "Work that fits how you think, a plan to get ready, and proof an employer can check. Start with the part you are least sure about.",
    cta: "Begin your climb",
    href: "/",
    built: true,
  },
  {
    id: "college",
    tab: "Colleges",
    under: "& universities",
    head: "See where your year group actually stands.",
    body: "Readiness across a cohort, measured from work students were scored on rather than from what they say about themselves — early enough in the year to change the outcome.",
    cta: "See the college view",
    href: "/for/colleges",
    built: false,
  },
  {
    id: "employer",
    tab: "Employers",
    under: "hiring & talent teams",
    head: "Hire on what they did, not what they wrote.",
    body: "Candidates arrive with a record of work that was observed and marked, so a screening decision rests on evidence instead of a resume's self-description.",
    cta: "See the employer view",
    href: "/for/employers",
    built: false,
  },
];

export default function PreviewWelcomeTabs() {
  const [id, setId] = useState<Audience>("student");
  const v = VOICES.find((x) => x.id === id)!;

  return (
    <main>
      {/* ---------------- the hero, as it would appear ---------------- */}
      <div className="landing-surface lp-dark relative overflow-hidden bg-[var(--lp-bg-a)] text-[var(--lp-ink)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(var(--lp-dots)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.16),transparent_65%)] blur-2xl"
        />

        <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-3xl flex-col items-center justify-center px-4 py-14 text-center sm:px-6">
          {/* Universal. It does not move, so there is always one fixed thing
              on the screen while everything else swaps. */}
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-panel)] px-4 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-teal)] opacity-70" />
            For students, early careers, and their employers
          </p>

          {/* Fixed box: the headline changes, the layout does not. */}
          <div className="mt-7 flex min-h-[4.6em] items-center sm:min-h-[2.6em]">
            <h1 className="font-display text-[clamp(1.85rem,4.2vw,3rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[var(--lp-body-strong)] [text-wrap:balance]">
              {v.head}
            </h1>
          </div>

          <div className="mt-4 flex min-h-[5.4em] items-start sm:min-h-[4.2em]">
            <p className="max-w-[52ch] text-[1rem] leading-relaxed text-[var(--lp-body)]">
              {v.body}
            </p>
          </div>

          {/* ---- the tabs, in the middle of the screen ---- */}
          <div
            role="tablist"
            aria-label="Who are you?"
            className="mt-2 grid w-full max-w-xl grid-cols-3 gap-1.5 rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-1.5 backdrop-blur"
          >
            {VOICES.map((o) => {
              const on = o.id === id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setId(o.id)}
                  className={`cursor-pointer rounded-xl px-2 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-teal)] ${
                    on
                      ? "bg-[var(--lp-teal)] text-[#06231f]"
                      : "text-[var(--lp-body)] hover:bg-white/5 hover:text-[var(--lp-ink)]"
                  }`}
                >
                  <span className="block text-[0.85rem] font-bold leading-tight">
                    {o.tab}
                  </span>
                  <span
                    className={`mt-0.5 block text-[0.66rem] leading-tight ${
                      on ? "text-[#06231f]/70" : "text-[var(--lp-faint)]"
                    }`}
                  >
                    {o.under}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ---- one action, belonging to the selected audience ---- */}
          <div className="mt-7">
            <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--lp-cta-bg)] px-9 py-4 text-[1rem] font-bold text-[var(--lp-cta-ink)] shadow-[0_16px_44px_-12px_rgba(0,0,0,0.65)] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0">
              {v.cta}
              <ArrowRight size={17} />
            </span>
          </div>

          <p className="mt-3 font-mono text-[0.7rem] text-[var(--lp-faint)]">
            → {v.href}{" "}
            {v.built ? (
              <span className="text-[var(--lp-teal)]">exists</span>
            ) : (
              <span className="text-amber-300">needs building</span>
            )}
          </p>
        </div>
      </div>

      {/* ---------------- notes, not part of the design ---------------- */}
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-400">
          Preview · not linked · the hero above is clickable
        </p>
        <h2 className="mt-2 font-display text-[1.5rem] font-bold tracking-tight text-brand-ink">
          What this does, and what it still needs
        </h2>

        <ul className="mt-4 space-y-3 text-[0.88rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-brand-ink">
              The whole hero belongs to the audience.
            </strong>{" "}
            Headline, promise and button all change together, so a placement
            officer reads a page written for them rather than a student page
            with a college tab on it.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Nothing jumps when you switch.
            </strong>{" "}
            The tabs sit in the middle, which means the headline is above the
            control that changes it. The headline and body are in fixed-height
            boxes so the page does not resize under the reader&rsquo;s eye —
            without that, every tap would shift the text they were looking at.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              The eyebrow never moves.
            </strong>{" "}
            One fixed thing on screen while everything else swaps, so the
            switch reads as a change of view rather than a change of site.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              Two of the three destinations do not exist.
            </strong>{" "}
            Students go to <code className="font-mono text-[0.8rem]">/</code>.
            Colleges and Employers need{" "}
            <code className="font-mono text-[0.8rem]">/for/colleges</code> and{" "}
            <code className="font-mono text-[0.8rem]">/for/employers</code>;
            the card grid is already built, so each is a thin page around it.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              The choice has to survive the click.
            </strong>{" "}
            If someone picks Colleges here and the next screen opens on the
            student view, the tab was decoration.
          </li>
        </ul>

        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.85rem] leading-relaxed text-amber-900">
          <strong className="font-semibold">One thing to watch.</strong> This is
          the real welcome hero, so it now costs a student a decision before
          they read anything — three tabs where there used to be a single
          story. That is the price of giving colleges and employers a front
          door, and it is worth paying only if those two audiences actually
          arrive here. If they mostly arrive from a deck or an email, a direct{" "}
          <code className="font-mono text-[0.8rem]">/for/colleges</code> link
          does the same job for free.
        </p>
      </div>
    </main>
  );
}
