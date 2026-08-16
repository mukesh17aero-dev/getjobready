import Link from "next/link";
import type { NextStep } from "@/lib/next-step";
import { ArrowRight } from "@/components/icons";

// The one ask on a screen, in the order a person actually asks their own
// questions: why does this matter, why me, what do I do.
//
// It is deliberately the only thing on the page styled like this. A screen
// with two of these has two primary actions, which is the same as having none.

export function NextStepCard({ step }: { step: NextStep }) {
  return (
    <section
      aria-label="Your next step"
      className="relative overflow-hidden rounded-3xl bg-brand-panel px-5 py-6 text-white sm:px-8 sm:py-8"
    >
      {/* Depth, not decoration: one soft light source so the panel reads as a
          surface rather than a flat block of ink. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-violet/25 blur-3xl"
      />

      <div className="relative">
        <p className="max-w-[46ch] text-[0.85rem] leading-relaxed text-white/60">
          {step.stake}
        </p>

        <h2 className="display mt-3 text-[1.9rem] text-white sm:text-[2.4rem]">
          {step.title}
        </h2>

        <p className="mt-3 max-w-[52ch] border-l-2 border-brand-teal-soft/70 pl-3.5 text-[0.92rem] leading-relaxed text-white/80">
          {step.because}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={step.href}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[0.92rem] font-bold text-brand-ink transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hover:translate-y-0"
          >
            {step.action}
            <ArrowRight size={17} />
          </Link>
          <span className="text-[0.8rem] text-white/50">
            About {step.minutes} minutes
          </span>
        </div>
      </div>
    </section>
  );
}
