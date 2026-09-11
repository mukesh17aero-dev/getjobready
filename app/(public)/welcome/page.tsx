import { NetworkWelcome } from "@/components/network-welcome";
import type { Audience } from "@/components/audience-hero";

// The front door, reachable whether or not someone is signed in.
//
// "/" belongs to the person: signed in it is their journey, not a pitch. The
// wordmark points here instead, so there is always a way back to what the
// product is — for a founder showing it to someone, and for a signed-in student
// who wants to see the employer half.
//
// ?for=college and ?for=employer open the first sheet on that audience. That
// is the link to put in a deck or an intro email, so a placement officer lands
// on their own page rather than hunting for a tab.

export const metadata = { title: "Ascend — talent fulfillment network" };
export const dynamic = "force-dynamic";

const asAudience = (v: string | undefined): Audience =>
  v === "college" || v === "employer" ? v : "student";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>;
}) {
  const { for: forParam } = await searchParams;

  return (
    <NetworkWelcome audience={asAudience(forParam)} />
  );
}
