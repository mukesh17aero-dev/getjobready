"use client";

// The signed-in Discovery screen, without a login.
//
// /discover fetches its content with a token, so this route mounts the real
// DiscoveryFlow against the shared preview fixture instead. What you see is
// the shipped component: the industry picker that Discovery now opens on, the
// roles behind each industry, the discovery assistant on every role, and the
// walk-through. The questions are still there, offered underneath.
//
// The survey itself cannot run here - answering calls the backend, which needs
// a session. Everything up to that point is real.

import { DiscoveryFlow } from "@/app/(student)/discover/discovery-flow";
import type { DiscoveryState } from "@/lib/api";
import { CONTENT, ROLES } from "../preview-role-tour/fixture";

const STATE: DiscoveryState = {
  content: {
    version: "preview",
    worlds: CONTENT.worlds,
    catalogue: CONTENT.catalogue,
    roles: ROLES,
  },
  attempt: null,
};

export default function PreviewDiscover() {
  return <DiscoveryFlow onLeave={() => {}} initial={STATE} />;
}
