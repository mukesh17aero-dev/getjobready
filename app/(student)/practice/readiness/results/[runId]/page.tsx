import Link from "next/link";
import { getServerSession } from "@/lib/supabase-server";
import { getAssessmentReadout, getJourneyState } from "@/lib/api";
import { SAMPLE_READINESS } from "@/features/assessment";
import { AssessmentReadout } from "@/features/assessment";
import { BackLink } from "@/components/ui/back-link";

// One past sitting, reopened.
//
// The same read-out the sitting ended on, from the same endpoint - the run is
// scoped to its owner server-side, so a run id in the URL belonging to someone
// else is a 404 rather than somebody else's work.

export const metadata = { title: "Readiness sitting" };
export const dynamic = "force-dynamic";

export default async function PastSittingPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const session = await getServerSession();

  // The worked example: open to anybody, and labelled on the way in. A
  // visitor's results list points here; a signed-in person's never does, but
  // the page reads the same for them if they land on it.
  if (runId === SAMPLE_READINESS.readout.runId || !session) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4">
          <BackLink fallbackHref="/practice/readiness/results" fallbackLabel="Back to results" />
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-teal/40 bg-teal-50 px-4 py-3 text-[0.88rem] text-slate-700">
          <p>
            <strong className="text-brand-ink">This is an example.</strong> Somebody else&apos;s sitting,
            so you can see what a result holds. Yours is measured from your own work.
          </p>
          <Link
            href="/practice/readiness"
            className="text-[0.84rem] font-semibold text-teal-700 underline underline-offset-4"
          >
            Sit the assessment →
          </Link>
        </div>
        <AssessmentReadout
          readout={SAMPLE_READINESS.readout}
          roleTitle={SAMPLE_READINESS.roleTitle}
          backHref="/practice/readiness/results"
          example={SAMPLE_READINESS.review}
        />
      </main>
    );
  }

  const [readout, state] = await Promise.all([
    getAssessmentReadout(session.access_token, runId),
    getJourneyState(session.access_token),
  ]);

  if (!readout) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <BackLink
          fallbackHref="/practice/readiness/results"
          fallbackLabel="Back to your results"
        />
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[0.88rem] text-amber-900">
          That sitting is not one of yours, or it no longer exists.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <BackLink
          fallbackHref="/practice/readiness/results"
          fallbackLabel="Back to your results"
        />
      </div>
      <AssessmentReadout
        readout={readout}
        roleTitle={state?.progress?.role?.title ?? "your role"}
        backHref="/practice/readiness/results"
      />
    </main>
  );
}
