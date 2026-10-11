"use client";

// Writing a role: the free-text half of the studio.

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminGenerateRoleDetail, adminRoleDetailPrompt } from "@/lib/api";
import { BLANK_ROLE_BODY, type RoleDetail, type RoleSummary, mergeRoleDraft } from "./role-draft";
export function RoleWriter({
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
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-brand-violet-deep">
          Write this role with AI
        </span>
        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="text-[0.75rem] font-semibold text-brand-violet-deep hover:underline"
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
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-3 text-[0.75rem] leading-relaxed text-slate-600">
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
          <span className="text-[0.75rem] text-slate-500">
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
