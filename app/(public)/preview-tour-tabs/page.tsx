"use client";

// A preview, not a shipped screen: one tour stop split into tabs.
//
// Today a stop is one column and everything is in it - what the job is, why it
// exists, what decides who moves up, how they hire, what it is turning into,
// the ceiling, and the five questions somebody is actually turning over. Nine
// or ten chapters, read top to bottom, and then a question at the bottom
// asking what you made of it.
//
// The case for tabs is that those chapters are not one thing. "What the job
// is" is a description; "what decides who moves up" is advice; "what it looks
// like in banking versus e-commerce" is a comparison; "will my family think
// this is a real job" is personal. Stacked, the later ones are read by nobody,
// because by then it is a wall.
//
// THE COST, SAID OUT LOUD. Tabs hide things. A person who reads one tab and
// answers the question has read a third of the briefing, and the tour's whole
// argument is that the depth is the point. Two things here try to hold that:
// the tab strip says how much is behind each one, and the question at the end
// says which tabs it is about. Whether that is enough is the thing to judge.

import { useState } from "react";
import { ChevronRight } from "@/components/icons";

type Tab = {
  id: string;
  label: string;
  /** What the strip says under the label, so nothing is hidden silently. */
  note: string;
};

const TABS: Tab[] = [
  { id: "role", label: "The role", note: "What the day is" },
  { id: "deeper", label: "Deeper insight", note: "6 things a posting omits" },
  { id: "industries", label: "By industry", note: "4 versions of it" },
  { id: "gettingin", label: "Getting in", note: "5 questions answered" },
];

