"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin-auth";

const UpdateDimensionSchema = z.object({
  dimensionId: z.string().uuid(),
  name: z.string().trim().min(1, "Name cannot be empty."),
  weight: z.coerce.number().positive("Weight must be greater than 0."),
});

// Server Actions are their own request boundary, directly invocable — this
// redirect-based error path doubles as validation-error display (read via
// ?error= on /admin, same convention /login already uses) and as the only
// way this function ever returns, so it's typed `never`.
function fail(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

export async function updateDimension(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Independent authorization check — do not rely on middleware alone.
  if (!isAdminEmail(user?.email)) {
    fail("You are not authorized to make this change.");
  }

  const parsed = UpdateDimensionSchema.safeParse({
    dimensionId: formData.get("dimensionId"),
    name: formData.get("name"),
    weight: formData.get("weight"),
  });
  if (!parsed.success) {
    fail(parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const { dimensionId, name, weight } = parsed.data;
  // Unchecked checkboxes are omitted from FormData entirely, not sent as
  // "off" — absence means false.
  const active = formData.get("active") === "on";

  // Service role: employability_dimensions has no student/admin write RLS
  // policy at all (writes are service-role-only by design), so this check
  // is the only thing standing between this action and an arbitrary write.
  const { data: allDimensions, error: fetchError } = await supabaseAdmin
    .from("employability_dimensions")
    .select("dimension_id, name, weight, active");
  if (fetchError || !allDimensions) {
    fail("Could not load current dimensions. Please try again.");
  }

  const current = allDimensions.find((d) => d.dimension_id === dimensionId);
  if (!current) {
    fail("Dimension not found.");
  }

  const duplicate = allDimensions.some(
    (d) =>
      d.dimension_id !== dimensionId &&
      d.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    fail(`Another dimension is already named "${name}".`);
  }

  const otherActiveCount = allDimensions.filter(
    (d) => d.dimension_id !== dimensionId && d.active
  ).length;
  if (otherActiveCount + (active ? 1 : 0) === 0) {
    fail("At least one dimension must remain active.");
  }

  const beforeState = {
    name: current.name,
    weight: current.weight,
    active: current.active,
  };
  const afterState = { name, weight, active };

  const { error: updateError } = await supabaseAdmin
    .from("employability_dimensions")
    .update({ name, weight, active })
    .eq("dimension_id", dimensionId);
  if (updateError) {
    fail("Failed to save changes. Please try again.");
  }

  // Mutation first, audit record after — if the audit insert fails, we
  // never end up with an audit_log entry describing a change that didn't
  // actually happen (the reverse ordering would risk exactly that).
  const { error: auditError } = await supabaseAdmin.from("audit_log").insert({
    student_id: null,
    actor: `admin:${user!.email}`,
    action: "dimension_update",
    before_state: beforeState,
    after_state: afterState,
  });
  if (auditError) {
    // The dimension change itself already succeeded. A failed audit write
    // is logged, not blocking — matching this project's established rule
    // that a secondary-system failure must never undo or block the
    // primary action (see ai-evaluator.ts). Flagged as known debt in docs.
    console.error("Failed to write audit_log for dimension_update:", auditError.message);
  }

  revalidatePath("/admin");
  redirect("/admin");
}
