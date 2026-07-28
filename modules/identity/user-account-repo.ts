// The only code in the platform that reads or writes `user_account`.
// Everything else asks this module a question and gets an AuthenticatedUser.
//
// The table is a Type 2 slowly-changing dimension: one row per *version* of a
// person, exactly one of which is active. Two consequences shape everything
// here:
//
//   1. Every read filters `is_active` — history rows are real rows and would
//      otherwise appear as duplicates of the same person.
//   2. Every write goes through one Postgres function, `set_user_account_state`,
//      which closes the old row and opens the new one in a single transaction.
//      Done as two round trips from here, a failure in between would leave a
//      person with no active row at all — and the next request would recreate
//      them as a student. An admin could be demoted by a dropped connection.
import { supabaseAdmin } from "@/lib/db/supabase-admin";
import { isUserRole, sanitiseSearchTerm } from "./roles";
import type { AccountSummary, AuthenticatedUser, UserRole } from "./types";

const COLUMNS =
  "account_id, user_id, email, username, full_name, role, is_bootstrap_admin";

const SUMMARY_COLUMNS = `${COLUMNS}, created_at, created_by, last_sign_in_at`;

// A pilot cohort is 30–50 people. This cap exists so a runaway query cannot
// render ten thousand rows; when it bites, the list says so rather than
// quietly showing a truncated view.
export const ACCOUNT_LIST_LIMIT = 200;

/**
 * These functions return `null` for both "no such row" and "the query failed",
 * because a caller deciding where to send someone cannot do anything useful
 * with the difference. But the *operator* very much can: a missing table and a
 * missing account produce identical behaviour on screen and completely
 * different fixes.
 *
 * So the cause is logged server-side. This is the Session 8 RLS incident in
 * miniature (see docs/PROJECT_CONTEXT.md) — a query that silently returned
 * nothing looked exactly like a student with no data.
 */
function logQueryFailure(
  operation: string,
  error: { message: string; code?: string } | null
): void {
  if (!error) return;
  console.error(
    `[identity] ${operation} failed: ${error.message}${
      error.code ? ` (${error.code})` : ""
    }`
  );
}

type UserAccountRow = {
  account_id: string;
  user_id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: string;
  is_bootstrap_admin: boolean;
};

type UserAccountSummaryRow = UserAccountRow & {
  created_at: string;
  created_by: string | null;
  last_sign_in_at: string | null;
};

function toUser(row: UserAccountRow): AuthenticatedUser {
  return {
    // `id` is the person, not the version. Everything outside this module
    // compares it against `auth.uid()`, so it must stay the auth user id.
    id: row.user_id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    // The check constraint makes an unknown role impossible, but if one ever
    // did appear the safe reading is the least privileged one. Never widen
    // access to recover from bad data.
    role: isUserRole(row.role) ? row.role : "student",
    isBootstrapAdmin: row.is_bootstrap_admin,
  };
}

function toSummary(row: UserAccountSummaryRow): AccountSummary {
  return {
    ...toUser(row),
    accountId: row.account_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    lastSignInAt: row.last_sign_in_at,
  };
}

export async function findById(userId: string): Promise<AuthenticatedUser | null> {
  const { data, error } = await supabaseAdmin
    .from("user_account")
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle<UserAccountRow>();

  logQueryFailure("findById", error);
  if (error || !data) return null;
  return toUser(data);
}

export async function findByEmail(
  email: string
): Promise<AuthenticatedUser | null> {
  const { data, error } = await supabaseAdmin
    .from("user_account")
    .select(COLUMNS)
    .ilike("email", email)
    .eq("is_active", true)
    .maybeSingle<UserAccountRow>();

  logQueryFailure("findByEmail", error);
  if (error || !data) return null;
  return toUser(data);
}

export async function findByUsername(
  username: string
): Promise<AuthenticatedUser | null> {
  const { data, error } = await supabaseAdmin
    .from("user_account")
    .select(COLUMNS)
    .ilike("username", username)
    .eq("is_active", true)
    .maybeSingle<UserAccountRow>();

  logQueryFailure("findByUsername", error);
  if (error || !data) return null;
  return toUser(data);
}

/**
 * Everyone who has ever signed in, newest first, optionally filtered.
 *
 * Active rows only — the history behind each person is in the same table and
 * would otherwise show up as several copies of them.
 */
export async function listAccounts(params: {
  query?: string;
}): Promise<{ accounts: AccountSummary[]; truncated: boolean } | null> {
  let request = supabaseAdmin
    .from("user_account")
    .select(SUMMARY_COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(ACCOUNT_LIST_LIMIT + 1);

  const term = params.query ? sanitiseSearchTerm(params.query) : "";
  if (term) {
    request = request.or(
      `email.ilike.%${term}%,full_name.ilike.%${term}%,username.ilike.%${term}%`
    );
  }

  const { data, error } = await request.returns<UserAccountSummaryRow[]>();

  logQueryFailure("listAccounts", error);
  if (error || !data) return null;

  // One row over the limit was fetched purely to detect truncation.
  const truncated = data.length > ACCOUNT_LIST_LIMIT;
  return {
    accounts: data.slice(0, ACCOUNT_LIST_LIMIT).map(toSummary),
    truncated,
  };
}

/**
 * The single write path: records the state this person should now be in.
 *
 * If nothing material has changed, the database returns the current row
 * untouched rather than adding a version — otherwise every re-assertion of the
 * same details during sign-in would bury the real changes in noise.
 *
 * `actorId` is who caused the change: an admin's id, or the person's own id
 * when they created their account themselves.
 */
export async function setAccountState(params: {
  userId: string;
  email: string;
  username: string | null;
  fullName: string | null;
  role: UserRole;
  isBootstrapAdmin: boolean;
  actorId: string | null;
}): Promise<AuthenticatedUser | null> {
  const { data, error } = await supabaseAdmin
    .rpc("set_user_account_state", {
      p_user_id: params.userId,
      p_email: params.email,
      p_username: params.username,
      p_full_name: params.fullName,
      p_role: params.role,
      p_is_bootstrap: params.isBootstrapAdmin,
      p_actor: params.actorId,
    })
    .returns<UserAccountRow>()
    .single();

  logQueryFailure("setAccountState", error);
  if (error || !data) return null;
  return toUser(data);
}

/**
 * Type 1 attribute: overwritten in place on the active row, deliberately
 * without creating a version. Versioning a sign-in timestamp would add a row
 * every time anyone logged in.
 */
export async function touchLastSignIn(userId: string): Promise<void> {
  // Best-effort: a failure here must never turn a successful sign-in into a
  // failed one.
  const { error } = await supabaseAdmin
    .from("user_account")
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_active", true);

  logQueryFailure("touchLastSignIn", error);
}
