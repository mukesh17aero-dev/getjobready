"use client";

// The wrap-up screen after a conversation concludes.

import { RoleplaySummary, type RoleplaySummaryView } from "@/features/roleplay";

export function RoleplayFeedback({
  summary,
  scenarioTitle,
  onRetry,
}: {
  summary: RoleplaySummaryView;
  scenarioTitle: string;
  onRetry: () => void;
}) {
  return <RoleplaySummary summary={summary} scenarioTitle={scenarioTitle} onRetry={onRetry} />;
}
