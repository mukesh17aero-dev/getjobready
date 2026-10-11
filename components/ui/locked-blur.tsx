"use client";

import Link from "next/link";
import { ArrowRight } from "./icons";

// Content a signed-out visitor can see the shape of but not read.
//
// Blur is a deliberate choice over hiding: hiding says "there is nothing
// here", blurring says "there is more, and it is like this". The shape stays
// honest - real cards, real count - while the words behind them do not.
//
// Two rules this must not break:
//
//  - The blurred content is aria-hidden and inert. A screen reader that reads
//    it aloud would make the gate decorative, and a keyboard that could tab
//    into it would make it broken. Blur is a visual effect, not a permission.
//  - It is never the only thing on a screen. Something has to be readable
//    first, or the page is a wall rather than a window.

// Signing up from here has to come back here, or the blur was a door to
// nowhere. Same shape as SignUpPrompt's ?next=.
function signUpHref(): string {
  const here =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/";
  return `/welcome?auth=signup&next=${encodeURIComponent(here)}`;
}

/** Blurs its children and covers them with the reason they are blurred. */
/**
 * The blur on its own, with no ask attached.
 *
 * For a set of locked things rather than one: putting the prompt on every
 * card asks the same question once per card, and the boundary is the same
 * whichever card somebody is looking at. Pair this with one LockedFooter.
 */
export function Blurred({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      inert
      className="pointer-events-none select-none blur-[7px] saturate-50"
    >
      {children}
    </div>
  );
}

export function Locked({
  /** One line: what is behind this, said plainly. */
  label,
  /** Shown on the card. Keep it short - this is a nudge, not a page. */
  cta = "Create an account",
  children,
}: {
  label: string;
  cta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden
        inert
        className="pointer-events-none select-none blur-[7px] saturate-50"
      >
        {children}
      </div>

      <div className="absolute inset-0 grid place-items-center p-3">
        <div className="max-w-[16rem] rounded-xl border border-slate-200 bg-surface/95 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
          <p className="text-[0.78rem] font-semibold leading-snug text-brand-ink">
            {label}
          </p>
          <Link
            href={signUpHref()}
            className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-teal-deep px-3 py-1.5 text-[0.75rem] font-bold text-white transition-colors hover:bg-brand-teal"
          >
            {cta}
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** The bar under a locked set: says how much is behind it, and opens the door. */
/**
 * The same statement without the button, for a screen that already carries
 * one. Two "Create an account" buttons a few inches apart is not twice the
 * invitation - it reads as a wall, and the second one makes the first look
 * like it was not meant.
 */
export function LockedNote({ label }: { label: string }) {
  return (
    <p className="mt-4 rounded-2xl border border-slate-200 bg-brand-mist px-4 py-3 text-[0.84rem] leading-snug text-slate-600">
      {label}
    </p>
  );
}

export function LockedFooter({ label }: { label: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-brand-mist px-4 py-3">
      <p className="text-[0.84rem] leading-snug text-slate-600">{label}</p>
      <Link
        href={signUpHref()}
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-teal-deep px-4 py-2 text-[0.8rem] font-bold text-white transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      >
        Create an account
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

/**
 * A whole block behind one prompt, rather than a prompt per item.
 *
 * The per-card version asked the same question once for every card on screen,
 * which reads as nagging rather than as a boundary. The boundary is the same
 * whichever card somebody lands on, so it is stated once, over the lot.
 */
export function LockedGroup({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden
        inert
        className="pointer-events-none select-none blur-[7px] saturate-50"
      >
        {children}
      </div>

      <div className="absolute inset-0 grid place-items-start justify-center pt-12">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-surface/95 px-5 py-4 text-center shadow-lg backdrop-blur-sm">
          <p className="text-[0.92rem] font-bold leading-snug text-brand-ink">
            {label}
          </p>
          <p className="mt-1 text-[0.82rem] leading-relaxed text-slate-600">
            {note}
          </p>
          <Link
            href={signUpHref()}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-teal-deep px-4 py-2 text-[0.82rem] font-bold text-white transition-colors hover:bg-brand-teal"
          >
            Create an account
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
