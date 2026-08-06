"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

// The five persistent destinations from the Blueprint. Browser app: sticky top
// bar on all screen sizes — no bottom tab bar. On narrow screens the row
// scrolls horizontally.
const DESTINATIONS = [
  { label: "Home", href: "/" },
  { label: "Discover", href: "/discover" },
  { label: "Practice", href: "/practice" },
  { label: "Passport", href: "/passport" },
  { label: "Opportunities", href: "/opportunities" },
];

function AuthControls() {
  // undefined = still checking, null = signed out, string = signed-in email
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth
      .getSession()
      .then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setEmail(session?.user.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (email === undefined) return <span className="h-8 w-8" aria-hidden />;

  if (email === null) {
    return (
      <span className="flex items-center gap-2">
        <Link
          href="/login"
          className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="whitespace-nowrap rounded-xl bg-brand-violet px-3.5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep"
        >
          Sign up
        </Link>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2.5">
      <span
        title={email}
        className="grid h-8 w-8 place-items-center rounded-full border-2 border-brand-violet bg-gradient-to-br from-[#f7b2d0] to-[#b8a6f5] text-sm font-bold text-[#5d3f8f]"
      >
        {email[0]?.toUpperCase()}
      </span>
      <button
        type="button"
        onClick={() => void supabaseBrowser().auth.signOut()}
        className="whitespace-nowrap text-sm text-slate-600 hover:text-slate-900"
      >
        Sign out
      </button>
    </span>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-violet to-sky-400 text-sm text-white"
          >
            ▲
          </span>
          <span className="text-lg font-extrabold tracking-[0.12em] text-brand-ink">
            ASCEND
          </span>
        </Link>
        <nav aria-label="Primary" className="-mx-2 flex min-w-0 overflow-x-auto">
          {DESTINATIONS.map(({ label, href }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "font-semibold text-brand-violet-deep"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <AuthControls />
      </div>
    </header>
  );
}
