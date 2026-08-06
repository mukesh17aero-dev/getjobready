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

      {/* method="post" is a pre-hydration safety net: if the form is somehow
          submitted before React attaches onSubmit, the browser must not put
          the password into the URL via a default GET submit. */}
      <form
        method="post"
        onSubmit={submit}
        className="mt-8 flex flex-col gap-4"
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
