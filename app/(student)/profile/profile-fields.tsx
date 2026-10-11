"use client";

// A dialog, a text field, and one part of the record.

import { useEffect, useId, useRef } from "react";
import styles from "./profile-form.module.css";
export function ProfileDialog({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); opener?.focus(); };
  }, []);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
    }}>
    <header className={styles.dialogHead}><h2 id={titleId}>{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose}>✕</button></header>
    <div className={styles.dialogBody}>{children}</div>
  </dialog>;
}

export function Text({
  label,
  hint,
  value,
  onChange,
  placeholder,
  inputMode,
  error,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric";
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] font-semibold text-slate-800">
        {label}
      </span>
      {hint && (
        <span className="block text-[0.75rem] text-slate-500">{hint}</span>
      )}
      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 min-h-11 w-full rounded-lg border bg-surface px-3 py-2 text-[0.9rem] outline-none focus:ring-2 ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-slate-300 focus:border-brand-violet focus:ring-brand-violet/20"
        }`}
      />
      {error && (
        <span role="alert" className="mt-1 block text-[0.75rem] text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}

// Percentages must land between 1 and 100; anything typed into a number box
// is reduced to digits, so letters simply do nothing.
export const percentValid = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 100;
};
export const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 3);
// A written answer has to look like language: at least three characters,
// starts with a letter, reasonable characters only, and no five-letter-plus
// "word" without a vowel (which is how keyboard mash reads).
export function looksWritten(value: string): boolean {
  const v = value.trim();
  if (v.length < 3) return false;
  if (!/^[a-z][a-z0-9 .,&()'\-\/+]*$/i.test(v)) return false;
  return !v
    .split(/\s+/)
    .some((word) => word.length >= 5 && !/[aeiou]/i.test(word));
}

// Chips that toggle in and out of a comma-separated value.
export function Part({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.part}>
      <h2 className="text-[1rem] font-semibold tracking-tight text-brand-ink">
        {title}
      </h2>
      <p className="mt-0.5 text-[0.78rem] leading-relaxed text-slate-500">
        {blurb}
      </p>
      <div className={styles.fields}>{children}</div>
    </section>
  );
}
