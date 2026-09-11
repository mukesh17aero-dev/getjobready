"use client";

import { useState } from "react";
import { Check } from "@/components/icons";
import {
  NetworkExhibit,
  EmployerExhibit,
} from "../preview-welcome-stage/stage";

// A single continuous page, scrolled, with the ask at the end - one of them
// per audience.
//
// The switch is exactly the one that ships today: the same wide segmented
// control, the same three labels in the same order, in the same place at the
// top of the page. What changes is what it produces. Today it swaps a
// headline and leaves two of the three audiences with no page under it; here
// each selection is a full scroll of its own that ends in its own ask.

type Audience = "student" | "college" | "employer";

type Exhibit = {
  /** Why this picture is here, said to the person reading it. */
  lead: string;
  which: "network" | "employer" | "cohort";
};

type Page = {
  /** The switch label. Same words as the live control. */
  tab: string;
  eyebrow: string;
  head: string;
  /** Rotating tail on the student headline; the other two are static. */
  tail?: string;
  sub: string;
  beatsTitle: string;
  beats: Array<[string, string]>;
  exhibits: Exhibit[];
  bar: string;
  barCta: string;
  askHead: string;
  askBody: string;
  cta: string;
  under: string;
  /** The phone deck. Students only - it tells a student's story. */
  deck?: boolean;
};

const PAGES: Record<Audience, Page> = {
  student: {
    tab: "Students & early professionals",
    eyebrow: "Your career companion",
    head: "Every career start asks",
    tail: "What fits me?",
    sub: "Thousands chase the same opportunity. Ascend clears your path: work that fits how you think, a plan to get ready, and proof employers trust.",
    beatsTitle: "What you get",
    beats: [
      [
        "Roles that fit you",
        "The real day behind each one, the real pay, and a reason behind every match.",
      ],
      [
        "A plan, then practice",
        "Work the actual job before day one, scored, so you know where you stand.",
      ],
      [
        "Proof, not claims",
        "A record of work that was watched and marked. It stays yours.",
      ],
    ],
    exhibits: [
      {
        lead: "Where this goes: you are not using a tool on your own, you are on a loop that ends in a job.",
        which: "network",
      },
    ],
    bar: "Ready when you are - the first role takes two minutes.",
    barCta: "Start free",
    askHead: "Your dream career, built together.",
    askBody:
      "Ascend starts with where you are: the roles that fit you, a plan sized to you, practice that makes you ready, and proof employers trust.",
    cta: "Start free",
    under: "No card. Two minutes to your first role.",
    deck: true,
  },
  college: {
    tab: "Colleges & universities",
    eyebrow: "For colleges",
    head: "See where your year group actually stands.",
    sub: "Readiness across a cohort, measured from work students were scored on rather than from what they say about themselves, early enough in the year to change the outcome.",
    beatsTitle: "What a placement cell gets",
    beats: [
      [
        "Measured, not surveyed",
        "Every number comes from work a student was marked on, not from a form they filled in.",
      ],
      [
        "Early enough to matter",
        "You see the gap in the year you can still do something about it.",
      ],
      [
        "The cohort and the student",
        "The whole year at a glance, and any one student behind it.",
      ],
    ],
    exhibits: [
      {
        lead: "The year group, by how ready they are for the work they are aiming at.",
        which: "cohort",
      },
      {
        lead: "And the path each of those students is on, which is what moves them along that scale.",
        which: "network",
      },
    ],
    bar: "See your own cohort - a walkthrough takes fifteen minutes.",
    barCta: "See the college view",
    askHead: "Know the gap while you can still close it.",
    askBody:
      "One view of the year group, built from work that was scored rather than self-reported, so placement effort goes where it changes an outcome.",
    cta: "See the college view",
    under: "Built for placement cells.",
  },
  employer: {
    tab: "Employers hiring & talent teams",
    eyebrow: "For employers",
    head: "Hire on what they did, not what they wrote.",
    sub: "Hiring's costliest gap is between the offer letter and a productive employee. Thousands of identical resumes, then months of training before a new hire earns their seat.",
    beatsTitle: "What arrives with a candidate",
    beats: [
      [
        "Evidence, not self-description",
        "Work that was observed and marked, attached to the person who did it.",
      ],
      [
        "Productive sooner",
        "They have done a version of the job before their first day.",
      ],
      [
        "Screen on the record",
        "Compare people on the same measured work, not on how well a resume was written.",
      ],
    ],
    exhibits: [
      {
        lead: "The gap you are paying for today, and the shape of it once it is closed.",
        which: "employer",
      },
      {
        lead: "And where those candidates come from - the loop that produced the record you are reading.",
        which: "network",
      },
    ],
    bar: "See what arrives with a candidate.",
    barCta: "See the employer view",
    askHead: "Hire people who already know the work.",
    askBody:
      "Candidates reach you having practised the role and been scored on it, so a screening decision rests on evidence instead of a resume's self-description.",
    cta: "See the employer view",
    under: "A walkthrough takes fifteen minutes.",
  },
};

