"use client";

// Asked at the start of a new resume when Discovery has a chosen role: aim this
// resume at that role, or keep it general. A forced choice, so no dismiss.

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function RoleAimModal({
  roleTitle,
  onChoose,
}: {
  roleTitle: string;
  onChoose: (useRole: boolean) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Aim this resume at ${roleTitle}?`}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-surface p-6 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.4)] outline-none sm:p-7"
      >
        <h2 className="text-lg font-semibold text-brand-ink">
          Aim this resume at {roleTitle}?
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            autoFocus
            onClick={() => onChoose(true)}
            className="rounded-full bg-brand-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-violet-deep"
          >
            For {roleTitle}
          </button>
          <button
            type="button"
            onClick={() => onChoose(false)}
            className="rounded-full border border-slate-300 bg-surface px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            General
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
