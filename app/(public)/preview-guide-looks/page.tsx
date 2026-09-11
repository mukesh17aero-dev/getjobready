"use client";

// Six shapes for the same idea: you do not know which role is you, and
// something that knows the jobs walks you through them.
//
// These are not five skins on one screen. They differ in what the guide
// actually IS - a chat partner, a translator, a narrator, a voice, a watcher,
// or a referee - and each one measures a different thing about the person.

import { useState } from "react";

const ART = "https://polkexjgphmwtpwhmspk.supabase.co/storage/v1/object/public/street";

const SHAPES = [
  { id: "chat", name: "The conversation", tag: "Built already" },
  { id: "decode", name: "The translator", tag: "Most concrete" },
  { id: "day", name: "The day", tag: "Most honest" },
  { id: "voice", name: "The voice", tag: "Most mobile" },
  { id: "ambient", name: "The watcher", tag: "Least intrusive" },
  { id: "duel", name: "The referee", tag: "The closer" },
] as const;

type ShapeId = (typeof SHAPES)[number]["id"];

export default function PreviewGuideLooks() {
  const [shape, setShape] = useState<ShapeId>("decode");

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.8rem] font-bold leading-tight text-brand-ink">
        Six shapes for the guide
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        Same idea in all six - you are browsing roles, you do not know which is
        you, something that knows the jobs helps. What changes is what the guide
        is, and what each one quietly learns about you.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {SHAPES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setShape(s.id)}
            className={`min-h-11 rounded-full border-2 px-4 text-[0.82rem] font-bold transition-colors motion-reduce:transition-none ${
              shape === s.id
                ? "border-brand-teal bg-teal-50 text-teal-900"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {s.name}
            <span className="ml-1.5 text-[0.7rem] font-semibold opacity-60">{s.tag}</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        {shape === "chat" && <Chat />}
        {shape === "decode" && <Decode />}
        {shape === "day" && <Day />}
        {shape === "voice" && <Voice />}
        {shape === "ambient" && <Ambient />}
        {shape === "duel" && <Duel />}
      </div>

      <Verdict />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* 1. The conversation - what /preview-guide already does              */
/* ------------------------------------------------------------------ */

function Chat() {
  return (
    <Frame
      title="The conversation"
      idea="The guide talks, you interrupt. What you ask is the measurement."
      learns="Which questions you reach for - pay, progression, difficulty, loneliness - and which you never think to ask."
    >
      <div className="grid gap-2.5 bg-surface p-4">
        <Bubble who="guide">
          Most job descriptions say &ldquo;excellent communication skills&rdquo;.
          Here is what it actually is: about forty conversations a day, and
          maybe six of them are with someone already annoyed.
        </Bubble>
        <Bubble who="you">What&rsquo;s the hardest part?</Bubble>
        <Bubble who="guide">
          Being the face of a mistake you did not make. A late delivery is not
          your fault, but you are the one standing there.
        </Bubble>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 p-3.5">
        <div className="flex flex-wrap gap-2">
          {["Where does it lead?", "Do I need experience?", "What does it pay?"].map((q) => (
            <span
              key={q}
              className="rounded-full border border-slate-300 bg-surface px-3 py-2 text-[0.78rem] font-semibold text-slate-600"
            >
              {q}
            </span>
          ))}
        </div>
      </div>
      <Note>
        Familiar, and it works. The risk is that it looks like every chatbot
        anyone has ever ignored - the whole thing rests on the first sentence
        being better than a JD.
      </Note>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 2. The translator - a real JD, decoded line by line                 */
/* ------------------------------------------------------------------ */

const JD_LINES: Array<{ text: string; decode?: string }> = [
  { text: "Customer Success Associate - Bengaluru" },
  {
    text: "Excellent communication and interpersonal skills required.",
    decode:
      "Every posting says this, so it tells you nothing. What it means here: about forty conversations a day, six of them with someone already annoyed, and the skill is staying steady rather than being charming.",
  },
  {
    text: "Ability to multi-task in a fast-paced environment.",
    decode:
      "This is the real difficulty of the job and it is hidden in a cliché. You will be mid-way through helping one person when a second interrupts. Holding both without either feeling dropped is the whole thing.",
  },
  {
    text: "Take ownership of customer issues through to resolution.",
    decode:
      "Means you will be blamed for things you did not cause. A late delivery is not your fault; you are the one standing there. People who last learn to own the fix without owning the blame.",
  },
  {
    text: "Competitive salary commensurate with experience.",
    decode:
      "Says nothing on purpose. For this role in Bengaluru it is fourteen to twenty thousand to start. I would rather tell you that than let you find out in the third interview.",
  },
  { text: "Immediate joiners preferred." },
];

function Decode() {
  const [open, setOpen] = useState<number | null>(2);
  const decoded = JD_LINES.filter((l) => l.decode).length;

  return (
    <Frame
      title="The translator"
      idea="Show the real job posting. The guide decodes the lines that are hiding something."
      learns="Which phrases you tap. Someone who taps the pay line first is telling you what they came for."
    >
      <div className="bg-surface p-4">
        <p className="mb-3 text-[0.75rem] font-semibold uppercase tracking-wide text-slate-400">
          A real posting - tap the underlined parts
        </p>
        <ol className="grid gap-2.5">
          {JD_LINES.map((line, i) => (
            <li key={i}>
              {line.decode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpen(open === i ? null : i)}
                    className={`w-full rounded-lg px-2 py-1.5 text-left text-[0.88rem] leading-relaxed underline decoration-brand-violet decoration-dotted decoration-2 underline-offset-4 ${
                      open === i ? "bg-violet-50 text-brand-ink" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {line.text}
                  </button>
                  {open === i && (
                    <p className="mt-1.5 ml-2 border-l-2 border-brand-violet bg-violet-50/60 px-3.5 py-2.5 text-[0.85rem] leading-relaxed text-slate-700">
                      {line.decode}
                    </p>
                  )}
                </>
              ) : (
                <p className="px-2 py-1.5 text-[0.88rem] leading-relaxed text-slate-400">
                  {line.text}
                </p>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-3 rounded-lg bg-slate-100 px-3.5 py-2.5 text-[0.8rem] text-slate-600">
          {decoded} lines in this posting are hiding something. That is not
          unusual - it is most postings.
        </p>
      </div>
      <Note>
        My pick. It is the most concrete thing on this page: it takes the
        document a young person is already staring at, confused, and makes it
        honest. Nobody else does this, and it needs no new metaphor - no
        streets, no buildings, no fair.
      </Note>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 3. The day - 9am to 6pm, and you react to each hour                 */
/* ------------------------------------------------------------------ */

const BEATS = [
  { at: "9:10", text: "Shutters up. Forty minutes before anyone walks in, and you are counting stock nobody will ask you about." },
  { at: "11:30", text: "Three people at once. One returning a phone, one who does not know what he wants, one just watching. You decide the order." },
  { at: "14:00", text: "The card machine dies. Four people waiting. Nothing you did caused this and all four of them are looking at you." },
  { at: "17:45", text: "Quiet. The regular comes in, asks for you by name, and buys the thing you recommended last week." },
];

function Day() {
  const [seen, setSeen] = useState(1);
  const [felt, setFelt] = useState<Record<number, "good" | "bad">>({});

  return (
    <Frame
      title="The day"
      idea="Not a description of the job - the job. Nine in the morning to six, hour by hour, and you say how each hour lands."
      learns="Which hours you liked. Someone who marks 11:30 good and 14:00 bad is a different hire from the reverse, and neither said a word about themselves."
    >
      <div className="bg-surface p-4">
        <ol className="grid gap-2.5">
          {BEATS.slice(0, seen).map((b, i) => (
            <li key={b.at} className="flex gap-3">
              <span className="w-12 shrink-0 pt-2.5 text-[0.75rem] font-bold tabular-nums text-slate-400">
                {b.at}
              </span>
              <div className="flex-1 rounded-xl border border-slate-200 p-3.5">
                <p className="text-[0.88rem] leading-relaxed text-brand-ink">{b.text}</p>
                <div className="mt-2.5 flex gap-2">
                  {(["good", "bad"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFelt((v) => ({ ...v, [i]: f }))}
                      className={`min-h-10 rounded-full border px-3.5 text-[0.78rem] font-semibold ${
                        felt[i] === f
                          ? "border-brand-teal bg-teal-50 text-teal-900"
                          : "border-slate-300 text-slate-600"
                      }`}
                    >
                      {f === "good" ? "I’d like that hour" : "I’d dread it"}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
        {seen < BEATS.length ? (
          <button
            type="button"
            onClick={() => setSeen(seen + 1)}
            className="mt-3 min-h-11 w-full rounded-full border border-slate-300 text-sm font-semibold text-slate-700"
          >
            Then what?
          </button>
        ) : (
          <p className="mt-3 rounded-xl bg-teal-50 px-4 py-3 text-[0.85rem] leading-relaxed text-teal-900">
            That is the day. Not the good version - the actual one. Now: could
            you do that four hundred times a year?
          </p>
        )}
      </div>
      <Note>
        The most honest of the six, and the most likely to put someone off a
        role - which is the point. A career companion that only ever makes jobs
        sound good is an advert.
      </Note>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 4. The voice - hands free, phone in pocket                          */
/* ------------------------------------------------------------------ */

function Voice() {
  const [on, setOn] = useState(false);

  return (
    <Frame
      title="The voice"
      idea="No reading. The guide talks, you talk back, the phone can be in your hand on a bus."
      learns="The same as the conversation, but from people who would never have read three screens of text."
    >
      <div className="bg-slate-900 p-6 text-center">
        <span
          aria-hidden
          className={`mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-teal/20 ${
            on ? "animate-pulse motion-reduce:animate-none" : ""
          }`}
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-teal text-2xl font-bold text-slate-900">
            A
          </span>
        </span>
        <p className="mx-auto mt-4 max-w-md text-[1.05rem] leading-relaxed text-white">
          {on
            ? "…and the part nobody writes down is the switching. You are mid-way through helping one person when a second one interrupts."
            : "Put your headphones in and I will walk you through the three roles in retail. About five minutes. Stop me whenever."}
        </p>
        <p className="mt-3 text-[0.78rem] text-white/50">
          {on ? "Speaking - tap to interrupt" : "Ready"}
        </p>
        <button
          type="button"
          onClick={() => setOn(!on)}
          className="mt-4 min-h-12 rounded-full bg-brand-teal px-7 text-sm font-bold text-slate-900"
        >
          {on ? "Ask something" : "Start listening"}
        </button>
        {on && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["What does it pay?", "Where does it lead?", "Next role"].map((q) => (
              <span
                key={q}
                className="rounded-full border border-white/25 px-3 py-2 text-[0.78rem] font-semibold text-white/80"
              >
                {q}
              </span>
            ))}
          </div>
        )}
      </div>
      <Note>
        We already have the voices - Asha and Ravi were built for the interview.
        This is the only shape that works for someone who does not enjoy
        reading, which in this audience is not a small group.
      </Note>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 5. The watcher - you browse, it notices                             */
/* ------------------------------------------------------------------ */

const GRID = [
  { title: "Customer Success Associate", art: `${ART}/inside-store.webp` },
  { title: "Operations Coordinator", art: `${ART}/inside-hub.webp` },
  { title: "Support Executive", art: `${ART}/inside-office.webp` },
  { title: "Store Supervisor", art: `${ART}/facade-retail.webp` },
];

function Ambient() {
  const [opened, setOpened] = useState<string[]>([]);
  const speaks = opened.length >= 2;

  return (
    <Frame
      title="The watcher"
      idea="Nobody is taken anywhere. You browse as you like, and the guide only speaks when it has noticed something worth saying."
      learns="What you open, what you go back to, what you skip - the honest signal, because you were not performing for anyone."
    >
      <div className="bg-surface p-4">
        <div className="grid grid-cols-2 gap-3">
          {GRID.map((g) => (
            <button
              key={g.title}
              type="button"
              onClick={() =>
                setOpened((o) => (o.includes(g.title) ? o : [...o, g.title]))
              }
              className={`overflow-hidden rounded-xl border-2 text-left ${
                opened.includes(g.title) ? "border-brand-teal" : "border-slate-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.art} alt="" className="h-20 w-full object-cover" />
              <span className="block p-2.5 text-[0.8rem] font-bold leading-snug text-brand-ink">
                {g.title}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-[0.75rem] text-slate-400">
          Open two of them and see what happens.
        </p>
      </div>
      {speaks && (
        <div className="border-t border-slate-200 bg-violet-50 p-4">
          <div className="flex gap-3">
            <span
              aria-hidden
              className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-violet text-[0.8rem] font-bold text-white"
            >
              A
            </span>
            <div>
              <p className="text-[0.88rem] leading-relaxed text-brand-ink">
                You have opened {opened.length} roles and they all involve
                deciding under pressure rather than following a script. Want me
                to tell you what they have in common, and the one you have not
                looked at that fits it better?
              </p>
              <button
                type="button"
                className="mt-2.5 min-h-11 rounded-full bg-brand-violet-deep px-5 text-sm font-bold text-white"
              >
                Go on then
              </button>
            </div>
          </div>
        </div>
      )}
      <Note>
        The least intrusive, and the one most likely to be trusted - it earns
        the right to speak by having noticed something true. The risk is it
        never gets to speak at all if people leave after two cards.
      </Note>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 6. The referee - two roles, one difference that matters             */
/* ------------------------------------------------------------------ */

function Duel() {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <Frame
      title="The referee"
      idea="Not a browser at all - the last screen. You liked two, the guide names the one difference that actually separates them."
      learns="The final choice, made with the trade-off in front of you instead of a title and a photo."
    >
      <div className="bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { t: "Customer Success Associate", s: "People all day, one at a time", art: `${ART}/inside-store.webp` },
            { t: "Operations Coordinator", s: "Decisions all day, under a clock", art: `${ART}/inside-hub.webp` },
          ].map((r) => (
            <button
              key={r.t}
              type="button"
              onClick={() => setPicked(r.t)}
              className={`overflow-hidden rounded-xl border-2 text-left ${
                picked === r.t ? "border-brand-teal" : "border-slate-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.art} alt="" className="h-24 w-full object-cover" />
              <span className="block p-3">
                <span className="block text-[0.88rem] font-bold leading-snug text-brand-ink">
                  {r.t}
                </span>
                <span className="mt-0.5 block text-[0.78rem] text-slate-500">{r.s}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-brand-violet/30 bg-violet-50 p-4">
          <p className="text-[0.88rem] leading-relaxed text-brand-ink">
            You said maybe to both, so here is the only difference that matters.
            In the first, the hard part is a person in front of you who is upset.
            In the second, the hard part is deciding with half the information
            and no one to ask.{" "}
            <strong>Which of those would you rather be bad at on a Monday?</strong>
          </p>
          {picked && (
            <p className="mt-2.5 text-[0.85rem] text-slate-700">
              Noted - {picked}. That is the one I would put first, and I will
              tell you exactly why on the next screen rather than just scoring
              you.
            </p>
          )}
        </div>
      </div>
      <Note>
        Not a rival to the others - the ending for whichever one you pick.
        Every shape above needs a last screen, and &ldquo;here is your match,
        87%&rdquo; is the wrong one.
      </Note>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */

function Frame({
  title,
  idea,
  learns,
  children,
}: {
  title: string;
  idea: string;
  learns: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
      <p className="mt-1 max-w-prose text-[0.86rem] leading-relaxed text-slate-600">{idea}</p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">{children}</div>
      <p className="mt-2.5 rounded-xl bg-teal-50 px-4 py-3 text-[0.83rem] leading-relaxed text-teal-900">
        <strong>What it learns:</strong> {learns}
      </p>
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-[0.82rem] leading-relaxed text-slate-600">
      {children}
    </p>
  );
}

function Bubble({ who, children }: { who: "guide" | "you"; children: React.ReactNode }) {
  return (
    <div className={who === "you" ? "flex justify-end" : "flex gap-2.5"}>
      {who === "guide" && (
        <span
          aria-hidden
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-teal text-[0.7rem] font-bold text-slate-900"
        >
          A
        </span>
      )}
      <p
        className={`max-w-[30rem] rounded-2xl px-3.5 py-2.5 text-[0.86rem] leading-relaxed ${
          who === "you"
            ? "rounded-tr-sm bg-teal-50 text-slate-700"
            : "rounded-tl-sm border border-slate-200 text-brand-ink"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function Verdict() {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5">
      <h2 className="text-base font-bold text-brand-ink">If you want my view</h2>
      <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-600">
        These are not really six alternatives. Three of them combine into one
        product and the other three are the interesting arguments.
      </p>
      <ul className="mt-3 grid gap-2 text-[0.86rem] leading-relaxed text-slate-700">
        <li>
          <strong className="text-brand-ink">Build the translator first.</strong>{" "}
          It is the only one that needs no metaphor and no new user habit. A
          young person is already staring at a confusing job posting - we make
          it honest. That is a thing we can describe in one sentence to someone
          who has never used the product.
        </li>
        <li>
          <strong className="text-brand-ink">The day is what makes it a companion.</strong>{" "}
          Anything that only makes jobs sound appealing is an advert. Showing
          the two o&rsquo;clock that someone would dread is what proves we are
          on their side.
        </li>
        <li>
          <strong className="text-brand-ink">The referee is the ending, always.</strong>{" "}
          Whatever we build, it must not finish with a percentage.
        </li>
        <li>
          <strong className="text-brand-ink">The voice is the second release.</strong>{" "}
          Real advantage, and we already own the pieces - but it is worth
          nothing until the words being spoken are good enough.
        </li>
        <li>
          <strong className="text-brand-ink">The watcher is the quiet risk.</strong>{" "}
          Loveliest of the six when it lands, but it depends on someone
          browsing long enough to be noticed, and most will not.
        </li>
      </ul>
      <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-[0.84rem] leading-relaxed text-amber-900">
        <strong>The same warning as before.</strong> Every one of these is only
        as good as what we actually know about each role - the real hour, the
        honest pay band, what gets someone promoted. Where we do not know, it
        has to say so. The interface is a week; the content is the product.
      </p>
    </section>
  );
}
