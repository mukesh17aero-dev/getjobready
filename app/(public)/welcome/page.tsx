import { getServerSession } from "@/lib/supabase-server";
import { Landing } from "@/components/landing";

// The front door, reachable whether or not someone is signed in.
//
// "/" belongs to the person: signed in it is their journey, not a pitch. The
// wordmark points here instead, so there is always a way back to what the
// product is — for a founder showing it to someone, and for a signed-in student
// who wants to see the employer half.

export const metadata = { title: "Ascend — build a professional career" };
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await getServerSession();
  return (
    <main className="bg-brand-panel">
      <Landing signedIn={Boolean(session)} />
    </main>
  );
}
