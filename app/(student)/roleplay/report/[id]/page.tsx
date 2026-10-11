import Link from "next/link";
import { getServerSession } from "@/lib/supabase-server";
import { getRoleplayReport, RoleplaySummary } from "@/features/roleplay";
import { BackLink } from "@/components/ui/back-link";
import { whenLabel } from "@/lib/when";

// One finished roleplay, reopened - its feedback from the person's own saved
// record. Linked from the Passport and the roleplay history.

export const metadata = { title: "Roleplay report" };
export const dynamic = "force-dynamic";

export default async function RoleplayReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  const report = session ? await getRoleplayReport(session.access_token, id) : null;

  return (
    <main className="mx-auto w-full max-w-(--page-max-width) px-4 pb-16 pt-4 sm:px-6">
      <BackLink fallbackHref="/roleplay" fallbackLabel="Back to roleplay" />
      {!report ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[0.88rem] text-amber-900">
          {session ? "That roleplay is not one of yours, or it no longer exists." : "Sign in to see your roleplay reports."}
        </p>
      ) : (
        <>
          <header className="mb-4 mt-4">
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-slate-500">
              AI roleplay · {report.difficulty === "challenging" ? "Challenging" : "Standard"} · {whenLabel(report.completedAt)}
            </p>
            <h1 className="mt-1 font-display text-[clamp(1.5rem,3vw,2rem)] font-bold text-brand-ink">{report.scenarioTitle}</h1>
          </header>
          <RoleplaySummary summary={report.summary} scenarioTitle={report.scenarioTitle} />
          <Link href="/roleplay" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white hover:bg-brand-teal">
            Practise another conversation
          </Link>
        </>
      )}
    </main>
  );
}