export default function Page() {
  const [tab, setTab] = useState("role");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Preview · not a shipped screen
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        A tour stop, in tabs
      </h1>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        The same briefing the tour already writes, split by what kind of thing
        each part is. Illustrative content — a real stop is written per role.
      </p>

      {/* --------------------------------------------------------- the stop */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-surface">
        <div className="border-b border-slate-200 p-5">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Retail &amp; e-commerce · Stop 2 of 4
          </p>
          <h2 className="mt-0.5 font-display text-[1.4rem] font-bold tracking-tight text-brand-ink">
            Customer Success Associate
          </h2>
          <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
            Keep customers sorted, and keep them coming back.
          </p>
        </div>

        {/* The strip carries what is behind each tab. A tab that only says
            "Deeper insight" is asking somebody to gamble a click; one that says
            "6 things a posting omits" is telling them what they get. */}
        <div
          role="tablist"
          aria-label="This role"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 p-2"
        >
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={`min-h-14 shrink-0 rounded-xl px-3.5 text-left transition-colors ${
                  on
                    ? "bg-brand-violet/10 text-brand-violet-deep dark:text-brand-violet-soft"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="block text-[0.86rem] font-bold">
                  {t.label}
                </span>
                <span
                  className={`block text-[0.72rem] ${on ? "opacity-80" : "text-slate-400"}`}
                >
                  {t.note}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {tab === "role" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Block title="Where the day goes">
                <Bars
                  rows={[
                    ["With customers", 60, "Face to face and on chat"],
                    ["Fixing and chasing", 25, "Couriers, refunds, records"],
                    ["Writing it down", 15, "So the next person can pick it up"],
                  ]}
                />
              </Block>
              <Block title="What you would actually do">
                <Bullets
                  items={[
                    "Handle queries, complaints and returns in line with policy",
                    "Keep the ticket true when the answer is inconvenient",
                    "Spot the order that has quietly gone wrong before anybody calls",
                  ]}
                />
              </Block>
            </div>
          )}

          {tab === "deeper" && (
            <div className="grid gap-4">
              <Block title="Why this job exists">
                <p className="text-[0.88rem] leading-relaxed text-slate-600">
                  Every other team ships something and moves on. This is the
                  only desk that hears what happened next — which is why the
                  good ones end up deciding what gets fixed first.
                </p>
              </Block>
              <Block title="What decides who moves up">
                <p className="text-[0.88rem] leading-relaxed text-slate-600">
                  In order: keeping a record true when it is inconvenient;
                  saying no without losing the customer; noticing a pattern
                  across tickets nobody asked you to look at.
                </p>
              </Block>
              <Block title="The honest ceiling">
                <p className="text-[0.88rem] leading-relaxed text-slate-600">
                  It does not become engineering, and it does not become
                  strategy without a deliberate move sideways first. Anybody
                  telling you otherwise is recruiting.
                </p>
              </Block>
            </div>
          )}

          {tab === "industries" && (
            <div className="grid gap-3">
              {[
                [
                  "E-commerce",
                  "Refunds, couriers and damaged parcels. Volume is the difficulty — forty tickets before lunch.",
                ],
                [
                  "Banking support",
                  "Mandates and compliance. Volume is lower and the cost of one wrong answer is far higher.",
                ],
                [
                  "SaaS",
                  "Fewer customers, each worth more. You are expected to know the product as well as the people who built it.",
                ],
                [
                  "Healthcare",
                  "Everybody at the desk is having a worse day than you. Composure is most of the job.",
                ],
              ].map(([industry, difference]) => (
                <div
                  key={industry}
                  className="rounded-xl border border-slate-200 p-3.5"
                >
                  <p className="text-[0.84rem] font-bold text-brand-ink">
                    {industry}
                  </p>
                  <p className="mt-1 text-[0.86rem] leading-relaxed text-slate-600">
                    {difference}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "gettingin" && (
            <div className="grid gap-4">
              {[
                [
                  "Can I actually get in?",
                  "Most people here started with no experience of it. What is asked for is a written test and a conversation, not a degree in it.",
                ],
                [
                  "Where are these jobs?",
                  "Bengaluru, Hyderabad, Pune and Gurgaon carry most of the openings, and a growing share are remote-first.",
                ],
                [
                  "What will my family think?",
                  "It is a salaried role at a named company with a title that reads clearly. That is usually the whole of the question.",
                ],
              ].map(([q, a]) => (
                <div key={q}>
                  <p className="text-[0.88rem] font-bold text-brand-ink">{q}</p>
                  <p className="mt-1 text-[0.88rem] leading-relaxed text-slate-600">
                    {a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* The question still ends the stop, and now it has to say which tabs
            it is asking about - otherwise it is asking for a view on things the
            person may never have opened. */}
        <div className="border-t border-slate-200 p-5">
          <p className="text-[0.78rem] text-slate-500">
            After <strong className="font-semibold">The role</strong> and{" "}
            <strong className="font-semibold">Deeper insight</strong>
          </p>
          <p className="mt-1 text-[0.95rem] font-semibold text-brand-ink">
            What do you make of it?
          </p>
          <div className="mt-2 rounded-xl border border-slate-300 bg-surface px-3.5 py-3 text-[0.86rem] text-slate-400">
            A sentence is enough. Nobody else reads it…
          </div>
          <button
            type="button"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-violet px-5 text-[0.86rem] font-bold text-white"
          >
            Next stop
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-5">
        <h2 className="text-[1rem] font-semibold tracking-tight text-slate-900">
          What to judge
        </h2>
        <p className="mt-1.5 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          Tabs hide things. Somebody who reads one tab and answers the question
          has read a quarter of the briefing — and the tour&apos;s whole
          argument is that the depth is the point. Two things here try to hold
          that: the strip says what is behind each tab rather than just naming
          it, and the question says which tabs it is about.
        </p>
        <p className="mt-2 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          It also breaks the current pacing. The stop runs on a reading timer —
          twenty seconds plus twelve per chapter — which assumes everything is
          on screen. With tabs that timer is measuring a page nobody is looking
          at, so it would have to become something else: time on the tabs
          actually opened, or no timer at all and the question available from
          the start.
        </p>
        <p className="mt-2 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          A tab with nothing written for it must not appear at all. Most roles
          have no <em>By industry</em> content yet, and an empty tab advertises
          the gap rather than closing it.
        </p>
      </div>
    </main>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-slate-400">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Bars({ rows }: { rows: Array<[string, number, string]> }) {
  return (
    <ul className="grid gap-2.5">
      {rows.map(([label, share, detail]) => (
        <li key={label}>
          <div className="flex items-baseline justify-between gap-2 text-[0.84rem]">
            <span className="font-medium text-slate-700">{label}</span>
            <span className="shrink-0 font-semibold text-brand-ink">
              {share}%
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-teal"
              style={{ width: `${share}%` }}
            />
          </div>
          <p className="mt-0.5 text-[0.78rem] text-slate-500">{detail}</p>
        </li>
      ))}
    </ul>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-1.5 text-[0.86rem] leading-relaxed text-slate-600">
      {items.map((i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="text-slate-300">
            ·
          </span>
          {i}
        </li>
      ))}
    </ul>
  );
}
