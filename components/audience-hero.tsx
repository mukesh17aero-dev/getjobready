"use client";

import { AudienceTabs } from "@/components/audience-tabs";

// The first sheet of the welcome screen, owned by whichever audience is
// selected in the header bar. The headline, the promise and the button all
// belong to that audience, and each button goes to that audience's own home.
//
// The switch itself lives in components/audience-tabs.tsx, in the header -
// this component only reads the result.
//
// Students keep the sheet they had - the rotating question headline and the
// phone deck, passed in as children. The other two get a single centred
// column, because the deck tells a student's story and showing it to a
// placement officer would be telling them the wrong one.
//
// The hero has no button. It had one, and it was the reason nothing below it
// was ever read: the people it was for pressed it in the first screen, and
// everything under it was written for the few who scrolled past a decision
// they had already made. The ask now lives in two places that are not the
// same ask - StickyAsk, which arrives the moment this hero leaves, and the
// full ask at the foot of the page. What is left here is a reason to keep
// going.

const QUESTIONS = [
  "What fits me?",
  "Am I ready?",
  "Do I stand out?",
  "What’s my path?",
];

type Audience = "student" | "college" | "employer";

const PITCH: Record<
  Exclude<Audience, "student">,
  { head: string; body: string }
> = {
  college: {
    head: "See where your year group actually stands.",
    body: "Readiness across a cohort, measured from work students were scored on rather than from what they say about themselves, early enough in the year to change the outcome.",
  },
  employer: {
    head: "Hire on what they did, not what they wrote.",
    body: "Candidates arrive with a record of work that was observed and marked, so a screening decision rests on evidence instead of a resume's self-description.",
  },
};

/**
 * Which tab to open on. Read from ?for= on the server and passed down, so a
 * link in a deck or an intro email lands a placement officer on their own
 * page rather than on the student one with a tab they have to go and find.
 */
export type { Audience };

export function AudienceHero({
  audience,
  children,
}: {
  audience: Audience;
  /** The phone deck. Shown to students only. */
  children: React.ReactNode;
}) {
  const student = audience === "student";

  return (
    <div className="flex flex-1 flex-col">
      {/* ---- the switch: widest thing on the sheet, above everything ---- */}
      <div className="animate-fade-up">
        <AudienceTabs active={audience} />
      </div>

      <div
        className={`grid flex-1 items-start gap-12 lg:items-center lg:gap-10 ${
          student ? "lg:grid-cols-[1.05fr_0.95fr]" : ""
        }`}
      >
        <header
          className={`min-w-0 lg:flex lg:flex-col lg:justify-center ${
            student ? "" : "mx-auto max-w-3xl text-center"
          }`}
        >
          {student ? (
            <>
              <h1
                className="animate-fade-up font-display text-[clamp(1.9rem,4.3vw,3.1rem)] font-semibold leading-[1.05] tracking-[-0.03em] [text-wrap:balance]"
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
                Chasing a dream career in a competitive, AI-driven market is
                challenging - thousands chase the same opportunity. Ascend
                clears your path: work that fits how you think, a plan to get
                ready, and proof employers trust.
              </p>
            </>
          ) : (
            <>
              <h1
                className="animate-fade-up font-display text-[clamp(1.9rem,4.3vw,3.1rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--lp-body-strong)] [text-wrap:balance]"
                style={{ animationDelay: "80ms" }}
              >
                {PITCH[audience].head}
              </h1>
              <p
                className="animate-fade-up mx-auto mt-6 max-w-[52ch] text-[1.05rem] leading-relaxed text-[var(--lp-body)]"
                style={{ animationDelay: "160ms" }}
              >
                {PITCH[audience].body}
              </p>
            </>
          )}

          {/* ---- not an action: a reason to keep going ---- */}
          <p
            className={`mt-9 inline-flex items-center gap-2 border-b border-[var(--lp-border)] pb-1 text-[0.78rem] font-bold uppercase tracking-[0.16em] text-[var(--lp-faint)] ${
              student ? "" : "mx-auto"
            }`}
          >
            Here is how it works
            <span aria-hidden>&darr;</span>
          </p>
        </header>

        {student && children}
      </div>
    </div>
  );
}
