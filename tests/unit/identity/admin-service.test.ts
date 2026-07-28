// The administration and preview functions, with Supabase and the repository
// mocked.
//
// What is being tested here is authorisation, not SQL: that only an admin can
// list, change or preview anything, that the acting admin comes from the
// session rather than from the caller, that the setup account cannot be edited
// away, and that preview never widens what anyone can reach.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "@/modules/identity/types";

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  inviteUserByEmail: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  listAccounts: vi.fn(),
  setAccountState: vi.fn(),
  readPreviewRole: vi.fn(),
  writePreviewRole: vi.fn(),
}));

vi.mock("@/lib/db/supabase-server", () => ({
  createClient: async () => ({
    auth: { getUser: h.getUser, signOut: h.signOut },
  }),
}));

vi.mock("@/lib/db/supabase-admin", () => ({
  supabaseAdmin: {
    auth: { admin: { inviteUserByEmail: h.inviteUserByEmail } },
  },
}));

vi.mock("@/modules/identity/site-origin", () => ({
  getSiteOrigin: async () => "https://test.local",
}));

vi.mock("@/modules/identity/preview", () => ({
  readPreviewRole: h.readPreviewRole,
  writePreviewRole: h.writePreviewRole,
}));

vi.mock("@/modules/identity/user-account-repo", () => ({
  ACCOUNT_LIST_LIMIT: 200,
  findById: h.findById,
  findByEmail: h.findByEmail,
  findByUsername: vi.fn(),
  listAccounts: h.listAccounts,
  setAccountState: h.setAccountState,
  touchLastSignIn: vi.fn(),
}));

import {
  authorizeRole,
  changeUserRole,
  getViewer,
  listAccounts,
  registerEmployer,
  setPreviewRole,
  signOut,
} from "@/modules/identity/auth-service";

const ADMIN: AuthenticatedUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "admin@ascend.test",
  username: "admin",
  fullName: "Ascend Admin",
  role: "admin",
  isBootstrapAdmin: false,
};

const STUDENT: AuthenticatedUser = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "anita@example.com",
  username: null,
  fullName: "Anita Kumar",
  role: "student",
  isBootstrapAdmin: false,
};

const BOOTSTRAP: AuthenticatedUser = {
  id: "33333333-3333-4333-8333-333333333333",
  email: "setup@ascend.test",
  username: "setup",
  fullName: null,
  role: "admin",
  isBootstrapAdmin: true,
};

const EMPLOYER: AuthenticatedUser = {
  id: "77777777-7777-4777-8777-777777777777",
  email: "priya@retail.co",
  username: null,
  fullName: "Priya Nair",
  role: "employer",
  isBootstrapAdmin: false,
};

const DIRECTORY = [ADMIN, STUDENT, BOOTSTRAP, EMPLOYER];

/** Puts an account in the session and makes the directory readable. */
function signedInAs(account: AuthenticatedUser | null): void {
  h.getUser.mockResolvedValue(
    account
      ? {
          data: {
            user: { id: account.id, email: account.email, user_metadata: {} },
          },
          error: null,
        }
      : { data: { user: null }, error: { message: "no session" } }
  );

  h.findById.mockImplementation(
    async (id: string) => DIRECTORY.find((entry) => entry.id === id) ?? null
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  h.findByEmail.mockResolvedValue(null);
  h.listAccounts.mockResolvedValue({ accounts: [], truncated: false });
  h.readPreviewRole.mockResolvedValue(null);
});

describe("getViewer", () => {
  it("reports no preview when none is set", async () => {
    signedInAs(ADMIN);
    const viewer = await getViewer();

    expect(viewer).toEqual({
      user: ADMIN,
      previewRole: null,
      effectiveRole: "admin",
    });
  });

  it("applies an admin's preview to the effective role only", async () => {
    signedInAs(ADMIN);
    h.readPreviewRole.mockResolvedValue("student");

    const viewer = await getViewer();

    // The real role is untouched — every permission check still reads `user`.
    expect(viewer?.user.role).toBe("admin");
    expect(viewer?.effectiveRole).toBe("student");
  });

  it("ignores a preview cookie on someone who is not an admin", async () => {
    // Such a cookie could only have been forged. It must change nothing.
    signedInAs(STUDENT);
    h.readPreviewRole.mockResolvedValue("employer");

    const viewer = await getViewer();

    expect(viewer?.previewRole).toBeNull();
    expect(viewer?.effectiveRole).toBe("student");
    // Not even read for a non-admin.
    expect(h.readPreviewRole).not.toHaveBeenCalled();
  });
});

