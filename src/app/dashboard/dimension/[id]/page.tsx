import { Suspense } from "react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getDimensionDetail } from "@/lib/dashboard-data";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/components/dashboard/dimension-cards";
import { EvidenceTimeline } from "@/components/dashboard/evidence-timeline";
import { EvidencePageSkeleton } from "@/components/dashboard/evidence-page-skeleton";
import { DashboardSectionError } from "@/components/dashboard/dashboard-section-error";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface DimensionPageProps {
  params: Promise<{ id: string }>;
}

export default async function DimensionDetailPage({ params }: DimensionPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-purple-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
      >
        ← Back to dashboard
      </Link>

      <Suspense fallback={<EvidencePageSkeleton />}>
        <DimensionDetailSection supabase={supabase} studentId={user.id} dimensionId={id} />
      </Suspense>
    </main>
  );
}

interface SectionProps {
  supabase: SupabaseClient;
  studentId: string;
  dimensionId: string;
}

async function DimensionDetailSection({
  supabase,
  studentId,
  dimensionId,
}: SectionProps) {
  const result = await getDimensionDetail(supabase, studentId, dimensionId);

  if (!result.ok) {
    if (result.error === "dimension_not_found") {
      notFound();
    }
    return (
      <DashboardSectionError message="We couldn't load this dimension's evidence. Please refresh the page." />
    );
  }

  const detail = result.data;

  return (
    <>
      <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-purple-900">
            {detail.dimensionName}
          </h1>
          <span
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[detail.status]}`}
          >
            {STATUS_LABELS[detail.status]}
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
          <div>
            <dt className="text-xs text-gray-400">Score</dt>
            <dd>{detail.score !== null ? Math.round(detail.score) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Evidence</dt>
            <dd>
              {detail.evidenceCount}{" "}
              {detail.evidenceCount === 1 ? "item" : "items"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-gray-400">Last updated</dt>
            <dd>{detail.lastUpdatedAt ? formatDate(detail.lastUpdatedAt) : "Never"}</dd>
          </div>
        </dl>
        {detail.ruleDescription && (
          <p className="mt-3 text-xs text-gray-500">{detail.ruleDescription}</p>
        )}
      </div>

      {detail.evidenceItems.length === 0 ? (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-gray-700 shadow-sm">
          <p className="font-medium text-purple-700">No evidence yet</p>
          <p className="mt-1">
            Complete an assessment in {detail.dimensionName} — a quiz, interview,
            or task — and it will show up here as evidence toward this
            dimension.
          </p>
        </div>
      ) : (
        <EvidenceTimeline items={detail.evidenceItems} />
      )}
    </>
  );
}
