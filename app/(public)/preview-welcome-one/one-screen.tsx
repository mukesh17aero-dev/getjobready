"use client";

import { useState } from "react";
import { Check } from "@/components/icons";

// The shape, at real proportions.
//
// The hard part of "one screen" is not the design, it is the arithmetic: a
// laptop viewport under the app header is about 720px tall, and a phone at
// 360px is 640. Everything below has been costed against those two numbers,
// which is why the beats are three and not five, and why the phone deck is
// on the student screen only - it is the one audience whose story is worth
// 30rem of height.
//
// Rendered at true pixel sizes inside a scaled box, so what you see is what
// fits. Nothing here is wired to the real site.

type Audience = "student" | "employer" | "college";

type Beat = { head: string; body: string };

type Screen = {
  tab: string;
  eyebrow: string;
  head: string;
  /** Rotating tail on the student headline; static for the other two. */
  tail?: string;
  sub: string;
  beats: Beat[];
  cta: string;
  under: string;
  /** The phone deck sits beside the words. Students only. */
  deck?: boolean;
};

const SCREENS: Record<Audience, Screen> = {
  student: {
    tab: "Student",
    eyebrow: "Your career companion",
    head: "Every career start asks",
    tail: "What fits me?",
    sub: "Thousands chase the same opportunity. Ascend clears your path: work that fits how you think, a plan to get ready, and proof employers trust.",
    beats: [
      {
        head: "Roles that fit you",
        body: "The real day behind each one, and a reason behind every match.",
      },
      {
        head: "A plan, then practice",
        body: "Work the actual job before day one, not just the interview.",
      },
      {
        head: "Proof, not claims",
        body: "A record of work that was watched and marked, and it stays yours.",
      },
    ],
    cta: "Start free",
    under: "No card. Two minutes to your first role.",
    deck: true,
  },
  employer: {
    tab: "Employer",
    eyebrow: "For employers",
    head: "Hire on what they did, not what they wrote.",
    sub: "Hiring's costliest gap is between the offer letter and a productive employee. Candidates arrive having already closed it.",
    beats: [
      {
        head: "Evidence, not self-description",
        body: "Work that was observed and marked, attached to the candidate.",
      },
      {
        head: "Productive sooner",
        body: "They have done a version of the job before their first day.",
      },
      {
        head: "Screen on the record",
        body: "Compare people on the same measured work, not on resume wording.",
      },
    ],
    cta: "See the employer view",
    under: "A walkthrough takes fifteen minutes.",
  },
  college: {
    tab: "College",
    eyebrow: "For colleges",
    head: "See where your year group actually stands.",
    sub: "Readiness across a cohort, measured from work students were scored on rather than from what they say about themselves.",
    beats: [
      {
        head: "Measured, not surveyed",
        body: "Every number comes from work a student was marked on.",
      },
      {
        head: "Early enough to matter",
        body: "You see the gap in the year you can still do something about it.",
      },
      {
        head: "Cohort and student",
        body: "The whole year at a glance, and any one student behind it.",
      },
    ],
    cta: "See the college view",
    under: "Built for placement cells.",
  },
};

const TABS: Audience[] = ["student", "employer", "college"];

