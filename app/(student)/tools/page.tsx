import { EntryCard } from "@/components/entry-card";

export const metadata = { title: "Career tools" };

// The tools hub behind the teal door: standalone tools only, each with a real
// destination. A tool appears here once its module exists as a route.
export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Focused career tools
      </h1>
      <p className="mt-3 text-slate-600">
        Each tool delivers a complete, standalone output — no full journey
        required.
      </p>
      <div className="mt-7 grid gap-3">
        <EntryCard
          index={1}
          title="Resume Studio"
          description="A marketable, ATS-safe resume in Word and PDF"
          href="/resume"
        />
        <EntryCard
          index={2}
          title="AI Interview Coach"
          description="Role-specific practice with feedback and a story bank"
          href="/interview"
        />
      </div>
    </main>
  );
}