describe("authorizeRole", () => {
  it("lets a student into the student area", async () => {
    signedInAs(STUDENT);
    const result = await authorizeRole("student");
    expect(result.ok).toBe(true);
  });

  it("sends a student who opens the admin area back to their own", async () => {
    signedInAs(STUDENT);
    const result = await authorizeRole("admin");

    expect(result).toEqual({ ok: false, redirectTo: "/dashboard" });
  });

  it("lets an admin into the student and employer areas", async () => {
    signedInAs(ADMIN);
    expect((await authorizeRole("student")).ok).toBe(true);
    expect((await authorizeRole("employer")).ok).toBe(true);
  });

  it("keeps an admin out of the admin console while previewing", async () => {
    // Otherwise it would not be a preview. The exit control is always on screen.
    signedInAs(ADMIN);
    h.readPreviewRole.mockResolvedValue("student");

    const result = await authorizeRole("admin");

    expect(result).toEqual({ ok: false, redirectTo: "/dashboard" });
  });

  it("sends a signed-out visitor to the sign-in page", async () => {
    signedInAs(null);
    expect(await authorizeRole("student")).toEqual({
      ok: false,
      redirectTo: "/login",
    });
  });
});

describe("setPreviewRole", () => {
  it("refuses anyone who is not an admin", async () => {
    signedInAs(STUDENT);
    const result = await setPreviewRole("employer");

    expect(result.ok).toBe(false);
    expect(h.writePreviewRole).not.toHaveBeenCalled();
  });

  it("refuses a signed-out visitor", async () => {
    signedInAs(null);
    const result = await setPreviewRole("student");

    expect(result.ok).toBe(false);
    expect(h.writePreviewRole).not.toHaveBeenCalled();
  });

  it("sets the preview and sends the admin to that area", async () => {
    signedInAs(ADMIN);
    const result = await setPreviewRole("student");

    expect(result).toEqual({ ok: true, redirectTo: "/dashboard" });
    expect(h.writePreviewRole).toHaveBeenCalledWith("student");
  });

  it("treats 'admin' as leaving preview rather than a role to preview", async () => {
    signedInAs(ADMIN);
    const result = await setPreviewRole("admin");

    expect(result).toEqual({ ok: true, redirectTo: "/admin" });
    expect(h.writePreviewRole).toHaveBeenCalledWith(null);
  });

  it("rejects a role that does not exist", async () => {
    signedInAs(ADMIN);
    const result = await setPreviewRole("superadmin");

    expect(result.ok).toBe(false);
    expect(h.writePreviewRole).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("clears the preview so the next person does not inherit it", async () => {
    signedInAs(ADMIN);
    await signOut();

    expect(h.writePreviewRole).toHaveBeenCalledWith(null);
    expect(h.signOut).toHaveBeenCalled();
  });
});

describe("listAccounts", () => {
  it("refuses a signed-out visitor", async () => {
    signedInAs(null);
    const result = await listAccounts({});

    expect(result.ok).toBe(false);
    expect(h.listAccounts).not.toHaveBeenCalled();
  });

  it("refuses a student", async () => {
    signedInAs(STUDENT);
    const result = await listAccounts({});

    expect(result).toEqual({
      ok: false,
      error: "Only an admin can view the user list.",
    });
    // The refusal happens before the query — a student's request never reaches
    // the database at all.
    expect(h.listAccounts).not.toHaveBeenCalled();
  });

  it("returns the list for an admin and passes the search term through", async () => {
    signedInAs(ADMIN);
    h.listAccounts.mockResolvedValue({ accounts: [STUDENT], truncated: false });

    const result = await listAccounts({ query: "anita" });

    expect(result.ok).toBe(true);
    expect(result.ok && result.data.accounts).toHaveLength(1);
    expect(h.listAccounts).toHaveBeenCalledWith({ query: "anita" });
  });

  it("still works for an admin who is previewing another role", async () => {
    // Preview changes what they see, never what they may do.
    signedInAs(ADMIN);
    h.readPreviewRole.mockResolvedValue("student");

    const result = await listAccounts({});
    expect(result.ok).toBe(true);
  });

  it("reports a failed query rather than an empty list", async () => {
    // An empty list and a broken query look identical on screen otherwise —
    // the failure mode this project has hit before.
    signedInAs(ADMIN);
    h.listAccounts.mockResolvedValue(null);

    const result = await listAccounts({});

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/could not be loaded/i);
  });
});

describe("changeUserRole", () => {
  it("refuses a signed-out visitor", async () => {
    signedInAs(null);
    const result = await changeUserRole({ userId: STUDENT.id, role: "admin" });

    expect(result.ok).toBe(false);
    expect(h.setAccountState).not.toHaveBeenCalled();
  });

  it("refuses a student trying to promote themselves", async () => {
    // The escalation this design exists to prevent: the form field says
    // "admin", and the server ignores it because the session says "student".
    signedInAs(STUDENT);
    const result = await changeUserRole({ userId: STUDENT.id, role: "admin" });

    expect(result.ok).toBe(false);
    expect(h.setAccountState).not.toHaveBeenCalled();
  });

  it("refuses a student trying to promote someone else", async () => {
    signedInAs(STUDENT);
    const result = await changeUserRole({ userId: EMPLOYER.id, role: "admin" });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/only an admin/i);
    expect(h.setAccountState).not.toHaveBeenCalled();
  });

  it("refuses an admin changing their own role", async () => {
    signedInAs(ADMIN);
    const result = await changeUserRole({ userId: ADMIN.id, role: "student" });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/your own role/i);
    expect(h.setAccountState).not.toHaveBeenCalled();
  });

  it("refuses any change to the setup account", async () => {
    signedInAs(ADMIN);
    const result = await changeUserRole({ userId: BOOTSTRAP.id, role: "student" });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/setup account/i);
    expect(h.setAccountState).not.toHaveBeenCalled();
  });

  it("rejects a role that is not one of the three", async () => {
    signedInAs(ADMIN);
    const result = await changeUserRole({
      userId: STUDENT.id,
      role: "superadmin",
    });

    expect(result.ok).toBe(false);
    expect(h.setAccountState).not.toHaveBeenCalled();
  });

  it("reports an account that no longer exists", async () => {
    signedInAs(ADMIN);
    const result = await changeUserRole({
      userId: "44444444-4444-4444-8444-444444444444",
      role: "admin",
    });

    expect(result).toEqual({ ok: false, error: "That account no longer exists." });
  });

  it("writes nothing when the role is already what was asked for", async () => {
    signedInAs(ADMIN);
    const result = await changeUserRole({ userId: STUDENT.id, role: "student" });

    expect(result.ok).toBe(true);
    // No new version, so no history entry claiming a change that never happened.
    expect(h.setAccountState).not.toHaveBeenCalled();
  });

  it("promotes a student, carrying their details onto the new version", async () => {
    signedInAs(ADMIN);
    h.setAccountState.mockResolvedValue({ ...STUDENT, role: "admin" });

    const result = await changeUserRole({ userId: STUDENT.id, role: "admin" });

    expect(result.ok).toBe(true);
    expect(result.ok && result.user.role).toBe("admin");

    // A new version replaces the whole row, so every attribute has to be
    // carried across — a missing one would be silently blanked.
    expect(h.setAccountState).toHaveBeenCalledWith({
      userId: STUDENT.id,
      email: STUDENT.email,
      username: STUDENT.username,
      fullName: STUDENT.fullName,
      role: "admin",
      isBootstrapAdmin: false,
      // Taken from the session, never from the caller.
      actorId: ADMIN.id,
    });
  });

  it("reports a failed write instead of claiming success", async () => {
    signedInAs(ADMIN);
    h.setAccountState.mockResolvedValue(null);

    const result = await changeUserRole({ userId: STUDENT.id, role: "employer" });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/could not be saved/i);
  });
});

