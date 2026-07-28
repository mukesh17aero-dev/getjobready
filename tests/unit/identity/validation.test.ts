import { describe, expect, it } from "vitest";
import {
  registerEmployerSchema,
  resetPasswordSchema,
  roleChangeSchema,
  signInSchema,
  signUpSchema,
  usernameField,
} from "@/modules/identity/validation";

describe("signUpSchema", () => {
  it("normalises the email so one person cannot become two accounts", () => {
    const result = signUpSchema.parse({
      fullName: "  Anita Kumar  ",
      email: "  Anita.Kumar@Example.COM ",
      password: "correcthorse",
    });

    expect(result.email).toBe("anita.kumar@example.com");
    expect(result.fullName).toBe("Anita Kumar");
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      fullName: "Anita Kumar",
      email: "anita@example.com",
      password: "short7",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = signUpSchema.safeParse({
      fullName: "Anita Kumar",
      email: "anita-at-example.com",
      password: "correcthorse",
    });

    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("does not apply the length rule to the password", () => {
    // The rule applies when a password is set. Enforcing it here would tell an
    // attacker that a short guess was too short rather than simply wrong.
    const result = signInSchema.safeParse({ identifier: "admin", password: "x" });
    expect(result.success).toBe(true);
  });

  it("requires something in both fields", () => {
    expect(signInSchema.safeParse({ identifier: "", password: "x" }).success).toBe(
      false
    );
    expect(
      signInSchema.safeParse({ identifier: "admin", password: "" }).success
    ).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires both entries to match", () => {
    const result = resetPasswordSchema.safeParse({
      password: "correcthorse",
      confirmPassword: "correcthouse",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a matching pair", () => {
    const result = resetPasswordSchema.safeParse({
      password: "correcthorse",
      confirmPassword: "correcthorse",
    });

    expect(result.success).toBe(true);
  });
});

describe("roleChangeSchema", () => {
  const USER_ID = "8f1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d";

  it("accepts each of the three real roles", () => {
    for (const role of ["student", "admin", "employer"]) {
      expect(roleChangeSchema.safeParse({ userId: USER_ID, role }).success).toBe(
        true
      );
    }
  });

  it("rejects a role that does not exist", () => {
    // The form is a <select>, but a form field is browser input and must be
    // treated as hostile. "superadmin" must not survive to reach the database.
    expect(
      roleChangeSchema.safeParse({ userId: USER_ID, role: "superadmin" }).success
    ).toBe(false);
    expect(
      roleChangeSchema.safeParse({ userId: USER_ID, role: "" }).success
    ).toBe(false);
  });

  it("rejects an id that is not a uuid", () => {
    expect(
      roleChangeSchema.safeParse({ userId: "42", role: "admin" }).success
    ).toBe(false);
  });
});

describe("registerEmployerSchema", () => {
  it("normalises the email and trims the name", () => {
    const result = registerEmployerSchema.parse({
      fullName: "  Priya Nair ",
      email: " Priya.Nair@Retail.CO ",
    });

    expect(result).toEqual({
      fullName: "Priya Nair",
      email: "priya.nair@retail.co",
    });
  });

  it("rejects a missing or malformed email", () => {
    expect(
      registerEmployerSchema.safeParse({ fullName: "Priya Nair", email: "" })
        .success
    ).toBe(false);
    expect(
      registerEmployerSchema.safeParse({
        fullName: "Priya Nair",
        email: "priya-at-retail",
      }).success
    ).toBe(false);
  });

  it("rejects an empty contact name", () => {
    expect(
      registerEmployerSchema.safeParse({ fullName: " ", email: "p@retail.co" })
        .success
    ).toBe(false);
  });

  it("takes no role field", () => {
    // Employers are created as employers. If a role ever became an input here,
    // this form would be a way to mint admins.
    const result = registerEmployerSchema.parse({
      fullName: "Priya Nair",
      email: "priya@retail.co",
      role: "admin",
    } as never);

    expect(result).not.toHaveProperty("role");
  });
});

describe("usernameField", () => {
  it("rejects an '@', which would make a username look like an email", () => {
    // The sign-in resolver decides between email and username by looking for
    // "@". A username containing one could never be resolved.
    expect(usernameField.safeParse("admin@ascend").success).toBe(false);
  });

  it("accepts the characters an admin username actually needs", () => {
    expect(usernameField.safeParse("admin").success).toBe(true);
    expect(usernameField.safeParse("anita.kumar-01_x").success).toBe(true);
  });

  it("rejects usernames that are too short or contain spaces", () => {
    expect(usernameField.safeParse("ab").success).toBe(false);
    expect(usernameField.safeParse("two words").success).toBe(false);
  });
});
