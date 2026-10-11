"use client";

// The role context editor and the questions a student would ask.

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminGenerateRoleContext, adminRoleContextPrompt } from "@/lib/api";
import type { RoleDetail, RoleSummary } from "./role-draft";
import { RowList, SMALL_INPUT } from "./row-list";
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
export function RoleContextEditor({
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
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
          What the student is actually wondering
        </span>
        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="text-[0.75rem] font-semibold text-brand-violet-deep hover:underline"
        >
          {showPrompt ? "Hide" : "Read"} the built-in instruction
        </button>
      </div>
      <p className="mt-0.5 text-[0.75rem] text-slate-500">
        Everything else on a role describes the job. These describe the path
        into it. Leave any of them empty and it stays off the student&apos;s
        screen.
      </p>

      {showPrompt && (
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[0.75rem] leading-relaxed text-slate-600">
          {builtIn ?? "Loading…"}
        </pre>
      )}

      <label className="mt-3 block">
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
          Your sources and corrections
        </span>
        <span className="mt-0.5 block text-[0.75rem] leading-snug text-slate-500">
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
          <span className="text-[0.75rem] text-slate-500">
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
            <span className="mt-0.5 block text-[0.75rem] text-slate-500">
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
