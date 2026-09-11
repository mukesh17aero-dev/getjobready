import React from "react";
import Link from "next/link";
import { FeatureWall } from "@/components/feature-wall";
import { LandingCtas } from "@/components/landing-ctas";
import { AudienceHero, type Audience } from "@/components/audience-hero";
import { AuthDeepLink } from "@/components/auth-deep-link";
import { StickyAsk } from "@/components/sticky-ask";
import { CohortReadiness } from "@/components/cohort-readiness";
import { ArrowRight, Check, Clock, Eye, Spark } from "@/components/icons";
import { SwipeDeck } from "@/components/swipe-deck";

// One page per audience, read the way every other page is read: scrolled.
//
// It was four full-height sheets that covered each other, paged by a wheel
// handler written by hand. That shape cost more than it gave. The button sat
// in the first sheet, so the people it was for pressed it there and the
// sheets below were written for almost nobody; the sheet a student did reach
// was the network pitch, addressed to all three audiences at once; and two of
// the three audiences had no ending at all - an employer who read to the
// bottom was never asked for anything, and a college got the hero and then
// the page stopped.
//
// So: no sheets, no pager, no full-height sections. The switch at the top -
// unchanged, same control, same labels - now produces a whole page rather
// than a headline, and each one ends in its own ask. The two pictures worth
// keeping, the network loop and the employer chart, keep their full size,
// which is the thing a single screen could not have done.
//
// The accent runs a cyan → teal → emerald spectrum: cyan where the road
// begins, emerald where it is earned. The inner app keeps its violet
// guidance language; this marketing surface wears the night version.
//
// Stacking only engages at lg - on a phone the sheets flow normally, which
// is both simpler and kinder to short viewports.

// feTurbulence, inlined - same trade as components/aurora.tsx.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

