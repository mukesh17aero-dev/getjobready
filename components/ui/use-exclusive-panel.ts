"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { exclusivePanel } from "@/lib/exclusive-panel";

export function useExclusivePanel(owner: string) {
  const active = useSyncExternalStore(exclusivePanel.subscribe, exclusivePanel.getSnapshot, exclusivePanel.getServerSnapshot);
  const activate = useCallback(() => exclusivePanel.activate(owner), [owner]);
  const dismiss = useCallback(() => exclusivePanel.dismiss(owner), [owner]);
  useEffect(() => dismiss, [dismiss]);
  return { open: active === owner, activate, dismiss };
}