describe("registerEmployer", () => {
  const NEW_EMPLOYER = { fullName: "Rahul Menon", email: "rahul@retail.co" };

  it("refuses anyone who is not an admin", async () => {
    signedInAs(STUDENT);
    const result = await registerEmployer(NEW_EMPLOYER);

    expect(result).toEqual({
      ok: false,
      error: "Only an admin can register an employer.",
    });
    expect(h.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("refuses an email that already has an account", async () => {
    signedInAs(ADMIN);
    h.findByEmail.mockResolvedValue(STUDENT);

    const result = await registerEmployer(NEW_EMPLOYER);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/already has an account/i);
    // No invitation is sent to someone who is already here.
    expect(h.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("rejects a malformed email before contacting Supabase", async () => {
    signedInAs(ADMIN);
    const result = await registerEmployer({ fullName: "Rahul", email: "nope" });

    expect(result.ok).toBe(false);
    expect(h.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("invites the employer and writes the account with the employer role", async () => {
    signedInAs(ADMIN);
    h.inviteUserByEmail.mockResolvedValue({
      data: { user: { id: "55555555-5555-4555-8555-555555555555" } },
      error: null,
    });
    h.setAccountState.mockResolvedValue({ ...EMPLOYER, email: NEW_EMPLOYER.email });

    const result = await registerEmployer(NEW_EMPLOYER);

    expect(result).toEqual({ ok: true, email: "rahul@retail.co" });

    // The invitation returns through the same callback every other link uses,
    // then sends them to choose a password.
    expect(h.inviteUserByEmail).toHaveBeenCalledWith("rahul@retail.co", {
      redirectTo: "https://test.local/auth/callback?next=/reset-password",
      data: { full_name: "Rahul Menon" },
    });

    expect(h.setAccountState).toHaveBeenCalledWith({
      userId: "55555555-5555-4555-8555-555555555555",
      email: "rahul@retail.co",
      username: null,
      fullName: "Rahul Menon",
      role: "employer",
      isBootstrapAdmin: false,
      actorId: ADMIN.id,
    });
  });

  it("reports a failed invitation", async () => {
    signedInAs(ADMIN);
    h.inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { message: "smtp unavailable" },
    });

    const result = await registerEmployer(NEW_EMPLOYER);

    expect(result.ok).toBe(false);
    expect(h.setAccountState).not.toHaveBeenCalled();
  });

  it("does not claim success when the invitation sent but the row did not save", async () => {
    // A half-made account: the person can sign in but has no role. The admin
    // must be told, because retrying blindly would fail on the duplicate email.
    signedInAs(ADMIN);
    h.inviteUserByEmail.mockResolvedValue({
      data: { user: { id: "66666666-6666-4666-8666-666666666666" } },
      error: null,
    });
    h.setAccountState.mockResolvedValue(null);

    const result = await registerEmployer(NEW_EMPLOYER);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/could not be written/i);
  });
});
