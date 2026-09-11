import { Check, Clock, Eye, Mic, Spark } from "@/components/icons";

// Six answers to "how do we stop somebody cheating the assessment". Dead
// preview page — nothing here is wired to a backend.
//
// The premise the page argues, because getting this wrong wastes a quarter:
// in a browser app with no native client and no third-party proctoring, you
// cannot PREVENT malpractice. A second phone pointed at the screen defeats
// every lockdown ever shipped, and it is the specific attack we were asked
// about. So the goal is not prevention. It is to make the cheat cost more
// than the answer, and to make the evidence we keep hard to fake.
//
// The options are ordered weakest to strongest on exactly that test.

export const metadata = { title: "Preview — Assessment integrity" };

type Verdict = "theatre" | "partial" | "strong";

const VERDICT: Record<Verdict, { label: string; chip: string }> = {
  theatre: {
    label: "Theatre",
    chip: "bg-rose-50 text-rose-800 ring-rose-600/25",
  },
  partial: {
    label: "Partial",
    chip: "bg-amber-50 text-amber-900 ring-amber-600/25",
  },
  strong: {
    label: "Strong",
    chip: "bg-teal-50 text-teal-800 ring-teal-600/25",
  },
};

type Option = {
  n: string;
  name: string;
  how: string;
  catches: string;
  misses: string;
  verdict: Verdict;
  camera: boolean;
  cost: string;
};

const OPTIONS: Option[] = [
  {
    n: "01",
    name: "Lockdown the page",
    how: "Block copy and paste, force fullscreen, warn on tab switch, disable right-click.",
    catches: "Nothing an adult is stopped by. It raises the effort of the laziest possible cheat by about four seconds.",
    misses: "The exact attack we were asked about. A phone camera never touches the page, so the page cannot see it. It also breaks paste for the honest — the person with a screen reader, the person who drafted in Notes on the bus.",
    verdict: "theatre",
    camera: false,
    cost: "Low build, real accessibility cost",
  },
  {
    n: "02",
    name: "Capture the signals",
    how: "Record what the page can honestly see: paste events, time away from the tab, delay before the first keystroke, whether 400 words arrived in one burst or were typed and revised.",
    catches: "The careless majority. Answers that arrive fully formed after ninety seconds of a blank box and a tab switch look exactly like what they are.",
    misses: "Anyone patient. Retyping a model's answer by hand produces clean signals. Treat this as confidence, never as proof — accusing a student on a timing graph is a mistake we should not be able to make.",
    verdict: "partial",
    camera: false,
    cost: "Low build, no user cost",
  },
  {
    n: "03",
    name: "Ground it in their record",
    how: "The scenario is built from what this person already told us — their role, their stated experience, the sector they chose — so no two sittings share a prompt.",
    catches: "Answer-sharing between students, and any pre-baked answer bank. There is nothing to look up because the question did not exist until they arrived.",
    misses: "Live AI. A model handles a personalised prompt as easily as a generic one. This kills sharing, not assistance.",
    verdict: "partial",
    camera: false,
    cost: "Medium build, no user cost",
  },
  {
    n: "04",
    name: "Probe what they wrote",
    how: "One unscripted follow-up, generated from their own answer. \"You said you would refund it. The customer has now said the courier lied. Does that change your answer?\"",
    catches: "Pasted answers, because the person does not own the reasoning underneath them. Going back to the model for the follow-up costs another round trip, under a clock, against a question that only exists because of what they just said.",
    misses: "A skilled user with the model open beside them will still keep up. It raises the cost sharply rather than closing the door.",
    verdict: "strong",
    camera: true,
    cost: "Medium build, small user cost",
  },
  {
    n: "05",
    name: "Ask for it out loud",
    how: "Sixty seconds, spoken, no editing. Already modelled in the arc as day 30.",
    catches: "Almost everything. Reading a model's answer aloud under time pressure sounds like reading a model's answer aloud, and the follow-up lands before there is time to consult anything.",
    misses: "Not equally fair to everyone — a nervous speaker, a second-language speaker or someone in a shared room is penalised for the room, not the skill. It must never be the only evidence.",
    verdict: "strong",
    camera: true,
    cost: "Low build, real user cost",
  },
  {
    n: "06",
    name: "Measure what AI cannot supply",
    how: "Score the shape of the sitting, not the polish of one answer: whether day 18 is better than day 3 on the same kind of problem, when they asked the buddy for help, what they did on day 21 when nobody was available.",
    catches: "Everything, in the sense that matters. A model can write a good answer. It cannot fake a learning curve across a sitting, and a person routing every scene through it produces a suspiciously flat one.",
    misses: "It needs the arc to exist — this is not a control you bolt on, it is a property of the format. It also cannot be explained to a student as a rule, only as a design.",
    verdict: "strong",
    camera: true,
    cost: "Already built into the arc",
  },
];

