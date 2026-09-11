import Link from "next/link";
import { BackLink } from "@/components/back-link";

// The one gate, in one place.
//
// Everything under Practice is aimed at a job: the readiness assessment
// measures you against it, missions close the gaps it found, the interview
// asks its questions. Without a chosen role none of them has a subject, and
// what they show instead is a screen describing a thing that cannot happen.
//
// It was enforced on the readiness assessment and nowhere else, so opening
// /interview or /practice/missions directly walked straight past it into a
// placeholder - the rule existed, it was just written out once by hand and
// therefore applied once. This is that screen, extracted, so a page gets the
// gate by using it rather than by remembering to.

export function NeedsRole({
  /** What they were trying to open, named as they would name it. */
  what,
  /** Why this one needs a job in particular. One sentence, specific. */
  because,
  backHref = "/practice",
  backLabel = "Back to Practice",
}: {
  what: string;
  because: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <BackLink fallbackHref={backHref} fallbackLabel={backLabel} />
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
        Choose a job first
      </h1>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-600">
        {what} {because} Pick one in Discover and come back. It takes a few
        minutes, and everything here points at it afterwards.
      </p>
      <Link
        href="/discover"
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-violet px-5 text-[0.88rem] font-bold text-white transition-colors hover:bg-brand-violet-deep"
      >
        Go to Discover
      </Link>
    </main>
  );
}
