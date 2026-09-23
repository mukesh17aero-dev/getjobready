"use client";

// The gap popup: what the resume is missing, asked one question at a time.

// ---- The gap popup ----
//
// Same portal/dialog shape as AuthModal: portal to <body>, backdrop click and
// Escape close it, the page behind cannot scroll. Light panel - this dialog
// lives inside the app, not on the night-themed landing.
import { splitList } from "./resume-text";
import { type GapCheckResult } from "./resume-api";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
/** The send mark. An arrow up, as every chat box has settled on. */
export function ArrowUp() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

/** The upload mark. Drawn rather than imported: one shape, used once. */
export function UploadMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 14.5A3.5 3.5 0 0 1 7 11a5 5 0 0 1 9.6-1.4A4 4 0 0 1 20 13.5a3.5 3.5 0 0 1-3.5 3.5H16" />
      <path d="M12 12v8" />
      <path d="m9 15 3-3 3 3" />
    </svg>
  );
}

export function GapModal({
  gap,
  profileSkills,
  busy,
  onClose,
  onSubmit,
}: {
  gap: GapCheckResult;
  profileSkills: string[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, string>, newSkills: string[]) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extraSkills, setExtraSkills] = useState("");
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // The deviation guard. Anything the person claims here that their record
  // does not already hold is flagged, and only an explicit "yes, this is
  // true" lets it in. Two sources of claims: the skills box itself, and any
  // role keyword that appears in a written answer.
  const known = profileSkills.map((s) => s.toLowerCase());
  const isKnown = (skill: string) => {
    const lower = skill.toLowerCase();
    return known.some((k) => k.includes(lower) || lower.includes(k));
  };
  const typedSkills = splitList(extraSkills);
  const answerText = Object.values(answers).join(" ").toLowerCase();
  const mentioned = gap.keywords.filter(
    (kw) => answerText.includes(kw.toLowerCase()) && !isKnown(kw),
  );
  const flagged = [
    ...typedSkills.filter((s) => !isKnown(s)),
    ...mentioned.filter(
      (kw) => !typedSkills.some((s) => s.toLowerCase() === kw.toLowerCase()),
    ),
  ];
  const unconfirmed = flagged.filter((s) => !acknowledged.has(s.toLowerCase()));

  const toggleAck = (skill: string) => {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      const key = skill.toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = () => {
    const confirmed = flagged.filter((s) => acknowledged.has(s.toLowerCase()));
    const filled: Record<string, string> = {};
    for (const [key, value] of Object.entries(answers)) {
      if (value.trim()) filled[key] = value.trim();
    }
    onSubmit(filled, confirmed);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="A few details would make this resume stronger"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-surface p-6 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.4)] outline-none sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
        <h2 className="pr-10 text-lg font-semibold text-brand-ink">
          A few details would make this stronger
        </h2>
        <p className="mt-1 text-[0.85rem] text-slate-600">
          Your record covers a lot already. These questions fill what a{" "}
          {gap.targetRole} resume still misses - skip any that don&rsquo;t
          apply.
        </p>

        <div className="mt-4 grid gap-4">
          {gap.missing.map(({ field, question }) => (
            <label key={field} className="block">
              <span className="text-[0.82rem] font-semibold text-slate-800">
                {question}
              </span>
              <textarea
                rows={2}
                value={answers[field] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [field]: e.target.value }))
                }
                className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-[0.82rem] font-semibold text-slate-800">
              Any other skills this resume should show? (optional)
            </span>
            <span className="block text-[0.72rem] text-slate-400">
              Comma separated. Only claim what you could back up in an
              interview.
            </span>
            <input
              value={extraSkills}
              onChange={(e) => setExtraSkills(e.target.value)}
              placeholder="Google Sheets, Hindi typing"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-[0.88rem] outline-none focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
            />
          </label>
        </div>

        {flagged.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <p className="text-[0.8rem] font-semibold text-amber-900">
              Worth a second look
            </p>
            <div className="mt-2 grid gap-2">
              {flagged.map((skill) => (
                <label
                  key={skill}
                  className="flex min-h-11 cursor-pointer items-start gap-2.5"
                >
                  <input
                    type="checkbox"
                    checked={acknowledged.has(skill.toLowerCase())}
                    onChange={() => toggleAck(skill)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-teal-700"
                  />
                  <span className="text-[0.8rem] leading-snug text-amber-900">
                    <strong className="font-semibold">{skill}</strong> - this is
                    new - confirm it is true and you could back it up in an
                    interview.
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[0.72rem] text-amber-800">
              Confirmed skills go on the resume; unticked ones stay off it.
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            disabled={busy || unconfirmed.length > 0}
            onClick={submit}
            className="rounded-lg bg-brand-teal-deep px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50"
          >
            {busy ? "Building…" : "Save and build my resume"}
          </button>
          {unconfirmed.length > 0 && (
            <span className="text-[0.75rem] text-amber-800">
              Tick or clear the flagged skills first.
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
