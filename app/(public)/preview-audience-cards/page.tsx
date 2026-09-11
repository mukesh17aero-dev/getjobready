"use client";

import { useState } from "react";
import { ArrowRight } from "@/components/icons";

// Temporary preview: the three-card audience switcher, and the request-access
// sheet colleges and employers submit instead of signing themselves up.
//
// Two placements for the cards and one form, all clickable. Deleted once a
// direction is chosen.
//
// The illustrations are line-art stand-ins drawn in SVG so the layout can be
// judged at the right weight. Real artwork is an asset job, not a code one -
// nothing here should be mistaken for the finished drawing.

type Audience = "student" | "college" | "employer";

const CARDS: Array<{
  id: Audience;
  label: string;
  head: string;
  body: string;
  cta: string;
  /** Null when there is nowhere to send them yet. */
  href: string | null;
  art: React.ReactNode;
}> = [
  {
    id: "student",
    label: "Students",
    head: "Get ready",
    body: "Find work that suits how you think, get ready for it, and leave with proof an employer can check.",
    cta: "Explore the student path",
    href: "/",
    art: (
      <>
        <path d="M18 30 L40 20 L62 30 L40 40 Z" />
        <path d="M52 35v10c0 4-5.4 7-12 7s-12-3-12-7V35" />
        <path d="M62 30v12" />
        <path d="M40 58c14 0 10 10 24 10" strokeDasharray="4 4" />
        <circle cx="68" cy="66" r="5" />
      </>
    ),
  },
  {
    id: "college",
    label: "Colleges",
    head: "See the cohort",
    body: "Readiness across a year group, measured from work students were scored on — early enough to change the outcome.",
    cta: "See college insights",
    href: "/for/colleges",
    art: (
      <>
        <circle cx="16" cy="26" r="5" />
        <circle cx="16" cy="54" r="5" />
        <circle cx="40" cy="40" r="6" />
        <path d="M21 28l14 9M21 52l14-9" strokeDasharray="3 3" />
        <path d="M48 40h10" strokeDasharray="3 3" />
        <path d="M60 62V44l12-8 12 8v18Z" />
        <path d="M68 62V52h8v10" />
      </>
    ),
  },
  {
    id: "employer",
    label: "Employers",
    head: "Hire on evidence",
    body: "Candidates arrive with a record of work that was observed and marked, so screening rests on what they did.",
    cta: "See employer tools",
    href: "/for/employers",
    art: (
      <>
        <circle cx="22" cy="26" r="7" />
        <path d="M10 52c0-7 5.4-12 12-12s12 5 12 12" />
        <rect x="44" y="20" width="44" height="32" rx="3" />
        <circle cx="58" cy="32" r="5" />
        <path d="M50 46c0-5 3.6-8 8-8s8 3 8 8" />
        <path d="M72 30h10M72 38h10" />
      </>
    ),
  },
];

