import { simulationRequest, PracticeLanding, type CourseSummary } from "@/features/simulation";
import { getServerSession } from "@/lib/supabase-server";
import { getJourneyState, listAssessmentRuns } from "@/lib/api";
import { situationsAttempted } from "@/features/assessment";

export const metadata = { title: "Practice" };
export const dynamic = "force-dynamic";

export default async function PracticeLandingPage() {
  const session = await getServerSession();
  const [state, courses, runs] = session ? await Promise.all([
    getJourneyState(session.access_token),
    simulationRequest<CourseSummary[]>("", undefined, session.access_token).catch(() => null),
    listAssessmentRuns(session.access_token),
  ]) : [null, null, null];
  const role = state?.progress?.role;
  const course = courses?.find(item => item.roleId === role?.id) ?? null;
  const last = role ? runs?.runs.find(item => item.roleId === role.id && item.readiness !== null) : null;
  return <PracticeLanding role={role?.title ?? null} roleId={role?.id ?? null}
    course={course} available={Boolean(course || (role && state?.practiceRoles?.includes(role.id)))}
    unavailable={Boolean(session && (!state || courses === null))}
    assessment={last && last.readiness !== null ? {score:last.readiness,title:last.roleTitle,basis:situationsAttempted(last.scenesAttempted,last.scenesInSitting),confidence:last.confidence ?? "Not recorded",date:new Date(last.finishedAt).toLocaleDateString("en-GB",{timeZone:"UTC"})} : null} />;
}
