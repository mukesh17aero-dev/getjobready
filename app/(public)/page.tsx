import { EntryCard } from "@/components/entry-card";
import { StatusStrip } from "@/components/status-strip";

// The six entry points from the Blueprint's Outcome Router (Screen 0).
// Each one already navigates; the destination modules arrive later.
const ENTRY_POINTS = [
  {
    title: "Build my resume",
    description: "Marketable, ATS-safe resume",
    href: "/resume",
  },
  {
    title: "Discover career options",
    description: "Role matches and career map",
    href: "/discover",
  },
  {
    title: "Check role readiness",
    description: "Proficiency report and gap plan",
    href: "/readiness",
  },
  {
    title: "Practise the role",
    description: "Simulation training missions",
    href: "/practice",
  },
  {
    title: "Prepare for interviews",
    description: "AI interview and feedback",
    href: "/interview",
  },
  {
    title: "Complete the full journey",
    description: "Resume to employer interview",
    href: "/journey",
    recommended: true,
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <section className="pt-14 pb-10 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Build a career you&apos;ll be{" "}
          <span className="text-violet-700">proud</span> of
        </h1>
        <p className="mx-auto mt-4 max-w-md text-slate-600">
          Discover what fits you. Practise real work. Build evidence employers
          can trust.
        </p>
      </section>

      <section aria-labelledby="entry-heading">
        <h2 id="entry-heading" className="text-lg font-semibold text-slate-900">
          What would help you today?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Each option creates a complete, usable output. One career record
          powers every module.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ENTRY_POINTS.map((entry, i) => (
            <EntryCard key={entry.href} index={i + 1} {...entry} />
          ))}
        </div>
      </section>

      <section aria-label="System status" className="mt-14 border-t border-slate-200 pt-6">
        <StatusStrip />
      </section>
    </main>
  );
}
