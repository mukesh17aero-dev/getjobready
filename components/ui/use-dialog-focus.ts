"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";

const SELECTOR = 'a[href], button, input, select, textarea, summary, [tabindex]';

/** Keep the keyboard and accessibility tree inside the active modal. */
export function useDialogFocus(panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useEffectEvent(onClose);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    const hidden: Array<[HTMLElement, boolean]> = [];
    let branch: HTMLElement = panel;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          hidden.push([sibling, sibling.inert]);
          sibling.setAttribute("inert", "");
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    document.body.style.overflow = "hidden";
    const targets = () => [...panel.querySelectorAll<HTMLElement>(SELECTOR)]
      .filter(node => node.tabIndex >= 0 && !node.matches(':disabled') && !node.closest('[inert]') && node.getClientRects().length > 0);
    (targets()[0] ?? panel).focus();
    function keydown(event: KeyboardEvent) {
      if (panel?.closest("[inert]")) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
      if (event.key !== "Tab") return;
      const items = targets();
      const first = items[0], last = items.at(-1);
      if (!first || !last) { event.preventDefault(); panel!.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement as HTMLElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement as HTMLElement))) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      for (const [node, inert] of hidden) { if (inert) node.setAttribute("inert", ""); else node.removeAttribute("inert"); }
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [panelRef]);
}
