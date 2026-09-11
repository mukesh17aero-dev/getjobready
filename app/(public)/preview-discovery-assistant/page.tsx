"use client";

// The discovery assistant on our own role details - the real RolePreview dialog, with the
// real sections, and no apply button because we are not a hiring platform.
//
// The fixture below is deliberately shaped like a live RoleDetail plus the
// RoleKnowledge the backend does not send yet. That gap is the point of the
// preview: the interface is a week, the knowledge is the product.

import { useRef, useState } from "react";
import { RolePreview } from "@/components/role-preview";
import { DiscoveryAssistant, type RoleKnowledge } from "@/components/discovery-assistant";
import type { RoleDetail } from "@/lib/api";

const ROLE: RoleDetail = {
  roleId: "customer_success_associate",
  sector: "Retail",
  pitch: "The person customers remember, for better or worse.",
  description:
    "You are on the floor when something has gone wrong - a return, a wrong size, a bill that does not add up - and you are also there when someone just wants advice. The job is holding both without dropping either.",
  workMix: [
    { label: "With customers", share: 55, detail: "Face to face, one at a time" },
    { label: "Stock and displays", share: 25, detail: "Counting, moving, tidying" },
    { label: "Billing and systems", share: 20, detail: "Terminal, returns, records" },
  ],
  responsibilities: [
    "Greet and assist customers, understanding what they actually need",
    "Handle queries, complaints and returns in line with store policy",
    "Maintain product knowledge across the full range",
    "Support billing and stock activities as required",
  ],
  skills: [
    { name: "Staying steady", why: "A good share of conversations start annoyed" },
    { name: "Switching", why: "Two people will need you at the same time" },
    { name: "Product recall", why: "Nobody waits while you look it up twice" },
    { name: "Closing politely", why: "Ending a conversation is its own skill" },
  ],
  workContext: {
    environment: "Shop floor, on your feet",
    hours: "Rotational shifts, weekends busiest",
    pace: "Quiet stretches, then all at once",
    team: "Six to ten, one supervisor",
  },
  payMonthly: { min: 14000, max: 20000 },
  payNote:
    "Indicative monthly range for Bengaluru; varies by employer, city and whether incentives are included.",
  growth: [
    { title: "Senior Associate", when: "12 months", pay: { min: 20000, max: 26000 } },
    { title: "Team Lead", when: "24 months", pay: { min: 28000, max: 38000 } },
    { title: "Store Supervisor", when: "3-4 years", pay: { min: 38000, max: 55000 } },
  ],
  hardTruths: [
    "You are the face of mistakes you did not make - a late delivery is not your fault, but you are the one standing there.",
    "Weekends and festivals are the busiest days, and they are the days you will work.",
    "The first six months are repetitive on purpose; the interesting parts come after people trust you.",
  ],
  suitsYouIf: [
    "You stay level when somebody in front of you is upset",
    "You would rather be interrupted all day than sit with one task",
    "You remember faces and what people asked for last time",
  ],
  voices: [],
  voicesIllustrative: true,
};

// What the discovery assistant knows past the record. None of this is in a job description,
// which is exactly why a guide built only on postings has nothing to add.
const KNOWLEDGE: RoleKnowledge = {
  standards: [
    {
      when: "three months",
      looksLike:
        "you stop escalating the easy ones and handle a return start to finish without checking.",
    },
    {
      when: "a year",
      looksLike:
        "you are the one the newer staff ask, and you have started noticing why the same complaint keeps arriving.",
    },
  ],
  tools: [
    "the billing terminal",
    "a returns and exchange system",
    "a basic CRM or customer log",
    "WhatsApp for the store group",
  ],
  industry: [
    {
      heading: "Organised retail keeps hiring at this level",
      detail:
        "chains are still opening stores in tier-two cities, and this is the role they open with.",
    },
    {
      heading: "Quick commerce has changed what the job is",
      detail:
        "more of the simple transactions happen on an app, so the people who come in are the harder, more interesting cases - which raises what is expected of you.",
    },
    {
      heading: "The part that is shrinking",
      detail:
        "purely transactional counter work, where you only scan and bill. Nobody should build a decade on that, and I would rather say so now.",
    },
  ],
  transfers: [
    "operations and hub coordination, where the customer sense is worth more than people expect",
    "inside sales, which pays more and asks for the same steadiness",
    "training and onboarding once you have supervised anyone",
  ],
  ceilings: [
    "It does not become a corporate or head-office job by itself - that takes a deliberate move around the three-year mark, usually into operations or category work.",
    "And it is not a route into anything technical without separate study.",
  ],
  behind: {
    "Handle queries, complaints and returns in line with store policy":
      "This is the line that hides the job. It means saying no to somebody who is already upset, using words that are not yours, and not taking it home. The policy protects you - the difficulty is delivering it like a person rather than a script.",
    "Support billing and stock activities as required":
      "'As required' means the quiet hours. Counting stock nobody will ask you about is most of the first hour and the last one, and it is when people either learn the range properly or do not.",
  },
};

