"use client";

import { AdminReviewLink } from "./review-notifications";
import { studioRequest } from "@/lib/admin-studio-api";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  adminDiscardDraft,
  adminImportCatalogue,
  adminReviewSkillModel,
  adminRoleTemplate,
  adminGenerateRoleContext,
  adminGenerateRoleDetail,
  type RoleDetailDraft,
  adminRoleContextPrompt,
  adminRoleDetailPrompt,
  adminSaveDraft,
  adminSaveDraftDetailed,
  adminSuggestSkills,
  type AdminContent,
  type CatalogueImportResult,
  type SkillModel,
  type SkillModelReview,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SkillModelEditor } from "./skill-model-editor";
import { AssessmentArcEditor } from "./assessment-arc";
import { InterviewBankEditor } from "./interview-bank";
import { RoleBatch, type BatchOutcome } from "./role-batch";
import type { ArcBank, InterviewBank } from "@/lib/api";
import { VideoUploadsEditor } from "./videos";
import { Collapsible } from "@/components/collapsible";

// The admin console: edit the role catalogue, the skills behind it, the
// assessment arc and the interview questions, then publish. Editing writes a draft — students keep seeing the published version
// until someone presses Publish.

// The whole of what a student sees on a role. Everything here is published
// content, edited below — nothing about a role lives in the codebase.
type RoleDetail = {
  roleId: string;
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
type RoleSummary = {
  id: string;
  title: string;
  world: string;
  summary: string;
};

// A trash can, drawn inline — the stack forbids icon libraries.
function TrashIcon() {
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

function Field({
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
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
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
function mergeRoleDraft(
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

const BLANK_ROLE_BODY = {
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
function RoleWriter({
  role,
  detail: existing,
  token,
  aiConfigured,
  onPatch,
}: {
  role: RoleSummary;
  // Undefined for a role that is only a title so far - which is exactly when
  // this is most useful, so it has to work from nothing.
  detail: RoleDetail | undefined;
  token: () => Promise<string | null>;
  aiConfigured: boolean;
  onPatch: (patch: Partial<RoleDetail>) => void;
}) {
  const detail = useMemo(
    () => ({
      ...BLANK_ROLE_BODY,
      sector: existing?.sector ?? "",
      pitch: existing?.pitch ?? "",
      description: existing?.description ?? "",
      workMix: existing?.workMix ?? [],
      responsibilities: existing?.responsibilities ?? [],
      skills: existing?.skills ?? [],
      workContext: existing?.workContext ?? BLANK_ROLE_BODY.workContext,
      hardTruths: existing?.hardTruths ?? [],
      suitsYouIf: existing?.suitsYouIf ?? [],
    }),
    [existing],
  );
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [builtIn, setBuiltIn] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!showPrompt || builtIn !== null) return;
    let cancelled = false;
    void (async () => {
      const t = await token();
      if (!t) return;
      const result = await adminRoleDetailPrompt(t);
      if (!cancelled && result) setBuiltIn(result.prompt);
    })();
    return () => {
      cancelled = true;
    };
  }, [showPrompt, builtIn, token]);

  const write = useCallback(async () => {
    setBusy(true);
    setError(null);
    setWarnings([]);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Your session expired. Reload and sign in again.");
      return;
    }
    const result = await adminGenerateRoleDetail(t, {
      roleId: role.id,
      roleTitle: role.title,
      roleSummary: role.summary,
      sector: detail.sector,
      pitch: detail.pitch,
      description: detail.description,
      workMix: detail.workMix,
      responsibilities: detail.responsibilities,
      skills: detail.skills,
      workContext: detail.workContext,
      hardTruths: detail.hardTruths,
      suitsYouIf: detail.suitsYouIf,
      instruction,
    });
    setBusy(false);
    if (!result) {
      setError("Could not reach the writer. Try again in a moment.");
      return;
    }
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setWarnings(result.warnings);
    onPatch(mergeRoleDraft(detail, result.draft));
  }, [role, detail, instruction, token, onPatch]);

  return (
    <div className="rounded-xl border border-brand-violet/30 bg-brand-violet/[0.03] p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-brand-violet-deep">
          Write this role with AI
        </span>
        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="text-[0.72rem] font-semibold text-brand-violet-deep hover:underline"
        >
          {showPrompt ? "Hide" : "Read"} the built-in instruction
        </button>
      </div>
      <p className="mt-0.5 text-[0.75rem] leading-snug text-slate-500">
        Say what you want written or changed. It rewrites the fields below and
        leaves everything you have already written that you did not ask about.
        It will not touch pay, career progression or testimonials.
      </p>

      {showPrompt && (
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-3 text-[0.7rem] leading-relaxed text-slate-600">
          {builtIn ?? "Loading…"}
        </pre>
      )}

      <textarea
        rows={3}
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="e.g. Write this role from scratch — it's a delivery hub supervisor in Bhiwandi. Or: the hard truths are too soft, the 5am starts in monsoon season are the real cost."
        className="mt-2 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || !aiConfigured || instruction.trim() === ""}
          onClick={() => void write()}
          className="rounded-lg bg-brand-violet px-3.5 py-1.5 text-[0.8rem] font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-60"
        >
          {busy ? "Writing…" : "Write it"}
        </button>
        {!aiConfigured && (
          <span className="text-[0.75rem] text-slate-400">
            No AI key configured — write the fields by hand.
          </span>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[0.78rem] text-rose-800">
          {error}
        </p>
      )}
      {warnings.map((warning) => (
        <p
          key={warning}
          className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[0.78rem] leading-snug text-amber-900"
        >
          {warning}
        </p>
      ))}
    </div>
  );
}

// The five questions, in the order a student asks them. The label is the
// question itself, because that is what a student sees - editing a field
// called "Eligibility" invites a different answer than editing one called
// "Would they take someone like me?".
const STUDENT_QUESTIONS = [
  {
    key: "entry",
    label: "Would they take someone like me?",
    hint: "Education, marks, experience, English. Say plainly when a fresher stands a chance.",
  },
  {
    key: "where",
    label: "Where are these jobs - would I have to move?",
    hint: "Needs a source. Left blank by the drafter unless your guidance covers it.",
  },
  {
    key: "transfers",
    label: "If I leave after a year, what do I take with me?",
    hint: "The other door out. Lowers the risk of choosing at all.",
  },
  {
    key: "changing",
    label: "Will this job still exist?",
    hint: "Needs a source. Never let this be a guess - it is the claim students act on hardest.",
  },
  {
    key: "seen",
    label: "What will people at home think?",
    hint: "Needs a source. Name the stigma if there is one; pretending is worse.",
  },
] as const;

/**
 * The five student questions and the industry variations, for one role.
 *
 * The AI draft is a starting point and the guidance box is where the founder's
 * sources go - it is authoritative over the model rather than subordinate to
 * it, because three of these fields are claims about the world that only a
 * person holding a source can settle. Any field the drafter had no grounds for
 * comes back empty with a warning saying so, which is the point: a blank box
 * is an honest state, a confident invented paragraph is not.
 */
function RoleContextEditor({
  role,
  detail,
  token,
  aiConfigured,
  onPatch,
}: {
  role: RoleSummary;
  detail: RoleDetail;
  token: () => Promise<string | null>;
  aiConfigured: boolean;
  onPatch: (patch: Partial<RoleDetail>) => void;
}) {
  const [guidance, setGuidance] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [builtIn, setBuiltIn] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!showPrompt || builtIn !== null) return;
    let cancelled = false;
    void (async () => {
      const t = await token();
      if (!t) return;
      const result = await adminRoleContextPrompt(t);
      if (!cancelled && result) setBuiltIn(result.prompt);
    })();
    return () => {
      cancelled = true;
    };
  }, [showPrompt, builtIn, token]);

  // Memoised because generate() depends on it: a fresh object every render
  // would rebuild the callback on every keystroke.
  const questions = useMemo(
    () => detail.studentQuestions ?? {},
    [detail.studentQuestions],
  );

  const generate = useCallback(async () => {
    setBusy(true);
    setError(null);
    setWarnings([]);
    const t = await token();
    if (!t) {
      setBusy(false);
      setError("Your session expired. Reload and sign in again.");
      return;
    }
    const result = await adminGenerateRoleContext(t, {
      roleId: role.id,
      roleTitle: role.title,
      sector: detail.sector,
      description: detail.description,
      responsibilities: detail.responsibilities,
      skills: detail.skills,
      workContext: detail.workContext,
      hardTruths: detail.hardTruths,
      guidance: guidance.trim() || undefined,
    });
    setBusy(false);
    if (!result) {
      setError("Could not reach the writer. Try again in a moment.");
      return;
    }
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setWarnings(result.warnings);
    // Never overwrite something already written with a blank the drafter
    // declined to fill: a returning empty field means "no grounds", not
    // "delete what you had".
    const kept = (drafted: string, existing?: string) =>
      drafted.trim() !== "" ? drafted : (existing ?? "");
    onPatch({
      studentQuestions: {
        entry: kept(result.draft.entry, questions.entry),
        where: kept(result.draft.where, questions.where),
        transfers: kept(result.draft.transfers, questions.transfers),
        changing: kept(result.draft.changing, questions.changing),
        seen: kept(result.draft.seen, questions.seen),
      },
      acrossIndustries:
        result.draft.acrossIndustries.length > 0
          ? result.draft.acrossIndustries
          : detail.acrossIndustries,
    });
  }, [role, detail, guidance, token, onPatch, questions]);

  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
          What the student is actually wondering
        </span>
        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="text-[0.72rem] font-semibold text-brand-violet-deep hover:underline"
        >
          {showPrompt ? "Hide" : "Read"} the built-in instruction
        </button>
      </div>
      <p className="mt-0.5 text-[0.75rem] text-slate-400">
        Everything else on a role describes the job. These describe the path
        into it. Leave any of them empty and it stays off the student&apos;s
        screen.
      </p>

      {showPrompt && (
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[0.7rem] leading-relaxed text-slate-600">
          {builtIn ?? "Loading…"}
        </pre>
      )}

      <label className="mt-3 block">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
          Your sources and corrections
        </span>
        <span className="mt-0.5 block text-[0.75rem] leading-snug text-slate-400">
          Paste what you know and where it came from - an employer
          conversation, a report, a correction. This overrides the drafter. The
          three questions marked &ldquo;needs a source&rdquo; below are left
          blank unless you supply one here.
        </span>
        <textarea
          rows={4}
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          placeholder="e.g. Hub roles exist in every district with a delivery hub, not just metros — confirmed with the Bhiwandi ops lead, Aug 2026."
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || !aiConfigured}
          onClick={() => void generate()}
          className="rounded-lg bg-brand-violet px-3.5 py-1.5 text-[0.8rem] font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-60"
        >
          {busy ? "Drafting…" : "Draft these six"}
        </button>
        {!aiConfigured && (
          <span className="text-[0.75rem] text-slate-400">
            No AI key configured — write them by hand below.
          </span>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[0.78rem] text-rose-800">
          {error}
        </p>
      )}
      {warnings.map((warning) => (
        <p
          key={warning}
          className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[0.78rem] leading-snug text-amber-900"
        >
          {warning}
        </p>
      ))}

      <div className="mt-3 grid gap-3">
        {STUDENT_QUESTIONS.map((q) => (
          <label key={q.key} className="block">
            <span className="text-[0.78rem] font-semibold text-slate-700">
              {q.label}
            </span>
            <span className="mt-0.5 block text-[0.72rem] text-slate-400">
              {q.hint}
            </span>
            <textarea
              rows={2}
              value={questions[q.key] ?? ""}
              onChange={(e) =>
                onPatch({
                  studentQuestions: { ...questions, [q.key]: e.target.value },
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
            />
          </label>
        ))}
      </div>

      <div className="mt-3">
        <RowList
          label="The same job, different industries"
          hint="What actually changes about this job depending on where you do it."
          rows={detail.acrossIndustries ?? []}
          blank={() => ({ industry: "", difference: "" })}
          onChange={(acrossIndustries) => onPatch({ acrossIndustries })}
          render={(row, set) => (
            <div className="grid gap-1.5">
              <input
                value={row.industry}
                onChange={(e) => set({ industry: e.target.value })}
                placeholder="Industry"
                aria-label="Industry"
                className={SMALL_INPUT}
              />
              <textarea
                rows={2}
                value={row.difference}
                onChange={(e) => set({ difference: e.target.value })}
                placeholder="What is different about doing this job there"
                aria-label="What is different"
                className={SMALL_INPUT}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}

const NEED_STYLE = [
  "border-slate-200 bg-surface text-slate-400 hover:border-slate-300",
  "border-violet-200 bg-violet-50 text-violet-800",
  "border-violet-300 bg-violet-100 text-violet-900",
  "border-brand-violet bg-brand-violet text-white",
] as const;
const NEED_WORD = ["Not needed", "Weak", "Medium", "Strong"] as const;

// What a role needs, chosen from the skills defined on the Skills page — the
// list is never free text, so a requirement always refers to a real skill.
function SkillNeeds({
  skills,
  levelOf,
  onCycle,
}: {
  skills: Array<{ id: string; name: string }>;
  levelOf: (skillId: string) => number;
  onCycle: (skillId: string) => void;
}) {
  if (skills.length === 0) {
    return (
      <p className="mt-1.5 text-[0.8rem] text-slate-400">
        No skills defined yet — add them on the Skills &amp; mappings page.
      </p>
    );
  }
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {skills.map((skill) => {
        const level = levelOf(skill.id);
        return (
          <button
            key={skill.id}
            type="button"
            onClick={() => onCycle(skill.id)}
            aria-label={`${skill.name}: ${NEED_WORD[level] ?? "Not needed"}. Click for the next level.`}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
              NEED_STYLE[level] ?? NEED_STYLE[0]
            }`}
          >
            {skill.name}
            <span
              aria-hidden
              className="ml-1.5 inline-flex gap-[2px] align-middle"
            >
              {[1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={`h-2.5 w-[3px] rounded-full ${
                    step <= level
                      ? level === 3
                        ? "bg-surface"
                        : "bg-brand-violet"
                      : level === 3
                        ? "bg-surface/35"
                        : "bg-slate-200"
                  }`}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// A list of structured rows — progression steps, testimonials, work mix.
// Add and remove are always visible, because an empty list is a legitimate
// state and a role should never be stuck with a row it cannot delete.
function RowList<T>({
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
function blankDetail(roleId: string): RoleDetail {
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

const SMALL_INPUT =
  "w-full rounded-md border border-slate-300 bg-surface px-2.5 py-1.5 text-[0.82rem] outline-none focus:border-brand-violet";

export function AdminConsole({
  initialRoleId,
  startAdding=false,
  openToEveryone,
  aiConfigured,
  discovery,
  roles,
  skillModel,
  assessmentArc,
  interviewBank,
}: {
  initialRoleId?:string;
  startAdding?:boolean;
  openToEveryone: boolean;
  aiConfigured: boolean;
  discovery: AdminContent | null;
  roles: AdminContent | null;
  skillModel: AdminContent | null;
  assessmentArc: AdminContent | null;
  interviewBank: AdminContent | null;
}) {
  // Roles first, then the skills they need, then the questions that measure
  // them — the order the work is actually done in.
  const [tab, setTab] = useState<
    | "roles"
    | "skills"
    | "assessment"
    | "interview"
    | "videos"
  >("roles");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  // What the last save actually did, in the server's terms. Kept because
  // "saved" and "publish is still disabled" cannot both be true, and working
  // out which one was lying cost several rounds of guessing.
  const [lastSave, setLastSave] = useState<string | null>(null);

  const startingRoles = (roles?.draft?.data ??
    roles?.published?.data ??
    roles?.builtIn ??
    {}) as { roles?: RoleSummary[]; details?: RoleDetail[] };

  const [roleSummaries, setRoleSummaries] = useState<RoleSummary[]>(
    startingRoles.roles ?? [],
  );
  const [details, setDetails] = useState<RoleDetail[]>(
    startingRoles.details ?? [],
  );
  // A stored doc with no skills is a wipe, not a choice: fall back to the
  // built-in so the console never opens on an empty model.
  const storedModel = (skillModel?.draft?.data ??
    skillModel?.published?.data ??
    {}) as Partial<SkillModel>;
  const startingModel = (
    storedModel.skills?.length
      ? storedModel
      : (skillModel?.builtIn ?? {
          skills: [],
          traitSkill: {},
          skillRole: {},
          signalSkill: {},
          signalInfluence: 1,
        })
  ) as SkillModel;
  const [model, setModel] = useState<SkillModel>(startingModel);
  const startingArcs = (assessmentArc?.draft?.data ??
    assessmentArc?.published?.data ?? { arcs: [] }) as ArcBank;
  const [arcs, setArcs] = useState<ArcBank>({ arcs: startingArcs.arcs ?? [] });

  const startingInterviews = (interviewBank?.draft?.data ??
    interviewBank?.published?.data ?? { sets: [] }) as InterviewBank;
  const [interviews, setInterviews] = useState<InterviewBank>({
    sets: startingInterviews.sets ?? [],
  });

  // One review for the whole console; each tab shows the findings it owns.
  const [review, setReview] = useState<SkillModelReview | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setChecking(true);
      const { data } = await supabaseBrowser().auth.getSession();
      const t = data.session?.access_token;
      if (!t) return;
      const result = await adminReviewSkillModel(t, model);
      if (!cancelled) {
        setReview(result);
        setChecking(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [model]);

  const [addOpen, setAddOpen] = useState(startAdding);
  const [newTitle, setNewTitle] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<CatalogueImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState({
    discovery: Boolean(discovery?.draft),
    roles: Boolean(roles?.draft),
    skills: Boolean(skillModel?.draft),
    assessment: Boolean(assessmentArc?.draft),
    interview: Boolean(interviewBank?.draft),
    videos: false,
  });
  // Bumped on every publish, so a tab that fetched for itself refetches.
  const [publishedAt, setPublishedAt] = useState(0);

  // Stable: the batch runners depend on it, and a fresh function every render
  // would rebuild them on every keystroke anywhere in the console.
  const token = useCallback(async () => {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  type Kind =
    | "discovery_content"
    | "role_catalogue"
    | "skill_model"
    | "assessment_arc"
    | "interview_bank"
    | "video_uploads";
  const slotFor = (kind: Kind) =>
    kind === "discovery_content"
      ? "discovery"
      : kind === "role_catalogue"
        ? "roles"
        : kind === "skill_model"
          ? "skills"
          : kind === "video_uploads"
            ? "videos"
            : kind === "assessment_arc"
              ? "assessment"
              : kind === "interview_bank"
                ? "interview"
                : "discovery";

  async function save(kind: Kind) {
    setBusy(true);
    setStatus(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      setStatus("Your session expired. Reload the page and sign in again.");
      return;
    }
    // Video uploads save themselves the moment a file lands, and this
    // function has no idea what is on that shelf. Writing anything here
    // would overwrite the films.
    if (kind === "video_uploads") {
      setBusy(false);
      setStatus("Videos save as you upload them. Publish when they are right.");
      return;
    }
    const data =
      kind === "discovery_content"
        ? {
            // Worlds are all that is left in this document: the paired
            // choices and micro-scenarios were the survey, and Discovery
            // does not ask questions any more.
            worlds: (discovery?.published?.data as { worlds?: unknown })
              ?.worlds,
          }
        : kind === "role_catalogue"
          ? { roles: roleSummaries, details }
          : kind === "skill_model"
            ? model
            : kind === "assessment_arc"
              ? arcs
              : interviews;
    const saved = await adminSaveDraftDetailed(t, kind, data);
    setLastSave(
      saved.ok
        ? `${kind}: draft v${saved.doc.version} written at ${new Date().toLocaleTimeString()}`
        : `${kind}: refused — ${saved.reason}`,
    );
    // Skill requirements are edited on the role card but belong to the skill
    // model, so saving roles saves both.
    const savedModel =
      kind === "role_catalogue" && model.skills.length > 0
        ? await adminSaveDraft(t, "skill_model", model)
        : null;
    setBusy(false);
    setStatus(
      !saved.ok
        ? `Could not save the draft — ${saved.reason} Nothing was changed.`
        : kind === "role_catalogue" && model.skills.length > 0 && !savedModel
          ? "Roles saved, but the skills for them could not be saved. Try again."
          : "Draft saved. Students still see the published version.",
    );
    if (saved.ok) {
      setHasDraft((h) => ({
        ...h,
        [slotFor(kind)]: true,
        ...(savedModel ? { skills: true } : {}),
      }));
    }
  }

  async function publish(kind: Kind) {
    setBusy(true);
    setStatus(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      setStatus("Your session expired. Reload the page and sign in again.");
      return;
    }
    let published;
    try { published = await studioRequest(`/content/${kind}/publish`, {}); }
    catch (e) { setBusy(false); setStatus(e instanceof Error ? e.message : "Publication blocked."); return; }
    let mappingNotice: string | null = null;
    if (kind === "role_catalogue" && hasDraft.skills) {
      try { await studioRequest(`/content/skill_model/publish`, {}); } catch(e) { mappingNotice=`Role published. Skill mapping still needs approval: ${e instanceof Error?e.message:"open reviews"}`; }
    }
    setBusy(false);
    setStatus(mappingNotice ?? (published ? "Published the approved revision." : "Nothing to publish — save a draft first."));
    if (published) {
      setHasDraft((h) => ({ ...h, [slotFor(kind)]: false }));
      // Tabs that hold their own copy of the content have to hear about a
      // publish, or they keep showing what was true before it.
      setPublishedAt(Date.now());
    }
  }

  // Adding one role by hand. The id is derived from the title so an uploaded
  // file with the same title updates this role rather than duplicating it.
  function addRole(title: string) {
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    setRoleSummaries((rs) => [
      { id, title, world: "people", summary: "" },
      ...rs,
    ]);
    setDetails((ds) => [blankDetail(id), ...ds]);
    setNewTitle("");
    setAddOpen(false);
    setStatus(`${title} added. Fill in the details, then save the draft.`);
  }

  async function downloadTemplate() {
    const t = await token();
    if (!t) return;
    const blob = await adminRoleTemplate(t);
    if (!blob) {
      setStatus("Could not fetch the template. Try again.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ascend-roles-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  // Creating a skill from the role card: it joins the catalogue and is set to
  // "strong" for this role in one action, so nobody has to leave the page.
  const [newSkillFor, setNewSkillFor] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  function addSkillToRole(roleId: string, name: string) {
    const existing = model.skills.find(
      (s) => s.name.toLowerCase() === name.toLowerCase(),
    );
    const id =
      existing?.id ?? `skill_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    setModel((m) => ({
      ...m,
      skills: existing
        ? m.skills
        : [...m.skills, { id, name, description: "" }],
      skillRole: {
        ...m.skillRole,
        [id]: { ...(m.skillRole[id] ?? {}), [roleId]: 3 },
      },
      traitSkill: { ...m.traitSkill, [id]: m.traitSkill[id] ?? {} },
    }));
    setNewSkillName("");
    setNewSkillFor(null);
    setStatus(
      existing
        ? `${name} was already a skill — set to strong for this role.`
        : `${name} added to your skills and set to strong for this role.`,
    );
  }

  // One call for every role that has no skills yet — typically the whole of a
  // fresh upload. Results are pre-filled and fully editable, never applied
  // silently.
  const [suggesting, setSuggesting] = useState(false);
  async function suggestSkills() {
    const needs = roleSummaries.filter(
      (r) =>
        !model.skills.some((s) => (model.skillRole[s.id]?.[r.id] ?? 0) > 0),
    );
    if (needs.length === 0) {
      setStatus("Every role already has skills. Clear one to re-suggest.");
      return;
    }
    setSuggesting(true);
    setStatus(null);
    const t = await token();
    if (!t) {
      setSuggesting(false);
      return;
    }
    // Roles you have already tagged go along as worked examples.
    const examples = roleSummaries
      .filter((r) => !needs.includes(r))
      .slice(0, 4)
      .map((r) => ({
        title: r.title,
        skills: model.skills
          .map((s) => ({
            skillId: s.id,
            level: model.skillRole[s.id]?.[r.id] ?? 0,
          }))
          .filter(
            (x): x is { skillId: string; level: 1 | 2 | 3 } => x.level > 0,
          ),
      }));

    const result = await adminSuggestSkills(t, {
      roles: needs.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
      })),
      catalogue: model.skills,
      examples,
    });
    setSuggesting(false);
    if (!result) {
      setStatus(
        "Could not get suggestions. Set the skills by hand, or try again.",
      );
      return;
    }
    setModel((m) => {
      const skillRole = { ...m.skillRole };
      result.suggestions.forEach((suggestion) => {
        suggestion.skills.forEach((need) => {
          skillRole[need.skillId] = {
            ...(skillRole[need.skillId] ?? {}),
            [suggestion.roleId]: need.level,
          };
        });
      });
      return { ...m, skillRole };
    });
    const proposed = result.suggestions.flatMap((x) => x.proposedNewSkills);
    setStatus(
      `Suggested skills for ${result.suggestions.length} ${
        result.suggestions.length === 1 ? "role" : "roles"
      }. Check them, then save the draft.${
        proposed.length > 0
          ? ` It also wanted new skills: ${proposed.map((p) => p.name).join(", ")} — add them yourself if you agree.`
          : ""
      }${result.usedStub ? " (No API key yet — these are placeholder suggestions.)" : ""}`,
    );
  }

  // Every detail edit goes through here, so a role's other fields are always
  // carried forward rather than dropped by a partial write.
  function patchDetail(roleId: string, patch: Partial<RoleDetail>) {
    setDetails((ds) =>
      ds.map((d) => (d.roleId === roleId ? { ...d, ...patch } : d)),
    );
  }

  // One role of a batch write. Reads the detail at call time rather than
  // closing over it, so a role written earlier in the same run is enriched
  // from what it now says rather than from what it said when the run started.
  const runRoleWrite = useCallback(
    async (roleId: string, instruction: string): Promise<BatchOutcome> => {
      const t = await token();
      if (!t) return { ok: false, reason: "Your session expired. Reload." };
      const summary = roleSummaries.find((r) => r.id === roleId);
      if (!summary) return { ok: false, reason: "That role has gone." };
      const current = details.find((d) => d.roleId === roleId);
      const body = { ...BLANK_ROLE_BODY, ...(current ?? {}) };
      const result = await adminGenerateRoleDetail(t, {
        roleId,
        roleTitle: summary.title,
        roleSummary: summary.summary,
        sector: body.sector,
        pitch: body.pitch,
        description: body.description,
        workMix: body.workMix,
        responsibilities: body.responsibilities,
        skills: body.skills,
        workContext: body.workContext,
        hardTruths: body.hardTruths,
        suitsYouIf: body.suitsYouIf,
        instruction,
      });
      if (!result) return { ok: false, reason: "Could not reach the writer." };
      if (!result.ok) return { ok: false, reason: result.reason };
      patchDetail(roleId, mergeRoleDraft(body, result.draft));

      // The same instruction also drives the five student questions and the
      // industry variations. They are a separate generator with its own rules
      // about which fields need a source, but from the console they are one
      // job: "bring this role up to date" means all of it.
      const warnings = [...result.warnings];
      const ctx = await adminGenerateRoleContext(t, {
        roleId,
        roleTitle: summary.title,
        sector: body.sector,
        description: body.description,
        responsibilities: body.responsibilities,
        skills: body.skills,
        workContext: body.workContext,
        hardTruths: body.hardTruths,
        guidance: instruction,
      });
      if (ctx?.ok) {
        const had = current?.studentQuestions ?? {};
        const keep = (next: string, was?: string) =>
          next.trim() !== "" ? next : (was ?? "");
        patchDetail(roleId, {
          studentQuestions: {
            entry: keep(ctx.draft.entry, had.entry),
            where: keep(ctx.draft.where, had.where),
            transfers: keep(ctx.draft.transfers, had.transfers),
            changing: keep(ctx.draft.changing, had.changing),
            seen: keep(ctx.draft.seen, had.seen),
          },
          acrossIndustries:
            ctx.draft.acrossIndustries.length > 0
              ? ctx.draft.acrossIndustries
              : current?.acrossIndustries,
        });
        warnings.push(...ctx.warnings);
      } else if (ctx && !ctx.ok) {
        warnings.push(`Student questions: ${ctx.reason}`);
      }
      return { ok: true, warnings };
    },
    // patchDetail is a stable setState wrapper; details and roleSummaries are
    // the state this reads.
    [token, roleSummaries, details],
  );

  function removeRole(id: string) {
    setRoleSummaries((rs) => rs.filter((r) => r.id !== id));
    setDetails((ds) => ds.filter((d) => d.roleId !== id));
  }

  // A file of roles becomes a draft, exactly like editing by hand: nothing
  // reaches students until someone presses Publish.
  async function importRoles(file: File) {
    setImporting(true);
    setImported(null);
    setImportError(null);
    setStatus(null);
    const t = await token();
    if (!t) {
      setImporting(false);
      return;
    }
    const result = await adminImportCatalogue(t, file);
    setImporting(false);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    const data = result.data.draft.data as {
      roles?: RoleSummary[];
      details?: RoleDetail[];
    };
    setRoleSummaries(data.roles ?? []);
    setDetails(data.details ?? []);
    setHasDraft((h) => ({ ...h, roles: true }));
    setImported(result.data);
  }

  async function discard(kind: Kind) {
    setBusy(true);
    const t = await token();
    if (!t) {
      setBusy(false);
      setStatus("Your session expired. Reload the page and sign in again.");
      return;
    }
    await adminDiscardDraft(t, kind);
    setBusy(false);
    setStatus("Draft discarded. Reload to see the published content.");
    setHasDraft((h) => ({ ...h, [slotFor(kind)]: false }));
  }

  // Every tab that owns a document names it. The assessment tab used to fall
  // through to "discovery_content" here, which meant Save on that tab wrote
  // the discovery questions and Publish shipped them - the arcs could not be
  // saved at all, and pressing Publish there published something else.
  const kind: Kind =
    tab === "roles"
      ? "role_catalogue"
      : tab === "skills"
        ? "skill_model"
          : tab === "assessment"
            ? "assessment_arc"
            : tab === "interview"
              ? "interview_bank"
              : tab === "videos"
                ? "video_uploads"
                : "discovery_content";
  const doc =
    tab === "roles"
      ? roles
      : tab === "skills"
        ? skillModel
          : tab === "assessment"
            ? assessmentArc
            : tab === "interview"
              ? interviewBank
              : tab === "videos"
                ? null
                : discovery;
  // Stable, so the arc editor's generate callback is not rebuilt on every
  // keystroke elsewhere in the console.
  const skillsForRole = useCallback(
    (roleId: string) =>
      model.skills
        .filter((s) => (model.skillRole[s.id]?.[roleId] ?? 0) > 0)
        .map((s) => s.name),
    [model],
  );

  const draftPending =
    tab === "roles"
      ? hasDraft.roles
      : tab === "skills"
        ? hasDraft.skills
          : tab === "assessment"
            ? hasDraft.assessment
            : tab === "interview"
              ? hasDraft.interview
              : tab === "videos"
                ? hasDraft.videos
                : hasDraft.discovery;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
      <nav aria-label="Breadcrumb" className="pt-4 text-xs text-slate-400">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="px-1.5">›</span>
        <span className="text-slate-500">Admin console</span>
      </nav>

      <header className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Content &amp; assessments
          </h1>
          <p className="mt-1 max-w-2xl text-[0.88rem] text-slate-600">
            Saved as a draft; live publication requires two admin approvals.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          <span className="mb-3 flex flex-wrap gap-4"><Link href="/admin/studio">Role studio →</Link><AdminReviewLink /></span>
          Published v{doc?.published?.version ?? "—"}
          {doc?.published?.publishedAt
            ? ` · ${new Date(doc.published.publishedAt).toLocaleDateString()}`
            : ""}
        </p>
      </header>

      {openToEveryone && (
        <p className="mt-3 rounded-xl border border-amber-400 bg-amber-50 px-4 py-2.5 text-[0.8rem] text-amber-800">
          <strong className="font-semibold">Pilot setting:</strong> this console
          is open to every signed-in user so the team can use it before roles
          exist. Set <code className="font-mono">ADMIN_EMAILS</code> on the API
          and it becomes admin-only immediately — the entry point disappears for
          everyone else, and the API refuses their requests.
        </p>
      )}

      <div
        role="tablist"
        aria-label="Content"
        className="mt-5 flex gap-2 border-b border-slate-200"
      >
        {[
          { id: "roles" as const, label: "Roles" },
          { id: "skills" as const, label: "Skills & mappings" },
          { id: "assessment" as const, label: "Assessment" },
          { id: "interview" as const, label: "Interview questions" },
          { id: "videos" as const, label: "Video uploads" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
            className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "border-brand-violet text-brand-violet-deep"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status && (
        <p className="mt-3 rounded-lg bg-violet-50 px-3.5 py-2 text-[0.82rem] text-violet-900">
          {status}
        </p>
      )}

      {tab === "roles" && (
        <section className="mt-5 grid gap-4">
          <RoleBatch
            roles={roleSummaries.map((r) => ({ id: r.id, title: r.title }))}
            hint="Write or enrich several roles - the pitch, the day, the skills, the hard parts, and the five student questions with the industry variations. Pay and testimonials are never touched, here or anywhere."
            placeholder="e.g. The hard truths are too soft across the board. Make each one about a specific moment in that job, and put the worst one last."
            actionLabel="Write them"
            aiConfigured={aiConfigured}
            run={runRoleWrite}
          />
          {(() => {
            const found = (review?.reviews ?? []).filter(
              (r) => r.scope === "role",
            );
            const problems = found.filter((r) => r.level === "problem");
            // Nothing wrong means nothing to say.
            if (found.length === 0) return null;
            return (
              <div
                className={`rounded-xl border px-4 py-3 ${
                  problems.length > 0
                    ? "border-rose-200 bg-rose-50/50"
                    : "border-amber-200 bg-amber-50/50"
                }`}
              >
                <p className="text-[0.85rem] font-semibold text-slate-900">
                  {found.length} to look at
                </p>
                {found.slice(0, 3).map((r) => (
                  <p
                    key={r.message}
                    className={`mt-2 text-[0.82rem] leading-snug ${
                      r.level === "problem" ? "text-rose-800" : "text-amber-900"
                    }`}
                  >
                    {r.message}
                  </p>
                ))}
                {found.length > 3 && (
                  <p className="mt-2 text-[0.8rem] text-slate-500">
                    and {found.length - 3} more, in the roles below.
                  </p>
                )}
              </div>
            );
          })()}

          {/* One place to grow the catalogue: pick a title to add a role by
              hand, or upload a file to add many at once. Both write a draft. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Roles ({roleSummaries.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={suggesting}
                onClick={() => void suggestSkills()}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40"
              >
                {suggesting ? "Working…" : "Suggest skills"}
              </button>
              <button
                type="button"
                onClick={() => setAddOpen((v) => !v)}
                aria-expanded={addOpen}
                className="rounded-lg bg-brand-violet px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep"
              >
                {addOpen ? "Close" : "Add roles"}
              </button>
            </div>
          </div>

          {addOpen && (
            <div className="rounded-xl border border-slate-200 bg-surface p-4">
              <h3 className="text-[0.8rem] font-semibold text-slate-900">
                Add one role
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTitle.trim()) {
                      e.preventDefault();
                      addRole(newTitle.trim());
                    }
                  }}
                  placeholder="Role title"
                  aria-label="Role title"
                  className="min-w-56 rounded-lg border border-slate-300 bg-surface px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-violet"
                />
                <button
                  type="button"
                  disabled={!newTitle.trim()}
                  onClick={() => addRole(newTitle.trim())}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40"
                >
                  Add
                </button>
              </div>

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  or
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <h3 className="text-[0.8rem] font-semibold text-slate-900">
                Add many from a file
              </h3>
              <p className="mt-1 text-[0.8rem] leading-snug text-slate-500">
                Download the template, fill it in with Excel or Google Sheets,
                save as CSV and upload it back. A title already in the list is
                updated, not duplicated.
              </p>
              <button
                type="button"
                onClick={() => void downloadTemplate()}
                className="mt-2 text-[0.82rem] font-semibold text-brand-violet-deep hover:underline"
              >
                Download the template
              </button>
              <p className="mt-2 text-[0.78rem] text-slate-400">
                The template covers the basics. Career progression and
                testimonials are added on the role itself, below.
              </p>
              <label className="mt-2.5 inline-block cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400">
                {importing ? "Reading file…" : "Choose a file"}
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  disabled={importing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importRoles(file);
                    e.target.value = "";
                  }}
                />
              </label>

              {importError && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-rose-50 px-3.5 py-2 text-[0.82rem] text-rose-700"
                >
                  {importError}
                </p>
              )}

              {imported && (
                <div className="mt-3 rounded-lg bg-teal-50 px-3.5 py-2.5 text-[0.82rem] text-teal-700">
                  <p className="font-semibold">
                    {imported.added.length} added, {imported.updated.length}{" "}
                    updated — saved as a draft.
                  </p>
                  {imported.added.length > 0 && (
                    <p className="mt-1">Added: {imported.added.join(", ")}</p>
                  )}
                  {imported.updated.length > 0 && (
                    <p className="mt-1">
                      Updated: {imported.updated.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {imported && imported.issues.length > 0 && (
                <ul className="mt-2 grid gap-1 rounded-lg bg-amber-50 px-3.5 py-2.5 text-[0.8rem] text-amber-900">
                  {imported.issues.map((issue) => (
                    <li key={`${issue.row}-${issue.message}`}>
                      Row {issue.row}: {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {roleSummaries.map((role, i) => {
            const detail = details.find((d) => d.roleId === role.id);
            return (
              <Collapsible
                defaultOpen={role.id===initialRoleId}
                key={role.id}
                summary={
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[0.92rem] font-semibold text-slate-900">
                      {role.title || "Untitled role"}
                    </span>
                    <span className="text-[0.75rem] text-slate-400">
                      {
                        model.skills.filter(
                          (sk) => (model.skillRole[sk.id]?.[role.id] ?? 0) > 0,
                        ).length
                      }{" "}
                      skills
                    </span>
                  </span>
                }
                aside={
                  <button
                    type="button"
                    onClick={() => removeRole(role.id)}
                    aria-label={`Remove ${role.title || "this role"}`}
                    title={`Remove ${role.title || "this role"}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                  >
                    <TrashIcon />
                  </button>
                }
              >
                <RoleWriter
                  role={role}
                  detail={detail}
                  token={token}
                  aiConfigured={aiConfigured}
                  onPatch={(patch) => patchDetail(role.id, patch)}
                />

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Title"
                    value={role.title}
                    onChange={(v) =>
                      setRoleSummaries((rs) =>
                        rs.map((r, j) => (j === i ? { ...r, title: v } : r)),
                      )
                    }
                  />
                  <Field
                    label="One-line summary"
                    value={role.summary}
                    onChange={(v) =>
                      setRoleSummaries((rs) =>
                        rs.map((r, j) => (j === i ? { ...r, summary: v } : r)),
                      )
                    }
                  />
                </div>

                <div className="mt-3.5 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      Skills this role needs
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        value={newSkillFor === role.id ? newSkillName : ""}
                        onFocus={() => setNewSkillFor(role.id)}
                        onChange={(e) => {
                          setNewSkillFor(role.id);
                          setNewSkillName(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newSkillName.trim()) {
                            e.preventDefault();
                            addSkillToRole(role.id, newSkillName.trim());
                          }
                        }}
                        placeholder="New skill…"
                        aria-label={`Add a new skill to ${role.title}`}
                        className="w-36 rounded-lg border border-slate-300 bg-surface px-2.5 py-1.5 text-[0.78rem] outline-none focus:border-brand-violet"
                      />
                      <button
                        type="button"
                        disabled={
                          newSkillFor !== role.id || !newSkillName.trim()
                        }
                        onClick={() =>
                          addSkillToRole(role.id, newSkillName.trim())
                        }
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[0.78rem] font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <SkillNeeds
                    skills={model.skills}
                    levelOf={(skillId) =>
                      model.skillRole[skillId]?.[role.id] ?? 0
                    }
                    onCycle={(skillId) =>
                      setModel((m) => {
                        const current = m.skillRole[skillId]?.[role.id] ?? 0;
                        return {
                          ...m,
                          skillRole: {
                            ...m.skillRole,
                            [skillId]: {
                              ...(m.skillRole[skillId] ?? {}),
                              [role.id]: (current + 1) % 4,
                            },
                          },
                        };
                      })
                    }
                  />
                </div>

                {detail && (
                  <div className="mt-3 grid gap-3">
                    <Field
                      label="Pitch (the one line a student recognises the job by)"
                      value={detail.pitch}
                      multiline
                      onChange={(v) =>
                        setDetails((ds) =>
                          ds.map((d) =>
                            d.roleId === role.id ? { ...d, pitch: v } : d,
                          ),
                        )
                      }
                    />
                    <Field
                      label="What the job actually is"
                      value={detail.description}
                      multiline
                      onChange={(v) =>
                        setDetails((ds) =>
                          ds.map((d) =>
                            d.roleId === role.id ? { ...d, description: v } : d,
                          ),
                        )
                      }
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Pay from (₹/month)"
                        value={String(detail.payMonthly.min)}
                        onChange={(v) =>
                          setDetails((ds) =>
                            ds.map((d) =>
                              d.roleId === role.id
                                ? {
                                    ...d,
                                    payMonthly: {
                                      ...d.payMonthly,
                                      min: Number(v) || 0,
                                    },
                                  }
                                : d,
                            ),
                          )
                        }
                      />
                      <Field
                        label="Pay to (₹/month)"
                        value={String(detail.payMonthly.max)}
                        onChange={(v) =>
                          setDetails((ds) =>
                            ds.map((d) =>
                              d.roleId === role.id
                                ? {
                                    ...d,
                                    payMonthly: {
                                      ...d.payMonthly,
                                      max: Number(v) || 0,
                                    },
                                  }
                                : d,
                            ),
                          )
                        }
                      />
                    </div>
                    <Field
                      label="The hard parts (one per line)"
                      value={detail.hardTruths.join("\n")}
                      multiline
                      onChange={(v) =>
                        patchDetail(role.id, {
                          hardTruths: v.split("\n").filter(Boolean),
                        })
                      }
                    />
                    <Field
                      label="Suits you if (one per line)"
                      value={detail.suitsYouIf.join("\n")}
                      multiline
                      onChange={(v) =>
                        patchDetail(role.id, {
                          suitsYouIf: v.split("\n").filter(Boolean),
                        })
                      }
                    />
                    <Field
                      label="Day to day (one per line)"
                      value={detail.responsibilities.join("\n")}
                      multiline
                      onChange={(v) =>
                        patchDetail(role.id, {
                          responsibilities: v.split("\n").filter(Boolean),
                        })
                      }
                    />
                    <Field
                      label="Note under the pay range"
                      value={detail.payNote}
                      onChange={(v) => patchDetail(role.id, { payNote: v })}
                    />

                    <RowList
                      label="Career progression"
                      hint="What comes next, and the pay that goes with it."
                      rows={detail.growth}
                      blank={() => ({
                        title: "",
                        when: "",
                        pay: { min: 0, max: 0 },
                      })}
                      onChange={(growth) => patchDetail(role.id, { growth })}
                      render={(row, set) => (
                        <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_0.8fr_0.8fr]">
                          <input
                            value={row.title}
                            onChange={(e) => set({ title: e.target.value })}
                            placeholder="Step (e.g. Team lead level)"
                            aria-label="Progression step"
                            className={SMALL_INPUT}
                          />
                          <input
                            value={row.when}
                            onChange={(e) => set({ when: e.target.value })}
                            placeholder="When (e.g. 2–3 years)"
                            aria-label="When"
                            className={SMALL_INPUT}
                          />
                          <input
                            value={String(row.pay.min)}
                            onChange={(e) =>
                              set({
                                pay: {
                                  ...row.pay,
                                  min: Number(e.target.value) || 0,
                                },
                              })
                            }
                            placeholder="Pay from"
                            aria-label="Pay from"
                            className={SMALL_INPUT}
                          />
                          <input
                            value={String(row.pay.max)}
                            onChange={(e) =>
                              set({
                                pay: {
                                  ...row.pay,
                                  max: Number(e.target.value) || 0,
                                },
                              })
                            }
                            placeholder="Pay to"
                            aria-label="Pay to"
                            className={SMALL_INPUT}
                          />
                        </div>
                      )}
                    />

                    <RowList
                      label="Work mix"
                      hint="Share of working hours. These should add up to 100."
                      rows={detail.workMix}
                      blank={() => ({ label: "", share: 0, detail: "" })}
                      onChange={(workMix) => patchDetail(role.id, { workMix })}
                      render={(row, set) => (
                        <div className="grid gap-2 sm:grid-cols-[1.2fr_0.5fr_2fr]">
                          <input
                            value={row.label}
                            onChange={(e) => set({ label: e.target.value })}
                            placeholder="Activity"
                            aria-label="Activity"
                            className={SMALL_INPUT}
                          />
                          <input
                            value={String(row.share)}
                            onChange={(e) =>
                              set({ share: Number(e.target.value) || 0 })
                            }
                            placeholder="%"
                            aria-label="Share of hours"
                            className={SMALL_INPUT}
                          />
                          <input
                            value={row.detail}
                            onChange={(e) => set({ detail: e.target.value })}
                            placeholder="What it actually involves"
                            aria-label="Detail"
                            className={SMALL_INPUT}
                          />
                        </div>
                      )}
                    />

                    <RowList
                      label="Key skills"
                      rows={detail.skills}
                      blank={() => ({ name: "", why: "" })}
                      onChange={(skills) => patchDetail(role.id, { skills })}
                      render={(row, set) => (
                        <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                          <input
                            value={row.name}
                            onChange={(e) => set({ name: e.target.value })}
                            placeholder="Skill"
                            aria-label="Skill"
                            className={SMALL_INPUT}
                          />
                          <input
                            value={row.why}
                            onChange={(e) => set({ why: e.target.value })}
                            placeholder="Why it matters in this job"
                            aria-label="Why it matters"
                            className={SMALL_INPUT}
                          />
                        </div>
                      )}
                    />

                    <RowList
                      label="Testimonials"
                      hint="Leave the box below ticked unless these are real, consented quotes."
                      rows={detail.voices}
                      blank={() => ({
                        name: "",
                        title: "",
                        journey: "",
                        quote: "",
                      })}
                      onChange={(voices) => patchDetail(role.id, { voices })}
                      render={(row, set) => (
                        <div className="grid gap-2">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              value={row.name}
                              onChange={(e) => set({ name: e.target.value })}
                              placeholder="Name"
                              aria-label="Name"
                              className={SMALL_INPUT}
                            />
                            <input
                              value={row.title}
                              onChange={(e) => set({ title: e.target.value })}
                              placeholder="Their role and company"
                              aria-label="Their role"
                              className={SMALL_INPUT}
                            />
                          </div>
                          <input
                            value={row.journey}
                            onChange={(e) => set({ journey: e.target.value })}
                            placeholder="How they got there"
                            aria-label="Journey"
                            className={SMALL_INPUT}
                          />
                          <textarea
                            rows={2}
                            value={row.quote}
                            onChange={(e) => set({ quote: e.target.value })}
                            placeholder="What they say about the work"
                            aria-label="Quote"
                            className={SMALL_INPUT}
                          />
                        </div>
                      )}
                    />

                    <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[0.82rem] text-amber-900">
                      <input
                        type="checkbox"
                        checked={detail.voicesIllustrative}
                        onChange={(e) =>
                          patchDetail(role.id, {
                            voicesIllustrative: e.target.checked,
                          })
                        }
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>
                        These testimonials are illustrative composites, not real
                        named people. Students are told so. Untick only when
                        every quote here is real and consented.
                      </span>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Where the work happens"
                        value={detail.workContext.environment}
                        onChange={(v) =>
                          patchDetail(role.id, {
                            workContext: {
                              ...detail.workContext,
                              environment: v,
                            },
                          })
                        }
                      />
                      <Field
                        label="Hours"
                        value={detail.workContext.hours}
                        onChange={(v) =>
                          patchDetail(role.id, {
                            workContext: { ...detail.workContext, hours: v },
                          })
                        }
                      />
                      <Field
                        label="Pace"
                        value={detail.workContext.pace}
                        onChange={(v) =>
                          patchDetail(role.id, {
                            workContext: { ...detail.workContext, pace: v },
                          })
                        }
                      />
                      <Field
                        label="Team around you"
                        value={detail.workContext.team}
                        onChange={(v) =>
                          patchDetail(role.id, {
                            workContext: { ...detail.workContext, team: v },
                          })
                        }
                      />
                    </div>

                    <label className="block rounded-xl border border-slate-200 p-3.5">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        Anything else we know about this role
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] leading-snug text-slate-400">
                        Not shown on the role page. This is what the discovery
                        assistant draws on when a student asks something the
                        fields above do not answer — what an employer told you,
                        how the work really runs, what people get wrong about
                        it. Leave it empty and the assistant says it does not
                        know rather than reaching for something adjacent.
                      </span>
                      <textarea
                        rows={4}
                        value={detail.assistantNotes ?? ""}
                        onChange={(e) =>
                          patchDetail(role.id, {
                            assistantNotes: e.target.value,
                          })
                        }
                        placeholder="e.g. Most people who leave in the first month do so because of the 5am start, not the work. Hubs run a buddy system for the first two weeks."
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                      />
                    </label>

                    <RoleContextEditor
                      role={role}
                      detail={detail}
                      token={token}
                      aiConfigured={aiConfigured}
                      onPatch={(patch) => patchDetail(role.id, patch)}
                    />
                  </div>
                )}
              </Collapsible>
            );
          })}
        </section>
      )}

      {tab === "assessment" && (
        <AssessmentArcEditor
          bank={arcs}
          roles={roleSummaries.map((r) => ({
            id: r.id,
            title: r.title,
            summary: r.summary,
          }))}
          skillsForRole={skillsForRole}
          aiConfigured={aiConfigured}
          token={token}
          onChange={setArcs}
        />
      )}

      {tab === "interview" && (
        <InterviewBankEditor
          bank={interviews}
          roles={roleSummaries.flatMap((r) => {
            // Questions come from what the job needs, so a summary with no
            // detail behind it has nothing to build from.
            const detail = details.find((d) => d.roleId === r.id);
            return detail
              ? [
                  {
                    id: r.id,
                    title: r.title,
                    sector: detail.sector,
                    description: detail.description,
                    responsibilities: detail.responsibilities,
                    skills: detail.skills,
                    workContext: detail.workContext,
                    hardTruths: detail.hardTruths,
                  },
                ]
              : [];
          })}
          aiConfigured={aiConfigured}
          token={token}
          onChange={setInterviews}
        />
      )}

      {tab === "videos" && (
        <VideoUploadsEditor
          refreshKey={publishedAt}
          onSaved={() => setHasDraft((h) => ({ ...h, videos: true }))}
        />
      )}

      {tab === "skills" && (
        <SkillModelEditor
          model={model}
          review={review}
          checking={checking}
          roleCount={roleSummaries.length}
          onChange={setModel}
        />
      )}

      <div className="sticky bottom-0 mt-6 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="flex-1 text-xs text-slate-500">
          {draftPending
            ? "You have unpublished changes — students still see the published version."
            : "No unpublished changes."}
        </p>
        {/* What this tab is actually operating on. Publish being disabled is
            a correct consequence of there being no draft, so the screen has to
            show whether there is one rather than leaving it to be deduced. */}
        <span className="w-full text-[0.72rem] text-slate-400">
          Editing <code>{kind}</code> · published:{" "}
          {doc?.published ? `v${doc.published.version}` : "none"} · draft:{" "}
          {draftPending ? "yes" : "none"}
          {lastSave ? ` · last save → ${lastSave}` : ""}
        </span>
        {draftPending && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void discard(kind)}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-900"
          >
            Discard draft
          </button>
        )}
        {tab !== "videos" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void save(kind)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            {busy ? "Working…" : "Save draft"}
          </button>
        )}
        <button type="button" disabled={busy} className="rounded-lg border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-800" onClick={async()=>{setBusy(true);try{await studioRequest(`/content/${kind}/review`,{});setStatus("Review requested. Open the review inbox to see approvals and feedback.");}catch(e){setStatus(e instanceof Error?e.message:"Review could not be requested.");}finally{setBusy(false);}}}>Request two-admin review</button>
        <button
          type="button"
          disabled={busy || !draftPending}
          onClick={() => void publish(kind)}
          className="rounded-lg bg-brand-violet px-5 py-2 text-sm font-bold text-white hover:bg-brand-violet-deep disabled:opacity-40"
        >
          Publish
        </button>
      </div>
    </main>
  );
}
