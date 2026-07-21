import type { SupabaseClient } from "@supabase/supabase-js";
import type { DimensionStatus } from "@/lib/readiness-engine";

// Data-fetching + transformation for the student dashboard. Every function
// here goes through the caller's RLS-respecting Supabase client (never the
// service role) — students may only ever see their own data. Each function
// returns a DataResult instead of throwing, so a query failure can render a
// friendly, distinguishable error state instead of silently looking like
// "no data yet" (see PROJECT_CONTEXT.md, Session 8 RLS incident).
export type DataResult<T> = { ok: true; data: T } | { ok: false; error: string };

interface DimensionRow {
  dimension_id: string;
  name: string;
}

interface StatusRow {
  dimension_id: string;
  status: DimensionStatus;
  score: number | null;
  evidence_count: number;
}

export interface DimensionCardData {
  dimensionId: string;
  name: string;
  status: DimensionStatus;
  score: number | null;
  evidenceCount: number;
}

export async function getDimensionCards(
  supabase: SupabaseClient,
  studentId: string
): Promise<DataResult<DimensionCardData[]>> {
  const [
    { data: dimensions, error: dimensionsError },
    { data: statuses, error: statusesError },
  ] = await Promise.all([
    supabase
      .from("employability_dimensions")
      .select("dimension_id, name")
      .eq("active", true),
    supabase
      .from("student_dimension_statuses")
      .select("dimension_id, status, score, evidence_count")
      .eq("student_id", studentId),
  ]);

  if (dimensionsError) {
    console.error("Failed to fetch employability_dimensions:", dimensionsError.message);
    return { ok: false, error: "dimensions_fetch_failed" };
  }
  if (statusesError) {
    console.error("Failed to fetch student_dimension_statuses:", statusesError.message);
    return { ok: false, error: "statuses_fetch_failed" };
  }

  const statusByDimension = new Map(
    ((statuses ?? []) as StatusRow[]).map((s) => [s.dimension_id, s])
  );

  const cards: DimensionCardData[] = ((dimensions ?? []) as DimensionRow[]).map(
    (d) => {
      const s = statusByDimension.get(d.dimension_id);
      return {
        dimensionId: d.dimension_id,
        name: d.name,
        status: s?.status ?? "not_assessed",
        score: s?.score ?? null,
        evidenceCount: s?.evidence_count ?? 0,
      };
    }
  );

  return { ok: true, data: cards };
}

interface ProfileRow {
  pri_score: number | null;
}

export async function getPriScore(
  supabase: SupabaseClient,
  studentId: string
): Promise<DataResult<number | null>> {
  const { data, error } = await supabase
    .from("student_employability_profiles")
    .select("pri_score")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch student_employability_profiles:", error.message);
    return { ok: false, error: "pri_fetch_failed" };
  }

  return { ok: true, data: (data as ProfileRow | null)?.pri_score ?? null };
}

// Fields beyond actionText/actionLink/dimensionName are reserved for a
// future AI-generated layer (reasoning, confidence, estimated impact,
// estimated completion time) — deliberately optional and unpopulated today
// so NextBestActionCard's contract doesn't need to change shape later.
export interface RecommendationData {
  actionText: string;
  actionLink: string | null;
  dimensionName: string | null;
  reasoning?: string;
  confidence?: number;
  estimatedImpact?: string;
  estimatedCompletionMinutes?: number;
}

interface RecommendationRow {
  action_text: string;
  action_link: string | null;
  employability_dimensions: { name: string } | null;
}

export async function getNextBestAction(
  supabase: SupabaseClient,
  studentId: string
): Promise<DataResult<RecommendationData | null>> {
  const { data, error } = await supabase
    .from("recommendations")
    .select("action_text, action_link, employability_dimensions(name)")
    .eq("student_id", studentId)
    .eq("completed", false)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch recommendations:", error.message);
    return { ok: false, error: "recommendation_fetch_failed" };
  }
  if (!data) {
    return { ok: true, data: null };
  }

  const row = data as unknown as RecommendationRow;
  return {
    ok: true,
    data: {
      actionText: row.action_text,
      actionLink: row.action_link,
      dimensionName: row.employability_dimensions?.name ?? null,
    },
  };
}
