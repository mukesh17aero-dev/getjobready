"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/action-form";
import { postSignInRoute, safeNextPath, signInWithPassword } from "@/modules/identity";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function signInAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const next = safeNextPath(asString(formData.get("next")));

  const result = await signInWithPassword({
    identifier: asString(formData.get("identifier")),
    password: asString(formData.get("password")),
  });

  if (!result.ok) return { error: result.error };

  // The confirmation branch cannot arise from a password sign-in, but the
  // outcome type covers sign-up too, so it is handled rather than cast away.
  if (!("user" in result)) {
    return { error: "Confirm your email address first, then sign in." };
  }

  // Outside any try/catch: redirect works by throwing.
  redirect(postSignInRoute(result.user.role, next));
}
