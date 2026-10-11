import { getServerSession } from "@/lib/supabase-server";
import { getJourneyState } from "@/lib/api";
import { journeyPercent, stages } from "@/features/journey";
import { FeatureLanding } from "@/features/welcome";
import { JOURNEY } from "@/features/welcome";

// The whole package: seven stages in the order they are meant to be walked,
// drawn as a line at the top so the shape is visible before any of the detail.
//
// Five of the seven are open. The line shows which, and says so in words
// underneath rather than leaving somebody to work it out by tapping.

export const metadata = { title: "The whole journey" };
export const dynamic = "force-dynamic";

// The journey's own stages, named as the cards on this page name them.
// Profile has no card here; choosing a direction happens inside Discovery.
const CARD_FOR_STAGE: Record<string, string> = {
  discovery: "discovery",
  direction: "discovery",
  readiness: "assessment",
  missions: "simulation",
  interview: "journey-interview",
  passport: "passport",
};

export default async function JourneyLandingPage() {
  const session = await getServerSession();
  const state = session ? await getJourneyState(session.access_token) : null;
  const list = state ? stages(state) : [];
  const travelled = state ? journeyPercent(list) : null;
  const live = list.find((stage) => stage.state === "live");
  const nextId = live ? (CARD_FOR_STAGE[live.id] ?? null) : null;
  const doneIds = list
    .filter((stage) => stage.state === "done" && stage.id !== "direction")
    .map((stage) => CARD_FOR_STAGE[stage.id])
    .filter((id): id is string => Boolean(id) && id !== nextId);

  return (
    <FeatureLanding
      category={{...JOURNEY,features:JOURNEY.features.map(feature=>feature.id==='simulation'&&(!state?.progress?.role||!state.practiceRoles?.includes(state.progress.role.id))?{...feature,status:'building' as const,href:null,blurb:state?.progress?.role?`Practice for ${state.progress.role.title} is not published yet.`:'Choose a role to check practice availability.',expect:'Published practice is role-specific. Other roles can be explored separately from the Practice hub.'}:feature)}}
      targetRole={state?.progress?.role?.title ?? null}
      stat={
        travelled != null
          ? {
              label: "Journey travelled",
              value: `${travelled}%`,
              note: "Measured across the stages that exist today.",
            }
          : null
      }
      journeyLine
      nextId={nextId}
      doneIds={doneIds}
    />
  );
}
