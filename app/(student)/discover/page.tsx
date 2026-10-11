import { getServerSession } from "@/lib/supabase-server";
import { getDiscovery, getJourneyState } from "@/lib/api";
import { exploreIntro } from "@/features/discovery";
import { DiscoverEntry } from "./discover-entry";

// One address for Discovery. The page reads the catalogue and the person's own
// attempt, then hands both to the entry component, which decides whether to
// show the walkthrough or the tool.
//
// Signed out the catalogue still loads, but Explore roles shows one sample.
// The other cards and their detail pages ask for a free account.

export const metadata = { title: "Explore" };
export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; profileType?: string }>;
}) {
  const [session, { role, profileType }] = await Promise.all([
    getServerSession(),
    searchParams,
  ]);
  const [state, journey] = await Promise.all([
    getDiscovery(session?.access_token ?? null),
    session ? getJourneyState(session.access_token) : null,
  ]);

  return (
    <DiscoverEntry
      intro={exploreIntro(profileType, journey?.progress?.track)}
      initial={state}
      signedOut={!session}
      targetRole={journey?.progress?.role?.title ?? null}
      initialRole={role ?? null}
    />
  );
}
