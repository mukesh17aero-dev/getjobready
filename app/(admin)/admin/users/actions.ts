"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { changeUserRole } from "@/modules/identity";

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

/**
 * `query` is bound by the page so the admin returns to the same filtered list
 * they were looking at, rather than to an unfiltered one they have to search
 * again.
 *
 * Note what is NOT passed: who is doing this. The module reads the acting admin
 * from the session itself, so no form field can claim to be someone else.
 */
export async function changeRoleAction(
  query: string,
  formData: FormData
): Promise<void> {
  const result = await changeUserRole({
    userId: asString(formData.get("userId")),
    role: asString(formData.get("role")),
  });

  const params = new URLSearchParams();
  if (query) params.set("q", query);

  if (!result.ok) {
    params.set("error", result.error);
  } else {
    params.set("ok", `${result.user.email} is now ${result.user.role}.`);
    revalidatePath("/admin/users");
  }

  redirect(`/admin/users?${params.toString()}`);
}
