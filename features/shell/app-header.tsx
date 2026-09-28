"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AdminViewAs } from "@/features/admin";
import { adminAccess } from "@/lib/api";
import { getResumeRecord } from "@/features/resume";
import { PLAN_KEY, isPlan, planById, type Plan } from "@/features/resume";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Avatar } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { AuthModal } from "@/components/auth/auth-modal";
import { applyTheme } from "@/lib/theme";
import type { AuthMode } from "@/components/auth/auth-form";

// The persistent destinations. Every route in the app belongs to exactly one
// of them (`match`), so the bar always shows where you are — modules open
// inside destinations, never as separate islands.
//
// Two of the four areas Home offers had no way in from the bar: the resume,
// the LinkedIn profile and the job-fit check all counted as "Home", and the
// interview tools counted as "Practice" while the Practice hub never linked
// to them. Both were reachable only by going Home first and knowing which
// card to press.
//
// They are named here as the app names them. "Apply" and "Interview" on
// their own promised something else - somewhere to apply for jobs, and an
// interview about to start - so Practice carries the two kinds of readiness
// in a menu, and the application tools keep the name their own page uses.
type Destination = {
  label: string;
  href: string;
  match: string[];
  /** When present the label opens a menu rather than navigating. */
  items?: Array<{ label: string; href: string }>;
};

const DESTINATIONS: Destination[] = [
  { label: "Home", href: "/", match: ["/", "/start", "/journey"] },
  { label: "Discover", href: "/discover", match: ["/discover"] },
  {
    label: "Practice",
    href: "/practice",
    match: ["/practice", "/interview"],
    items: [
      { label: "Role readiness", href: "/practice" },
      { label: "Interview readiness", href: "/interview" },
    ],
  },
  { label: "Roleplay", href: "/roleplay", match: ["/roleplay"] },
  // One word, because the bar is a bar.
  {
    label: "Identity",
    href: "/resume",
    match: ["/resume", "/profile/professional", "/job-fit"],
  },
  { label: "Opportunities", href: "/opportunities", match: ["/opportunities"] },
];

/**
 * A destination that holds more than one thing, opened as a menu.
 *
 * Positioned fixed rather than absolute: the nav strip scrolls sideways on a
 * phone, and a scroll container clips in both directions - an absolutely
 * placed menu inside it would be cut off at the first item. Measured from
 * the button and clamped to the viewport, it sits over everything instead.
 */
function NavMenu({
  label,
  items,
  active,
  className,
}: {
  label: string;
  items: NonNullable<Destination["items"]>;
  active: boolean;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 212;
      setAt({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: rect.bottom + 8,
      });
    };
    place();
    function onPointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    // A menu measured from a button that has since moved points at nothing,
    // so it closes rather than drifting.
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="contents">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`${className} gap-1.5`}
      >
        {label}
        <span aria-hidden className="text-[0.6em] leading-none opacity-70">
          {"\u25be"}
        </span>
      </button>
      {open && at && (
        <div
          role="menu"
          aria-label={label}
          style={{ left: at.left, top: at.top, width: 212 }}
          className="fixed z-30 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-lg"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              role="menuitem"
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center border-b border-slate-100 px-3.5 text-sm font-semibold text-brand-ink last:border-b-0 hover:bg-teal-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function isActive(pathname: string, match: string[]): boolean {
  return match.some((m) =>
    m === "/"
      ? pathname === "/"
      : pathname === m || pathname.startsWith(`${m}/`),
  );
}

type Account = { email: string; name: string; photo: string | null };

// The display name comes from the identity provider (Google gives a full
// name) and falls back to the part of the email before the @, so the menu
// always greets a person rather than an address.
function toAccount(
  user: { email?: string; user_metadata?: Record<string, unknown> } | undefined,
): Account | null {
  if (!user?.email) return null;
  const meta = user.user_metadata ?? {};
  const named = [meta.full_name, meta.name, meta.user_name].find(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
  const fallback = user.email.split("@")[0]!.replace(/[._-]+/g, " ");
  // Written by the profile builder when somebody uploads a picture, and by
  // Google when they sign in with it. One field, so the header does not care
  // which of the two it was.
  const photo = [meta.avatar_url, meta.picture].find(
    (v): v is string => typeof v === "string" && v.startsWith("http"),
  );
  return {
    email: user.email,
    name: (named ?? fallback).replace(/\b\w/g, (c) => c.toUpperCase()),
    photo: photo ?? null,
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
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      mq.removeEventListener("change", calc);
      mo.disconnect();
    };
  }, []);
  return dark;
}

// Whether this person may look at the other audiences' screens.
//
// Asked for on the client rather than in the layout on purpose: a layout that
// calls getServerSession on every route would make every static page dynamic,
// and this is an affordance for a handful of people. It runs once per full
// page load, not per client-side navigation.
function useIsAdmin(account: Account | null | undefined): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!account) return;
    let live = true;
    void supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        const token = data.session?.access_token;
        if (!token) return null;
        return adminAccess(token);
      })
      .then((access) => {
        if (live) setIsAdmin(access?.isAdmin ?? false);
      });
    return () => {
      live = false;
    };
  }, [account]);
  // Derived rather than reset in the effect: signing out is answered here
  // instead of by a second setState, which the compiler rightly rejects.
  return account ? isAdmin : false;
}

