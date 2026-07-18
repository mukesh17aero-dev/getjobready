import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  calculateDimensionStatus,
  calculatePRI,
  isPassportEligible,
  type DimensionStatus,
} from "@/lib/readiness-engine";

// AI evaluation (step 3 of the Build Guide's 10-step flow) and the
// recommendations it feeds (step 8) are deliberately not wired up yet —
// see docs/PLAYBOOK.md Session 6.

const AssessmentInputSchema = z.object({
  student_id: z.string().uuid(),
  dimension_id: z.string().uuid(),
  assessment_type: z.enum([
    "mock_interview",
    "quiz",
    "written_task",
    "digital_task",
    "simulation",
  ]),
  raw_score: z.number(),
  max_score: z.number().default(100),
  submission_payload: z.record(z.string(), z.unknown()).default({}),
});

interface AssessmentResultRow {
  assessment_id: string;
  normalized_score: number;
}

interface EvidenceRecordRow {
  evidence_id: string;
}

interface EvidenceScoreRow {
  score: number | null;
  verified: boolean;
  created_at: string;
}

interface ReadinessRuleRow {
  threshold: number;
  strong_threshold: number;
  min_evidence_count: number;
  evidence_validity_days: number;
  version: number;
}

interface StudentDimensionStatusRow {
  status: DimensionStatus;
  score: number | null;
}

