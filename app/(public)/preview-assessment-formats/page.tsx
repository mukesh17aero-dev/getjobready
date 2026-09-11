import { Check, Clock, Mic } from "@/components/icons";

// Four assessment formats, mocked so they can be compared by eye rather than
// by description. Dead preview page — nothing is wired to a backend.
//
// This page exists to answer a specific piece of feedback: show the scenario
// visually, put the questions on cards, let people pick an option. Format A is
// that request, built properly rather than strawmanned.
//
// The argument the page makes is that the request is right about the problem
// and wrong about the fix. The problem is real: typing paragraphs into a phone
// is punishing, and a wall of text does not look like a job. But picking from
// four cards measures whether somebody RECOGNISES a good answer, and every
// employer question worth asking is about whether they can PRODUCE one. The two
// come apart badly — recognising the right call in a refund dispute is a
// fortnight of training, making it under pressure is the actual job.
//
// It also collides with the malpractice work: multiple choice is the single
// most AI-gameable format that exists. One photograph of the screen returns a
// letter in three seconds, with no writing to disguise and no reasoning to own.
// Adopting A wholesale would make the integrity problem materially worse.
//
// C is the recommendation: keep the visual scene and the cards, because those
// solve the real complaint, then charge one line for the choice.

export const metadata = { title: "Preview — Assessment formats" };

type Score = 1 | 2 | 3;

const DOTS: Record<Score, string> = {
  1: "bg-rose-400",
  2: "bg-amber-400",
  3: "bg-teal-500",
};