// The Resume Studio plan this person chose. Their record is the authority
// once they are signed in; the browser's copy answers first so the menu does
// not flicker, and is all there is before an account exists. Null means no
// plan has been chosen yet - which is a real state, and said as one.
function usePlan(account: Account | null | undefined): Plan | null {
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => {
    let live = true;
    // After the first paint, so the server-rendered menu and the browser
    // agree on what they showed first.
    const local = setTimeout(() => {
      try {
        const stored = localStorage.getItem(PLAN_KEY);
        if (live && isPlan(stored)) setPlan(planById(stored));
      } catch {
        // Storage unavailable: the record still answers below.
      }
    }, 0);
    if (!account) {
      return () => {
        live = false;
        clearTimeout(local);
      };
    }
    void supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        const token = data.session?.access_token;
        return token ? getResumeRecord(token) : null;
      })
      .then((record) => {
        const chosen = record?.profile?.preferences?.resumePlan;
        if (live && isPlan(chosen)) setPlan(planById(chosen));
      });
    return () => {
      live = false;
      clearTimeout(local);
    };
  }, [account]);
  return plan;
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
  themeToggle = true,
}: {
  account: Account | null | undefined;
  night: boolean;
  /** The welcome page keeps its header to the one door and nothing else. */
  themeToggle?: boolean;
}) {
  const [mode, setMode] = useState<AuthMode | null>(null);
  if (account === undefined) return <span className="h-8 w-8" aria-hidden />;

  // One door, not two. The dialog carries both directions itself - log in
  // offers "New to Ascend? Create an account" and back again - so a second
  // header button only asked the visitor to sort themselves into a category
  // before they had any reason to care which one they were in.
  if (account === null) {
    return (
      <span className="flex items-center gap-2">
        {themeToggle && <ThemeQuickToggle night={night} />}
        <button
          type="button"
          onClick={() => setMode("login")}
          // 44px: it is the only way into the product for anyone signed out,
          // so it is the last control in the app that should be a small tap.
          className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-4 text-sm font-bold transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
            night
              ? "bg-white text-[#16233f]"
              : "bg-brand-violet text-white hover:translate-y-0 hover:bg-brand-violet-deep"
          }`}
        >
          Log in or sign up
        </button>
        {mode && (
          <AuthModal
            mode={mode}
            onClose={() => setMode(null)}
            onSwitchMode={setMode}
          />
        )}
      </span>
    );
  }

  return <AccountMenu account={account} night={night} />;
}

// Shared with the cinematic welcome header so account and theme controls
// remain available on every entry point.
export function WelcomeAccountControls() {
  const account = useAccount();
  return <AuthControls account={account} night themeToggle={false} />;
}

// Avatar opens an account menu (Blueprint header pattern) instead of showing
// a bare "Sign out" link next to the photo.
function AccountMenu({ account, night }: { account: Account; night: boolean }) {
  const router = useRouter();
  const plan = usePlan(account);
  const [open, setOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
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
        <Avatar
          src={account.photo}
          name={account.name}
          className="h-full w-full rounded-full"
          fallbackClassName="grid place-items-center"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-lg"
        >
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5">
            {account.photo && (
              <Avatar
                src={account.photo}
                name={account.name}
                className="h-9 w-9 shrink-0 rounded-full ring-1 ring-slate-200"
                fallbackClassName="grid place-items-center bg-brand-mist text-[0.85rem] font-bold text-brand-teal-deep"
              />
            )}
            <div className="min-w-0">
              <p
                className="truncate text-[0.9rem] font-semibold text-slate-900"
                title={account.name}
              >
                {account.name}
              </p>
              <p
                className="truncate text-[0.78rem] text-slate-500"
                title={account.email}
              >
                {account.email}
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block border-b border-slate-100 px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Your profile
          </Link>
          {/* The plan they chose in Resume Studio. A choice on their record,
              not a payment - there is no billing yet, so the menu says which
              plan and what it holds, never "paid" or "active". */}
          <Link
            href="/resume/build"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block border-b border-slate-100 px-3.5 py-2.5 transition-colors hover:bg-slate-50"
          >
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Your plan
            </span>
            {plan ? (
              <>
                <span className="mt-0.5 flex items-baseline justify-between gap-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{plan.name}</span>
                  <span className="text-[0.78rem] text-slate-500">₹{plan.price} · 30-day pass</span>
                </span>
                <span className="mt-0.5 block text-[0.75rem] leading-snug text-slate-500">
                  {plan.features.slice(0, 2).join(" · ")}
                </span>
                <span className="mt-1 block text-[0.75rem] font-semibold text-teal-700">
                  Change plan →
                </span>
              </>
            ) : (
              <>
                <span className="mt-0.5 block text-sm text-slate-700">No plan chosen yet</span>
                <span className="mt-1 block text-[0.75rem] font-semibold text-teal-700">
                  Choose one in Resume Studio →
                </span>
              </>
            )}
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
            onClick={() => { setOpen(false); setAuthMode("login"); }}
            className="block w-full border-b border-slate-100 px-3.5 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Switch account
          </button>
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
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitchMode={setAuthMode} />}
    </div>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  // The pages that are not the student app: the pitch, and the college and
  // employer homes. Discover, Practice, Passport and Opportunities are a
  // student's destinations - offering them to a placement officer reading
  // their own page is offering somebody else's menu.
  const frontDoor = pathname === "/welcome" || pathname.startsWith("/for/");
  const account = useAccount();
  const isAdmin = useIsAdmin(account);
  // The nav used to be hidden signed out, because every destination behind it
  // was a login wall and five dead ends is worse than none. That is no longer
  // true: Discover, Practice, Passport and Opportunities all open and show
  // their real screens to a visitor, and the account is only asked for at the
  // point something would be made for them. So the nav is shown to everybody -
  // hiding it now would be hiding the product from the people who have not
  // decided to trust it yet.
  const signedIn = Boolean(account);
  const darkTheme = useResolvedDark();
  // The landing wears the night header only when the resolved theme is
  // dark; a light-theme visitor gets a light landing and a light header.
  // /welcome is always the landing; / is the landing when signed out.
  const night =
    darkTheme && (pathname === "/welcome" || (pathname === "/" && !signedIn));

  // The approved welcome has its own brand, cohort navigation and account link.
  if (pathname === "/welcome") return null;

  return (
    <header
      className={`safe-top safe-x sticky top-0 z-40 border-b backdrop-blur ${
        night
          ? "border-white/10 bg-[#0a121a]/85"
          : "border-slate-200 bg-surface/90"
      }`}
    >
      {/* Narrow screens give the nav its own row rather than a 60px scrolling
          sliver squeezed between the wordmark and the button. From 640px up
          the three sit on one line as before. */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 sm:flex-nowrap sm:py-3">
        {/* The wordmark goes to the front door, not to the signed-in home.
            "/" is the person's own journey once they are in; the brand mark
            should still reach the page that says what this is. */}
        <Link
          href="/welcome"
          className="flex shrink-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet"
        >
          <BrandLogo size={30} />
          {/* Tighter at 360px so the wordmark and the auth button share the
              first row and the nav gets the second - three stacked rows would
              cost a fifth of a phone screen before any content. */}
          <span
            className={`text-base font-extrabold tracking-[0.06em] sm:text-lg sm:tracking-[0.12em] ${
              night ? "text-white" : "text-brand-ink"
            }`}
          >
            ASCEND
          </span>
        </Link>
        {/* The front door carries no app nav. Discover, Practice and the
            rest are a signed-in student's destinations, and on /welcome they
            are wrong for everybody: a visitor has nowhere to go with them,
            and a college or employer reading their own pitch should not be
            offered a student's menu. The audience switch lives in the hero
            instead, where it has room for full labels. */}
        <nav
          aria-label="Primary"
          hidden={frontDoor}
          className="strip-scroll order-last -mx-1 flex w-full min-w-0 overflow-x-auto sm:order-none sm:-mx-2 sm:w-auto"
        >
          {/* Home is for everybody now. "/" used to render the pitch when
              signed out, so a Home link led back to the page you were already
              on; it is the router for everyone today, signed in or not. */}
          {DESTINATIONS.map(({ label, href, match, items }) => {
            const active = isActive(pathname, match);
            const look = `inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 text-sm transition-colors sm:min-h-0 sm:py-1.5 sm:px-3 ${
              active
                ? night
                  ? "font-semibold text-white"
                  : "font-semibold text-brand-violet-deep"
                : night
                  ? "text-white/55 hover:text-white/90"
                  : "text-slate-600 hover:text-slate-900"
            }`;
            if (items) {
              return (
                <NavMenu
                  key={href}
                  label={label}
                  items={items}
                  active={active}
                  className={look}
                />
              );
            }
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={look}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        {isAdmin && (
          <Suspense fallback={null}>
            <AdminViewAs />
          </Suspense>
        )}
        <AuthControls account={account} night={night} />
      </div>
    </header>
  );
}
