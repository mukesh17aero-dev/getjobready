import type { DataResult } from "@/lib/data-result";
import { supabaseAdmin } from "@/lib/db/supabase-admin";
import { createClient } from "@/lib/db/supabase-server";
import { readPreviewRole, writePreviewRole } from "./preview";
import {
  canChangeRole,
  canViewArea,
  homeRouteForRole,
  isEmailIdentifier,
  isUserRole,
} from "./roles";
import { getSiteOrigin } from "./site-origin";
import type {
  AccountSummary,
  AuthenticatedUser,
  AuthOutcome,
  UserRole,
  Viewer,
} from "./types";
import * as repo from "./user-account-repo";
import {
  firstIssue,
  forgotPasswordSchema,
  registerEmployerSchema,
  resetPasswordSchema,
  roleChangeSchema,
  signInSchema,
  signUpSchema,
  usernameField,
} from "./validation";

// One message for every "we could not sign you in" case. Distinguishing "no such
// account" from "wrong password" turns the sign-in form into a tool for checking
// which email addresses are registered here.
const SIGN_IN_FAILED = "Those details don't match an account. Please try again.";

type BootstrapConfig = { username: string; email: string };

/**
 * The break-glass admin, if one is configured. Both values are required — a
 * username with no address behind it cannot sign anybody in.
 *
 * This account never retires. Removing `ADMIN_BOOTSTRAP_USERNAME` from the
 * environment is the only way to switch it off.
 */
function bootstrapConfig(): BootstrapConfig | null {
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME?.trim();
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (!username || !email) return null;
  if (!usernameField.safeParse(username).success) return null;
  return { username, email };
}

function isBootstrapUsername(identifier: string): boolean {
  const config = bootstrapConfig();
  return (
    config !== null && identifier.toLowerCase() === config.username.toLowerCase()
  );
}

function readFullName(metadata: Record<string, unknown> | undefined): string | null {
  const candidate = metadata?.full_name ?? metadata?.name;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}

/**
 * Reads the signed-in person, or null. Called on every protected page, so it
 * self-heals: an auth user with no active `user_account` row (created by hand in
 * the Supabase dashboard, say) gets one as a student rather than a broken
 * session.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;

  const existing = await repo.findById(data.user.id);
  if (existing) return existing;

  return repo.setAccountState({
    userId: data.user.id,
    email: data.user.email,
    username: null,
    fullName: readFullName(data.user.user_metadata),
    role: "student",
    isBootstrapAdmin: false,
    // Self-created: nobody else put them in this state.
    actorId: data.user.id,
  });
}

/**
 * The signed-in person plus, for an admin, whichever role's view they have
 * chosen to preview.
 */
export async function getViewer(): Promise<Viewer | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  // A preview cookie on a non-admin is ignored outright. It could only have got
  // there by being forged, and it must change nothing.
  const previewRole = user.role === "admin" ? await readPreviewRole() : null;

  return { user, previewRole, effectiveRole: previewRole ?? user.role };
}

/**
 * The authorisation check for a role-restricted area.
 *
 * It returns a decision rather than performing the redirect, because
 * redirecting is the routing layer's job — `app/` calls
 * `redirect(result.redirectTo)`. The rule itself lives here so there is one
 * definition of it, and pages cannot drift into inventing their own.
 *
 * An admin may open every area. While previewing, the *effective* role decides,
 * so an admin previewing as a student genuinely cannot reach the admin console
 * until they leave preview — otherwise it would not be a preview.
 */
export async function authorizeRole(
  required: UserRole
): Promise<{ ok: true; viewer: Viewer } | { ok: false; redirectTo: string }> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, redirectTo: "/login" };

  if (!canViewArea(viewer.effectiveRole, required)) {
    return { ok: false, redirectTo: homeRouteForRole(viewer.effectiveRole) };
  }

  return { ok: true, viewer };
}

/**
 * Turns whatever was typed into the sign-in field into the email address
 * Supabase needs, and says whether it belongs to the break-glass account.
 */
async function resolveIdentifier(
  identifier: string
): Promise<{ email: string; isBootstrap: boolean } | null> {
  if (isEmailIdentifier(identifier)) {
    return { email: identifier.toLowerCase(), isBootstrap: false };
  }

  const config = bootstrapConfig();
  if (config && isBootstrapUsername(identifier)) {
    return { email: config.email, isBootstrap: true };
  }

  const account = await repo.findByUsername(identifier);
  if (!account) return null;
  return { email: account.email, isBootstrap: account.isBootstrapAdmin };
}

