"use client";

// Four places to put the discovery assistant on a role description.
//
// The job description is the thing somebody came to read, and the assistant is
// the thing that makes it worth more than a job board. Those two facts pull in
// opposite directions: give the chat room and it crowds the page, hide it and
// nobody discovers it exists. Each of these makes that trade differently.
//
//   Column   a fixed narrow column beside the role. Always visible, never in
//            the way, costs a fifth of the page on a laptop.
//   Bubble   a floating button that opens a panel over the content. Costs
//            nothing until used; easy to ignore, which cuts both ways.
//   Drawer   a labelled tab on the edge that slides a panel in and pushes the
//            role across. Discoverable, and the role keeps full width when
//            it is shut.
//   Dock     a bar across the bottom that grows into a sheet. What a phone
//            does naturally, applied to both sizes.
//
// The chat inside is a stand-in so the four can be compared fairly - the real
// one is components/discovery-assistant.tsx and drops into any of these.

import { useState } from "react";
import { RoleBody } from "@/components/role-preview";
import { ROLES } from "../preview-role-tour/fixture";

const ROLE = ROLES[0]!;

const OPTIONS = [
  { id: "column", name: "Column", line: "A fixed narrow column beside the role. Always there, always costs the space." },
  { id: "bubble", name: "Bubble", line: "A floating button that opens over the page. Costs nothing until it is used." },
  { id: "drawer", name: "Drawer", line: "A tab on the edge that slides in and pushes the role across." },
  { id: "dock", name: "Dock", line: "A bar along the bottom that grows into a sheet." },
] as const;

export default function PreviewChatLooks() {
  const [option, setOption] = useState<(typeof OPTIONS)[number]["id"]>("column");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
        Preview
      </p>
      <h1 className="mt-1 font-display text-[2rem] font-bold leading-tight tracking-tight text-brand-ink">
        Where the assistant sits on a role
      </h1>
      <p className="mt-2 max-w-[62ch] text-[0.95rem] leading-relaxed text-slate-500">
        Same role, same chat, four places to put it. Try each one at this width
        and then narrow the window - the difference on a phone is bigger than
        the difference on a laptop.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOption(o.id)}
            aria-pressed={option === o.id}
            className={`min-h-11 rounded-full border px-4 text-[0.85rem] font-bold transition-colors ${
              option === o.id
                ? "border-brand-violet bg-brand-violet text-white"
                : "border-slate-300 text-slate-700 hover:border-slate-400"
            }`}
          >
            {o.name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[0.85rem] text-slate-500">
        {OPTIONS.find((o) => o.id === option)!.line}
      </p>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-3 sm:p-5">
        {option === "column" && <Column />}
        {option === "bubble" && <Bubble />}
        {option === "drawer" && <Drawer />}
        {option === "dock" && <Dock />}
      </div>
    </main>
  );
}

/* ----------------------------------------------------------------- shells -- */

function Column() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <Role />
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <ChatBox open />
      </aside>
    </div>
  );
}

function Bubble() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Role />
      {open ? (
        <div className="fixed bottom-4 right-4 z-40 w-[min(22rem,calc(100vw-2rem))]">
          <ChatBox open onClose={() => setOpen(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex min-h-14 items-center gap-2.5 rounded-full bg-brand-violet pl-3 pr-5 text-[0.88rem] font-bold text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)]"
        >
          <Orb />
          Ask about this role
        </button>
      )}
    </div>
  );
}

function Drawer() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`grid gap-6 ${open ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
      <Role />
      {open ? (
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ChatBox open onClose={() => setOpen(false)} />
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-brand-violet/40 bg-surface py-4 pl-3 pr-2 shadow-lg"
        >
          <Orb small />
          <span className="text-[0.78rem] font-bold text-brand-violet-deep [writing-mode:vertical-rl]">
            Ask about this role
          </span>
        </button>
      )}
    </div>
  );
}

function Dock() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Role />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-surface shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.35)]">
        <div className="mx-auto max-w-4xl">
          {open ? (
            <ChatBox open onClose={() => setOpen(false)} flush />
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left"
            >
              <Orb />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.7rem] font-bold uppercase tracking-[0.08em] text-brand-violet-deep">
                  Discovery assistant
                </span>
                <span className="block text-[0.86rem] font-semibold text-brand-ink">
                  What does the interview for this actually test?
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-brand-violet/45 px-3.5 py-2 text-[0.76rem] font-bold text-brand-violet-deep">
                Ask
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ parts -- */

function Role() {
  return (
    <div className="min-w-0">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {ROLE.sector}
      </p>
      <h2 className="mt-0.5 font-display text-[1.6rem] font-bold leading-tight tracking-tight text-brand-ink">
        Customer Success Associate
      </h2>
      <div className="mt-3">
        <RoleBody role={ROLE} />
      </div>
    </div>
  );
}

function Orb({ small }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-white/40 ${
        small ? "h-6 w-6" : "h-9 w-9"
      }`}
      style={{
        background:
          "radial-gradient(circle at 32% 28%, var(--color-brand-violet-soft) 0%, var(--color-brand-violet) 45%, var(--color-brand-violet-deep) 100%)",
      }}
    >
      <span className="absolute left-[18%] top-[14%] h-1.5 w-1.5 rounded-full bg-white/80 blur-[1px]" />
    </span>
  );
}

const CHIPS = [
  "What is the interview like?",
  "Where can this take me?",
  "What would put me off?",
];

/** A stand-in for the real assistant, so the four shells compare fairly. */
function ChatBox({
  open,
  onClose,
  flush,
}: {
  open: boolean;
  onClose?: () => void;
  flush?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className={`overflow-hidden bg-surface ${
        flush ? "" : "rounded-2xl border border-slate-200 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <span className="flex items-center gap-2.5">
          <Orb />
          <span className="text-[0.84rem] font-bold text-brand-ink">
            About this role
          </span>
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 px-2 text-[0.8rem] font-semibold text-slate-500"
          >
            Close
          </button>
        )}
      </div>

      <div className="max-h-[16rem] overflow-y-auto px-4 py-3">
        <ol className="grid gap-2.5">
          <li className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-50 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-slate-700">
              what is the interview process like
            </p>
          </li>
          <li className="flex gap-2.5">
            <Orb small />
            <p className="rounded-2xl rounded-tl-sm border border-slate-200 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-slate-800">
              A short phone call, then a face-to-face with the store manager,
              sometimes an hour on the floor watching. What they are really
              deciding is whether you stay level when a story turns awkward.
            </p>
          </li>
        </ol>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <span
              key={c}
              className="rounded-full border border-slate-300 bg-surface px-3.5 py-2 text-[0.76rem] font-semibold text-slate-700"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="mt-2.5 flex gap-2">
          <label htmlFor="demo-ask" className="sr-only">
            Ask about this role
          </label>
          <input
            id="demo-ask"
            placeholder="Ask anything…"
            className="min-h-11 min-w-0 flex-1 rounded-full border border-slate-300 bg-surface px-4 text-[0.84rem] outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
          />
          <span className="grid min-h-11 shrink-0 place-items-center rounded-full border border-brand-violet/45 px-4 text-[0.8rem] font-bold text-brand-violet-deep">
            Ask
          </span>
        </div>
      </div>
    </div>
  );
}
