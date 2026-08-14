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
  fallbackHref = "/start",
  fallbackLabel = "Back to your goals",
}: {
  fallbackHref?: string;
  fallbackLabel?: string;
}) {
  const remembered = useSyncExternalStore(neverChanges, readHub, () => null);
  // A hub that is also a destination (Discovery, Practice) records itself, so
  // never offer to go "back" to the page you are already on.
  const pathname = usePathname();
  const hub = remembered === pathname ? null : remembered;
  const href = hub ?? fallbackHref;
  const label = hub ? HUB_LABELS[hub] : fallbackLabel;

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
