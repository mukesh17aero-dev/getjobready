"use client";

// The interview questions tab: a reviewed bank of practice questions, one set
// per role.
//
// The banner at the top is not decoration. These are questions worth
// rehearsing, drawn from what the job needs - they are not, and must never be
// presented as, what real employers ask. That is field research, and it comes
// from pilot employers rather than from a model. An admin publishing a set
// should have read that sentence.

import { useCallback, useEffect, useState } from "react";
import {
  adminGenerateInterviewQuestions,
  adminInterviewPrompt,
  type InterviewBank,
  type InterviewQuestion,
  type InterviewQuestionSet,
} from "@/lib/api";
import { Collapsible } from "@/components/ui/collapsible";
import { RoleBatch, type BatchOutcome } from "./role-batch";

const INPUT =
  "w-full rounded-lg border border-slate-300 bg-surface px-2.5 py-1.5 text-[0.82rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20";

type RoleLite = {
  id: string;
  title: string;
  sector: string;
  description: string;
  responsibilities: string[];
  skills: Array<{ name: string; why: string }>;
  workContext: { environment: string; hours: string; pace: string; team: string };
  hardTruths: string[];
};

export function InterviewBankEditor({
  bank,
  roles,
  aiConfigured,
  token,
  onChange,
}: {
  bank: InterviewBank;
  roles: RoleLite[];
  aiConfigured: boolean;
  token: () => Promise<string | null>;
  onChange: (bank: InterviewBank) => void;
}) {
  const [builtIn, setBuiltIn] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!showPrompt || builtIn !== null) return;
    let cancelled = false;
    void (async () => {
      const t = await token();
      if (!t) return;
      const result = await adminInterviewPrompt(t);
      if (!cancelled && result) setBuiltIn(result.prompt);
    })();
    return () => {
      cancelled = true;
    };
  }, [showPrompt, builtIn, token]);

  const setFor = (roleId: string) =>
    bank.sets.find((s) => s.roleId === roleId) ?? null;

  const replaceSet = useCallback(
    (next: InterviewQuestionSet) =>
      onChange({
        sets: [next, ...bank.sets.filter((s) => s.roleId !== next.roleId)],
      }),
    [bank.sets, onChange],
  );

  // One role of a batch draft. Same endpoint the per-role button uses, so a
  // set written here is indistinguishable from one written one at a time.
  const runBatch = useCallback(
    async (roleId: string, instruction: string): Promise<BatchOutcome> => {
      const t = await token();
      if (!t) return { ok: false, reason: "Your session expired. Reload." };
      const role = roles.find((r) => r.id === roleId);
      if (!role) return { ok: false, reason: "That role has gone." };
      if (role.skills.length === 0) {
        return {
          ok: false,
          reason:
            "No skills on this role yet, so there is nothing to build questions from.",
        };
      }
      const result = await adminGenerateInterviewQuestions(t, {
        roleId: role.id,
        roleTitle: role.title,
        sector: role.sector,
        description: role.description,
        responsibilities: role.responsibilities,
        skills: role.skills,
        workContext: role.workContext,
        hardTruths: role.hardTruths,
        guidance: instruction,
      });
      if (!result) return { ok: false, reason: "Could not reach the writer." };
      if (!result.ok) return { ok: false, reason: result.reason };
      replaceSet(result.set);
      return { ok: true, warnings: result.warnings };
    },
    [roles, token, replaceSet],
  );

  return (
    <section className="mt-5">
      <div className="rounded-xl bg-amber-50 p-3.5 text-[0.82rem] leading-relaxed text-amber-900">
        <strong className="font-semibold">
          These are practice questions, not a record of what employers ask.
        </strong>{" "}
        They are drawn from what each job needs, so they are fair rehearsal —
        but no dataset covers what real interviewers actually say, and nothing
        here should ever be shown to a student as though it did. Real questions
        come from pilot employers, and go in the notes box on a role so they
        can be marked as real.
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[0.78rem] text-slate-500">
          One set per role. Generate, then read every question before you
          publish.
        </p>
        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="text-[0.75rem] font-semibold text-brand-violet-deep hover:underline"
        >
          {showPrompt ? "Hide" : "Read"} the built-in instruction
        </button>
      </div>

      {showPrompt && (
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[0.7rem] leading-relaxed text-slate-600">
          {builtIn ?? "Loading…"}
        </pre>
      )}

      <div className="mt-3">
        <RoleBatch
          roles={roles.map((r) => ({ id: r.id, title: r.title }))}
          hint="Draft a set of practice questions for several roles at once. Each set is still drawn from that role's own skills, so the questions differ even though the instruction does not."
          placeholder="e.g. Weight these towards the managerial round, and make every question start from something that has already gone wrong on the shift."
          actionLabel="Draft questions"
          aiConfigured={aiConfigured}
          run={runBatch}
        />
      </div>

      {roles.length === 0 && (
        <p className="mt-4 text-[0.85rem] text-slate-400">
          No roles yet. Add a role first — the questions come from what the job
          needs.
        </p>
      )}

      <div className="mt-4 grid gap-2.5">
        {roles.map((role) => (
          <RoleQuestions
            key={role.id}
            role={role}
            set={setFor(role.id)}
            aiConfigured={aiConfigured}
            token={token}
            onChange={replaceSet}
          />
        ))}
      </div>
    </section>
  );
}