// The landing's own weather: cyan and emerald fields on graphite.
function Glow({ low = false }: { low?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <span
        className={`absolute h-[38rem] w-[38rem] animate-drift rounded-full blur-3xl ${
          low ? "-left-[22%] top-[30%]" : "-left-[15%] -top-[35%]"
        }`}
        style={{
          background: `radial-gradient(circle, rgb(34 211 238 / ${
            low ? 0.18 : 0.3
          }) 0%, rgb(34 211 238 / 0) 68%)`,
        }}
      />
      <span
        className={`absolute h-[34rem] w-[34rem] animate-drift-slow rounded-full blur-3xl ${
          low ? "-bottom-[30%] right-[-14%]" : "-bottom-[45%] right-[-10%]"
        }`}
        style={{
          background: `radial-gradient(circle, rgb(52 211 153 / ${
            low ? 0.16 : 0.24
          }) 0%, rgb(52 211 153 / 0) 70%)`,
        }}
      />
      <span
        className="absolute inset-0 opacity-[var(--lp-grain)] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}

// One chapter of the page. It was sticky and snapped; it is now an ordinary
// section that ends where its content ends, which is what lets the exhibits
// inside it be as tall as they need to be.
function Sheet({
  children,
  tone,
  first = false,
}: {
  children: React.ReactNode;
  tone: string;
  first?: boolean;
}) {
  return (
    <section className="relative">
      {/* Flat, full-bleed sheets: with every sheet on the same ground, a
          rounded top edge revealed the same colour behind it and read as a
          notch under the header rather than as one card over another. The
          hairline border still marks where one sheet ends. */}
      <div
        className={`relative overflow-hidden ${tone} ${
          first ? "" : "border-t border-[var(--lp-border)]"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

// The three questions every first career asks - the hero cycles them.
// The catalogue's real roles, not invented ones.
const ROLES = [
  "Customer Success Associate",
  "Operations Coordinator",
  "Operations Executive",
  "Relationship Executive",
  "Guest Experience Associate",
  "Hub Supervisor",
];

// What there is to explore, rolled between the role names: every item is a
// real part of the product. ("Voices", not "testimonials" - the quotes in
// the catalogue are illustrative, and the landing never claims otherwise.)
const INSIDE_PEEKS = [
  "Sneak peek: the real day, hour by hour",
  "Career ladders with real pay bands",
  "The honest parts, included",
  "Voices from inside the work",
  "A plan sized to your gap",
  "Proof employers trust",
];

// The four questions students actually arrive with, and what each one
// becomes. The last is the trust question - it earns emerald because the
// answer is theirs to hold.
const QA = [
  {
    icon: Spark,
    quote: "What if I pick something wrong for me?",
    answer:
      "You don’t pick from a list - a focused, data-driven assessment reads how you actually think and decide, and every match opens to its reasons. The honest parts are included, and nothing locks you in: change direction and the plan follows you.",
    foot: "You walk away with: a direction you can defend",
    earned: false,
  },
  {
    icon: Eye,
    quote: "I don’t even know what jobs exist for me.",
    answer:
      "Ascend shows you named roles nobody told you about - what the day actually looks like, what it pays now, and the ladder it starts. The map exists; you were just never given it.",
    foot: "You walk away with: the map you were never given",
    earned: false,
  },
  {
    icon: Clock,
    quote: "Thousands of us are applying for the same jobs.",
    answer:
      "On resumes, everyone reads the same - that market is brutal and getting worse. Ascend moves you to a different race: you practise the real work before day one and close the productivity gap employers actually measure. Fewer people compete there.",
    foot: "You walk away with: a way to stand out that isn’t luck",
    earned: false,
  },
  {
    icon: Check,
    quote: "Why should I trust a tool with my career?",
    answer:
      "Because it shows you the reality of each role beyond what the internet says - hard truths included - then trains you until you're comfortable, and connects you with employers who value a productive candidate from day one. And your record stays yours: share it or delete it whenever you want.",
    foot: "You walk away with: reasons, not promises",
    earned: true,
  },
];

// The full offer, in plain language - every line is a real, shipped part
// of the product; none of it uses internal product names.

// The employer chapter's ledger: the three challenges every frontline
// employer names (today's column) and what each becomes with Ascend.
const EMPLOYER_CHALLENGES = [
  {
    q: "Thousands of applicants, identical qualifications.",
    a: "Ascend ranks candidates on demonstrated skills against a bar you set - evidence replaces resume roulette.",
  },
  {
    q: "Hiring is just the start - then you pay to train.",
    a: "Ascend candidates arrive trained on your role’s real work - and every score opens to the actual work behind it.",
  },
  {
    q: "Months pass before a new hire is productive.",
    a: "They’ve done the job’s tasks before day one - the gap between offer and productive shrinks to onboarding, not education.",
  },
];

// The rotating gradient ring, shipped raw. The build's CSS minifier drops
// `mask-composite: exclude` and reorders the -webkit- variant (which the
// mask shorthand then resets), turning the ring into a flood - so this one
// rule bypasses the pipeline entirely. Verified against the processed
// output: do not move it into globals.css.
const BORDER_GLOW_CSS = `
@property --border-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes border-rotate { to { --border-angle: 360deg; } }
.border-glow { position: relative; }
.border-glow::before {
  content: "";
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: conic-gradient(
    from var(--border-angle),
    rgb(34 211 238 / 0.5),
    rgb(79 212 201 / 0.35) 30%,
    rgb(255 255 255 / 0.06) 55%,
    rgb(52 211 153 / 0.25) 80%,
    rgb(34 211 238 / 0.5)
  );
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  animation: border-rotate 9s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .border-glow::before { animation: none; }
}
`;

// ---- what each selection gets, in words ----
//
// One entry per audience, because the whole point of the switch is that the
// page belongs to whoever is reading it. The loop is the only picture all
// three share, and never for the same reason - which is what `network` says
// above it.
const PER_AUDIENCE: Record<
  Audience,
  {
    beatsTitle: string;
    beats: Array<[string, string]>;
    network: string;
    bar: string;
    barCta: string;
    barHref: string;
    askHead: string;
    askBody: string;
  }
> = {
  student: {
    beatsTitle: "What you get",
    beats: [
      [
        "Roles that fit you",
        "The real day behind each one, the pay it starts at, and a reason behind every match.",
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
    network:
      "Where this goes: you are not using a tool on your own, you are on a loop that ends in a job.",
    bar: "Ready when you are - the first role takes two minutes.",
    barCta: "Begin your climb",
    barHref: "/",
    askHead: "Your dream career, built together.",
    askBody:
      "Ascend starts with where you are: the roles that fit you, a plan sized to you, practice that makes you ready, and proof employers trust. From the first question onward, your career has someone in its corner.",
  },
  college: {
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
    network:
      "And the path each of those students is on, which is what moves them along that scale.",
    bar: "See your own cohort - a walkthrough takes fifteen minutes.",
    barCta: "See the college view",
    barHref: "/for/colleges",
    askHead: "Know the gap while you can still close it.",
    askBody:
      "One view of the year group, built from work that was scored rather than self-reported, so placement effort goes where it changes an outcome.",
  },
  employer: {
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
    network:
      "And where those candidates come from - the loop that produced the record you are reading.",
    bar: "See what arrives with a candidate.",
    barCta: "See the employer view",
    barHref: "/for/employers",
    askHead: "Hire people who already know the work.",
    askBody:
      "Candidates reach you having practised the role and been scored on it, so a screening decision rests on evidence instead of a resume's self-description.",
  },
};

export function Landing({
  signedIn,
  audience = "student",
}: {
  signedIn: boolean;
  /** Which audience tab the first sheet opens on. */
  audience?: Audience;
}) {
  const said = PER_AUDIENCE[audience];
  return (
    <div className="landing-surface relative bg-[var(--lp-bg-a)] text-[var(--lp-ink)]">
      <style dangerouslySetInnerHTML={{ __html: BORDER_GLOW_CSS }} />
      {/* /welcome?auth=login|signup, for every audience rather than only the
          ones whose page happens to end in the button that used to own it. */}
      <AuthDeepLink />
      {/* ---- the hero: who you are, and what you came here asking ---- */}
      <Sheet tone="bg-[var(--lp-bg-a)]" first>
        <Glow />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(var(--lp-dots)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        />

        <div className="relative mx-auto flex max-w-6xl flex-col px-4 pb-8 pt-2 sm:px-6 lg:pt-2">
          <AudienceHero audience={audience}>
            <SwipeDeck />
          </AudienceHero>

          {/* The full question-and-answer in prose - what screen readers
              hear, and what replaces the deck when the system asks for less
              motion. */}
          <div className="sr-only motion-reduce:not-sr-only">
            <ol className="mt-10 border-y border-[var(--lp-border)]">
              {QA.map((item) => (
                <li
                  key={item.foot}
                  className="group relative grid gap-3 border-b border-[var(--lp-border)] py-8 transition-colors last:border-b-0 hover:bg-[var(--lp-panel)] lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-10 lg:py-10"
                >
                  <div className="min-w-0">
                    <h3 className="font-display text-[1.35rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--lp-ink)] [text-wrap:balance]">
                      &ldquo;{item.quote}&rdquo;
                    </h3>
                    <p
                      className={`mt-3 inline-flex items-center gap-2 text-[0.85rem] font-semibold ${
                        item.earned
                          ? "text-[var(--lp-emerald)]"
                          : "text-[#67e8f9]"
                      }`}
                    >
                      <item.icon size={15} />
                      {item.foot}
                    </p>
                  </div>
                  <p className="min-w-0 text-[0.98rem] leading-relaxed text-[var(--lp-body)]">
                    {item.answer}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* The shelf of what's inside, gliding along the hero's floor:
              real roles interleaved with what there is to explore about
              them. Decorative - pauses on hover so it can be read, and not
              selectable so it never fights the pointer.

              Students only. It is a shelf of jobs somebody might want, which
              is an invitation to browse a career - the wrong offer to make to
              a hiring manager or a placement officer, neither of whom came
              here to explore a role for themselves. */}
          {audience === "student" && (
            <div aria-hidden className="mt-6 select-none">
              <p className="text-center text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--lp-faint)]">
                Inside Ascend · explore career paths
              </p>
              <div className="mt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
                <div className="flex w-max animate-marquee gap-12 hover:[animation-play-state:paused]">
                  {[0, 1].map((copy) => (
                    <ul
                      key={copy}
                      className="flex shrink-0 items-center gap-12"
                    >
                      {ROLES.map((role) => (
                        <li
                          key={role}
                          className="flex items-center gap-3 whitespace-nowrap font-display text-[1rem] font-semibold text-[var(--lp-faint)]"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-teal)]/70" />
                          {role}
                        </li>
                      ))}
                      {INSIDE_PEEKS.map((peek) => (
                        <li
                          key={peek}
                          className="flex items-center gap-3 whitespace-nowrap text-[0.92rem] font-medium text-[var(--lp-emerald)]/75"
                        >
                          <span className="h-1.5 w-1.5 rotate-45 bg-[#34d399]/60" />
                          {peek}
                        </li>
                      ))}
                    </ul>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Sheet>

      {/* Where the hero ends, which is what the slim ask watches for. */}
      <div id="landing-hero-foot" aria-hidden className="h-px" />
      <StickyAsk
        line={said.bar}
        cta={said.barCta}
        href={audience === "student" && signedIn ? "/profile" : said.barHref}
      />

      {/* ---- three beats: the argument, written for whoever is reading ---- */}
      <Sheet tone="bg-[var(--lp-bg-b)]">
        <Glow low />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="reveal-view text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)]">
            {said.beatsTitle}
          </p>
          <ul className="reveal-view mt-5 grid gap-4 sm:grid-cols-3">
            {said.beats.map(([head, body]) => (
              <li
                key={head}
                className="rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-5"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#34d399]/20 text-[var(--lp-emerald)]">
                  <Check size={15} />
                </span>
                <p className="mt-3 text-[1rem] font-semibold text-[var(--lp-ink)]">
                  {head}
                </p>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-[var(--lp-body)]">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Sheet>

      {/* ---- the employer chapter: ledger + funnel, no product UI ----
          An employer landing here knows nothing yet, so nothing here assumes
          product knowledge: the argument is their own ledger, the funnel
          their own pipeline, and the savings chart deliberately unitless -
          the shape of the saving, proven in a pilot, never a claimed number. */}
      {/* Employers only. This sheet is addressed to a hiring manager -
          "We hired - why aren't they productive yet?" - so it is not the
          sheet a student or a placement officer should scroll into. */}
      {audience === "employer" && (
        <>
          <Sheet tone="bg-[var(--lp-bg-b)]">
            <Glow low />
            <div
              id="employers"
              className="relative mx-auto grid max-w-6xl scroll-mt-16 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10"
            >
              <header className="reveal-view min-w-0">
                <p className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-panel)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-teal)] opacity-70" />
                  For employers
                </p>

                <p className="mt-4 text-[0.95rem] italic text-[var(--lp-faint)]">
                  &ldquo;We hired - why aren&rsquo;t they productive yet?&rdquo;
                </p>

                <h2 className="mt-3 max-w-[24ch] font-display text-[clamp(1.5rem,3.4vw,2.2rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-[var(--lp-ink)] [text-wrap:balance]">
                  Hiring&apos;s costliest gap: between the offer letter and a
                  productive employee.
                </h2>
                <p className="mt-3 max-w-[48ch] text-[1rem] leading-relaxed text-[var(--lp-body)]">
                  Thousands of identical resumes, then months of training before
                  a new hire earns their seat. Ascend fills that gap before day
                  one.
                </p>

                {/* The ledger: their hiring, before and after. */}
                <div className="mt-4 grid overflow-hidden rounded-2xl border border-[var(--lp-border)] sm:grid-cols-2">
                  <div className="border-b border-[var(--lp-border)] bg-[#f87171]/[0.04] p-4 sm:border-b-0 sm:border-r">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-faint)]">
                      Hiring today
                    </p>
                    <ul className="mt-3 grid gap-3">
                      {EMPLOYER_CHALLENGES.map((item) => (
                        <li key={item.q} className="flex items-start gap-2.5">
                          <span
                            aria-hidden
                            className="mt-0.5 font-bold text-[#f87171]"
                          >
                            –
                          </span>
                          <p className="text-[0.88rem] leading-snug text-[var(--lp-body)]">
                            {item.q}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-[#34d399]/[0.05] p-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-emerald)]">
                      Hiring from Ascend
                    </p>
                    <ul className="mt-3 grid gap-3">
                      {EMPLOYER_CHALLENGES.map((item) => (
                        <li key={item.a} className="flex items-start gap-2.5">
                          <span className="mt-0.5 shrink-0 text-[#34d399]">
                            <Check size={14} />
                          </span>
                          <p className="text-[0.88rem] leading-snug text-[var(--lp-body-strong)]">
                            {item.a}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </header>

              {/* The funnel and the shape of the savings. */}
              <div className="reveal-view min-w-0">
                {/* 1,000 identical applicants → your bar → ready hires. */}
                <div className="rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-4 text-center">
                  <div
                    aria-hidden
                    className="mx-auto flex max-w-[24rem] flex-wrap justify-center gap-[7px]"
                  >
                    {Array.from({ length: 44 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-[5px] w-[5px] rounded-full bg-white/40"
                        style={{ opacity: 0.25 + ((i * 7) % 10) / 25 }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[0.78rem] text-[var(--lp-faint)]">
                    1,000+ applicants, identical qualifications
                  </p>
                  <div
                    aria-hidden
                    className="relative mx-auto mt-2.5 w-[86%] max-w-[22rem] px-6 py-3 text-white"
                    style={{
                      clipPath: "polygon(0 0, 100% 0, 70% 100%, 30% 100%)",
                      background:
                        "linear-gradient(180deg, #155e63 0%, #0f766e 55%, #059669 100%)",
                    }}
                  >
                    <p className="text-center font-display text-[0.95rem] font-extrabold tracking-[0.22em]">
                      ASCEND
                    </p>
                    <ul className="mt-1 space-y-0.5 text-center text-[0.68rem] font-medium text-white/85">
                      <li>skills demonstrated on real work</li>
                      <li>scored against our standards</li>
                      <li>ranked at the bar you set</li>
                    </ul>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-3">
                    {[
                      ["Student A", 84],
                      ["Student B", 76],
                      ["Student C", 71],
                    ].map(([name, score]) => (
                      <span
                        key={name}
                        className="rounded-xl border border-[#34d399]/40 bg-[#34d399]/10 px-4 py-2 text-center"
                      >
                        <span className="block text-[0.72rem] font-semibold text-[var(--lp-body)]">
                          {name}
                        </span>
                        <span className="block font-display text-[1.2rem] font-semibold leading-tight text-[var(--lp-emerald)]">
                          {score}
                        </span>
                        <span className="block text-[0.58rem] font-bold uppercase tracking-[0.08em] text-[var(--lp-emerald)]/70">
                          productivity readiness
                        </span>
                      </span>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[0.78rem] text-[var(--lp-emerald)]/80">
                    trained on your role · ready for the work from week one
                  </p>
                </div>

                {/* The saving, drawn: productivity against time since offer.
                Two illustrative curves - no units, no invented figures; the
                shaded area between them is the gap Ascend fills, and the
                caption sends the proof to a pilot. */}
                <div className="mt-3 rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-panel)] p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-faint)]">
                    The productivity gap - and the saving
                  </p>
                  <svg
                    viewBox="0 0 420 205"
                    role="img"
                    aria-label="Illustrative chart of productivity against time since offer: a hire today climbs slowly through training and ramp-up, an Ascend hire starts near-productive on day one. The area between the two curves is the gap Ascend fills."
                    className="mt-2 max-h-[13rem] w-full"
                  >
                    <line
                      x1="20"
                      y1="30"
                      x2="20"
                      y2="180"
                      stroke="var(--lp-border)"
                      strokeWidth="1"
                    />
                    <line
                      x1="20"
                      y1="180"
                      x2="405"
                      y2="180"
                      stroke="var(--lp-border)"
                      strokeWidth="1"
                    />
                    <line
                      x1="20"
                      y1="80"
                      x2="405"
                      y2="80"
                      stroke="var(--lp-border)"
                      strokeWidth="1"
                    />
                    <line
                      x1="20"
                      y1="130"
                      x2="405"
                      y2="130"
                      stroke="var(--lp-border)"
                      strokeWidth="1"
                    />
                    {/* the gap between the curves */}
                    <path
                      d="M20,105 C60,62 90,48 130,44 L400,40 L400,46 C370,56 330,84 285,116 C220,163 120,174 20,177 Z"
                      fill="rgba(52,211,153,0.10)"
                    />
                    {/* hiring today: slow climb through training and ramp-up */}
                    <path
                      d="M20,177 C120,174 220,163 285,116 C330,84 370,56 400,46"
                      fill="none"
                      stroke="var(--lp-faint)"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                    />
                    {/* Ascend hire: near-productive from day one */}
                    <path
                      d="M20,105 C60,62 90,48 130,44 L400,40"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2.5"
                    />
                    <circle cx="20" cy="105" r="4" fill="#34d399" />
                    <text
                      x="138"
                      y="30"
                      fill="var(--lp-emerald)"
                      fontSize="11"
                      fontWeight="700"
                    >
                      hired from Ascend
                    </text>
                    <text
                      x="196"
                      y="150"
                      fill="var(--lp-faint)"
                      fontSize="11"
                      fontWeight="600"
                    >
                      hiring today
                    </text>
                    <text
                      x="150"
                      y="96"
                      fill="var(--lp-body)"
                      fontSize="10.5"
                      fontStyle="italic"
                    >
                      the gap Ascend fills - your saving
                    </text>
                    <text x="20" y="196" fill="var(--lp-faint)" fontSize="9.5">
                      day one
                    </text>
                    <text
                      x="405"
                      y="196"
                      fill="var(--lp-faint)"
                      fontSize="9.5"
                      textAnchor="end"
                    >
                      time since offer →
                    </text>
                    <text
                      x="16"
                      y="30"
                      fill="var(--lp-faint)"
                      fontSize="9.5"
                      transform="rotate(-90 16 30)"
                      textAnchor="end"
                    >
                      productivity →
                    </text>
                  </svg>
                  <p className="mt-2 border-t border-[var(--lp-border)] pt-2 text-[0.72rem] leading-relaxed text-[var(--lp-faint)]">
                    Illustrative curves.
                  </p>
                </div>
              </div>
            </div>
          </Sheet>
        </>
      )}

      {/* ---- the cohort, for the audience that has to act on it ---- */}
      {audience === "college" && (
        <Sheet tone="bg-[var(--lp-bg-b)]">
          <Glow low />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <p className="reveal-view mx-auto max-w-[62ch] text-center text-[1rem] leading-relaxed text-[var(--lp-body-strong)]">
              The year group, by how ready they are for the work they are aiming
              at.
            </p>
            <div className="mt-6">
              <CohortReadiness />
            </div>
          </div>
        </Sheet>
      )}

      {/* ---- the network. All three audiences, never for the same reason:
              the line above it is what changes, not the picture. ---- */}
      <Sheet tone="bg-[var(--lp-bg-c)]">
        <Glow low />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <header className="reveal-view mx-auto max-w-[62ch] text-center">
            <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-panel)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-teal)] opacity-70" />
              What Ascend offers
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.4rem,3vw,1.9rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--lp-ink)] [text-wrap:balance]">
              An AI-native talent fulfillment network.
            </h2>
            <p className="mx-auto mt-2 max-w-[54ch] text-[0.95rem] leading-relaxed text-[var(--lp-body)]">
              {said.network}
            </p>
          </header>

          <div className="mt-4">
            <FeatureWall />
          </div>

          {/* Screen readers get the loop as a plain path. */}
          <ol className="sr-only">
            {[
              "Finds the work that fits",
              "Sees the real role - the day, the pay, the ladder",
              "Practises the actual work, scored",
              "Earns a verified record",
              "Sends it to an employer",
              "Shortlisted on evidence",
              "Interviewed - and hired",
              "Starts the job already knowing the work",
              "The next role opens - the loop runs again",
            ].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </Sheet>

      {/* ---- the last word. Every audience gets one; two of them used to
              reach the foot of the page and be asked for nothing. ---- */}
      <section className="relative overflow-hidden border-t border-[var(--lp-border)] bg-[var(--lp-bg-d)]">
        <Glow />
        <div className="relative mx-auto flex max-w-3xl flex-col justify-center px-4 py-24 text-center sm:px-6 lg:py-20">
          <p className="reveal-view text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--lp-teal)]">
            Your career companion
          </p>
          <h2 className="reveal-view mx-auto mt-4 max-w-[18ch] animate-gradient-pan bg-gradient-to-r from-[var(--lp-ink)] via-[var(--lp-teal)] to-[var(--lp-ink)] bg-[length:200%_auto] bg-clip-text font-display text-[clamp(2.2rem,6vw,3.8rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-transparent [text-wrap:balance]">
            {said.askHead}
          </h2>
          <p className="reveal-view mx-auto mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-[var(--lp-body)]">
            {said.askBody}
          </p>
          {audience === "student" ? (
            <LandingCtas signedIn={signedIn} />
          ) : (
            <div className="reveal-view mt-10 flex justify-center">
              <Link
                href={said.barHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--lp-cta-bg)] px-9 py-4 text-[1rem] font-bold text-[var(--lp-cta-ink)] shadow-[0_16px_44px_-12px_rgba(0,0,0,0.65)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hover:translate-y-0"
              >
                {said.barCta}
                <ArrowRight size={17} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
