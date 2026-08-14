"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminDiscardDraft,
  adminImportCatalogue,
  adminPublish,
  adminReviewSkillModel,
  adminRoleTemplate,
  adminSaveDraft,
  adminSuggestSkills,
  type AdminContent,
  type CatalogueImportResult,
  type SkillModel,
  type SkillModelReview,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SkillModelEditor } from "./skill-model-editor";
import { QuestionBankEditor, type QuestionBank } from "./question-bank";
import { Collapsible } from "@/components/collapsible";

// The admin console: edit the Discovery questions and the role catalogue, then
// publish. Editing writes a draft — students keep seeing the published version
// until someone presses Publish.

type Choice = {
  id: string;
  prompt: string;
  a: { label: string; weights: Record<string, number> };
  b: { label: string; weights: Record<string, number> };
};
type Scenario = {
  id: string;
  situation: string;
  options: Array<{ id: string; label: string; weights: Record<string, number> }>;
};
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
  workContext: { environment: string; hours: string; pace: string; team: string };
  payMonthly: { min: number; max: number };
  payNote: string;
  growth: Array<{ title: string; when: string; pay: { min: number; max: number } }>;
  hardTruths: string[];
  suitsYouIf: string[];
  voices: Array<{ name: string; title: string; journey: string; quote: string }>;
  voicesIllustrative: boolean;
};
type RoleSummary = { id: string; title: string; world: string; summary: string };

const DIMENSIONS = [
  "people_service",
  "structured_ops",
  "commercial_drive",
  "fast_execution",
  "analytical",
  "communication",
] as const;

