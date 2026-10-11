"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { useExclusivePanel } from "@/components/ui/use-exclusive-panel";
import { Close, Files, Menu, Plus } from "@/components/ui/icons";
import s from "./resume-side-nav.module.css";
import { M3_ROOT } from "./m3";

// The resume pages' own navigation: a side column with "Create new resume"
// and "My resumes", opened from a three-line button beside the page title.
//
// It takes room rather than covering the page. ResumeNavFrame lays the page
// out as two columns - the menu, then the page - and opening the menu widens
// the first, so the page moves over and nothing is hidden behind it. On a
// phone it opens above the page and pushes it down.
//
// Hover opens it after a short pause, so a mouse passing over the button does
// not shift the page; a click or tap opens it at once. Because opening moves
// the page (and the button with it) out from under the pointer, it does not
// close when the pointer leaves - that would open and close in a loop. It
// closes from the button, its own close button, or Escape. A click elsewhere
// does not close it: the page is still usable beside it, and closing would
// shift the layout under whatever was clicked.

/** Pause before hover opens it, so a passing pointer does not move the page. */
const HOVER_OPEN_MS = 250;
/**
 * A click this soon after hover opened it is the same intent, not a request
 * to close: hover-then-click is the usual way to reach for a menu button.
 */
const HOVER_CLICK_GRACE_MS = 800;

export type ResumeNavTarget = "new" | "saved";

type NavState = {
  open: boolean;
  panelId: string;
  /** The button hands itself to the frame, so close() can return focus to it. */
  registerButton: (el: HTMLButtonElement | null) => void;
  openNow: (focusFirst: boolean) => void;
  close: (returnFocus: boolean) => void;
};

const NavContext = createContext<NavState | null>(null);

export function ResumeNavFrame({
  current,
  onNavigate,
  className,
  children,
}: {
  /** Which destination this page already is, if either. */
  current: ResumeNavTarget | null;
  /**
   * Called before leaving, so a page with unsaved edits can save them first.
   * Call preventDefault() on the event to take over the navigation.
   */
  onNavigate?: (href: string, event: { preventDefault(): void }) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const panelId = useId();
  const { open, activate, dismiss } = useExclusivePanel(panelId);
  // State, not a ref: what is shared with the button must be safe to read
  // while rendering.
  const [buttonEl, setButtonEl] = useState<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    dismiss();
    if (returnFocus) buttonEl?.focus();
  }, [buttonEl, dismiss]);

  const openNow = useCallback((focusFirst: boolean) => {
    activate();
    if (focusFirst) requestAnimationFrame(() => {
      const panel = document.getElementById(panelId);
      if (panel?.dataset.open === "true") panel.querySelector<HTMLAnchorElement>("a")?.focus();
    });
  }, [panelId, activate]);

  // Escape closes it, but only while focus is in the menu or on its button:
  // the builder's own dialogs use Escape too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const at = document.activeElement;
      if (panelRef.current?.contains(at) || buttonEl === at) close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, buttonEl]);

  const item = (target: ResumeNavTarget, href: string, label: string, icon: React.ReactNode) => (
    <Link
      href={href}
      className={s.item}
      aria-current={current === target ? "page" : undefined}
      onClick={(event) => onNavigate?.(href, event)}
    >
      <span className={s.itemIcon}>{icon}</span>
      {label}
    </Link>
  );

  return (
    <NavContext.Provider value={{ open, panelId, registerButton: setButtonEl, openNow, close }}>
      <div className={`${s.frame} ${M3_ROOT} ${className ?? ""}`} data-open={open}>
        <nav ref={panelRef} id={panelId} aria-label="Resume" className={s.panel} data-open={open} onPointerEnter={event => { if (event.pointerType === "mouse") activate(); }} onFocusCapture={activate}>
          <div className={s.panelInner}>
            <div className={s.panelHead}>
              <span>Resume</span>
              <button type="button" className={s.close} aria-label="Close resume menu" onClick={() => close(true)}>
                <Close size={18} />
              </button>
            </div>
            <ul className={s.list}>
              <li>{item("new", "/resume/build", "Create new resume", <Plus size={18} />)}</li>
              <li>{item("saved", "/resume/saved", "My resumes", <Files size={18} />)}</li>
            </ul>
          </div>
        </nav>
        <div className={s.page}>{children}</div>
      </div>
    </NavContext.Provider>
  );
}

/** The three-line button. Renders nothing outside a ResumeNavFrame. */
export function ResumeNavButton() {
  const nav = useContext(NavContext);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpenedAt = useRef(0);
  const cancel = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };
  useEffect(() => cancel, []);
  if (!nav) return null;
  const { open, panelId, registerButton, openNow, close } = nav;

  return (
    <button
      ref={registerButton}
      type="button"
      className={s.menuButton}
      aria-label={open ? "Close resume menu" : "Open resume menu"}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => {
        cancel();
        const justHovered = Date.now() - hoverOpenedAt.current < HOVER_CLICK_GRACE_MS;
        if (open && !justHovered) close(false);
        else openNow(true);
      }}
      onPointerEnter={(e) => {
        // Touch and pen have no hover; a tap opens it.
        if (e.pointerType !== "mouse" || open) return;
        cancel();
        hoverTimer.current = setTimeout(() => {
          hoverOpenedAt.current = Date.now();
          openNow(false);
        }, HOVER_OPEN_MS);
      }}
      onPointerLeave={cancel}
    >
      <Menu size={20} />
    </button>
  );
}
