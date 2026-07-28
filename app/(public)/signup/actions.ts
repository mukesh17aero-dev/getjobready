"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/action-form";
import { homeRouteForRole, signUpStudent } from "@/modules/identity";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function signUpAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  // No role field, and there never will be one. Self-service registration
  // creates students; admin and employer accounts are provisioned by an admin.
  const result = await signUpStudent({
    fullName: asString(formData.get("fullName")),
    email: asString(formData.get("email")),
    password: asString(formData.get("password")),
  });

  if (!result.ok) return { error: result.error };

  if (!("user" in result)) {
    return {
      success: `Almost there — we've emailed a confirmation link to ${result.email}. Click it, then sign in.`,
    };
  }

  redirect(homeRouteForRole(result.user.role));
}
