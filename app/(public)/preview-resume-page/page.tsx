"use client";

// A preview, not a shipped screen: three ways the resume builder could open,
// each answering the question the current screen does not - why this rather
// than the free builder everyone else uses. Reply with a letter.

import { useState } from "react";

// ---- shared bits -------------------------------------------------------

function PaperMock({ small = false }: { small?: boolean }) {
  const line = (w: string, dark = false) => (
    <div className={`h-1.5 rounded ${dark ? "bg-slate-700" : "bg-slate-300"}`} style={{ width: w }} />
  );
  return (
    <div className={`rounded-lg bg-white p-4 shadow-sm ${small ? "aspect-[1/1.414] w-40" : "aspect-[1/1.414] w-full max-w-[15rem]"}`}>
      <div className="space-y-1.5">
        <div className="h-2.5 w-1/2 rounded bg-slate-800" />
        {line("35%")}
        <div className="pt-2" />
        {line("22%", true)}
        {line("100%")}
        {line("94%")}
        <div className="pt-1.5" />
        {line("22%", true)}
        {line("88%")}
        {line("96%")}
        {line("70%")}
        <div className="pt-1.5" />
        {line("22%", true)}
        {line("92%")}
        {line("84%")}
      </div>
    </div>
  );
}

function Cta({ label, ghost = false }: { label: string; ghost?: boolean }) {
  return (
    <span
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-bold ${
        ghost
          ? "border border-slate-300 text-slate-700"
          : "bg-brand-teal-deep text-white shadow-sm"
      }`}
    >
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

// ---- A: the promise, then the build ------------------------------------

const PROOF = [
  {
    head: "Nothing on it is invented",
    body: "Every line comes from your own record. No borrowed numbers, no employer you did not work for - so you can defend all of it in the interview.",
  },
  {
    head: "It tells you where it is thin",
    body: "When it is written you get an honest read: what it already does, what a stronger one would have, and the one thing worth doing next.",
  },
  {
    head: "It gets better as you do",
    body: "Assessments, simulations and interviews land in your record - so the resume you build in a month is stronger than this one, from the same page.",
  },
];

type Making = "role" | "general" | "improve";

const MAKING_LABEL: Record<Making, string> = {
  role: "A resume for a particular role",
  general: "A general resume - no particular role",
  improve: "Improve a resume I already have",
};

function OptionA() {
  const [making, setMaking] = useState<Making>("general");
  return (
    <div className="rounded-2xl bg-surface p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Your resume
      </p>
      <h3 className="mt-1.5 max-w-2xl text-[1.7rem] font-bold leading-tight text-brand-ink">
        A resume you can defend line by line
      </h3>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-slate-600">
        Most builders help you write what sounds good. This one writes what is
        true about you, gets it past the screening software, and then tells you
        honestly where it is still thin.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {PROOF.map((item) => (
          <div key={item.head} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-[0.85rem] font-bold text-brand-ink">{item.head}</p>
            <p className="mt-1 text-[0.76rem] leading-relaxed text-slate-600">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          {/* One question, one dropdown, and only the fields that answer
              belong to the choice. Nothing else is on screen to parse. */}
          <div className="rounded-2xl border border-slate-200 bg-surface p-4">
            <label htmlFor="making" className="text-[0.95rem] font-semibold text-brand-ink">
              What are we building?
            </label>
            <select
              id="making"
              value={making}
              onChange={(e) => setMaking(e.target.value as Making)}
              className="mt-2 min-h-12 w-full cursor-pointer rounded-xl border border-slate-300 bg-surface px-3 text-[0.88rem] font-semibold text-brand-ink outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
            >
              {(Object.keys(MAKING_LABEL) as Making[]).map((key) => (
                <option key={key} value={key}>
                  {MAKING_LABEL[key]}
                </option>
              ))}
            </select>

            {making === "role" && (
              <div className="mt-3 grid gap-3">
                <label className="block">
                  <span className="text-[0.78rem] font-semibold text-slate-800">Target role</span>
                  <input
                    readOnly
                    placeholder="Customer Support Executive"
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 text-[0.86rem] outline-none"
                  />
                </label>
                <span className="min-h-11 cursor-pointer text-[0.78rem] font-semibold text-slate-600 underline underline-offset-2">
                  Paste the job posting (optional)
                </span>
              </div>
            )}

            {making === "general" && (
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[0.78rem] leading-relaxed text-slate-600">
                We lead with your strongest evidence rather than a role&rsquo;s
                words. Aimed at a role it will always land harder - and you can
                build that version from the same record in two minutes.
              </p>
            )}

            {making === "improve" && (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                <p className="text-[0.84rem] font-semibold text-brand-ink">
                  Choose your resume or LinkedIn PDF
                </p>
                <p className="mt-1 text-[0.72rem] text-slate-500">
                  We read it, keep what you wrote, and say what is missing.
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-surface p-4">
            <p className="text-[0.9rem] font-semibold text-brand-ink">Pick a look</p>
            <div className="mt-2 flex gap-2">
              {["Classic", "Compact", "Sidebar"].map((name, i) => (
                <span
                  key={name}
                  className={`rounded-lg border-2 px-3 py-1.5 text-[0.78rem] font-semibold ${
                    i === 0 ? "border-brand-violet bg-brand-violet/5 text-brand-ink" : "border-slate-200 text-slate-600"
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <Cta label={making === "improve" ? "Work on my resume" : "Build my resume"} />
          </div>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4">
          <PaperMock />
        </div>
      </div>
    </div>
  );
}

// ---- B: the paper is the argument --------------------------------------

const CALLOUTS = [
  { at: "top-[22%]", text: "Every number here came from something you told us" },
  { at: "top-[48%]", text: "Written in the words this role is screened on" },
  { at: "top-[74%]", text: "Nothing added that your record cannot back" },
];

function OptionB() {
  return (
    <div className="rounded-2xl bg-surface p-5 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
            Your resume
          </p>
          <h3 className="mt-1.5 text-[1.6rem] font-bold leading-tight text-brand-ink">
            This is what we will make
          </h3>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-600">
            Not a template you fill in. A resume written from your record, in
            the words screening software matches on - and an honest read of it
            the moment it exists.
          </p>

          <dl className="mt-4 grid gap-2.5">
            {[
              ["From your record only", "No invented numbers, employers or skills."],
              ["Read after it is written", "Where it stands, what is missing, what to do."],
              ["Never a half-built file", "The download stays shut until it is complete."],
            ].map(([head, body]) => (
              <div key={head} className="flex gap-2.5">
                <span aria-hidden className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal-100 text-[0.6rem] font-bold text-teal-700">
                  ✓
                </span>
                <div>
                  <dt className="text-[0.84rem] font-bold text-brand-ink">{head}</dt>
                  <dd className="text-[0.76rem] leading-relaxed text-slate-600">{body}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex min-h-11 items-center gap-2.5">
              <input type="checkbox" readOnly className="h-4 w-4 accent-brand-teal-deep" />
              <span className="text-[0.84rem] font-semibold text-brand-ink">
                I&rsquo;m applying for a particular role
              </span>
            </label>
            <p className="mt-1 text-[0.72rem] text-slate-500">
              Off = a general resume. Have one already?{" "}
              <span className="font-semibold text-slate-700 underline">Improve that</span>
            </p>
            <div className="mt-3">
              <Cta label="Build my resume" />
            </div>
          </div>
        </div>

        {/* The paper, big, with the argument written on it. */}
        <div className="relative rounded-2xl bg-slate-100 p-5">
          <div className="mx-auto max-w-[17rem]">
            <PaperMock />
          </div>
          {CALLOUTS.map((c) => (
            <span
              key={c.text}
              className={`absolute right-3 ${c.at} hidden max-w-[11rem] rounded-lg border border-slate-200 bg-surface px-2.5 py-1.5 text-[0.68rem] font-semibold leading-snug text-slate-600 shadow-sm xl:block`}
            >
              {c.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- C: one question at a time -----------------------------------------

function OptionC() {
  const [step, setStep] = useState(0);
  const steps = [
    {
      q: "Is this for a particular role?",
      help: "A resume aimed at one role always reads harder. A general one is fine too - you can build the aimed version in two minutes.",
      choices: ["Yes, a particular role", "No, a general resume", "Improve the one I have"],
    },
    {
      q: "Which look?",
      help: "Classic and Compact are single column, the safest read for screening software. Sidebar is designed for a human reader.",
      choices: ["Classic", "Compact", "Sidebar"],
    },
    {
      q: "Ready when you are",
      help: "We write it from your record, then read it back to you honestly - what it does, what is missing, what to do next.",
      choices: [],
    },
  ];
  const current = steps[Math.min(step, steps.length - 1)]!;
  return (
    <div className="rounded-2xl bg-surface p-5 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div>
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= step ? "w-8 bg-brand-teal-deep" : "w-4 bg-slate-200"
                }`}
              />
            ))}
            <span className="ml-1 text-[0.7rem] font-semibold text-slate-500">
              Step {Math.min(step + 1, 3)} of 3
            </span>
          </div>

          <h3 className="mt-4 text-[1.5rem] font-bold leading-tight text-brand-ink">
            {current.q}
          </h3>
          <p className="mt-1.5 max-w-md text-[0.86rem] leading-relaxed text-slate-600">
            {current.help}
          </p>

          <div className="mt-4 grid max-w-md gap-2">
            {current.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setStep((s) => Math.min(s + 1, 2))}
                className="min-h-12 cursor-pointer rounded-xl border-2 border-slate-200 px-4 text-left text-[0.86rem] font-semibold text-brand-ink transition-colors hover:border-brand-teal"
              >
                {choice}
              </button>
            ))}
            {current.choices.length === 0 && <Cta label="Build my resume" />}
          </div>

          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              className="mt-3 min-h-11 cursor-pointer text-[0.78rem] font-semibold text-slate-500 underline underline-offset-2"
            >
              Back
            </button>
          )}
        </div>

        {/* The constant: what happens after, so the promise is visible the
            whole way through rather than only at the end. */}
        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-violet-deep">
            What you get
          </p>
          <ol className="mt-2.5 grid gap-3">
            {[
              ["The resume", "Written from your record. Nothing invented, ever."],
              ["The honest read", "Where it stands, what is missing, what to do next."],
              ["A way to fix it", "The one Ascend step that would move it most."],
            ].map(([head, body], i) => (
              <li key={head} className="flex gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[0.65rem] font-bold text-slate-500 ring-1 ring-slate-200">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[0.8rem] font-bold text-brand-ink">{head}</p>
                  <p className="text-[0.72rem] leading-relaxed text-slate-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-xl bg-white p-2.5">
            <div className="mx-auto w-32">
              <PaperMock small />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function PreviewResumePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.8rem] font-bold leading-tight text-brand-ink">
        Three ways to open the resume builder
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        The screen today opens with a form question - what are we building? -
        which tells a person nothing about why they should build it here rather
        than on any free site. Three openings below, each making the same
        argument differently. All three keep what already works: the checkbox,
        the looks, the sample page, the one primary action.
      </p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">
          What is actually different here - the four true claims
        </h2>
        <ol className="mt-2.5 grid gap-2 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="text-brand-ink">Nothing is invented.</strong> Other
            builders will happily write &ldquo;increased efficiency by 30%&rdquo;
            for someone who has never measured anything. Every line here traces
            to their own record, which is why they can hold it up in an
            interview.
          </li>
          <li>
            <strong className="text-brand-ink">It reads the resume back.</strong>{" "}
            Standing, strengths, gaps and the single next step. No other builder
            tells you your resume is thin - it is not in their interest.
          </li>
          <li>
            <strong className="text-brand-ink">It will not hand over a half-built file.</strong>{" "}
            Missing education, no experience section - the download stays shut
            and names what is missing.
          </li>
          <li>
            <strong className="text-brand-ink">It improves as the person does.</strong>{" "}
            An assessment or a simulation changes their record, so the next
            build is genuinely stronger. A one-off builder cannot do that.
          </li>
        </ol>
      </section>

      <Frame
        letter="A"
        title="Say the promise, then get on with it"
        idea="A short headline and three proof cards, then one dropdown - role, general, or improve what I have - which opens only the fields that answer it."
        notes={[
          "One dropdown decides everything: pick a line and only the fields belonging to it appear. No stray checkbox, no link doing a second job.",
          "The three choices are equals, said out loud - today the general resume is the absence of a tick and the upload hides in a link.",
          "Cheapest to build and the least disruptive - nothing below the proof strip changes.",
          "Costs a screen of height before the first control, which pushes the button down on a laptop.",
        ]}
      >
        <OptionA />
      </Frame>

      <Frame
        letter="B"
        title="Let the paper make the argument"
        idea="The sample page is the hero, with callouts pointing at real lines - this number came from your record, these are the role's own words. The claims sit beside it as three ticks, and the form shrinks to a single card."
        notes={[
          "Shows rather than tells: the difference is on the page, not in a paragraph about the page.",
          "The strongest opening for someone who has never made a resume and does not know what good looks like.",
          "The callouts need real space - they hide below 1280px, so smaller laptops see option A instead.",
        ]}
      >
        <OptionB />
      </Frame>

      <Frame
        letter="C"
        title="One question at a time, with the payoff always in view"
        idea="Three steps - role, look, build - with a fixed panel showing what they get: the resume, the honest read, the way to fix it. The promise stays on screen the whole way rather than being read once at the top."
        notes={[
          "The least intimidating for a first-timer: one decision per screen, nothing else to parse.",
          "The 'what you get' panel earns the ask before the ask, which is the test this product is meant to pass.",
          "Slower for a returning user - three taps to reach a button that used to be one.",
        ]}
      >
        <OptionC />
      </Frame>

      <section className="mt-12 rounded-2xl border border-brand-violet/30 bg-violet-50 p-5">
        <h2 className="text-base font-bold text-brand-ink">My recommendation: B</h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
          A person who has never written a resume cannot tell a good one from a
          bad one, so a paragraph claiming ours is better is just another claim.
          B puts a real page in front of them and points at the parts that are
          different - and it does it without adding a step or a screen of
          height. Take A&rsquo;s three proof cards as the fallback for narrow
          screens where the callouts cannot fit.
        </p>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-700">
          C is the better shape if we later find people abandoning this screen
          without building - it makes the ask smaller. Worth keeping in the
          drawer rather than building now.
        </p>
      </section>
    </main>
  );
}
