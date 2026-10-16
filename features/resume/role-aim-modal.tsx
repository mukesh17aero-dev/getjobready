"use client";

// Confirm the target before creating a new resume. A role from Discovery can be
// accepted or set aside; without one, the person can name a role or go general.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function RoleAimModal({
  roleTitle,
  onChoose,
}: {
  roleTitle?: string;
  onChoose: (role: string | null) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [enteredRole, setEnteredRole] = useState("");
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
      aria-label={roleTitle ? `Aim this resume at ${roleTitle}?` : "Choose a role or general resume"}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-surface p-6 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.4)] outline-none sm:p-7"
      >
        <h2 className="text-lg font-semibold text-brand-ink">{roleTitle ? `Aim this resume at ${roleTitle}?` : "What role is this resume for?"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{roleTitle ? "We can tailor the draft to this role, or make a general resume you can adapt later." : "Name a role to tailor the draft, or choose a general resume if you are still exploring."}</p>
        {!roleTitle && <label className="mt-5 block text-sm font-medium text-slate-800" htmlFor="resume-aim-role">Target role
          <input id="resume-aim-role" value={enteredRole} onChange={event => setEnteredRole(event.target.value)} placeholder="e.g. Operations Executive" className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20" />
        </label>}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            autoFocus={Boolean(roleTitle)}
            disabled={!roleTitle && !enteredRole.trim()}
            onClick={() => onChoose(roleTitle ?? enteredRole.trim())}
            className="rounded-full bg-brand-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-violet-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {roleTitle ? `For ${roleTitle}` : "Continue with this role"}
          </button>
          <button
            type="button"
            onClick={() => onChoose(null)}
            className="rounded-full border border-slate-300 bg-surface px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Create a general resume
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
