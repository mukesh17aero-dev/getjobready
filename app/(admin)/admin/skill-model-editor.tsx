"use client";

import type { SkillModel, SkillModelReview } from "@/lib/api";
import { HelpButton } from "@/components/ui/help-sheet";

// The skills page is a catalogue and nothing more: the words the product uses
// to describe a person. Which skills a role needs is set on that role's card,
// where the decision actually belongs.

const LEVELS = [0, 1, 2, 3] as const;
const LEVEL_WORD = ["Not used", "Weak", "Medium", "Strong"] as const;

const CHIP_STYLE = [
  "border-slate-200 bg-surface text-slate-400 hover:border-slate-300",
  "border-violet-200 bg-violet-50 text-violet-800",
  "border-violet-300 bg-violet-100 text-violet-900",
  "border-brand-violet bg-brand-violet text-white",
] as const;

function Chip({
  label,
  level,
  onCycle,
}: {
  label: string;
  level: number;
  onCycle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`${label}: ${LEVEL_WORD[level] ?? "Not used"}. Click for the next level.`}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
        CHIP_STYLE[level] ?? CHIP_STYLE[0]
      }`}
    >
      {label}
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
}

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

export function SkillModelEditor({
  model,
  review,
  checking,
  roleCount,
  onChange,
}: {
  model: SkillModel;
  review: SkillModelReview | null;
  checking: boolean;
  roleCount: number;
  onChange: (next: SkillModel) => void;
}) {
  const mine = (review?.reviews ?? []).filter((r) => r.scope !== "role");
  const signals = review?.signals ?? [];

  const setSkill = (
    id: string,
    patch: Partial<{ name: string; description: string }>,
  ) =>
    onChange({
      ...model,
      skills: model.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const removeSkill = (id: string) => {
    const skillRole = { ...model.skillRole };
    const traitSkill = { ...model.traitSkill };
    delete skillRole[id];
    delete traitSkill[id];
    onChange({
      ...model,
      skills: model.skills.filter((s) => s.id !== id),
      skillRole,
      traitSkill,
    });
  };

  const addSkill = () => {
    const id = `skill_${Date.now().toString(36)}`;
    onChange({
      ...model,
      skills: [...model.skills, { id, name: "New skill", description: "" }],
      skillRole: { ...model.skillRole, [id]: {} },
      traitSkill: { ...model.traitSkill, [id]: {} },
    });
  };

  const cycleSignal = (signalId: string, skillId: string) => {
    const current = model.signalSkill?.[signalId]?.[skillId] ?? 0;
    const next = LEVELS[(LEVELS.indexOf(current as 0) + 1) % LEVELS.length] ?? 0;
    onChange({
      ...model,
      signalSkill: {
        ...model.signalSkill,
        [signalId]: { ...(model.signalSkill?.[signalId] ?? {}), [skillId]: next },
      },
    });
  };

  // How many roles ask for this skill — one nothing asks for is dead weight.
  const usedBy = (skillId: string) =>
    Object.values(model.skillRole[skillId] ?? {}).filter((level) => level > 0)
      .length;

  return (
    <section className="mt-5 grid gap-5">
      <p className="text-[0.85rem] leading-snug text-slate-600">
        Skills are the words the product uses to describe a person. Assign them
        to a role on the <strong className="font-semibold">Roles</strong> tab.
      </p>

      {mine.map((r) => (
        <p
          key={r.message}
          className={`rounded-xl border px-4 py-3 text-[0.82rem] leading-snug ${
            r.level === "problem"
              ? "border-rose-200 bg-rose-50/50 text-rose-800"
              : "border-amber-200 bg-amber-50/50 text-amber-900"
          }`}
        >
          {r.message}
        </p>
      ))}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Skills ({model.skills.length})
          </h2>
          <button
            type="button"
            onClick={addSkill}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-[0.8rem] font-semibold text-slate-700 transition-colors hover:border-slate-400"
          >
            Add a skill
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-surface">
          {model.skills.map((skill) => {
            const roles = usedBy(skill.id);
            return (
              <div
                key={skill.id}
                className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5 first:border-t-0"
              >
                <input
                  value={skill.name}
                  onChange={(e) => setSkill(skill.id, { name: e.target.value })}
                  aria-label="Skill name"
                  className="w-44 shrink-0 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[0.88rem] font-semibold text-slate-900 outline-none hover:border-slate-200 focus:border-brand-violet"
                />
                <input
                  value={skill.description}
                  onChange={(e) =>
                    setSkill(skill.id, { description: e.target.value })
                  }
                  aria-label="How a student would describe it"
                  placeholder="How a student would describe it"
                  className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[0.82rem] text-slate-500 outline-none hover:border-slate-200 focus:border-brand-violet"
                />
                <span
                  className={`hidden shrink-0 text-[0.75rem] tabular-nums sm:block ${
                    roles === 0 ? "text-amber-700" : "text-slate-400"
                  }`}
                  title={
                    roles === 0
                      ? "No role asks for this skill"
                      : `Used by ${roles} of ${roleCount} roles`
                  }
                >
                  {roles === 0
                    ? "no roles need this"
                    : `${roles} of ${roleCount} roles`}
                </span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill.id)}
                  aria-label={`Remove ${skill.name}`}
                  title={`Remove ${skill.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </div>
        {checking && (
          <p className="mt-1.5 text-[0.75rem] text-slate-400">Checking…</p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Signals — how someone answered
        </h2>
        <p className="mt-1 text-[0.8rem] leading-snug text-slate-500">
          Not what they answered. Which skills, if any, each one counts towards.
        </p>

        <div className="mt-3 rounded-xl border border-slate-200 bg-surface p-4">
          <div className="flex items-center gap-1.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
              How much behaviour may move a score
            </p>
            <HelpButton
              title="How much behaviour may move a score"
              label="How this setting works"
            >
              <div className="grid gap-3 text-[0.85rem] leading-relaxed text-slate-700">
                <p>
                  A recommendation is built from what someone{" "}
                  <strong className="font-semibold">chose</strong>. This setting
                  decides how far the way they answered may adjust that.
                </p>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">Off</p>
                  <p className="mt-0.5">
                    Behaviour is ignored when scoring. It still lowers confidence
                    — a person who changed their mind twice is marked less
                    certain — but it never adds to a skill.
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">Slight</p>
                  <p className="mt-0.5">
                    Behaviour may account for at most a tenth of someone&apos;s
                    total skill points.
                  </p>
                  <p className="mt-2 font-semibold text-slate-900">Moderate</p>
                  <p className="mt-0.5">
                    At most a quarter. Use this only once you have seen real
                    results and believe the readings hold.
                  </p>
                </div>

                <p className="font-semibold text-slate-900">An example</p>
                <p>
                  Someone answers every question quickly without revising. That
                  is read as Composure. On{" "}
                  <strong className="font-semibold">Slight</strong>, it can lift
                  Composure enough to break a tie between two close roles — but
                  not enough to put a role top that their answers did not point
                  at.
                </p>

                <p className="font-semibold text-slate-900">Why there is a cap</p>
                <p>
                  Behaviour is noisy. A student on a slow phone looks hesitant; a
                  careful reader looks slow. And every match has to be
                  explainable — &ldquo;you clicked quickly&rdquo; is not a
                  defensible reason to recommend someone into a job. The cap
                  keeps behaviour as a tie-breaker, never the reason.
                </p>

                <p className="font-semibold text-slate-900">If you are unsure</p>
                <p>
                  Leave it on <strong className="font-semibold">Slight</strong>.
                  It is the default and the safe setting.
                </p>

                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[0.82rem] text-amber-900">
                  Not in effect yet. The setting and the readings are saved and
                  published, but scoring does not use them until signal capture
                  is switched on in Discovery.
                </p>
              </div>
            </HelpButton>
          </div>
          <div className="mt-1.5 flex rounded-lg border border-slate-200 p-0.5 sm:max-w-sm">
            {(["Off", "Slight", "Moderate"] as const).map((label, level) => (
              <button
                key={label}
                type="button"
                aria-pressed={model.signalInfluence === level}
                onClick={() =>
                  onChange({ ...model, signalInfluence: level as 0 | 1 | 2 })
                }
                className={`flex-1 rounded-md px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                  model.signalInfluence === level
                    ? "bg-slate-900 text-surface"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {(
          [
            { source: "discovery" as const, label: "From the Discovery run" },
            { source: "product" as const, label: "From everything they do in the product" },
          ]
        ).map((group) => {
          const rows = signals.filter((s) => s.source === group.source);
          if (rows.length === 0) return null;
          return (
            <div key={group.source} className="mt-3">
              <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {group.label}
              </p>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
                {rows.map((signal) => (
            <div
              key={signal.id}
              className="border-t border-slate-100 px-4 py-3 first:border-t-0"
            >
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-[0.85rem] font-semibold text-slate-900">
                  {signal.label}
                </p>
                {!signal.usedInScoring && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-slate-500">
                    recorded only
                  </span>
                )}
              </div>
              <p className="text-[0.8rem] text-slate-500">{signal.meaning}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {model.skills.map((skill) => (
                  <Chip
                    key={skill.id}
                    label={skill.name}
                    level={model.signalSkill?.[signal.id]?.[skill.id] ?? 0}
                    onCycle={() => cycleSignal(signal.id, skill.id)}
                  />
                ))}
              </div>
            </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
