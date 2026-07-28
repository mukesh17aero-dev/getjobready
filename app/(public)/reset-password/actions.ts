"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/action-form";
import { getCurrentUser, homeRouteForRole, updatePassword } from "@/modules/identity";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function resetPasswordAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await updatePassword({
    password: asString(formData.get("password")),
    confirmPassword: asString(formData.get("confirmPassword")),
  });

  if (!result.ok) return { error: result.error };

  // Following the emailed link already signed them in, so there is nothing left
  // to do but send them where they belong.
  const user = await getCurrentUser();
  redirect(user ? homeRouteForRole(user.role) : "/login");
}
