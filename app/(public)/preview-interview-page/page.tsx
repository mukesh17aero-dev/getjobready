"use client";

// A preview, not a shipped screen: three ways the interview page could open,
// each answering the question the current one does not - why rehearse here
// rather than with a friend, a mirror, or one of the free question lists.

import { useState } from "react";

// ---- shared bits -------------------------------------------------------

function GreenRoomMock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-2xl bg-[#0f2b2a] p-4 text-white/90 ${compact ? "" : "sm:p-5"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[0.72rem] font-bold">You</p>
        <p className="text-[0.66rem] text-white/50">● NOT CHECKED</p>
      </div>
      <div className="mt-6 grid place-items-center gap-2">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-lg font-bold">
          B
        </span>
        <p className="text-[0.8rem] font-semibold text-white/85">Ben</p>
        <span className="mt-1 inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-3.5 text-[0.76rem] font-semibold">
          Check my microphone
        </span>
      </div>
      <div className="mt-6 rounded-xl bg-white/5 px-3 py-2">
        <p className="text-[0.68rem] leading-relaxed text-white/70">
          Tip 2 of 3 - Say what you did, not what the team did.
        </p>
      </div>
    </div>
  );
}

function Cta({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white shadow-sm">
      {label}
    </span>
  );
}

function Frame({
  letter,
  title,
  idea,
  children,
  notes,
}: {
  letter: string;
  title: string;
  idea: string;
  children: React.ReactNode;
  notes: string[];
}) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-violet-deep text-sm font-bold text-white">
          {letter}
        </span>
        <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
      </div>
      <p className="mt-1.5 max-w-prose text-[0.88rem] leading-relaxed text-slate-600">{idea}</p>
      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/60 p-3 sm:p-6">
        {children}
      </div>
      <ul className="mt-3 space-y-1.5">
        {notes.map((note) => (
          <li key={note} className="flex gap-2 text-[0.83rem] leading-relaxed text-slate-600">
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            {note}
          </li>
        ))}
      </ul>
    </section>
  );
}

const PROOF = [
  {
    head: "It has read your record",
    body: "The questions come from the role you chose and what you have told us, so you rehearse the interview you are actually going to sit - not a list of the internet's favourite questions.",
  },
  {
    head: "You answer out loud",
    body: "A voice asks, you speak, the clock runs and it ends on time. The hard part of an interview is saying it, not knowing it - so that is the part you practise.",
  },
  {
    head: "You never hear the same interview twice",
    body: "It remembers what you were asked last time and asks something else, and it checks how the thing you were working on is coming along.",
  },
];

const SETUP_CARD = (
  <div className="rounded-2xl border border-slate-200 bg-surface p-4">
    <p className="text-[0.68rem] font-bold uppercase tracking-wide text-brand-violet-deep">
      You are joining
    </p>
    <p className="mt-1 text-[1.05rem] font-bold text-brand-ink">Customer Success Associate</p>
    <p className="mt-1 text-[0.76rem] text-slate-500">
      The direction you chose in Discovery.{" "}
      <span className="font-semibold text-slate-600 underline">Practise for a different role</span>
    </p>
    <p className="mt-3 text-xs font-semibold text-slate-600">Which round?</p>
    <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
      {[
        ["HR round", "Communication and how you work with people."],
        ["Managerial round", "Real situations - judgement and pressure."],
      ].map(([name, line], i) => (
        <span
          key={name}
          className={`rounded-xl border-2 p-2.5 ${i === 0 ? "border-brand-teal bg-teal-50" : "border-slate-200"}`}
        >
          <span className="block text-[0.8rem] font-bold text-brand-ink">{name}</span>
          <span className="mt-0.5 block text-[0.7rem] leading-relaxed text-slate-600">{line}</span>
        </span>
      ))}
    </div>
    <p className="mt-3 text-xs font-semibold text-slate-600">Who takes it?</p>
    <div className="mt-1.5 flex gap-2">
      {["Asha", "Ravi"].map((name, i) => (
        <span
          key={name}
          className={`inline-flex min-h-10 min-w-[6rem] items-center justify-center rounded-lg border-2 px-4 text-[0.8rem] font-bold ${
            i === 0 ? "border-brand-teal-deep bg-brand-teal-deep text-white" : "border-slate-200 text-slate-600"
          }`}
        >
          {name}
        </span>
      ))}
    </div>
    <p className="mt-3 text-[0.76rem] text-slate-600">
      10 minutes, up to ten questions, ends on time. Answer out loud, or type.
    </p>
    <div className="mt-3">
      <Cta label="Join the interview" />
    </div>
  </div>
);

