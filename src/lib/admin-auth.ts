import { requireEnv } from "@/lib/env";

// Parses ADMIN_EMAILS (comma-separated) fresh on each call — cheap, and
// called infrequently (once per /admin request in middleware, once per
// dimension edit in the Server Action). Kept as the single place this list
// is parsed so middleware.ts and the Server Action can never drift apart.
function getAdminEmails(): string[] {
  return requireEnv("ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return getAdminEmails().includes(email.trim().toLowerCase());
}
