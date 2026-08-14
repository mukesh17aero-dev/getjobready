import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase-server";
import { getDiscovery } from "@/lib/api";
import { DiscoveryFlow } from "./discovery-flow";

export const metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

// Server Component read: content + the user's attempt arrive server-rendered;
// the client component runs the 3–5 minute exploration.
export default async function DiscoverPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/discover");
  const state = await getDiscovery(session.access_token);
  return <DiscoveryFlow initial={state} />;
}
