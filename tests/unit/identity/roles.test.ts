// The pure access rules, tested directly rather than through the module barrel:
// importing `@/modules/identity` would pull in the Supabase clients, which read
// environment variables at module load. These functions are the whole point —
// every "where does this person go" and "may they open that" answer in the
// platform comes from here.
import { describe, expect, it } from "vitest";
import {
  canAccessRoute,
  canChangeRole,
  canViewArea,
  homeRouteForRole,
  isEmailIdentifier,
  postSignInRoute,
  roleAreaFor,
  safeNextPath,
  sanitiseSearchTerm,
} from "@/modules/identity/roles";
import { USER_ROLES } from "@/modules/identity/types";

describe("homeRouteForRole", () => {
  it("sends each role to its own area", () => {
    expect(homeRouteForRole("student")).toBe("/dashboard");
    expect(homeRouteForRole("admin")).toBe("/admin");
    expect(homeRouteForRole("employer")).toBe("/portal");
  });

  it("has a home for every role that exists", () => {
    for (const role of USER_ROLES) {
      expect(homeRouteForRole(role)).toMatch(/^\/[a-z]/);
    }
  });

  it("sends every role somewhere it is allowed to be", () => {
    for (const role of USER_ROLES) {
      expect(canAccessRoute(role, homeRouteForRole(role))).toBe(true);
    }
  });
});

describe("roleAreaFor", () => {
  it("matches an area and everything beneath it", () => {
    expect(roleAreaFor("/admin")).toBe("admin");
    expect(roleAreaFor("/admin/rules/4")).toBe("admin");
    expect(roleAreaFor("/dashboard")).toBe("student");
    expect(roleAreaFor("/portal")).toBe("employer");
  });

  it("does not match a path that merely starts with the same letters", () => {
    // "/admins-only" is not inside "/admin", and treating it as such would
    // silently protect (or expose) the wrong route.
    expect(roleAreaFor("/admins-only")).toBeNull();
    expect(roleAreaFor("/dashboards")).toBeNull();
  });

  it("returns null for routes that belong to nobody in particular", () => {
    expect(roleAreaFor("/")).toBeNull();
    expect(roleAreaFor("/login")).toBeNull();
    expect(roleAreaFor("/passport/abc123")).toBeNull();
  });
});

describe("canViewArea", () => {
  it("lets everyone into their own area", () => {
    for (const role of USER_ROLES) {
      expect(canViewArea(role, role)).toBe(true);
    }
  });

  it("lets an admin into every area", () => {
    // Admins support both students and employers, so they need to see what
    // each of them sees.
    expect(canViewArea("admin", "student")).toBe(true);
    expect(canViewArea("admin", "employer")).toBe(true);
  });

  it("keeps students and employers out of everywhere else", () => {
    expect(canViewArea("student", "admin")).toBe(false);
    expect(canViewArea("student", "employer")).toBe(false);
    expect(canViewArea("employer", "admin")).toBe(false);
    expect(canViewArea("employer", "student")).toBe(false);
  });
});

describe("canAccessRoute", () => {
  it("lets a student into the student area only", () => {
    expect(canAccessRoute("student", "/dashboard")).toBe(true);
    expect(canAccessRoute("student", "/admin")).toBe(false);
    expect(canAccessRoute("student", "/portal")).toBe(false);
  });

  it("lets an employer into the employer area only", () => {
    expect(canAccessRoute("employer", "/portal")).toBe(true);
    expect(canAccessRoute("employer", "/dashboard")).toBe(false);
    expect(canAccessRoute("employer", "/admin")).toBe(false);
  });

  it("lets an admin into all three", () => {
    for (const path of ["/admin", "/dashboard", "/portal"]) {
      expect(canAccessRoute("admin", path)).toBe(true);
    }
  });

  it("allows any role onto unrestricted routes", () => {
    for (const role of USER_ROLES) {
      expect(canAccessRoute(role, "/reset-password")).toBe(true);
    }
  });
});

