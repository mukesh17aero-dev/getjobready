import { getServerSession } from "@/lib/supabase-server";
import {
  getJourneyState,
  getPreviewAssessmentRoles,
  listAssessableRoles,
  type AssessableRole,
} from "@/lib/api";
import { AssessmentRun } from "@/components/assessment-run";
import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { ReadinessStart } from "./start-screen";

// Sitting the role readiness assessment.
//
// The URL or saved direction selects an offered role. The assessment API
// controls availability; a failed lookup is not a missing Discovery choice.

export const metadata = { title: "Role readiness" };
export const dynamic = "force-dynamic";

export default async function ReadinessRunPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; begin?: string }>;
}) {
  const session = await getServerSession();

  // Signed out this page opens rather than redirecting to a login form.
  //
  // It used to send anybody without an account straight to /login, which asks
  // for the commitment before giving any reason for it. What this assessment
  // is - the job's own work, one situation at a time, with AI assistance on
  // the first two questions - is a thing somebody sees in one scene and cannot be
  // told. So the first situation is public, and the account is asked for at
  // the three points that produce a record: an answer, a question to the
  // AI assistant, and the score.
  const [{ role: asked, begin }, state, listed, open] = await Promise.all([
    searchParams,
    session ? getJourneyState(session.access_token) : null,
    session ? listAssessableRoles(session.access_token) : null,
    session ? null : getPreviewAssessmentRoles(),
  ]);

  // Signed out, every role with a published assessment is on offer - there is
  // no record to narrow it by, and nothing is kept either way.
  const roles: AssessableRole[] =
    listed?.roles ??
    (open?.roles ?? []).map((r) => ({
      roleId: r.roleId,
      roleTitle: r.title,
      hasAssessment: true,
      sittings: 0,
      lastReadiness: null,
      chosen: false,
      current: false,
    }));
  const current = state?.progress?.role ?? null;
  // Prefer a valid URL choice, then the saved direction, then the API's order.
  const picked =
    roles.find((r) => r.roleId === asked) ??
    roles.find((r) => r.roleId === current?.id) ??
    roles[0] ??
    null;

  const unavailable = session ? listed === null : open === null;
  if (unavailable || !picked) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <BackLink fallbackHref="/practice" fallbackLabel="Back to Practice" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          {unavailable ? "We couldn’t load your assessments" : "No assessments are available yet"}
        </h1>
        {current && <p className="mt-3 text-sm font-semibold text-slate-900">Your chosen role: {current.title}</p>}
        <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-600">
          {unavailable
            ? "The assessment service is temporarily unavailable. Try again to load the available assessments."
            : "There are no published assessments available to start right now. Please check back soon."}
          {current && " Your role choice is saved; you do not need to choose it again."}
        </p>
        <a href={`/practice/readiness${asked ? `?role=${encodeURIComponent(asked)}` : ""}`} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand-violet px-5 text-sm font-bold text-white">Try again</a>
        <Link href="/practice" className="ml-4 inline-flex min-h-11 items-center text-sm font-semibold text-slate-600">Back to Practice</Link>
      </main>
    );
  }

  // The choice comes before the scenario. Being dropped into a first day at a
  // company you did not pick, with the job named in a dropdown above it, put
  // the decision after the thing it decides.
  if (!begin) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <BackLink fallbackHref="/practice" fallbackLabel="Back to Practice" />
        <div className="mt-5">
          <ReadinessStart key={picked.roleId} roles={roles} initialRoleId={picked.roleId} />
        </div>
      </main>
    );
  }

  // Wider than the rest of the app on purpose: the sitting is three columns -
  // where you are, the work, and whoever you are talking to - and squeezing
  // that into the two-column reading width is what pushed the answer box off
  // the screen.
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* A way out that is not "End assessment". Ending scores what you have
          and closes the sitting; leaving keeps saved work for your return; a run is
          resumed rather than redrawn. */}
      <div className="mb-3">
        <BackLink fallbackHref="/practice" fallbackLabel="Back to Practice" />
      </div>

      <AssessmentRun
        key={picked.roleId}
        roleId={picked.roleId}
        roleTitle={picked.roleTitle}
        backHref="/practice"
        signedOut={!session}
      />
    </main>
  );
}
