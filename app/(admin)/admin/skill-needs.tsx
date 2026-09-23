"use client";

// How strongly a role needs each skill.

const NEED_STYLE = [
  "border-slate-200 bg-surface text-slate-400 hover:border-slate-300",
  "border-violet-200 bg-violet-50 text-violet-800",
  "border-violet-300 bg-violet-100 text-violet-900",
  "border-brand-violet bg-brand-violet text-white",
] as const;
const NEED_WORD = ["Not needed", "Weak", "Medium", "Strong"] as const;

// What a role needs, chosen from the skills defined on the Skills page — the
// list is never free text, so a requirement always refers to a real skill.
export function SkillNeeds({
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
            <span
              aria-hidden
              className="ml-1.5 inline-flex gap-[2px] align-middle"
            >
              {[1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={`h-2.5 w-[3px] rounded-full ${
                    step <= level
                      ? level === 3
                        ? "bg-surface"
                        : "bg-brand-violet"
                      : level === 3
                        ? "bg-surface/35"
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
