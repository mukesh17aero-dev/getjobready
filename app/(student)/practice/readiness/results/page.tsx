import Link from "next/link";
import { getServerSession } from "@/lib/supabase-server";
import { listAssessmentRuns, type PastRun } from "@/lib/api";
import { SAMPLE_READINESS } from "@/features/assessment";
import { BackLink } from "@/components/ui/back-link";

// Every readiness assessment this person has finished.
//
// Finished only, and newest first. One they walked away from has no result
// worth opening, so listing it would be a door onto a page that says nothing.
//
// One with no score is shown as having no score - "not read" - rather than as
// a zero or as a gap. The read-through is a model call and it can fail; what
// happened in the twenty minutes is still theirs either way.

export const metadata = { title: "Past results" };
export const dynamic = "force-dynamic";

/**
 * When it finished, with the zone said out loud.
 *
 * Fixed to IST rather than the viewer's own clock. This page is rendered on
 * the server, so "local time" would be the server's - which is not a timezone
 * anybody reading this is in. Pinning it and naming it is the honest version:
 * the label is what makes the number mean something, and somebody sitting
 * elsewhere can see at a glance which clock it is on.
 */
function when(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  });
}

export default async function ReadinessResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const session = await getServerSession();
  const [{ role }, listed] = await Promise.all([
    searchParams,
    session ? listAssessmentRuns(session.access_token) : null,
  ]);
  // A visitor sees one worked example, labelled as one: what a finished
  // sitting produces, from a sitting that was never theirs.
  const example: PastRun | null = session
    ? null
    : {
        runId: SAMPLE_READINESS.readout.runId,
        roleId: SAMPLE_READINESS.readout.roleId,
        roleTitle: SAMPLE_READINESS.roleTitle,
        startedAt: SAMPLE_READINESS.readout.finishedAt ?? "",
        finishedAt: SAMPLE_READINESS.readout.finishedAt ?? "",
        scenesAttempted: SAMPLE_READINESS.readout.scenesAttempted,
        readiness: SAMPLE_READINESS.review.readiness.score,
        confidence: SAMPLE_READINESS.review.confidence,
      };
  const all = listed?.runs ?? (example ? [example] : []);
  // Narrowed to one job when they arrived from that job's start screen: the
  // question they came with was "how am I doing on this one", and answering it
  // with every job they have ever tried is answering a different question.
  const runs = role ? all.filter((r) => r.roleId === role) : all;
  const only = role ? (runs[0]?.roleTitle ?? null) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <BackLink fallbackHref="/practice" fallbackLabel="Back to Practice" />

      <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
        {example ? "What a result looks like" : only ? `Your results — ${only}` : "Your past results"}
      </h1>
      <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-slate-600">
        {example
          ? "One example sitting, not yours. Every assessment you finish is kept here, newest first, because what changes between two of them says more than either one on its own."
          : "Every assessment you have finished, newest first. Each one is a reading of workplace tasks — they are all kept because what changes between two of them says more than either one on its own."}
      </p>
      {role && all.length > runs.length && (
        <Link
          href="/practice/readiness/results"
          className="mt-2 inline-block text-[0.84rem] text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
        >
          Show every job
        </Link>
      )}

      {runs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 p-5">
          <p className="text-[0.9rem] leading-relaxed text-slate-600">
            Nothing here yet. Your first assessment is 12 questions about one
            job&apos;s actual work, and what it finds turns up on this page.
          </p>
          <Link
            href="/practice/readiness"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-violet px-5 text-[0.88rem] font-bold text-white transition-colors hover:bg-brand-violet-deep"
          >
            Take the assessment
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {runs.map((r) => (
            <li
              key={r.runId}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 p-4"
            >
              {/* The score leads, because it is what somebody came for - and
                  when there is not one, the space says so rather than
                  standing empty. */}
              <div className="w-16 shrink-0">
                {r.readiness !== null ? (
                  <>
                    <p className="text-2xl font-semibold leading-none text-slate-900">
                      {r.readiness}
                    </p>
                    <p className="mt-0.5 text-[0.66rem] uppercase tracking-[0.1em] text-slate-400">
                      of 100
                    </p>
                  </>
                ) : (
                  <p className="text-[0.78rem] leading-tight text-slate-400">
                    Not read
                  </p>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[0.95rem] font-semibold text-slate-900">
                  {r.roleTitle}
                  {example && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-amber-700">
                      Example
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[0.8rem] text-slate-500">
                  {when(r.finishedAt)} · {r.scenesAttempted}{" "}
                  {r.scenesAttempted === 1 ? "situation" : "situations"} worked
                  through
                </p>
              </div>

              <Link
                href={`/practice/readiness/results/${r.runId}`}
                className="min-h-11 shrink-0 rounded-lg border border-slate-300 px-4 py-2.5 text-[0.84rem] font-semibold text-slate-700 transition-colors hover:border-slate-400"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
