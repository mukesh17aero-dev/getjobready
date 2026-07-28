import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/field";
import { FormBanner } from "@/components/form-banner";
import { getCurrentUser } from "@/modules/identity";
import { resetPasswordAction } from "./actions";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // Arriving here means the emailed link was exchanged for a session at
  // /auth/callback. No session means the link expired or was already used —
  // say so plainly rather than showing a form that cannot work.
  const user = await getCurrentUser();

  return (
    <AuthCard
      title="Choose a new password"
      subtitle={user ? `Signed in as ${user.email}.` : undefined}
      footer={
        <Link href="/login" className="font-medium text-indigo-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {user ? (
        <ActionForm
          action={resetPasswordAction}
          submitLabel="Save new password"
          pendingLabel="Saving…"
        >
          <Field
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters."
          />
          <Field
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
          />
        </ActionForm>
      ) : (
        <FormBanner tone="error">
          This reset link has expired or was already used. Request a new one from
          the “Forgot password?” link on the sign-in page.
        </FormBanner>
      )}
    </AuthCard>
  );
}
