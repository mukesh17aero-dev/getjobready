import type { Metadata } from "next";
import { FormBanner } from "@/components/form-banner";
import { UserTable, type UserRow } from "@/components/user-table";
import {
  ACCOUNT_LIST_LIMIT,
  canChangeRole,
  getCurrentUser,
  listAccounts,
  type AccountSummary,
  type AuthenticatedUser,
} from "@/modules/identity";
import { changeRoleAction } from "./actions";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; ok?: string }>;
}) {
  const { q, error, ok } = await searchParams;

  // The layout has already established that this is an admin. Reading the user
  // again is what lets us mark their own row as unchangeable.
  const actor = await getCurrentUser();
  const result = await listAccounts({ query: q });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Users
      </h1>
      <p className="mt-2 text-slate-600">
        Everyone who has signed in at least once, plus anyone invited but not yet
        arrived. Change a role and it takes effect on their next page load.
      </p>

      <form method="get" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, email or username"
          aria-label="Search users"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {error ? <FormBanner tone="error">{error}</FormBanner> : null}
        {ok ? <FormBanner tone="success">{ok}</FormBanner> : null}

        {!result.ok ? (
          <FormBanner tone="error">{result.error}</FormBanner>
        ) : (
          <>
            {result.data.truncated ? (
              <FormBanner tone="info">
                Showing the {ACCOUNT_LIST_LIMIT} most recent accounts. Search to
                narrow the list — there are more than are shown here.
              </FormBanner>
            ) : null}

            <UserTable
              rows={toRows(result.data.accounts, actor)}
              changeRoleAction={changeRoleAction.bind(null, q ?? "")}
            />
          </>
        )}
      </div>
    </main>
  );
}

function toRows(
  accounts: AccountSummary[],
  actor: AuthenticatedUser | null
): UserRow[] {
  // `created_by` is an id. Resolving it against the accounts already fetched
  // turns it into a name without a second query — and an id that is not in the
  // list is simply reported as unknown rather than shown raw.
  const byId = new Map(accounts.map((account) => [account.id, account]));

  return accounts.map((account) => {
    const changedBy = describeActor(account, byId);

    if (!actor) {
      return { account, canChange: false, lockedReason: "Not permitted", changedBy };
    }

    // The rule comes from the module. The page decides what to render with the
    // answer; it never works the answer out for itself.
    const decision = canChangeRole({
      actorId: actor.id,
      actorRole: actor.role,
      targetId: account.id,
      targetIsBootstrapAdmin: account.isBootstrapAdmin,
    });

    return decision.ok
      ? { account, canChange: true, changedBy }
      : { account, canChange: false, lockedReason: decision.reason, changedBy };
  });
}

function describeActor(
  account: AccountSummary,
  byId: Map<string, AccountSummary>
): string {
  if (!account.createdBy) return "—";
  if (account.createdBy === account.id) return "Signed up themselves";

  const actor = byId.get(account.createdBy);
  return actor?.username ?? actor?.email ?? "An account no longer listed";
}
