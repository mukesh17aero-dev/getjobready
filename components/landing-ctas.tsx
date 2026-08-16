"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { AuthModal } from "@/components/auth-modal";
import type { AuthMode } from "@/components/auth-form";

const PRIMARY =
  "inline-flex items-center gap-2 rounded-xl bg-[var(--lp-cta-bg)] px-9 py-4 text-[1rem] font-bold text-[var(--lp-cta-ink)] shadow-[0_16px_44px_-12px_rgba(0,0,0,0.65)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_52px_-12px_rgba(45,212,191,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hover:translate-y-0";

// The landing's only conversion point. Signed out, both actions open the
// auth dialog in place (signup or login) instead of navigating away from
// the story; signed in, the climb continues at the profile.
export function LandingCtas({ signedIn }: { signedIn: boolean }) {
  const [mode, setMode] = useState<AuthMode | null>(null);

  // Deep links arrive as /welcome?auth=login|signup (the old /login and
  // /signup routes forward here) - open the dialog they asked for. The
  // ?next= param stays in the URL, where the form's nextPath() reads it.
  useEffect(() => {
    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth !== "login" && auth !== "signup") return;
    const id = window.setTimeout(() => setMode(auth), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <div className="reveal-view mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-4">
        {signedIn ? (
          <Link href="/profile" className={PRIMARY}>
            Begin your climb
            <ArrowRight size={17} />
          </Link>
        ) : (
          <button type="button" onClick={() => setMode("signup")} className={PRIMARY}>
            Begin your climb
            <ArrowRight size={17} />
          </button>
        )}
      </div>
      {!signedIn && (
        <p className="reveal-view mt-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className="inline-block px-3 py-2.5 text-[0.9rem] text-[var(--lp-faint)] underline-offset-4 transition-colors hover:text-[var(--lp-ink)] hover:underline"
          >
            I already have an account
          </button>
        </p>
      )}
      {mode && (
        <AuthModal mode={mode} onClose={() => setMode(null)} onSwitchMode={setMode} />
      )}
    </>
  );
}
