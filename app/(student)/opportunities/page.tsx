import { getOpportunities } from "@/lib/api";
import { BackLink } from "@/components/ui/back-link";
import { OpportunityList } from "@/features/opportunities";

// Real, live job openings, read from NewEra (a separate job portal). This is
// not the matched, ranked shortlist the original design imagined - that
// needs candidate-specific matching this product does not have yet. What is
// here is honest and useful on its own: real employers, real roles, applied
// to directly on NewEra.

export const metadata = { title: "Opportunities" };
export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const result = await getOpportunities();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4 sm:px-6">
      <BackLink fallbackHref="/" fallbackLabel="Back to Home" />

      <header className="mt-4 mb-4">
        <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold leading-tight tracking-tight text-brand-ink">
          Opportunities
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
          Real openings, read live from NewEra. Applying happens over there —
          this is just an honest window into what is currently open.
        </p>
      </header>

      <OpportunityList
        opportunities={result?.opportunities ?? []}
        status={result?.status ?? "unavailable"}
      />
    </main>
  );
}
