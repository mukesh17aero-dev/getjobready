"use client";

// A preview, not a shipped screen: browse the roles, or be taken round them.
//
// The shape is simple. Pick an industry, see every role in it, and if you do
// not know which one is you - and most people do not - a guide takes you
// round. It says what a job is actually like, in more detail than any job
// description would, and you can interrupt it with anything you want to know.
//
// The interruptions are the point. What somebody asks about a job, and where
// they stop asking, reads them far better than ten questions ever did.

import { useRef, useState } from "react";

const ART = "https://polkexjgphmwtpwhmspk.supabase.co/storage/v1/object/public/street";

type Role = {
  id: string;
  title: string;
  oneLine: string;
  art: string;
  hue: string;
  /** What the guide says, in order, when it takes you here. */
  says: string[];
  /** What people usually want to know, offered so nobody faces a blank box. */
  asks: Array<{ q: string; a: string }>;
  /** The one thing the guide asks back. This is the measurement. */
  turns: { question: string; a: string; b: string };
};

const INDUSTRIES = [
  { id: "retail", name: "Retail", blurb: "Shops, showrooms, counters", roles: 3 },
  { id: "ecom", name: "E-commerce", blurb: "Warehouses, delivery, orders", roles: 2 },
  { id: "services", name: "Services", blurb: "Support desks, back offices", roles: 2 },
];

const ROLES: Role[] = [
  {
    id: "csa",
    title: "Customer Success Associate",
    oneLine: "Keep customers sorted, and keep them coming back",
    art: `${ART}/inside-store.webp`,
    hue: "16 185 129",
    says: [
      "Most job descriptions for this say 'excellent communication skills'. Here is what it actually is: about forty conversations a day, and maybe six of them are with someone who is already annoyed.",
      "The part nobody writes down is the switching. You are mid-way through helping one person when a second one interrupts, and the skill is holding both without either feeling dropped.",
      "It pays around fourteen to twenty thousand to start in a city like Bengaluru. The people who move up are the ones who start spotting why the same complaint keeps coming back.",
    ],
    asks: [
      { q: "What's the hardest part?", a: "Being the face of a mistake you did not make. A late delivery is not your fault, but you are the one standing there. The people who last learn to own the fix without owning the blame." },
      { q: "Where does it lead?", a: "Two years in, most people go one of two ways: team lead, which is people and rotas, or specialist support, which is fewer customers and harder problems. The second pays better sooner." },
      { q: "Do I need experience?", a: "No. This is the most common first job in the list. What is looked for is whether you stay steady when somebody is upset - which is exactly what we would practise before you apply." },
    ],
    turns: {
      question: "Say the card machine dies with four people waiting. What is your first move?",
      a: "Tell the queue what has happened and start billing by hand",
      b: "Get the machine working - it is faster than doing it by hand",
    },
  },
  {
    id: "ops",
    title: "Operations Coordinator",
    oneLine: "Make sure what was promised actually arrives",
    art: `${ART}/inside-hub.webp`,
    hue: "139 92 246",
    says: [
      "This one is misunderstood. It reads as a desk job and it is not - it is sixty parcels, eleven riders and a whiteboard, and the whole day is deciding what moves next.",
      "The pressure is different from the counter. Nobody is shouting at you, but if you get the sequencing wrong at nine in the morning, the whole day is late by two.",
      "Starting pay is a little above support work, sixteen to twenty-two thousand, and it rises faster because fewer people can do it under pressure.",
    ],
    asks: [
      { q: "What's the hardest part?", a: "Deciding with half the information. A rider stops answering and you do not know if it is traffic, a breakdown or a bad day - and you have to reassign before you find out." },
      { q: "Is it physical work?", a: "Some. You are on your feet in a hub, not sitting in an office, though the coordinating itself is done at a screen and on the phone." },
      { q: "Where does it lead?", a: "Hub supervisor, then area operations. It is one of the shorter ladders in this list - people who are good at it are noticed quickly because the numbers show it." },
    ],
    turns: {
      question: "A rider has not moved for an hour and is not answering. What do you do?",
      a: "Reassign his drops now and find out what happened after",
      b: "Keep trying him - reassigning throws the whole route out",
    },
  },
  {
    id: "support",
    title: "Support Executive",
    oneLine: "Solve problems in writing, one queue at a time",
    art: `${ART}/inside-office.webp`,
    hue: "56 189 248",
    says: [
      "If the counter is talking and the hub is deciding, this is writing. Forty tickets a day, and the quality of your sentences is the quality of your work.",
      "It suits people who would rather think for a minute before answering. It does not suit people who need a room around them - a lot of the day is quiet.",
      "Pay starts around the same as the counter but the ceiling is higher, because good written support turns into product and process work later.",
    ],
    asks: [
      { q: "What's the hardest part?", a: "Saying no in writing without sounding cold. In person you have your face; in a ticket you have nothing but the words you chose." },
      { q: "Do I need good English?", a: "Clear English, not fancy English. Short sentences that say exactly what happens next beat long ones every time - and that is teachable in weeks." },
      { q: "Is it lonely?", a: "Quieter than the others, honestly. There is a team, but most of your day is you and a queue. Some people find that restful and some find it long." },
    ],
    turns: {
      question: "Three people report the same fault within an hour. What comes first?",
      a: "Answer all three, then flag the pattern to the team",
      b: "Find what is causing it before answering anyone",
    },
  },
];

