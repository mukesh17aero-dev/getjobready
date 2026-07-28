import { cookies } from "next/headers";
import { isUserRole } from "./roles";
import type { UserRole } from "./types";

const PREVIEW_COOKIE = "ascend_preview_role";

/**
 * Admin preview mode: which role's view an admin has asked to see.
 *
 * This cookie can only ever *narrow* what someone sees. An admin may already
 * open every area, so choosing to view as a student removes the admin console
 * from reach — it never adds anything. That is why a forged cookie is harmless:
 * the caller checks the real role first, and a non-admin's preview cookie is
 * ignored outright.
 *
 * "admin" is not a storable value. Previewing as yourself is simply not
 * previewing, and is represented by the absence of the cookie.
 */
export async function readPreviewRole(): Promise<UserRole | null> {
  const store = await cookies();
  const value = store.get(PREVIEW_COOKIE)?.value;
  if (!isUserRole(value) || value === "admin") return null;
  return value;
}

export async function writePreviewRole(role: UserRole | null): Promise<void> {
  const store = await cookies();

  if (!role || role === "admin") {
    store.delete(PREVIEW_COOKIE);
    return;
  }

  store.set(PREVIEW_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}
