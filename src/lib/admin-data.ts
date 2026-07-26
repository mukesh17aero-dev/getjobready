import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataResult } from "@/lib/dashboard-data";

export interface AdminDimensionData {
  dimensionId: string;
  name: string;
  weight: number;
  active: boolean;
}

interface DimensionRow {
  dimension_id: string;
  name: string;
  weight: number;
  active: boolean;
}

// Unlike getDimensionCards (student-facing), this deliberately does NOT
// filter by active=true — an admin must be able to see and reactivate an
// inactive dimension, not just the ones currently visible to students.
export async function getAdminDimensions(
  supabase: SupabaseClient
): Promise<DataResult<AdminDimensionData[]>> {
  const { data, error } = await supabase
    .from("employability_dimensions")
    .select("dimension_id, name, weight, active")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch employability_dimensions (admin):", error.message);
    return { ok: false, error: "dimensions_fetch_failed" };
  }

  return {
    ok: true,
    data: ((data ?? []) as DimensionRow[]).map((d) => ({
      dimensionId: d.dimension_id,
      name: d.name,
      weight: d.weight,
      active: d.active,
    })),
  };
}
