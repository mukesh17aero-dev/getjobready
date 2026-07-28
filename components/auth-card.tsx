import Link from "next/link";
import { BrandMark } from "./brand-mark";

/**
 * The frame every sign-in / sign-up / password screen shares: brand, a pair of
 * tabs, a title, and the form.
 */
export function AuthCard({
  title,
  subtitle,
  activeTab,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  /** Omit on the password screens, which belong to neither tab. */
  activeTab?: "signin" | "signup";
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-8 self-center">
        <BrandMark />
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {activeTab ? <AuthTabs active={activeTab} /> : null}

        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>
        ) : null}

        <div className="mt-6">{children}</div>
      </div>

      {footer ? (
        <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
      ) : null}
    </main>
  );
}

function AuthTabs({ active }: { active: "signin" | "signup" }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
      <Tab href="/login" label="Sign in" isActive={active === "signin"} />
      <Tab href="/signup" label="Create account" isActive={active === "signup"} />
    </div>
  );
}

function Tab({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`rounded-md px-3 py-2 text-center text-sm font-medium transition ${
        isActive
          ? "bg-white text-slate-900 shadow-xs"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
        or
      </span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