type Said = { who: "guide" | "you"; text: string };

export default function PreviewGuide() {
  const [industry, setIndustry] = useState<string | null>(null);
  const [touring, setTouring] = useState(false);
  const [at, setAt] = useState(0);
  const [said, setSaid] = useState<Said[]>([]);
  const [beat, setBeat] = useState(0);
  const [typed, setTyped] = useState("");
  const [verdicts, setVerdicts] = useState<Record<string, "yes" | "maybe" | "no">>({});
  const [asked, setAsked] = useState<string[]>([]);
  const thread = useRef<HTMLDivElement>(null);

  const role = ROLES[at]!;

  function startTour() {
    setTouring(true);
    setAt(0);
    setBeat(0);
    setSaid([{ who: "guide", text: ROLES[0]!.says[0]! }]);
  }

  function more() {
    const next = beat + 1;
    if (next < role.says.length) {
      setBeat(next);
      setSaid((s) => [...s, { who: "guide", text: role.says[next]! }]);
    }
  }

  function ask(q: string, a: string) {
    setAsked((list) => [...list, q]);
    setSaid((s) => [...s, { who: "you", text: q }, { who: "guide", text: a }]);
  }

  function askOwn() {
    const q = typed.trim();
    if (q.length < 3) return;
    setAsked((list) => [...list, q]);
    setSaid((s) => [
      ...s,
      { who: "you", text: q },
      {
        who: "guide",
        text: "Good question - and one I would answer from what this role actually involves rather than from a brochure. In the real thing this is where I would give you the honest answer, including when the answer is 'that varies, and here is what it depends on'.",
      },
    ]);
    setTyped("");
  }

  function moveOn(verdict: "yes" | "maybe" | "no") {
    setVerdicts((v) => ({ ...v, [role.id]: verdict }));
    if (at < ROLES.length - 1) {
      const next = at + 1;
      setAt(next);
      setBeat(0);
      setSaid((s) => [
        ...s,
        {
          who: "guide",
          text:
            verdict === "no"
              ? `Noted - not that one. Let me show you ${ROLES[next]!.title}, which is a different kind of day entirely.`
              : `Right. Next door is ${ROLES[next]!.title} - worth seeing before you decide.`,
        },
        { who: "guide", text: ROLES[next]!.says[0]! },
      ]);
    } else {
      setTouring(false);
    }
    setTimeout(() => thread.current?.scrollTo({ top: 99999, behavior: "smooth" }), 60);
  }

  const done = Object.keys(verdicts).length;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.8rem] font-bold leading-tight text-brand-ink">
        Browse the roles - or let someone take you round
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        Pick an industry and every role in it is here to read. If you do not
        know which one is you - and most people do not - a guide walks you
        through them, says what each job is actually like, and answers whatever
        you interrupt with.
      </p>

      {/* ---- industries ---- */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.id}
            type="button"
            onClick={() => setIndustry(ind.id)}
            className={`rounded-2xl border-2 p-4 text-left transition-colors motion-reduce:transition-none ${
              industry === ind.id
                ? "border-brand-teal bg-teal-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="block text-[0.95rem] font-bold text-brand-ink">{ind.name}</span>
            <span className="mt-0.5 block text-[0.78rem] text-slate-500">{ind.blurb}</span>
            <span className="mt-1.5 block text-[0.72rem] font-semibold text-teal-700">
              {ind.roles} roles
            </span>
          </button>
        ))}
      </div>

      {industry && !touring && (
        <>
          {/* ---- the roles, to browse alone ---- */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r.id} className="overflow-hidden rounded-2xl border border-slate-200">
                <span className="relative block h-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.art} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="block p-3.5">
                  <span className="block text-[0.9rem] font-bold leading-tight text-brand-ink">
                    {r.title}
                  </span>
                  <span className="mt-1 block text-[0.78rem] leading-snug text-slate-500">
                    {r.oneLine}
                  </span>
                  {verdicts[r.id] && (
                    <span className="mt-1.5 block text-[0.72rem] font-semibold text-teal-700">
                      {verdicts[r.id] === "yes"
                        ? "Sounds like you"
                        : verdicts[r.id] === "maybe"
                          ? "Worth another look"
                          : "Not for you"}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* ---- the offer ---- */}
          <div className="mt-5 rounded-2xl border border-brand-violet/30 bg-violet-50 p-5">
            <p className="text-[0.95rem] font-bold text-brand-ink">
              {done > 0 ? "Carry on where you left off" : "Not sure which one is you?"}
            </p>
            <p className="mt-1 max-w-prose text-[0.86rem] leading-relaxed text-slate-700">
              Most people are not. I will take you through them one at a time,
              tell you what each is actually like - the part the job description
              leaves out - and answer anything you want to ask. It takes about
              five minutes.
            </p>
            <button
              type="button"
              onClick={startTour}
              className="mt-3 min-h-12 rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white"
            >
              {done > 0 ? "Keep going →" : "Take me round →"}
            </button>
          </div>
        </>
      )}

      {/* ---- the tour ---- */}
      {touring && (
        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
          <div className="relative h-36">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={role.art} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-x-4 bottom-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-white/60">
                Role {at + 1} of {ROLES.length}
              </p>
              <p className="text-[1.05rem] font-bold text-white">{role.title}</p>
            </div>
          </div>

          <div ref={thread} className="max-h-[26rem] overflow-y-auto bg-surface p-4">
            <ol className="grid gap-2.5">
              {said.map((line, i) => (
                <li
                  key={i}
                  className={line.who === "you" ? "flex justify-end" : "flex gap-2.5"}
                >
                  {line.who === "guide" && (
                    <span
                      aria-hidden
                      className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold text-black/70"
                      style={{ background: `rgb(${role.hue} / 0.9)` }}
                    >
                      A
                    </span>
                  )}
                  <p
                    className={`max-w-[32rem] rounded-2xl px-3.5 py-2.5 text-[0.88rem] leading-relaxed ${
                      line.who === "you"
                        ? "rounded-tr-sm bg-teal-50 text-slate-700"
                        : "rounded-tl-sm border border-slate-200 text-brand-ink"
                    }`}
                  >
                    {line.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-4">
            {beat < role.says.length - 1 ? (
              <button
                type="button"
                onClick={more}
                className="min-h-11 w-full rounded-full border border-slate-300 bg-surface text-sm font-semibold text-slate-700"
              >
                Tell me more about this one
              </button>
            ) : (
              <>
                {/* What people usually want to know - offered, so nobody has
                    to face an empty box, and never the only way to ask. */}
                <div className="flex flex-wrap gap-2">
                  {role.asks
                    .filter((a) => !asked.includes(a.q))
                    .map((a) => (
                      <button
                        key={a.q}
                        type="button"
                        onClick={() => ask(a.q, a.a)}
                        className="min-h-10 rounded-full border border-slate-300 bg-surface px-3.5 text-[0.8rem] font-semibold text-slate-700 hover:border-slate-400"
                      >
                        {a.q}
                      </button>
                    ))}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        askOwn();
                      }
                    }}
                    placeholder="Ask anything about this job…"
                    className="min-h-11 min-w-0 flex-1 rounded-full border border-slate-300 bg-surface px-4 text-[0.88rem] outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
                  />
                  <button
                    type="button"
                    onClick={askOwn}
                    className="min-h-11 shrink-0 rounded-full bg-slate-900 px-4 text-sm font-bold text-white"
                  >
                    Ask
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-surface p-3.5">
                  <p className="text-[0.85rem] font-semibold text-brand-ink">
                    Before we move on - {role.turns.question}
                  </p>
                  <div className="mt-2 grid gap-2">
                    {(["a", "b"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() =>
                          setSaid((s) => [
                            ...s,
                            { who: "you", text: role.turns[side] },
                            {
                              who: "guide",
                              text: "Noted. That tells me something - and I will show you what at the end rather than scoring you here.",
                            },
                          ])
                        }
                        className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-left text-[0.84rem] leading-snug text-slate-700 hover:border-brand-teal"
                      >
                        {role.turns[side]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveOn("yes")}
                    className="min-h-11 flex-1 rounded-full bg-brand-teal-deep px-4 text-sm font-bold text-white"
                  >
                    This sounds like me
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOn("maybe")}
                    className="min-h-11 flex-1 rounded-full border border-slate-300 bg-surface px-4 text-sm font-bold text-slate-700"
                  >
                    Maybe
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOn("no")}
                    className="min-h-11 flex-1 rounded-full border border-slate-300 bg-surface px-4 text-sm font-bold text-slate-700"
                  >
                    Not for me
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---- what the tour learned ---- */}
      {!touring && done > 0 && (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-surface p-5">
          <h2 className="text-base font-bold text-brand-ink">What the tour learned</h2>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-600">
            Not from a form - from what you asked and what you said as we went.
          </p>
          {asked.length > 0 && (
            <p className="mt-2 rounded-xl bg-slate-100 px-4 py-3 text-[0.85rem] leading-relaxed text-slate-700">
              You asked{" "}
              <strong className="text-brand-ink">{asked.length} questions</strong>, and
              {asked.some((q) => /pay|salary|money/i.test(q))
                ? " pay came up more than once - so the recommendation should lead with what a role starts at and how fast it moves."
                : asked.some((q) => /lead|grow|next|promo/i.test(q))
                  ? " every one of them was about where the job goes next - so you are choosing a ladder, not a first pay packet."
                  : " none of them were about pay, which is worth noticing about yourself."}
            </p>
          )}
          <ul className="mt-3 grid gap-1.5 text-[0.85rem] text-slate-700">
            {ROLES.filter((r) => verdicts[r.id]).map((r) => (
              <li key={r.id}>
                <strong className="text-brand-ink">{r.title}</strong> -{" "}
                {verdicts[r.id] === "yes"
                  ? "sounded like you"
                  : verdicts[r.id] === "maybe"
                    ? "worth another look"
                    : "not for you"}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">Why this reads people better</h2>
        <ul className="mt-2.5 grid gap-2 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="text-brand-ink">What somebody asks is the signal.</strong>{" "}
            Three questions about pay and none about where a job leads is a
            different person from the reverse - and neither would ever have
            said so on a form.
          </li>
          <li>
            <strong className="text-brand-ink">The guide earns the right to ask.</strong>{" "}
            After it has told you something worth knowing, one question back
            feels like conversation. That is the same measurement Discovery
            makes today, without the survey.
          </li>
          <li>
            <strong className="text-brand-ink">Browsing stays available.</strong>{" "}
            Somebody who knows what they want should never be walked round.
            The tour is for the person who says &ldquo;I do not know&rdquo;,
            which is most of them.
          </li>
          <li>
            <strong className="text-brand-ink">It has to be better than a JD or it is nothing.</strong>{" "}
            Every line the guide says has to be something a job description
            would not tell you - the switching between customers, the loneliness
            of a support queue, what actually gets people promoted. Generic
            enthusiasm would kill this instantly.
          </li>
        </ul>
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-[0.84rem] leading-relaxed text-amber-900">
          <strong>The hard part is the content, not the interface.</strong> A
          guide is only as good as what it knows about each role - the real day,
          the real trade-offs, honest pay bands. Where we do not know something,
          it has to say so. A guide that bluffs is worse than a list.
        </p>
      </section>
    </main>
  );
}
