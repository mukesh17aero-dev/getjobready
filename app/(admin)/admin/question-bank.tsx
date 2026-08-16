"use client";

import { useEffect, useState } from "react";
import {
  adminGenerateQuestions,
  type GeneratedQuestion,
  type SkillModel,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Collapsible } from "@/components/collapsible";

// The Discovery questions, grouped by the skill each one measures. Ten per
// skill is the target; the count on each group says how far off it is.
//
// Generating is one call for every skill you tick, so filling a gap across the
// whole catalogue costs one request, not one per skill.

// The Blueprint's mix, per skill: mostly paired work choices, a couple of
// micro-scenarios, and one optional open question.
export const MIX = { choices: 7, scenarios: 2, explanations: 1 } as const;
export const TARGET_PER_SKILL = MIX.choices + MIX.scenarios + MIX.explanations;

export type BankQuestion = GeneratedQuestion;

const KIND_LABEL: Record<BankQuestion["kind"], string> = {
  choice: "Paired choice",
  scenario: "Micro-scenario",
  explanation: "Open question",
};

export type QuestionBank = { questions: BankQuestion[] };

function PenIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-[1.05rem] w-[1.05rem]">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-[1.05rem] w-[1.05rem]">
      <path d="M4 7h16" />
      <path d="M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1Z" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function WeightSummary({
  weights,
  skills,
}: {
  weights: Array<{ skillId: string; level: number }>;
  skills: SkillModel["skills"];
}) {
  if (weights.length === 0) {
    return <span className="text-[0.72rem] text-slate-400">measures nothing</span>;
  }
  return (
    <span className="text-[0.72rem] text-slate-500">
      {weights
        .map((w) => {
          const name = skills.find((s) => s.id === w.skillId)?.name ?? w.skillId;
          return `${name} ${"•".repeat(w.level)}`;
        })
        .join(" · ")}
    </span>
  );
}

