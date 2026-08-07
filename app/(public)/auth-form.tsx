"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const COPY = {
  login: {
    title: "Welcome back",
    sub: "Log in to continue your journey.",
    cta: "Log in",
    footer: "New to Ascend?",
    footerLink: { label: "Create an account", href: "/signup" },
  },
  signup: {
    title: "Create your account",
    sub: "One account. One career record. Every module.",
    cta: "Sign up",
    footer: "Already have an account?",
    footerLink: { label: "Log in", href: "/login" },
  },
} as const;

// Shared by /login and /signup. Auth is the one Supabase interaction that
// lives in the frontend; everything else goes through the backend API.
export function AuthForm({ mode }: { mode: keyof typeof COPY }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function googleSignIn() {
    setBusy(true);
    setError(null);
    setNotice(null);
    // Redirects the whole tab to Google; Supabase brings the user back to the
    // site with a session, which the browser client picks up automatically.
    const { error: oauthError } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = supabaseBrowser();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setNotice(
          "Almost there — open the confirmation email we just sent, then log in.",
        );
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-brand-ink">
        {copy.title}
      </h1>
      <p className="mt-2 text-sm text-slate-500">{copy.sub}</p>

      <button
        type="button"
        onClick={() => void googleSignIn()}
        disabled={busy}
        className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg aria-hidden width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continue with Google
      </button>

      <div className="mt-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* method="post" is a pre-hydration safety net: if the form is somehow
          submitted before React attaches onSubmit, the browser must not put
          the password into the URL via a default GET submit. */}
      <form
        method="post"
        onSubmit={submit}
        className="mt-5 flex flex-col gap-4"
        noValidate
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[0.95rem] outline-none transition-colors focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/25"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </span>
          <input
            type="password"
            name="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[0.95rem] outline-none transition-colors focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/25"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl bg-teal-50 px-3.5 py-2.5 text-sm text-teal-800">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-xl bg-brand-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "One moment…" : copy.cta}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        {copy.footer}{" "}
        <Link
          href={copy.footerLink.href}
          className="font-semibold text-brand-violet-deep hover:underline"
        >
          {copy.footerLink.label}
        </Link>
      </p>
    </main>
  );
}
