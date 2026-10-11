"use client";

// What an industry is, for somebody who has never heard of it.
//
// The ask is the right one: a person who does not know what "Logistics &
// E-commerce" means cannot possibly say whether it interests them, and a
// three-word caption does not tell them. What they need is prose - what the
// work is, how the sector got here, where it seems to be going, and what that
// means for somebody starting now.
//
// The honesty problem is the whole of the difficulty. Three of those four are
// claims about the real world: how an industry has grown, what it employs, what
// it will look like in five years. Nobody can derive those from a role
// catalogue, and a screen that writes them anyway is inventing statistics about
// a young person's future. So this component does two separate things and never
// blurs them:
//
//   Written  When the backend sends an IndustryBrief, the prose is rendered as
//            written, with its sources shown. That is somebody's researched
//            claim, attributed.
//
// And where there is no brief, it says so, naming exactly what is missing. An
// empty space with a reason is worth more than a filled one with a guess.
//
// What it deliberately does NOT do is describe the industry by summarising its
// roles - the pay span, where the day goes, what people find hard. That is the
// roles talking about themselves, it is listed underneath this panel anyway,
// and it is not an answer to "what is this industry".

import type { IndustryBrief } from "@/lib/api";

export function IndustryBriefPanel({
  title,
  caption,
  brief,
}: {
  title: string;
  caption: string;
  brief?: IndustryBrief;
}) {
  return (
    <div className="grid gap-5">
      <p className="text-[0.95rem] font-medium leading-snug text-brand-ink">
        {caption}.
      </p>

      {brief ? (
        <div className="grid gap-4">
          {brief.illustrative && (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-[0.75rem] leading-snug text-slate-600">
              <strong className="font-semibold">Illustrative:</strong> this is
              sample text written to show what an industry introduction will
              say. It is not researched and carries no sources - a written and
              checked version replaces it before anyone relies on it.
            </p>
          )}
          <Section title={`What ${title.toLowerCase()} actually is`}>
            {brief.what}
          </Section>
          <Section title="How it got here">{brief.changed}</Section>
          <Section title="Where it is heading">{brief.heading}</Section>
          <Section title="What that means if you are starting now">
            {brief.starting}
          </Section>
          {brief.sources && brief.sources.length > 0 && (
            <p className="text-[0.75rem] leading-relaxed text-slate-500">
              Sources: {brief.sources.join("; ")}.
            </p>
          )}
        </div>
      ) : null}

      {!brief && (
        <p className="rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-[0.82rem] leading-relaxed text-amber-900">
          <strong className="font-semibold">Not written yet:</strong> how fast
          this industry is growing, how many people it employs, and what it is
          likely to look like in five years. Those are claims about the real
          world and they need a source, so this space stays empty until somebody
          has written and checked them. We would rather leave it blank than fill
          it with a number nobody can stand behind.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[0.9rem] font-bold text-brand-ink">{title}</h3>
      <p className="mt-1 text-[0.88rem] leading-relaxed text-slate-600">
        {children}
      </p>
    </section>
  );
}
