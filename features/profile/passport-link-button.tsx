"use client";

import { useState } from "react";
import Link from "next/link";
import { getPassportOverview } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";

// The resume's one link field is meant for exactly this - a Passport is a
// stronger thing to put in front of an employer than a bare LinkedIn URL,
// when there is one to offer. Never overwrites without being asked; a click
// is the only way this field changes.

export function PassportLinkButton({ onFound }: { onFound: (url: string) => void }) {
  const [state, setState] = useState<"idle" | "checking" | "none">("idle");

  const check = async () => {
    setState("checking");
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setState("idle");
      return;
    }
    const result = await getPassportOverview(token);
    const active = result?.overview.sharing.active;
    if (!active) {
      setState("none");
      return;
    }
    onFound(`${window.location.origin}/passport/${active.token}`);
    setState("idle");
  };

  return (
    <div className="-mt-3">
      <button
        type="button"
        onClick={() => void check()}
        disabled={state === "checking"}
        className="text-[0.75rem] font-semibold text-brand-violet-deep underline decoration-dotted underline-offset-2 disabled:opacity-60"
      >
        {state === "checking" ? "Checking…" : "Use my Career Passport link instead"}
      </button>
      {state === "none" && (
        <p className="mt-1 text-[0.75rem] text-slate-500">
          You don&apos;t have a shareable Passport yet.{" "}
          <Link href="/passport" className="underline">
            Open your Passport
          </Link>{" "}
          once you have real work recorded, and share it from there.
        </p>
      )}
    </div>
  );
}
