import { getServerSession } from "@/lib/supabase-server";
import { getJobFit, getOpportunities } from "@/lib/api";
import { JobFitStudio, SAMPLE_JOB_FIT } from "@/features/job-fit";

export const metadata = { title: "Profile fit for this job" };
export const dynamic = "force-dynamic";

export default async function JobFitPage({ searchParams }: {
  searchParams: Promise<{ opportunity?: string | string[]; check?: string | string[] }>;
}) {
  const [session, params] = await Promise.all([getServerSession(), searchParams]);
  const opportunityId = typeof params.opportunity === "string" ? params.opportunity.slice(0, 200) : null;
  const checkId = typeof params.check === "string" ? params.check : null;
  const [state, listed] = await Promise.all([
    session ? getJobFit(session.access_token, checkId) : Promise.resolve(null),
    opportunityId ? getOpportunities() : Promise.resolve(null),
  ]);
  const opportunity = listed?.opportunities.find(job => job.id === opportunityId) ?? null;
  const listingError = opportunityId && !opportunity ? listed?.status === "fetched"
    ? "This job is no longer listed. Choose another opening."
    : "Job listings are temporarily unavailable. Reload to try again." : null;
  if (session && !state) return <main className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-xl font-bold">Your saved comparisons could not load</h1><p>Give it a moment and reload. Your profile is safe.</p></main>;
  return <JobFitStudio key={`${opportunityId ?? ""}:${checkId ?? ""}`} checks={state?.checks ?? [SAMPLE_JOB_FIT]} signedOut={!session}
    opportunityId={opportunityId} opportunity={opportunity} listingError={listingError} initialCheckId={checkId} />;
}
