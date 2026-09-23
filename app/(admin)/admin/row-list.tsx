"use client";

// A reorderable list of rows, and a blank role to start from.

import { type RoleDetail, TrashIcon } from "./role-draft";
export function RowList<T>({
  label,
  hint,
  rows,
  blank,
  render,
  onChange,
}: {
  label: string;
  hint?: string;
  rows: T[];
  blank: () => T;
  render: (row: T, set: (patch: Partial<T>) => void) => React.ReactNode;
  onChange: (rows: T[]) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </span>
        <button
          type="button"
          onClick={() => onChange([...rows, blank()])}
          className="text-[0.75rem] font-semibold text-brand-violet-deep hover:underline"
        >
          + Add
        </button>
      </div>
      {hint && <p className="mt-0.5 text-[0.75rem] text-slate-400">{hint}</p>}
      <div className="mt-1.5 grid gap-2">
        {rows.length === 0 && (
          <p className="text-[0.78rem] text-slate-400">Nothing here yet.</p>
        )}
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5"
          >
            <div className="min-w-0 flex-1">
              {render(row, (patch) =>
                onChange(
                  rows.map((r, j) => (j === i ? { ...r, ...patch } : r)),
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              aria-label={`Remove ${label} row ${i + 1}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-600 transition-colors hover:bg-rose-100"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// A new role starts empty rather than with placeholder text: an empty field is
// obviously unfinished, invented copy is not.
export function blankDetail(roleId: string): RoleDetail {
  return {
    roleId,
    sector: "",
    pitch: "",
    description: "",
    workMix: [],
    responsibilities: [],
    skills: [],
    workContext: { environment: "", hours: "", pace: "", team: "" },
    payMonthly: { min: 0, max: 0 },
    payNote: "",
    growth: [],
    hardTruths: [],
    suitsYouIf: [],
    voices: [],
    voicesIllustrative: true,
  };
}

export const SMALL_INPUT =
  "w-full rounded-md border border-slate-300 bg-surface px-2.5 py-1.5 text-[0.82rem] outline-none focus:border-brand-violet";
