"use client";

// The first few details, asked before a draft is worth making.

// ---- The first few details ----
//
// Asked here rather than sending someone to the profile page and hoping they
// come back. Every answer is written to the same record the profile page
// reads, so it is filled in there too and never asked twice.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FormAlert, type MissingField } from "@/components/ui/form-alert";
import { RequiredMark } from "@/components/ui/required-mark";
export const ESSENTIALS: Array<{
  key:
    | "fullName"
    | "city"
    | "skills"
    | "institution"
    | "course"
    | "internshipExperience";
  label: string;
  hint?: string;
  placeholder: string;
  required?: boolean;
  lines?: number;
}> = [
  {
    key: "fullName",
    label: "Your full name",
    placeholder: "Aarav Sharma",
    required: true,
  },
  { key: "city", label: "City", placeholder: "Hyderabad" },
  {
    key: "skills",
    label: "What can you do?",
    hint: "Comma separated. Only what you could back up in an interview. Leave it blank and we work from what your record shows.",
    placeholder: "Customer service, Google Sheets, Hindi typing",
  },
  {
    key: "institution",
    label: "Where you studied",
    placeholder: "Osmania University",
  },
  { key: "course", label: "What you studied", placeholder: "B.Com" },
  {
    key: "internshipExperience",
    label: "Any work, internship or project so far (optional)",
    hint: "A line or two is plenty. Anything missing can be added beside the draft.",
    placeholder: "Helped at the family store: billing, stock lists, customers",
    lines: 3,
  },
];

export function EssentialsModal({
  firstName,
  busy,
  onClose,
  onSubmit,
}: {
  firstName: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  // Nothing is marked wrong until they have tried to continue. Scolding
  // someone for an empty box they have not reached yet is just noise.
  const [tried, setTried] = useState(false);
  const missing = ESSENTIALS.filter(
    (f) => f.required && !(values[f.key] ?? "").trim(),
  );
  const showErrors = tried && missing.length > 0;
  const missingFields: MissingField[] = missing.map((f) => ({
    id: `essential-${f.key}`,
    label: f.label,
  }));

  const wrong = (key: string) =>
    showErrors && missing.some((f) => f.key === key);

  const attempt = () => {
    if (missing.length > 0) {
      setTried(true);
      return;
    }
    onSubmit(values);
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="The first few details for your resume"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-surface p-6 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.4)] outline-none sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
        <h2 className="pr-10 text-lg font-semibold text-brand-ink">
          {firstName
            ? `${firstName}, let's start with you`
            : "Let's start with you"}
        </h2>
        <p className="mt-1 text-[0.85rem] leading-relaxed text-slate-600">
          Your resume can only say what is true about you, so we need a little
          to work from. This is saved to your profile - you will not be asked
          again.
        </p>

        <FormAlert
          className="mt-3"
          message={
            showErrors
              ? missing.length === 1
                ? `${missing[0]!.label} is needed before we can start.`
                : "A few details are needed before we can start."
              : null
          }
          missing={missingFields}
        />

        <div className="mt-4 grid gap-4">
          {ESSENTIALS.map((field) => (
            <label key={field.key} className="block" htmlFor={`essential-${field.key}`}>
              <span className="text-[0.82rem] font-semibold text-slate-800">
                {field.label}
                {field.required && <RequiredMark />}
              </span>
              {field.hint && (
                <span className="block text-[0.75rem] text-slate-500">
                  {field.hint}
                </span>
              )}
              {field.lines ? (
                <textarea
                  id={`essential-${field.key}`}
                  rows={field.lines}
                  value={values[field.key] ?? ""}
                  placeholder={field.placeholder}
                  aria-required={field.required || undefined}
                  aria-invalid={wrong(field.key) || undefined}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  className={`mt-1 w-full resize-y rounded-lg border bg-surface px-3 py-2 text-[0.88rem] outline-none focus:ring-2 ${
                    wrong(field.key)
                      ? "border-rose-600 focus:border-rose-600 focus:ring-rose-600/25"
                      : "border-slate-300 focus:border-brand-violet focus:ring-brand-violet/20"
                  }`}
                />
              ) : (
                <input
                  id={`essential-${field.key}`}
                  value={values[field.key] ?? ""}
                  placeholder={field.placeholder}
                  aria-required={field.required || undefined}
                  aria-invalid={wrong(field.key) || undefined}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  className={`mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-[0.9rem] outline-none focus:ring-2 ${
                    wrong(field.key)
                      ? "border-rose-600 focus:border-rose-600 focus:ring-rose-600/25"
                      : "border-slate-300 focus:border-brand-violet focus:ring-brand-violet/20"
                  }`}
                />
              )}
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {/* Enabled even when something is missing: a dead button tells
              nobody why. Pressing it names what is needed and sends them
              there. */}
          <button
            type="button"
            disabled={busy}
            onClick={attempt}
            className="rounded-full bg-brand-teal-deep px-5 py-2.5 text-sm font-medium text-[var(--m3-on-primary)] transition-colors hover:bg-brand-teal disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save details and continue"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