export function OneScreen() {
  const [at, setAt] = useState<Audience>("student");
  const screen = SCREENS[at];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Preview · not a shipped screen
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        One screen per audience
      </h1>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        Three and four together: the switch changes the whole page, and each
        page is a single screen holding what used to be two sheets - the
        argument, the part written for that audience, and the ask.
      </p>

      <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-[0.9rem] font-semibold text-slate-900">
          What has to happen to get here
        </h2>
        <ol className="mt-2 grid gap-2 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-slate-800">
              1. The middle sheets are deleted.
            </strong>{" "}
            The network sheet a student reaches, and the hiring-gap sheet an
            employer reaches, both stop being sheets. Their argument survives
            as three short beats on the one screen.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">
              2. The closing sheet is deleted.
            </strong>{" "}
            It only ever rendered for students. Its ask moves up to the one
            screen, which is where the button already was, so a student now has
            one button rather than two.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">
              3. Employer and college get real content.
            </strong>{" "}
            They have a headline and nothing else today. Three beats and an ask
            each - roughly sixty words apiece, below.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">
              4. The scroll machinery goes.
            </strong>{" "}
            Sticky sheets, snap points and the scroll-driven reveals exist to
            move between sheets. One screen has nowhere to move to.
          </li>
        </ol>
      </section>

      {/* ---- the switch, then the screen it produces ---- */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setAt(id)}
            className={`min-h-11 cursor-pointer rounded-full border px-4 text-[0.85rem] font-semibold transition-colors ${
              at === id
                ? "border-brand-teal bg-brand-teal/10 text-brand-ink"
                : "border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {SCREENS[id].tab}
          </button>
        ))}
        <p className="ml-auto text-[0.78rem] text-slate-500">
          Same switch as today. It now changes everything below it.
        </p>
      </div>

      <h2 className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Laptop · 1280 × 720, which is the viewport under the header
      </h2>
      <Box w={1280} h={720} fit={1024}>
        <Wide screen={screen} />
      </Box>

      <h2 className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Phone · 360 × 640
      </h2>
      <Box w={360} h={640} fit={360}>
        <Tall screen={screen} />
      </Box>

      <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-[0.9rem] font-semibold text-amber-900">
          The one thing to decide
        </h2>
        <p className="mt-1.5 text-[0.86rem] leading-relaxed text-amber-900">
          On a laptop this genuinely fits. On a 360px phone it does not: the
          headline, three beats, the button and the deck come to about 780px
          against 640 of screen. Two honest ways out - drop the phone deck on
          mobile and it fits in one screen, or keep the deck below the button
          and accept one short scroll on phones only. The mock above shows the
          second, because the deck is the best thing on the page and a student
          on a phone is the person it was made for.
        </p>
      </section>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
          What this costs
        </h2>
        <ul className="mt-2 grid gap-1.5 text-[0.88rem] leading-relaxed text-slate-600">
          <li>
            Three sheets of written material are cut to nine short beats. The
            feature wall, the journey strip and the employer sheet go with
            them.
          </li>
          <li>
            About 120 words to write for employers and colleges, which do not
            exist yet. The drafts above are a starting point, not copy.
          </li>
          <li>
            The page stops being a story you scroll and becomes a card you
            read. That is the trade in one line, and it is worth saying out
            loud before it is built.
          </li>
        </ul>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------ the frame */

/** A true-size viewport, scaled down to fit the page. */
function Box({
  w,
  h,
  fit,
  children,
}: {
  w: number;
  h: number;
  fit: number;
  children: React.ReactNode;
}) {
  const scale = Math.min(1, fit / w);
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-slate-300">
      <div
        style={{ width: w, height: h, zoom: scale }}
        className="lp-dark relative overflow-hidden bg-[var(--lp-bg-a)] text-[var(--lp-ink)]"
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ the screen */

function Tabs({ screen }: { screen: Screen }) {
  return (
    <div className="flex gap-1.5">
      {TABS.map((id) => (
        <span
          key={id}
          className={`rounded-full border px-3 py-1 text-[0.72rem] font-semibold ${
            SCREENS[id].tab === screen.tab
              ? "border-[var(--lp-teal)] bg-[var(--lp-panel)] text-[var(--lp-ink)]"
              : "border-[var(--lp-border)] text-[var(--lp-faint)]"
          }`}
        >
          {SCREENS[id].tab}
        </span>
      ))}
    </div>
  );
}

function Beats({ screen, tight }: { screen: Screen; tight?: boolean }) {
  return (
    <ul className={`grid ${tight ? "gap-2" : "gap-3"}`}>
      {screen.beats.map((b) => (
        <li key={b.head} className="flex gap-2.5">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#34d399]/20 text-[var(--lp-emerald)]">
            <Check size={11} />
          </span>
          <span className="min-w-0">
            <span className="block text-[0.92rem] font-semibold text-[var(--lp-ink)]">
              {b.head}
            </span>
            <span
              className={`block text-[0.84rem] leading-snug text-[var(--lp-body)]`}
            >
              {b.body}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Cta({ screen }: { screen: Screen }) {
  return (
    <div>
      <span className="inline-flex h-12 items-center rounded-full bg-[var(--lp-cta-bg)] px-7 text-[0.92rem] font-bold text-[var(--lp-cta-ink)]">
        {screen.cta}
      </span>
      <p className="mt-2 text-[0.78rem] text-[var(--lp-faint)]">
        {screen.under}
      </p>
    </div>
  );
}

/** The deck, as a still. The real one keeps its animation and its taps. */
function Deck() {
  return (
    <div className="relative h-[26rem] w-[15rem] rounded-[2.2rem] border-[8px] border-[#1c2536] bg-[#0a0f1a] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]">
      <span className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-[#1c2536]" />
      <div className="m-1 flex h-[24.2rem] flex-col rounded-[1.7rem] bg-gradient-to-b from-[#161f2e] to-[#0d141f] p-5 pt-10">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[var(--lp-faint)]">
          Sound familiar?
        </p>
        <div className="my-auto">
          <p className="font-display text-[1.25rem] font-semibold leading-snug text-[var(--lp-ink)]">
            &ldquo;What if I pick something wrong for me?&rdquo;
          </p>
          <p className="mt-3 border-l-2 border-[var(--lp-border)] pl-3 text-[0.82rem] leading-relaxed text-[var(--lp-faint)]">
            Parents say one thing. Friends another. The internet says
            everything.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--lp-border)] text-[0.8rem] text-[var(--lp-body-strong)]">
            ✕
          </span>
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[var(--lp-faint)]">
            tap to swipe
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--lp-panel)] text-[var(--lp-faint)]">
            <Check size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Laptop: words on the left, deck on the right where there is one. */
function Wide({ screen }: { screen: Screen }) {
  return (
    <div className="flex h-full flex-col px-14 py-8">
      <Tabs screen={screen} />
      <div
        className={`mt-6 grid flex-1 items-center gap-12 ${
          screen.deck ? "grid-cols-[1.05fr_0.95fr]" : "place-items-center"
        }`}
      >
        <div className={screen.deck ? "" : "max-w-[62ch] text-center"}>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)]">
            {screen.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--lp-body-strong)]">
            {screen.head}
            {screen.tail && (
              <span className="mt-1 block bg-gradient-to-r from-[var(--lp-cyan)] via-[var(--lp-teal)] to-[var(--lp-emerald)] bg-clip-text text-transparent">
                {screen.tail}
              </span>
            )}
          </h2>
          <p
            className={`mt-4 text-[1rem] leading-relaxed text-[var(--lp-body)] ${
              screen.deck ? "max-w-[46ch]" : "mx-auto max-w-[56ch]"
            }`}
          >
            {screen.sub}
          </p>
          <div
            className={`mt-6 ${screen.deck ? "" : "mx-auto max-w-[40rem] text-left"}`}
          >
            <Beats screen={screen} />
          </div>
          <div className="mt-7">
            <Cta screen={screen} />
          </div>
        </div>
        {screen.deck && (
          <div className="flex justify-center">
            <Deck />
          </div>
        )}
      </div>
    </div>
  );
}

/** Phone: one column, the ask above the fold, the deck under it. */
function Tall({ screen }: { screen: Screen }) {
  return (
    <div className="flex h-full flex-col px-5 py-5">
      <Tabs screen={screen} />
      <p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)]">
        {screen.eyebrow}
      </p>
      <h2 className="mt-2 font-display text-[1.55rem] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--lp-body-strong)]">
        {screen.head}
        {screen.tail && (
          <span className="block bg-gradient-to-r from-[var(--lp-cyan)] via-[var(--lp-teal)] to-[var(--lp-emerald)] bg-clip-text text-transparent">
            {screen.tail}
          </span>
        )}
      </h2>
      <p className="mt-2.5 text-[0.86rem] leading-relaxed text-[var(--lp-body)]">
        {screen.sub}
      </p>
      <div className="mt-4">
        <Beats screen={screen} tight />
      </div>
      <div className="mt-5">
        <Cta screen={screen} />
      </div>
      {screen.deck && (
        <p className="mt-auto border-t border-[var(--lp-border)] pt-2 text-center text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--lp-faint)]">
          the deck sits below this line
        </p>
      )}
    </div>
  );
}
