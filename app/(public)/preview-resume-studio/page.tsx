import type { Metadata } from "next";
import { listAssessableRoles, getPreviewAssessmentRoles } from "@/lib/api";
import { getServerSession } from "@/lib/supabase-server";
import { getResumeRecord, getResumeTarget } from "@/lib/resume-api";
import { studioRecords } from "./preview-data";
import { ResumeStudio } from "./resume-studio";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Resume studio preview", robots: { index: false, follow: false } };

export default async function ResumeStudioPreview({ searchParams }: { searchParams: Promise<{ step?: string; example?: string }> }) {
  const query = await searchParams;
  const session = await getServerSession();
  const [record, target, assessed, open] = await Promise.all([
    session ? getResumeRecord(session.access_token) : null, session ? getResumeTarget(session.access_token) : null,
    session ? listAssessableRoles(session.access_token) : null, session ? null : getPreviewAssessmentRoles(),
  ]);
  const preferences = record?.profile?.preferences;
  return <ResumeStudio initialStep={query.step === "review" ? 3 : 0} initialExample={query.example === "general" ? "general" : query.example === "targeted" ? "targeted" : null} records={studioRecords(preferences?.resumeLedger)}
    role={target?.role?.title ?? ""} track={preferences?.track === "student" ? "student" : preferences?.track === "early_career" ? "early_career" : ""}
    unavailable={Boolean(session && !record)} roles={assessed?.roles ?? (open?.roles ?? []).map(item => ({ roleId: item.roleId, roleTitle: item.title, chosen: false, current: false, hasAssessment: true, sittings: 0, lastReadiness: null }))} />;
}
