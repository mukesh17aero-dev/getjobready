import { Check, Clock, Mic, Spark } from "@/components/icons";

// Six ways to assess that are not "a scene with a textarea under it". Dead
// preview page.
//
// The framing worth keeping even if every concept below is rejected: HOW an
// assessment reaches somebody and WHAT it asks them are separate choices, and
// the whole category has welded them together. Everyone ships a sitting
// containing questions. Splitting them gives six combinations from two short
// lists, and the delivery half is where the genuinely unclaimed ground is —
// because nobody else is still there a week later.

export const metadata = { title: "Preview — Six ways" };

type Concept = {
  n: string;
  name: string;
  line: string;
  measures: string;
  different: string;
  ai: string;
  time: string;
  mock: React.ReactNode;
};

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[15rem] rounded-2xl border-4 border-slate-800 bg-slate-900 p-2">
      <div className="rounded-xl bg-slate-50 p-2.5">{children}</div>
    </div>
  );
}

const CONCEPTS: Concept[] = [
  {
    n: "01",
    name: "Drip",
    line: "The assessment finds you. Five moments across a week, sixty seconds each.",
    measures:
      "Consistency and judgement when it is not a special occasion. Nobody performs for five days running.",
    different:
      "Every competitor is a sitting. This is the only shape that uses the one advantage we have — we are still here next Tuesday, and they are not.",
    ai: "Strong. Five separated moments make an assistant a chore rather than a shortcut, and there is no single screen to photograph.",
    time: "5 × 60 sec",
    mock: (
      <Phone>
        <div className="space-y-1.5">
          <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200">
            <p className="text-[0.58rem] font-bold text-slate-400">
              ASCEND · now
            </p>
            <p className="mt-0.5 text-[0.64rem] font-semibold leading-tight text-slate-800">
              A customer just asked for something you cannot give. 60 seconds?
            </p>
          </div>
          <div className="rounded-lg bg-white/60 p-2 ring-1 ring-slate-200">
            <p className="text-[0.58rem] font-bold text-slate-400">
              Tuesday
            </p>
            <p className="mt-0.5 text-[0.64rem] leading-tight text-slate-500">
              Answered in 41s
            </p>
          </div>
          <div className="rounded-lg bg-white/60 p-2 ring-1 ring-slate-200">
            <p className="text-[0.58rem] font-bold text-slate-400">Monday</p>
            <p className="mt-0.5 text-[0.64rem] leading-tight text-slate-500">
              Answered in 1m 12s
            </p>
          </div>
        </div>
      </Phone>
    ),
  },
  {
    n: "02",
    name: "The Inbox",
    line: "A morning of messages arrives. You reply to them in role.",
    measures:
      "Triage, tone, and knowing which message not to answer first. The order you open things is the data.",
    different:
      "It is not a test wearing a job costume — it is the job's actual interface. Nothing to learn before starting.",
    ai: "Medium. Individual replies are pasteable; the order you worked them is not.",
    time: "6 min",
    mock: (
      <Phone>
        <div className="space-y-1">
          {[
            { f: "Priya (buddy)", s: "In a meeting till 11 — shout if stuck", u: false },
            { f: "Mehta Textiles", s: "Can we talk about the renewal?", u: true },
            { f: "R. Sharma", s: "Charged twice. Rent is due.", u: true },
            { f: "noreply@courier", s: "Shipment #4412 delayed", u: true },
          ].map((m) => (
            <div
              key={m.f}
              className={`rounded-lg p-1.5 ${m.u ? "bg-white shadow-sm ring-1 ring-slate-200" : "bg-transparent"}`}
            >
              <p
                className={`text-[0.62rem] leading-tight ${m.u ? "font-bold text-slate-800" : "text-slate-400"}`}
              >
                {m.f}
              </p>
              <p className="text-[0.58rem] leading-tight text-slate-500">
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Phone>
    ),
  },
  {
    n: "03",
    name: "Teach it back",
    line: "A new joiner does not understand the thing you just did. Explain it. They still do not get it.",
    measures:
      "Whether they actually understand it or only produced it. The second 'I still don't follow' is where borrowed answers collapse.",
    different:
      "Inverts the whole format. They are not being questioned, they are the one who knows — which is also the least intimidating frame in this list.",
    ai: "Strong. The confusion adapts to the explanation given, so each turn depends on the last one they wrote.",
    time: "3 min",
    mock: (
      <Phone>
        <div className="space-y-1.5">
          <div className="max-w-[85%] rounded-lg rounded-bl-sm bg-slate-200 p-1.5">
            <p className="text-[0.6rem] leading-tight text-slate-700">
              Why did the refund get declined? I thought we always refund.
            </p>
          </div>
          <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-brand-teal/20 p-1.5">
            <p className="text-[0.6rem] leading-tight text-slate-800">
              It was past the 14-day window…
            </p>
          </div>
          <div className="max-w-[85%] rounded-lg rounded-bl-sm bg-slate-200 p-1.5">
            <p className="text-[0.6rem] leading-tight text-slate-700">
              But it arrived damaged? Sorry — I still don&rsquo;t follow.
            </p>
          </div>
        </div>
      </Phone>
    ),
  },
  {
    n: "04",
    name: "Red pen",
    line: "A colleague's draft is about to go out. It has three problems in it. Mark them.",
    measures:
      "Evaluative judgement — the skill that separates somebody who can produce work from somebody who can be trusted with it.",
    different:
      "Reviewing is faster to sit than producing, and it is the thing juniors are actually promoted for. Nobody assesses it.",
    ai: "Strong when the flaws are facts about this company, which live only on the screen in front of them.",
    time: "2 min",
    mock: (
      <Phone>
        <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200">
          <p className="text-[0.6rem] leading-snug text-slate-700">
            Hi! Sorry about the delay. Your parcel will arrive{" "}
            <span className="bg-rose-200 px-0.5">by Wednesday</span> and if not
            we will give a{" "}
            <span className="bg-rose-200 px-0.5">full refund, 30-day</span>{" "}
            guarantee.
          </p>
          <p className="mt-1.5 text-[0.55rem] font-bold text-rose-700">
            2 of 3 found
          </p>
        </div>
      </Phone>
    ),
  },
  {
    n: "05",
    name: "Before it breaks",
    line: "Here is Monday's plan. Something in it is going to go wrong. Say what, and why.",
    measures:
      "Foresight. Whether somebody can see round a corner, which is exactly what nobody can test for in an interview.",
    different:
      "Prediction rather than reaction. Every other assessment hands you a problem that has already happened.",
    ai: "Medium-strong. A model will list generic risks; the specific one is in the detail of this plan.",
    time: "3 min",
    mock: (
      <Phone>
        <div className="space-y-1 rounded-lg bg-white p-2 ring-1 ring-slate-200">
          {[
            "09:00 Dispatch 40 orders",
            "11:00 Priya on leave",
            "14:00 Courier pickup",
            "16:00 Month-end report",
          ].map((t) => (
            <p key={t} className="text-[0.6rem] leading-tight text-slate-600">
              {t}
            </p>
          ))}
          <p className="mt-1 border-t border-slate-200 pt-1 text-[0.58rem] font-semibold text-brand-violet-deep">
            What breaks first?
          </p>
        </div>
      </Phone>
    ),
  },
  {
    n: "06",
    name: "No test at all",
    line: "Nothing is called an assessment. Evidence accumulates from the missions they already do.",
    measures:
      "The same things, from real work rather than a simulation of it.",
    different:
      "The most radical option here and the most on-brand: a companion does not examine you. It also removes the cheating question entirely, because there is no event to cheat.",
    ai: "Weak on its own — but a passport built from thirty artefacts is harder to fake than one score, simply because there is more of it.",
    time: "Ongoing",
    mock: (
      <Phone>
        <div className="space-y-1">
          {[
            "Handled a refund dispute",
            "Wrote to 11 customers",
            "Prioritised a backlog",
          ].map((t) => (
            <div
              key={t}
              className="flex items-center gap-1.5 rounded-lg bg-white p-1.5 ring-1 ring-slate-200"
            >
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-brand-teal">
                <Check className="h-2 w-2 text-white" />
              </span>
              <p className="text-[0.58rem] leading-tight text-slate-700">{t}</p>
            </div>
          ))}
          <p className="pt-0.5 text-[0.55rem] text-slate-400">
            No sitting. Just what you did.
          </p>
        </div>
      </Phone>
    ),
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-deep">
        Preview · Six ways
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-4xl">
        Six assessments that are not a sitting
      </h1>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-slate-700">
        None of these is the current one with a new coat on. The useful idea
        underneath them: <strong>how</strong> an assessment reaches somebody and{" "}
        <strong>what</strong> it asks are separate choices, and the whole
        category has welded the two together. Pick one from each list.
      </p>

      <div className="mt-10 space-y-6">
        {CONCEPTS.map((c) => (
          <section
            key={c.n}
            className="rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6"
          >
            <div className="grid gap-5 sm:grid-cols-[1fr_15rem] sm:gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {c.n}
                  </span>
                  <h2 className="font-display text-xl font-bold text-brand-ink">
                    {c.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-semibold text-slate-600">
                    <Clock className="h-3 w-3" />
                    {c.time}
                  </span>
                </div>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-brand-ink">
                  {c.line}
                </p>
                <dl className="mt-3.5 space-y-2.5">
                  {[
                    ["Measures", c.measures],
                    ["Why it is different", c.different],
                    ["Holds up against AI", c.ai],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">
                        {k}
                      </dt>
                      <dd className="mt-0.5 text-[0.84rem] leading-relaxed text-slate-700">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="order-first sm:order-none">{c.mock}</div>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border-2 border-brand-teal/30 bg-teal-50/40 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          If it were my call
        </h2>
        <p className="mt-2.5 text-[0.9rem] leading-relaxed text-slate-800">
          <strong>Drip is the delivery, and it is the real find.</strong> It is
          the only shape in this list no competitor can copy without becoming a
          different kind of company, because it needs a relationship with the
          student rather than a contract with an employer. It also finally has
          something to do with the home-screen install.
        </p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-800">
          Then rotate the mechanic inside it —{" "}
          <strong>Red pen</strong> on Monday, <strong>Teach it back</strong> on
          Wednesday, <strong>Before it breaks</strong> on Friday. Sixty seconds
          each, never the same shape twice, so there is nothing to prepare for
          and nothing to pass around. Five of those in a week is more evidence
          than a two-hour sitting, and it never once feels like an exam.
        </p>
        <p className="mt-3 flex items-start gap-2 text-[0.86rem] leading-relaxed text-slate-600">
          <Spark className="mt-0.5 h-4 w-4 shrink-0 text-brand-violet" />
          <span>
            The honest cost: this needs five times the content of one sitting,
            and it only works if people come back. That is a retention bet, and
            it should be made deliberately rather than discovered later.
          </span>
        </p>
        <p className="mt-3 flex items-start gap-2 text-[0.86rem] leading-relaxed text-slate-600">
          <Mic className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>
            Every one of these takes a spoken answer as readily as a typed one,
            which is the cheapest way to make sixty seconds feel like no work at
            all.
          </span>
        </p>
      </section>
    </main>
  );
}