describe("safeNextPath", () => {
  it("accepts a same-site absolute path", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/admin/rules?tab=2")).toBe("/admin/rules?tab=2");
  });

  it("rejects anything that could leave the site", () => {
    // Each of these would be an open redirect: someone who just typed their
    // password lands on another origin with our domain in the referrer.
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
    expect(safeNextPath("dashboard")).toBeNull();
  });

  it("treats absent and empty values as no destination", () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath("")).toBeNull();
  });
});

describe("postSignInRoute", () => {
  it("returns someone to where they were headed", () => {
    expect(postSignInRoute("student", "/dashboard/evidence")).toBe(
      "/dashboard/evidence"
    );
  });

  it("falls back to home when the destination is not theirs", () => {
    expect(postSignInRoute("student", "/admin")).toBe("/dashboard");
    expect(postSignInRoute("employer", "/dashboard")).toBe("/portal");
  });

  it("falls back to home when the destination is off-site", () => {
    expect(postSignInRoute("admin", "https://evil.example")).toBe("/admin");
    expect(postSignInRoute("admin", "//evil.example")).toBe("/admin");
  });

  it("falls back to home when there is no destination", () => {
    expect(postSignInRoute("student", null)).toBe("/dashboard");
  });
});

describe("canChangeRole", () => {
  const ADMIN = "admin-id";
  const OTHER = "other-id";

  const change = (params: Partial<Parameters<typeof canChangeRole>[0]> = {}) =>
    canChangeRole({
      actorId: ADMIN,
      actorRole: "admin",
      targetId: OTHER,
      targetIsBootstrapAdmin: false,
      ...params,
    });

  it("lets an admin change someone else's role", () => {
    expect(change()).toEqual({ ok: true });
  });

  it("refuses anyone who is not an admin", () => {
    // The pages already gate on role, but this is the rule itself — it must
    // hold even if a caller forgets to check.
    for (const actorRole of ["student", "employer"] as const) {
      const result = change({ actorRole });
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toMatch(/only an admin/i);
    }
  });

  it("refuses an admin changing their own role", () => {
    // Self-demotion could leave nobody able to reach the console, and
    // self-promotion is the escalation the whole design exists to prevent.
    const result = change({ targetId: ADMIN });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/your own role/i);
  });

  it("refuses any change to the setup account", () => {
    const result = change({ targetIsBootstrapAdmin: true });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/setup account/i);
  });

  it("refuses a non-admin acting on themselves", () => {
    // Both rules apply; it must fail, and on the role rather than on identity.
    const result = canChangeRole({
      actorId: OTHER,
      actorRole: "student",
      targetId: OTHER,
      targetIsBootstrapAdmin: false,
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/only an admin/i);
  });
});

describe("sanitiseSearchTerm", () => {
  it("keeps ordinary search text intact", () => {
    expect(sanitiseSearchTerm("anita kumar")).toBe("anita kumar");
    expect(sanitiseSearchTerm("  anita@example.com  ")).toBe("anita@example.com");
  });

  it("strips the characters PostgREST reads as filter syntax", () => {
    // A comma or bracket would be parsed as part of the `or=(...)` filter
    // rather than as text to search for.
    expect(sanitiseSearchTerm("a,b")).toBe("a b");
    expect(sanitiseSearchTerm("(admin)")).toBe("admin");
    expect(sanitiseSearchTerm("100%")).toBe("100");
    expect(sanitiseSearchTerm("a*b")).toBe("a b");
    expect(sanitiseSearchTerm("back\\slash")).toBe("back slash");
  });

  it("caps the length so a pasted essay cannot become the query", () => {
    expect(sanitiseSearchTerm("x".repeat(500))).toHaveLength(80);
  });
});

describe("isEmailIdentifier", () => {
  it("splits email addresses from usernames", () => {
    expect(isEmailIdentifier("anita@example.com")).toBe(true);
    expect(isEmailIdentifier("admin")).toBe(false);
    expect(isEmailIdentifier("anita.k")).toBe(false);
  });
});
