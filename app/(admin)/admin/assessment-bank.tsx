"use client";

import { useEffect, useRef, useState } from "react";
import type { SkillModel } from "@/lib/api";
import {
  adminGenerateAssessmentImages,
  adminGenerateAssessmentQuestions,
  type AssessmentBank,
  type AssessmentQuestion,
} from "@/lib/assessment-api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Collapsible } from "@/components/collapsible";

// The role assessment bank: for one role at a time, scenario questions with a
// correct answer, tagged with the skill they probe and how deep they probe it.
// Same editing contract as the Discovery bank - generation writes into the
// draft, ticked skills are regenerated (replaced), and nothing reaches
// students until Publish.

// 30-40 questions per role, spread over every required skill. Few skills get
// more each; many skills get fewer each; both land inside the band.
export function targetPerSkill(skillCount: number): number {
  if (skillCount === 0) return 0;
  return Math.min(12, Math.max(5, Math.ceil(34 / skillCount)));
}

const LEVEL_LABEL: Record<1 | 2 | 3, string> = {
  1: "L1 · Basic",
  2: "L2 · Competent",
  3: "L3 · Strong",
};

const LEVEL_STYLE: Record<1 | 2 | 3, string> = {
  1: "bg-slate-100 text-slate-600",
  2: "bg-amber-50 text-amber-800",
  3: "bg-teal-50 text-teal-700",
};

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

function QuestionImage({ q }: { q: AssessmentQuestion }) {
  const src = q.imageUrl ?? (q.imageB64 ? `data:image/png;base64,${q.imageB64}` : null);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="mt-2 h-28 w-28 rounded-xl border border-slate-200 object-cover"
    />
  );
}