// ---- A: promise strip, then the room -----------------------------------

function OptionA() {
  return (
    <div className="rounded-2xl bg-surface p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Interview practice
      </p>
      <h3 className="mt-1.5 max-w-2xl text-[1.7rem] font-bold leading-tight text-brand-ink">
        Ben, the first time you answer these should not be the real one
      </h3>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        Ten minutes with an interviewer who has read your record and asks about
        the role you chose. You answer out loud, the clock runs, and it ends on
        time - the way it will on the day. Afterwards you get an honest read of
        how it went, question by question.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {PROOF.map((item) => (
          <div key={item.head} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-[0.85rem] font-bold text-brand-ink">{item.head}</p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-slate-600">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GreenRoomMock />
        {SETUP_CARD}
      </div>
    </div>
  );
}

// ---- B: the read-out is the argument -----------------------------------

function OptionB() {
  return (
    <div className="rounded-2xl bg-surface p-5 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[21rem_minmax(0,1fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
            Interview practice
          </p>
          <h3 className="mt-1.5 text-[1.55rem] font-bold leading-tight text-brand-ink">
            Ten minutes now, so the real one is not the first time
          </h3>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-600">
            Anyone can tell you to practise. Almost nobody can tell you what
            went wrong. This is what you walk away with.
          </p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
              Your read-out, after
            </p>
            <p className="mt-2 text-[0.84rem] font-semibold text-brand-ink">
              &ldquo;Tell me about a time you handled an angry customer.&rdquo;
            </p>
            <p className="mt-1.5 text-[0.78rem] leading-relaxed text-teal-800">
              <strong>Well:</strong> you named the actual situation and what you
              said, instead of talking about customer service in general.
            </p>
            <p className="mt-1.5 text-[0.78rem] leading-relaxed text-amber-800">
              <strong>Better:</strong> you never said how it ended. One sentence
              on the outcome turns a story into evidence.
            </p>
            <p className="mt-2.5 text-[0.72rem] text-slate-500">
              Every question, answered like this. Plus what to work on before
              the next one - which the next interviewer will check on.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <GreenRoomMock compact />
          {SETUP_CARD}
        </div>
      </div>
    </div>
  );
}

// ---- C: what it costs you to be unprepared -----------------------------

function OptionC() {
  const [beat, setBeat] = useState(0);
  const beats = [
    {
      q: "So, tell me about yourself.",
      bad: "Um... my name is Ben, I did my B.Com, and I am a hard worker and quick learner.",
      why: "Everyone says this. It gives the interviewer nothing to ask about next.",
    },
    {
      q: "Why do you want this role?",
      bad: "I think it is a good opportunity and I want to grow my career.",
      why: "It could be said about any job. Nothing here is about you or about them.",
    },
    {
      q: "Tell me about a time something went wrong.",
      bad: "Nothing much has gone wrong for me, honestly.",
      why: "Nobody believes it, and you have just skipped the question they were listening hardest to.",
    },
  ];
  const current = beats[beat]!;
  return (
    <div className="rounded-2xl bg-surface p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Interview practice
      </p>
      <h3 className="mt-1.5 max-w-2xl text-[1.6rem] font-bold leading-tight text-brand-ink">
        Most people lose the interview in the first four minutes
      </h3>
      <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
        Not because they cannot do the job. Because these three questions come
        first and nobody has ever told them what a good answer sounds like.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap gap-2">
            {beats.map((b, i) => (
              <button
                key={b.q}
                type="button"
                onClick={() => setBeat(i)}
                className={`min-h-10 cursor-pointer rounded-full border-2 px-3 text-[0.72rem] font-semibold transition-colors ${
                  i === beat ? "border-brand-teal-deep bg-brand-teal-deep text-white" : "border-slate-200 text-slate-600"
                }`}
              >
                Question {i + 1}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[0.9rem] font-bold text-brand-ink">{current.q}</p>
          <p className="mt-2 rounded-xl bg-white p-3 text-[0.82rem] italic leading-relaxed text-slate-600">
            &ldquo;{current.bad}&rdquo;
          </p>
          <p className="mt-2 text-[0.78rem] leading-relaxed text-amber-800">{current.why}</p>
          <p className="mt-3 text-[0.8rem] leading-relaxed text-slate-700">
            Ten minutes here and you will have heard yourself answer all three -
            and been told, plainly, what to change.
          </p>
        </div>
        {SETUP_CARD}
      </div>
    </div>
  );
}

export default function PreviewInterviewPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.8rem] font-bold leading-tight text-brand-ink">
        Three ways to open the interview page
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        Today it says: &ldquo;A 10-minute mock interview with an interviewer who
        asks about the role you chose, listens to your answers, and tells you
        honestly how you did.&rdquo; True, but it describes a feature. None of
        it says why a person should spend ten uncomfortable minutes here rather
        than reading a list of questions for free. Reply with a letter.
      </p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">
          What is actually different here - the true claims
        </h2>
        <ol className="mt-2.5 grid gap-2 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="text-brand-ink">It knows who you are.</strong> The
            questions come from the role you chose in Discovery and what you have
            told us about yourself. A question list cannot do that, and a friend
            will not push you.
          </li>
          <li>
            <strong className="text-brand-ink">You have to say it out loud.</strong>{" "}
            Reading a good answer and producing one under a clock are different
            skills, and only one of them is tested on the day.
          </li>
          <li>
            <strong className="text-brand-ink">It tells you what went wrong.</strong>{" "}
            Question by question, what you did well and what would have been
            better. Real interviewers never tell you this - that is why people
            repeat the same mistake for years.
          </li>
          <li>
            <strong className="text-brand-ink">It never repeats itself.</strong>{" "}
            It remembers what you were asked before and what you were working on,
            and checks how that is coming along.
          </li>
        </ol>
      </section>

      <Frame
        letter="A"
        title="Say the promise, then open the room"
        idea="Named headline, a paragraph on what the ten minutes are, and three proof cards. The green room and the setup card sit underneath, unchanged."
        notes={[
          "Matches the resume page you just chose, so the two paid tools introduce themselves the same way.",
          "The headline speaks to the fear rather than the feature: the first time you answer these should not be the real one.",
          "Costs height before the join button, which matters on a laptop.",
        ]}
      >
        <OptionA />
      </Frame>

      <Frame
        letter="B"
        title="Show the read-out, because that is the thing nobody else gives"
        idea="A real fragment of the feedback - what you did well, what would have been better - shown before they commit. The argument is the thing they walk away with, not the ten minutes themselves."
        notes={[
          "Answers the strongest objection: 'I can practise on my own.' You can - but nobody tells you what went wrong.",
          "Sets an honest expectation of the tone, so the read-out afterwards is not a surprise.",
          "Needs the sample to stay generic - it must never look like a real person's feedback.",
        ]}
      >
        <OptionB />
      </Frame>

      <Frame
        letter="C"
        title="Show them the answer they are about to give"
        idea="Three tabs: the three questions that open almost every interview, with the weak answer most people give and why it fails. Uncomfortable, specific, and it makes the ten minutes feel necessary rather than optional."
        notes={[
          "The most persuasive for someone who thinks they are already fine - they recognise their own answer.",
          "Risky in tone: it must read as a warning from a friend, never as mockery of the person reading it.",
          "The claim 'most people lose it in the first four minutes' is ours to make only if we believe it - it is judgement, not data, so I would soften it before shipping.",
        ]}
      >
        <OptionC />
      </Frame>

      <section className="mt-12 rounded-2xl border border-brand-violet/30 bg-violet-50 p-5">
        <h2 className="text-base font-bold text-brand-ink">My recommendation: B</h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
          The objection to an AI interviewer is never &ldquo;I do not need
          practice&rdquo;, it is &ldquo;I can practise for free&rdquo;. B is the
          only one that answers it: you can rehearse alone, but nobody tells you
          what went wrong, and that is the entire product. Showing a real
          fragment of the read-out before they commit is the most honest kind of
          persuasion - it is not a claim, it is the thing itself.
        </p>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
          If you would rather the two paid tools feel like siblings, take A - it
          is the same shape as the resume page. C is the strongest hook but the
          easiest to get wrong in tone, and I would not ship it without you
          reading every line of it first.
        </p>
      </section>
    </main>
  );
}
