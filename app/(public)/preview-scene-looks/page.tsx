import { Clock, Mic } from "@/components/icons";

// Three ways to lay out a scene in the readiness sitting. Dead preview page.
//
// What is wrong with the page as it stands, in the order somebody meets it:
//
//   The situation scrolls away. Every fact needed to answer - a ticket number,
//   two dates, who approved what - is in a paragraph that is off screen by the
//   time the answer box is in front of them. They are being asked to hold six
//   facts in their head, which measures memory rather than the work.
//
//   Half the desktop is empty. The column is capped and everything queues down
//   it, so the brief and the answer can never be seen at once on the machine
//   most people will sit this on.
//
//   The help outweighs the work. Two chat panels take more room and more colour
//   than the answer box and push it below the fold, on a screen whose whole
//   point is the answer.
//
//   The ask hides at the end of the prose. "Say what you will do right now,
//   what you will tell Vikram, and what you got wrong" is three deliverables in
//   the last sentence of a 250-word block.
//
//   Spoken scenes are not spoken. The brief says say it out loud in sixty
//   seconds; the screen gives an eight-row textarea and a small grey Record
//   button beside Send.
//
// The three options below differ in how far they go, not in what they fix.

export const metadata = { title: "Preview — Scene looks" };

const SCENE = {
  company: "ShopNest India",
  day: "Day 22",
  title: "Your own earlier note has a mistake in it.",
  minutes: 3,
  buddy: "Priya",
  story:
    "Six days ago you handled a complaint for customer Vikram Rao (ticket #SN-97561). You logged: 'Customer contacted re: damaged blender. Courier investigation raised. Customer informed replacement will be dispatched within 3 business days.' Today Vikram calls, furious. He says he was told five business days, not three, and nothing has arrived.\n\nYou check the courier investigation log: it was raised on 11 Jan and completed on 13 Jan (two business days later), confirming courier fault. The replacement was approved on 13 Jan but the dispatch team shows no record of it being sent — the approval sat unactioned. You are the one who wrote the wrong timeline in the note.",
  ask: [
    "What you will do right now to fix the record accurately",
    "What you will tell Vikram",
    "Honestly — what you got wrong, and what you will do differently",
  ],
  askHow: "Spoken · about sixty seconds",
  record: [
    ["Ticket", "#SN-97561"],
    ["Customer", "Vikram Rao"],
    ["Courier investigation", "Raised 11 Jan · closed 13 Jan · courier at fault"],
    ["Replacement", "Approved 13 Jan · never dispatched"],
    ["Your note said", "3 business days"],
    ["Customer heard", "5 business days"],
  ],
};

/* ---------- small shared pieces, so the three options differ only where they mean to ---------- */

function Frame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-300 bg-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="ml-2 text-[0.7rem] text-slate-500">{label}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <span className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold tabular-nums text-slate-600">
        <Clock size={15} />
        14:12 left
      </span>
      <span className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-4 text-[0.84rem] font-semibold text-slate-700">
        End assessment
      </span>
    </div>
  );
}

function Heading({ tight }: { tight?: boolean }) {
  return (
    <>
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {SCENE.company} · {SCENE.day}
      </p>
      <h3
        className={`${tight ? "mt-0.5 text-lg" : "mt-1 text-xl"} font-semibold tracking-tight text-slate-900`}
      >
        {SCENE.title}
      </h3>
    </>
  );
}

/** The closing ask, lifted out of the prose. Common to all three options. */
function TheAsk({ subdued }: { subdued?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        subdued
          ? "border-slate-200 bg-white"
          : "border-brand-violet/30 bg-brand-violet/[0.04]"
      }`}
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-brand-violet-deep">
        What to send · {SCENE.askHow}
      </p>
      <ol className="mt-2 grid gap-1.5">
        {SCENE.ask.map((a, i) => (
          <li key={a} className="flex gap-2.5 text-[0.86rem] leading-relaxed text-slate-700">
            <span className="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-violet/10 text-[0.7rem] font-bold text-brand-violet-deep">
              {i + 1}
            </span>
            {a}
          </li>
        ))}
      </ol>
    </div>
  );
}

function SupportTab({
  who,
  sub,
  active,
  tone,
}: {
  who: string;
  sub: string;
  active?: boolean;
  tone: "teal" | "violet";
}) {
  return (
    <span
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[0.8rem] font-semibold ${
        active
          ? tone === "teal"
            ? "border-brand-teal/50 bg-brand-teal/10 text-brand-teal-deep"
            : "border-brand-violet/50 bg-brand-violet/10 text-brand-violet-deep"
          : "border-slate-300 text-slate-600"
      }`}
    >
      {who}
      <span className="font-normal text-slate-500">{sub}</span>
    </span>
  );
}

