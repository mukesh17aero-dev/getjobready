import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { DimensionStatus } from "@/lib/readiness-engine";

const STATUS_LABELS: Record<DimensionStatus, string> = {
  not_assessed: "Not Assessed",
  developing: "Developing",
  meets_standard: "Meets Standard",
  strong: "Strong",
  outdated: "Outdated",
};

// Exact mapping specified in docs/PLAYBOOK.md Session 8.
const STATUS_BADGE_CLASSES: Record<DimensionStatus, string> = {
  not_assessed: "bg-gray-200 text-gray-700",
  developing: "bg-amber-100 text-amber-800",
  meets_standard: "bg-green-100 text-green-800",
  strong: "bg-purple-100 text-purple-800",
  outdated: "bg-red-100 text-red-800",
};

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

interface DimensionCardData {
  dimensionId: string;
  name: string;
  status: DimensionStatus;
  score: number | null;
  evidenceCount: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Both queries go through the request-scoped, cookie-based client, so
  // RLS (not the service role) decides what comes back — a student can
  // only ever see their own dimension statuses.
  const [{ data: dimensions }, { data: statuses }] = await Promise.all([
    supabase
      .from("employability_dimensions")
      .select("dimension_id, name")
      .eq("active", true),
    supabase
      .from("student_dimension_statuses")
      .select("dimension_id, status, score, evidence_count")
      .eq("student_id", user.id),
  ]);

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

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-purple-900">
            Welcome, {user.email}
          </h1>
          <p className="text-sm text-gray-500">Your employability readiness</p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white"
          >
            Log out
          </button>
        </form>
      </div>

      <section className="flex flex-col gap-3">
        {cards.map((card) => (
          <div
            key={card.dimensionId}
            className="rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium text-gray-900">{card.name}</h2>
              <span
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[card.status]}`}
              >
                {STATUS_LABELS[card.status]}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-600">
              <span>
                Score: {card.score !== null ? Math.round(card.score) : "—"}
              </span>
              <span>
                {card.evidenceCount}{" "}
                {card.evidenceCount === 1 ? "evidence item" : "evidence items"}
              </span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