export async function signInWithPassword(input: {
  identifier: string;
  password: string;
}): Promise<AuthOutcome> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const resolved = await resolveIdentifier(parsed.data.identifier);
  if (!resolved) return { ok: false, error: SIGN_IN_FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolved.email,
    password: parsed.data.password,
  });

  if (error || !data.user?.email) {
    if (error?.message.toLowerCase().includes("not confirmed")) {
      return {
        ok: false,
        error:
          "Confirm your email address first — check your inbox for the link we sent.",
      };
    }
    return { ok: false, error: SIGN_IN_FAILED };
  }

  const user = resolved.isBootstrap
    ? await repo.setAccountState({
        userId: data.user.id,
        email: resolved.email,
        username: bootstrapConfig()?.username ?? parsed.data.identifier,
        fullName: readFullName(data.user.user_metadata),
        role: "admin",
        isBootstrapAdmin: true,
        actorId: data.user.id,
      })
    : ((await repo.findById(data.user.id)) ??
      (await repo.setAccountState({
        userId: data.user.id,
        email: data.user.email,
        username: null,
        fullName: readFullName(data.user.user_metadata),
        role: "student",
        isBootstrapAdmin: false,
        actorId: data.user.id,
      })));

  if (!user) {
    return {
      ok: false,
      error: "Signed in, but your account record could not be read. Try again.",
    };
  }

  await repo.touchLastSignIn(user.id);
  return { ok: true, user };
}

/**
 * Self-service registration. Creates a student and only ever a student — the
 * role is not an input here and must never become one.
 */
export async function signUpStudent(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthOutcome> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const origin = await getSiteOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return {
      ok: false,
      error: error.message.toLowerCase().includes("already registered")
        ? "That email address already has an account. Try signing in instead."
        : "We couldn't create your account just now. Please try again.",
    };
  }

  // With email confirmation switched on, Supabase creates the user but no
  // session, and returns an empty `identities` array for an address that already
  // exists. Both cases get the same "check your inbox" answer: the second one
  // deliberately, so the form cannot be used to discover who is registered.
  if (!data.session || data.user?.identities?.length === 0) {
    return { ok: true, needsEmailConfirmation: true, email: parsed.data.email };
  }

  if (!data.user?.email) {
    return { ok: false, error: "We couldn't create your account just now." };
  }

  const user = await repo.setAccountState({
    userId: data.user.id,
    email: data.user.email,
    username: null,
    fullName: parsed.data.fullName,
    role: "student",
    isBootstrapAdmin: false,
    actorId: data.user.id,
  });

  if (!user) {
    return {
      ok: false,
      error: "Your account was created but could not be read back. Try signing in.",
    };
  }

  await repo.touchLastSignIn(user.id);
  return { ok: true, user };
}

/**
 * Starts the Google hand-off and returns the URL to send the browser to.
 *
 * `skipBrowserRedirect` keeps this a server-side call: the anon key and the
 * redirect are decided here, not in a client component.
 */
export async function startGoogleSignIn(
  next: string | null
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const origin = await getSiteOrigin();
  const callback = new URL(`${origin}/auth/callback`);
  if (next) callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
  });

  if (error || !data.url) {
    return { ok: false, error: "Google sign-in is unavailable right now." };
  }

  if (!(await providerAccepts(data.url))) {
    return {
      ok: false,
      error:
        "Google sign-in is not set up on this platform yet. Use your email or username and password.",
    };
  }

  return { ok: true, url: data.url };
}

/**
 * Asks Supabase whether it will actually honour this authorize URL.
 *
 * `signInWithOAuth` builds the URL locally without contacting the server, so a
 * disabled or misconfigured provider is not reported as an error — the browser
 * finds out by landing on Supabase's domain and being shown raw JSON
 * (`"Unsupported provider: provider is not enabled"`). One request converts
 * that dead end into a sentence on our own sign-in page.
 *
 * It fails **open**: if the check itself cannot complete, the redirect proceeds
 * as normal. A flaky network must not block a sign-in that would have worked.
 */
async function providerAccepts(authorizeUrl: string): Promise<boolean> {
  try {
    const response = await fetch(authorizeUrl, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
    });
    // A working provider answers with a redirect to Google. Anything from 400
    // up is a configuration problem on this project.
    return response.status < 400;
  } catch {
    return true;
  }
}

/**
 * Completes any link-based return: Google, the email confirmation link, an
 * employer invitation and the password-reset link all come back through here
 * with a one-time code.
 */
export async function completeCodeExchange(code: string): Promise<AuthOutcome> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return {
      ok: false,
      error: "That sign-in link has expired or was already used.",
    };
  }

  const user =
    (await repo.findById(data.user.id)) ??
    (await repo.setAccountState({
      userId: data.user.id,
      email: data.user.email,
      username: null,
      fullName: readFullName(data.user.user_metadata),
      role: "student",
      isBootstrapAdmin: false,
      actorId: data.user.id,
    }));

  if (!user) {
    // The likeliest cause is a split identity: this email already has an
    // account here, but Google authenticated as a *different* auth user rather
    // than linking to it. The active-row email index is unique, so the insert
    // was refused — correctly, since silently creating a second account would
    // give one person two identities and, for an admin, one of them a
    // student's role.
    const existing = await repo.findByEmail(data.user.email);
    if (existing) {
      return {
        ok: false,
        error:
          "That email address already has an account here that was not created through Google. Sign in with your password instead.",
      };
    }
    return { ok: false, error: "Your account record could not be read." };
  }

  await repo.touchLastSignIn(user.id);
  return { ok: true, user };
}

