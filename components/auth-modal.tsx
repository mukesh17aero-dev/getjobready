"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AuthForm, type AuthMode } from "@/components/auth-form";

// The landing's sign-in door: the shared auth form in a night-themed
// dialog. Escape or the backdrop closes it; switching between signup and
// login happens in place. While open, the page behind cannot scroll and
// the landing's wheel pager stands down (it checks data-modal-open).
export function AuthModal({
  mode,
  onClose,
  onSwitchMode,
}: {
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.dataset.modalOpen = "1";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      delete document.documentElement.dataset.modalOpen;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Portal to <body>: an ancestor with backdrop-filter (like the site
  // header) would otherwise become the containing block for fixed
  // positioning and pin the dialog inside itself.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "signup" ? "Create your account" : "Log in"}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/12 bg-[#0b131c] p-7 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] outline-none sm:p-8"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-3xl bg-[radial-gradient(30rem_8rem_at_50%_0%,rgba(45,212,191,0.14),transparent)]"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
        <AuthForm mode={mode} variant="modal" onSwitchMode={onSwitchMode} />
      </div>
    </div>,
    document.body,
  );
}
