import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { getJourneyState } from "@/lib/api";
import { StartRouter } from "./start-router";

export const metadata = { title: "Start with your goal" };

// Server Component read (Architecture doc §4.1): the session comes from the
// cookie, the journey state is fetched server-side in one round trip, and
// the client component below only handles interaction.
export const dynamic = "force-dynamic";

export default async function StartPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/start");
  const state = await getJourneyState(session.access_token);
  return <StartRouter initialState={state} />;
}
