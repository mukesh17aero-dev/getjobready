"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "@/components/icons";

// The argument, played as a deck inside a phone: the question you came with
// is swiped away LEFT; what Ascend gives you back is swiped RIGHT - the
// dating-app grammar, spent on a career.
//
// It used to be eight cards each running the same 72-second CSS animation on
// a staggered delay: no state, no JavaScript, and nothing anybody could do
// with it. The two marks at the foot of a card are the most obviously
// pressable things on the screen and they were painted on, so the deck read
// as a control that did not respond.
//
// So it advances on its own AND on a tap. The clock restarts whenever a card
// is dismissed, so taking it over never leaves you half a card behind.
//
// Still decorative: the whole phone is aria-hidden and the same argument is
// in prose below it, which is what a screen reader and anybody on reduced
// motion get. The two marks are therefore deliberately not focusable - a
// focusable control inside aria-hidden is a trap, and this one leads nowhere
// that the prose does not already go.

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
    line: "Explore roles that fit your interests and strengths, with a clear reason behind every match.",
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

/** How long a card holds the stage before it leaves on its own. */
const HOLD_MS = 9000;
/** How long the card takes to leave. Matches the CSS. */
const EXIT_MS = 450;

export function SwipeDeck() {
  const [at, setAt] = useState(0);
  // The card on its way out, kept mounted until its animation finishes so
  // the one behind is revealed rather than appearing on a blank screen.
  const [leaving, setLeaving] = useState<{
    index: number;
    dir: "left" | "right";
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = SWIPES[at]!;

  const advance = useCallback(
    (dir: "left" | "right") => {
      setLeaving({ index: at, dir });
      setAt((i) => (i + 1) % SWIPES.length);
    },
    [at],
  );

  // One clock, restarted by every arrival however it was caused - so a card
  // dismissed by hand still gets a full turn on stage before the next.
  useEffect(() => {
    timer.current = setTimeout(
      () => advance(SWIPES[at]!.kind === "question" ? "left" : "right"),
      HOLD_MS,
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [at, advance]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), EXIT_MS);
    return () => clearTimeout(t);
  }, [leaving]);

  return (
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

          {/* The screen: cards swipe away inside it and leave through its
              edge. */}
          <div className="relative m-1 h-[30rem] overflow-hidden rounded-[2.4rem]">
            {leaving && (
              <Card
                card={SWIPES[leaving.index]!}
                className={
                  leaving.dir === "left"
                    ? "animate-card-off-left z-10"
                    : "animate-card-off-right z-10"
                }
              />
            )}
            <Card card={card} className="animate-card-rise" />

            {/* The controls, lifted out of the card so there is one row
                rather than one per card - and so the row does not ride the
                leaving card off the edge under the thumb that pressed it. */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-6 pt-2">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => advance("left")}
                className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full border text-[0.85rem] transition-transform active:scale-90 ${
                  card.kind === "question"
                    ? "border-[var(--lp-border)] text-[var(--lp-body-strong)] hover:border-[var(--lp-body)]"
                    : "border-[var(--lp-border)] text-[var(--lp-faint)] hover:text-[var(--lp-body)]"
                }`}
              >
                ✕
              </button>
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[var(--lp-faint)]">
                tap to swipe
              </span>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => advance("right")}
                className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-transform active:scale-90 ${
                  card.kind === "answer"
                    ? "bg-[#34d399]/25 text-[var(--lp-emerald)] hover:bg-[#34d399]/40"
                    : "bg-[var(--lp-panel)] text-[var(--lp-faint)] hover:text-[var(--lp-body)]"
                }`}
              >
                <Check size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ card, className }: { card: SwipeCard; className: string }) {
  return (
    <article
      className={`absolute inset-0 flex flex-col p-6 pb-20 pt-14 [animation-fill-mode:both] ${
        card.kind === "question"
          ? "bg-gradient-to-b from-[#161f2e] to-[#0d141f]"
          : "bg-gradient-to-b from-[#12211f] to-[#0b1613]"
      } ${className}`}
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
    </article>
  );
}