const DIMENSION_LABEL: Record<string, string> = {
  people_service: "People",
  structured_ops: "Process",
  commercial_drive: "Commercial",
  fast_execution: "Pace",
  analytical: "Analytical",
  communication: "Comms",
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

function Weights({
  weights,
  onChange,
}: {
  weights: Record<string, number>;
  onChange: (w: Record<string, number>) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {DIMENSIONS.map((dim) => (
        <label key={dim} className="flex items-center gap-1.5">
          <span className="text-[0.68rem] text-slate-500">{DIMENSION_LABEL[dim]}</span>
          <input
            type="number"
            min={0}
            max={3}
            value={weights[dim] ?? 0}
            onChange={(e) =>
              onChange({ ...weights, [dim]: Number(e.target.value) || 0 })
            }
            className="w-12 rounded-md border border-slate-300 bg-surface px-1.5 py-0.5 text-center text-[0.78rem]"
          />
        </label>
      ))}
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
            <span aria-hidden className="ml-1.5 inline-flex gap-[2px] align-middle">
              {[1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={`h-2.5 w-[3px] rounded-full ${
                    step <= level
                      ? level === 3
                        ? "bg-white"
                        : "bg-brand-violet"
                      : level === 3
                        ? "bg-white/35"
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
                onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))),
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
  openToEveryone,
  aiConfigured,
  discovery,
  roles,
  skillModel,
  questionBank,
}: {
  openToEveryone: boolean;
  aiConfigured: boolean;
  discovery: AdminContent | null;
  roles: AdminContent | null;
  skillModel: AdminContent | null;
  questionBank: AdminContent | null;
}) {
  // Roles first, then the skills they need, then the questions that measure
  // them — the order the work is actually done in.
  const [tab, setTab] = useState<"roles" | "skills" | "questions" | "legacy">(
    "roles",
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const startingDiscovery = (discovery?.draft?.data ??
    discovery?.published?.data ??
    discovery?.builtIn ??
    {}) as { choices?: Choice[]; scenarios?: Scenario[] };
  const startingRoles = (roles?.draft?.data ??
    roles?.published?.data ??
    roles?.builtIn ??
    {}) as { roles?: RoleSummary[]; details?: RoleDetail[] };

  const [choices, setChoices] = useState<Choice[]>(startingDiscovery.choices ?? []);
  const [scenarios, setScenarios] = useState<Scenario[]>(
    startingDiscovery.scenarios ?? [],
  );
  const [roleSummaries, setRoleSummaries] = useState<RoleSummary[]>(
    startingRoles.roles ?? [],
  );
  const [details, setDetails] = useState<RoleDetail[]>(startingRoles.details ?? []);
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
  const startingBank = (questionBank?.draft?.data ??
    questionBank?.published?.data ?? { questions: [] }) as QuestionBank;
  const [bank, setBank] = useState<QuestionBank>({
    questions: startingBank.questions ?? [],
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

  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<CatalogueImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState({
    discovery: Boolean(discovery?.draft),
    roles: Boolean(roles?.draft),
    skills: Boolean(skillModel?.draft),
    questions: Boolean(questionBank?.draft),
  });

  async function token() {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? null;
  }

  type Kind =
    | "discovery_content"
    | "role_catalogue"
    | "skill_model"
    | "question_bank";
  const slotFor = (kind: Kind) =>
    kind === "discovery_content"
      ? "discovery"
      : kind === "role_catalogue"
        ? "roles"
        : kind === "skill_model"
          ? "skills"
          : "questions";

  async function save(kind: Kind) {
    setBusy(true);
    setStatus(null);
    const t = await token();
    if (!t) {
      setBusy(false);
      setStatus("Your session expired. Reload the page and sign in again.");
      return;
    }
    const data =
      kind === "discovery_content"
        ? { worlds: (discovery?.published?.data as { worlds?: unknown })?.worlds, choices, scenarios }
        : kind === "role_catalogue"
          ? { roles: roleSummaries, details }
          : kind === "skill_model"
            ? model
            : bank;
    const saved = await adminSaveDraft(t, kind, data);
    // Skill requirements are edited on the role card but belong to the skill
    // model, so saving roles saves both.
    const savedModel =
      kind === "role_catalogue" && model.skills.length > 0
        ? await adminSaveDraft(t, "skill_model", model)
        : null;
    setBusy(false);
    setStatus(
      !saved
        ? "Could not save the draft. Nothing was changed."
        : kind === "role_catalogue" && model.skills.length > 0 && !savedModel
          ? "Roles saved, but the skills for them could not be saved. Try again."
          : "Draft saved. Students still see the published version.",
    );
    if (saved) {
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
    const published = await adminPublish(t, kind);
    if (kind === "role_catalogue" && hasDraft.skills) {
      await adminPublish(t, "skill_model");
    }
    setBusy(false);
    setStatus(published ? null : "Nothing to publish — save a draft first.");
    if (published) {
      setHasDraft((h) => ({ ...h, [slotFor(kind)]: false }));
    }
  }

  // Adding one role by hand. The id is derived from the title so an uploaded
  // file with the same title updates this role rather than duplicating it.
  function addRole(title: string) {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    setRoleSummaries((rs) => [
      { id, title, world: "people", summary: "" },
      ...rs,
    ]);
    setDetails((ds) => [
      blankDetail(id),
      ...ds,
    ]);
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
    const id = existing?.id ?? `skill_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    setModel((m) => ({
      ...m,
      skills: existing ? m.skills : [...m.skills, { id, name, description: "" }],
      skillRole: { ...m.skillRole, [id]: { ...(m.skillRole[id] ?? {}), [roleId]: 3 } },
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
          .map((s) => ({ skillId: s.id, level: model.skillRole[s.id]?.[r.id] ?? 0 }))
          .filter((x): x is { skillId: string; level: 1 | 2 | 3 } => x.level > 0),
      }));

    const result = await adminSuggestSkills(t, {
      roles: needs.map((r) => ({ id: r.id, title: r.title, summary: r.summary })),
      catalogue: model.skills,
      examples,
    });
    setSuggesting(false);
    if (!result) {
      setStatus("Could not get suggestions. Set the skills by hand, or try again.");
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

  const kind: Kind =
    tab === "roles"
      ? "role_catalogue"
      : tab === "skills"
        ? "skill_model"
        : tab === "questions"
          ? "question_bank"
          : "discovery_content";
  const doc =
    tab === "roles" ? roles : tab === "skills" ? skillModel : tab === "questions" ? questionBank : discovery;
  const draftPending =
    tab === "roles"
      ? hasDraft.roles
      : tab === "skills"
        ? hasDraft.skills
        : tab === "questions"
          ? hasDraft.questions
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
            Saved as a draft; nothing reaches students until you publish.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Published v{doc?.published?.version ?? "—"}
          {doc?.published?.publishedAt
            ? ` · ${new Date(doc.published.publishedAt).toLocaleDateString()}`
            : ""}
        </p>
      </header>

      {openToEveryone && (
        <p className="mt-3 rounded-xl border border-amber-400 bg-amber-50 px-4 py-2.5 text-[0.8rem] text-amber-800">
          <strong className="font-semibold">Pilot setting:</strong> this console is
          open to every signed-in user so the team can use it before roles exist.
          Set <code className="font-mono">ADMIN_EMAILS</code> on the API and it
          becomes admin-only immediately — the entry point disappears for everyone
          else, and the API refuses their requests.
        </p>
      )}

      <div role="tablist" aria-label="Content" className="mt-5 flex gap-2 border-b border-slate-200">
        {[
          { id: "roles" as const, label: "Roles" },
          { id: "skills" as const, label: "Skills & mappings" },
          { id: "questions" as const, label: "Discovery questions" },
          { id: "legacy" as const, label: "Role Assessment" },
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

      {tab === "legacy" && (
        <section className="mt-5 grid gap-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Paired work choices ({choices.length})
          </h2>
          {choices.map((choice, i) => (
            <article
              key={choice.id}
              className="rounded-xl border border-slate-200 bg-surface p-4"
            >
              <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                {choice.id}
              </p>
              <Field
                label="Question"
                value={choice.prompt}
                onChange={(v) =>
                  setChoices((cs) => cs.map((c, j) => (j === i ? { ...c, prompt: v } : c)))
                }
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(["a", "b"] as const).map((side) => (
                  <div key={side} className="rounded-lg bg-slate-50 p-3">
                    <Field
                      label={`Option ${side.toUpperCase()}`}
                      value={choice[side].label}
                      multiline
                      onChange={(v) =>
                        setChoices((cs) =>
                          cs.map((c, j) =>
                            j === i ? { ...c, [side]: { ...c[side], label: v } } : c,
                          ),
                        )
                      }
                    />
                    <Weights
                      weights={choice[side].weights}
                      onChange={(w) =>
                        setChoices((cs) =>
                          cs.map((c, j) =>
                            j === i ? { ...c, [side]: { ...c[side], weights: w } } : c,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </article>
          ))}

          <h2 className="mt-2 text-sm font-semibold text-slate-900">
            Micro-scenarios ({scenarios.length})
          </h2>
          {scenarios.map((scenario, i) => (
            <article
              key={scenario.id}
              className="rounded-xl border border-slate-200 bg-surface p-4"
            >
              <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                {scenario.id}
              </p>
              <Field
                label="Situation"
                value={scenario.situation}
                multiline
                onChange={(v) =>
                  setScenarios((ss) =>
                    ss.map((s, j) => (j === i ? { ...s, situation: v } : s)),
                  )
                }
              />
              <div className="mt-3 grid gap-2">
                {scenario.options.map((option, oi) => (
                  <div key={option.id} className="rounded-lg bg-slate-50 p-3">
                    <Field
                      label={`Option ${option.id.toUpperCase()}`}
                      value={option.label}
                      onChange={(v) =>
                        setScenarios((ss) =>
                          ss.map((s, j) =>
                            j === i
                              ? {
                                  ...s,
                                  options: s.options.map((o, k) =>
                                    k === oi ? { ...o, label: v } : o,
                                  ),
                                }
                              : s,
                          ),
                        )
                      }
                    />
                    <Weights
                      weights={option.weights}
                      onChange={(w) =>
                        setScenarios((ss) =>
                          ss.map((s, j) =>
                            j === i
                              ? {
                                  ...s,
                                  options: s.options.map((o, k) =>
                                    k === oi ? { ...o, weights: w } : o,
                                  ),
                                }
                              : s,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === "roles" && (
        <section className="mt-5 grid gap-4">
          {(() => {
            const found = (review?.reviews ?? []).filter((r) => r.scope === "role");
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
                <div className="mt-3 rounded-lg bg-teal-50 px-3.5 py-2.5 text-[0.82rem] text-teal-900">
                  <p className="font-semibold">
                    {imported.added.length} added, {imported.updated.length}{" "}
                    updated — saved as a draft.
                  </p>
                  {imported.added.length > 0 && (
                    <p className="mt-1">Added: {imported.added.join(", ")}</p>
                  )}
                  {imported.updated.length > 0 && (
                    <p className="mt-1">Updated: {imported.updated.join(", ")}</p>
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
                <div className="grid gap-3 sm:grid-cols-2">
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
                        disabled={newSkillFor !== role.id || !newSkillName.trim()}
                        onClick={() => addSkillToRole(role.id, newSkillName.trim())}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[0.78rem] font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <SkillNeeds
                    skills={model.skills}
                    levelOf={(skillId) => model.skillRole[skillId]?.[role.id] ?? 0}
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
                          ds.map((d) => (d.roleId === role.id ? { ...d, pitch: v } : d)),
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
                      blank={() => ({ title: "", when: "", pay: { min: 0, max: 0 } })}
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
                              set({ pay: { ...row.pay, min: Number(e.target.value) || 0 } })
                            }
                            placeholder="Pay from"
                            aria-label="Pay from"
                            className={SMALL_INPUT}
                          />
                          <input
                            value={String(row.pay.max)}
                            onChange={(e) =>
                              set({ pay: { ...row.pay, max: Number(e.target.value) || 0 } })
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
                            onChange={(e) => set({ share: Number(e.target.value) || 0 })}
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
                      blank={() => ({ name: "", title: "", journey: "", quote: "" })}
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
                          patchDetail(role.id, { voicesIllustrative: e.target.checked })
                        }
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>
                        These testimonials are illustrative composites, not real
                        named people. Students are told so. Untick only when every
                        quote here is real and consented.
                      </span>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Where the work happens"
                        value={detail.workContext.environment}
                        onChange={(v) =>
                          patchDetail(role.id, {
                            workContext: { ...detail.workContext, environment: v },
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
                  </div>
                )}
              </Collapsible>
            );
          })}
        </section>
      )}

      {tab === "questions" && (
        <QuestionBankEditor
          bank={bank}
          model={model}
          aiConfigured={aiConfigured}
          onChange={setBank}
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
        <button
          type="button"
          disabled={busy}
          onClick={() => void save(kind)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
        >
          {busy ? "Working…" : "Save draft"}
        </button>
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
