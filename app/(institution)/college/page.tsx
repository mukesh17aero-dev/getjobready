import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { collegeAccess, cohortOverview, cohortRoster } from "@/lib/api";
import { CohortDashboard } from "@/features/institution";

export const metadata = { title: "Cohort portal" };
export const dynamic = "force-dynamic";

export default async function CollegePortalPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/college");

  const token = session.access_token;
  const access = await collegeAccess(token);
  if (!access?.isMember) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-brand-ink">
          This account isn&apos;t set up as a college partner
        </h1>
        <p className="mt-3 text-slate-600">
          Ask Ascend to add your institution, then reload this page.
        </p>
      </main>
    );
  }

  const [overview, roster] = await Promise.all([
    cohortOverview(token),
    cohortRoster(token),
  ]);

  return <CohortDashboard overview={overview} roster={roster?.roster ?? null} />;
}