const SIGNALS = [
  { icon: "paste", label: "Pasted, not typed", detail: "A 300-word answer arriving in one event" },
  { icon: "clock", label: "Away from the page", detail: "Tab hidden for 40s, then an answer appears" },
  { icon: "spark", label: "No revision", detail: "Nothing deleted, nothing reworded, first draft final" },
  { icon: "eye", label: "Cold start", detail: "Ninety seconds of nothing, then fluent prose" },
];

function SignalIcon({ kind }: { kind: string }) {
  const cls = "h-4 w-4 text-slate-500";
  if (kind === "clock") return <Clock className={cls} />;
  if (kind === "spark") return <Spark className={cls} />;
  if (kind === "eye") return <Eye className={cls} />;
  return <Check className={cls} />;
}

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-deep">
        Preview · Assessment integrity
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-4xl">
        We cannot prevent cheating. We can make it not worth doing.
      </h1>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-slate-700">
        The specific attack raised was a second phone photographing the screen
        and feeding it to a model. No browser can see that device, so no control
        built into this page will ever stop it. Every option below is judged on
        one question instead: does it still hold when the person on the other
        side has a model open and all the time in the world?
      </p>

      {/* The threat, stated plainly, so the options can be judged against it */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-brand-ink">
          What we are actually up against
        </h2>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {[
            "Paste the scenario into a model, paste the answer back",
            "Photograph the screen with a second phone, type what it says",
            "Get the answers from somebody who sat it last week",
          ].map((t) => (
            <li
              key={t}
              className="rounded-xl bg-slate-50 px-3.5 py-3 text-[0.85rem] leading-snug text-slate-700"
            >
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.82rem] leading-relaxed text-slate-500">
          Only the third is solvable by prevention. The first two are solvable
          only by changing what earns a score.
        </p>
      </section>

      {/* Options */}
      <ol className="mt-10 space-y-5">
        {OPTIONS.map((o) => (
          <li
            key={o.n}
            className="rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono text-xs font-bold text-slate-400">
                {o.n}
              </span>
              <h3 className="font-display text-lg font-bold text-brand-ink">
                {o.name}
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide ring-1 ring-inset ${VERDICT[o.verdict].chip}`}
              >
                {VERDICT[o.verdict].label}
              </span>
            </div>

            <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-800">
              {o.how}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-teal-50/60 p-3.5">
                <p className="text-[0.7rem] font-bold uppercase tracking-wide text-teal-800">
                  Catches
                </p>
                <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-700">
                  {o.catches}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50/60 p-3.5">
                <p className="text-[0.7rem] font-bold uppercase tracking-wide text-rose-800">
                  Misses
                </p>
                <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-700">
                  {o.misses}
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.78rem] text-slate-500">
              <span>
                Survives the second-phone attack:{" "}
                <strong
                  className={o.camera ? "text-teal-800" : "text-rose-800"}
                >
                  {o.camera ? "yes" : "no"}
                </strong>
              </span>
              <span aria-hidden className="text-slate-300">·</span>
              <span>{o.cost}</span>
            </div>
          </li>
        ))}
      </ol>

      {/* What option 02 can honestly see */}
      <section className="mt-10 rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-brand-ink">
          What the page can honestly observe
        </h2>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-600">
          Everything below is first-party and visible to the page itself — no
          camera, no third-party proctor, no tracker. It produces a confidence
          note on a result, never an accusation.
        </p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {SIGNALS.map((s) => (
            <li
              key={s.label}
              className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3"
            >
              <span className="mt-0.5 shrink-0">
                <SignalIcon kind={s.icon} />
              </span>
              <span>
                <span className="block text-[0.85rem] font-semibold text-brand-ink">
                  {s.label}
                </span>
                <span className="block text-[0.8rem] leading-snug text-slate-600">
                  {s.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Recommendation */}
      <section className="mt-10 rounded-2xl border-2 border-brand-teal/30 bg-teal-50/40 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          The recommendation
        </h2>
        <p className="mt-2.5 text-[0.9rem] leading-relaxed text-slate-800">
          Ship <strong>02 + 04 + 06</strong>, and treat 01 as out of scope
          forever. Signals give a confidence score on every sitting. The probe
          makes a pasted answer expensive under a clock. The arc means the thing
          being scored — improvement, when help was asked for, what happened
          when help was gone — is not something a model can hand over.
        </p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-800">
          Add <strong>05</strong> as one moment in the sitting, never as the
          gate, and say so out loud: a person who cannot speak freely today
          should not lose their result over it.
        </p>
        <p className="mt-3 flex items-start gap-2 text-[0.85rem] leading-relaxed text-slate-600">
          <Mic className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>
            Whatever we ship, the honest line to a student is that we measure
            how they work, not just what they submit — and that using AI is
            allowed where the scene says so, because that is also true of the job.
          </span>
        </p>
      </section>
    </main>
  );
}
