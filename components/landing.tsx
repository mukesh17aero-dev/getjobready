import React from "react";
import { FeatureWall } from "@/components/feature-wall";
import { LandingCtas } from "@/components/landing-ctas";
import { SnapStack } from "@/components/snap-stack";
import { Check, Clock, Eye, Spark } from "@/components/icons";

// Sticky-stacked chapters: every section is a full-height sheet, and the
// next chapter slides up and covers it while the covered one recedes into
// the dark (pure CSS scroll timelines - no libraries). Four sheets: the
// question, where it leads, the employer, the start.
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

// One sheet of the stack. Sticky at lg so the next sheet covers it; the
// inner wrapper is what recedes, because a sticky element cannot animate
// its own transform without breaking its stickiness.
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
    <section
      data-sheet
      className="relative lg:sticky lg:top-14 lg:snap-start lg:snap-always"
    >
      <div
        className={`stack-recede relative overflow-hidden ${tone} ${
          first ? "" : "rounded-t-[2.5rem] border-t border-[var(--lp-border)]"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

// The three questions every first career asks - the hero cycles them.
const QUESTIONS = ["What fits me?", "Am I ready?", "Do I stand out?", "What’s my path?"];

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

// The same four questions and answers, cut for the swipe theatre: the
// question you came with is swiped away LEFT; what you leave with is
// swiped RIGHT - the dating-app grammar, spent on a career. Lines stay
// short: a card is on stage for about three seconds.
type SwipeCard = {
  kind: "question" | "answer";
  eyebrow: string;
  title: string;
  line?: string;
  sub?: string;
};

const SWIPES: SwipeCard[] = [
  {
    kind: "question",
    eyebrow: "Sound familiar?",
    title: "“What if I pick something wrong for me?”",
    sub: "Parents say one thing. Friends another. The internet says everything.",
  },
  {
    kind: "answer",
    eyebrow: "With Ascend",
    title: "A direction you can defend",
    line: "A focused assessment reads your potential and identifies the career roles where you can excel.",
    sub: "Every match comes with the reasons behind it - and nothing locks you in.",
  },
  {
    kind: "question",
    eyebrow: "Sound familiar?",
    title: "“I don’t even know what jobs exist for me.”",
    sub: "Job boards show titles. Nobody shows the day behind them.",
  },
  {
    kind: "answer",
    eyebrow: "With Ascend",
    title: "A dictionary of real roles",
    line: "Roles across the market, explained - the real day, the real pay, and where each can accelerate your career.",
    sub: "Frontline white-collar work, mapped end to end.",
  },
  {
    kind: "question",
    eyebrow: "Sound familiar?",
    title: "“Thousands of us are applying for the same jobs.”",
    sub: "Same degree, same resume template, same job boards.",
  },
  {
    kind: "answer",
    eyebrow: "With Ascend",
    title: "A race you can actually win",
    line: "Practise the real work before day one - closing the productivity gap employers actually measure.",
    sub: "Walk in ready to excel at the job, not just interview for it.",
  },
  {
    kind: "question",
    eyebrow: "Sound familiar?",
    title: "“Why should I trust a tool with my career?”",
    sub: "Every app promises a dream job. None of them show their working.",
  },
  {
    kind: "answer",
    eyebrow: "With Ascend",
    title: "Reasons, not promises",
    line: "The reality of each role beyond what the internet shows - then training that makes you ready for it.",
    sub: "And a connection to employers who value a productive candidate from day one.",
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

export function Landing({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="landing-surface relative bg-[var(--lp-bg-a)] text-[var(--lp-ink)]">
      <style dangerouslySetInnerHTML={{ __html: BORDER_GLOW_CSS }} />
      <SnapStack />
      {/* ---- sheet one: the question, and what it becomes ---- */}
      <Sheet tone="bg-[var(--lp-bg-a)]" first>
        <Glow />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(var(--lp-dots)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        />

        <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-6xl flex-col px-4 pb-8 pt-8 sm:px-6 lg:pt-12">
          <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <header className="min-w-0 lg:flex lg:flex-col lg:justify-center">
              <p className="animate-fade-up inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-panel)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-teal)] opacity-70" />
                For students, early careers, and their employers
              </p>

              <h1
                className="animate-fade-up mt-7 font-display text-[clamp(1.9rem,4.3vw,3.1rem)] font-semibold leading-[1.05] tracking-[-0.03em] [text-wrap:balance]"
                style={{ animationDelay: "80ms" }}
              >
                <span className="block text-[var(--lp-body-strong)]">
                  Every career start asks
                </span>
                <span className="relative mt-1 block h-[1.22em] overflow-hidden">
                  <span className="sr-only">
                    What fits me? Am I ready? Do I stand out? What’s my path?
                  </span>
                  <span aria-hidden className="flex animate-words flex-col">
                    {[...QUESTIONS, QUESTIONS[0]].map((q, i) => (
                      <span
                        key={`${q}-${i}`}
                        className="h-[1.22em] bg-gradient-to-r from-[var(--lp-cyan)] via-[var(--lp-teal)] to-[var(--lp-emerald)] bg-clip-text leading-[1.22] text-transparent"
                      >
                        {q}
                      </span>
                    ))}
                  </span>
                </span>
              </h1>

              <p
                className="animate-fade-up mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-[var(--lp-body)]"
                style={{ animationDelay: "160ms" }}
              >
                Choosing a dream career in an AI-squeezed market feels like a
                guess against thousands. Ascend replaces the guess: work that
                fits how you think, a plan to get ready, and proof employers
                trust.
              </p>

            </header>

            {/* The argument, played as a deck inside a phone: the question
                you came with is swiped away left; what Ascend gives you back
                is swiped right - on the device this whole journey will
                actually happen on. Decorative theatre; the full text lives
                in prose below for screen readers and reduced motion. */}
            <div
              className="lp-dark animate-fade-up mx-auto w-full min-w-0 max-w-[19.5rem] motion-reduce:hidden"
              style={{ animationDelay: "200ms" }}
            >
              <div className="lg:[perspective:1600px]">
                <div
                  aria-hidden
                  className="relative rounded-[3rem] border-[10px] border-[#1c2536] bg-[#0a0f1a] ring-1 ring-[var(--lp-border)] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9),0_0_80px_-20px_rgba(45,212,191,0.3)] transition-transform duration-500 ease-out lg:[transform:rotateY(-9deg)_rotateX(4deg)] lg:hover:[transform:none]"
                >
                  {/* Notch. A phone without one reads as a picture frame. */}
                  <span className="absolute left-1/2 top-2.5 z-20 h-6 w-28 -translate-x-1/2 rounded-full bg-[#1c2536]" />
                  {/* Side buttons: the tell that this is hardware. */}
                  <span className="absolute -left-[13px] top-24 h-10 w-[3px] rounded-full bg-[#1c2536]" />
                  <span className="absolute -left-[13px] top-[9.5rem] h-14 w-[3px] rounded-full bg-[#1c2536]" />
                  <span className="absolute -right-[13px] top-32 h-16 w-[3px] rounded-full bg-[#1c2536]" />

                  {/* The screen: cards swipe away inside it and leave
                      through its edge. */}
                  <div className="relative m-1 h-[30rem] overflow-hidden rounded-[2.4rem]">
                    {SWIPES.map((card, i) => (
                      <article
                        key={`${card.kind}-${i}`}
                        style={{ animationDelay: `${i * 6}s` }}
                        className={`absolute inset-0 flex flex-col p-6 pt-14 [animation-fill-mode:both] ${
                          card.kind === "question"
                            ? "animate-swipe-left bg-gradient-to-b from-[#161f2e] to-[#0d141f]"
                            : "animate-swipe-right bg-gradient-to-b from-[#12211f] to-[#0b1613]"
                        }`}
                      >
                        <p
                          className={`text-[0.64rem] font-bold uppercase tracking-[0.18em] ${
                            card.kind === "question"
                              ? "text-[var(--lp-faint)]"
                              : "text-[var(--lp-emerald)]"
                          }`}
                        >
                          {card.eyebrow}
                        </p>
                        <div className="my-auto py-4">
                          <h3 className="font-display text-[1.4rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--lp-ink)] [text-wrap:balance]">
                            {card.title}
                          </h3>
                          {card.line && (
                            <p className="mt-2.5 text-[0.95rem] leading-relaxed text-[var(--lp-body)]">
                              {card.line}
                            </p>
                          )}
                          {card.sub && (
                            <p className="mt-3 border-l-2 border-[var(--lp-border)] pl-3 text-[0.88rem] leading-relaxed text-[var(--lp-faint)]">
                              {card.sub}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span
                            className={`grid h-11 w-11 place-items-center rounded-full border text-[0.85rem] ${
                              card.kind === "question"
                                ? "border-[var(--lp-border)] text-[var(--lp-body-strong)]"
                                : "border-[var(--lp-border)] text-[var(--lp-faint)]"
                            }`}
                          >
                            ✕
                          </span>
                          <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[var(--lp-faint)]">
                            swipe
                          </span>
                          <span
                            className={`grid h-11 w-11 place-items-center rounded-full ${
                              card.kind === "answer"
                                ? "bg-[#34d399]/25 text-[var(--lp-emerald)]"
                                : "bg-[var(--lp-panel)] text-[var(--lp-faint)]"
                            }`}
                          >
                            <Check size={15} />
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
              <div
                aria-hidden
                className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[0.78rem] text-[var(--lp-faint)]"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-[var(--lp-border)] text-[0.7rem] text-[var(--lp-body)]">
                    ✕
                  </span>
                  the question you came with
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#34d399]/20 text-[var(--lp-emerald)]">
                    <Check size={12} />
                  </span>
                  what you leave with
                </span>
              </div>
            </div>
          </div>

          {/* The full question-and-answer in prose - what screen readers
              hear, and what replaces the deck when the system asks for less
              motion. */}
          <div className="sr-only motion-reduce:not-sr-only">
            <ol className="mt-10 border-y border-[var(--lp-border)]">
              {QA.map((item, i) => (
                <li
                  key={item.foot}
                  className="group relative grid gap-3 border-b border-[var(--lp-border)] py-8 transition-colors last:border-b-0 hover:bg-[var(--lp-panel)] lg:grid-cols-[6rem_1.05fr_1fr] lg:items-start lg:gap-10 lg:py-10"
                >
                  <span
                    aria-hidden
                    className="select-none bg-gradient-to-b from-white/30 to-white/5 bg-clip-text font-display text-[2.8rem] font-bold leading-none tracking-tight text-transparent lg:pl-5"
                  >
                    0{i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[1.35rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--lp-ink)] [text-wrap:balance]">
                      &ldquo;{item.quote}&rdquo;
                    </h3>
                    <p
                      className={`mt-3 inline-flex items-center gap-2 text-[0.85rem] font-semibold ${
                        item.earned ? "text-[var(--lp-emerald)]" : "text-[#67e8f9]"
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
              selectable so it never fights the pointer. */}
          <div aria-hidden className="mt-6 select-none">
            <p className="text-center text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--lp-faint)]">
              Inside Ascend · explore career paths
            </p>
            <div className="mt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
              <div className="flex w-max animate-marquee gap-12 hover:[animation-play-state:paused]">
                {[0, 1].map((copy) => (
                  <ul key={copy} className="flex shrink-0 items-center gap-12">
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

        </div>
      </Sheet>

      {/* ---- the employer chapter: ledger + funnel, no product UI ----
          An employer landing here knows nothing yet, so nothing here assumes
          product knowledge: the argument is their own ledger, the funnel
          their own pipeline, and the savings chart deliberately unitless -
          the shape of the saving, proven in a pilot, never a claimed number. */}
      <Sheet tone="bg-[var(--lp-bg-b)]">
        <Glow low />
        <div
          id="employers"
          className="relative mx-auto grid max-w-6xl scroll-mt-16 items-center gap-10 px-4 py-12 sm:px-6 lg:min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:py-8"
        >
          <header className="reveal-view min-w-0">
            <p className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-panel)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-teal)] opacity-70" />
              For employers
            </p>

            <p className="mt-4 text-[0.95rem] italic text-[var(--lp-faint)]">
              &ldquo;We hired - why aren&rsquo;t they productive
              yet?&rdquo;
            </p>

            <h2 className="mt-3 max-w-[24ch] font-display text-[clamp(1.5rem,3.4vw,2.2rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-[var(--lp-ink)] [text-wrap:balance]">
              Hiring&apos;s costliest gap: between the offer letter and a
              productive employee.
            </h2>
            <p className="mt-3 max-w-[48ch] text-[1rem] leading-relaxed text-[var(--lp-body)]">
              Thousands of identical resumes, then months of training before a
              new hire earns their seat. Ascend fills that gap before day one.
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
                      <span aria-hidden className="mt-0.5 font-bold text-[#f87171]">
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
                trained on your role · productive from day one
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
                <line x1="20" y1="30" x2="20" y2="180" stroke="var(--lp-border)" strokeWidth="1" />
                <line x1="20" y1="180" x2="405" y2="180" stroke="var(--lp-border)" strokeWidth="1" />
                <line x1="20" y1="80" x2="405" y2="80" stroke="var(--lp-border)" strokeWidth="1" />
                <line x1="20" y1="130" x2="405" y2="130" stroke="var(--lp-border)" strokeWidth="1" />
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
                <text x="138" y="30" fill="var(--lp-emerald)" fontSize="11" fontWeight="700">
                  hired from Ascend
                </text>
                <text x="196" y="150" fill="var(--lp-faint)" fontSize="11" fontWeight="600">
                  hiring today
                </text>
                <text x="150" y="96" fill="var(--lp-body)" fontSize="10.5" fontStyle="italic">
                  the gap Ascend fills - your saving
                </text>
                <text x="20" y="196" fill="var(--lp-faint)" fontSize="9.5">
                  day one
                </text>
                <text x="405" y="196" fill="var(--lp-faint)" fontSize="9.5" textAnchor="end">
                  time since offer →
                </text>
                <text x="16" y="30" fill="var(--lp-faint)" fontSize="9.5" transform="rotate(-90 16 30)" textAnchor="end">
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

      {/* ---- what Ascend offers: the network, then the machine ---- */}
      <Sheet tone="bg-[var(--lp-bg-c)]">
        <Glow low />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:flex lg:min-h-[calc(100dvh-3.5rem)] lg:flex-col lg:justify-center lg:py-5">
          <header className="reveal-view mx-auto max-w-[62ch] text-center">
            <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--lp-border)] bg-[var(--lp-panel)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-teal)] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-teal)] opacity-70" />
              What Ascend offers
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.4rem,3vw,1.9rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--lp-ink)] [text-wrap:balance]">
              An AI-native talent fulfillment network.
            </h2>
            <p className="mx-auto mt-2 max-w-[54ch] text-[0.9rem] leading-relaxed text-[var(--lp-body)]">
              Students build verified, job-ready skills. Employers hire on
              evidence, not resumes. One network closes the gap between hired
              and productive.
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
              "Productive from day one",
              "The next role opens - the loop runs again",
            ].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </Sheet>

      {/* ---- the last word ---- */}
      {/* Not sticky: the story's final sheet scrolls into place and stays. */}
      <section data-sheet className="relative overflow-hidden border-t border-[var(--lp-border)] bg-[var(--lp-bg-d)] lg:snap-start lg:snap-always">
        <Glow />
        <div className="relative mx-auto flex max-w-3xl flex-col justify-center px-4 py-24 text-center sm:px-6 lg:min-h-[calc(100dvh-3.5rem)] lg:py-16">
          <p className="reveal-view text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--lp-teal)]">
            Your career companion
          </p>
          <h2 className="reveal-view mx-auto mt-4 max-w-[16ch] animate-gradient-pan bg-gradient-to-r from-[var(--lp-ink)] via-[var(--lp-teal)] to-[var(--lp-ink)] bg-[length:200%_auto] bg-clip-text font-display text-[clamp(2.2rem,6vw,3.8rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-transparent [text-wrap:balance]">
            Your dream career, built together.
          </h2>
          <p className="reveal-view mx-auto mt-5 max-w-[44ch] text-[1rem] leading-relaxed text-[var(--lp-body)]">
            Ascend starts with where you are: the roles that fit you, a plan
            sized to you, practice that makes you ready, and proof employers
            trust. From the first question onward, your career has someone in
            its corner.
          </p>
          <LandingCtas signedIn={signedIn} />
        </div>
      </section>
    </div>
  );
}
