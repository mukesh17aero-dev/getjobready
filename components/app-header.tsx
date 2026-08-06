"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-3">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-slate-900"
        >
          Ascend
        </Link>
        <nav aria-label="Primary" className="-mx-2 flex overflow-x-auto">
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
                    ? "font-semibold text-violet-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
