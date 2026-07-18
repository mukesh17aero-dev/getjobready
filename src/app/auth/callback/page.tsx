"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

function redirectToLoginWithError(message: string) {
  window.location.href = `/login?error=${encodeURIComponent(message)}`;
}

// Handles BOTH possible magic-link redirect shapes from Supabase:
// - PKCE: redirect_to?code=... (exchanged below via exchangeCodeForSession)
// - Implicit: redirect_to#access_token=... (never reaches any server — the
//   browser client reads window.location.hash automatically on
//   initialization, since detectSessionInUrl defaults to true). A plain
//   Route Handler (route.ts) can only ever see the first case, since URL
//   fragments are never sent in the HTTP request — that gap is why this
//   is a client page instead.
export default function AuthCallbackPage() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );

      const supabaseError =
        searchParams.get("error_description") ??
        searchParams.get("error") ??
        hashParams.get("error_description") ??
        hashParams.get("error");

      if (supabaseError) {
        redirectToLoginWithError(supabaseError);
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          redirectToLoginWithError(error.message);
          return;
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          redirectToLoginWithError(
            "That login link didn't contain a valid session. Try the code from the same email instead."
          );
          return;
        }
      }

      if (cancelled) return;

      // Session cookie is now set by the browser client (readable by the
      // server, same as the one-time-code path). Create the student's
      // profile row on first login, then hand off with a hard navigation.
      await fetch("/api/auth/onboard", { method: "POST" });
      window.location.href = "/dashboard";
    }

    run().catch((err) => {
      if (!cancelled) {
        redirectToLoginWithError(
          err instanceof Error ? err.message : "Login failed. Please try again."
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-gray-600">Completing login…</p>
    </main>
  );
}
