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

export default async function JourneyLandingPage() {
  const session = await getServerSession();
  const state = session ? await getJourneyState(session.access_token) : null;
  const travelled = state ? journeyPercent(stages(state)) : null;

  return (
    <FeatureLanding
      category={JOURNEY}
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
    />
  );
}
