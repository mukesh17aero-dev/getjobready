import Link from "next/link";
import { getServerSession } from "@/lib/supabase-server";
import { getInterviewReport, InterviewSummary } from "@/features/interview";
import { BackLink } from "@/components/ui/back-link";
import { whenLabel } from "@/lib/when";

// One finished interview, reopened - the read-out it ended on, from the
// person's own saved record. Linked from the Passport. Someone else's id is
// "not found", never their work.

export const metadata = { title: "Interview report" };
export const dynamic = "force-dynamic";

export default async function InterviewReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  const report = session ? await getInterviewReport(session.access_token, id) : null;

  return (
    <main className="mx-auto w-full max-w-(--page-max-width) px-4 pb-16 pt-4 sm:px-6">
      <BackLink fallbackHref="/passport" fallbackLabel="Back to your Passport" />
      {!report ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[0.88rem] text-amber-900">
          {session ? "That interview is not one of yours, or it no longer exists." : "Sign in to see your interview reports."}
        </p>
      ) : (
        <>
          <header className="mb-4 mt-4">
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-slate-500">
              Practice interview · {report.round === "managerial" ? "Managerial" : "HR"} round · {whenLabel(report.completedAt)}
            </p>
            <h1 className="mt-1 font-display text-[clamp(1.5rem,3vw,2rem)] font-bold text-brand-ink">{report.roleTitle}</h1>
          </header>
          <InterviewSummary summary={report.summary} roleTitle={report.roleTitle} turns={report.turns} />
          <Link href="/interview/practice" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white hover:bg-brand-teal">
            Rehearse again
          </Link>
        </>
      )}
    </main>
  );
}
