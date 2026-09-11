"use client";

// A preview, not a shipped screen: three ways the resume builder could ask
// what kind of resume somebody wants, drawn into the layout that already
// exists. Pick a letter and it gets built for real.

import { useState } from "react";

type Making = "role" | "general" | "improve";
type Source = "record" | "upload";
type Aim = "role" | "general";

// ---- shared furniture -----------------------------------------------------

function PaperColumn({ note }: { note: string }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-t-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
        <p className="text-[0.74rem] font-semibold text-slate-600">Preview · Classic look</p>
        <p className="text-[0.7rem] text-slate-400">{note}</p>
      </div>
      <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-slate-100 p-4">
        <div className="relative mx-auto aspect-[1/1.414] w-full max-w-[15rem] overflow-hidden rounded-lg bg-white shadow-sm">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/3 flex -rotate-12 select-none items-center justify-center text-[1.4rem] font-bold uppercase tracking-[0.3em] text-[#111827]/[0.09]"
          >
            Example
          </span>
          <div className="space-y-2 p-4">
            <div className="h-2.5 w-2/3 rounded bg-slate-800/80" />
            <div className="h-1.5 w-1/2 rounded bg-slate-300" />
            <div className="mt-3 h-1.5 w-1/4 rounded bg-slate-400" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-1.5 w-full rounded bg-slate-200" />
            ))}
            <div className="mt-3 h-1.5 w-1/4 rounded bg-slate-400" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-1.5 w-full rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Cta({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="mt-4 inline-flex min-h-12 w-full max-w-sm cursor-default items-center justify-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white shadow-sm"
    >
      {label}
    </button>
  );
}

function UploadBox() {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
      <p className="text-[0.85rem] font-semibold text-brand-ink">
        Drop your resume here, or choose a file
      </p>
      <p className="mt-1 text-[0.72rem] text-slate-500">
        PDF or Word. We read it, keep what is true, and tell you what is missing.
      </p>
    </div>
  );
}

function RoleFields({ label = "Target role" }: { label?: string }) {
  return (
    <div className="mt-3 grid gap-3">
      <label className="block">
        <span className="text-[0.78rem] font-semibold text-slate-800">{label}</span>
        <input
          readOnly
          placeholder="Customer Support Executive"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[0.78rem] font-semibold text-slate-800">
          Job posting (optional)
        </span>
        <span className="block text-[0.7rem] text-slate-400">
          Paste it and the resume speaks its language.
        </span>
        <textarea
          readOnly
          rows={3}
          className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none"
        />
      </label>
    </div>
  );
}

function Frame({
  letter,
  title,
  blurb,
  children,
  notes,
}: {
  letter: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
  notes: string[];
}) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-violet-deep text-sm font-bold text-white">
          {letter}
        </span>
        <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
      </div>
      <p className="mt-1.5 max-w-prose text-[0.88rem] leading-relaxed text-slate-600">{blurb}</p>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-3 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">{children}</div>
          <PaperColumn note="Sample content until you build" />
        </div>
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

// ---- A: three starting points --------------------------------------------