function Meter({ label, score }: { label: string; score: Score }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[0.78rem] text-slate-600">{label}</span>
      <span className="flex shrink-0 gap-1" aria-label={`${score} out of 3`}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-5 rounded-full ${i <= score ? DOTS[score] : "bg-slate-200"}`}
          />
        ))}
      </span>
    </div>
  );
}

function Frame({
  tag,
  title,
  children,
}: {
  tag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <p className="mb-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
        {tag} · {title}
      </p>
      <div className="rounded-xl border border-slate-200 bg-surface p-3.5 sm:p-4">
        {children}
      </div>
    </div>
  );
}

const SCENE =
  "Forty-one tickets came in over the weekend. Eleven are the same delayed shipment. Your buddy Priya is in a meeting until 11.";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-deep">
        Preview · Assessment formats
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-4xl">
        Four ways to ask the same scene
      </h1>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-slate-700">
        Every format below asks about the same Monday morning, so the difference
        you are seeing is the format and nothing else. Each is scored on what it
        actually measures, how easily a model answers it for you, and how it
        feels on a phone.
      </p>

      {/* ---------------------------------------------------------------- A */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-display text-xl font-bold text-brand-ink">
            A · Visual scene, pick a card
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-inset ring-slate-300">
            What was asked for
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          The scene is a picture, the options are cards, one tap answers it.
        </p>

        <div className="mt-4">
          <Frame tag="Day 12" title="The weekend queue">
            <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 text-[0.72rem] font-medium text-white/70 sm:h-32">
              [ illustration: an inbox at 41 unread ]
            </div>
            <p className="mt-3 text-[0.85rem] leading-relaxed text-slate-800">
              {SCENE}
            </p>
            <p className="mt-3 text-[0.8rem] font-semibold text-brand-ink">
              What do you do first?
            </p>
            <ul className="mt-2.5 grid gap-2">
              {[
                "Answer the eleven shipment tickets with one update",
                "Work the queue oldest first",
                "Wait for Priya at 11",
                "Escalate the shipment to the supplier",
              ].map((o) => (
                <li key={o}>
                  <span className="flex min-h-11 items-center rounded-xl border border-slate-200 px-3.5 text-[0.83rem] text-slate-700">
                    {o}
                  </span>
                </li>
              ))}
            </ul>
          </Frame>
        </div>

        <div className="mt-4 grid gap-2.5 rounded-2xl border border-slate-200 bg-surface p-4 sm:grid-cols-3 sm:gap-x-6">
          <Meter label="Measures real skill" score={1} />
          <Meter label="Resists AI" score={1} />
          <Meter label="Works on a phone" score={3} />
        </div>
        <p className="mt-3 rounded-xl bg-rose-50/70 px-4 py-3 text-[0.85rem] leading-relaxed text-slate-700">
          <strong className="text-rose-900">The problem.</strong> This measures
          whether somebody recognises a good answer when it is placed in front of
          them, which is not the thing an employer is buying. It is also the most
          AI-gameable format there is — one photograph of this screen returns
          &ldquo;the first one&rdquo; in seconds, with nothing to disguise. Every
          candidate who cheats scores full marks, and we cannot tell them apart
          from the ones who did not.
        </p>
      </section>

      {/* ---------------------------------------------------------------- B */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-display text-xl font-bold text-brand-ink">
            B · Open response
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-inset ring-slate-300">
            Built today
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          The scene is text, the answer is theirs to write.
        </p>

        <div className="mt-4">
          <Frame tag="Day 12" title="The weekend queue">
            <p className="text-[0.85rem] leading-relaxed text-slate-800">
              {SCENE} Decide the order they get worked, write the message that
              goes to the eleven, and say what you would change so this does not
              happen again.
            </p>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <p className="text-[0.8rem] italic text-slate-400">
                Their answer, typed…
              </p>
              <div className="mt-6 flex items-center gap-2 text-[0.72rem] text-slate-400">
                <Clock className="h-3.5 w-3.5" />4 min
              </div>
            </div>
          </Frame>
        </div>

        <div className="mt-4 grid gap-2.5 rounded-2xl border border-slate-200 bg-surface p-4 sm:grid-cols-3 sm:gap-x-6">
          <Meter label="Measures real skill" score={3} />
          <Meter label="Resists AI" score={2} />
          <Meter label="Works on a phone" score={1} />
        </div>
        <p className="mt-3 rounded-xl bg-amber-50/70 px-4 py-3 text-[0.85rem] leading-relaxed text-slate-700">
          <strong className="text-amber-900">The problem.</strong> The evidence
          is genuinely good — this is production, not recognition. But typing
          three paragraphs on a phone is punishing, and it is pasteable in one
          move. The feedback is right that this is too heavy; it is wrong about
          which part to cut.
        </p>
      </section>

      {/* ---------------------------------------------------------------- C */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-display text-xl font-bold text-brand-ink">
            C · Pick a card, then own it
          </h2>
          <span className="rounded-full bg-brand-teal/15 px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-teal-900 ring-1 ring-inset ring-brand-teal/40">
            Recommended
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          The visual scene and the cards survive intact. The choice costs one
          line — and the follow-up is built from the card they picked.
        </p>

        <div className="mt-4">
          <Frame tag="Day 12" title="The weekend queue">
            <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 text-[0.72rem] font-medium text-white/70 sm:h-32">
              [ illustration: an inbox at 41 unread ]
            </div>
            <p className="mt-3 text-[0.85rem] leading-relaxed text-slate-800">
              {SCENE}
            </p>
            <ul className="mt-3 grid gap-2">
              {[
                { t: "Answer the eleven with one update", on: true },
                { t: "Work the queue oldest first", on: false },
                { t: "Wait for Priya at 11", on: false },
              ].map((o) => (
                <li key={o.t}>
                  <span
                    className={`flex min-h-11 items-center gap-2.5 rounded-xl border-2 px-3.5 text-[0.83rem] ${
                      o.on
                        ? "border-brand-teal bg-teal-50/70 font-semibold text-teal-900"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {o.on && <Check className="h-4 w-4 shrink-0" />}
                    {o.t}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3.5 rounded-xl border-2 border-brand-teal/30 bg-teal-50/40 px-3.5 py-3">
              <p className="text-[0.78rem] font-bold text-teal-900">
                One line: what makes the other ten wait?
              </p>
              <p className="mt-2 text-[0.8rem] italic text-slate-400">
                Twenty words, or hold to speak…
              </p>
              <div className="mt-2 flex items-center gap-2 text-[0.72rem] text-slate-500">
                <Mic className="h-3.5 w-3.5" />
                <span>Speaking counts the same as typing</span>
              </div>
            </div>
          </Frame>
        </div>

        <div className="mt-4 grid gap-2.5 rounded-2xl border border-slate-200 bg-surface p-4 sm:grid-cols-3 sm:gap-x-6">
          <Meter label="Measures real skill" score={3} />
          <Meter label="Resists AI" score={2} />
          <Meter label="Works on a phone" score={3} />
        </div>
        <p className="mt-3 rounded-xl bg-teal-50/70 px-4 py-3 text-[0.85rem] leading-relaxed text-slate-700">
          <strong className="text-teal-900">Why this one.</strong> The card is
          the cheap part and it is where the format the stakeholders want lives.
          The line is where the evidence is: two people who tapped the same card
          for different reasons are not the same hire, and only this format can
          tell them apart. Twenty words is nothing to type on a phone, and it
          gives the integrity probe something real to push on.
        </p>
      </section>

      {/* ---------------------------------------------------------------- D */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-brand-ink">
          D · Do the actual work
        </h2>
        <p className="mt-2 max-w-2xl text-[0.88rem] leading-relaxed text-slate-600">
          No question at all. Order the real queue, send the real message.
        </p>

        <div className="mt-4">
          <Frame tag="Day 12" title="The weekend queue">
            <p className="text-[0.8rem] font-semibold text-brand-ink">
              Drag these into the order you would work them
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {[
                "#4412 — shipment delayed, 11 customers",
                "#4390 — refund, 2 days old",
                "#4401 — angry review threatened",
                "#4377 — password reset",
              ].map((t, i) => (
                <li
                  key={t}
                  className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5"
                >
                  <span className="font-mono text-[0.7rem] font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <span className="text-[0.8rem] text-slate-700">{t}</span>
                  <span aria-hidden className="ml-auto text-slate-300">
                    ⠿
                  </span>
                </li>
              ))}
            </ul>
          </Frame>
        </div>

        <div className="mt-4 grid gap-2.5 rounded-2xl border border-slate-200 bg-surface p-4 sm:grid-cols-3 sm:gap-x-6">
          <Meter label="Measures real skill" score={3} />
          <Meter label="Resists AI" score={3} />
          <Meter label="Works on a phone" score={2} />
        </div>
        <p className="mt-3 rounded-xl bg-teal-50/70 px-4 py-3 text-[0.85rem] leading-relaxed text-slate-700">
          <strong className="text-teal-900">The strongest evidence here.</strong>{" "}
          There is no text to paste and no letter to photograph — a model would
          have to be told the whole board and then drive it. It is the most work
          to build, and it only suits scenes with a manipulable artefact, so it
          belongs on two or three days of the arc rather than all of them.
        </p>
      </section>

      {/* Verdict */}
      <section className="mt-12 rounded-2xl border-2 border-brand-teal/30 bg-teal-50/40 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          What I would put in front of them
        </h2>
        <p className="mt-2.5 text-[0.9rem] leading-relaxed text-slate-800">
          Take the feedback seriously and reject its conclusion. They are right
          that the current sitting is too heavy on a phone and does not look like
          a job. They are wrong that four cards fixes it — that trades the only
          thing an employer is buying for a format a photograph defeats in three
          seconds.
        </p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-800">
          Ship <strong>C</strong> as the spine of the arc, with{" "}
          <strong>D</strong> on the two or three days that have a real artefact
          and <strong>B</strong> kept for day 30 alone, where the whole point is
          to speak for yourself. Nobody loses the visual scene or the cards. What
          changes is that a tap stops being the whole answer.
        </p>
      </section>
    </main>
  );
}