export function QuestionBankEditor({
  bank,
  model,
  aiConfigured,
  onChange,
}: {
  bank: QuestionBank;
  model: SkillModel;
  aiConfigured: boolean;
  onChange: (next: QuestionBank) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [guidance, setGuidance] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // Questions read as a student sees them until you choose to edit one.
  const [editing, setEditing] = useState<string | null>(null);

  // Self-healing: a bank that already carries colliding ids (from the
  // batch-numbering collision) is repaired once, in place.
  useEffect(() => {
    const seen = new Set<string>();
    let changed = false;
    const repaired = bank.questions.map((q) => {
      let id = q.id;
      let bump = 1;
      while (seen.has(id)) {
        id = `${q.id}_${++bump}`;
        changed = true;
      }
      seen.add(id);
      return id === q.id ? q : { ...q, id };
    });
    if (changed) onChange({ questions: repaired });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countFor = (skillId: string) =>
    bank.questions.filter((q) => q.forSkillId === skillId).length;

  const countKind = (skillId: string, kind: BankQuestion["kind"]) =>
    bank.questions.filter((q) => q.forSkillId === skillId && q.kind === kind).length;

  const toggle = (skillId: string) =>
    setPicked((p) =>
      p.includes(skillId) ? p.filter((s) => s !== skillId) : [...p, skillId],
    );

  const shortOfTarget = model.skills
    .filter((s) => countFor(s.id) < TARGET_PER_SKILL)
    .map((s) => s.id);

  async function regenerate() {
    const skillIds = picked.length > 0 ? picked : shortOfTarget;
    if (skillIds.length === 0) {
      setNote(
        `Every skill already has its ${TARGET_PER_SKILL}. Tick the skills you want and regenerate - their questions are replaced with a fresh batch.`,
      );
      return;
    }
    setBusy(true);
    setNote(null);
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setBusy(false);
      return;
    }
    const result = await adminGenerateQuestions(token, {
      catalogue: model.skills,
      // Ask only for what each skill is short of, kind by kind. A skill that
      // already has its scenarios gets none.
      // Unticked skills are topped up to the target. A skill the admin has
      // explicitly ticked gets a fresh full mix even when it is already at
      // target - that is what "regenerate with this guidance" means. The
      // new questions are added alongside; nothing is deleted.
      wanted: skillIds
        .map((skillId) => {
          const deficit = {
            skillId,
            choices: Math.max(0, MIX.choices - countKind(skillId, "choice")),
            scenarios: Math.max(0, MIX.scenarios - countKind(skillId, "scenario")),
            explanations: Math.max(
              0,
              MIX.explanations - countKind(skillId, "explanation"),
            ),
          };
          const empty =
            deficit.choices + deficit.scenarios + deficit.explanations === 0;
          return picked.includes(skillId) && empty
            ? { skillId, ...MIX }
            : deficit;
        })
        .filter((w) => w.choices + w.scenarios + w.explanations > 0),
      existingPrompts: bank.questions.map((q) =>
        q.kind === "scenario" ? q.situation : q.prompt,
      ),
      guidance: guidance.trim() || undefined,
    });
    setBusy(false);
    if ("error" in result) {
      setNote(`Could not generate - ${result.error}. Try again, or add questions by hand.`);
      return;
    }
    // Ticked skills are being REGENERATED: their old questions step aside
    // for the fresh batch. Unticked top-ups only ever add. This edits the
    // draft - students see nothing until Publish.
    const replacing = new Set(picked);
    const kept = bank.questions.filter((q) => !replacing.has(q.forSkillId));
    // Batch ids restart at 1 on the backend - every incoming id is made
    // unique against what remains and within its own batch.
    const used = new Set(kept.map((q) => q.id));
    const fresh = result.questions.map((q) => {
      let id = q.id;
      let bump = 1;
      while (used.has(id)) id = `${q.id}_${++bump}`;
      used.add(id);
      return id === q.id ? q : { ...q, id };
    });
    const replaced = bank.questions.length - kept.length;
    onChange({ questions: [...kept, ...fresh] });
    setNote(
      `${
        replaced > 0
          ? `Replaced ${replaced} with ${fresh.length} fresh questions`
          : `Added ${fresh.length} ${fresh.length === 1 ? "question" : "questions"}`
      }. Check them, then save the draft.${
        result.usedStub ? " (No API key yet — these are placeholders.)" : ""
      }`,
    );
    setPicked([]);
  }

  const patch = (id: string, next: Record<string, unknown>) =>
    onChange({
      questions: bank.questions.map((q) =>
        q.id === id ? ({ ...q, ...next } as BankQuestion) : q,
      ),
    });

  const remove = (id: string) =>
    onChange({ questions: bank.questions.filter((q) => q.id !== id) });

  return (
    <section className="mt-5 grid gap-5">
      {!aiConfigured && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[0.85rem] leading-snug text-amber-900">
          <strong className="font-semibold">No API key yet.</strong> Generating
          still works, but it returns numbered placeholder text rather than real
          questions. Add <code className="font-mono">ANTHROPIC_API_KEY</code> and
          the same button writes proper ones.
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-surface p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Generate questions
        </h2>
        <p className="mt-1 text-[0.8rem] leading-snug text-slate-500">
          Pick the skills to write for. With none ticked, every skill short of{" "}
          {TARGET_PER_SKILL} is topped up. Ticked skills are regenerated -
          their existing questions are replaced by the fresh batch (draft
          only, until you publish).
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {model.skills.map((skill) => {
            const on = picked.includes(skill.id);
            const count = countFor(skill.id);
            return (
              <button
                key={skill.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(skill.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                  on
                    ? "border-brand-violet bg-brand-violet text-white"
                    : "border-slate-200 bg-surface text-slate-600 hover:border-slate-300"
                }`}
              >
                {skill.name}
                <span
                  className={`tabular-nums ${
                    on
                      ? "text-white/70"
                      : count >= TARGET_PER_SKILL
                        ? "text-teal-700"
                        : "text-amber-700"
                  }`}
                >
                  {count}/{TARGET_PER_SKILL}
                </span>
              </button>
            );
          })}
        </div>

        <label className="mt-3 block">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
            Extra instructions for this run (optional)
          </span>
          <textarea
            rows={2}
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            placeholder="Added to the prompt for this run — e.g. use delivery and bank branch examples, keep the language very simple, avoid anything about targets"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet"
          />
        </label>

        <button
          type="button"
          disabled={busy}
          onClick={() => void regenerate()}
          className="mt-3 rounded-lg bg-brand-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:opacity-40"
        >
          {busy ? "Writing…" : "Regenerate questions"}
        </button>

        {note && (
          <p className="mt-2.5 rounded-lg bg-violet-50 px-3.5 py-2 text-[0.82rem] text-violet-900">
            {note}
          </p>
        )}
      </div>

      {model.skills.map((skill) => {
        const rows = bank.questions.filter((q) => q.forSkillId === skill.id);
        return (
          <Collapsible
            key={skill.id}
            summary={
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-semibold text-slate-900">
                  {skill.name}
                </span>
                <span
                  className={`text-[0.75rem] tabular-nums ${
                    rows.length >= TARGET_PER_SKILL
                      ? "text-slate-400"
                      : "text-amber-700"
                  }`}
                >
                  {rows.length} of {TARGET_PER_SKILL} questions
                </span>
              </span>
            }
          >
            <div className="-mx-4 -my-3">
              {rows.length === 0 && (
                <p className="px-4 py-3 text-[0.8rem] text-slate-400">
                  No questions yet — tick {skill.name} above and generate.
                </p>
              )}
              {rows.map((q) => {
                const isEditing = editing === q.id;
                return (
                  <div
                    key={q.id}
                    className="border-t border-slate-100 px-4 py-3 first:border-t-0"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-slate-500">
                        {KIND_LABEL[q.kind]}
                      </span>
                      <div className="min-w-0 flex-1" />
                      <button
                        type="button"
                        onClick={() => setEditing(isEditing ? null : q.id)}
                        aria-label={isEditing ? "Done editing" : "Edit this question"}
                        title={isEditing ? "Done" : "Edit"}
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
                          isEditing
                            ? "bg-brand-violet text-white"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <PenIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(q.id)}
                        aria-label="Remove this question"
                        title="Remove"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        <TrashIcon />
                      </button>
                    </div>

                    {!isEditing ? (
                      // As a student sees it.
                      <div className="mt-1">
                        <p className="text-[0.92rem] font-semibold leading-snug text-slate-900">
                          {q.kind === "scenario" ? q.situation : q.prompt}
                        </p>
                        {q.kind === "choice" && (
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {([["a", q.a], ["b", q.b]] as const).map(([side, option]) => (
                              <div
                                key={side}
                                className="rounded-xl border border-slate-200 px-3.5 py-2.5"
                              >
                                <p className="text-[0.85rem] leading-snug text-slate-800">
                                  {option.label}
                                </p>
                                <div className="mt-1">
                                  <WeightSummary weights={option.weights} skills={model.skills} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.kind === "scenario" && (
                          <div className="mt-2 grid gap-2">
                            {q.options.map((option) => (
                              <div
                                key={option.id}
                                className="rounded-xl border border-slate-200 px-3.5 py-2.5"
                              >
                                <p className="text-[0.85rem] leading-snug text-slate-800">
                                  {option.label}
                                </p>
                                <div className="mt-1">
                                  <WeightSummary weights={option.weights} skills={model.skills} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.kind === "explanation" && (
                          <p className="mt-1.5 text-[0.78rem] text-slate-400">
                            Optional, and carries no weights — it adds colour to
                            their result.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1">
                        <textarea
                          rows={q.kind === "scenario" ? 3 : 2}
                          value={q.kind === "scenario" ? q.situation : q.prompt}
                          onChange={(e) =>
                            patch(
                              q.id,
                              q.kind === "scenario"
                                ? { situation: e.target.value }
                                : { prompt: e.target.value },
                            )
                          }
                          aria-label={q.kind === "scenario" ? "Situation" : "Question"}
                          className="w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] font-semibold text-slate-900 outline-none focus:border-brand-violet"
                        />

                        {q.kind === "choice" && (
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {(["a", "b"] as const).map((side) => (
                              <div key={side} className="rounded-lg bg-slate-50 p-2.5">
                                <input
                                  value={q[side].label}
                                  onChange={(e) =>
                                    patch(q.id, {
                                      [side]: { ...q[side], label: e.target.value },
                                    })
                                  }
                                  aria-label={`Option ${side.toUpperCase()}`}
                                  className="w-full rounded-md border border-slate-300 bg-surface px-2.5 py-1.5 text-[0.82rem] text-slate-800 outline-none focus:border-brand-violet"
                                />
                                <div className="mt-1 px-0.5">
                                  <WeightSummary weights={q[side].weights} skills={model.skills} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.kind === "scenario" && (
                          <div className="mt-2 grid gap-2">
                            {q.options.map((option, i) => (
                              <div key={option.id} className="rounded-lg bg-slate-50 p-2.5">
                                <input
                                  value={option.label}
                                  onChange={(e) =>
                                    patch(q.id, {
                                      options: q.options.map((o, j) =>
                                        j === i ? { ...o, label: e.target.value } : o,
                                      ),
                                    })
                                  }
                                  aria-label={`Option ${option.id.toUpperCase()}`}
                                  className="w-full rounded-md border border-slate-300 bg-surface px-2.5 py-1.5 text-[0.82rem] text-slate-800 outline-none focus:border-brand-violet"
                                />
                                <div className="mt-1 px-0.5">
                                  <WeightSummary weights={option.weights} skills={model.skills} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="mt-2 text-[0.8rem] font-semibold text-brand-violet-deep hover:underline"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Collapsible>
        );
      })}
    </section>
  );
}
