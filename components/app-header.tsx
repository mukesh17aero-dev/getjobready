"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeSwitch } from "@/components/theme-switch";
import { AuthModal } from "@/components/auth-modal";
import { applyTheme } from "@/lib/theme";
import type { AuthMode } from "@/components/auth-form";

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

// Whether the page currently renders dark: the explicit data-theme choice
// if set, the OS preference otherwise. Watches both.
function useResolvedDark(): boolean {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const calc = () => {
      const chosen = document.documentElement.getAttribute("data-theme");
      setDark(chosen ? chosen === "dark" : mq.matches);
    };
    calc();
    mq.addEventListener("change", calc);
    const mo = new MutationObserver(calc);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", calc);
      mo.disconnect();
    };
  }, []);
  return dark;
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

// On the landing (night = true) the auth actions open the in-place dialog
// instead of navigating away; everywhere else they link to the pages.
// Signed-out visitors have no account menu, so the theme choice lives
// here: one button flipping dark and light. (System stays available in the
// account menu once signed in.)
function ThemeQuickToggle({ night }: { night: boolean }) {
  const flip = () => {
    const attr = document.documentElement.getAttribute("data-theme");
    const isDark =
      attr === "dark" ||
      (!attr && window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyTheme(isDark ? "light" : "dark");
  };
  return (
    <button
      type="button"
      onClick={flip}
      aria-label="Switch between dark and light theme"
      className={`grid h-9 w-9 place-items-center rounded-full text-[1rem] transition-colors ${
        night
          ? "text-white/60 hover:bg-white/10 hover:text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      <span aria-hidden>{"\u25D1"}</span>
    </button>
  );
}

function AuthControls({
  account,
  night,
}: {
  account: Account | null | undefined;
  night: boolean;
}) {
  const [mode, setMode] = useState<AuthMode | null>(null);
  if (account === undefined) return <span className="h-8 w-8" aria-hidden />;

  if (account === null) {
    if (night) {
      return (
        <span className="flex items-center gap-2">
          <ThemeQuickToggle night />
          <button
            type="button"
            onClick={() => setMode("login")}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-white/65 transition-colors hover:text-white"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className="whitespace-nowrap rounded-xl bg-white px-3.5 py-1.5 text-sm font-bold text-[#16233f] transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            Sign up
          </button>
          {mode && (
            <AuthModal mode={mode} onClose={() => setMode(null)} onSwitchMode={setMode} />
          )}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2">
        <ThemeQuickToggle night={false} />
        <button
          type="button"
          onClick={() => setMode("login")}
          className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className="whitespace-nowrap rounded-xl bg-brand-violet px-3.5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep"
        >
          Sign up
        </button>
        {mode && (
          <AuthModal mode={mode} onClose={() => setMode(null)} onSwitchMode={setMode} />
        )}
      </span>
    );
  }

  return <AccountMenu account={account} night={night} />;
}

// Avatar opens an account menu (Blueprint header pattern) instead of showing
// a bare "Sign out" link next to the photo.
function AccountMenu({ account, night }: { account: Account; night: boolean }) {
  const router = useRouter();
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
        className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 ${
          night
            ? `bg-white/10 text-white/85 backdrop-blur focus-visible:outline-white ${
                open
                  ? "border-white/60 ring-3 ring-white/15"
                  : "border-white/25 hover:ring-3 hover:ring-white/10"
              }`
            : `bg-gradient-to-br from-[#99f6e4] to-[#5eead4] text-[#134e4a] focus-visible:outline-brand-violet ${
                open
                  ? "border-brand-violet-deep ring-3 ring-brand-violet/20"
                  : "border-brand-violet hover:ring-3 hover:ring-brand-violet/15"
              }`
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
              // Sign out, then land on the front door - never leave someone
              // staring at a signed-in page their session no longer owns.
              void supabaseBrowser()
                .auth.signOut()
                .then(() => {
                  router.push("/welcome");
                  router.refresh();
                });
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
  const darkTheme = useResolvedDark();
  // The landing wears the night header only when the resolved theme is
  // dark; a light-theme visitor gets a light landing and a light header.
  // /welcome is always the landing; / is the landing when signed out.
  const night =
    darkTheme && (pathname === "/welcome" || (pathname === "/" && !signedIn));

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur ${
        night
          ? "border-white/10 bg-[#0a121a]/85"
          : "border-slate-200 bg-surface/90"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        {/* The wordmark goes to the front door, not to the signed-in home.
            "/" is the person's own journey once they are in; the brand mark
            should still reach the page that says what this is. */}
        <Link
          href="/welcome"
          className="flex shrink-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
        >
          <BrandLogo size={30} />
          <span
            className={`text-lg font-extrabold tracking-[0.12em] ${
              night ? "text-white" : "text-brand-ink"
            }`}
          >
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
                    ? night
                      ? "font-semibold text-white"
                      : "font-semibold text-brand-violet-deep"
                    : night
                      ? "text-white/55 hover:text-white/90"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <AuthControls account={account} night={night} />
      </div>
    </header>
  );
}
