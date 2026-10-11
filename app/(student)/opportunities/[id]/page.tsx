import { notFound } from "next/navigation";
import { getOpportunities } from "@/lib/api";
import { BackLink } from "@/components/ui/back-link";
import { OpportunityDetail, OpportunityList } from "@/features/opportunities";

export const metadata = { title: "Job details" };
export const dynamic = "force-dynamic";

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getOpportunities();
  const job = result?.opportunities.find((opportunity) => opportunity.id === id);
  if (result?.status === "fetched" && !job) notFound();

  return (
    <main className="mx-auto w-full max-w-(--page-max-width) px-4 pb-16 pt-4 sm:px-6">
      <BackLink fallbackHref="/opportunities" fallbackLabel="Back to Opportunities" />
      {job ? <OpportunityDetail job={job} /> : <div className="mt-5"><OpportunityList opportunities={[]} status={result?.status ?? "unavailable"} /></div>}
    </main>
  );
}