interface EmployabilityDimensionRow {
  dimension_id: string;
  weight: number;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AssessmentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    student_id,
    dimension_id,
    assessment_type,
    raw_score,
    max_score,
    submission_payload,
  } = parsed.data;

  // Step 2: INSERT assessment_results
  const { data: assessment, error: assessmentError } = await supabaseAdmin
    .from("assessment_results")
    .insert({
      student_id,
      dimension_id,
      assessment_type,
      raw_score,
      max_score,
      submission_payload,
    })
    .select("assessment_id, normalized_score")
    .single();

  if (assessmentError || !assessment) {
    return NextResponse.json(
      { error: "Failed to record assessment", details: assessmentError?.message },
      { status: 500 }
    );
  }
  const assessmentRow = assessment as AssessmentResultRow;

  // Step 4: INSERT evidence_records (auto-verified — it came from a real assessment)
  const { data: evidence, error: evidenceError } = await supabaseAdmin
    .from("evidence_records")
    .insert({
      student_id,
      dimension_id,
      source_type: "assessment",
      source_id: assessmentRow.assessment_id,
      evidence_summary: `${assessment_type} scored ${assessmentRow.normalized_score}/100`,
      score: assessmentRow.normalized_score,
      verified: true,
    })
    .select("evidence_id")
    .single();

  if (evidenceError || !evidence) {
    return NextResponse.json(
      { error: "Failed to record evidence", details: evidenceError?.message },
      { status: 500 }
    );
  }
  const evidenceRow = evidence as EvidenceRecordRow;

  // Step 5: INSERT readiness_events
  await supabaseAdmin.from("readiness_events").insert([
    {
      student_id,
      event_type: "assessment_completed",
      payload: { assessment_id: assessmentRow.assessment_id, dimension_id },
    },
    {
      student_id,
      event_type: "evidence_created",
      payload: { evidence_id: evidenceRow.evidence_id, dimension_id },
    },
  ]);

  // Step 6a: fetch all evidence for this student+dimension, and the active rule
  const { data: evidenceRows, error: evidenceFetchError } = await supabaseAdmin
    .from("evidence_records")
    .select("score, verified, created_at")
    .eq("student_id", student_id)
    .eq("dimension_id", dimension_id);

  if (evidenceFetchError || !evidenceRows) {
    return NextResponse.json(
      { error: "Failed to fetch evidence", details: evidenceFetchError?.message },
      { status: 500 }
    );
  }

  const { data: rule, error: ruleError } = await supabaseAdmin
    .from("readiness_rules")
    .select("threshold, strong_threshold, min_evidence_count, evidence_validity_days, version")
    .eq("dimension_id", dimension_id)
    .eq("active", true)
    .single();

  if (ruleError || !rule) {
    return NextResponse.json(
      { error: "No active readiness rule for this dimension" },
      { status: 500 }
    );
  }
  const ruleRow = rule as ReadinessRuleRow;

  const evidenceItems = (evidenceRows as EvidenceScoreRow[]).map((e) => ({
    score: e.score ?? 0,
    createdAt: new Date(e.created_at),
    verified: e.verified,
  }));

  const now = new Date();

  // Step 6b: calculateDimensionStatus (the readiness engine — pure, deterministic)
  const { status, effectiveScore } = calculateDimensionStatus({
    evidenceItems,
    rule: {
      threshold: ruleRow.threshold,
      strongThreshold: ruleRow.strong_threshold,
      minEvidenceCount: ruleRow.min_evidence_count,
      validityDays: ruleRow.evidence_validity_days,
    },
    now,
  });

  const { data: existingStatus } = await supabaseAdmin
    .from("student_dimension_statuses")
    .select("status, score")
    .eq("student_id", student_id)
    .eq("dimension_id", dimension_id)
    .maybeSingle();
  const existingStatusRow = existingStatus as StudentDimensionStatusRow | null;
  const previousStatus = existingStatusRow?.status ?? "not_assessed";
  const previousScore = existingStatusRow?.score ?? null;

  // Step 6c: UPDATE student_dimension_statuses
  const { error: statusUpsertError } = await supabaseAdmin
    .from("student_dimension_statuses")
    .upsert(
      {
        student_id,
        dimension_id,
        score: effectiveScore,
        status,
        evidence_count: evidenceItems.length,
        rule_version_applied: ruleRow.version,
        last_updated_at: now.toISOString(),
      },
      { onConflict: "student_id,dimension_id" }
    );

  if (statusUpsertError) {
    return NextResponse.json(
      { error: "Failed to update dimension status", details: statusUpsertError.message },
      { status: 500 }
    );
  }

  // Step 6d: INSERT audit_log if status changed
  if (previousStatus !== status) {
    await supabaseAdmin.from("audit_log").insert({
      student_id,
      actor: "system",
      action: "status_change",
      before_state: { dimension_id, status: previousStatus, score: previousScore },
      after_state: { dimension_id, status, score: effectiveScore },
    });
  }

  // Step 7: recalculate PRI + passport eligibility, UPDATE profile
  const { data: dimensions, error: dimensionsError } = await supabaseAdmin
    .from("employability_dimensions")
    .select("dimension_id, weight")
    .eq("active", true);

  if (dimensionsError || !dimensions) {
    return NextResponse.json(
      { error: "Failed to fetch dimensions", details: dimensionsError?.message },
      { status: 500 }
    );
  }

  const { data: allStatuses, error: allStatusesError } = await supabaseAdmin
    .from("student_dimension_statuses")
    .select("dimension_id, status, score")
    .eq("student_id", student_id);

  if (allStatusesError || !allStatuses) {
    return NextResponse.json(
      { error: "Failed to fetch dimension statuses", details: allStatusesError?.message },
      { status: 500 }
    );
  }

  const statusByDimension = new Map(
    (allStatuses as (StudentDimensionStatusRow & { dimension_id: string })[]).map((s) => [
      s.dimension_id,
      s,
    ])
  );

  const dimsForPri = (dimensions as EmployabilityDimensionRow[]).map((d) => ({
    weight: d.weight,
    effectiveScore: statusByDimension.get(d.dimension_id)?.score ?? null,
  }));
  const priScore = calculatePRI(dimsForPri);

  const statusesForEligibility = (dimensions as EmployabilityDimensionRow[]).map(
    (d) => statusByDimension.get(d.dimension_id)?.status ?? "not_assessed"
  );
  const passportEligible = isPassportEligible(statusesForEligibility);

  const { error: profileError } = await supabaseAdmin
    .from("student_employability_profiles")
    .update({
      pri_score: priScore,
      passport_eligible: passportEligible,
      last_assessed_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("student_id", student_id);

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to update profile", details: profileError.message },
      { status: 500 }
    );
  }

  // Step 9: INSERT readiness_events
  await supabaseAdmin.from("readiness_events").insert({
    student_id,
    event_type: "readiness_updated",
    payload: { dimension_id, status, pri_score: priScore },
  });

  // Step 10
  return NextResponse.json({ new_status: status, pri_score: priScore });
}
