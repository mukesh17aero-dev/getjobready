"use client";

// The line between looking and making.
//
// Everything that only reads is open to anyone: the roles, what the work is
// like and what it pays. AI-assisted answers require sign-in. Nobody should
// have to hand over an email to find out what a job is.
//
// The account is asked for at the first moment we would MAKE something for
// this person - a resume, an interview, a discovery result. That is the honest
// place for it, because that is the first moment the thing being made has to
// belong to somebody and be there when they come back.
//
// The prompt itself stays plain - a title, one sentence saying what is about
// to be made, and the two buttons. The honesty is in WHERE it appears, not in
// how much it says.

import { useCallback, useState } from "react";
import { Dialog } from "@/components/ui/dialog";

/** What was being made when the gate closed. Drives the prompt's first line. */
export type GatedAction = {
  /** Names the thing, for the caller's own reference. */
  what: string;
  /** One plain sentence: what is about to be made, and so why an account. */
  why: string;
};

export function useSignUpGate(signedIn: boolean) {
  const [blocked, setBlocked] = useState<GatedAction | null>(null);

  /**
   * Wraps anything that would generate. Signed in, it simply runs. Signed
   * out, it stops and explains - and never silently drops the intent.
   */
  const guard = useCallback(
    (action: GatedAction, run: () => void) => {
      if (signedIn) {
        run();
        return;
      }
      setBlocked(action);
    },
    [signedIn],
  );

  const prompt = blocked ? (
    <SignUpPrompt action={blocked} onClose={() => setBlocked(null)} />
  ) : null;

  return { guard, prompt, blocked: blocked !== null };
}

export function SignUpPrompt({
  action,
  onClose,
}: {
  action: GatedAction;
  onClose: () => void;
}) {
  // Coming back to the same place, mid-thought, is the point of asking here
  // rather than at the door.
  const next =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/";
  const to = (route: string) => `${route}?next=${encodeURIComponent(next)}`;

  return (
    <Dialog title="Create a free account" onClose={onClose}>
      <p className="text-[0.92rem] leading-relaxed text-slate-700">
        {action.why}
      </p>
      <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-500">
        After signing in, you’ll return to this page.
      </p>

      <div className="mt-5 grid gap-2.5">
        <a
          href={to("/signup")}
          className="grid min-h-12 place-items-center rounded-full bg-brand-violet px-6 text-sm font-bold text-white"
        >
          Sign up free
        </a>
        <a
          href={to("/login")}
          className="grid min-h-12 place-items-center rounded-full border border-slate-300 px-6 text-sm font-bold text-slate-700"
        >
          I already have an account
        </a>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 text-[0.84rem] font-semibold text-slate-500"
        >
          Keep looking around
        </button>
      </div>
    </Dialog>
  );
}

/**
 * The standing note on a page someone is reading signed out. It states what is
 * free and what is not, so the gate is never a surprise when they reach it.
 */
export function GlimpseBanner({
  making,
}: {
  /**
   * The one thing that will ask for an account, in a few words.
   *
   * There used to be a "reading" half too - a sentence listing what you could
   * do here without one. It was describing the page somebody was already
   * looking at, and three sentences of preamble above a form is the kind of
   * thing people learn to scroll past. What is worth saying is the single
   * fact they cannot see: where the free part stops.
   */
  making: string;
}) {
  return (
    <p className="rounded-xl border border-brand-violet/25 bg-brand-violet/8 px-3.5 py-2 text-[0.82rem] leading-snug text-slate-600">
      Have a look around — {making}
    </p>
  );
}
