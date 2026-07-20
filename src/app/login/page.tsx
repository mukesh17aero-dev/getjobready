"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkError = params.get("error");
    if (linkError) {
      // One-time sync from the URL (a browser-only API) into state on
      // mount — must run in an effect to stay SSR-safe, since `window`
      // doesn't exist during server rendering.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setErrorMessage(linkError);
    }
  }, []);

  async function handleSendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("working");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Phone OTP swap: replace this with
      // supabase.auth.signInWithOtp({ phone }) and collect a phone number
      // instead — Supabase's phone auth API is a near drop-in replacement.
      // Requires an SMS provider (e.g. Twilio) configured in Supabase →
      // Authentication → Providers first.
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-sm text-gray-600">
          We sent a login link to <strong>{email}</strong>. Open it in this
          same browser to sign in — links opened in a different browser or
          app won&apos;t work.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Log in to GetJobReady</h1>
      <form
        onSubmit={handleSendLink}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={status === "working"}
          className="rounded bg-purple-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {status === "working" ? "Sending..." : "Send login link"}
        </button>
        {status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </form>
    </main>
  );
}
