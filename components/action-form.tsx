"use client";

import { useActionState } from "react";
import { FormBanner } from "./form-banner";

/**
 * What every auth Server Action returns to the form. A successful action
 * normally redirects instead of returning, so `success` is only for the flows
 * that stay on the page — "check your inbox", for instance.
 */
export type FormState = { error?: string; success?: string };

export const EMPTY_FORM_STATE: FormState = {};

/**
 * A form wired to a Server Action, with the banner and the pending state
 * handled once.
 *
 * The action arrives as a prop rather than an import: this file lives in
 * `components/`, which may not import from `app/`, and Server Actions live
 * beside the routes that use them.
 */
export function ActionForm({
  action,
  submitLabel,
  pendingLabel,
  children,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <FormBanner tone="error">{state.error}</FormBanner> : null}
      {state.success ? (
        <FormBanner tone="success">{state.success}</FormBanner>
      ) : null}

      {children}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
