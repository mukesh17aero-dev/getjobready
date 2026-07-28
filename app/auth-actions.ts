"use server";

import { redirect } from "next/navigation";
import {
  safeNextPath,
  setPreviewRole,
  signOut,
  startGoogleSignIn,
} from "@/modules/identity";

/**
 * Shared by the signed-in headers in all three role areas.
 *
 * `redirect` inside a Server Action responds 303, which is what turns the
 * browser's POST into a GET for the homepage. A 307 preserves the method and
 * the homepage answers `405 Method Not Allowed` — the exact bug fixed in commit
 * b0484b5, reintroduced every time someone reaches for a route handler here.
 */
export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/");
}

/**
 * Shared by the sign-in and sign-up pages: Google is the same hand-off either
 * way. Whether an account is created or matched is Google's and Supabase's
 * business, not two different buttons.
 */
/**
 * The admin "view as" switcher. The module refuses this for anyone who is not
 * really an admin, so the worst a crafted request can do is nothing.
 */
export async function setPreviewRoleAction(formData: FormData): Promise<void> {
  const role = formData.get("role");
  const result = await setPreviewRole(typeof role === "string" ? role : null);

  redirect(result.ok ? result.redirectTo : "/");
}

/** Leaves preview and returns to the admin console. */
export async function exitPreviewAction(): Promise<void> {
  const result = await setPreviewRole(null);
  redirect(result.ok ? result.redirectTo : "/");
}

export async function googleSignInAction(next: string | null): Promise<void> {
  const result = await startGoogleSignIn(safeNextPath(next));

  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }

  redirect(result.url);
}
