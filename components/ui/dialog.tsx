"use client";

import { useRef } from "react";
import { useDialogFocus } from "./use-dialog-focus";

// A dismissible overlay: closes on Escape, on a click outside the panel and
// on the close button, and returns focus to whatever opened it.
export function Dialog({
  title,
  subtitle,
  onClose,
  children,
  footer,
  assistant,
  bodyRef,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Sits between the scrolling body and the footer, always reachable. */
  assistant?: React.ReactNode;
  /** Lets a child read how the body is being scrolled. */
  bodyRef?: React.RefObject<HTMLElement | null>;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useDialogFocus(panelRef, onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl ${
          wide ? "sm:max-w-4xl" : "sm:max-w-2xl"
        }`}
      >
        <header className="flex items-start gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[0.82rem] text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </header>

        <div
          ref={bodyRef as React.RefObject<HTMLDivElement> | undefined}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
        >
          {children}
        </div>

        {assistant}

        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