function RoleQuestions({
  role,
  set,
  aiConfigured,
  token,
  onChange,
}: {
  role: RoleLite;
  set: InterviewQuestionSet | null;
  aiConfigured: boolean;
  token: () => Promise<string | null>;
  onChange: (set: InterviewQuestionSet) => void;
}) {
  const [guidance, setGuidance] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const questions = set?.questions ?? [];

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
    const result = await adminGenerateInterviewQuestions(t, {
      roleId: role.id,
      roleTitle: role.title,
      sector: role.sector,
      description: role.description,
      responsibilities: role.responsibilities,
      skills: role.skills,
      workContext: role.workContext,
      hardTruths: role.hardTruths,
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
    onChange(result.set);
  }, [role, guidance, token, onChange]);

  const patch = (index: number, next: Partial<InterviewQuestion>) =>
    onChange({
      roleId: role.id,
      roleTitle: role.title,
      questions: questions.map((q, i) => (i === index ? { ...q, ...next } : q)),
    });

  const remove = (index: number) =>
    onChange({
      roleId: role.id,
      roleTitle: role.title,
      questions: questions.filter((_, i) => i !== index),
    });

  const add = () =>
    onChange({
      roleId: role.id,
      roleTitle: role.title,
      questions: [
        ...questions,
        { round: "managerial", question: "", measures: "", looksLike: "" },
      ],
    });

  return (
    <Collapsible
      summary={
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="text-[0.9rem] font-semibold text-slate-900">
            {role.title}
          </span>
          <span className="text-[0.75rem] text-slate-400">
            {questions.length === 0
              ? "No questions yet"
              : `${questions.length} question${questions.length === 1 ? "" : "s"}`}
          </span>
        </span>
      }
    >
      <div className="grid gap-3">
        <label className="block">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
            Notes from a real employer, if you have them
          </span>
          <span className="mt-0.5 block text-[0.75rem] leading-snug text-slate-400">
            What an employer told you they look for, or questions they told you
            they actually ask. This overrides the drafter.
          </span>
          <textarea
            rows={3}
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            placeholder="e.g. The Bhiwandi hub manager says the whole first round is about whether you will turn up at 5am in monsoon season."
            className={`mt-1.5 ${INPUT}`}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy || !aiConfigured || role.skills.length === 0}
            onClick={() => void generate()}
            className="rounded-lg bg-brand-violet px-3.5 py-1.5 text-[0.8rem] font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-60"
          >
            {busy
              ? "Writing…"
              : questions.length > 0
                ? "Rewrite the set"
                : "Draft questions"}
          </button>
          <button
            type="button"
            onClick={add}
            className="text-[0.78rem] font-semibold text-brand-violet-deep hover:underline"
          >
            + Add one by hand
          </button>
          {role.skills.length === 0 && (
            <span className="text-[0.75rem] text-slate-400">
              This role has no skills yet — nothing to build questions from.
            </span>
          )}
          {!aiConfigured && role.skills.length > 0 && (
            <span className="text-[0.75rem] text-slate-400">
              No AI key configured — add them by hand.
            </span>
          )}
        </div>

        {questions.length > 0 && (
          <p className="text-[0.75rem] text-slate-400">
            Rewriting replaces every question below, including ones you edited.
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-[0.78rem] text-rose-800">
            {error}
          </p>
        )}
        {warnings.map((warning) => (
          <p
            key={warning}
            className="rounded-lg bg-amber-50 px-3 py-2 text-[0.78rem] leading-snug text-amber-900"
          >
            {warning}
          </p>
        ))}

        {questions.map((q, i) => (
          <div key={i} className="rounded-lg bg-slate-50 p-2.5">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 grid gap-1.5">
                <textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) => patch(i, { question: e.target.value })}
                  placeholder="The question, as it would be spoken"
                  aria-label="Question"
                  className={INPUT}
                />
                <div className="grid gap-1.5 sm:grid-cols-[8rem_1fr]">
                  <select
                    value={q.round}
                    onChange={(e) =>
                      patch(i, {
                        round: e.target.value as InterviewQuestion["round"],
                      })
                    }
                    aria-label="Round"
                    className={INPUT}
                  >
                    <option value="hr">HR round</option>
                    <option value="managerial">Managerial</option>
                  </select>
                  <input
                    value={q.measures}
                    onChange={(e) => patch(i, { measures: e.target.value })}
                    placeholder="Which skill this rehearses"
                    aria-label="Skill measured"
                    className={INPUT}
                  />
                </div>
                <input
                  value={q.looksLike}
                  onChange={(e) => patch(i, { looksLike: e.target.value })}
                  placeholder="What a strong answer shows (for you, not the student)"
                  aria-label="What a strong answer shows"
                  className={INPUT}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove question ${i + 1}`}
                className="shrink-0 rounded-lg px-2 py-1 text-[0.75rem] font-semibold text-slate-400 hover:bg-surface hover:text-rose-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </Collapsible>
  );
}
