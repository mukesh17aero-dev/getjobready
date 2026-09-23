"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { flushFootprints, track, type FootprintFamily } from "@/lib/footprints";

// Mounted once in the root layout. Two duties:
// 1. an engagement page_view per route change;
// 2. click delegation for any element carrying
//    data-track="family|module|event|target" — server components can emit
//    footprints with a plain attribute, no client code needed.

function moduleFor(pathname: string): string {
  if (pathname === "/") return "home";
  const first = pathname.split("/")[1] ?? "";
  return /^[a-z0-9_-]+$/.test(first) ? first : "app";
}

const FAMILIES: FootprintFamily[] = [
  "interest",
  "engagement",
  "decision",
  "communication",
  "scenario",
  "learning",
];

export function FootprintTracker() {
  const pathname = usePathname();

  useEffect(() => {
    track({
      family: "engagement",
      event: "page_view",
      module: moduleFor(pathname),
      target: pathname,
    });
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest?.("[data-track]");
      const spec = el instanceof HTMLElement ? el.dataset.track : undefined;
      if (!spec) return;
      const [family, module, event, target] = spec.split("|");
      if (
        family &&
        module &&
        event &&
        FAMILIES.includes(family as FootprintFamily)
      ) {
        track({ family: family as FootprintFamily, event, module, target });
      }
    }
    function onHide() {
      void flushFootprints();
    }
    document.addEventListener("click", onClick, true);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  return null;
}
