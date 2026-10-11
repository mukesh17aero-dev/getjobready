"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { RoleBrief } from "./role-brief";
import { SAMPLE_FIT } from "./samples";

// The fit read-out, shown as a sample to somebody who has not signed in.
//
// It is an example and it says so before it is read, because the real one is
// written from their own tour - the roles they walked and what they said
// leaving each - and they have not taken one yet.
//
// What is deliberately NOT here is a fit score or a personality read
// presented as this person's. Discovery has been told one thing by a
// signed-out visitor - the industry they picked - and writing an analysis of
// somebody off the back of that is the fastest way to teach them that nothing
// on the page means anything. Hence: a labelled example, every line of which
// names the act it rests on.
//
// The account is asked for here, once, and for a reason that is true: the
// specific version of this needs somewhere to keep what they said.

function signUpHref(): string {
  const here =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/";
  return `/welcome?auth=signup&next=${encodeURIComponent(here)}`;
}

export function WhyThisRole() {
  return (
    <section className="mt-8 rounded-2xl border border-brand-teal/40 bg-brand-teal-deep/[0.05] p-5">
      <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-teal-800">
        Why this role fits you
      </h2>

      {/* The real read-out component on sample data, rather than a drawing of
          one: what is promised here is exactly what arrives. Labelled, and
          labelled first - an example that has to be worked out from context
          has already been read as a claim about the person. */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-surface p-4">
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-[0.78rem] leading-snug text-slate-600">
          <strong className="font-semibold">An example</strong> - written from
          somebody else&apos;s tour, not yours. Yours would name the roles you
          walked and quote what you said about them.
        </p>
        <RoleBrief brief={SAMPLE_FIT} />
      </div>
      <Link
        href={signUpHref()}
        className="mt-3.5 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      >
        Create an account
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}
