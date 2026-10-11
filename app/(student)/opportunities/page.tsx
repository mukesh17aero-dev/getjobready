import { getOpportunities, getJourneyState } from "@/lib/api";
import { getServerSession } from "@/lib/supabase-server";
import { BackLink } from "@/components/ui/back-link";
import { OpportunityList } from "@/features/opportunities";

// Real, live job openings, read from NewEra (a separate job portal). This is
// not the matched, ranked shortlist the original design imagined - that
// needs candidate-specific matching this product does not have yet. What is
// here is honest and useful on its own: real employers, real roles, applied
// to directly on NewEra.

export const metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ profileType?: string }> }) {
  const [session, params, result] = await Promise.all([getServerSession(), searchParams, getOpportunities()]);
  const journey = session ? await getJourneyState(session.access_token) : null;
  const experienced = params.profileType === "experienced" || (params.profileType !== "student" && journey?.progress?.track === "early_career");

  return (
    <main className="mx-auto w-full max-w-(--page-max-width) px-4 pb-16 pt-4 sm:px-6">
      <BackLink fallbackHref="/" fallbackLabel="Back to Home" />

      <header className="mt-4 mb-6">
        <p className="mb-2 text-sm font-semibold text-brand-violet-deep">Find your next step</p>
        <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-tight text-brand-ink">
          {experienced ? "Your next job starts with a useful shortlist." : "Your first job starts with a useful shortlist."}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          Browse openings from NewEra. You’ll apply on their website.
        </p>
      </header>

      <OpportunityList
        initialExperience={experienced ? "1-3" : "0-1"}
        opportunities={result?.opportunities ?? []}
        status={result?.status ?? "unavailable"}
      />
    </main>
  );
}
