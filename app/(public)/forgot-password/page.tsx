import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/field";
import { forgotPasswordAction } from "./actions";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link href="/login" className="font-medium text-indigo-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ActionForm
        action={forgotPasswordAction}
        submitLabel="Email me a reset link"
        pendingLabel="Sending…"
      >
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          hint="Use the address you registered with — the link can only go there."
        />
      </ActionForm>
    </AuthCard>
  );
}