function Art({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 100 76"
      aria-hidden
      className="h-24 w-full text-brand-teal"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function AudienceCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {CARDS.map((c) => (
        <div
          key={c.id}
          className="flex flex-col rounded-2xl border border-slate-200 bg-surface p-5"
        >
          {!compact && (
            <div className="rounded-xl bg-brand-mist p-3">
              <Art>{c.art}</Art>
            </div>
          )}
          <p className="mt-4 text-[0.78rem] font-semibold text-slate-500">
            {c.label}
          </p>
          <h3 className="mt-0.5 font-display text-[1.35rem] font-bold leading-tight text-brand-ink">
            {c.head}
          </h3>
          <p className="mt-2 flex-1 text-[0.83rem] leading-relaxed text-slate-500">
            {c.body}
          </p>
          <span className="mt-4 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-xl bg-brand-teal-deep px-4 py-2.5 text-[0.8rem] font-bold text-white">
            {c.cta}
            <ArrowRight size={14} />
          </span>
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------------- request access

const FIELDS = [
  {
    id: "org",
    label: "Organisation",
    hint: "College or company name",
    wide: false,
  },
  { id: "name", label: "Your name", hint: "", wide: false },
  { id: "email", label: "Work email", hint: "We reply here", wide: false },
  {
    id: "role",
    label: "Your role",
    hint: "e.g. Placement Officer",
    wide: false,
  },
];

// Where requests go until there is an endpoint to receive them. Assembling a
// mailto means this works today with no backend at all - the cost is that it
// needs a mail client on the other end, and the address is readable in the
// page source.
const INBOX = "issac1993@gmail.com";

function RequestAccess() {
  const [kind, setKind] = useState<"college" | "employer">("college");
  const [sent, setSent] = useState(false);

  function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const body = [
      `Organisation: ${get("org")}`,
      `Name: ${get("name")}`,
      `Email: ${get("email")}`,
      `Role: ${get("role")}`,
      `Type: ${kind}`,
      "",
      get("note") || "(no note)",
    ].join("\n");
    window.location.href = `mailto:${INBOX}?subject=${encodeURIComponent(
      `Ascend access request - ${get("org") || kind}`,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-teal-600/30 bg-teal-50/60 p-6 text-center">
        <p className="font-display text-[1.1rem] font-bold text-brand-ink">
          Your email client should have opened.
        </p>
        <p className="mx-auto mt-2 max-w-md text-[0.86rem] leading-relaxed text-slate-600">
          Send the message and somebody from Ascend will reach out to you.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 cursor-pointer text-[0.78rem] font-semibold text-brand-teal-deep underline underline-offset-2"
        >
          Reset the form
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={send}
      className="rounded-2xl border border-slate-200 bg-surface p-5"
    >
      <h3 className="font-display text-[1.1rem] font-bold text-brand-ink">
        Request access
      </h3>
      <p className="mt-1.5 text-[0.85rem] leading-relaxed text-slate-500">
        Tell us who you are and we will reach out to you.
      </p>

      <fieldset className="mt-4">
        <legend className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-slate-400">
          I am from a
        </legend>
        <div className="mt-2 flex gap-1.5">
          {(["college", "employer"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-[0.8rem] font-bold capitalize transition-colors ${
                kind === k
                  ? "bg-brand-teal-deep text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.id} className="block">
            <span className="block text-[0.76rem] font-semibold text-brand-ink">
              {f.label}
            </span>
            <input
              required
              type={f.id === "email" ? "email" : "text"}
              name={f.id}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] text-brand-ink outline-none focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal/25"
            />
            {f.hint && (
              <span className="mt-0.5 block text-[0.7rem] text-slate-400">
                {f.hint}
              </span>
            )}
          </label>
        ))}
        <label className="block sm:col-span-2">
          <span className="block text-[0.76rem] font-semibold text-brand-ink">
            What are you hoping to do?{" "}
            <span className="font-normal text-slate-400">Optional</span>
          </span>
          <textarea
            name="note"
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] text-brand-ink outline-none focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal/25"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-teal-deep px-5 py-2.5 text-[0.85rem] font-bold text-white transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      >
        Send request
        <ArrowRight size={15} />
      </button>
      <p className="mt-2 text-[0.72rem] text-slate-400">
        Opens your mail client, addressed to Ascend with the answers filled in.
      </p>
    </form>
  );
}

// -------------------------------------------------------------------- page

function Block({
  n,
  title,
  what,
  cost,
  children,
}: {
  n: string;
  title: string;
  what: string;
  cost: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-[1.1rem] font-bold text-brand-ink">
        {n} · {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-[0.87rem] leading-relaxed text-slate-600">
        {what}
      </p>
      <p className="mt-2 max-w-2xl border-l-2 border-slate-300 pl-3 text-[0.81rem] leading-relaxed text-slate-500">
        <strong className="font-semibold text-brand-ink">Trade-off:</strong>{" "}
        {cost}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function PreviewAudienceCards() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-400">
        Preview · not linked · everything is clickable
      </p>
      <h1 className="mt-2 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        Three-card audience switcher, and the request sheet
      </h1>
      <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-slate-600">
        The cards in your reference, plus the form colleges and employers send
        instead of signing themselves up. Two placements below — the difference
        is what a returning student has to scroll past.
      </p>

      <div className="mt-9 space-y-10">
        <Block
          n="A"
          title="The cards are the home screen"
          what="A visitor picks who they are before seeing anything else. Once chosen, home is that audience's screen and the cards do not come back."
          cost="A returning student pays a screen of scrolling — or a click — every visit until the choice is remembered. Only worth it if the choice really is remembered."
        >
          <AudienceCards />
        </Block>

        <Block
          n="B"
          title="A strip above the student doors"
          what="The student home stays the home. The three cards sit above it, smaller, for the visitor who is not a student."
          cost="Pushes the six doors down the page for everybody. Compact art or none keeps that cost to about one card height."
        >
          <div className="space-y-4">
            <AudienceCards compact />
            <div className="rounded-2xl border border-dashed border-slate-300 bg-brand-mist px-4 py-6 text-center text-[0.82rem] text-slate-500">
              ↓ the six doors, as they are today
            </div>
          </div>
        </Block>

        <Block
          n="C"
          title="Request access — colleges and employers"
          what="No self-serve signup. They tell you who they are, you onboard them by hand and issue credentials."
          cost="Somebody has to answer these. Five fields is already near the limit before people stop filling it in."
        >
          <RequestAccess />
        </Block>
      </div>

      <section className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-display text-[1.05rem] font-bold text-amber-900">
          How this sends, and what it costs
        </h2>
        <ul className="mt-3 space-y-2.5 text-[0.86rem] leading-relaxed text-amber-900">
          <li>
            <strong className="font-semibold">
              Today it opens their mail client.
            </strong>{" "}
            Submitting builds a message to{" "}
            <code className="font-mono">issac1993@gmail.com</code> with every
            answer filled in. No backend, works this week — but it only works
            for somebody who has a mail client set up, and a placement officer
            on a locked-down college desktop may not.
          </li>
          <li>
            <strong className="font-semibold">
              The address is readable in the page source.
            </strong>{" "}
            A personal Gmail on a public page will be scraped and will start
            attracting spam. A role address you can filter or abandon is a safer
            thing to publish than your own inbox.
          </li>
          <li>
            <strong className="font-semibold">
              The durable answer is one backend endpoint.
            </strong>{" "}
            <code className="font-mono">POST /v1/access-requests</code> on{" "}
            <code className="font-mono">ascend-backend</code>, taking the same
            six fields and emailing you. Then the form submits in place, nobody
            needs a mail client, the address is never published, and it can be
            rate limited. This repo may not hold that logic.
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-brand-mist p-5">
        <h2 className="font-display text-[1.05rem] font-bold text-brand-ink">
          Two notes on the reference
        </h2>
        <ul className="mt-3 space-y-2.5 text-[0.86rem] leading-relaxed text-slate-600">
          <li>
            <strong className="font-semibold text-brand-ink">
              I changed the employer copy.
            </strong>{" "}
            The reference says &ldquo;access a pre-vetted talent pool&rdquo;.
            There is no pool — no candidate has completed a journey yet, and
            promising one on the front door is the kind of claim that costs
            trust the moment somebody clicks. Mine describes what the software
            does instead.
          </li>
          <li>
            <strong className="font-semibold text-brand-ink">
              The drawings are stand-ins.
            </strong>{" "}
            Line art in SVG, so the weight and spacing are right to judge. The
            reference&rsquo;s illustrations are commissioned artwork — that is a
            design purchase, not something to generate.
          </li>
        </ul>
      </section>
    </main>
  );
}
