"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { HUB_LABELS, readHub } from "@/lib/hub-memory";

// Session storage is external, read-only state here: useSyncExternalStore
// reads it without setState-in-effect and gives the server a defined
// snapshot, so the fallback renders server-side and the remembered hub takes
// over after hydration.
const neverChanges = () => () => {};

export function BackLink({
  fallbackHref,
  fallbackLabel,
}: {
  /** This page's own parent. Given, it always wins - back means up. */
  fallbackHref?: string;
  fallbackLabel?: string;
}) {
  const remembered = useSyncExternalStore(neverChanges, readHub, () => null);
  // A hub that is also a destination (Discovery, Practice) records itself, so
  // never offer to go "back" to the page you are already on.
  const pathname = usePathname();
  const hub = remembered === pathname ? null : remembered;
  // A page that knows its own parent uses it. The remembered hub is only for
  // pages that have no parent of their own - otherwise every screen ends up
  // pointing at whichever hub was visited last, which is usually home.
  const href = fallbackHref ?? hub ?? "/start";
  const label =
    fallbackHref !== undefined
      ? (fallbackLabel ?? "Back")
      : hub
        ? HUB_LABELS[hub]
        : "Back to your goals";

  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
    >
      <span
        aria-hidden
        className="inline-block transition-transform group-hover:-translate-x-0.5"
      >
        ←
      </span>
      {label}
    </Link>
  );
}