function ChatLine({ mine, text }: { mine?: boolean; text: string }) {
  return (
    <li className={mine ? "flex justify-end" : ""}>
      <p
        className={`max-w-[26rem] rounded-2xl px-3 py-2 text-[0.84rem] leading-relaxed ${
          mine
            ? "rounded-tr-sm bg-slate-100 text-slate-700"
            : "rounded-tl-sm bg-brand-teal/10 text-slate-800"
        }`}
      >
        {text}
      </p>
    </li>
  );
}

function AskLine({ placeholder }: { placeholder: string }) {
  return (
    <div className="mt-2 flex gap-2">
      <span className="inline-flex min-h-10 flex-1 items-center rounded-full border border-slate-300 bg-surface px-4 text-[0.84rem] text-slate-400">
        {placeholder}
      </span>
      <span className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-brand-teal/45 px-4 text-[0.8rem] font-bold text-brand-teal-deep">
        Send
      </span>
    </div>
  );
}

function SendRow({ speak }: { speak?: boolean }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {speak && (
        <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-600 px-5 text-[0.88rem] font-bold text-white">
          <Mic size={16} />
          Record your answer
        </span>
      )}
      <span
        className={`inline-flex min-h-11 items-center rounded-lg px-5 text-[0.88rem] font-bold ${
          speak
            ? "border border-slate-300 text-slate-700"
            : "bg-brand-violet text-white"
        }`}
      >
        Send and go on
      </span>
    </div>
  );
}

/* ------------------------------------ Option A ------------------------------------ */

