"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeSwitch } from "@/components/theme-switch";

// The five persistent destinations from the Blueprint. Every route in the app
// belongs to exactly one destination (`match`), so the bar always shows where
// you are — modules open inside destinations, never as separate islands.
const DESTINATIONS = [
  { label: "Home", href: "/", match: ["/", "/start", "/tools", "/resume", "/journey"] },
  { label: "Discover", href: "/discover", match: ["/discover"] },
  { label: "Practice", href: "/practice", match: ["/practice", "/readiness", "/interview"] },
  { label: "Passport", href: "/passport", match: ["/passport"] },
  { label: "Opportunities", href: "/opportunities", match: ["/opportunities"] },
];

function isActive(pathname: string, match: string[]): boolean {
  return match.some((m) =>
    m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(`${m}/`),
  );
}

type Account = { email: string; name: string };

// The display name comes from the identity provider (Google gives a full
// name) and falls back to the part of the email before the @, so the menu
// always greets a person rather than an address.
function toAccount(user: { email?: string; user_metadata?: Record<string, unknown> } | undefined):
  Account | null {
  if (!user?.email) return null;
  const meta = user.user_metadata ?? {};
  const named = [meta.full_name, meta.name, meta.user_name].find(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
  const fallback = user.email.split("@")[0]!.replace(/[._-]+/g, " ");
  return {
    email: user.email,
    name: (named ?? fallback).replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

// undefined = still checking, null = signed out.
function useAccount(): Account | null | undefined {
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth
      .getSession()
      .then(({ data }) => setAccount(toAccount(data.session?.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setAccount(toAccount(session?.user)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return account;
}

function AuthControls({ account }: { account: Account | null | undefined }) {
  if (account === undefined) return <span className="h-8 w-8" aria-hidden />;

  if (account === null) {
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

  return <AccountMenu account={account} />;
}

// Avatar opens an account menu (Blueprint header pattern) instead of showing
// a bare "Sign out" link next to the photo.
function AccountMenu({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${account.name}`}
        className={`grid h-9 w-9 place-items-center rounded-full border-2 bg-gradient-to-br from-[#f7b2d0] to-[#b8a6f5] text-sm font-bold text-[#5d3f8f] transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet ${
          open
            ? "border-brand-violet-deep ring-3 ring-brand-violet/20"
            : "border-brand-violet hover:ring-3 hover:ring-brand-violet/15"
        }`}
      >
        {account.name[0]?.toUpperCase()}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-lg"
        >
          <div className="border-b border-slate-100 px-3.5 py-2.5">
            <p className="truncate text-[0.9rem] font-semibold text-slate-900" title={account.name}>
              {account.name}
            </p>
            <p className="truncate text-[0.78rem] text-slate-500" title={account.email}>
              {account.email}
            </p>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block border-b border-slate-100 px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Your profile
          </Link>
          {/* Pilot: shown to every signed-in user. The API decides for real —
              set ADMIN_EMAILS and non-admins get 403 and lose this entry. */}
          <Link
            href="/admin"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block border-b border-slate-100 px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Admin console
            <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-700">
              admins
            </span>
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block border-b border-slate-100 px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Settings
          </Link>
          <div className="border-b border-slate-100 px-3.5 py-2.5">
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Appearance
            </p>
            <ThemeSwitch />
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void supabaseBrowser().auth.signOut();
            }}
            className="block w-full px-3.5 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const account = useAccount();
  // Every destination behind the logo is a login wall. Showing five of them to
  // a visitor who has not signed up is five dead ends on the page that has to
  // do the most work.
  const signedIn = Boolean(account);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        {/* The wordmark goes to the front door, not to the signed-in home.
            "/" is the person's own journey once they are in; the brand mark
            should still reach the page that says what this is. */}
        <Link
          href="/welcome"
          className="flex shrink-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
        >
          <BrandLogo size={30} />
          <span className="text-lg font-extrabold tracking-[0.12em] text-brand-ink">
            ASCEND
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className={`-mx-2 min-w-0 overflow-x-auto ${signedIn ? "flex" : "hidden"}`}
        >
          {DESTINATIONS.map(({ label, href, match }) => {
            const active = isActive(pathname, match);
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
        <AuthControls account={account} />
      </div>
    </header>
  );
}
