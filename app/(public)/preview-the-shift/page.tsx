import { Shift } from "./shift";

// The answer to "more innovative, engaging, quick, not boring, honest about
// where you stand, not intimidating" — as something to try rather than read.

export const metadata = { title: "Preview — The Shift" };

const WHY = [
  {
    ask: "Not boring",
    how: "Every choice is answered by a consequence, not a tick. The next beat exists because of what you just did, so there is a reason to keep going that a question list cannot manufacture.",
  },
  {
    ask: "Not time-taking",
    how: "Three beats, roughly four minutes. One decision and one line per screen, sized for a thumb at 360px.",
  },
  {
    ask: "Genuinely engaging",
    how: "It is a story with stakes rather than a form. The one-line probes are short enough to answer on a bus and are where the real evidence sits.",
  },
  {
    ask: "Where they stand, honestly",
    how: "The rail fills only with what was actually demonstrated, and the close replays their own decisions. No percentage — a number invites comparison with strangers, which is the intimidating part, not the difficulty.",
  },
  {
    ask: "Not intimidating",
    how: "No visible clock, no right answers revealed, no failure state. Time is recorded and never shown: a countdown quietly changes the thing being measured into nerve.",
  },
  {
    ask: "Still measures something real",
    how: "Choices are recognition, which is cheap. The one line after each is production, which is not. Both are kept, and the pair is what separates two people who tapped the same card.",
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-deep">
        Preview · The Shift
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-4xl">
        A Monday that answers back
      </h1>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-slate-700">
        The card format the stakeholders asked for, with the two things it was
        missing: a consequence after every choice, and one line to own it. Try
        it on a phone — that is the device it was designed for.
      </p>

      <div className="mt-8">
        <Shift />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          Against the brief
        </h2>
        <ul className="mt-4 space-y-2.5">
          {WHY.map((w) => (
            <li
              key={w.ask}
              className="rounded-2xl border border-slate-200 bg-surface p-4"
            >
              <p className="text-[0.85rem] font-bold text-brand-ink">{w.ask}</p>
              <p className="mt-1 text-[0.84rem] leading-relaxed text-slate-600">
                {w.how}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border-2 border-brand-teal/30 bg-teal-50/40 p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-brand-ink">
          The part that also fixes the cheating problem
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-800">
          Branching is the strongest anti-AI property in any of these formats,
          and it comes free with the engagement. Beat three only exists because
          of what happened at beat one, so a photograph of one screen tells a
          model nothing about which path it is on — and there is no answer key to
          pass to next year&rsquo;s students, because no two people sat the same
          sequence.
        </p>
      </section>
    </main>
  );
}
