"use client";

import { useEffect } from "react";
import { rememberHub } from "@/lib/hub-memory";

// Dropped into a hub page so module pages can offer an accurate way back.
// Writing to session storage is an external-system update, which is exactly
// what an effect is for.
export function RememberHub({ path }: { path: string }) {
  useEffect(() => {
    rememberHub(path);
  }, [path]);
  return null;
}
