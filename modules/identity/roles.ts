// Pure routing and access rules. No database, no Supabase, no React — so they
// can be tested exhaustively and read in one sitting. Every "where does this
// person go", "may this person open that" and "may this person change that
// role" answer in the platform comes from here, so there is exactly one place
// to look when the answer is wrong.
import { USER_ROLES, type UserRole } from "./types";

const HOME_ROUTE: Record<UserRole, string> = {
  student: "/dashboard",
  admin: "/admin",
  employer: "/portal",
};

/**
 * Route prefixes that belong to exactly one role. A signed-in person who opens
 * an area that is not theirs is sent to their own home — not to an error page,
 * because from their point of view they simply typed the wrong address.
 */
const ROLE_AREAS: ReadonlyArray<{ prefix: string; role: UserRole }> = [
  { prefix: "/dashboard", role: "student" },
  { prefix: "/admin", role: "admin" },
  { prefix: "/portal", role: "employer" },
];

export function homeRouteForRole(role: UserRole): string {
  return HOME_ROUTE[role];
}

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" && (USER_ROLES as readonly string[]).includes(value)
  );
}

/**
 * Which role owns this path, or null if the path is not role-restricted.
 */
export function roleAreaFor(pathname: string): UserRole | null {
  const match = ROLE_AREAS.find(
    (area) => pathname === area.prefix || pathname.startsWith(`${area.prefix}/`)
  );
  return match ? match.role : null;
}

/**
 * Whether someone with `viewerRole` may open the area belonging to `area`.
 *
 * An admin may open every area — they need to see what a student sees and what
 * an employer sees in order to support either. A student and an employer see
 * only their own.
 *
 * Note what this does *not* grant: viewing is not acting. An admin looking at
 * the student area is still an admin, with an admin's session; nothing here
 * lets them submit work as someone else or read another person's private data.
 * Each area's own rules still apply.
 */
export function canViewArea(viewerRole: UserRole, area: UserRole): boolean {
  return viewerRole === area || viewerRole === "admin";
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const owner = roleAreaFor(pathname);
  return owner === null || canViewArea(role, owner);
}

export type RoleChangeDecision = { ok: true } | { ok: false; reason: string };

/**
 * Whether one person may change another's role.
 *
 * Pure, and separate from the code that performs the change, because these are
 * the rules that decide who can grant admin rights — the highest-consequence
 * decision in the platform. They belong somewhere they can be read and tested
 * without a database.
 */
export function canChangeRole(params: {
  actorId: string;
  actorRole: UserRole;
  targetId: string;
  targetIsBootstrapAdmin: boolean;
}): RoleChangeDecision {
  if (params.actorRole !== "admin") {
    return { ok: false, reason: "Only an admin can change someone's role." };
  }

  // Self-demotion would let the last admin lock everyone out of the console,
  // and self-promotion is the escalation this whole design exists to prevent.
  // Neither has a legitimate use.
  if (params.actorId === params.targetId) {
    return {
      ok: false,
      reason: "You cannot change your own role. Ask another admin to do it.",
    };
  }

  // The setup account is the way back in when something goes wrong. Demoting it
  // by accident would remove exactly the thing you would then need.
  if (params.targetIsBootstrapAdmin) {
    return {
      ok: false,
      reason: "The setup account's role is fixed and cannot be changed here.",
    };
  }

  return { ok: true };
}

/**
 * Sanitises a `?next=` value before it is used as a redirect target.
 *
 * An unchecked `next` is an open redirect: a link to
 * `/login?next=https://evil.example` would send someone who just typed their
 * password straight off the platform, with our domain in the address bar right
 * up to the moment it happened. Only same-site absolute paths survive.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  // "//host" and "/\host" are protocol-relative URLs — they leave the site
  // despite starting with a slash.
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }
  return next;
}

/**
 * Where to send someone the moment they are authenticated: back to whatever
 * they were trying to reach, if they are allowed there, and to their own home
 * otherwise.
 */
export function postSignInRoute(
  role: UserRole,
  next: string | null | undefined
): string {
  const safe = safeNextPath(next);
  if (safe && canAccessRoute(role, safe)) return safe;
  return homeRouteForRole(role);
}

/**
 * Identifiers containing "@" are treated as email addresses; everything else is
 * a username to be resolved against `user_account`. A username may therefore
 * never contain "@" — enforced in `validation.ts`.
 */
export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes("@");
}

/**
 * Strips the characters PostgREST reads as filter syntax from a search box.
 *
 * The search runs through an `or=(...)` filter, where a comma or a bracket in
 * the user's text would be parsed as part of the query rather than as something
 * to search for — turning a typo into a malformed request, or worse, a filter
 * the caller did not intend.
 */
export function sanitiseSearchTerm(term: string): string {
  return term.replace(/[,()*%\\]/g, " ").trim().slice(0, 80);
}
