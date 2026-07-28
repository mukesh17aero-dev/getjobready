export const USER_ROLES = ["student", "admin", "employer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/**
 * Everything the rest of the platform is allowed to know about the signed-in
 * person. Deliberately small: a page needs to know who this is and what they
 * are, not how they authenticated.
 */
export type AuthenticatedUser = {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  role: UserRole;
  isBootstrapAdmin: boolean;
};

/**
 * A row in the admin's user list. `AuthenticatedUser` plus the dates an admin
 * needs to tell one person from another and see who is actually using the
 * platform.
 */
export type AccountSummary = AuthenticatedUser & {
  /** The id of this *version* of the account, not of the person. */
  accountId: string;
  /** When this version came into effect — i.e. when they last changed. */
  createdAt: string;
  /** Who caused this state. Their own id when they created the account. */
  createdBy: string | null;
  lastSignInAt: string | null;
};

/**
 * Who is looking, and as what.
 *
 * `user` is always the real person. `previewRole` is set only when an admin has
 * chosen to see another role's view, and `effectiveRole` is what the interface
 * should behave as. Keeping the two apart is the point: every permission check
 * uses the real role, and only the view uses the effective one.
 */
export type Viewer = {
  user: AuthenticatedUser;
  previewRole: UserRole | null;
  effectiveRole: UserRole;
};

/**
 * The outcome of a sign-in or sign-up attempt, for the caller in `app/` to turn
 * into a redirect or an error message.
 *
 * `needsEmailConfirmation` exists because Supabase can be configured either way:
 * with confirmation on, a new account is created but not usable until the person
 * clicks the link, and telling them "signed up!" then dumping them at the login
 * page is the single most confusing thing this flow can do.
 */
export type AuthOutcome =
  | { ok: true; user: AuthenticatedUser }
  | { ok: true; needsEmailConfirmation: true; email: string }
  | { ok: false; error: string };
