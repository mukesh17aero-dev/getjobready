"use client";

import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import type { AuthMode } from "@/components/auth-form";

// Opens the auth dialog for /welcome?auth=login|signup.
//
// It used to live inside LandingCtas, which was fine while every audience's
// page ended in that button. It no longer does - an employer's page ends in a
// link to /for/employers - so the handler moved out here and is mounted once
// by the landing itself. A deep link from an email has to work whichever tab
// the URL happens to carry.
export function AuthDeepLink() {
  const [mode, setMode] = useState<AuthMode | null>(null);

  // The ?next= param stays in the URL, where the form's nextPath() reads it.
  useEffect(() => {
    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth !== "login" && auth !== "signup") return;
    const id = window.setTimeout(() => setMode(auth), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!mode) return null;
  return (
    <AuthModal
      mode={mode}
      onClose={() => setMode(null)}
      onSwitchMode={setMode}
    />
  );
}