/**
 * Always reports success. Saying "no such account" here would leak the register
 * to anyone with the form open.
 */
export async function sendPasswordReset(input: {
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const origin = await getSiteOrigin();
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return { ok: true };
}

/**
 * Sets a new password for whoever is currently signed in — which, in the reset
 * flow, is the person who just followed the emailed link.
 */
export async function updatePassword(input: {
  password: string;
  confirmPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !data.user) {
    return {
      ok: false,
      error: "That reset link has expired. Request a new one and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: "That password was rejected. Try a different one." };
  }

  return { ok: true };
}

export async function signOut(): Promise<void> {
  // Preview is a property of the session, not of the person. Leaving the cookie
  // behind would put the next person to sign in on this browser straight into
  // a preview they never asked for.
  await writePreviewRole(null);
  const supabase = await createClient();
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// Administration
//
// Every function below re-reads the acting admin from the session rather than
// accepting one as a parameter. A caller in `app/` cannot say who it is acting
// as — which means a mistake in a page can never become a privilege escalation.
//
// They all use the *real* role, never the previewed one. An admin previewing as
// a student is still an admin; preview changes what they see, never what they
// may do.
// ---------------------------------------------------------------------------

/**
 * Switches an admin into (or out of) another role's view.
 *
 * Preview can only narrow: an admin may already open every area, so choosing a
 * role removes the admin console from reach rather than granting anything.
 */
export async function setPreviewRole(
  role: string | null
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, error: "Only an admin can preview another role." };
  }

  if (role === null || role === "admin") {
    await writePreviewRole(null);
    return { ok: true, redirectTo: homeRouteForRole("admin") };
  }

  if (!isUserRole(role)) {
    return { ok: false, error: "That is not a role you can preview." };
  }

  await writePreviewRole(role);
  return { ok: true, redirectTo: homeRouteForRole(role) };
}

export async function listAccounts(params: {
  query?: string;
}): Promise<DataResult<{ accounts: AccountSummary[]; truncated: boolean }>> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin") {
    return { ok: false, error: "Only an admin can view the user list." };
  }

  const result = await repo.listAccounts({ query: params.query });
  if (!result) {
    return {
      ok: false,
      error:
        "The user list could not be loaded. If this is the first time, check that the latest migration has been applied.",
    };
  }

  return { ok: true, data: result };
}

export async function changeUserRole(input: {
  userId: string;
  role: string;
}): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; error: string }> {
  const actor = await getCurrentUser();
  if (!actor) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }

  const parsed = roleChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const target = await repo.findById(parsed.data.userId);
  if (!target) return { ok: false, error: "That account no longer exists." };

  const decision = canChangeRole({
    actorId: actor.id,
    actorRole: actor.role,
    targetId: target.id,
    targetIsBootstrapAdmin: target.isBootstrapAdmin,
  });
  if (!decision.ok) return { ok: false, error: decision.reason };

  // Nothing to do. The database would decline to write a version anyway; saying
  // so here saves the round trip.
  if (target.role === parsed.data.role) return { ok: true, user: target };

  const updated = await repo.setAccountState({
    userId: target.id,
    email: target.email,
    username: target.username,
    fullName: target.fullName,
    role: parsed.data.role,
    isBootstrapAdmin: target.isBootstrapAdmin,
    actorId: actor.id,
  });

  if (!updated) {
    return { ok: false, error: "That role change could not be saved. Try again." };
  }

  return { ok: true, user: updated };
}

/**
 * Creates an employer account and emails an invitation.
 *
 * Employers are never self-registered — this is the only way one comes into
 * existence. The invitation link lands on `/auth/callback`, which exchanges it
 * for a session and sends them to `/reset-password` to choose a password.
 */
export async function registerEmployer(input: {
  fullName: string;
  email: string;
}): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin") {
    return { ok: false, error: "Only an admin can register an employer." };
  }

  const parsed = registerEmployerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const existing = await repo.findByEmail(parsed.data.email);
  if (existing) {
    return {
      ok: false,
      error: `That email already has an account here (currently ${existing.role}). Change their role from the user list instead.`,
    };
  }

  const origin = await getSiteOrigin();
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
      data: { full_name: parsed.data.fullName },
    }
  );

  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message.toLowerCase().includes("already been registered")
        ? "That email address already has an account. Change their role from the user list instead."
        : "The invitation could not be sent. Check the address and try again.",
    };
  }

  const account = await repo.setAccountState({
    userId: data.user.id,
    email: parsed.data.email,
    username: null,
    fullName: parsed.data.fullName,
    role: "employer",
    isBootstrapAdmin: false,
    actorId: actor.id,
  });

  if (!account) {
    // The auth user now exists without a role record. Say so plainly instead of
    // reporting success — the admin needs to know the state is half-made.
    return {
      ok: false,
      error:
        "The invitation was sent, but the account record could not be written. Check the user list before trying again.",
    };
  }

  return { ok: true, email: parsed.data.email };
}