function OptionA() {
  const [making, setMaking] = useState<Making>("role");
  const cards: Array<{ id: Making; title: string; line: string }> = [
    { id: "role", title: "For a role", line: "Aimed at one job, in its language." },
    { id: "general", title: "A general one", line: "Solid anywhere - for a job fair or a referral." },
    { id: "improve", title: "Improve mine", line: "Upload what you have and we work on it." },
  ];
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-surface p-4">
        <h3 className="text-[0.95rem] font-semibold text-brand-ink">
          What are we making?
        </h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {cards.map((card) => {
            const on = making === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setMaking(card.id)}
                className={`cursor-pointer rounded-xl border-2 p-3 text-left transition-colors ${
                  on ? "border-brand-teal bg-teal-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="block text-[0.82rem] font-bold text-brand-ink">{card.title}</span>
                <span className="mt-1 block text-[0.72rem] leading-relaxed text-slate-600">
                  {card.line}
                </span>
              </button>
            );
          })}
        </div>

        {making === "role" && <RoleFields />}
        {making === "general" && (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[0.8rem] leading-relaxed text-slate-600">
            No target role. We write from your record and lead with what holds
            true whoever reads it - your work, your studies, your evidence.
          </p>
        )}
        {making === "improve" && (
          <>
            <UploadBox />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[0.78rem] font-semibold text-slate-800">Aim it at:</span>
              <span className="rounded-lg border-2 border-brand-teal-deep bg-brand-teal-deep px-3 py-1 text-[0.78rem] font-bold text-white">
                A role
              </span>
              <span className="rounded-lg border-2 border-slate-200 px-3 py-1 text-[0.78rem] font-semibold text-slate-600">
                No particular role
              </span>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-surface p-4">
        <h3 className="text-[0.95rem] font-semibold text-brand-ink">Pick a look</h3>
        <p className="mt-1 text-[0.75rem] text-slate-500">Classic · Compact · Sidebar</p>
      </section>

      <Cta
        label={
          making === "improve"
            ? "Work on my resume"
            : making === "general"
              ? "Build my resume"
              : "Build my resume"
        }
      />
    </div>
  );
}

// ---- B: two small questions ----------------------------------------------

function OptionB() {
  const [source, setSource] = useState<Source>("record");
  const [aim, setAim] = useState<Aim>("role");
  const chip = (on: boolean) =>
    `min-h-11 cursor-pointer rounded-lg border-2 px-4 text-[0.82rem] font-bold transition-colors ${
      on ? "border-brand-teal-deep bg-brand-teal-deep text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
    }`;
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-surface p-4">
        <h3 className="text-[0.95rem] font-semibold text-brand-ink">Start from</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => setSource("record")} className={chip(source === "record")}>
            My Ascend record
          </button>
          <button type="button" onClick={() => setSource("upload")} className={chip(source === "upload")}>
            A resume I already have
          </button>
        </div>
        {source === "upload" && <UploadBox />}

        <h3 className="mt-4 text-[0.95rem] font-semibold text-brand-ink">Aim it at</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => setAim("role")} className={chip(aim === "role")}>
            One role
          </button>
          <button type="button" onClick={() => setAim("general")} className={chip(aim === "general")}>
            No particular role
          </button>
        </div>
        {aim === "role" ? (
          <RoleFields />
        ) : (
          <p className="mt-3 text-[0.8rem] leading-relaxed text-slate-600">
            We lead with what holds true whoever reads it. You can aim a copy at
            a role later without starting again.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-surface p-4">
        <h3 className="text-[0.95rem] font-semibold text-brand-ink">Pick a look</h3>
        <p className="mt-1 text-[0.75rem] text-slate-500">Classic · Compact · Sidebar</p>
      </section>

      <Cta label={source === "upload" ? "Work on my resume" : "Build my resume"} />
    </div>
  );
}

// ---- C: today's screen, two quiet doors ----------------------------------

function OptionC() {
  const [general, setGeneral] = useState(false);
  const [upload, setUpload] = useState(false);
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-surface p-4">
        <h3 className="text-[0.95rem] font-semibold text-brand-ink">
          {upload ? "Which resume are we improving?" : "What role is this resume for?"}
        </h3>

        {upload ? (
          <UploadBox />
        ) : general ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[0.8rem] leading-relaxed text-slate-600">
            No target role - we lead with what holds true whoever reads it.
          </p>
        ) : (
          <RoleFields />
        )}

        <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={general}
            onChange={(e) => setGeneral(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--color-brand-teal-deep,#0f766e)]"
          />
          <span className="text-[0.82rem] font-semibold text-slate-700">
            No particular role - make it a general resume
          </span>
        </label>

        <button
          type="button"
          onClick={() => setUpload((v) => !v)}
          className="mt-1 min-h-11 cursor-pointer text-[0.78rem] font-semibold text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800"
        >
          {upload ? "Build from my Ascend record instead" : "I already have a resume - improve that"}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-surface p-4">
        <h3 className="text-[0.95rem] font-semibold text-brand-ink">Pick a look</h3>
        <p className="mt-1 text-[0.75rem] text-slate-500">Classic · Compact · Sidebar</p>
      </section>

      <Cta label={upload ? "Work on my resume" : "Build my resume"} />
    </div>
  );
}

export default function PreviewResumeStart() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
        Preview - not live
      </p>
      <h1 className="mt-1 text-[1.7rem] font-bold leading-tight text-brand-ink">
        Three ways to open the resume builder
      </h1>
      <p className="mt-2 max-w-prose text-[0.9rem] leading-relaxed text-slate-600">
        Today the builder assumes one thing: a resume for a particular role,
        written from your Ascend record. Two people it cannot serve yet - the
        one who wants a resume that works anywhere, and the one who already has
        a resume and wants it made better. Same workbench, same paper on the
        right; only the top of the rail changes. Reply with a letter.
      </p>

      <Frame
        letter="A"
        title="Three starting points, stated up front"
        blurb="One question - what are we making? - answered by three cards, and the rail below changes to suit the answer."
        notes={[
          "Somebody arriving with a resume in hand sees that possibility immediately, rather than finding it in a link.",
          "A general resume becomes a real choice with a real name, not the absence of a role.",
          "Costs the most height: three cards sit above everything else.",
        ]}
      >
        <OptionA />
      </Frame>

      <Frame
        letter="B"
        title="Two small questions: where from, what for"
        blurb="Start from your record or an upload; aim it at a role or at nobody in particular. Four combinations, two rows of chips."
        notes={[
          "The only option that admits the truth: source and aim are separate questions, and every pairing is valid.",
          "An uploaded resume can be improved in general or aimed at a role without a second screen.",
          "Two questions before the role box is more asking than the person came for.",
        ]}
      >
        <OptionB />
      </Frame>

      <Frame
        letter="C"
        title="Today's screen, with two quiet doors"
        blurb="The role box stays exactly as it is. A checkbox turns it off; a line underneath swaps it for an upload."
        notes={[
          "Nothing changes for the person who wants what the builder already does - the common case stays one step.",
          "Smallest build: no new layout, one checkbox and one link.",
          "Both new paths are easy to miss, which is the price of keeping the screen quiet.",
        ]}
      >
        <OptionC />
      </Frame>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="text-base font-bold text-brand-ink">What each one costs behind the screen</h2>
        <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-600">
          All three need the same two things from the backend, so the letter you
          pick is a design choice, not a schedule one.
        </p>
        <ul className="mt-3 space-y-2 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="text-brand-ink">A resume with no target role.</strong>{" "}
            The writer currently leans on the role to decide what leads. Without
            one it leads on your strongest evidence instead - and the honest
            feedback afterwards says plainly that a resume aimed at a role will
            always beat a general one, with a button to aim this same record at
            a role.
          </li>
          <li>
            <strong className="text-brand-ink">Reading a resume they already have.</strong>{" "}
            We already read uploaded PDFs and Word files for the profile import,
            so the parsing exists. What it gains: their existing resume becomes
            the starting draft, we say what is missing against the role, and
            every change is theirs to accept - we never quietly delete a line
            somebody wrote about their own life.
          </li>
        </ul>
        <p className="mt-3 text-[0.86rem] leading-relaxed text-slate-600">
          One rule holds across all three: an improved resume is still gated on
          being complete. If their upload has no education section, the download
          stays shut and we name what is missing - the same rule as a resume
          built from scratch.
        </p>
      </section>
    </main>
  );
}
