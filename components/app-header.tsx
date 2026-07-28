import Link from "next/link";
import { BrandMark } from "./brand-mark";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  admin: "Admin",
  employer: "Employer",
};

/**
 * The signed-in header. `signOutAction` is a Server Action passed down from
 * `app/` — components may not import one.
 */
export function AppHeader({
  name,
  email,
  role,
  homeHref,
  signOutAction,
  actions,
}: {
  name: string;
  /**
   * Always shown, even when a name is available. Two accounts can share a
   * display name — two Google accounts belonging to the same person routinely
   * do — and then the header cannot tell you which one you are signed in as.
   * The email is the only thing on screen that is unique.
   */
  email: string;
  role: string;
  homeHref: string;
  signOutAction: () => Promise<void>;
  /** Optional slot for role-specific controls, e.g. the admin view switcher. */
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href={homeHref}>
          <BrandMark />
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {actions}
          <span className="text-sm text-slate-600">
            <span className="flex items-center gap-2">
              {name}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {ROLE_LABEL[role] ?? role}
              </span>
            </span>
            <span className="block text-xs text-slate-400">{email}</span>
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
