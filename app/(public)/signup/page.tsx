import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { AuthCard, OrDivider } from "@/components/auth-card";
import { Field } from "@/components/field";
import { GoogleButton } from "@/components/google-button";
import { getCurrentUser, homeRouteForRole } from "@/modules/identity";
import { googleSignInAction } from "../../auth-actions";
import { signUpAction } from "./actions";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeRouteForRole(user.role));

  return (
    <AuthCard
      activeTab="signup"
      title="Create your account"
      subtitle="Student accounts only. Admin and employer access is set up for you by your programme team."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-indigo-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton action={googleSignInAction.bind(null, null)} label="Sign up with Google" />

      <OrDivider />

      <ActionForm
        action={signUpAction}
        submitLabel="Create account"
        pendingLabel="Creating your account…"
      >
        <Field label="Full name" name="fullName" autoComplete="name" />
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters. Length matters more than symbols."
        />
      </ActionForm>
    </AuthCard>
  );
}
