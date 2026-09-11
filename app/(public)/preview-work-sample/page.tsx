import { WorkSample } from "./work-sample";

// Format D from /preview-assessment-formats, built out for one role so it can
// be tried on a phone rather than argued about in the abstract.

export const metadata = { title: "Preview — Work sample" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-deep">
        Preview · Work sample
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-4xl">
        No questions. Just Monday.
      </h1>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-slate-700">
        The same Day 12 scene as the other formats, for a Customer Success
        Associate — except nothing is asked. The queue is real, the ordering is
        the answer, and the message is the artefact. Try it on a phone.
      </p>

      <div className="mt-8">
        <WorkSample />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-brand-ink">
          Why this resists a model
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
          There is no letter to photograph. To cheat it, somebody must describe
          six tickets to a model, read back an order, and apply it — slower than
          thinking, under a clock. The message can still be pasted, which is
          exactly where the follow-up probe earns its place: one question about
          the order they chose, and a pasted answer has nothing behind it.
        </p>
        <p className="mt-3 text-[0.88rem] leading-relaxed text-slate-700">
          The build cost is honest: this only suits scenes with something real
          to manipulate. It belongs on two or three days of the arc, not thirty.
        </p>
      </section>
    </main>
  );
}
