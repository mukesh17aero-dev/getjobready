"use client";

import { useState } from "react";

// Temporary comparison page: five ways to give Colleges and Employers their
// own entry point, without taxing the students who are the only audience with
// anything built yet.
//
// Every option here is interactive, because friction is a thing you feel
// rather than read. Click through each one as a student first, then as a
// college, and watch the tap count in the corner of each panel.
//
// The number that decides this: today, every working feature serves students.
// A chooser that stops everyone at the door to ask who they are charges the
// whole audience for a door that only two in a hundred need.
//
// Self-contained, not linked from the site, deleted once a direction is set.

type Audience = "student" | "college" | "employer";

const AUDIENCES: Array<{ id: Audience; label: string; short: string; line: string; glyph: string }> = [
  {
    id: "student",
    label: "Students & early professionals",
    short: "Students",
    line: "Find a role that suits you, get ready for it, and prove you can do it.",
    glyph: "\u{1F393}",
  },
  {
    id: "college",
    label: "Colleges & universities",
    short: "Colleges",
    line: "See where a whole year group stands, early enough to change it.",
    glyph: "\u{1F3EB}",
  },
  {
    id: "employer",
    label: "Employers",
    short: "Employers",
    line: "Judge candidates on what they were observed doing, not what they claim.",
    glyph: "\u{1F91D}",
  },
];

const READY: Record<Audience, boolean> = {
  student: true,
  college: false,
  employer: false,
};

// ---------------------------------------------------------------- pieces

function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-brand-mist px-4 py-2.5">
        <span className="font-mono text-[0.7rem] font-bold tracking-[0.18em] text-slate-500">
          ASCEND
        </span>
        <span className="ml-auto flex gap-1.5">
          {["Discover", "Practice", "Passport"].map((n) => (
            <span key={n} className="text-[0.7rem] text-slate-400">
              {n}
            </span>
          ))}
        </span>
      </div>
      {children}
    </div>
  );
}

function Body({ audience }: { audience: Audience }) {
  const a = AUDIENCES.find((x) => x.id === audience)!;
  return (
    <div className="px-4 py-5">
      <p className="font-display text-[1.1rem] font-bold text-brand-ink">
        {audience === "student" ? "Hi Nithin — welcome back." : a.label}
      </p>
      <p className="mt-1 text-[0.82rem] leading-snug text-slate-500">{a.line}</p>
      {READY[audience] ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Discovery", "Resume", "Interview"].map((c) => (
            <div
              key={c}
              className="rounded-xl border border-slate-200 bg-brand-mist px-2.5 py-3 text-center text-[0.72rem] font-semibold text-brand-ink"
            >
              {c}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[0.75rem] text-amber-900">
          Nothing here is released yet — the cards say what is coming.
        </p>
      )}
    </div>
  );
}

function Taps({ student, other }: { student: string; other: string }) {
  return (
    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.72rem]">
      <div className="flex gap-1.5">
        <dt className="text-slate-400">Student reaches product in</dt>
        <dd className="font-bold text-brand-ink">{student}</dd>
      </div>
      <div className="flex gap-1.5">
        <dt className="text-slate-400">College reaches their view in</dt>
        <dd className="font-bold text-brand-ink">{other}</dd>
      </div>
    </dl>
  );
}

