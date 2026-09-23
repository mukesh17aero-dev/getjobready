"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeatureLandingBody } from "@/features/welcome";
import { DISCOVER } from "@/features/welcome";
import { DiscoveryFlow } from "./discovery-flow";
import type { DiscoveryState } from "@/lib/api";

// Discovery has one address. What used to be a separate /discover/start page
// is now the same page in its second state: the walkthrough panel first, then
// the tool, with no navigation between them. Nobody arriving at Discovery
// should have to pass through a URL that only exists to say "not yet".
//
// The one thing that does change the address is a role. A role is somewhere
// you can be sent - a link worth passing to somebody - so it gets ?role=, and
// arriving on one opens straight onto it with no panel in the way.

export function DiscoverEntry({
  initial,
  signedOut,
  targetRole,
  initialRole,
}: {
  initial: DiscoveryState | null;
  signedOut: boolean;
  targetRole: string | null;
  initialRole: string | null;
}) {
  const router = useRouter();
  // Open on the approved Discovery workspace.
  const [started, setStarted] = useState(true);

  if (started) {
    return (
      <DiscoveryFlow
        initial={initial}
        signedOut={signedOut}
        initialRole={initialRole}
        onLeave={() => {
          // Out of Discovery altogether. Back used to mean the walkthrough
          // panel, which read as "Back to Discover" while standing in
          // Discover - a door leading to the room you are already in.
          router.push("/");
        }}
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <FeatureLandingBody
        category={DISCOVER}
        targetRole={targetRole}
        onOpen={() => {
          setStarted(true);
          window.scrollTo({ top: 0 });
        }}
      />
    </main>
  );
}
