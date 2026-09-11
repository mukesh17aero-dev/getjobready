"use client";

import { useState } from "react";
import { Check, Mic } from "@/components/icons";

// "The Shift" — a branching Monday, one beat per screen.
//
// The brief was: innovative, engaging for an eighteen-year-old, quick, not
// boring, honest about where they stand, and not intimidating. Four decisions
// drove the design:
//
//   Consequence, not scoring. Every choice is answered by what happened next,
//   not by right/wrong. That is the whole engagement loop — and it is also the
//   strongest anti-AI property here, because beat three only exists because of
//   what you did at beat one. A model handed a screenshot of one beat has no
//   idea which branch it is on.
//
//   One thumb, one beat. A decision is two lines and two or three cards. It
//   reads at 360px, and nothing takes longer than a lift entrance.
//
//   Evidence shown as it is earned. The rail fills with what you have actually
//   demonstrated, in teal, because teal means you earned it. Never a score out
//   of a hundred: a percentage invites comparison to strangers, and that is the
//   intimidating part, not the difficulty.
//
//   No visible clock. The time is recorded and never displayed. A countdown
//   changes what it measures — it starts measuring nerve.

type Choice = {
  label: string;
  outcome: string;
  earns: string[];
};

type Beat = {
  id: string;
  time: string;
  scene: string;
  choices: Choice[];
  probe: string;
};

const SKILLS = ["Prioritising", "Judgement", "Communication", "Ownership"];

const BEATS: Beat[] = [
  {
    id: "b1",
    time: "09:04",
    scene:
      "Forty-one tickets over the weekend. Eleven are the same delayed shipment. Priya is in a meeting until 11.",
    choices: [
      {
        label: "Message all eleven now with what you know",
        outcome:
          "Sent. Two reply inside a minute — one thanks you, one asks why nobody said anything on Saturday.",
        earns: ["Prioritising", "Communication"],
      },
      {
        label: "Find out the new delivery date first",
        outcome:
          "The courier portal is down. It is now 09:31 and the eleven still have not heard from anyone.",
        earns: ["Judgement"],
      },
      {
        label: "Start at the top of the queue and work down",
        outcome:
          "You clear four small tickets. The shipment thread has grown to fourteen people.",
        earns: [],
      },
    ],
    probe: "The one asking why nobody said anything on Saturday — what do you say?",
  },
  {
    id: "b2",
    time: "10:12",
    scene:
      "A customer was charged ₹4,800 twice. Refunds take five days and she says rent is due Wednesday.",
    choices: [
      {
        label: "Refund it and tell her five days, plainly",
        outcome:
          "She is not happy, but she knows where she stands and says so.",
        earns: ["Communication", "Ownership"],
      },
      {
        label: "Refund it and promise you will chase it faster",
        outcome:
          "She is relieved. You do not actually control the payment timeline.",
        earns: ["Communication"],
      },
      {
        label: "Escalate to finance and wait for an answer",
        outcome:
          "Finance replies at 16:40. She has messaged twice more in between.",
        earns: ["Judgement"],
      },
    ],
    probe: "Priya is still in her meeting. Do you interrupt her for this? One line.",
  },
  {
    id: "b3",
    time: "11:48",
    scene:
      "Priya is out. A supplier wants a decision on replacing the delayed stock — a call you have not been given authority to make.",
    choices: [
      {
        label: "Say you cannot authorise it and give a time you will come back",
        outcome:
          "The supplier holds. Priya later says it was the right call.",
        earns: ["Judgement", "Ownership"],
      },
      {
        label: "Make the call — it is obviously the right one",
        outcome:
          "It was the right call. Priya asks who authorised it, and this time it cost nothing.",
        earns: ["Ownership"],
      },
      {
        label: "Tell them to wait until Priya is back",
        outcome:
          "They wait. The replacement stock misses the Tuesday dispatch.",
        earns: [],
      },
    ],
    probe: "What would have made this decision easier to make? One line.",
  },
];