function Option({
  n,
  title,
  what,
  cost,
  taps,
  recommended = false,
  children,
}: {
  n: string;
  title: string;
  what: string;
  cost: string;
  taps: { student: string; other: string };
  recommended?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-5 ${
        recommended
          ? "border-brand-teal bg-teal-50/40 shadow-[0_10px_30px_-18px_rgba(13,148,136,0.5)]"
          : "border-slate-200 bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[1.1rem] font-bold text-brand-ink">
          {n} · {title}
        </h2>
        {recommended && (
          <span className="rounded-full bg-brand-teal-deep px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
            Recommended
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[0.86rem] leading-relaxed text-slate-600">
        {what}
      </p>
      <p className="mt-2 border-l-2 border-slate-300 pl-3 text-[0.8rem] leading-relaxed text-slate-500">
        <strong className="font-semibold text-brand-ink">The cost:</strong>{" "}
        {cost}
      </p>
      <Taps {...taps} />
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ------------------------------------------------------------- prototypes

/** A — three doors on the welcome screen, chosen once. */
function FrontDoor() {
  const [chosen, setChosen] = useState<Audience | null>(null);
  if (chosen) {
    return (
      <div>
        <Chrome>
          <Body audience={chosen} />
        </Chrome>
        <button
          type="button"
          onClick={() => setChosen(null)}
          className="mt-2 cursor-pointer text-[0.75rem] font-semibold text-brand-teal-deep underline underline-offset-2"
        >
          Reset — see the door again
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-brand-mist p-4">
      <p className="text-center font-display text-[1rem] font-bold text-brand-ink">
        Who is this for?
      </p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {AUDIENCES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setChosen(a.id)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-surface p-3 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-teal motion-reduce:hover:translate-y-0"
          >
            <span aria-hidden className="text-[1.5rem]">
              {a.glyph}
            </span>
            <span className="mt-1 block font-display text-[0.85rem] font-bold text-brand-ink">
              {a.short}
            </span>
            <span className="mt-0.5 block text-[0.72rem] leading-snug text-slate-500">
              {a.line}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** B — a segmented control living in the header, always visible. */
function HeaderSwitch() {
  const [audience, setAudience] = useState<Audience>("student");
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-brand-mist px-4 py-2.5">
        <span className="font-mono text-[0.7rem] font-bold tracking-[0.18em] text-slate-500">
          ASCEND
        </span>
        <div className="ml-auto flex rounded-lg bg-slate-200/70 p-0.5">
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAudience(a.id)}
              aria-pressed={audience === a.id}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-[0.7rem] font-bold transition-colors ${
                audience === a.id
                  ? "bg-surface text-brand-ink shadow-sm"
                  : "text-slate-500 hover:text-brand-ink"
              }`}
            >
              {a.short}
            </button>
          ))}
        </div>
      </div>
      <Body audience={audience} />
    </div>
  );
}

/** C — nobody is asked. Students land in the product; a quiet line offers the rest. */
function StraightThrough() {
  const [audience, setAudience] = useState<Audience>("student");
  return (
    <div>
      <Chrome>
        <Body audience={audience} />
        <div className="border-t border-slate-200 px-4 py-2.5">
          <p className="text-[0.75rem] text-slate-500">
            {audience === "student" ? "Not a student?" : "Looking for the student view?"}{" "}
            {AUDIENCES.filter((a) => a.id !== audience).map((a, i) => (
              <span key={a.id}>
                {i > 0 && <span className="text-slate-300"> · </span>}
                <button
                  type="button"
                  onClick={() => setAudience(a.id)}
                  className="cursor-pointer font-semibold text-brand-teal-deep underline underline-offset-2 hover:text-brand-teal"
                >
                  {a.short}
                </button>
              </span>
            ))}
          </p>
        </div>
      </Chrome>
    </div>
  );
}

/** D — the popup, shown once. */
function FirstVisitModal() {
  const [open, setOpen] = useState(true);
  const [audience, setAudience] = useState<Audience>("student");
  return (
    <div className="relative">
      <Chrome>
        <Body audience={audience} />
      </Chrome>
      {open && (
        <div className="absolute inset-0 grid place-items-center rounded-2xl bg-brand-ink/60 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-label="Who are you?"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-surface p-4 shadow-xl"
          >
            <p className="font-display text-[0.98rem] font-bold text-brand-ink">
              Before we start — who are you?
            </p>
            <div className="mt-3 space-y-1.5">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setAudience(a.id);
                    setOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2 text-left text-[0.82rem] font-semibold text-brand-ink transition-colors hover:border-brand-teal hover:bg-brand-mist"
                >
                  <span aria-hidden>{a.glyph}</span>
                  {a.short}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full cursor-pointer text-[0.75rem] text-slate-500 underline underline-offset-2"
            >
              Skip — just show me the product
            </button>
          </div>
        </div>
      )}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 cursor-pointer text-[0.75rem] font-semibold text-brand-teal-deep underline underline-offset-2"
        >
          Reset — show the popup again
        </button>
      )}
    </div>
  );
}

/** E — a slim strip on home, non-blocking and dismissible. */
function ContextStrip() {
  const [audience, setAudience] = useState<Audience>("student");
  const [dismissed, setDismissed] = useState(false);
  return (
    <div>
      <Chrome>
        {!dismissed && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 bg-brand-mist px-4 py-2">
            <span className="text-[0.75rem] text-slate-500">
              Showing the{" "}
              <strong className="font-semibold text-brand-ink">
                {AUDIENCES.find((a) => a.id === audience)!.short.toLowerCase()}
              </strong>{" "}
              view.
            </span>
            {AUDIENCES.filter((a) => a.id !== audience).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAudience(a.id)}
                className="cursor-pointer rounded-full bg-surface px-2.5 py-0.5 text-[0.72rem] font-bold text-brand-teal-deep ring-1 ring-slate-200 transition-colors hover:ring-brand-teal"
              >
                {a.short}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="ml-auto cursor-pointer text-[0.9rem] leading-none text-slate-400 hover:text-brand-ink"
            >
              ×
            </button>
          </div>
        )}
        <Body audience={audience} />
      </Chrome>
      {dismissed && (
        <button
          type="button"
          onClick={() => setDismissed(false)}
          className="mt-2 cursor-pointer text-[0.75rem] font-semibold text-brand-teal-deep underline underline-offset-2"
        >
          Reset — bring the strip back
        </button>
      )}
    </div>
  );
}

// -------------------------------------------------------------------- page

export default function PreviewAudienceDoors() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-400">
        Preview · not linked · all five are clickable
      </p>
      <h1 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        Five ways to let three audiences in
      </h1>
      <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
        Tabs make the three audiences look equal. They are not: every working
        feature today serves students, and Colleges and Employers have nothing
        to open. Any pattern that stops everybody at the door to ask who they
        are charges the whole audience for a door that almost nobody needs.
      </p>
      <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
        So the question is not which chooser looks best. It is how little you
        can ask of a student while still giving a placement officer somewhere
        to land when they arrive from a pitch. Click each one — as a student
        first, then as a college.
      </p>

      <div className="mt-9 space-y-6">
        <Option
          n="A"
          title="Three doors on the welcome screen"
          what="The pattern in your reference: three cards at the front door, chosen once and remembered. The home screen never asks again."
          cost="Every student pays a click before seeing anything, and a first-time visitor has to classify themselves before you have told them what this is."
          taps={{ student: "1 tap", other: "1 tap" }}
        >
          <FrontDoor />
        </Option>

        <Option
          n="B"
          title="Segmented control in the header"
          what="A permanent three-way switch beside the logo. Nothing blocks; anyone can flip audience at any moment."
          cost="Permanent chrome on every screen, and it advertises three equal products when two of them are empty. It also competes with the main nav for the same eye."
          taps={{ student: "0 taps", other: "1 tap" }}
        >
          <HeaderSwitch />
        </Option>

        <Option
          n="C"
          title="Straight through, with a quiet door"
          what="Nobody is asked anything. Students land in the product. One small line under the content offers the other two views to the few people who need them."
          cost="A college visitor has to notice a small link. That is a real cost — but it is paid by the audience that is not yet served, rather than by the one that is."
          taps={{ student: "0 taps", other: "1 tap, once noticed" }}
          recommended
        >
          <StraightThrough />
        </Option>

        <Option
          n="D"
          title="First-visit popup"
          what="The modal you asked about: shown once, remembered after. Everything behind it waits."
          cost="The highest-friction option on the page. It interrupts before you have earned the attention, and it asks a question the product could answer itself. The skip link is doing most of the work."
          taps={{ student: "1 tap to dismiss", other: "1 tap" }}
        >
          <FirstVisitModal />
        </Option>

        <Option
          n="E"
          title="Context strip on home"
          what="A slim, dismissible bar above the content: it names the view you are in and offers the other two. Non-blocking, and it disappears once dismissed."
          cost="One more horizontal band on a screen that already has a header. Dismissal state has to be remembered per person or it becomes nagging."
          taps={{ student: "0 taps", other: "1 tap" }}
        >
          <ContextStrip />
        </Option>
      </div>

      {/* ---- the recommendation ---- */}
      <section className="mt-10 rounded-2xl border border-slate-200 bg-brand-mist p-5">
        <h2 className="font-display text-[1.05rem] font-bold text-brand-ink">
          What I would ship
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-slate-600">
          <strong className="font-semibold text-brand-ink">A and C together, split by surface.</strong>{" "}
          The welcome screen gets the three doors, because a placement officer
          arriving from a pitch deck needs an obvious place to land and that
          screen exists to explain what this is. The signed-in home gets no
          chooser at all — just the quiet line from option C — because by then
          we already know who they are.
        </p>
        <ul className="mt-3 space-y-2 text-[0.85rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-brand-ink">Never ask twice.</strong>{" "}
            Whatever is chosen at the front door is remembered, so the home
            screen opens in the right view without a second question.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">Give colleges and employers a real URL.</strong>{" "}
            /for/colleges and /for/employers can be linked from a deck, an
            email or a footer. That is worth more than any in-app switch,
            because those audiences arrive from outside rather than browsing in.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">Do not use the popup.</strong>{" "}
            It is the only option here that stops somebody before they have
            seen anything, to ask a question two thirds of them will answer the
            same way.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">Watch the copy.</strong>{" "}
            The reference cards promise employer partnerships and top talent.
            We do not have those yet, and a claim like that on the front door
            is exactly the kind of thing that costs trust on the second visit.
          </li>
        </ul>
      </section>
    </main>
  );
}
