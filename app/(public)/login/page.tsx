import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { AuthCard, OrDivider } from "@/components/auth-card";
import { Field } from "@/components/field";
import { FormBanner } from "@/components/form-banner";
import { GoogleButton } from "@/components/google-button";
import { getCurrentUser, homeRouteForRole, safeNextPath } from "@/modules/identity";
import { googleSignInAction } from "../../auth-actions";
import { signInAction } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const user = await getCurrentUser();
  if (user) redirect(homeRouteForRole(user.role));

  const safeNext = safeNextPath(next);

  return (
    <AuthCard
      activeTab="signin"
      title="Sign in"
      subtitle="Use the email address or username you registered with."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-indigo-700 hover:underline">
            Create a student account
          </Link>
        </>
      }
    >
      {error ? <FormBanner tone="error">{error}</FormBanner> : null}

      <GoogleButton action={googleSignInAction.bind(null, safeNext)} />

      <OrDivider />

      <ActionForm
        action={signInAction}
        submitLabel="Sign in"
        pendingLabel="Signing you in…"
      >
        {safeNext ? <input type="hidden" name="next" value={safeNext} /> : null}

        <Field
          label="Email or username"
          name="identifier"
          autoComplete="username"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          action={
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-700 hover:underline"
            >
              Forgot password?
            </Link>
          }
        />
      </ActionForm>
    </AuthCard>
  );
}
