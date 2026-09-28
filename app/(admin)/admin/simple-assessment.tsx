"use client";

import { useEffect, useState } from "react";
import { adminGenerateArc, adminSaveDraftDetailed, type ArcBank, type ArcScene, type AssessmentArc } from "@/lib/api";
import { studioRequest } from "@/features/admin";
import { assessmentQuestionCards } from "@/features/assessment";
import { AssessmentArcEditor } from "./assessment-arc";

// The whole job on one screen: choose a role, create its questions, read them,
// publish. Everything else about authoring lives under "Advanced tools".

const SITTING = 5;
const POOL = 10;

function typeOf(scene: ArcScene): string {
  const kind = scene.interaction?.kind;
  if (kind === "routing") return "Multiple choice";
  if (kind === "categorize" || kind === "spot") return "Puzzle";
  if (kind === "prioritisation" || kind === "handover") return "Hands-on";
  return "Written";
}

function summary(arc: AssessmentArc): string {
  const counts = new Map<string, number>();
  for (const s of arc.scenes) counts.set(typeOf(s), (counts.get(typeOf(s)) ?? 0) + 1);
  return [...counts].map(([type, n]) => `${n} ${type.toLowerCase()}`).join(" · ");
}

type TabProps = {
  bank: ArcBank;
  roles: Array<{ id: string; title: string; summary?: string }>;
  skillsForRole: (roleId: string) => string[];
  aiConfigured: boolean;
  token: () => Promise<string | null>;
  onChange: (next: ArcBank) => void;
  onAdvanced: (open: boolean) => void;
};

export function AssessmentTab({ onChange, onAdvanced, ...shared }: TabProps) {
  return (
    <>
      <SimpleAssessment {...shared} onPublished={onChange} />
      <details className="mt-6" onToggle={(e) => onAdvanced(e.currentTarget.open)}>
        <summary className="min-h-11 cursor-pointer text-[0.85rem] font-semibold text-slate-500">Advanced tools</summary>
        <AssessmentArcEditor {...shared} onChange={onChange} />
      </details>
    </>
  );
}

function SimpleAssessment({
  bank,
  roles,
  skillsForRole,
  aiConfigured,
  token,
  onPublished,
}: {
  bank: ArcBank;
  roles: Array<{ id: string; title: string; summary?: string }>;
  skillsForRole: (roleId: string) => string[];
  aiConfigured: boolean;
  token: () => Promise<string | null>;
  onPublished: (next: ArcBank) => void;
}) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [draft, setDraft] = useState<AssessmentArc | null>(null);
  const [busy, setBusy] = useState<"create" | "publish" | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const role = roles.find((r) => r.id === roleId) ?? null;
  const live = bank.arcs.find((a) => a.roleId === roleId) ?? null;
  const skills = roleId ? skillsForRole(roleId) : [];

  useEffect(() => {
    if (busy !== "create") return;
    const started = Date.now();
    const id = setInterval(() => setSeconds(Math.round((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [busy]);

  async function create() {
    if (!role) return;
    setBusy("create");
    setSeconds(0);
    setMessage(null);
    setDraft(null);
    const t = await token();
    if (!t) {
      setBusy(null);
      setMessage({ tone: "error", text: "Your session expired. Reload the page and sign in again." });
      return;
    }
    const result = await adminGenerateArc(t, { roleId: role.id, roleTitle: role.title, roleSummary: role.summary, skills, want: POOL, teams: 1 });
    setBusy(null);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.reason });
      return;
    }
    if (result.arc.scenes.length < SITTING) {
      setMessage({ tone: "error", text: `Only ${result.arc.scenes.length} questions came back — a sitting needs ${SITTING}. Click Create questions again.` });
      return;
    }
    setDraft(result.arc);
  }

  async function publish() {
    if (!draft) return;
    setBusy("publish");
    setMessage(null);
    const t = await token();
    if (!t) {
      setBusy(null);
      setMessage({ tone: "error", text: "Your session expired. Reload the page and sign in again." });
      return;
    }
    const next: ArcBank = { arcs: [draft, ...bank.arcs.filter((a) => a.roleId !== draft.roleId)] };
    const saved = await adminSaveDraftDetailed(t, "assessment_arc", next);
    if (!saved.ok) {
      setBusy(null);
      setMessage({ tone: "error", text: `Could not save: ${saved.reason}` });
      return;
    }
    try {
      await studioRequest("/content/assessment_arc/publish", {});
    } catch (e) {
      setBusy(null);
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Publishing was blocked." });
      return;
    }
    setBusy(null);
    onPublished(next);
    setDraft(null);
    setMessage({ tone: "ok", text: `Published. New ${draft.roleTitle} assessments now use these questions.` });
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-surface p-5">
      <h2 className="text-lg font-semibold text-slate-900">Assessment questions</h2>
      <p className="mt-1 text-[0.88rem] text-slate-600">
        Each student answers {SITTING} short questions: a multiple choice, a puzzle, a hands-on task and a written answer, plus one more.
      </p>

      <label className="mt-4 block text-[0.8rem] font-semibold text-slate-700">
        Role
        <select
          value={roleId}
          disabled={busy !== null}
          onChange={(e) => { setRoleId(e.target.value); setDraft(null); setMessage(null); }}
          className="mt-1 block min-h-11 w-full max-w-sm rounded-lg border border-slate-300 bg-surface px-2.5 text-[0.9rem]"
        >
          {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </label>
      <p className="mt-2 text-[0.8rem] text-slate-500">
        {live ? `Live now: ${live.scenes.length} questions (${summary(live)})` : "No questions live for this role yet."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy !== null || !aiConfigured || skills.length === 0}
          onClick={() => void create()}
          className="min-h-11 rounded-lg bg-brand-violet px-5 text-[0.9rem] font-bold text-white hover:bg-brand-violet-deep disabled:opacity-40"
        >
          {busy === "create" ? `Creating… ${seconds}s` : "Create questions"}
        </button>
        {busy === "create" && <span className="text-[0.8rem] text-slate-500">Takes about two minutes. Keep this tab open.</span>}
        {!aiConfigured && <span className="text-[0.8rem] text-slate-500">No AI key is configured on the server.</span>}
        {aiConfigured && skills.length === 0 && <span className="text-[0.8rem] text-slate-500">Give this role its skills first (Roles tab).</span>}
      </div>

      {message && (
        <p role="status" className={`mt-4 rounded-lg px-3.5 py-2.5 text-[0.85rem] ${message.tone === "ok" ? "bg-teal-50 text-teal-900" : "bg-amber-50 text-amber-900"}`}>
          {message.text}
        </p>
      )}

      {draft && (
        <div className="mt-5">
          <p className="text-[0.85rem] font-semibold text-slate-800">{draft.scenes.length} new questions — {summary(draft)}. Students see nothing until you publish.</p>
          <ol className="mt-3 space-y-2">
            {draft.scenes.map((s) => (
              <li key={s.id} className="rounded-lg border border-slate-200 p-3">
                <span className="text-[0.7rem] font-bold uppercase tracking-wide text-violet-700">{typeOf(s)}</span>
                <p className="mt-0.5 text-[0.9rem] font-semibold text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-[0.82rem] text-slate-600">{assessmentQuestionCards(s.brief).question}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void publish()}
              className="min-h-11 rounded-lg bg-brand-violet px-5 text-[0.9rem] font-bold text-white hover:bg-brand-violet-deep disabled:opacity-40"
            >
              {busy === "publish" ? "Publishing…" : "Publish these questions"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => { setDraft(null); setMessage(null); }}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-[0.9rem] font-semibold text-slate-700"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
