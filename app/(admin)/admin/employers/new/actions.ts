"use server";

import type { FormState } from "@/components/action-form";
import { registerEmployer } from "@/modules/identity";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function registerEmployerAction(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await registerEmployer({
    fullName: asString(formData.get("fullName")),
    email: asString(formData.get("email")),
  });

  if (!result.ok) return { error: result.error };

  return {
    success: `Invitation sent to ${result.email}. They set their own password from the link, then land on the employer portal.`,
  };
}
