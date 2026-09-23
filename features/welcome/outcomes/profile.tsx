"use client";

// Worked outputs: the professional profile.

// ------------------------------------------------------- profile builder

import { SAMPLE_PROFILE } from "@/features/profile";
import { LinkedInPreview } from "@/features/profile";
/** The sentence everything else is written from. */
export function ProfileIdentity() {
  return (
    <div className="rounded-xl border border-brand-teal/40 bg-teal-50/50 p-3">
      <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-teal-800">
        Who you are, professionally
      </p>
      <p className="mt-1 font-display text-[0.92rem] font-bold leading-snug text-brand-ink">
        {SAMPLE_PROFILE.identity}
      </p>
      <p className="mt-1.5 text-[0.7rem] leading-snug text-slate-600">
        Everything below follows from this one sentence. If it is wrong, nothing
        under it will be right — rewrite rather than patching the sections.
      </p>
      <p className="mt-1.5 text-[0.66rem] text-slate-500">
        Written from 9 things on your record, 4 of them proven.
      </p>
    </div>
  );
}

/** Scribe on the left, the profile as LinkedIn shows it on the right. */
export function ProfileCompare() {
  return (
    <div className="grid gap-2">
      <div className="rounded-xl border border-slate-200 bg-surface p-2.5">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-violet-deep">
          Work on it with Scribe
        </p>
        <div className="mt-1.5 grid gap-1.5">
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-2.5 py-1.5 text-[0.7rem] leading-relaxed text-teal-900">
            The About is too long — cut it to three sentences
          </p>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-2.5 py-1.5">
            <p className="text-[0.7rem] leading-relaxed text-slate-700">
              Done — it opens with the simulation now and the store job is one
              sentence.
            </p>
          </div>
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-teal-50 px-2.5 py-1.5 text-[0.7rem] leading-relaxed text-teal-900">
            Say I led a team of ten
          </p>
          <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 px-2.5 py-1.5">
            <p className="text-[0.7rem] leading-relaxed text-slate-700">
              I have left that out.
            </p>
            <p className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-[0.66rem] leading-snug text-amber-900">
              Nothing in your record says you led anybody. Tell me who and when
              and I will put it in.
            </p>
          </div>
        </div>
        <div className="relative mt-1.5">
          <div className="min-h-[2.2rem] rounded-lg border border-slate-300 py-1.5 pl-2 pr-9 text-[0.68rem] text-slate-400">
            Put the store job in the headline
          </div>
          <span
            aria-hidden
            className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-brand-violet text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </span>
        </div>
      </div>

      <div className="scale-[0.92] origin-top">
        <LinkedInPreview draft={SAMPLE_PROFILE.suggested} name="Anjali Kumar" />
      </div>
      <p className="text-[0.64rem] text-slate-400">
        Example — yours would be written from your own record.
      </p>
    </div>
  );
}

/** Skills, and the sections it declines to write. */
export function ProfileSkills() {
  return (
    <div className="grid gap-2">
      <div className="rounded-xl border border-slate-200 bg-surface p-3">
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-400">
          Yours now
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {["MS Office", "Communication", "Leadership", "Hardworking"].map(
            (s) => (
              <span
                key={s}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-500 line-through"
              >
                {s}
              </span>
            ),
          )}
        </div>
        <p className="mt-1.5 text-[0.66rem] leading-snug text-slate-500">
          Three of these nobody can check, and one is not a skill.
        </p>

        <p className="mt-2.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-teal-800">
          Written from your record
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {(SAMPLE_PROFILE.suggested.skills ?? []).map((s) => (
            <span
              key={s}
              className="rounded-full bg-teal-50 px-2 py-0.5 text-[0.65rem] font-semibold text-teal-800"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <p className="rounded-xl bg-amber-50 px-3 py-2 text-[0.7rem] leading-snug text-amber-900">
        <strong className="font-semibold">Where it declines to write:</strong> a
        section your record cannot support comes back empty and says so, rather
        than being filled with something that sounds right.
      </p>
    </div>
  );
}
