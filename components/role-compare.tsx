"use client";

import { Dialog } from "@/components/dialog";
import { payRange } from "@/components/role-preview";
import type { RoleDetail } from "@/lib/api";
import { Check } from "@/components/icons";

// Side-by-side comparison of two or three roles across the facts people
// actually weigh up. Wide content scrolls inside its own container.
const ROWS: Array<{ label: string; render: (r: RoleDetail) => React.ReactNode }> = [
  { label: "Sector", render: (r) => r.sector },
  { label: "In one line", render: (r) => r.pitch },
  { label: "Pay to start", render: (r) => payRange(r.payMonthly) },
  {
    label: "In 3–4 years",
    render: (r) =>
      r.growth[1] ? `${r.growth[1].title} · ${payRange(r.growth[1].pay)}` : "—",
  },
  { label: "Hours", render: (r) => r.workContext.hours },
  { label: "Environment", render: (r) => r.workContext.environment },
  { label: "Pace", render: (r) => r.workContext.pace },
  {
    label: "Top skills",
    render: (r) => (
      <ul className="grid gap-1">
        {r.skills.slice(0, 3).map((s) => (
          <li key={s.name}>· {s.name}</li>
        ))}
      </ul>
    ),
  },
  {
    label: "Hardest part",
    render: (r) => <span className="text-amber-900">{r.hardTruths[0]}</span>,
  },
];

export function RoleCompare({
  roles,
  titles,
  onClose,
  onChoose,
  chosenRoleId,
}: {
  roles: RoleDetail[];
  titles: Record<string, string>;
  onClose: () => void;
  onChoose?: (roleId: string) => void;
  chosenRoleId?: string | null;
}) {
  return (
    <Dialog
      title={`Comparing ${roles.length} roles`}
      subtitle="The facts people actually weigh up, side by side."
      onClose={onClose}
      wide
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[0.82rem]">
          <thead>
            <tr>
              <th className="w-32 border-b border-slate-200 pb-2 text-left text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                &nbsp;
              </th>
              {roles.map((role) => (
                <th
                  key={role.roleId}
                  className="border-b border-slate-200 px-3 pb-2 text-left align-bottom"
                >
                  <span className="block text-[0.95rem] font-semibold leading-tight text-slate-900">
                    {titles[role.roleId] ?? role.roleId}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="align-top">
                <th className="border-b border-slate-100 py-2.5 pr-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {row.label}
                </th>
                {roles.map((role) => (
                  <td
                    key={role.roleId}
                    className="border-b border-slate-100 px-3 py-2.5 text-slate-600"
                  >
                    {row.render(role)}
                  </td>
                ))}
              </tr>
            ))}
            {onChoose && (
              <tr>
                <td />
                {roles.map((role) => (
                  <td key={role.roleId} className="px-3 pt-3">
                    <button
                      type="button"
                      disabled={chosenRoleId === role.roleId}
                      onClick={() => onChoose(role.roleId)}
                      className={`w-full rounded-lg px-3 py-2 text-[0.8rem] font-bold text-white transition-colors ${
                        chosenRoleId === role.roleId
                          ? "bg-brand-teal"
                          : "bg-brand-violet hover:bg-brand-violet-deep"
                      }`}
                    >
                      {chosenRoleId === role.roleId ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check size={14} /> Selected
                    </span>
                  ) : "Choose this"}
                    </button>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[0.72rem] leading-snug text-slate-400">
        Pay bands are indicative pilot estimates for India.
      </p>
    </Dialog>
  );
}
