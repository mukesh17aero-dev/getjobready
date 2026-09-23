"use client";

// Worked outputs: the role readiness assessment.

// ---- role readiness assessment --------------------------------------------
//
// Three close-ups of the one feature under Practice that is actually built: a
// situation as it arrives, the help beside it, and the reading that comes back.
//
// Everything here is drawn with the same tokens as the real screens, and the
// content is illustrative - it is a worked example belonging to nobody, which
// is what the panel's caption says. No score is presented as anybody's, and no
// count of users appears, because those are the two places a preview turns
// into a claim.

import { Clock } from "@/components/ui/icons";
/** A situation, as it lands: a day, a company, and something that happened. */
export function ReadinessScene() {
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Zolvit Technologies · Day 8
        </p>
        <span className="inline-flex items-center gap-1 text-[0.62rem] font-semibold tabular-nums text-slate-500">
          <Clock size={10} />
          14:12 left
        </span>
      </div>
      <p className="mt-0.5 text-[0.85rem] font-bold leading-snug text-brand-ink">
        The refund you cannot give.
      </p>
      <p className="mt-1 text-[0.7rem] leading-snug text-slate-600">
        A customer wants a refund eleven days into a fourteen-day window, and
        the courier note says the item arrived damaged. The policy covers one of
        those two things. Handle it.
      </p>
      <div className="mt-2 min-h-[3.6rem] rounded-lg border border-slate-300 px-2.5 py-2 text-[0.72rem] leading-relaxed text-slate-500">
        Thanks for calling, and I am sorry the blender turned up in that state.
        The damage is on the courier note, so this one is on us either way…
      </div>
      <p className="mt-1 text-[0.64rem] text-slate-500">
        What you write is the answer. Nothing here is multiple choice.
      </p>
    </div>
  );
}

/** The help beside the work, and the fact that using it is counted, not penalised. */
export function ReadinessHelp() {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/45 px-2.5 py-1 text-[0.66rem] font-bold text-brand-teal-deep">
          Ask Priya
          <span className="rounded-full bg-brand-teal/20 px-1.5 text-[0.6rem]">
            2 left
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-violet/45 px-2.5 py-1 text-[0.66rem] font-bold text-brand-violet-deep">
          Ask the AI assistant
          <span className="rounded-full bg-brand-violet/20 px-1.5 text-[0.6rem]">
            3 left
          </span>
        </span>
      </div>
      <div className="rounded-xl border border-slate-200 bg-surface p-3">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-teal-deep">
          Priya · two years in this job
        </p>
        <div className="mt-2 grid gap-1.5">
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-100 px-2.5 py-1.5 text-[0.7rem] leading-snug text-slate-700">
            Do I just refund it?
          </p>
          <p className="max-w-[90%] rounded-2xl rounded-tl-sm bg-brand-teal/10 px-2.5 py-1.5 text-[0.7rem] leading-snug text-slate-800">
            The courier note changes which rule applies — that is the bit
            everyone misses. What are you going to lead with?
          </p>
        </div>
      </div>
      <p className="text-[0.64rem] leading-snug text-slate-500">
        Using them is expected. What gets read is when you reached and what you
        did with the answer — not how often.
      </p>
    </div>
  );
}

/** The reading that comes back: a score, a shape, and the reason behind both. */
export function ReadinessReport() {
  const skills: Array<[string, number]> = [
    ["Handling a complaint", 74],
    ["Keeping the record true", 61],
    ["Working with AI", 68],
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-surface p-3">
      <div className="flex items-center gap-3">
        {/* The panel is small, so the ring is drawn at panel scale rather than
            pulled in at the size the fit page needs. */}
        <div
          role="img"
          aria-label="Productive readiness 68 out of 100"
          className="relative h-14 w-14 shrink-0"
        >
          <div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(var(--color-brand-violet) 68%, var(--color-slate-200) 0)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-[5px] grid place-items-center rounded-full bg-surface text-[0.95rem] font-bold text-slate-900"
          >
            68
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-400">
            Productive readiness
          </p>
          <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-600">
            Held the policy line and said what happens next. The record you left
            behind is where it thins out.
          </p>
        </div>
      </div>
      <ul className="mt-2.5 grid gap-1.5">
        {skills.map(([skill, score]) => (
          <li key={skill}>
            <div className="flex items-baseline justify-between gap-2 text-[0.68rem]">
              <span className="font-medium text-slate-700">{skill}</span>
              <span className="font-semibold text-slate-900">{score}</span>
            </div>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-violet"
                style={{ width: `${score}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-slate-100 pt-1.5 text-[0.62rem] leading-snug text-slate-500">
        Skills the work never called on are left out, not scored zero. Every
        number quotes the writing it came from.
      </p>
    </div>
  );
}
