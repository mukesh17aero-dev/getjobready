import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employer portal" };

export default function EmployerPortalPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Shared passports
      </h1>
      <p className="mt-2 text-slate-600">
        No readiness passports have been shared with you.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          This is not a mistake
        </h2>
        <p className="mt-3 leading-relaxed text-slate-600">
          A passport appears here only when a student publishes one and shares it
          with you, and it disappears the moment they revoke it. No student has
          published one yet — the assessment and readiness work that produces them
          is still being built.
        </p>
      </div>
    </main>
  );
}