export function AssessmentBankEditor({
  bank,
  model,
  roles,
  aiConfigured,
  onChange,
}: {
  bank: AssessmentBank;
  model: SkillModel;
  roles: Array<{ id: string; title: string; summary: string }>;
  aiConfigured: boolean;
  onChange: (next: AssessmentBank) => void;
}) {
  const [roleId, setRoleId] = useState<string>(roles[0]?.id ?? "");
  const [picked, setPicked] = useState<string[]>([]);
  const [guidance, setGuidance] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  // Image work: which single question is in flight, and batch progress.
  const [imageBusy, setImageBusy] = useState<string | null>(null);
  const [batchNote, setBatchNote] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const stopBatch = useRef(false);

  const role = roles.find((r) => r.id === roleId) ?? null;

  // The skills this role requires, from the same mapping Discovery uses.
  const required = model.skills
    .map((s) => ({
      ...s,
      need: (model.skillRole[s.id]?.[roleId] ?? 0) as 0 | 1 | 2 | 3,
    }))
    .filter((s): s is typeof s & { need: 1 | 2 | 3 } => s.need > 0);

  const target = targetPerSkill(required.length);

  const roleQuestions = bank.questions.filter((q) => q.roleId === roleId);
  const countFor = (skillId: string) =>
    roleQuestions.filter((q) => q.skillId === skillId).length;

  const toggle = (skillId: string) =>
    setPicked((p) =>
      p.includes(skillId) ? p.filter((s) => s !== skillId) : [...p, skillId],
    );

  const shortOfTarget = required
    .filter((s) => countFor(s.id) < target)
    .map((s) => s.id);

  async function token(): Promise<string | null> {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function regenerate() {
    if (!role || required.length === 0) return;
    const skillIds = picked.length > 0 ? picked : shortOfTarget;
    if (skillIds.length === 0) {
      setNote(
        `Every skill already has its ${target}. Tick the skills you want and regenerate - their questions are replaced with a fresh batch.`,
      );
      return;
    }
    setBusy(true);
    setNote(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      return;
    }
    // Unticked skills are topped up to the target. A skill the admin has
    // explicitly ticked gets a fresh full set even at target - that is what
    // "regenerate with this guidance" means.
    const wanted = skillIds
      .map((skillId) => {
        const deficit = Math.max(0, target - countFor(skillId));
        return {
          skillId,
          count: picked.includes(skillId) && deficit === 0 ? target : deficit,
        };
      })
      .filter((w) => w.count > 0);

    const result = await adminGenerateAssessmentQuestions(t, {
      role: { id: role.id, title: role.title, summary: role.summary },
      skills: required.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        need: s.need,
      })),
      wanted,
      existing: roleQuestions.map((q) => ({
        skillId: q.skillId,
        text: `${q.situation} ${q.prompt}`,
      })),
      guidance: guidance.trim() || undefined,
    });
    setBusy(false);
    if ("error" in result) {
      setNote(`Could not generate - ${result.error}. Try again, or add questions by hand.`);
      return;
    }
    // Ticked skills are REGENERATED for this role: their old questions step
    // aside for the fresh batch. Unticked top-ups only ever add. Draft only -
    // students see nothing until Publish.
    const replacing = new Set(picked);
    const kept = bank.questions.filter(
      (q) => !(q.roleId === roleId && replacing.has(q.skillId)),
    );
    // Batch ids restart on the backend - every incoming id is made unique
    // against what remains and within its own batch.
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
      } for ${role.title}. Check them, then save the draft.${
        result.usedStub ? " (No API key yet - these are placeholders.)" : ""
      }`,
    );
    setPicked([]);
  }

  // Patches go through a ref: the batch image loop applies several between
  // renders, and each must build on the previous one, not on a stale render's
  // bank - otherwise every image but the last would be lost.
  const bankRef = useRef(bank);
  useEffect(() => {
    bankRef.current = bank;
  }, [bank]);
  const patch = (id: string, next: Partial<AssessmentQuestion>) => {
    bankRef.current = {
      questions: bankRef.current.questions.map((q) =>
        q.id === id ? { ...q, ...next } : q,
      ),
    };
    onChange(bankRef.current);
  };

  const remove = (id: string) =>
    onChange({ questions: bank.questions.filter((q) => q.id !== id) });

  // ---- Images -------------------------------------------------------------
  // Generated only on these two buttons, never as a side effect - each image
  // costs real money and storage.

  const applyImage = (
    result:
      | { id: string; imageUrl: string }
      | { id: string; imageB64: string }
      | { id: string; error: string },
  ): string | null => {
    if ("imageUrl" in result) {
      patch(result.id, { imageUrl: result.imageUrl, imageB64: undefined });
      return null;
    }
    if ("imageB64" in result) {
      // Storage bucket unavailable - the draft carries the image inline until
      // the bucket exists and the image is regenerated.
      patch(result.id, { imageB64: result.imageB64, imageUrl: undefined });
      return null;
    }
    return result.error;
  };

  async function generateOneImage(q: AssessmentQuestion) {
    setImageBusy(q.id);
    setNote(null);
    const t = await token();
    if (!t) {
      setImageBusy(null);
      return;
    }
    const result = await adminGenerateAssessmentImages(t, [
      { id: q.id, scene: q.situation },
    ]);
    setImageBusy(null);
    if ("error" in result) {
      setNote(`Could not make the image - ${result.error}`);
      return;
    }
    const failed = result.images.map(applyImage).find((e) => e !== null);
    if (failed) setNote(`Could not make the image - ${failed}`);
  }

  const missingImages = roleQuestions.filter((q) => !q.imageUrl && !q.imageB64);

  async function generateMissingImages() {
    if (missingImages.length === 0) return;
    setBatchRunning(true);
    stopBatch.current = false;
    setNote(null);
    const t = await token();
    if (!t) {
      setBatchRunning(false);
      return;
    }
    let done = 0;
    let failed = 0;
    // One image per request, sequentially: the admin sees progress, a slow
    // image cannot time out a big call, and Stop takes effect between images.
    for (const q of missingImages) {
      if (stopBatch.current) break;
      setBatchNote(`Image ${done + failed + 1} of ${missingImages.length}…`);
      const result = await adminGenerateAssessmentImages(t, [
        { id: q.id, scene: q.situation },
      ]);
      if ("error" in result) {
        failed += 1;
        setNote(`Stopped - ${result.error}`);
        break;
      }
      const error = result.images.map(applyImage).find((e) => e !== null);
      if (error) failed += 1;
      else done += 1;
    }
    setBatchRunning(false);
    setBatchNote(null);
    if (done > 0 || failed > 0) {
      setNote(
        `${done} ${done === 1 ? "image" : "images"} made${
          failed > 0 ? `, ${failed} failed` : ""
        }. Save the draft to keep them.`,
      );
    }
  }

  // ---- Render -------------------------------------------------------------

  if (roles.length === 0) {
    return (
      <section className="mt-5 rounded-xl border border-slate-200 bg-surface p-4">
        <p className="text-[0.85rem] text-slate-500">
          No roles yet - add roles on the Roles tab first, then come back to
          write their assessments.
        </p>
      </section>
    );
  }

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
          Generate assessment questions
        </h2>
        <p className="mt-1 text-[0.8rem] leading-snug text-slate-500">
          Pick a role, then the skills to write for. These questions have a
          correct answer - they measure how ready someone is for the job, not
          which job fits. With no skills ticked, every skill short of {target || "target"} is
          topped up. Ticked skills are regenerated - their existing questions
          are replaced by the fresh batch (draft only, until you publish).
        </p>

        <label className="mt-3 block max-w-sm">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
            Role
          </span>
          <select
            value={roleId}
            onChange={(e) => {
              setRoleId(e.target.value);
              setPicked([]);
              setNote(null);
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>

        {required.length === 0 ? (
          <p className="mt-3 text-[0.8rem] text-slate-400">
            This role has no skills mapped yet - set them on the Roles tab
            (Skills this role needs), then come back.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {required.map((skill) => {
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
                        : count >= target
                          ? "text-teal-700"
                          : "text-amber-700"
                    }`}
                  >
                    {count}/{target}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <label className="mt-3 block">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
            Extra instructions for this run (optional)
          </span>
          <textarea
            rows={2}
            maxLength={1000}
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            placeholder="Added to the prompt for this run - e.g. focus on the morning rush, use quick-service restaurant situations, keep the language very simple"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] outline-none focus:border-brand-violet"
          />
        </label>

        <button
          type="button"
          disabled={busy || required.length === 0}
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

      {roleQuestions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-surface p-4">
          <h2 className="text-sm font-semibold text-slate-900">Images</h2>
          <p className="mt-1 text-[0.8rem] leading-snug text-slate-500">
            One flat teal illustration per question, drawn from its scenario.
            Images are made only when you press these buttons - each one costs
            roughly $0.01-0.02 (gpt-image-1, low quality) and is stored once.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={batchRunning || missingImages.length === 0}
              onClick={() => void generateMissingImages()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40"
            >
              {batchRunning
                ? (batchNote ?? "Working…")
                : missingImages.length === 0
                  ? "Every question has an image"
                  : `Generate ${missingImages.length} missing ${
                      missingImages.length === 1 ? "image" : "images"
                    }`}
            </button>
            {batchRunning && (
              <button
                type="button"
                onClick={() => {
                  stopBatch.current = true;
                }}
                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-900"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      )}

      {required.map((skill) => {
        const rows = roleQuestions.filter((q) => q.skillId === skill.id);
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
                    rows.length >= target ? "text-slate-400" : "text-amber-700"
                  }`}
                >
                  {rows.length} of {target} questions
                </span>
              </span>
            }
          >
            <div className="-mx-4 -my-3">
              {rows.length === 0 && (
                <p className="px-4 py-3 text-[0.8rem] text-slate-400">
                  No questions yet - tick {skill.name} above and generate.
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
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${LEVEL_STYLE[q.proficiencyLevel]}`}
                      >
                        {LEVEL_LABEL[q.proficiencyLevel]}
                      </span>
                      <div className="min-w-0 flex-1" />
                      <button
                        type="button"
                        disabled={imageBusy !== null || batchRunning}
                        onClick={() => void generateOneImage(q)}
                        className="shrink-0 rounded-lg px-2.5 py-1.5 text-[0.75rem] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                      >
                        {imageBusy === q.id
                          ? "Drawing…"
                          : q.imageUrl || q.imageB64
                            ? "Redraw image"
                            : "Generate image"}
                      </button>
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
                      // As a student sees it, plus the marking a student never
                      // sees: the best answer, the feedback and the rationale.
                      <div className="mt-1">
                        <p className="text-[0.92rem] font-semibold leading-snug text-slate-900">
                          {q.situation}
                        </p>
                        <p className="mt-1 text-[0.88rem] leading-snug text-slate-700">
                          {q.prompt}
                        </p>
                        <QuestionImage q={q} />
                        <div className="mt-2 grid gap-2">
                          {q.options.map((option) => {
                            const correct = option.id === q.correctOptionId;
                            return (
                              <div
                                key={option.id}
                                className={`rounded-xl border px-3.5 py-2.5 ${
                                  correct
                                    ? "border-teal-600 bg-teal-50/40"
                                    : "border-slate-200"
                                }`}
                              >
                                <p className="text-[0.85rem] leading-snug text-slate-800">
                                  {option.label}
                                  {correct && (
                                    <span className="ml-2 rounded-full bg-teal-600 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
                                      Best answer
                                    </span>
                                  )}
                                </p>
                                <p className="mt-1 text-[0.72rem] text-slate-500">
                                  {option.feedback}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[0.78rem] leading-snug text-slate-500">
                          <span className="font-semibold text-slate-600">Why:</span>{" "}
                          {q.rationale}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-1 grid gap-2">
                        <textarea
                          rows={3}
                          value={q.situation}
                          onChange={(e) => patch(q.id, { situation: e.target.value })}
                          aria-label="Situation"
                          className="w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] font-semibold text-slate-900 outline-none focus:border-brand-violet"
                        />
                        <textarea
                          rows={2}
                          value={q.prompt}
                          onChange={(e) => patch(q.id, { prompt: e.target.value })}
                          aria-label="Question"
                          className="w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.85rem] text-slate-800 outline-none focus:border-brand-violet"
                        />
                        {q.options.map((option, i) => (
                          <div key={option.id} className="rounded-lg bg-slate-50 p-2.5">
                            <div className="flex items-center gap-2">
                              <label className="flex shrink-0 items-center gap-1.5 text-[0.72rem] font-semibold text-slate-500">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={option.id === q.correctOptionId}
                                  onChange={() =>
                                    patch(q.id, { correctOptionId: option.id })
                                  }
                                  className="h-4 w-4"
                                />
                                Best
                              </label>
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
                            </div>
                            <input
                              value={option.feedback}
                              onChange={(e) =>
                                patch(q.id, {
                                  options: q.options.map((o, j) =>
                                    j === i ? { ...o, feedback: e.target.value } : o,
                                  ),
                                })
                              }
                              aria-label={`Feedback for option ${option.id.toUpperCase()}`}
                              placeholder="Feedback shown after choosing this"
                              className="mt-1.5 w-full rounded-md border border-slate-300 bg-surface px-2.5 py-1.5 text-[0.78rem] text-slate-600 outline-none focus:border-brand-violet"
                            />
                          </div>
                        ))}
                        <textarea
                          rows={2}
                          value={q.rationale}
                          onChange={(e) => patch(q.id, { rationale: e.target.value })}
                          aria-label="Rationale"
                          placeholder="Why the best answer is best"
                          className="w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.8rem] text-slate-600 outline-none focus:border-brand-violet"
                        />
                        <div>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="text-[0.8rem] font-semibold text-brand-violet-deep hover:underline"
                          >
                            Done
                          </button>
                        </div>
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
