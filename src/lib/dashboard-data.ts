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

// Evidence Drill-Down (Session 10) — the "why is my status what it is" page.
// AI feedback shape mirrors ai-evaluator.ts's AiEvaluationResult contract
// (assessment_results.ai_feedback stores it verbatim).
export interface EvidenceAiExplanation {
  strengths: string[];
  gaps: string[];
  studentSummary: string;
}

export interface EvidenceDetailItem {
  evidenceId: string;
  summary: string;
  source: string;
  evidenceType: string | null;
  score: number | null;
  maxScore: number | null;
  assessmentDate: string;
  isValid: boolean;
  expiryDate: string | null;
  aiExplanation: EvidenceAiExplanation | null;
}

export interface DimensionDetailData {
  dimensionId: string;
  dimensionName: string;
  status: DimensionStatus;
  score: number | null;
  evidenceCount: number;
  lastUpdatedAt: string | null;
  ruleDescription: string | null;
  evidenceItems: EvidenceDetailItem[];
}

interface DimensionDetailRow {
  dimension_id: string;
  name: string;
}

interface StatusDetailRow {
  status: DimensionStatus;
  score: number | null;
  evidence_count: number;
  last_updated_at: string;
}

interface RuleRow {
  threshold: number;
  strong_threshold: number;
  min_evidence_count: number;
  evidence_validity_days: number;
}

interface EvidenceRow {
  evidence_id: string;
  source_type: string;
  source_id: string | null;
  evidence_summary: string;
  score: number | null;
  verified: boolean;
  created_at: string;
}

interface AssessmentJoinRow {
  assessment_id: string;
  assessment_type: string;
  max_score: number;
  ai_feedback: {
    strengths?: string[];
    gaps?: string[];
    student_summary?: string;
  } | null;
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function describeRule(rule: RuleRow): string {
  return `Needs ${pluralize(rule.min_evidence_count, "piece")} of evidence scoring ${rule.threshold}+ within the last ${rule.evidence_validity_days} days.`;
}

export async function getDimensionDetail(
  supabase: SupabaseClient,
  studentId: string,
  dimensionId: string
): Promise<DataResult<DimensionDetailData>> {
  const [
    { data: dimension, error: dimensionError },
    { data: statusRow, error: statusError },
    { data: ruleRow, error: ruleError },
    { data: evidenceRows, error: evidenceError },
  ] = await Promise.all([
    supabase
      .from("employability_dimensions")
      .select("dimension_id, name")
      .eq("dimension_id", dimensionId)
      .maybeSingle(),
    supabase
      .from("student_dimension_statuses")
      .select("status, score, evidence_count, last_updated_at")
      .eq("student_id", studentId)
      .eq("dimension_id", dimensionId)
      .maybeSingle(),
    // Rule lookup is dimension-only (no target_role_id join) — the MVP
    // supports exactly one target role (BUILD_GUIDE.md, PROJECT_CONTEXT.md
    // Known Constraints). Revisit with a target_role_id join if a second
    // role is ever added.
    supabase
      .from("readiness_rules")
      .select("threshold, strong_threshold, min_evidence_count, evidence_validity_days")
      .eq("dimension_id", dimensionId)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("evidence_records")
      .select("evidence_id, source_type, source_id, evidence_summary, score, verified, created_at")
      .eq("student_id", studentId)
      .eq("dimension_id", dimensionId)
      .order("created_at", { ascending: false }),
  ]);

  if (dimensionError) {
    console.error("Failed to fetch employability_dimensions:", dimensionError.message);
    return { ok: false, error: "dimension_fetch_failed" };
  }
  if (!dimension) {
    return { ok: false, error: "dimension_not_found" };
  }
  if (statusError) {
    console.error("Failed to fetch student_dimension_statuses:", statusError.message);
    return { ok: false, error: "status_fetch_failed" };
  }
  if (ruleError) {
    console.error("Failed to fetch readiness_rules:", ruleError.message);
    return { ok: false, error: "rule_fetch_failed" };
  }
  if (evidenceError) {
    console.error("Failed to fetch evidence_records:", evidenceError.message);
    return { ok: false, error: "evidence_fetch_failed" };
  }

  const dimensionRow = dimension as DimensionDetailRow;
  const status = (statusRow as StatusDetailRow | null)?.status ?? "not_assessed";
  const score = (statusRow as StatusDetailRow | null)?.score ?? null;
  const evidenceCount = (statusRow as StatusDetailRow | null)?.evidence_count ?? 0;
  const lastUpdatedAt = (statusRow as StatusDetailRow | null)?.last_updated_at ?? null;
  const rule = ruleRow as RuleRow | null;

  const evidence = (evidenceRows ?? []) as EvidenceRow[];
  const sourceIds = evidence
    .map((e) => e.source_id)
    .filter((id): id is string => id !== null);

  // Batched, not per-item — avoids N+1 against assessment_results.
  // A failure here degrades gracefully (evidence still renders without the
  // assessment-joined fields) rather than failing the whole page, since the
  // evidence_records data alone is still useful.
  let assessmentById = new Map<string, AssessmentJoinRow>();
  if (sourceIds.length > 0) {
    const { data: assessments, error: assessmentsError } = await supabase
      .from("assessment_results")
      .select("assessment_id, assessment_type, max_score, ai_feedback")
      .in("assessment_id", sourceIds);

    if (assessmentsError) {
      console.error("Failed to fetch assessment_results:", assessmentsError.message);
    } else {
      assessmentById = new Map(
        ((assessments ?? []) as AssessmentJoinRow[]).map((a) => [a.assessment_id, a])
      );
    }
  }

  const now = new Date();
  const validCutoff = rule
    ? new Date(now.getTime() - rule.evidence_validity_days * 24 * 60 * 60 * 1000)
    : null;

  const evidenceItems: EvidenceDetailItem[] = evidence.map((e) => {
    const assessment = e.source_id ? assessmentById.get(e.source_id) : undefined;
    const createdAt = new Date(e.created_at);
    const isValid = e.verified && (validCutoff === null || createdAt >= validCutoff);
    const expiryDate = rule
      ? new Date(
          createdAt.getTime() + rule.evidence_validity_days * 24 * 60 * 60 * 1000
        ).toISOString()
      : null;
    const feedback = assessment?.ai_feedback;

    return {
      evidenceId: e.evidence_id,
      summary: e.evidence_summary,
      source: e.source_type,
      evidenceType: assessment?.assessment_type ?? null,
      score: e.score,
      maxScore: assessment?.max_score ?? null,
      assessmentDate: e.created_at,
      isValid,
      expiryDate,
      aiExplanation:
        feedback && feedback.student_summary
          ? {
              strengths: feedback.strengths ?? [],
              gaps: feedback.gaps ?? [],
              studentSummary: feedback.student_summary,
            }
          : null,
    };
  });

  return {
    ok: true,
    data: {
      dimensionId: dimensionRow.dimension_id,
      dimensionName: dimensionRow.name,
      status,
      score,
      evidenceCount,
      lastUpdatedAt,
      ruleDescription: rule ? describeRule(rule) : null,
      evidenceItems,
    },
  };
}
