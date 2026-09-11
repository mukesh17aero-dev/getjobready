"use client";

import { useState } from "react";
import { Check, Clock } from "@/components/icons";

// Format D from the formats preview, built for one role so it can be tried
// rather than imagined. Dead preview — nothing is scored or sent.
//
// Two deliberate choices worth keeping if this ships:
//
// Ordering is done with move buttons, not HTML5 drag. Native drag-and-drop
// does not fire on touch at all, so a drag build would be a desktop feature
// wearing a phone layout — and this is a product that has to work at 360px.
// Buttons are also the only version that works from a keyboard.
//
// Nothing here is multiple choice. The evidence is the order they chose and
// the message they wrote, neither of which has a letter to photograph.

type Ticket = {
  id: string;
  subject: string;
  detail: string;
  age: string;
};

const INBOX: Ticket[] = [
  {
    id: "#4412",
    subject: "Order hasn't arrived — 11 customers",
    detail: "Same delayed shipment. One of them has posted about it publicly.",
    age: "2 days",
  },
  {
    id: "#4425",
    subject: "Charged twice for one order",
    detail: "₹4,800 taken twice on Saturday. Customer has rent due.",
    age: "1 day",
  },
  {
    id: "#4358",
    subject: "Renewal call request — Mehta Textiles",
    detail: "Largest account on your list. Contract ends in three weeks.",
    age: "3 days",
  },
  {
    id: "#4401",
    subject: "\"I will be leaving a review about this\"",
    detail: "Angry, second message, about a ₹300 order that arrived late.",
    age: "4 hours",
  },
  {
    id: "#4390",
    subject: "Refund request, day 11 of 14",
    detail: "Inside policy. Straightforward, three minutes of work.",
    age: "2 days",
  },
  {
    id: "#4377",
    subject: "Locked out — password reset not arriving",
    detail: "Cannot access the account at all. Has emailed twice.",
    age: "5 hours",
  },
];

export function WorkSample() {
  const [order, setOrder] = useState<Ticket[]>(INBOX);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  function move(from: number, dir: -1 | 1) {
    const to = from + dir;
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
      {/* scene header */}
      <div className="rounded-xl border border-slate-200 bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
            Day 12 · Customer Success Associate
          </p>
          <span className="inline-flex items-center gap-1.5 text-[0.72rem] text-slate-500">
            <Clock className="h-3.5 w-3.5" />6 min
          </span>
        </div>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-800">
          It is Monday. Forty-one tickets came in over the weekend and these six
          are what is left after the automated replies went out. Priya is in a
          meeting until 11.
        </p>
      </div>

      {/* step switch */}
      <div className="mt-3 flex gap-2">
        {([1, 2] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            aria-current={step === s ? "step" : undefined}
            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-3 text-[0.8rem] font-semibold ${
              step === s
                ? "bg-brand-ink text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200"
            }`}
          >
            {s === 1 ? "1 · Order the queue" : "2 · Write the message"}
          </button>
        ))}
      </div>

      {step === 1 && (
        <section className="mt-3 rounded-xl border border-slate-200 bg-surface p-4">
          <h3 className="text-[0.85rem] font-bold text-brand-ink">
            Put these in the order you would work them
          </h3>
          <p className="mt-1 text-[0.78rem] text-slate-500">
            There is no correct answer being checked against a key. What is read
            is the reasoning your order implies.
          </p>
          <ol className="mt-3 space-y-2">
            {order.map((t, i) => (
              <li
                key={t.id}
                className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[0.7rem] font-bold text-slate-500">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.83rem] font-semibold leading-snug text-brand-ink">
                    {t.subject}
                  </span>
                  <span className="mt-0.5 block text-[0.78rem] leading-snug text-slate-600">
                    {t.detail}
                  </span>
                  <span className="mt-1 block font-mono text-[0.68rem] text-slate-400">
                    {t.id} · waiting {t.age}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${t.subject} up`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    aria-label={`Move ${t.subject} down`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {step === 2 && (
        <section className="mt-3 rounded-xl border border-slate-200 bg-surface p-4">
          <h3 className="text-[0.85rem] font-bold text-brand-ink">
            One message goes to all eleven delayed customers
          </h3>
          <p className="mt-1 text-[0.78rem] leading-snug text-slate-500">
            You do not know the new delivery date yet. One of them has already
            posted about it publicly.
          </p>
          <textarea
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label="The message you would send"
            placeholder="Write it as you would actually send it…"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-[0.85rem] leading-relaxed text-slate-800 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
          />
          <p className="mt-1.5 text-right font-mono text-[0.7rem] text-slate-400">
            {message.trim() === "" ? 0 : message.trim().split(/\s+/).length} words
          </p>
        </section>
      )}

      {/* what it reads */}
      <section className="mt-3 rounded-xl border-2 border-brand-teal/25 bg-teal-50/40 p-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-teal-900">
          What this reads that a card cannot
        </p>
        <ul className="mt-2 space-y-1.5">
          {[
            "Whether money taken twice outranks a large account's renewal",
            "Whether the loudest ticket got priority over the most stuck one",
            "Whether the message admits there is no date yet, or hides it",
            "Whether eleven people were written to as eleven people",
          ].map((t) => (
            <li
              key={t}
              className="flex items-start gap-2 text-[0.82rem] leading-snug text-slate-700"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
