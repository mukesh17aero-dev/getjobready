"use client";

// The shape of a role draft, and the small inputs used to edit one.

import { type RoleDetailDraft } from "@/lib/api";
export type RoleDetail = {
  roleId: string;
  experienceLevels?: Array<"student" | "early_career">;
  sector: string;
  pitch: string;
  description: string;
  workMix: Array<{ label: string; share: number; detail: string }>;
  responsibilities: string[];
  skills: Array<{ name: string; why: string }>;
  workContext: {
    environment: string;
    hours: string;
    pace: string;
    team: string;
  };
  payMonthly: { min: number; max: number };
  payNote: string;
  growth: Array<{
    title: string;
    when: string;
    pay: { min: number; max: number };
  }>;
  hardTruths: string[];
  suitsYouIf: string[];
  voices: Array<{
    name: string;
    title: string;
    journey: string;
    quote: string;
  }>;
  voicesIllustrative: boolean;
  assistantNotes?: string;
  studentQuestions?: {
    entry?: string;
    where?: string;
    transfers?: string;
    changing?: string;
    seen?: string;
  };
  acrossIndustries?: Array<{ industry: string; difference: string }>;
};
export type RoleSummary = {
  id: string;
  title: string;
  world: string;
  summary: string;
};

// A trash can, drawn inline — the stack forbids icon libraries.
export function TrashIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1.15rem] w-[1.15rem]"
    >
      <path d="M4 7h16" />
      <path d="M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1Z" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const shared =
    "mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20";
  return (
    <label className="block">
      <span className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      )}
    </label>
  );
}

/**
 * A draft merged over what a role already has.
 *
 * The rule is one line and it matters: a field the writer returned empty means
 * "I had nothing to say about this", never "delete what you had". Shared by
 * the single-role box and the batch so the two can never drift apart and
 * start treating an empty return differently.
 */
export function mergeRoleDraft(
  existing: {
    sector: string;
    pitch: string;
    description: string;
    workMix: RoleDetail["workMix"];
    responsibilities: string[];
    skills: RoleDetail["skills"];
    workContext: RoleDetail["workContext"];
    hardTruths: string[];
    suitsYouIf: string[];
  },
  draft: RoleDetailDraft,
): Partial<RoleDetail> {
  const text = (next: string, was: string) => (next.trim() !== "" ? next : was);
  const list = <T,>(next: T[], was: T[]) => (next.length > 0 ? next : was);
  return {
    sector: text(draft.sector, existing.sector),
    pitch: text(draft.pitch, existing.pitch),
    description: text(draft.description, existing.description),
    workMix: list(draft.workMix, existing.workMix),
    responsibilities: list(draft.responsibilities, existing.responsibilities),
    skills: list(draft.skills, existing.skills),
    workContext: {
      environment: text(
        draft.workContext.environment,
        existing.workContext.environment,
      ),
      hours: text(draft.workContext.hours, existing.workContext.hours),
      pace: text(draft.workContext.pace, existing.workContext.pace),
      team: text(draft.workContext.team, existing.workContext.team),
    },
    hardTruths: list(draft.hardTruths, existing.hardTruths),
    suitsYouIf: list(draft.suitsYouIf, existing.suitsYouIf),
  };
}

export const BLANK_ROLE_BODY = {
  sector: "",
  pitch: "",
  description: "",
  workMix: [] as RoleDetail["workMix"],
  responsibilities: [] as string[],
  skills: [] as RoleDetail["skills"],
  workContext: { environment: "", hours: "", pace: "", team: "" },
  hardTruths: [] as string[],
  suitsYouIf: [] as string[],
};

/**
 * Write or enrich the body of a role from an instruction.
 *
 * It writes the parts that describe the work - pitch, description, the day,
 * what you do, the skills, the conditions, the hard parts, who it suits - and
 * it cannot touch pay, growth or testimonials. Those are not omissions to fix
 * later: pay is an employer-validated estimate and testimonials are field
 * research, and a model has no standing to write either. Whatever is on the
 * role stays.
 */
