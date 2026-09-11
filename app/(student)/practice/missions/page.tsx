import { getServerSession } from "@/lib/supabase-server";
import { getJourneyState } from "@/lib/api";
import { ComingSoon } from "@/components/coming-soon";
import { NeedsRole } from "@/components/needs-role";

// Simulation missions. Not built yet - and gated anyway.
//
// The gate is not decoration on an unbuilt page: what somebody is told here
// is what missions WILL do for the job they are aiming at, and without a job
// that sentence is about nothing. This page could be opened directly and
// showed its placeholder to anyone, while the readiness assessment next door
// asked for a role first - the same rule applied in one place out of three.

export const metadata = { title: "Role missions" };
export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const session = await getServerSession();
  const state = session ? await getJourneyState(session.access_token) : null;
  const role = state?.progress?.role ?? null;

  if (!role) {
    return (
      <NeedsRole
        what="Simulation missions put you back into the work of one job."
        because="Which job decides which situations you get and what they are scored against."
      />
    );
  }

  return (
    <ComingSoon
      stage="Practice · Simulation"
      title="Role missions"
      delivers={`Realistic missions for ${role.title}, with feedback and retries. Repeated, verified actions become your Role Proficiency Score - which is a different thing from a readiness score: proficiency needs evidence across several attempts, not one sitting.`}
      backHref={"/practice"}
      backLabel={"Back to Practice"}
    />
  );
}
