"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkError = params.get("error");
    if (linkError) {
      setStatus("error");
      setErrorMessage(linkError);
    }
  }, []);

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
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
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("idle");
    setStep("code");
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("working");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    // The browser client just set the session cookie. Create the
    // student's profile row on first login, then hand off to the server
    // with a hard navigation so /dashboard sees the fresh session.
    await fetch("/api/auth/onboard", { method: "POST" });
    window.location.href = "/dashboard";
  }

  if (step === "code") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-semibold">Enter your code</h1>
        <p className="max-w-sm text-center text-sm text-gray-600">
          We sent a code and a login link to <strong>{email}</strong>. Enter
          the code below, or click the link in the same email.
        </p>
        <form
          onSubmit={handleVerifyCode}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <label htmlFor="code" className="text-sm font-medium">
            Login code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="rounded border border-gray-300 px-3 py-2 tracking-widest"
          />
          <button
            type="submit"
            disabled={status === "working"}
            className="rounded bg-purple-700 px-4 py-2 text-white disabled:opacity-50"
          >
            {status === "working" ? "Verifying..." : "Verify and log in"}
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Log in to GetJobReady</h1>
      <form
        onSubmit={handleSendCode}
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
          {status === "working" ? "Sending..." : "Send login code"}
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
