import type { Metadata } from "next";
import { getCurrentUser } from "@/modules/identity";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  // The layout has already established that this is a signed-in student; this
  // is only for the greeting.
  const user = await getCurrentUser();
  const firstName = user?.fullName?.split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {firstName ? `Welcome, ${firstName}` : "Welcome"}
      </h1>
      <p className="mt-2 text-slate-600">
        Your account is set up. There is nothing to practise yet.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          What happens next
        </h2>
        <p className="mt-3 leading-relaxed text-slate-600">
          Once your programme team publishes a target role, you&rsquo;ll see the
          skills it needs, the assessments that build evidence for each of them,
          and one clear thing to do next. Your readiness passport is generated
          from that evidence — so it starts empty, on purpose.
        </p>
      </div>
    </main>
  );
}
