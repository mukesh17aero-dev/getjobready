"use client";

// The repeating-history list and the other inputs the form is built from.

import { useState } from "react";
import styles from "./profile-form.module.css";
import { Text, ProfileDialog, digitsOnly } from "./profile-fields";
export function HistoryList<T extends Record<string, string>>({
  title,
  hint,
  addLabel,
  entries,
  blank,
  fields,
  caption,
  onChange,
}: {
  title: string;
  hint: string;
  addLabel: string;
  entries: T[];
  blank: () => T;
  /** Which boxes one entry has, in the order they are asked. */
  fields: Array<{
    key: keyof T & string;
    label: string;
    placeholder?: string;
    wide?: boolean;
    inputMode?: "numeric";
    /** A tick rather than a box: "still here", where a year cannot say it. */
    tick?: string;
    /** A short list to choose from - what kind of work this was. */
    options?: ReadonlyArray<{ id: string; label: string }>;
    /** Hidden while another field is ticked - a leaving year for a job you
        have not left is a question with no answer. */
    hideWhen?: (entry: T) => boolean;
    /** Returns a message when this value is not usable, nothing when it is. */
    check?: (value: string) => string | undefined;
  }>;
  /** The line at the top of each card, so a list of five is readable. */
  caption: (entry: T) => string;
  onChange: (next: T[]) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 4;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(entries.length / pageSize) - 1));
  const update = (index: number, key: string, value: string) =>
    onChange(entries.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const entry = editing === null ? null : entries[editing];
  const index = editing ?? 0;
  return <section className={styles.history}>
    <div className={styles.historyHead}><div><h3>{title}</h3><p>{hint}</p></div>
      <button type="button" onClick={() => { setEditing(entries.length); setPage(Math.floor(entries.length / pageSize)); onChange([...entries, blank()]); }} className={styles.secondary}>+ {addLabel}</button>
    </div>
    {entries.length === 0 ? <p className={styles.noRecords}>Nothing added yet. Add an entry when you have something to share.</p> : <div className={styles.historyGrid}>
      {entries.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((record, offset) => {
        const recordIndex = currentPage * pageSize + offset;
        const place = record.institution || record.organisation || "Details to add";
        const dates = [record.from, record.current ? "Present" : record.to].filter(Boolean).join(" – ");
        return <button type="button" key={recordIndex} className={styles.historyCard} onClick={() => setEditing(recordIndex)} aria-label={`Edit ${caption(record)}`}>
          <span><strong>{caption(record)}</strong><small>{place}</small>{dates && <small>{dates}</small>}</span><span className={styles.editLabel}>Edit ↗</span>
        </button>;
      })}
    </div>}
    {entries.length > pageSize && <nav aria-label={`${title} pages`} className={styles.pagination}>
      <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button>
      <span>{currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, entries.length)} of {entries.length} records</span>
      <button type="button" disabled={(currentPage + 1) * pageSize >= entries.length} onClick={() => setPage(currentPage + 1)}>Next</button>
    </nav>}
    {entry && <ProfileDialog title={`Edit ${caption(entry)}`} onClose={() => setEditing(null)}>
      <p className={styles.dialogNote}>Edit this record, then use Save changes on your profile to keep it.</p>
      <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => {
                if (field.hideWhen?.(entry)) return null;
                if (field.tick) {
                  return (
                    <label
                      key={field.key}
                      className="flex min-h-11 cursor-pointer items-center gap-2.5 sm:col-span-2"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(entry[field.key])}
                        onChange={(e) =>
                          update(
                            index,
                            field.key,
                            e.target.checked ? "yes" : "",
                          )
                        }
                        className="h-5 w-5 shrink-0 accent-teal-700"
                      />
                      <span className="text-[0.82rem] text-slate-700">
                        {field.tick}
                      </span>
                    </label>
                  );
                }
                if (field.options) {
                  return (
                    <label key={field.key} className="block">
                      <span className="text-[0.8rem] font-semibold text-slate-800">
                        {field.label}
                      </span>
                      <select
                        value={entry[field.key] ?? ""}
                        onChange={(e) =>
                          update(index, field.key, e.target.value)
                        }
                        className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 text-[0.9rem] text-brand-ink outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                      >
                        {field.options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }
                return (
                  <div
                    key={field.key}
                    className={field.wide ? "sm:col-span-2" : undefined}
                  >
                    <Text
                      label={field.label}
                      value={entry[field.key] ?? ""}
                      onChange={(v) =>
                        update(
                          index,
                          field.key,
                          field.inputMode === "numeric" ? (field.key === "marks" ? digitsOnly(v) : v.replace(/\D/g, "").slice(0, 4)) : v,
                        )
                      }
                      placeholder={field.placeholder}
                      inputMode={field.inputMode}
                      error={field.check?.(entry[field.key] ?? "")}
                    />
                  </div>
                );
              })}
      </div>
      <div className={styles.editorFooter}>
        <button type="button" className={styles.remove} onClick={() => { onChange(entries.filter((_, i) => i !== index)); setEditing(null); }}>Remove record</button>
        <button type="button" className={styles.secondary} onClick={() => setEditing(null)}>Done editing</button>
      </div>
    </ProfileDialog>}
  </section>;
}

export function MultiChoice({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const chosen = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const toggle = (option: string) => {
    const next = chosen.includes(option)
      ? chosen.filter((c) => c !== option)
      : [...chosen, option];
    onChange(next.join(", "));
  };
  return (
    <div>
      <span className="text-[0.8rem] font-semibold text-slate-800">
        {label}
      </span>
      {hint && (
        <span className="block text-[0.72rem] text-slate-400">{hint}</span>
      )}
      <div className={styles.chips}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={chosen.includes(option)}
            onClick={() => toggle(option)}
            className={`min-h-11 rounded-lg border px-3 py-1.5 text-[0.8rem] transition-colors ${
              chosen.includes(option)
                ? "border-brand-violet bg-brand-violet text-white"
                : "border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] font-semibold text-slate-800">
        {label}
      </span>
      {hint && (
        <span className="block text-[0.72rem] text-slate-400">{hint}</span>
      )}
      <textarea
        value={value}
        placeholder={placeholder}
        rows={3}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 min-h-11 w-full resize-y rounded-lg border bg-surface px-3 py-2 text-[0.9rem] outline-none focus:ring-2 ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-slate-300 focus:border-brand-violet focus:ring-brand-violet/20"
        }`}
      />
      {error && (
        <span role="alert" className="mt-1 block text-[0.72rem] text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}

// "May 2027", "Sept 2026", "January 2028" - a real month name (full or
// standard abbreviation, nothing glued onto it) and a 4-digit year.
export const FINISH_SHAPE =
  /^\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+((?:19|20)\d{2})\s*$/i;

export function Choice({ label, hint, value, options, onChange, placeholder = "Choose one" }: {
  label: string; hint?: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string;
}) {
  return <label className="block"><span className="text-[0.8rem] font-semibold text-slate-800">{label}</span>
    {hint && <span className="block text-[0.72rem] text-slate-500">{hint}</span>}
    <select value={value} onChange={event => onChange(event.target.value)} className={styles.select}>
      <option value="">{placeholder}</option>{options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>;
}
