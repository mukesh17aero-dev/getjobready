import { z } from "zod";

// The minimum that is honest rather than theatrical. Complexity rules ("one
// capital, one symbol") push people towards Password1! and towards writing it
// down; length is what actually helps.
const MIN_PASSWORD_LENGTH = 8;

const emailField = z
  .string()
  .trim()
  .pipe(z.email("Enter a valid email address"))
  .transform((value) => value.toLowerCase());

const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(72, "Passwords can be at most 72 characters");

/**
 * A username must not contain "@", or the sign-in resolver could not tell it
 * apart from an email address.
 */
export const usernameField = z
  .string()
  .trim()
  .min(3, "Usernames are at least 3 characters")
  .max(40, "Usernames are at most 40 characters")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Usernames may use letters, numbers, dots, underscores and hyphens only"
  );

export const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username"),
  // No length check on sign-in: the rule applies when a password is set, and
  // applying it here would tell an attacker that a short guess was too short
  // rather than simply wrong.
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(120, "That name is too long"),
  email: emailField,
  password: passwordField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Both passwords must match",
    path: ["confirmPassword"],
  });

export const roleChangeSchema = z.object({
  userId: z.uuid("That is not a valid account"),
  // "student" is included so a promotion can be undone. An admin who mis-clicks
  // must be able to put it back without a database console.
  role: z.enum(["student", "admin", "employer"]),
});

// Name and email only. An employer's organisation, sector and reviewer history
// belong to `modules/employer-review`, which is not built — collecting them
// here would mean storing data no screen can show and no module owns.
export const registerEmployerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the employer contact's name")
    .max(120, "That name is too long"),
  email: emailField,
});

export const userSearchSchema = z.object({
  q: z.string().trim().max(80).optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type RoleChangeInput = z.infer<typeof roleChangeSchema>;
export type RegisterEmployerInput = z.infer<typeof registerEmployerSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Turns a zod failure into the first human-readable message, which is what a
 * form banner shows. Field-level display can come later; one clear sentence
 * beats a list of paths.
 */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the details you entered";
}
