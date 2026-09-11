import { ShiftGame } from "./game";

// A real-time job, playable, with no questions in it. See preview-landscape
// for why "a game" on its own is not a differentiator — pymetrics and Arctic
// Shores are already there, and there is a paid industry coaching people
// through both. What is not taken is a game that IS the role.

export const metadata = { title: "Preview — The shift, as a game" };

const APART = [
  {
    them: "Abstract games — inflate a balloon, remember a card order",
    us: "The actual queue of the actual role. Nothing to translate, and nothing that feels like a psychology experiment you did not agree to.",
  },
  {
    them: "Measures traits by proxy, then tells you nothing",
    us: "Measures what you reached for and how fast you improved, then shows you both. The student is the one who gets the readout.",
  },
  {
    them: "One sitting, one number, valid for a year",
    us: "Three rounds of the same loop. The gap between the first and the last IS the score — and it is the only one that means anything for somebody with no track record.",
  },
  {
    them: "A prep industry exists to coach the games",
    us: "Practising this makes you better at the job. If somebody grinds it until they are good at triage under load, we have not been cheated — that was the point.",
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-deep">
        Preview · The shift, as a game
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-4xl">
        No questions. Just more work than time.
      </h1>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-slate-700">
        Ninety seconds of play, in three rounds. Things arrive faster than
        anyone can handle them, which is the honest shape of the job — and it is
        why what you reach for first is worth reading. Best on a phone.
      </p>

      <div className="mt-8">
        <ShiftGame />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          Fit and potential are not the same measurement
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-surface p-4">
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-500">
              Fit · what you reach for
            </p>
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-700">
              At this speed nobody has time to perform, so the order things get
              handled is an honest read of what a person actually thinks
              matters. The one who always goes to the angriest customer and the
              one who protects the biggest account are both right — and they
              belong in different rooms.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-surface p-4">
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-500">
              Potential · the slope
            </p>
            <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-700">
              Round one measures experience, which an eighteen-year-old has none
              of and cannot be blamed for. Round three against round one
              measures how fast they learn a job. For somebody with no track
              record that is the only number worth having, and a one-shot
              sitting structurally cannot produce it.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          Where this sits against the game-based incumbents
        </h2>
        <ul className="mt-4 space-y-2.5">
          {APART.map((a) => (
            <li
              key={a.them}
              className="rounded-2xl border border-slate-200 bg-surface p-4"
            >
              <p className="text-[0.82rem] leading-snug text-slate-500">
                <span className="font-semibold text-slate-400">Them · </span>
                {a.them}
              </p>
              <p className="mt-1.5 rounded-lg bg-teal-50/60 px-3 py-2 text-[0.84rem] leading-relaxed text-slate-800">
                <span className="font-semibold text-teal-900">Us · </span>
                {a.us}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border-2 border-brand-teal/30 bg-teal-50/40 p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-brand-ink">
          What it would take, honestly
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-800">
          One loop per role family, not per role — a queue-under-load loop
          covers support, operations and admin between them, with different
          cards in it. That is three or four loops to open most of the
          catalogue, and each is real engineering rather than content.
        </p>
        <p className="mt-3 text-[0.88rem] leading-relaxed text-slate-800">
          The scoring has to move to the backend, and the slope has to be
          calculated there rather than in the browser, or the number that ends
          up on a passport was computed on the candidate&rsquo;s own device.
        </p>
      </section>
    </main>
  );
}
