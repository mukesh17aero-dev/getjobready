import { EntryCard } from "@/components/entry-card";
import { BackLink } from "@/components/back-link";
import { RememberHub } from "@/components/remember-hub";

export const metadata = { title: "Practice" };

// Practice is a destination hub (Blueprint §19): the three ways to build and
// prove role capability live under it. Each item shows its state once the
// modules ship; today they are honest placeholders.
export default function PracticePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <RememberHub path="/practice" />
      <BackLink />
      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-brand-violet-deep">
        Practice
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        Build and prove role capability
      </h1>
      <p className="mt-3 text-slate-600">
        Measure where you stand, practise the real work, get interview-ready.
      </p>
      <div className="mt-7 grid gap-3">
        <EntryCard
          index={1}
          title="Check role readiness"
          description="10–15 min · proficiency report with strengths, gaps and a plan"
          href="/readiness"
        />
        <EntryCard
          index={2}
          title="Role missions"
          description="Realistic simulation missions with feedback and a verified score"
          href="/practice/missions"
        />
        <EntryCard
          index={3}
          title="Interview practice"
          description="Role-specific AI interview with feedback and a story bank"
          href="/interview"
        />
      </div>
    </main>
  );
}