function OptionA() {
  return (
    <Frame label="Option A — the desk">
      <TopBar />
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* Left: the situation, and it stays there. */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Heading />
          <p className="mt-0.5 text-[0.78rem] text-slate-400">
            7 done · about {SCENE.minutes} minutes on this one
          </p>
          <p className="mt-3 whitespace-pre-line text-[0.9rem] leading-relaxed text-slate-700">
            {SCENE.story}
          </p>
        </div>

        {/* Right: the work. */}
        <div>
          <TheAsk />

          <div className="mt-3 rounded-xl border-2 border-brand-violet/30 p-3.5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-brand-violet-deep">
              Your answer
            </p>
            <div className="mt-2 rounded-xl border border-slate-300 bg-surface px-3.5 py-3">
              <p className="text-[0.86rem] text-slate-400">
                Say it out loud, or write it the way you would say it…
              </p>
              <div className="h-24" />
            </div>
            <p className="mt-1.5 text-[0.78rem] text-slate-400">
              50 characters to go
            </p>
          </div>
          <SendRow speak />

          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Help · not part of your answer
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <SupportTab who="Priya" sub="· your buddy" active tone="teal" />
              <SupportTab who="AI assistant" sub="· on the work system" tone="violet" />
            </div>
            <ol className="mt-3 grid gap-2">
              <ChatLine mine text="Do I admit the note was mine?" />
              <ChatLine text="He can see the note either way — the question is whether he hears it from you first. What are you going to open with?" />
            </ol>
            <AskLine placeholder="Ask Priya…" />
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------------ Option B ------------------------------------ */

function OptionB() {
  return (
    <Frame label="Option B — the ask, front and centre">
      <TopBar />
      <div className="mx-auto mt-4 max-w-2xl">
        <Heading />
        <p className="mt-0.5 text-[0.78rem] text-slate-400">
          7 done · about {SCENE.minutes} minutes on this one
        </p>

        <p className="mt-3 whitespace-pre-line text-[0.9rem] leading-relaxed text-slate-700">
          {SCENE.story}
        </p>

        <div className="mt-4">
          <TheAsk />
        </div>

        <div className="mt-3 rounded-xl border-2 border-brand-violet/30 p-3.5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-brand-violet-deep">
            Your answer
          </p>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white">
              <Mic size={18} />
            </span>
            <span className="text-[0.86rem] text-slate-700">
              Tap to record · about sixty seconds
            </span>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-[0.8rem] text-slate-500 underline decoration-slate-300 underline-offset-4">
              Rather type it?
            </summary>
            <div className="mt-2 rounded-xl border border-slate-300 bg-surface px-3.5 py-3">
              <p className="text-[0.86rem] text-slate-400">
                Write it the way you would say it…
              </p>
              <div className="h-20" />
            </div>
          </details>
        </div>
        <SendRow />

        {/* Help, docked at the bottom: present, reachable, and never the widest
            thing on the page. */}
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
          <p className="text-[0.72rem] text-slate-500">
            Stuck? Two people are available on this one. Using them is normal.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <SupportTab who="Ask Priya" sub="· two years in this job" tone="teal" />
            <SupportTab who="Ask the AI assistant" sub="· on the work system" tone="violet" />
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------------ Option C ------------------------------------ */

function OptionC() {
  return (
    <Frame label="Option C — the work system">
      <TopBar />
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div>
          <Heading tight />

          {/* The facts, out of the prose and into the record they would really
              be sitting in. Nobody holds six of these in their head. */}
          <dl className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white text-[0.82rem]">
            {SCENE.record.map(([k, v], i) => (
              <div
                key={k}
                className={`flex flex-wrap gap-x-3 gap-y-0.5 px-3.5 py-2 ${
                  i % 2 === 0 ? "bg-slate-50/60" : ""
                }`}
              >
                <dt className="w-40 shrink-0 font-semibold text-slate-500">{k}</dt>
                <dd className="min-w-0 flex-1 text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 whitespace-pre-line text-[0.88rem] leading-relaxed text-slate-600">
            {SCENE.story}
          </p>

          <div className="mt-4">
            <TheAsk />
          </div>

          <div className="mt-3 rounded-xl border-2 border-brand-violet/30 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-brand-violet-deep">
                Your answer
              </p>
              <span className="inline-flex overflow-hidden rounded-full border border-slate-300 text-[0.75rem] font-semibold">
                <span className="bg-slate-800 px-3 py-1 text-white">Speak</span>
                <span className="px-3 py-1 text-slate-600">Type</span>
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-surface px-3.5 py-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white">
                <Mic size={17} />
              </span>
              <span className="text-[0.84rem] text-slate-500">
                0:00 / about 1:00
              </span>
            </div>
          </div>
          <SendRow />
        </div>

        {/* Right rail: help, docked where a work tool puts it. */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Help
            </p>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-500">
              Not part of your answer. Using it is normal.
            </p>
            <div className="mt-2 grid gap-2">
              <SupportTab who="Priya" sub="· buddy" active tone="teal" />
              <SupportTab who="Assistant" sub="· AI" tone="violet" />
            </div>
            <ol className="mt-3 grid gap-2">
              <ChatLine mine text="Do I admit the note was mine?" />
              <ChatLine text="He can see the note either way. What are you opening with?" />
            </ol>
            <AskLine placeholder="Ask Priya…" />
          </div>
        </aside>
      </div>
    </Frame>
  );
}

/* ------------------------------------ Option D ------------------------------------ */

// The immersive frame. Every colour here is a literal, never a slate token:
// globals.css flips the whole slate scale under prefers-color-scheme: dark, so
// text-slate-100 on bg-slate-900 would invert into near-black on near-black for
// half the people who open it. A panel that is deliberately dark has to say so
// in hex.
//
// What this keeps from the reference: the full-bleed stage, the persistent left
// rail, help as two small chips rather than two large panels, and the feeling
// of being somewhere rather than on a page.
//
// What it drops, and why:
//
//   "Question 5 of 20 (25%)". There is no 20. The sitting runs until every
//   skill has evidence, so a denominator is a number we would be inventing. The
//   bar here is the fifteen minutes, which is the one bound that is real.
//
//   A list of upcoming sections. The next scene is chosen from how the last two
//   went; naming five upcoming sections would promise an order that does not
//   exist. The rail lists what they have already done instead - same shape, and
//   true.
//
//   Named competencies as sections. "Leadership, Communication, Ethics" is a
//   competency test. The rail says Day 14, Day 18, Day 22 because that is the
//   frame the whole assessment is built on.
//
//   Deep glass under body text. See the strip below the mock.

function GlassRail() {
  return (
    <aside className="rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/50">
        Your first month
      </p>
      <p className="mt-1.5 text-[0.95rem] font-semibold text-white">
        Day 22 · seven done
      </p>

      {/* The only honest bar on this screen: time, not questions. */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/12">
        <div className="h-full w-[19%] rounded-full bg-gradient-to-r from-[#2dd4bf] to-[#7dd3fc]" />
      </div>
      <p className="mt-1.5 text-[0.78rem] tabular-nums text-white/60">
        14:12 left of fifteen minutes
      </p>

      <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/50">
        Behind you
      </p>
      <ol className="mt-2 grid gap-1.5 text-[0.82rem] text-white/70">
        {[
          "Day 1 · Read yourself in",
          "Day 3 · Your first real ticket",
          "Day 8 · The refund you cannot give",
          "Day 14 · Two dashboards disagree",
          "Day 18 · A ticket like day three",
        ].map((d) => (
          <li key={d} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2dd4bf]/70" />
            {d}
          </li>
        ))}
        <li className="flex gap-2 font-semibold text-white">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
          Day 22 · you are here
        </li>
      </ol>

      <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/50">
        Around today
      </p>
      <div className="mt-2 grid gap-1.5 text-[0.82rem] text-white/70">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          Priya · at the next desk
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          AI assistant · on the work system
        </span>
      </div>
    </aside>
  );
}

function OptionD() {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl">
      {/* The stage: an out-of-focus room behind glass. No photograph, so it
          costs nothing to load on a 3G connection. */}
      <div className="relative isolate bg-[#0b1220] p-4 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-90"
          style={{
            background:
              "radial-gradient(58% 60% at 12% 8%, rgba(45,212,191,0.30), transparent 62%), radial-gradient(50% 55% at 88% 22%, rgba(99,102,241,0.34), transparent 60%), radial-gradient(70% 70% at 60% 108%, rgba(14,116,144,0.36), transparent 65%)",
          }}
        />

        <div className="rounded-3xl border border-white/12 bg-white/[0.055] p-4 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/50">
                {SCENE.company}
              </p>
              <p className="text-[0.95rem] font-semibold text-white">
                Customer Support Associate · readiness
              </p>
            </div>
            <span className="inline-flex min-h-10 items-center rounded-xl border border-white/25 px-4 text-[0.84rem] font-semibold text-white/90">
              End assessment
            </span>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
            <GlassRail />

            {/* The work. Sat on a near-solid panel, not on glass: this is the
                only text on screen somebody has to read closely. */}
            <div className="rounded-2xl border border-white/12 bg-[#0d1526]/85 p-5">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                {SCENE.title}
              </h3>
              <p className="mt-0.5 text-[0.78rem] text-white/50">
                About {SCENE.minutes} minutes on this one
              </p>
              <p className="mt-3 whitespace-pre-line text-[0.9rem] leading-relaxed text-white/80">
                {SCENE.story}
              </p>

              <div className="mt-4 rounded-xl border border-[#2dd4bf]/35 bg-[#2dd4bf]/[0.07] p-3.5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#5eead4]">
                  What to send · {SCENE.askHow}
                </p>
                <ol className="mt-2 grid gap-1.5">
                  {SCENE.ask.map((a, i) => (
                    <li
                      key={a}
                      className="flex gap-2.5 text-[0.86rem] leading-relaxed text-white/85"
                    >
                      <span className="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2dd4bf]/20 text-[0.7rem] font-bold text-[#5eead4]">
                        {i + 1}
                      </span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Help as two chips. Same offer as today, a tenth of the room -
                  and it opens over the work rather than pushing it down. */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[0.78rem] text-white/50">Stuck?</span>
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#2dd4bf]/45 bg-[#2dd4bf]/10 px-4 text-[0.82rem] font-semibold text-[#5eead4]">
                  Ask Priya
                </span>
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-[0.82rem] font-semibold text-white/80">
                  Ask the AI assistant
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/20 bg-white/[0.04] p-3.5">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/60">
                  Your answer
                </p>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/15 bg-[#0b1220]/70 px-3.5 py-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-500 text-white">
                    <Mic size={18} />
                  </span>
                  <span className="text-[0.86rem] text-white/70">
                    Tap to record · about sixty seconds
                  </span>
                </div>
                <p className="mt-1.5 text-[0.78rem] text-white/45">
                  Rather type it?
                </p>
              </div>

              <div className="mt-4">
                <span className="inline-flex min-h-11 items-center rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0ea5e9] px-6 text-[0.88rem] font-bold text-white">
                  Send and go on
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Why the body text in D sits on a near-solid panel and not on glass. */
function GlassStrip() {
  return (
    <div className="relative mt-4 isolate overflow-hidden rounded-2xl bg-[#0b1220] p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 70% at 20% 10%, rgba(45,212,191,0.42), transparent 60%), radial-gradient(60% 70% at 85% 80%, rgba(129,140,248,0.42), transparent 60%)",
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/50">
            Body text on glass
          </p>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-white/75">
            You check the courier investigation log: it was raised on 11 Jan and
            completed on 13 Jan, confirming courier fault. The replacement was
            approved on 13 Jan but never dispatched.
          </p>
          <p className="mt-2 text-[0.75rem] text-white/45">
            Contrast changes with whatever is behind it. On the bright part of
            the gradient this drops under AA, and it is the text carrying the
            dates they need.
          </p>
        </div>
        <div className="rounded-xl border border-white/12 bg-[#0d1526]/90 p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/50">
            Body text on a near-solid panel
          </p>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-white/85">
            You check the courier investigation log: it was raised on 11 Jan and
            completed on 13 Jan, confirming courier fault. The replacement was
            approved on 13 Jan but never dispatched.
          </p>
          <p className="mt-2 text-[0.75rem] text-white/45">
            Same room, same glass everywhere else. The one block somebody has to
            read closely stops moving under them.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------ the page ------------------------------------ */

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="text-[1.05rem] font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <div className="mt-1.5 grid gap-1.5 text-[0.88rem] leading-relaxed text-slate-600">
        {children}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        The scene screen — four ways to lay it out
      </h1>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        Same scene, same words, same help. Only the arrangement changes. All
        four do three things the live page does not: the ask comes out of the
        prose, the answer stops being pushed below the fold by the chat panels,
        and a spoken scene gets a microphone instead of a textarea. A, C and D
        also keep the facts on screen while the answer is written.
      </p>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        A, B and C are layout. <strong className="font-semibold text-slate-800">D is
        the immersive one</strong> — scroll to the bottom if that is what you
        came for.
      </p>

      <Note title="What the live page does wrong">
        <p>
          <strong className="font-semibold text-slate-800">The situation scrolls away.</strong>{" "}
          A ticket number, two dates and an approval status are needed to
          answer, and all of them are off screen by the time the box is in
          front of them. That measures memory, not the work.
        </p>
        <p>
          <strong className="font-semibold text-slate-800">Help outweighs the work.</strong>{" "}
          Two chat panels take more room and more colour than the answer box,
          and put it below the fold.
        </p>
        <p>
          <strong className="font-semibold text-slate-800">The ask hides at the end.</strong>{" "}
          Three deliverables live in the last sentence of a 250-word paragraph.
        </p>
        <p>
          <strong className="font-semibold text-slate-800">A spoken scene is not spoken.</strong>{" "}
          The brief says say it out loud in sixty seconds; the screen offers an
          eight-row textarea and a small grey Record beside Send.
        </p>
      </Note>

      <Note title="Option A — the desk">
        <p>
          Situation on the left and it stays there while they work on the right.
          Help drops below the answer and the two threads become one panel with
          two tabs, so only one conversation is ever open.
        </p>
        <p className="text-slate-500">
          Uses the desktop width that is currently empty. Nothing about the
          content has to change. On a phone it stacks back to the order it has
          now. The cost is that the answer box gets narrower.
        </p>
      </Note>
      <OptionA />

      <Note title="Option B — the ask, front and centre">
        <p>
          Stays one column, so the phone and the laptop see the same thing. The
          closing ask is lifted into a numbered block, the answer is a
          microphone with typing folded away behind it, and help shrinks to two
          buttons at the bottom that open a thread when pressed.
        </p>
        <p className="text-slate-500">
          Smallest change and the least risk. It does not solve the facts
          scrolling away — the story is still above the answer.
        </p>
      </Note>
      <OptionB />

      <Note title="Option C — the work system">
        <p>
          The scene stops being an exam question and becomes the record it would
          really be: the facts as a ticket, the story as context underneath,
          the answer as a composer with Speak and Type, help docked in a right
          rail like every work tool they will actually use.
        </p>
        <p className="text-slate-500">
          Closest to the job, and the strongest fix for the memory problem. It
          is the only one that needs backend work — the writer would have to
          emit the facts as fields alongside the prose, which means a prompt
          change and regenerating the pool. Scenes without fields fall back to
          B&apos;s layout.
        </p>
      </Note>
      <OptionC />

      <Note title="Option D — the shift">
        <p>
          The screen stops looking like a website and starts looking like
          somewhere you are. Dark, full-bleed, no product navigation, a
          persistent rail down the left, and help as two chips instead of two
          panels. This is the reference you sent, with three things taken out
          and one thing changed.
        </p>
        <p className="text-slate-500">
          <strong className="font-semibold text-slate-700">Taken out:</strong>{" "}
          &ldquo;Question 5 of 20&rdquo; — there is no 20, the sitting runs
          until every skill has evidence, so the denominator would be invented.
          A list of upcoming sections — the next scene is chosen from how the
          last two went, so naming five ahead promises an order that does not
          exist. Named competencies as sections — that is a competency test, and
          this is a first month at work.
        </p>
        <p className="text-slate-500">
          <strong className="font-semibold text-slate-700">Changed:</strong> the
          rail lists what they have <em>already done</em> — Day 1, Day 3, Day 8,
          Day 14, Day 18 — which is the same shape as the reference&apos;s
          sections and is true. And the progress bar measures the fifteen
          minutes, the one bound that is real.
        </p>
      </Note>
      <OptionD />

      <Note title="The one thing I would not copy: glass under the reading">
        <p className="text-slate-500">
          Translucent panels take their contrast from whatever drifts behind
          them, and in the reference the scenario text — the part carrying the
          numbers you need — sits on the brightest part of the gradient. Every
          other surface in D is glass. The block with the dates in it is not.
        </p>
      </Note>
      <GlassStrip />

      <Note title="If you want a recommendation">
        <p>
          <strong className="font-semibold text-slate-800">D, built on A&apos;s bones.</strong>{" "}
          You are right that the immersion is worth having — the assessment is
          the one place in the product where somebody should feel they are at
          work rather than on a page, and none of A, B or C deliver that. D is
          A&apos;s two-column layout wearing the reference&apos;s clothes, so
          nothing has to be regenerated and the facts still stay on screen while
          the answer is written.
        </p>
        <p className="text-slate-500">
          Two things to decide before I build it. First, whether the rest of the
          product stays light while this one screen goes dark — I think it
          should, because the change of surface is what says <em>you have
          walked into a workplace</em>, and coming back out to a light read-out
          is the moment it ends. Second, C&apos;s facts table drops straight
          into D&apos;s left rail as the ticket you are working from — but that
          still needs the writer to emit the facts, so it is the later step
          either way.
        </p>
        <p className="text-slate-500">
          One constraint I would hold: <code>backdrop-blur</code> is expensive on
          the cheap Android phones this has to run on. D uses two blurred
          surfaces, not nine, and the background is a CSS gradient rather than a
          photograph — so it costs nothing to download and stays honest on a 3G
          connection.
        </p>
      </Note>
    </main>
  );
}