export function Shift() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Choice | null>(null);
  const [line, setLine] = useState("");
  const [earned, setEarned] = useState<string[]>([]);
  const [log, setLog] = useState<Array<{ beat: Beat; choice: Choice }>>([]);

  const beat = BEATS[i];
  const done = i >= BEATS.length;

  function choose(c: Choice) {
    setPicked(c);
    setEarned((e) => Array.from(new Set([...e, ...c.earns])));
  }

  function next() {
    if (picked) setLog((l) => [...l, { beat, choice: picked }]);
    setPicked(null);
    setLine("");
    setI((n) => n + 1);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface">
      {/* Earned rail. Teal only once it is real. */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {SKILLS.map((s) => {
            const on = earned.includes(s);
            return (
              <span
                key={s}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${
                  on
                    ? "bg-brand-teal/15 text-teal-900 ring-1 ring-inset ring-brand-teal/40"
                    : "bg-white text-slate-400 ring-1 ring-inset ring-slate-200"
                }`}
              >
                {on && <Check className="h-3 w-3" />}
                {s}
              </span>
            );
          })}
        </div>
        <p className="mt-1.5 text-[0.7rem] text-slate-500">
          Fills as you show it. Nothing here is a score.
        </p>
      </div>

      {!done && (
        <div className="p-4 sm:p-5">
          <p className="font-mono text-[0.72rem] font-bold text-slate-400">
            {beat.time}
          </p>
          <p className="mt-1.5 text-[0.92rem] leading-relaxed text-brand-ink">
            {beat.scene}
          </p>

          {!picked && (
            <ul className="mt-4 space-y-2">
              {beat.choices.map((c) => (
                <li key={c.label}>
                  <button
                    type="button"
                    onClick={() => choose(c)}
                    className="flex min-h-11 w-full items-center rounded-xl border-2 border-slate-200 px-3.5 py-2.5 text-left text-[0.85rem] leading-snug text-slate-700 hover:border-brand-teal hover:bg-teal-50/40"
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {picked && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border-l-4 border-brand-teal bg-teal-50/50 px-3.5 py-3">
                <p className="text-[0.7rem] font-bold uppercase tracking-wide text-teal-900">
                  What happened
                </p>
                <p className="mt-1 text-[0.86rem] leading-relaxed text-slate-800">
                  {picked.outcome}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <p className="text-[0.82rem] font-semibold text-brand-ink">
                  {beat.probe}
                </p>
                <textarea
                  rows={2}
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  aria-label={beat.probe}
                  placeholder="A line is enough…"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-[0.84rem] text-slate-800 placeholder:text-slate-400"
                />
                <p className="mt-1 flex items-center gap-1.5 text-[0.72rem] text-slate-500">
                  <Mic className="h-3.5 w-3.5" />
                  Speaking counts the same
                </p>
              </div>

              <button
                type="button"
                onClick={next}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-ink px-4 text-[0.86rem] font-semibold text-white"
              >
                {i === BEATS.length - 1 ? "Finish the shift" : "Next"}
              </button>
            </div>
          )}
        </div>
      )}

      {done && (
        <div className="p-4 sm:p-5">
          <h3 className="font-display text-lg font-bold text-brand-ink">
            That was your Monday
          </h3>
          <p className="mt-1.5 text-[0.86rem] leading-relaxed text-slate-600">
            Not a mark. What you did, and what each one showed.
          </p>
          <ol className="mt-4 space-y-2.5">
            {log.map(({ beat: b, choice }) => (
              <li
                key={b.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"
              >
                <p className="font-mono text-[0.7rem] font-bold text-slate-400">
                  {b.time}
                </p>
                <p className="mt-1 text-[0.85rem] font-semibold text-brand-ink">
                  {choice.label}
                </p>
                <p className="mt-1 text-[0.8rem] leading-snug text-slate-600">
                  {choice.earns.length > 0
                    ? `Showed: ${choice.earns.join(", ")}`
                    : "Showed no clear signal — the queue moved, nothing was decided."}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl bg-teal-50/60 px-3.5 py-3 text-[0.84rem] leading-relaxed text-slate-700">
            Four beats, about four minutes. Somebody who took a different path
            at 09:04 did not sit the same assessment you did — which is why
            there is nothing here to pass around.
          </p>
        </div>
      )}
    </div>
  );
}