export default function PreviewDiscoveryAssistant() {
  const [open, setOpen] = useState(true);
  const [chosen, setChosen] = useState(false);
  const scroller = useRef<HTMLElement | null>(null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.7rem] font-bold leading-tight text-brand-ink">
        The discovery assistant on our role details
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        The same Role Detail and Reality Check we ship today - the work mix, the
        responsibilities, the pay and the hard parts - with the guide docked
        underneath it, above &ldquo;Choose this role&rdquo;. No apply button:
        this is a companion, not a job board.
      </p>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 min-h-12 rounded-full bg-brand-violet px-6 text-sm font-bold text-white"
        >
          Open the role again
        </button>
      )}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">Try these</h2>
        <ul className="mt-2 grid gap-1.5 text-[0.86rem] leading-relaxed text-slate-600">
          <li>Leave it alone for fifteen seconds - it offers what the page cannot answer.</li>
          <li>Scroll to the bottom without choosing - it names why you have not.</li>
          <li>Scroll back up after reading - it offers to explain the work itself.</li>
          <li>
            Type <strong className="text-brand-ink">&ldquo;will I get this job?&rdquo;</strong>{" "}
            - it refuses, on purpose.
          </li>
        </ul>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">
          What it knows, and where that has to come from
        </h2>
        <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-600">
          Everything in the dialog above already exists in{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.8rem]">RoleDetail</code>.
          It is enough to describe a job and not enough to advise anyone about
          one, so the discovery assistant needs four more things per role - none of which can
          be scraped from a posting:
        </p>
        <ul className="mt-2.5 grid gap-2 text-[0.86rem] leading-relaxed text-slate-700">
          <li>
            <strong className="text-brand-ink">What good looks like</strong> at
            three months and at a year - the difference between competent and
            noticed.
          </li>
          <li>
            <strong className="text-brand-ink">What the industry is doing</strong>{" "}
            to jobs like this, including the parts that are shrinking. Quick
            commerce has already changed what a counter job is.
          </li>
          <li>
            <strong className="text-brand-ink">Where it goes sideways</strong>,
            not only up - what two years of this is worth in operations or
            inside sales.
          </li>
          <li>
            <strong className="text-brand-ink">What it will never become</strong>.
            A guide that cannot disappoint anyone is an advert.
          </li>
        </ul>
        <p className="mt-3 text-[0.86rem] leading-relaxed text-slate-600">
          That is a backend change - one <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.8rem]">knowledge</code>{" "}
          block per role on the role record, written by us and reviewed, with
          the model answering only from it. Roughly a day of work per sector to
          write properly, and it is the whole product.
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">
          The two ways it could lie, and what stops each
        </h2>
        <ul className="mt-2.5 grid gap-2 text-[0.86rem] leading-relaxed text-slate-700">
          <li>
            <strong className="text-brand-ink">A false claim</strong> is a fact
            we do not have - a pay figure, a trend, a number. If we do not know
            it for this role, it says so. One invented figure and everything
            else it says becomes worthless, because the person has tested us.
          </li>
          <li>
            <strong className="text-brand-ink">A false promise</strong> is a
            future we cannot give - a job, a salary, a promotion by a date, or
            &ldquo;you would be great at this&rdquo;. That is the more dangerous
            one: nobody arranges their year around a wrong fact, but they will
            around a promise. So progression is always described as what happens
            to people who do this work, never as what will happen to the reader,
            and the discovery assistant never rates how good they would be.
          </li>
        </ul>
        <p className="mt-3 rounded-xl bg-teal-50 px-4 py-3 text-[0.84rem] leading-relaxed text-teal-900">
          <strong>This is enforced, not intended.</strong> Every answer the
          assistant can give is generated by one exported function, and{" "}
          <code className="rounded bg-white/60 px-1 py-0.5 text-[0.8rem]">
            tests/unit/discovery-assistant.test.ts
          </code>{" "}
          scans all of them for guarantees, flattery and &ldquo;you
          will&rdquo; - and separately proves the detector catches the phrases
          we are worried about, so the test cannot pass by looking the other
          way.
        </p>
      </section>

      {open && (
        <RolePreview
          role={ROLE}
          matchLine="Strong match"
          onClose={() => setOpen(false)}
          onChoose={() => setChosen(true)}
          chosen={chosen}
          bodyRef={scroller}
          assistant={
            <DiscoveryAssistant
              role={ROLE}
              knowledge={KNOWLEDGE}
              scrollRef={scroller}
              onTour={() => undefined}
            />
          }
        />
      )}
    </main>
  );
}
