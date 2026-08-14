"use client";

import { useEffect, useId, useRef, useState } from "react";

// A help panel that slides in beside the page rather than covering it, so a
// setting can be read about while it stays visible. Escape, backdrop click and
// the close button all dismiss it, and focus returns to the icon that opened it.

export function HelpSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/25"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-slate-200 bg-surface shadow-2xl motion-safe:animate-slide-in"
      >
        <header className="flex items-start gap-4 border-b border-slate-200 px-5 py-4">
          <h2 className="min-w-0 flex-1 text-base font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <span aria-hidden className="text-lg leading-none">
              ×
            </span>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// The ⓘ control that opens one. Keeps its own open state so a page can drop it
// beside any setting without wiring anything up.
export function HelpButton({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-slate-300 text-[0.68rem] font-bold text-slate-500 transition-colors hover:border-brand-violet hover:text-brand-violet-deep"
      >
        <span aria-hidden>i</span>
      </button>
      {open && (
        <div id={id}>
          <HelpSheet title={title} onClose={() => setOpen(false)}>
            {children}
          </HelpSheet>
        </div>
      )}
    </>
  );
}