// Same order as the live control.
const ORDER: Audience[] = ["student", "college", "employer"];

export function LongScroll() {
  const [at, setAt] = useState<Audience>("student");
  // How far down the mock viewport somebody has scrolled, which is what
  // decides whether the slim bar is showing.
  const [past, setPast] = useState(false);
  const page = PAGES[at];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Preview · not a shipped screen
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        One long scroll, per selection
      </h1>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        The switch is the one that ships today - same control, same three
        labels, same place. What changes is what sits under it: each selection
        is now a full page of its own that ends in its own ask. Use the switch
        inside the window, and scroll inside it.
      </p>

      <section className="mt-5 rounded-xl border border-brand-teal/30 bg-brand-teal/[0.06] p-4">
        <h2 className="text-[0.9rem] font-semibold text-brand-ink">
          The one thing that makes it work
        </h2>
        <p className="mt-1.5 text-[0.86rem] leading-relaxed text-slate-700">
          The ask is in two places, and they are not the same ask. A slim bar
          appears the moment the hero leaves the screen, so anybody who arrived
          already sold is one press from starting wherever they are. The full
          ask waits at the bottom for anybody who read. That is what lets the
          hero lose its button without losing the people who came to press it.
        </p>
      </section>

      <h2 className="mt-7 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-slate-400">
        Laptop · 1280 × 720. Switch and scroll inside it.
      </h2>
      <div className="mt-2 overflow-hidden rounded-xl border border-slate-300">
        <div
          onScroll={(e) => setPast(e.currentTarget.scrollTop > 620)}
          style={{ width: 1280, height: 720, zoom: 1024 / 1280 }}
          className="lp-dark relative overflow-y-auto bg-[var(--lp-bg-a)] text-[var(--lp-ink)]"
        >
          {/* the app header, unchanged */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--lp-border)] bg-[var(--lp-bg-a)]/90 px-14 py-3 backdrop-blur">
            <span className="font-display text-[1rem] font-bold tracking-tight">
              ASCEND
            </span>
            <span className="text-[0.78rem] font-semibold text-[var(--lp-body)]">
              Sign in
            </span>
          </div>

          {/* the slim ask, which arrives when the hero leaves */}
          <div
            className={`sticky top-[3.1rem] z-10 flex items-center justify-between gap-4 border-b border-[var(--lp-border)] bg-[var(--lp-bg-a)]/95 px-14 backdrop-blur transition-all duration-300 ${
              past
                ? "h-14 opacity-100"
                : "pointer-events-none h-0 overflow-hidden opacity-0"
            }`}
          >
            <p className="text-[0.84rem] font-semibold text-[var(--lp-body-strong)]">
              {page.bar}
            </p>
            <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-[var(--lp-cta-bg)] px-5 text-[0.8rem] font-bold text-[var(--lp-cta-ink)]">
              {page.barCta}
            </span>
          </div>

          {/* ---- the switch, exactly as it is today ---- */}
          <div className="px-14 pt-8">
            <div className="relative mx-auto flex w-full max-w-3xl gap-1 rounded-full border border-[var(--lp-border)] bg-[var(--lp-panel)] p-1.5 backdrop-blur">
              {ORDER.map((id) => {
                const on = id === at;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAt(id)}
                    className={`flex-1 cursor-pointer rounded-full px-4 py-3 text-center text-[0.88rem] transition-colors ${
                      on
                        ? "bg-[#5eead4] font-semibold text-[#06231f] shadow-[0_8px_28px_-8px_rgba(94,234,212,0.55)]"
                        : "text-[var(--lp-body)] hover:bg-white/5 hover:text-[var(--lp-ink)]"
                    }`}
                  >
                    {PAGES[id].tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---- 1. the hero. No button; a reason to keep going. ---- */}
          <section
            className={`grid min-h-[32rem] items-center gap-12 px-14 py-12 ${
              page.deck ? "grid-cols-[1.05fr_0.95fr]" : ""
            }`}
          >
            <div
              className={page.deck ? "" : "mx-auto max-w-[60ch] text-center"}
            >
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)]">
                {page.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-[2.7rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--lp-body-strong)]">
                {page.head}
                {page.tail && (
                  <span className="mt-1 block bg-gradient-to-r from-[var(--lp-cyan)] via-[var(--lp-teal)] to-[var(--lp-emerald)] bg-clip-text text-transparent">
                    {page.tail}
                  </span>
                )}
              </h2>
              <p
                className={`mt-5 text-[1.02rem] leading-relaxed text-[var(--lp-body)] ${
                  page.deck ? "max-w-[46ch]" : "mx-auto max-w-[56ch]"
                }`}
              >
                {page.sub}
              </p>
              <p className="mt-7 inline-flex items-center gap-2 border-b border-[var(--lp-border)] pb-1 text-[0.82rem] font-bold uppercase tracking-[0.14em] text-[var(--lp-faint)]">
                Here is how it works
                <span aria-hidden>&darr;</span>
              </p>
            </div>
            {page.deck && <Phone />}
          </section>

          {/* ---- 2. what you get, three beats ---- */}
          <section className="border-t border-[var(--lp-border)] px-14 py-14">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)]">
              {page.beatsTitle}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-5">
              {page.beats.map(([head, body]) => (
                <div
                  key={head}
                  className="rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-5"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#34d399]/20 text-[var(--lp-emerald)]">
                    <Check size={15} />
                  </span>
                  <p className="mt-3 text-[1rem] font-semibold text-[var(--lp-ink)]">
                    {head}
                  </p>
                  <p className="mt-1.5 text-[0.88rem] leading-relaxed text-[var(--lp-body)]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ---- 3 and 4. the exhibits, at full size, in this audience's
                  order and with this audience's reason for them ---- */}
          {page.exhibits.map((e) => (
            <section
              key={e.which}
              className="border-t border-[var(--lp-border)] px-14 py-14"
            >
              <p className="mx-auto max-w-[52rem] text-[0.95rem] leading-relaxed text-[var(--lp-body-strong)]">
                {e.lead}
              </p>
              <div className="mx-auto mt-4 max-w-[52rem] rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-8">
                {e.which === "network" ? (
                  <NetworkExhibit />
                ) : e.which === "employer" ? (
                  <EmployerExhibit />
                ) : (
                  <CohortExhibit />
                )}
              </div>
            </section>
          ))}

          {/* ---- 5. the ask ---- */}
          <section className="border-t border-[var(--lp-border)] px-14 py-20 text-center">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--lp-teal)]">
              {page.eyebrow}
            </p>
            <h2 className="mx-auto mt-4 max-w-[18ch] font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--lp-ink)]">
              {page.askHead}
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[0.98rem] leading-relaxed text-[var(--lp-body)]">
              {page.askBody}
            </p>
            <span className="mt-7 inline-flex h-12 items-center rounded-full bg-[var(--lp-cta-bg)] px-8 text-[0.95rem] font-bold text-[var(--lp-cta-ink)]">
              {page.cta}
            </span>
            <p className="mt-2.5 text-[0.8rem] text-[var(--lp-faint)]">
              {page.under}
            </p>
          </section>
        </div>
      </div>
      <p className="mt-2 text-[0.78rem] text-slate-500">
        The slim bar appears once you scroll past the hero and stays for the
        rest of the page. Switching audience keeps you where you are, as it does
        today.
      </p>

      {/* ---------------------------------------- what each selection gets */}
      <div className="mt-9 border-t border-slate-200 pt-6">
        <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
          What each selection gets
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-[0.84rem]">
            <thead>
              <tr className="border-b border-slate-200 text-[0.7rem] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-bold">Selection</th>
                <th className="py-2 pr-4 font-bold">Hero</th>
                <th className="py-2 pr-4 font-bold">Exhibits, in order</th>
                <th className="py-2 font-bold">Ends with</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {[
                [
                  "Students",
                  "Rotating question + the phone deck",
                  "The network loop",
                  "Start free",
                ],
                [
                  "Colleges",
                  "Cohort headline, centred, no deck",
                  "Cohort readiness → the network loop",
                  "See the college view",
                ],
                [
                  "Employers",
                  "Hiring headline, centred, no deck",
                  "The employer chart → the network loop",
                  "See the employer view",
                ],
              ].map((row) => (
                <tr
                  key={row[0]}
                  className="border-b border-slate-100 align-top"
                >
                  <td className="py-2.5 pr-4 font-semibold text-slate-700">
                    {row[0]}
                  </td>
                  <td className="py-2.5 pr-4">{row[1]}</td>
                  <td className="py-2.5 pr-4">{row[2]}</td>
                  <td className="py-2.5">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          The loop is the only picture shared by all three, and never for the
          same reason: it is where a student is heading, where an
          employer&rsquo;s candidates came from, and the path a college is
          moving a year group along. One line of framing above it does that
          work, so nothing is written twice. The employer chart stays where it
          belongs - a student does not need to be shown a hiring manager&rsquo;s
          argument to be convinced of their own.
        </p>
        <p className="mt-2 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          The cohort exhibit is the only genuinely new picture, and colleges are
          the only selection that has nothing today. Its numbers are shaped like
          real ones and labelled illustrative, because nobody has run a cohort
          yet - when one has, the same picture takes the real figures.
        </p>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
          What has to change in the code
        </h2>
        <ul className="mt-2 grid gap-2 text-[0.88rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-slate-800">
              The sheet pager goes.
            </strong>{" "}
            Today one wheel gesture equals one sheet, driven by hand in
            JavaScript, with sheets stuck to the top covering each other. A long
            scroll is ordinary scrolling, so that whole mechanism is deleted
            rather than tuned.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">
              Sections stop being full-height.
            </strong>{" "}
            No more{" "}
            <code className="rounded bg-slate-100 px-1 text-[0.82rem]">
              min-h-[calc(100dvh-3.5rem)]
            </code>
            , which is exactly why both exhibits keep their full size.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">
              The switch keeps working the way it does now.
            </strong>{" "}
            It is still links carrying{" "}
            <code className="rounded bg-slate-100 px-1 text-[0.82rem]">
              ?for=
            </code>
            , still server-rendered per audience, still shareable and still
            works with the back button. Only what it renders grows.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">
              The slim bar is new,
            </strong>{" "}
            and it is the piece that earns the hero losing its button.
          </li>
          <li>
            <strong className="font-semibold text-slate-800">
              The reveals stay.
            </strong>{" "}
            Sections fading up as they arrive works better here than it does now
            - that was always about scrolling, not about sheets.
          </li>
        </ul>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- exhibits */

/** The year group, by readiness. Shaped like real data, and labelled. */
function CohortExhibit() {
  const bands: Array<[string, number, string]> = [
    ["Ready for the bar employers set", 18, "#34d399"],
    ["Close - one or two gaps left", 34, "#5eead4"],
    ["Started, a way to go", 31, "rgba(255,255,255,0.32)"],
    ["Not started", 17, "rgba(255,255,255,0.16)"],
  ];
  return (
    <div>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-faint)]">
        A year group, by readiness
      </p>
      <p className="mt-2 text-[0.86rem] leading-relaxed text-[var(--lp-body)]">
        Every band is built from work students were scored on, not from what
        they said about themselves - so the number you act on is the number that
        is true.
      </p>
      <ul className="mt-5 grid gap-3">
        {bands.map(([label, pct, colour]) => (
          <li key={label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[0.86rem] font-semibold text-[var(--lp-body-strong)]">
                {label}
              </span>
              <span className="font-display text-[0.95rem] font-semibold text-[var(--lp-ink)]">
                {pct}%
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: colour }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-center text-[0.74rem] text-[var(--lp-faint)]">
        Illustrative shape, not a measured cohort - your own numbers replace it
        on day one.
      </p>
    </div>
  );
}

/** The phone, as a still. The real one keeps its animation and its taps. */
function Phone() {
  return (
    <div className="flex justify-center">
      <div className="relative h-[27rem] w-[15.5rem] rounded-[2.4rem] border-[9px] border-[#1c2536] bg-[#0a0f1a] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]">
        <span className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-[#1c2536]" />
        <div className="m-1 flex h-[25rem] flex-col rounded-[1.8rem] bg-gradient-to-b from-[#161f2e] to-[#0d141f] p-5 pt-10">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[var(--lp-faint)]">
            Sound familiar?
          </p>
          <div className="my-auto">
            <p className="font-display text-[1.3rem] font-semibold leading-snug text-[var(--lp-ink)]">
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
    </div>
  );
}
