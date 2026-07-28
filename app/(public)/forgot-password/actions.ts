"use server";

import type { FormState } from "@/components/action-form";
import { sendPasswordReset } from "@/modules/identity";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function forgotPasswordAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await sendPasswordReset({ email: asString(formData.get("email")) });

  if (!result.ok) return { error: result.error };

  // Worded so it is true whether or not that address has an account — saying
  // "no such account" would turn this form into a way to check who is
  // registered here.
  return {
    success:
      "If that email address has an account, a reset link is on its way. Check your inbox and your spam folder.",
  };
}
