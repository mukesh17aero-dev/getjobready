import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/field";
import { registerEmployerAction } from "./actions";

export const metadata: Metadata = { title: "Register employer" };

export default function RegisterEmployerPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Register an employer
      </h1>
      <p className="mt-2 leading-relaxed text-slate-600">
        Creates the account and emails an invitation. They choose their own
        password from the link — you never set one for them, and never need to
        know it.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <ActionForm
          action={registerEmployerAction}
          submitLabel="Send invitation"
          pendingLabel="Sending…"
        >
          <Field label="Contact name" name="fullName" autoComplete="off" />
          <Field
            label="Work email"
            name="email"
            type="email"
            autoComplete="off"
            hint="The invitation goes here, so it must be an address they can open."
          />
        </ActionForm>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          What they will see
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          An employer signs in to a portal listing the readiness passports
          students have shared with them. No student has published one yet, so it
          will be empty until the passport work ships. The account, the
          invitation and the sign-in all work today.
        </p>
      </div>
    </main>
  );
}
