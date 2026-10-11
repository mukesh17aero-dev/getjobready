// The scenario catalogue, exactly as the backend publishes it — this
// component never invents a scenario, a persona or a rubric of its own.

import type { Difficulty, RoleplayScenario } from "./roleplay-api";

export function RoleplayScenarioPicker({
  scenarios,
  selected,
  difficulty,
  onSelect,
  onDifficulty,
}: {
  scenarios: RoleplayScenario[];
  selected: string | null;
  difficulty: Difficulty;
  onSelect: (id: string) => void;
  onDifficulty: (d: Difficulty) => void;
}) {
  const chosen = scenarios.find((s) => s.id === selected) ?? null;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {scenarios.map((scenario) => {
          const active = scenario.id === selected;
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onSelect(scenario.id)}
              aria-pressed={active}
              className={`min-h-11 rounded-2xl border p-4 text-left transition-colors ${
                active
                  ? "border-brand-violet bg-violet-50"
                  : "border-slate-200 bg-surface hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-bold text-brand-ink">{scenario.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{scenario.description}</p>
              <p className="mt-2 text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">
                Plays {scenario.personaName}
              </p>
            </button>
          );
        })}
      </div>

      {chosen ? (
        <div className="rounded-2xl border border-slate-200 bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">The situation</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{chosen.brief}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            What we&apos;ll look for
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {chosen.rubric.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-slate-200 px-2 py-1 text-[0.75rem] font-semibold text-slate-600"
              >
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Difficulty</p>
        <div className="mt-2 flex gap-2">
          {(["standard", "challenging"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDifficulty(d)}
              aria-pressed={difficulty === d}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${
                difficulty === d
                  ? "border-brand-teal-deep bg-teal-50 text-teal-800"
                  : "border-slate-300 text-slate-600 hover:border-slate-400"
              }`}
            >
              {d === "standard" ? "Standard" : "Challenging"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
