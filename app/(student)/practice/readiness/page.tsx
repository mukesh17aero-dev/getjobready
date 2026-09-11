import { getServerSession } from "@/lib/supabase-server";
import {
  getJourneyState,
  getPreviewAssessmentRoles,
  listAssessableRoles,
  type AssessableRole,
} from "@/lib/api";
import { AssessmentRun } from "@/components/assessment-run";
import { BackLink } from "@/components/back-link";
import { NeedsRole } from "@/components/needs-role";
import { ReadinessStart } from "./start-screen";

// Sitting the role readiness assessment.
//
// The role may be named in the URL, but only from the list this person chose
// in Discovery - and the API checks that list again rather than trusting this
// page, because a body field that decides what somebody's evidence is about
// cannot be verified on the client. A role nobody chose produces evidence
// about nothing.

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
  // The URL only wins if it names a role they actually chose. Otherwise the
  // role on their record stands, and if that is missing, the first they chose.
  const picked =
    roles.find((r) => r.roleId === asked) ??
    roles.find((r) => r.roleId === current?.id) ??
    roles[0] ??
    null;

  // Nothing chosen means nothing to assess. Discovery is where that is
  // decided, so send them there rather than showing an empty sitting.
  // The same gate as everywhere else under Practice, from the same component
  // rather than written out again here - which is how it came to be enforced
  // on this page and nowhere else.
  if (!picked) {
    return (
      <NeedsRole
        what="The readiness assessment is 12 questions about one job’s actual work, with no time limit."
        because="It needs to know which job before it can put you in it."
      />
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
          <ReadinessStart roles={roles} />
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
