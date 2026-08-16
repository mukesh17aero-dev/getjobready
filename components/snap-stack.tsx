"use client";

import { useEffect } from "react";

// Desktop sheet pager: one wheel gesture = one sheet, in either direction.
// CSS snap alone couldn't give both guarantees (mandatory rubber-bands on
// upward scrolls, proximity lets hard flings skip sheets), so the wheel is
// paged by hand: accumulate deltas, move to the neighbouring sheet, and
// swallow the fling's momentum until the scroll settles. Keyboard,
// scrollbar and touch scrolling stay fully native; below lg nothing here
// runs. The proximity snap in globals.css remains as a settling assist for
// those native paths - its rest points are exactly the pager's targets.
export function SnapStack() {
  useEffect(() => {
    document.documentElement.classList.add("snap-stack");

    let locked = false;
    let acc = 0;
    let unlockTimer = 0;

    const unlock = () => {
      locked = false;
      acc = 0;
    };

    const onScrollEnd = () => {
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(unlock, 120);
    };

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      // A modal owns the wheel while it is open.
      if (document.documentElement.dataset.modalOpen) return;
      const sheets = Array.from(
        document.querySelectorAll<HTMLElement>("[data-sheet]"),
      );
      if (sheets.length < 2) return;

      // Never ask a sticky element where it is - pinned, it lies (it
      // reports its pinned position). Heights are unaffected by pinning,
      // so each sheet's true top is the stack's origin plus the heights of
      // every sheet before it.
      let origin = 0;
      let node: HTMLElement | null = sheets[0].parentElement as HTMLElement | null;
      while (node) {
        origin += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      // Clamp to the real end of the page: the last sheet's ideal target
      // can sit past max-scroll (the header's height doesn't repeat), and
      // an unreachable target reads as "sheet 3 and 4 glued together".
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const tops: number[] = [];
      let running = origin;
      for (let i = 0; i < sheets.length; i++) {
        // -56: sheets pin 3.5rem below the viewport top (under the sticky
        // header), so their rest position is that much before their flow top.
        tops.push(i === 0 ? 0 : Math.min(Math.round(running) - 56, maxScroll));
        running += sheets[i].offsetHeight;
      }
      const y = window.scrollY;
      const idx = tops.filter((t) => t <= y + 10).length - 1;
      const dir = e.deltaY > 0 ? 1 : -1;

      // At the ends, hand the wheel back to the browser.
      if ((dir > 0 && idx >= tops.length - 1 && y >= tops[tops.length - 1] - 10) ||
          (dir < 0 && y <= 5)) {
        return;
      }

      e.preventDefault();
      if (locked) return;
      acc += e.deltaY;
      if (Math.abs(acc) < 40) return;

      locked = true;
      acc = 0;
      const target = Math.min(tops.length - 1, Math.max(0, idx + dir));
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: tops[target], behavior: still ? "auto" : "smooth" });
      // Fallback unlock in case scrollend never fires (already-there no-ops).
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(unlock, still ? 250 : 1100);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      document.documentElement.classList.remove("snap-stack");
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scrollend", onScrollEnd);
      window.clearTimeout(unlockTimer);
    };
  }, []);
  return null;
}
