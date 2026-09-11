import { OpenBook } from "./open-book";

// The differentiator, as something to try. See preview-landscape for why the
// format alone was never going to be one.

export const metadata = { title: "Preview — Open book" };

const SHARED = [
  {
    assumption: "An assessment is a sitting",
    everyone:
      "Arctic Shores, pymetrics and AMCAT all meet a candidate once and produce a snapshot. AMCAT scores are valid for a year on the strength of a single afternoon.",
    us: "The arc already meets somebody across thirty days. Improvement between day 3 and day 18 is a measurement none of them can take, because none of them are there twice.",
  },
  {
    assumption: "AI must be kept out",
    everyone:
      "The whole category is spending its engineering budget on keeping models out of the room — and a paid industry already exists to coach people through the games anyway.",
    us: "Hand them the assistant and measure how well it is used. The way to score badly becomes trusting it, which is the one arms race we win by not entering.",
  },
  {
    assumption: "The output is a score",
    everyone:
      "A number, a percentile, a trait profile. Usually never shown to the candidate at all.",
    us: "The output is what they did and what it showed. Evidence a person can act on, not a grade they can only feel judged by.",
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-deep">
        Preview · Open book
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-4xl">
        The assistant is on. That is the test.
      </h1>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-slate-700">
        Everyone else is trying to keep AI out of the assessment. This one hands
        it over deliberately — and the assistant is confidently wrong about two
        things the brief already told you. Sending its draft unchanged is the
        failure. Try it.
      </p>

      <div className="mt-8">
        <OpenBook />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          Three assumptions everyone else shares
        </h2>
        <ul className="mt-4 space-y-3">
          {SHARED.map((s) => (
            <li
              key={s.assumption}
              className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-5"
            >
              <p className="font-display text-[0.95rem] font-bold text-brand-ink">
                &ldquo;{s.assumption}&rdquo;
              </p>
              <p className="mt-2 text-[0.84rem] leading-relaxed text-slate-600">
                {s.everyone}
              </p>
              <p className="mt-2.5 rounded-lg bg-teal-50/60 px-3 py-2.5 text-[0.84rem] leading-relaxed text-slate-800">
                {s.us}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border-2 border-brand-teal/30 bg-teal-50/40 p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-brand-ink">
          Why a second phone does not help here
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-800">
          The planted errors are not writing mistakes. They are facts about this
          company — a fourteen-day window, a five-day refund, a courier portal
          that is down — which exist only in the brief on the screen. A better
          model on a second device produces a more fluent draft with the same
          invented promise in it, and fails the same way. The cheat makes the
          result worse.
        </p>
      </section>
    </main>
  );
}
