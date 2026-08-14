import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Aurora } from "@/components/aurora";
import { FeatureDemos } from "@/components/feature-demos";
import { EmployerDemos } from "@/components/employer-demos";

// `Promise` is a global; the trailing underscore keeps this readable without
// shadowing it.
//
// The page commits to one visual idea: you arrive in the dark and the product
// is the lit thing in front of you. Every other career site in this market is
// black type on white, so the fastest way to look like none of them is to stop
// being a document. Below the hero the page returns to light, which is where
// reading happens.
export function Landing({ signedIn }: { signedIn: boolean }) {
  return (
    <div>
      {/* ---- the dark ---- */}
      <section className="relative overflow-hidden bg-brand-panel">
        <Aurora />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-12 lg:pt-16">
          <header className="min-w-0 animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-teal-soft backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-teal-soft opacity-70" />
              </span>
              For students and early career professionals
            </p>

            {/* Editorial scale. The line length is capped in characters, not
                pixels, so it breaks in the same place at every size. */}
            {/* The invitation, which is the product's own shape: the person
                supplies who they are, Ascend does the placing. It asks for
                something and says what it gives back in the same breath, so
                the ask never arrives on its own. */}
            <h1 className="mt-6 max-w-[13ch] text-[clamp(2.2rem,6.2vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white [text-wrap:balance]">
              Tell us who you are.
            </h1>
            <p className="mt-3 max-w-[17ch] text-[clamp(1.7rem,4.8vw,2.7rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-brand-teal-soft [text-wrap:balance]">
              We&apos;ll help you build a professional career.
            </p>

            {/* Ends on staying, not on matching. A job board stops at the
                match; the thing being sold here is everything after it. */}
            <p className="mt-6 max-w-[46ch] text-[1.02rem] leading-relaxed text-white/65">
              Ascend finds the roles that suit how you think — then stays with
              you through getting ready, practising, and proving you can do the
              work.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href={signedIn ? "/profile" : "/signup"}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[0.95rem] font-bold text-brand-ink transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hover:translate-y-0"
              >
                Start with you
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/login"
                className="text-[0.9rem] text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                I already have an account
              </Link>
            </div>

            {/* The second door, not a scroll hint. A page with two audiences
                should offer both at the top rather than hoping the second one
                keeps reading — and naming who it is for is what makes an
                employer take it, while telling a student that employers are on
                the other side of this. */}
            <a
              href="#employers"
              className="group mt-7 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 py-2 pl-4 pr-3 text-[0.86rem] text-white/70 backdrop-blur transition-colors hover:border-white/35 hover:text-white"
            >
              Hiring for frontline roles?
              <span className="font-semibold text-brand-teal-soft">
                See the employer side
              </span>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-white/70 transition-transform group-hover:translate-y-0.5">
                <span className="block rotate-90">
                  <ArrowRight size={13} />
                </span>
              </span>
            </a>
          </header>

          {/* The whole product, lit, floating in the dark — one rail rather
              than a page to scroll. Everything Ascend does is reachable from
              here without leaving the first screen. */}
          <div
            className="min-w-0 animate-fade-up lg:mt-0"
            style={{ animationDelay: "140ms" }}
          >
            <FeatureDemos />
          </div>
        </div>

      </section>

      {/* ---- the other side of the network ----
          Built as the mirror of the hero rather than as a different kind of
          section: same full-bleed ground, same container, same two columns,
          same rail on the right. A hairline is the only thing marking where one
          audience ends and the other begins. */}
      <section
        id="employers"
        aria-label="For employers"
        className="relative overflow-hidden bg-brand-panel scroll-mt-16"
      >
        <Aurora variant="low" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-12 lg:pt-16">
          <header className="min-w-0 animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-teal-soft backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-teal-soft opacity-70" />
              </span>
              For employers
            </p>

            <h2 className="mt-6 max-w-[14ch] text-[clamp(2.2rem,5.4vw,3.3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white [text-wrap:balance]">
              See what they can do before you interview them.
            </h2>

            <p className="mt-6 max-w-[46ch] text-[1.02rem] leading-relaxed text-white/65">
              Frontline hiring runs on resumes that all read the same. Ascend
              candidates arrive with a Readiness Passport: the role they trained
              for, the missions they were scored on, and the gaps they closed —
              evidence you can open, not claims you take on trust.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href="mailto:hello@trygetjobready.ai?subject=Hiring%20from%20Ascend"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[0.95rem] font-bold text-brand-ink transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hover:translate-y-0"
              >
                Talk to us about hiring
                <ArrowRight size={17} />
              </a>
              <span className="text-[0.86rem] text-white/45">
                You only ever see a passport a candidate sent you.
              </span>
            </div>
          </header>

          <div
            className="min-w-0 animate-fade-up"
            style={{ animationDelay: "140ms" }}
          >
            <EmployerDemos />
          </div>
        </div>
      </section>
    </div>
  );
}
