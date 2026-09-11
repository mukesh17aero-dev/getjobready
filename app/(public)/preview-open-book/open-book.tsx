"use client";

import { useState } from "react";
import { Check, Spark } from "@/components/icons";

// "Open book, and the book is watched."
//
// Every competitor is spending its engineering budget keeping AI out of the
// assessment. This one hands the student an assistant and measures how well
// they use it — which inverts the arms race completely, because the way to
// score badly here is to trust the model.
//
// The mechanic that makes it work: the assistant is confidently wrong in a way
// the scene has already given the student everything they need to catch. It
// promises a delivery date nobody knows, and it invents a policy. A student
// who pastes the draft straight through fails on the strongest possible
// evidence — their own submission. A student with a second phone and a better
// model fails identically, because the error is not in the writing, it is in
// the facts of THIS company, which no external model has.
//
// This is the one format where using more AI makes the result worse.

const ASSISTANT_DRAFT = `Hi there,

Thanks so much for your patience! We're really sorry about the delay with your recent order.

We've looked into it and your parcel is now on its way — it should reach you by Wednesday at the latest. If it hasn't arrived by then, just reply here and we'll issue an immediate full refund, no questions asked, as per our 30-day guarantee.

Thanks again for being such a valued customer!`;

// The two things planted in it. Both are contradicted by the brief the student
// has already read — this is a comprehension test wearing an AI costume.
const PLANTS = [
  {
    id: "date",
    quote: "it should reach you by Wednesday at the latest",
    why: "Nobody knows the new date. The courier portal is down — the brief says so. The assistant invented a promise you would have to break.",
  },
  {
    id: "policy",
    quote: "an immediate full refund … as per our 30-day guarantee",
    why: "The refund window is fourteen days, not thirty, and refunds take five working days. Both are in the brief. The assistant invented a policy that does not exist.",
  },
];

type Stage = "brief" | "drafting" | "reviewed";

export function OpenBook() {
  const [stage, setStage] = useState<Stage>("brief");
  const [draft, setDraft] = useState("");
  const [asked, setAsked] = useState(false);
  const [caught, setCaught] = useState<string[]>([]);

  function ask() {
    setAsked(true);
    setDraft(ASSISTANT_DRAFT);
  }

  function toggle(id: string) {
    setCaught((c) =>
      c.includes(id) ? c.filter((x) => x !== id) : [...c, id],
    );
  }

  const edited = asked && draft.trim() !== ASSISTANT_DRAFT.trim();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
          Day 12 · Customer Success Associate
        </p>
        <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate-800">
          Eleven customers are waiting on the same delayed shipment.{" "}
          <strong>The courier portal is down, so there is no new date yet.</strong>{" "}
          Refunds run on a <strong>fourteen-day window</strong> and take{" "}
          <strong>five working days</strong> to land. Write the one message that
          goes to all eleven.
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-violet/10 px-2.5 py-1 text-[0.72rem] font-semibold text-brand-violet-deep">
          <Spark className="h-3.5 w-3.5" />
          The assistant is on. Using it is expected.
        </p>
      </div>

      {stage === "brief" && (
        <div className="p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setStage("drafting")}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-ink px-4 text-[0.86rem] font-semibold text-white"
          >
            Start
          </button>
        </div>
      )}

      {stage === "drafting" && (
        <div className="space-y-3 p-4 sm:p-5">
          {!asked && (
            <button
              type="button"
              onClick={ask}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-violet/40 bg-brand-violet/5 px-4 text-[0.85rem] font-semibold text-brand-violet-deep"
            >
              <Spark className="h-4 w-4" />
              Ask the assistant to draft it
            </button>
          )}

          {asked && (
            <p className="rounded-lg bg-brand-violet/10 px-3 py-2 text-[0.76rem] text-brand-violet-deep">
              The assistant drafted this. It is yours to send — edit anything you
              want.
            </p>
          )}

          <textarea
            rows={11}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="The message you would send"
            placeholder="Write it yourself, or ask the assistant first…"
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[0.84rem] leading-relaxed text-slate-800 placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={() => setStage("reviewed")}
            disabled={draft.trim() === ""}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-ink px-4 text-[0.86rem] font-semibold text-white disabled:opacity-40"
          >
            Send to all eleven
          </button>
        </div>
      )}

      {stage === "reviewed" && (
        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <h3 className="font-display text-lg font-bold text-brand-ink">
              The assistant got two things wrong
            </h3>
            <p className="mt-1 text-[0.84rem] leading-relaxed text-slate-600">
              Both were contradicted by the brief you were given. Tick the ones
              you spotted before you sent it.
            </p>
          </div>

          <ul className="space-y-2.5">
            {PLANTS.map((p) => {
              const on = caught.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    aria-pressed={on}
                    className={`w-full rounded-xl border-2 p-3.5 text-left ${
                      on
                        ? "border-brand-teal bg-teal-50/60"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <span className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                          on ? "bg-brand-teal text-white" : "bg-slate-100"
                        }`}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span>
                        <span className="block text-[0.84rem] font-semibold italic text-brand-ink">
                          &ldquo;{p.quote}&rdquo;
                        </span>
                        <span className="mt-1 block text-[0.82rem] leading-snug text-slate-600">
                          {p.why}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rounded-xl border-2 border-brand-teal/30 bg-teal-50/40 p-4">
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-teal-900">
              What this sitting read
            </p>
            <ul className="mt-2 space-y-1.5 text-[0.83rem] leading-snug text-slate-700">
              <li>
                {asked
                  ? "You reached for the assistant — expected, and not a mark against you."
                  : "You wrote it yourself without asking. Also fine; the assistant is an option, not a requirement."}
              </li>
              <li>
                {edited
                  ? "You changed what it gave you rather than sending it through."
                  : asked
                    ? "You sent the assistant's draft unchanged — including a delivery date nobody could promise."
                    : "Nothing was taken from the assistant, so there was nothing to check."}
              </li>
              <li>
                Caught {caught.length} of {PLANTS.length} invented facts.
              </li>
            </ul>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-600">
              The skill being measured is not writing. It is whether you check
              what a confident machine hands you before you put your name on it —
              which is now most of the job.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
