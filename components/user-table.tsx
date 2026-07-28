import type { AccountSummary, UserRole } from "@/modules/identity";

const ROLES: ReadonlyArray<{ value: UserRole; label: string }> = [
  { value: "student", label: "Student" },
  { value: "admin", label: "Admin" },
  { value: "employer", label: "Employer" },
];

const ROLE_BADGE: Record<UserRole, string> = {
  student: "bg-slate-100 text-slate-700",
  admin: "bg-indigo-100 text-indigo-800",
  employer: "bg-emerald-100 text-emerald-800",
};

/**
 * One row per account, with the role control for the rows this admin may
 * change.
 *
 * `canChange` and `lockedReason` are computed by the page using the identity
 * module's own rule, not re-derived here — a component that decided for itself
 * who may be promoted would be a second, silently diverging copy of the
 * platform's most important permission check.
 */
export type UserRow = {
  account: AccountSummary;
  canChange: boolean;
  lockedReason?: string;
  /** Who put this person in their current state, already resolved to a name. */
  changedBy: string;
};

export function UserTable({
  rows,
  changeRoleAction,
}: {
  rows: UserRow[];
  changeRoleAction: (formData: FormData) => Promise<void>;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
        No accounts match that search.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-medium">Person</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Set by</th>
            <th className="px-4 py-3 font-medium">Last signed in</th>
            <th className="px-4 py-3 font-medium">Change role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ account, canChange, lockedReason, changedBy }) => (
            <tr key={account.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 align-top">
                <span className="block font-medium text-slate-900">
                  {account.fullName ?? account.username ?? "—"}
                </span>
                <span className="block text-xs text-slate-500">{account.email}</span>
                {account.username ? (
                  <span className="block text-xs text-slate-400">
                    username: {account.username}
                  </span>
                ) : null}
              </td>

              <td className="px-4 py-3 align-top">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    ROLE_BADGE[account.role]
                  }`}
                >
                  {account.role}
                </span>
                {account.isBootstrapAdmin ? (
                  <span className="mt-1 block text-xs text-amber-700">
                    setup account
                  </span>
                ) : null}
              </td>

              <td className="px-4 py-3 align-top text-slate-600">
                <span className="block">{changedBy}</span>
                <span className="block text-xs text-slate-400">
                  {formatDate(account.createdAt)}
                </span>
              </td>

              <td className="px-4 py-3 align-top text-slate-600">
                {formatDate(account.lastSignInAt)}
              </td>

              <td className="px-4 py-3 align-top">
                {canChange ? (
                  <form action={changeRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={account.id} />
                    <select
                      name="role"
                      defaultValue={account.role}
                      aria-label={`Role for ${account.email}`}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-slate-500">{lockedReason}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  // Fixed locale and UTC: the table is server-rendered, and letting the server's
  // timezone decide would show a different date to different viewers of the
  // same row.
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
